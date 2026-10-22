"""Native HTTP 429 handling preserves wire bytes, liability and fresh admission."""
import concurrent.futures
import gzip
import http.client
import http.server
import json
from pathlib import Path
import sys
import tempfile
import threading
import time
import unittest
import urllib.parse

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import uclusionTokenBudget as budget

ERROR = {'type': 'error', 'error': {'type': 'rate_limit_error', 'message': 'fixture rate limit'}}
USAGE = {'input_tokens': 10, 'cache_creation_input_tokens': 20,
         'cache_read_input_tokens': 30, 'output_tokens': 4}
COMPLETE = {'id': 'msg_complete', 'stop_reason': 'end_turn', 'usage': USAGE}


class Native429Tests(unittest.TestCase):
    def fixture(self, responses, *, caps=(1000, 1000), provider='claude'):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        ledger = budget.BudgetLedger(Path(directory.name) / 'ledger', 'native-429', *caps, create=True)
        seen = []
        lock = threading.Lock()
        class Provider(http.server.BaseHTTPRequestHandler):
            def log_message(self, *unused): pass
            def do_GET(self): self.do_POST()
            def do_POST(self):
                raw = self.rfile.read(int(self.headers.get('Content-Length', '0')))
                with lock:
                    item = responses[min(len(seen), len(responses) - 1)]
                    seen.append((self.path, raw, dict(self.headers)))
                status, body, headers = item
                self.send_response(status)
                self.send_header('Content-Type', headers.get('Content-Type', 'application/json'))
                self.send_header('Content-Length', headers.get('Content-Length', str(len(body))))
                self.send_header('Retry-After', '1')
                self.send_header('Request-Id', 'req_native_429')
                for key, value in headers.items():
                    if key not in ('Content-Type', 'Content-Length'):
                        self.send_header(key, value)
                self.end_headers()
                self.wfile.write(body)
        server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Provider)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(server.server_close)
        self.addCleanup(server.shutdown)
        gateway = budget.BudgetGateway(ledger, provider, f'http://127.0.0.1:{server.server_port}',
                                      model_bounds={'fixture': (80, 20, 'local fixture')})
        address = urllib.parse.urlsplit(gateway.start())
        self.addCleanup(gateway.close)
        def request(path='/v1/messages', method='POST', *, root_role=None):
            address = urllib.parse.urlsplit(gateway.url_for_role(root_role) if root_role else gateway.base_url)
            connection = http.client.HTTPConnection(address.hostname, address.port, timeout=3)
            self.addCleanup(connection.close)
            raw = (b'{"model":"fixture","max_tokens":20}' if provider == 'claude'
                   else b'{"model":"fixture","max_output_tokens":20}')
            connection.request(method, address.path + path, raw,
                               {'Content-Type': 'application/json', 'X-Native-Fixture': 'unchanged'})
            response = connection.getresponse()
            try:
                body = response.read()
            except http.client.IncompleteRead as error:
                body = error.partial
            return response.status, body, dict(response.getheaders())
        return ledger, gateway, seen, request

    def completed(self, ledger, attempts=1):
        deadline = time.monotonic() + 2
        while time.monotonic() < deadline:
            rows = ledger.requests()
            if len(rows) >= attempts and all(row['status'] != 'reserved' for row in rows):
                return ledger.snapshot()
            time.sleep(.005)
        self.fail('provider responses did not complete')

    def test_native_429_preserves_wire_and_full_liability_then_retry_settles_separately(self):
        wire = gzip.compress(json.dumps(ERROR).encode())
        ledger, _, seen, request = self.fixture([(429, wire, {'Content-Encoding': 'gzip'}),
                                               (200, json.dumps(COMPLETE).encode(), {})])
        status, body, headers = request()
        self.assertEqual((429, wire), (status, body))
        self.assertEqual(('1', 'req_native_429', 'gzip'),
                         tuple(headers[key] for key in ('Retry-After', 'Request-Id', 'Content-Encoding')))
        state = self.completed(ledger)
        self.assertIsNone(state['halt_reason'])
        self.assertEqual((0, 0, 80, 20), tuple(state[k] for k in (
            'measured_input_tokens', 'measured_output_tokens', 'reserved_input_tokens', 'reserved_output_tokens')))
        self.assertEqual(200, request()[0])
        state = self.completed(ledger, 2)
        self.assertEqual((60, 4, 80, 20, 2), tuple(state[k] for k in (
            'measured_input_tokens', 'measured_output_tokens', 'reserved_input_tokens',
            'reserved_output_tokens', 'generation_attempts')))
        self.assertIsNone(state['halt_reason'])
        rows = ledger.requests()
        self.assertNotEqual(rows[0]['id'], rows[1]['id'])
        self.assertEqual(['retained', 'settled'], [row['status'] for row in rows])
        self.assertEqual(2, len(seen))
        self.assertEqual(b'{"model":"fixture","max_tokens":20}', seen[0][1])
        self.assertEqual('unchanged', seen[0][2]['X-Native-Fixture'])

    def test_root_roles_preserve_shared_429_liability_and_exactly_once_settlement(self):
        wire = gzip.compress(json.dumps(ERROR).encode())
        ledger, _, seen, request = self.fixture([(429, wire, {'Content-Encoding': 'gzip'}),
                                               (200, json.dumps(COMPLETE).encode(), {})])
        self.assertEqual((429, wire), request(root_role='owner')[:2])
        self.completed(ledger)
        self.assertEqual(200, request(root_role='evaluator')[0])
        self.completed(ledger, 2)
        rows = ledger.requests()
        self.assertEqual(['owner', 'evaluator'], [row['root_role'] for row in rows])
        self.assertEqual(['retained', 'settled'], [row['status'] for row in rows])
        ledger.settle(rows[1]['id'], 'claude', USAGE, 'msg_complete')
        ledger.settle(rows[1]['id'], 'claude', USAGE, 'msg_complete')
        self.assertEqual((60, 4, 80, 20, 2, 1), tuple(ledger.snapshot()[key] for key in (
            'measured_input_tokens', 'measured_output_tokens', 'reserved_input_tokens',
            'reserved_output_tokens', 'generation_attempts', 'uncertain_attempts')))
        self.assertIsNone(ledger.snapshot()['halt_reason'])
        self.assertEqual(2, len(seen), 'gateway retried a role-routed request')
        self.assertEqual(['/v1/messages', '/v1/messages'], [row[0] for row in seen])

    def test_429_without_quota_signature_and_codex_use_same_native_rule(self):
        for provider, path in (('claude', '/v1/messages'), ('codex', '/responses')):
            with self.subTest(provider=provider):
                ledger, _, seen, request = self.fixture([(429, b'{"error":"ordinary native request"}', {})],
                                                       provider=provider)
                self.assertEqual(429, request(path)[0])
                state = self.completed(ledger)
                self.assertIsNone(state['halt_reason'])
                self.assertEqual((80, 20, 0, 0), tuple(state[k] for k in (
                    'reserved_input_tokens', 'reserved_output_tokens', 'measured_input_tokens', 'measured_output_tokens')))
                self.assertEqual(1, len(seen))

    def test_native_count_and_model_metadata_429_are_not_limiter_owned(self):
        ledger, _, seen, request = self.fixture([(429, json.dumps(ERROR).encode(), {})])
        self.assertEqual(429, request('/v1/messages/count_tokens')[0])
        self.assertEqual(429, request('/v1/models', 'GET')[0])
        self.assertIsNone(ledger.snapshot()['halt_reason'])
        self.assertEqual(0, ledger.snapshot()['generation_attempts'])
        self.assertEqual(2, len(seen))

    def test_held_429_and_settled_usage_limit_concurrent_fresh_retries_on_each_axis(self):
        for axis, caps in (('input', (220, 1000)), ('output', (1000, 44))):
            with self.subTest(axis=axis):
                ledger, _, seen, request = self.fixture([(200, json.dumps(COMPLETE).encode(), {}),
                                                       (429, json.dumps(ERROR).encode(), {})], caps=caps)
                self.assertEqual(200, request()[0])
                self.completed(ledger)
                self.assertEqual(429, request()[0])
                self.completed(ledger, 2)
                barrier = threading.Barrier(2)
                def retry():
                    barrier.wait()
                    return request()[0]
                with concurrent.futures.ThreadPoolExecutor(2) as pool:
                    statuses = list(pool.map(lambda _: retry(), range(2)))
                self.assertEqual([409, 429], sorted(statuses))
                state = self.completed(ledger, 3)
                self.assertTrue(state['halt_reason'].startswith(axis + ' token ceiling'))
                self.assertEqual((60, 4, 160, 40, 3), tuple(state[k] for k in (
                    'measured_input_tokens', 'measured_output_tokens', 'reserved_input_tokens',
                    'reserved_output_tokens', 'generation_attempts')))
                self.assertEqual(3, len(seen))

    def test_completed_429_survives_restart_and_late_usage_settles_exactly_once(self):
        ledger, _, _, request = self.fixture([(429, json.dumps(ERROR).encode(), {})], caps=(160, 40))
        self.assertEqual(429, request()[0])
        self.completed(ledger)
        reopened = budget.BudgetLedger(ledger.path, 'native-429', 160, 40)
        self.assertIsNone(reopened.snapshot()['halt_reason'])
        identity = reopened.requests()[0]['id']
        retry = reopened.reserve(80, 20, '/v1/messages', 'fixture', provider='claude')
        self.assertNotEqual(identity, retry)
        with self.assertRaisesRegex(budget.BudgetError, 'input token ceiling'):
            reopened.reserve(1, 1, '/v1/messages', 'fixture', provider='claude')
        reopened.settle(identity, 'claude', USAGE)
        reopened.settle(identity, 'claude', USAGE)
        state = reopened.snapshot()
        self.assertEqual((60, 4, 80, 20), tuple(state[k] for k in (
            'measured_input_tokens', 'measured_output_tokens', 'reserved_input_tokens', 'reserved_output_tokens')))
        self.assertIsNotNone(state['halt_reason'])

    def test_429_with_trustworthy_complete_usage_settles_normally(self):
        ledger, _, _, request = self.fixture([(429, json.dumps(COMPLETE).encode(), {})])
        self.assertEqual(429, request()[0])
        state = self.completed(ledger)
        self.assertIsNone(state['halt_reason'])
        self.assertEqual((60, 4, 0, 0), tuple(state[k] for k in (
            'measured_input_tokens', 'measured_output_tokens', 'reserved_input_tokens', 'reserved_output_tokens')))

    def test_429_error_sse_retains_liability_without_a_global_halt(self):
        wire = b'event: error\ndata: ' + json.dumps(ERROR).encode() + b'\n\n'
        ledger, _, _, request = self.fixture([(429, wire, {'Content-Type': 'text/event-stream'})])
        self.assertEqual((429, wire), request()[:2])
        state = self.completed(ledger)
        self.assertIsNone(state['halt_reason'])
        self.assertEqual((80, 20), (state['reserved_input_tokens'], state['reserved_output_tokens']))

    def test_malformed_inconsistent_and_truncated_429_retain_without_halt(self):
        invalid = dict(COMPLETE, usage=dict(USAGE, output_tokens=-1))
        bodies = [(b'{', {}), (json.dumps(invalid).encode(), {}),
                  (json.dumps(ERROR).encode(), {'Content-Length': '1000'}),
                  (gzip.compress(json.dumps(ERROR).encode())[:-2], {'Content-Encoding': 'gzip'})]
        for wire, headers in bodies:
            with self.subTest(headers=headers, wire_length=len(wire)):
                ledger, _, _, request = self.fixture([(429, wire, headers)])
                request()
                state = self.completed(ledger)
                self.assertIsNone(state['halt_reason'])
                self.assertEqual((0, 0, 80, 20), tuple(state[k] for k in (
                    'measured_input_tokens', 'measured_output_tokens', 'reserved_input_tokens', 'reserved_output_tokens')))

    def test_limiter_preflight_429_error_still_halts_before_forwarding(self):
        ledger, gateway, seen, request = self.fixture([(200, json.dumps(COMPLETE).encode(), {})])
        def preflight():
            raise budget.BudgetError('limiter preflight failed: HTTP 429')
        gateway.account_reader = preflight
        self.assertEqual(409, request()[0])
        self.assertIn('HTTP 429', ledger.snapshot()['halt_reason'])
        self.assertEqual([], seen)
        self.assertEqual(0, ledger.snapshot()['generation_attempts'])
        with self.assertRaisesRegex(budget.BudgetError, 'HTTP 429'):
            ledger.reserve(1, 1, '/v1/messages', 'fixture', provider='claude')


if __name__ == '__main__':
    unittest.main()
