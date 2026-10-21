"""First-failure attribution through the real gateway with loopback peers."""
import concurrent.futures
import http.client
import json
from pathlib import Path
import socket
import socketserver
import sqlite3
import struct
import sys
import tempfile
import threading
import time
import unittest
from urllib.parse import urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import uclusionTokenBudget as budget


def event(value):
    return b'data: ' + json.dumps(value).encode() + b'\n\n'


START = event({'type': 'response.created', 'response': {'id': 'fixture_response'}})
DONE = event({'type': 'response.completed', 'response': {
    'id': 'fixture_response', 'status': 'completed',
    'usage': {'input_tokens': 10, 'output_tokens': 2, 'total_tokens': 12}}})
SECRET = 'fixture-secret-not-for-diagnostics'


class FailureDiagnosticsTests(unittest.TestCase):
    def fixture(self, respond):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        ledger = budget.BudgetLedger(Path(directory.name) / 'ledger', 'diagnostics',
                                     100, 100, create=True)
        seen = []

        class Provider(socketserver.BaseRequestHandler):
            def handle(self):
                self.request.settimeout(3)
                stream = self.request.makefile('rb')
                line = stream.readline().decode()
                headers = {}
                while True:
                    header = stream.readline()
                    if header == b'\r\n':
                        break
                    key, value = header.decode().split(':', 1)
                    headers[key.lower()] = value.strip()
                stream.read(int(headers.get('content-length', '0')))
                stream.close()
                seen.append(line.split()[1])
                respond(self.request, line.split()[1])

        server = socketserver.ThreadingTCPServer(('127.0.0.1', 0), Provider)
        server.daemon_threads = True
        threading.Thread(target=server.serve_forever, daemon=True).start()
        self.addCleanup(server.server_close)
        self.addCleanup(server.shutdown)
        gateway = budget.BudgetGateway(ledger, 'codex',
            'http://127.0.0.1:' + str(server.server_address[1]),
            model_bounds={'fixture': (80, 20, 'local fixture')})
        target = urlsplit(gateway.start())
        self.addCleanup(gateway.close)
        return ledger, gateway, target, seen

    def request(self, target, *, metadata=False, disconnect=False):
        path = target.path + ('/models?ignored=' + SECRET if metadata else '/responses')
        body = b'' if metadata else json.dumps({
            'model': 'fixture', 'stream': True, 'input': SECRET}).encode()
        method = 'GET' if metadata else 'POST'
        if disconnect:
            with socket.create_connection(('127.0.0.1', target.port), timeout=3) as client:
                client.sendall((method + ' ' + path + ' HTTP/1.1\r\nHost: 127.0.0.1\r\n'
                    'Content-Length: ' + str(len(body)) + '\r\nConnection: close\r\n\r\n').encode() + body)
                client.recv(65536)
                self.reset(client)
            return
        client = http.client.HTTPConnection('127.0.0.1', target.port, timeout=3)
        try:
            client.request(method, path, body, {'Authorization': SECRET})
            response = client.getresponse()
            try:
                wire = response.read()
            except http.client.IncompleteRead as error:
                wire = error.partial
            return response.status, wire
        finally:
            client.close()

    @staticmethod
    def reset(connection):
        connection.setsockopt(socket.SOL_SOCKET, socket.SO_LINGER, struct.pack('ii', 1, 0))
        connection.close()

    def drained(self, gateway):
        deadline = time.monotonic() + 3
        while time.monotonic() < deadline:
            with gateway.lock:
                if not gateway.handlers:
                    return
            time.sleep(.005)
        self.fail('gateway handlers did not drain')

    def persisted(self, ledger):
        with sqlite3.connect('file:' + ledger.path + '?mode=ro', uri=True) as db:
            return json.loads(db.execute('SELECT state FROM run').fetchone()[0])

    def assert_diagnostic(self, ledger, exception, stage, context, request_id, *, uncertainty=False):
        key = 'uncertainty_diagnostic' if uncertainty else 'halt_diagnostic'
        diagnostic = self.persisted(ledger).get(key)
        self.assertIsInstance(diagnostic, dict, 'persisted first-failure diagnostic is missing')
        self.assertEqual({'exception_class', 'stage', 'handler_context', 'request_id', 'recorded_at'}, set(diagnostic))
        self.assertEqual((exception, stage, context, request_id), tuple(diagnostic[key]
            for key in ('exception_class', 'stage', 'handler_context', 'request_id')))
        self.assertIsInstance(diagnostic['recorded_at'], (int, float))
        self.assertNotIn(SECRET, json.dumps(diagnostic))
        self.assertEqual(diagnostic, budget.read_budget_status(ledger.path)[key])
        return diagnostic

    def signature(self, case, exception=None, stage=None, reason=None):
        def respond(connection, path):
            chunked = case == 'upstream_invalid_chunk'
            connection.sendall(b'HTTP/1.1 200 OK\r\nConnection: close\r\n' +
                (b'Transfer-Encoding: chunked\r\n' if chunked else b'') + b'\r\n')
            connection.sendall(('%x\r\n' % len(START)).encode() + START + b'\r\n' if chunked else START)
            time.sleep(.05)
            if chunked:
                connection.sendall(b'not-a-chunk-size\r\n')
            elif case in ('upstream_reset', 'metadata_reset'):
                self.reset(connection)
            elif case == 'malformed_sse_json':
                connection.sendall(b'data: {not-json}\n\n')
            elif case == 'explicit_provider_failure':
                connection.sendall(event({'type': 'response.failed', 'message': SECRET}))
            elif case != 'clean_without_terminal':
                connection.sendall(DONE)
        ledger, gateway, target, seen = self.fixture(respond)
        result = self.request(target, metadata=case == 'metadata_reset', disconnect=case == 'downstream_reset')
        self.drained(gateway)
        state = ledger.snapshot()
        self.assertIsNone(state['halt_reason'])
        self.assertEqual(1, len(seen))
        if case == 'metadata_reset':
            self.assertEqual([], ledger.requests())
            self.assertEqual((0, 0), (state['reserved_input_tokens'], state['reserved_output_tokens']))
            self.assertIsNone(state.get('halt_diagnostic'))
        else:
            row = ledger.requests()[0]
            self.assertEqual('retained' if reason else 'settled', row['status'])
            self.assertEqual((0, 0, 80, 20) if reason else (10, 2, 0, 0),
                tuple(state[k] for k in ('measured_input_tokens', 'measured_output_tokens',
                                        'reserved_input_tokens', 'reserved_output_tokens')))
            self.assertTrue(state['ceiling_valid'])
            if reason:
                self.assert_diagnostic(ledger, exception, stage, 'generation', row['id'], uncertainty=True)
            else:
                self.assertIsNone(state.get('halt_diagnostic'))
                if result:
                    self.assertEqual((200, START + DONE), result)

    def test_invalid_chunk_retains_distinct_first_failure(self):
        self.signature('upstream_invalid_chunk', 'IncompleteRead', 'upstream_body_read',
                       'uncertain budget transport or provider completion')

    def test_upstream_reset_retains_distinct_first_failure(self):
        self.signature('upstream_reset', 'ConnectionResetError', 'upstream_body_read',
                       'uncertain budget transport or provider completion')

    def test_metadata_reset_has_explicit_context_without_generation_identity(self):
        self.signature('metadata_reset', 'ConnectionResetError', 'upstream_body_read',
                       'uncertain budget transport or provider completion')

    def test_malformed_sse_retains_original_parser_exception(self):
        self.signature('malformed_sse_json', 'JSONDecodeError', 'response_observation',
                       'invalid provider request or completion')

    def test_missing_completion_retains_completion_stage(self):
        self.signature('clean_without_terminal', 'BudgetError', 'response_completion',
                       'missing unique provider completion')

    def test_provider_failure_retains_observation_stage(self):
        self.signature('explicit_provider_failure', 'BudgetError', 'response_observation',
                       'uncertain provider completion')

    def test_success_preserves_ordered_stream_and_settlement(self):
        self.signature('normal')

    def test_downstream_reset_still_drains_and_settles(self):
        self.signature('downstream_reset')

    def test_unknown_exception_text_and_class_name_do_not_persist(self):
        ledger, gateway, target, seen = self.fixture(lambda *unused: self.fail('unexpected forward'))
        exception = type(SECRET, (RuntimeError,), {})
        def account_reader():
            raise exception(SECRET)
        gateway.account_reader = account_reader
        self.assertEqual(409, self.request(target)[0])
        self.drained(gateway)
        self.assertEqual([], seen)
        self.assertEqual([], ledger.requests())
        self.assert_diagnostic(ledger, 'other', 'request_admission', 'generation', None)
        self.assertNotIn(SECRET.encode(), Path(ledger.path).read_bytes())

    def settlement_failure(self, response_id, incoming, exception):
        completed = event({'type': 'response.completed', 'response': {
            'id': response_id, 'status': 'completed',
            'usage': {'input_tokens': incoming, 'output_tokens': 2, 'total_tokens': incoming + 2}}})
        def respond(connection, path):
            connection.sendall(b'HTTP/1.1 200 OK\r\nConnection: close\r\n\r\n' + START + completed)
        ledger, gateway, target, seen = self.fixture(respond)
        self.assertEqual((200, START + completed), self.request(target))
        self.drained(gateway)
        row = ledger.requests()[0]
        state = ledger.snapshot()
        exceeded = incoming > 80
        self.assertEqual('bound_violation' if exceeded else 'settled', row['status'])
        if not exceeded:
            self.assertIsNone(row['provider_request_id'])
            self.assertIsNone(state['halt_reason'])
            self.assertEqual((10, 2, 0, 0), tuple(state[k] for k in ('measured_input_tokens', 'measured_output_tokens', 'reserved_input_tokens', 'reserved_output_tokens')))
            return
        self.assertEqual('provider usage exceeded its conservative reservation' if exceeded else
                         'missing, malformed or inconsistent provider usage', state['halt_reason'])
        self.assertEqual((incoming, 2, 80, 20) if exceeded else (0, 0, 80, 20),
            tuple(state[k] for k in ('measured_input_tokens', 'measured_output_tokens',
                                    'reserved_input_tokens', 'reserved_output_tokens')))
        self.assertEqual(not exceeded, state['ceiling_valid'])
        self.assertEqual(1, len(seen))
        self.assert_diagnostic(ledger, exception, 'response_completion', 'generation', row['id'])

    def test_malformed_response_identity_keeps_causal_settlement_exception(self):
        self.settlement_failure('invalid id', 10, 'BudgetError')

    def test_nonstring_response_identity_keeps_causal_settlement_exception(self):
        self.settlement_failure(42, 10, 'TypeError')

    def test_bound_violation_keeps_settlement_context_and_all_liability(self):
        self.settlement_failure('fixture_response', 81, 'unknown')

    def ledger_failure(self, case):
        with tempfile.TemporaryDirectory() as directory:
            ledger = budget.BudgetLedger(Path(directory) / 'ledger', 'settlement', 100, 100, create=True)
            identity = ledger.reserve(80, 20, '/responses', 'fixture')
            usage = {'input_tokens': 10, 'output_tokens': 2, 'total_tokens': 12}
            request_id = identity
            exception = 'unknown'
            if case == 'malformed_usage':
                usage['input_tokens'] = None
                exception = 'BudgetError'
            elif case == 'malformed_details':
                usage['input_tokens_details'] = None
                exception = 'AttributeError'
            elif case == 'unknown_request':
                request_id = 'unrecognized-not-an-internal-request'
            elif case == 'conflicting_duplicate':
                ledger.settle(identity, 'codex', usage)
                usage = {'input_tokens': 11, 'output_tokens': 2, 'total_tokens': 13}
            malformed = case in ('malformed_usage', 'malformed_details')
            if malformed:
                ledger.settle(request_id, 'codex', usage)
                self.assertIsNone(ledger.snapshot()['halt_reason'])
            else:
                with self.assertRaises(budget.BudgetError):
                    ledger.settle(request_id, 'codex', usage)
            self.assert_diagnostic(ledger, exception, 'settlement', 'unknown',
                                   None if case == 'unknown_request' else identity, uncertainty=malformed)
            self.assertEqual((10, 2, 0, 0) if case == 'conflicting_duplicate' else (0, 0, 80, 20),
                tuple(ledger.snapshot()[k] for k in ('measured_input_tokens', 'measured_output_tokens',
                                                   'reserved_input_tokens', 'reserved_output_tokens')))

    def test_malformed_usage_keeps_original_caught_settlement_exception(self):
        self.ledger_failure('malformed_usage')

    def test_malformed_usage_details_keep_original_caught_settlement_exception(self):
        self.ledger_failure('malformed_details')

    def test_unknown_settlement_does_not_invent_internal_request_identity(self):
        self.ledger_failure('unknown_request')

    def test_conflicting_duplicate_keeps_first_settlement_context_and_usage(self):
        self.ledger_failure('conflicting_duplicate')

    def test_true_halt_survives_concurrent_uncertainty_and_late_settlement(self):
        release = threading.Event()
        self.addCleanup(release.set)
        def respond(connection, path):
            connection.sendall(b'HTTP/1.1 200 OK\r\nConnection: close\r\n\r\n' + START)
            release.wait(2)
            connection.sendall(b'data: {not-json}\n\n')
        ledger, gateway, target, _ = self.fixture(respond)
        with concurrent.futures.ThreadPoolExecutor(1) as pool:
            response = pool.submit(self.request, target)
            deadline = time.monotonic() + 2
            while not ledger.requests() and time.monotonic() < deadline:
                time.sleep(.005)
            identity = ledger.requests()[0]['id']
            fatal = budget._failure_diagnostic(stage='request_admission', handler_context='generation')
            ledger.halt('actual enforcement failure', diagnostic=fatal)
            release.set()
            response.result(timeout=2)
        self.drained(gateway)
        ledger.settle(identity, 'codex', {'input_tokens': 10, 'output_tokens': 2})
        self.assertEqual('actual enforcement failure', ledger.snapshot()['halt_reason'])
        self.assertEqual(fatal, self.persisted(ledger)['halt_diagnostic'])
        self.assert_diagnostic(ledger, 'JSONDecodeError', 'response_observation', 'generation', identity, uncertainty=True)
        self.assertEqual((10, 2, 0, 0), tuple(ledger.snapshot()[k] for k in (
            'measured_input_tokens', 'measured_output_tokens', 'reserved_input_tokens', 'reserved_output_tokens')))


if __name__ == '__main__':
    unittest.main()
