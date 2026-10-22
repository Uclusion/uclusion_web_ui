"""Shared admission and real HTTP streaming, without accounts or providers."""
import concurrent.futures
import http.client
import http.server
import json
import pathlib
import socket
import sqlite3
import struct
import sys
import tempfile
import threading
import time
import unittest
from unittest import mock

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
import uclusionTokenBudget as budget


def usage(incoming=10, outgoing=4):
    return {'input_tokens': incoming, 'output_tokens': outgoing,
            'total_tokens': incoming + outgoing,
            'input_tokens_details': {'cached_tokens': min(incoming, 5)},
            'output_tokens_details': {'reasoning_tokens': min(outgoing, 2)}}


class LedgerTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = pathlib.Path(self.directory.name) / 'ledger.sqlite3'

    def ledger(self, incoming=100, outgoing=100, **kwargs):
        return budget.BudgetLedger(self.path, 'same-run', incoming, outgoing, create=True, **kwargs)

    def reserve(self, ledger, incoming=50, outgoing=20):
        return ledger.reserve(incoming, outgoing, '/responses', 'gpt-6.1-sol')

    def test_input_and_output_refuse_independently_before_admission(self):
        for incoming, outgoing, expected in ((49, 100, 'input'), (100, 19, 'output')):
            with self.subTest(expected=expected), tempfile.TemporaryDirectory() as directory:
                ledger = budget.BudgetLedger(pathlib.Path(directory) / 'state', 'run', incoming, outgoing, create=True)
                with self.assertRaisesRegex(budget.BudgetError, expected):
                    self.reserve(ledger)
                self.assertEqual(0, ledger.snapshot()['generation_attempts'])
                self.assertIn(expected, ledger.snapshot()['halt_reason'])

    def test_parallel_participants_share_both_reservations(self):
        ledger = self.ledger(100, 40)
        start = threading.Barrier(3)
        def reserve():
            start.wait()
            try:
                return self.reserve(ledger, 60, 20)
            except budget.BudgetError:
                return None
        with concurrent.futures.ThreadPoolExecutor(2) as pool:
            results = [pool.submit(reserve) for _ in range(2)]
            start.wait()
        self.assertEqual(1, sum(result.result() is not None for result in results))
        self.assertEqual(60, ledger.snapshot()['reserved_input_tokens'])
        self.assertIsNotNone(ledger.snapshot()['halt_reason'])

    def test_canonical_cache_and_reasoning_counted_once(self):
        self.assertEqual((100, 20), budget.normalize_usage('codex', usage(100, 20))[:2])
        raw = {'input_tokens': 10, 'cache_creation_input_tokens': 20,
               'cache_read_input_tokens': 30, 'output_tokens': 40,
               'cache_creation': {'ephemeral_5m_input_tokens': 5, 'ephemeral_1h_input_tokens': 15}}
        self.assertEqual((60, 40), budget.normalize_usage('claude', raw)[:2])

    def test_compaction_iterations_include_each_generation_once(self):
        raw = {'input_tokens': 10, 'output_tokens': 4, 'cache_read_input_tokens': 3,
               'iterations': [{'type': 'compaction', 'input_tokens': 50, 'output_tokens': 20},
                              {'type': 'message', 'input_tokens': 10, 'cache_read_input_tokens': 3, 'output_tokens': 4}]}
        self.assertEqual((63, 24), budget.normalize_usage('claude', raw)[:2])
        self.assertEqual(2, len(budget.normalize_usage('claude', raw)[2]['iterations']))

    def test_settlement_is_exactly_once_and_preserves_raw_usage_after_halt(self):
        ledger = self.ledger()
        identity = self.reserve(ledger)
        ledger.halt('another participant stopped')
        ledger.settle(identity, 'codex', usage())
        ledger.settle(identity, 'codex', usage())
        state = ledger.snapshot()
        self.assertEqual((10, 4, 0, 0), tuple(state[key] for key in (
            'measured_input_tokens', 'measured_output_tokens', 'reserved_input_tokens', 'reserved_output_tokens')))
        self.assertEqual('another participant stopped', state['halt_reason'])
        self.assertEqual(0, ledger.requests()[0]['delivered'])
        self.assertEqual(5, json.loads(ledger.requests()[0]['usage'])['input_tokens_details']['cached_tokens'])

    def test_uncertain_completion_retains_full_liability_across_restart(self):
        ledger = self.ledger()
        identity = self.reserve(ledger)
        ledger.uncertain(identity)
        reopened = budget.BudgetLedger(self.path, 'same-run', 100, 100)
        self.assertEqual(50, reopened.snapshot()['reserved_input_tokens'])
        self.assertIsNone(reopened.snapshot()['halt_reason'])
        self.reserve(reopened, 1, 1)
        reopened.settle(identity, 'codex', usage())
        self.assertEqual(10, reopened.snapshot()['measured_input_tokens'])

    def test_legacy_rows_gain_unknown_provenance_without_reclassifying_usage(self):
        ledger = self.ledger()
        identity = self.reserve(ledger)
        ledger.settle(identity, 'codex', usage(), 'response_legacy')
        before = ledger.requests()[0]
        with sqlite3.connect(self.path) as db:
            columns = ','.join(row[1] for row in db.execute('PRAGMA table_info(requests)')
                               if row[1] != 'root_role')
            db.execute('CREATE TABLE legacy_requests AS SELECT ' + columns + ' FROM requests')
            db.execute('DROP TABLE requests')
            db.execute('ALTER TABLE legacy_requests RENAME TO requests')
        reopened = budget.BudgetLedger(self.path, 'same-run', 100, 100)
        self.assertEqual(before, reopened.requests()[0])
        self.assertEqual('unknown', reopened.requests()[0]['root_role'])
        self.assertEqual((10, 4, 1), tuple(reopened.snapshot()[key] for key in (
            'measured_input_tokens', 'measured_output_tokens', 'generation_attempts')))

    def test_unfinished_restart_and_missing_corrupt_or_mismatched_state_refuse(self):
        ledger = self.ledger()
        self.reserve(ledger)
        reopened = budget.BudgetLedger(self.path, 'same-run', 100, 100)
        self.assertIsNone(reopened.snapshot()['halt_reason'])
        self.assertEqual(50, reopened.snapshot()['reserved_input_tokens'])
        self.reserve(reopened, 1, 1)
        for path, identity, incoming in ((self.path, 'other-run', 100), (self.path, 'same-run', 101),
                                         (self.path.parent / 'missing', 'same-run', 100)):
            with self.subTest(path=path, identity=identity, incoming=incoming), self.assertRaises(budget.BudgetError):
                budget.BudgetLedger(path, identity, incoming, 100)
        corrupt = self.path.parent / 'corrupt'
        corrupt.write_bytes(b'not a database')
        with self.assertRaises(budget.BudgetError):
            budget.BudgetLedger(corrupt, 'same-run', 100, 100)

    def test_bound_violation_keeps_measurements_and_liability_and_invalidates_ceiling(self):
        ledger = self.ledger()
        identity = self.reserve(ledger, 5, 5)
        with self.assertRaises(budget.BudgetError):
            ledger.settle(identity, 'codex', usage(10, 4))
        state = ledger.snapshot()
        self.assertEqual((10, 5, False), (state['measured_input_tokens'], state['reserved_input_tokens'], state['ceiling_valid']))

    def test_uncertain_usage_and_competing_admission_preserve_full_bounds(self):
        ledger = self.ledger()
        identity = self.reserve(ledger)
        entered, release = threading.Event(), threading.Event()
        original = budget.normalize_usage
        def malformed(provider, raw):
            entered.set()
            release.wait(2)
            return original(provider, raw)
        with mock.patch.object(budget, 'normalize_usage', side_effect=malformed), concurrent.futures.ThreadPoolExecutor(2) as pool:
            first = pool.submit(ledger.settle, identity, 'codex', {})
            self.assertTrue(entered.wait(2))
            second = pool.submit(self.reserve, ledger, 1, 1)
            self.assertFalse(second.done())
            release.set()
            first.result(timeout=2)
            second.result(timeout=2)
        self.assertEqual(2, ledger.snapshot()['generation_attempts'])
        self.assertEqual((51, 21), tuple(ledger.snapshot()[key] for key in ('reserved_input_tokens', 'reserved_output_tokens')))
        self.assertIsNone(ledger.snapshot()['halt_reason'])

    def test_request_backstop_and_human_pause_do_not_refund_run(self):
        ledger = self.ledger(max_requests=1)
        identity = self.reserve(ledger)
        ledger.settle(identity, 'codex', usage())
        ledger.pause_active()
        self.assertTrue(ledger.snapshot()['admission_paused'])
        with self.assertRaises(budget.BudgetError):
            self.reserve(ledger, 1, 1)
        self.assertIsNone(ledger.snapshot()['halt_reason'])
        ledger.resume_active()
        with self.assertRaisesRegex(budget.BudgetError, 'backstop'):
            self.reserve(ledger, 1, 1)
        ledger.finish_active()
        active = ledger.snapshot()['active_seconds']
        time.sleep(.01)
        self.assertEqual(active, ledger.snapshot()['active_seconds'])

    def test_unknown_models_and_internal_loops_are_rejected_without_tool_filtering(self):
        body = {'model': 'gpt-6.1-sol', 'tools': [{'type': 'namespace', 'name': 'functions',
                'tools': [{'type': 'function', 'name': 'exec_command'}, {'type': 'custom', 'name': 'apply_patch'}]}]}
        original = json.dumps(body)
        self.assertEqual((1_050_000, 128_000), budget.request_bounds('codex', '/responses', body)[:2])
        self.assertEqual(original, json.dumps(body))
        for changes in ({'model': 'unknown'}, {'tools': [{'type': 'web_search'}]}, {'context_management': [{'type': 'compaction'}]}):
            with self.subTest(changes=changes), self.assertRaises(budget.BudgetError):
                budget.request_bounds('codex', '/responses', dict(body, **changes))


class GatewayTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.ledger = budget.BudgetLedger(pathlib.Path(self.directory.name) / 'ledger', 'http-run', 100, 100, create=True)
        self.seen = []
        self.release = threading.Event()
        self.addCleanup(self.release.set)
        owner = self
        class Provider(http.server.BaseHTTPRequestHandler):
            def log_message(self, *unused): pass
            def do_POST(self):
                raw = self.rfile.read(int(self.headers['Content-Length']))
                owner.seen.append((self.path, raw))
                self.send_response(200)
                self.send_header('Content-Type', 'text/event-stream')
                self.send_header('Connection', 'close')
                self.end_headers()
                self.wfile.write(b'data: {"type":"response.created"}\n\n')
                self.wfile.flush()
                owner.release.wait(2)
                value = {'type': 'response.completed', 'response': {'status': 'completed', 'usage': usage()}}
                self.wfile.write(('data: ' + json.dumps(value) + '\n\n').encode())
                self.wfile.flush()
        self.provider = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Provider)
        thread = threading.Thread(target=self.provider.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(self.provider.server_close)
        self.addCleanup(self.provider.shutdown)
        self.gateway = budget.BudgetGateway(self.ledger, 'codex', 'http://127.0.0.1:' + str(self.provider.server_port) + '/v1',
                                            model_bounds={'fake-model': (50, 20, 'local fixture')})
        self.url = self.gateway.start()
        self.addCleanup(self.gateway.close)

    def request(self, path='/responses', body=None, *, url=None):
        parsed = budget.urllib.parse.urlsplit(url or self.url)
        connection = http.client.HTTPConnection(parsed.hostname, parsed.port, timeout=3)
        self.addCleanup(connection.close)
        connection.request('POST', parsed.path + path, json.dumps(body or {'model': 'fake-model'}), {'Content-Type': 'application/json'})
        return connection.getresponse()

    def test_owner_and_evaluator_overlap_in_one_ledger(self):
        responses = [self.request(url=self.gateway.url_for_role(role))
                     for role in ('owner', 'evaluator')]
        self.assertEqual([200, 200], [response.status for response in responses])
        self.assertEqual((100, 40, 2), tuple(self.ledger.snapshot()[key] for key in (
            'reserved_input_tokens', 'reserved_output_tokens', 'generation_attempts')))
        self.assertEqual(['owner', 'evaluator'], [row['root_role'] for row in self.ledger.requests()])
        self.release.set()
        for response in responses:
            response.read()
        self.gateway.close()
        state = self.ledger.snapshot()
        self.assertEqual((20, 8, 0, 0, 2), tuple(state[key] for key in (
            'measured_input_tokens', 'measured_output_tokens', 'reserved_input_tokens',
            'reserved_output_tokens', 'generation_attempts')))
        self.assertEqual([1, 1], [row['delivered'] for row in self.ledger.requests()])

    def assert_roles_share_ceiling(self, bounds, axis):
        self.gateway.model_bounds = {'fake-model': (*bounds, 'local fixture')}
        owner = self.request(url=self.gateway.url_for_role('owner'))
        evaluator = self.request(url=self.gateway.url_for_role('evaluator'))
        self.assertEqual((200, 409), (owner.status, evaluator.status))
        evaluator.read()
        self.assertEqual(1, len(self.seen), 'refused role reached the provider')
        self.assertTrue(self.ledger.snapshot()['halt_reason'].startswith(axis + ' token ceiling'))
        self.assertEqual(['owner'], [row['root_role'] for row in self.ledger.requests()])
        self.release.set()
        owner.read()
        self.gateway.close()
        self.assertEqual(1, self.ledger.snapshot()['generation_attempts'])

    def test_root_roles_share_the_input_ceiling(self):
        self.assert_roles_share_ceiling((60, 20), 'input')

    def test_root_roles_share_the_output_ceiling(self):
        self.assert_roles_share_ceiling((50, 60), 'output')

    def test_legacy_and_unrecognized_role_routes_keep_unknown_provenance(self):
        self.release.set()
        unknown_url = self.url.replace(self.gateway.prefix, '/unrecognized' + self.gateway.prefix)
        for url in (self.url, unknown_url):
            response = self.request(url=url)
            self.assertEqual(200, response.status)
            response.read()
        self.gateway.close()
        self.assertEqual(['unknown', 'unknown'], [row['root_role'] for row in self.ledger.requests()])
        self.assertEqual(['/v1/responses', '/v1/responses'], [path for path, _raw in self.seen])
        self.assertEqual((20, 8, 2), tuple(self.ledger.snapshot()[key] for key in (
            'measured_input_tokens', 'measured_output_tokens', 'generation_attempts')))

    def test_inherited_root_alias_does_not_claim_native_participant_or_helper_identity(self):
        self.release.set()
        # These descendant identifiers travel in the native request. They are
        # not an authoritative provider-response/native-session/parent join.
        descendant = {'session_id': 'child_fixture', 'parent_session_id': 'root_fixture'}
        for native_metadata in ({}, descendant):
            response = self.request(url=self.gateway.url_for_role('evaluator'),
                                    body={'model': 'fake-model', 'client_metadata': native_metadata})
            self.assertEqual(200, response.status)
            response.read()
        self.gateway.close()
        for row in self.ledger.requests():
            self.assertEqual('evaluator', row['root_role'])
            self.assertIsNone(row['provider_request_id'])
            for field in ('participant_identity', 'helper_identity', 'request_purpose',
                          'session_id', 'parent_session_id'):
                self.assertNotIn(field, row)
        self.assertEqual(descendant, json.loads(self.seen[1][1])['client_metadata'])

    def test_root_roles_survive_run_summary_and_ledger_reopen(self):
        self.release.set()
        run_dir = pathlib.Path(self.directory.name) / 'summary-run'
        upstream = 'http://127.0.0.1:' + str(self.provider.server_port) + '/v1'
        # No native children are launched by this accounting fixture.
        with mock.patch.object(budget, 'OwnedProcesses'), mock.patch('builtins.print'):
            run = budget.RunBudget(run_dir, 'codex', 100, 100, upstream_base=upstream, create=True)
        self.addCleanup(lambda: run.close() if not run.monitor_stop.is_set() else None)
        run.gateway.model_bounds = {'fake-model': (50, 20, 'local fixture')}
        for role in ('owner', 'evaluator'):
            response = self.request(url=run.gateway.url_for_role(role))
            self.assertEqual(200, response.status)
            response.read()
        with mock.patch('builtins.print'):
            run.close()
        summary = json.loads((run_dir / 'token-budget-summary.json').read_text())
        reopened = budget.BudgetLedger(run_dir / 'token-budget.sqlite3', run_dir.name, 100, 100)
        self.assertEqual(summary['requests'], reopened.requests())
        self.assertEqual(['owner', 'evaluator'], [row['root_role'] for row in summary['requests']])
        self.assertEqual((20, 8, 0, 0, 2), tuple(summary[key] for key in (
            'measured_input_tokens', 'measured_output_tokens', 'reserved_input_tokens',
            'reserved_output_tokens', 'generation_attempts')))

    def test_downstream_disconnect_preserves_role_and_provider_usage(self):
        address = budget.urllib.parse.urlsplit(self.gateway.url_for_role('evaluator'))
        raw = b'{"model":"fake-model","stream":true}'
        client = socket.create_connection((address.hostname, address.port), timeout=3)
        self.addCleanup(client.close)
        client.sendall(('POST ' + address.path + '/responses HTTP/1.1\r\nHost: localhost\r\n'
                        'Content-Length: ' + str(len(raw)) + '\r\n\r\n').encode() + raw)
        received = b''
        while b'response.created' not in received:
            chunk = client.recv(65536)
            self.assertTrue(chunk, 'stream ended before the provider completion')
            received += chunk
        client.setsockopt(socket.SOL_SOCKET, socket.SO_LINGER, struct.pack('ii', 1, 0))
        client.close()
        self.release.set()
        self.gateway.close()
        row = self.ledger.requests()[0]
        self.assertEqual(('evaluator', 'settled', 0), (row['root_role'], row['status'], row['delivered']))
        self.assertEqual((10, 4, 0, 0, 1), tuple(self.ledger.snapshot()[key] for key in (
            'measured_input_tokens', 'measured_output_tokens', 'reserved_input_tokens',
            'reserved_output_tokens', 'generation_attempts')))
        self.assertEqual(1, len(self.seen))

    def test_live_events_arrive_before_completion_and_original_full_request_is_forwarded(self):
        body = {'model': 'fake-model', 'stream': True, 'reasoning': {'effort': 'medium'},
                'tools': [{'type': 'function', 'name': 'all_tools_remain'}]}
        response = self.request(body=body)
        self.assertEqual(200, response.status)
        self.assertEqual(b'data: {"type":"response.created"}\n', response.readline())
        self.assertFalse(self.release.is_set())
        self.assertEqual(body, json.loads(self.seen[0][1]))
        self.release.set()
        self.assertIn(b'response.completed', response.read())
        deadline = time.monotonic() + 2
        while self.ledger.snapshot()['reserved_input_tokens'] and time.monotonic() < deadline:
            time.sleep(.01)
        state = self.ledger.snapshot()
        self.assertEqual((10, 4), (state['measured_input_tokens'], state['measured_output_tokens']))
        self.assertEqual(1, self.ledger.requests()[0]['delivered'])
        self.assertGreaterEqual(self.ledger.requests()[0]['admission_ms'], 0)

    def test_uncovered_auxiliary_route_halts_without_forwarding(self):
        response = self.request('/unknown_generation')
        self.assertEqual(409, response.status)
        self.assertEqual([], self.seen)
        self.assertIn('uncovered', self.ledger.snapshot()['halt_reason'])

    def test_retries_reserve_fresh_attempts(self):
        self.release.set()
        for _ in range(2):
            response = self.request()
            self.assertEqual(200, response.status)
            response.read()
        self.assertEqual(2, self.ledger.snapshot()['generation_attempts'])
        self.assertEqual(2, len(self.seen))


if __name__ == '__main__':
    unittest.main()
