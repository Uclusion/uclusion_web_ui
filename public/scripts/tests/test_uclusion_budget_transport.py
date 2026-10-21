"""Real compressed HTTP responses retain native bytes and canonical accounting."""
import concurrent.futures
import ctypes
import ctypes.util
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
import zlib
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import uclusionTokenBudget as budget


def compress(raw, encoding):
    if encoding == 'gzip':
        return gzip.compress(raw)
    if encoding == 'deflate':
        return zlib.compress(raw)
    if encoding == 'identity':
        return raw
    library = ctypes.CDLL(ctypes.util.find_library('brotlienc' if encoding == 'br' else 'zstd'))
    target = ctypes.create_string_buffer(len(raw) * 2 + 1024)
    if encoding == 'br':
        library.BrotliEncoderCompress.argtypes = [ctypes.c_int, ctypes.c_int, ctypes.c_int,
            ctypes.c_size_t, ctypes.c_void_p, ctypes.POINTER(ctypes.c_size_t), ctypes.c_void_p]
        size = ctypes.c_size_t(len(target))
        if not library.BrotliEncoderCompress(4, 22, 0, len(raw), raw, ctypes.byref(size), target):
            raise AssertionError('fixture compression failed')
        length = size.value
    else:
        library.ZSTD_compress.argtypes = [ctypes.c_void_p, ctypes.c_size_t,
                                         ctypes.c_void_p, ctypes.c_size_t, ctypes.c_int]
        library.ZSTD_compress.restype = ctypes.c_size_t
        length = library.ZSTD_compress(target, len(target), raw, len(raw), 1)
        if length > len(target):
            raise AssertionError('fixture compression failed')
    return target.raw[:length]


class TransportTests(unittest.TestCase):
    def fixture(self, encoding='identity', *, streaming=False, status=200, truncate=False):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        ledger = budget.BudgetLedger(Path(directory.name) / 'ledger', 'transport', 100, 100, create=True)
        self.release = threading.Event()
        self.addCleanup(self.release.set)
        raw_usage = {'input_tokens': 10, 'cache_creation_input_tokens': 20,
                     'cache_read_input_tokens': 30, 'output_tokens': 4}
        if streaming:
            events = [{'type': 'message_start', 'message': {'id': 'msg_test', 'usage': raw_usage}},
                      {'type': 'message_delta', 'delta': {'stop_reason': 'end_turn'}, 'usage': {'output_tokens': 4}},
                      {'type': 'message_stop'}]
            raw = b''.join(('data: ' + json.dumps(e) + '\n\n').encode() for e in events)
        else:
            raw = json.dumps({'id': 'msg_test', 'stop_reason': 'end_turn', 'usage': raw_usage} if status == 200 else {'error': 'provider unavailable'}).encode()
        wire = compress(raw, encoding.lower())
        if truncate:
            wire = wire[:-2]
        seen = []
        owner = self
        class Provider(http.server.BaseHTTPRequestHandler):
            def log_message(self, *unused): pass
            def do_POST(self):
                self.rfile.read(int(self.headers['Content-Length']))
                seen.append(self.headers.get_all('Accept-Encoding'))
                self.send_response(status)
                self.send_header('Content-Type', 'text/event-stream' if streaming else 'application/json; charset=utf-8')
                self.send_header('Content-Encoding', encoding)
                self.send_header('Request-Id', 'req_fixture_123')
                self.send_header('Authorization', 'not-for-accounting-records')
                self.send_header('Content-Length', str(len(wire)))
                self.end_headers()
                split = max(1, len(wire) // 2)
                self.wfile.write(wire[:split])
                self.wfile.flush()
                owner.release.wait(3)
                self.wfile.write(wire[split:])
        server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Provider)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(server.server_close)
        self.addCleanup(server.shutdown)
        gateway = budget.BudgetGateway(ledger, 'claude', f'http://127.0.0.1:{server.server_port}',
                                      model_bounds={'fixture': (80, 20, 'local fixture')})
        address = urllib.parse.urlsplit(gateway.start())
        self.addCleanup(gateway.close)
        connection = http.client.HTTPConnection(address.hostname, address.port, timeout=3)
        self.addCleanup(connection.close)
        connection.request('POST', address.path + '/v1/messages',
                           json.dumps({'model': 'fixture', 'max_tokens': 20}),
                           {'Content-Type': 'application/json', 'accept-encoding': 'gzip, deflate, br, zstd'})
        response = connection.getresponse()
        return ledger, response, wire, seen

    def finish(self, ledger):
        deadline = time.monotonic() + 2
        while time.monotonic() < deadline:
            state = ledger.snapshot()
            if not state['reserved_input_tokens'] or state['halt_reason'] or ledger.requests()[0]['status'] == 'retained':
                return state
            time.sleep(.01)
        self.fail('accounting did not settle')

    def test_compressed_json_preserves_wire_and_settles_complete_cached_usage(self):
        for encoding in ('identity', 'gzip', 'deflate', 'br', 'zstd', 'GZip', 'Identity'):
            with self.subTest(encoding=encoding):
                ledger, response, wire, seen = self.fixture(encoding)
                self.release.set()
                self.assertEqual(wire, response.read())
                self.assertEqual([['gzip, deflate, br, zstd']], seen)
                state = self.finish(ledger)
                self.assertIsNone(state['halt_reason'])
                self.assertEqual((60, 4, 0, 0), tuple(state[k] for k in (
                    'measured_input_tokens', 'measured_output_tokens', 'reserved_input_tokens', 'reserved_output_tokens')))

    def test_compressed_sse_forwards_first_bytes_before_provider_completion(self):
        for encoding in ('gzip', 'deflate', 'br', 'zstd'):
            with self.subTest(encoding=encoding):
                ledger, response, wire, _ = self.fixture(encoding, streaming=True)
                self.assertEqual(wire[:1], response.read(1))
                self.assertFalse(self.release.is_set())
                self.assertEqual(80, ledger.snapshot()['reserved_input_tokens'])
                self.release.set()
                self.assertEqual(wire[1:], response.read())
                state = self.finish(ledger)
                self.assertIsNone(state['halt_reason'])
                self.assertEqual(60, state['measured_input_tokens'])

    def test_non200_retains_liability_and_only_whitelisted_response_diagnostics(self):
        ledger, response, wire, _ = self.fixture(status=503)
        self.release.set()
        self.assertEqual((503, wire), (response.status, response.read()))
        state = self.finish(ledger)
        self.assertEqual((80, 20), (state['reserved_input_tokens'], state['reserved_output_tokens']))
        self.assertIsNone(state['halt_reason'])
        metadata = json.loads(ledger.requests()[0]['response_metadata'])
        self.assertEqual({'status': 503, 'content_type': 'application/json',
                          'content_encoding': 'identity', 'correlation_id': 'req_fixture_123'}, metadata)
        self.assertNotIn('not-for-accounting-records', Path(ledger.path).read_bytes().decode(errors='ignore'))

    def test_provider_rejection_keeps_admission_open_with_all_original_liability(self):
        ledger, response, _, _ = self.fixture(status=503)
        self.release.set()
        response.read()
        self.finish(ledger)
        ledger.reserve(20, 20, '/v1/messages', 'fixture', provider='claude')
        self.assertEqual(100, ledger.snapshot()['reserved_input_tokens'])
        with self.assertRaisesRegex(budget.BudgetError, 'input token ceiling'):
            ledger.reserve(1, 1, '/v1/messages', 'fixture', provider='claude')

    def test_truncated_compression_cannot_release_reservation_after_complete_json_or_sse(self):
        for encoding in ('gzip', 'deflate', 'br', 'zstd'):
            for streaming in (False, True):
                with self.subTest(encoding=encoding, streaming=streaming):
                    ledger, response, _, _ = self.fixture(encoding, streaming=streaming, truncate=True)
                    self.release.set()
                    response.read()
                    state = self.finish(ledger)
                    self.assertIsNone(state['halt_reason'])
                    self.assertEqual((80, 20, 0), tuple(state[k] for k in (
                        'reserved_input_tokens', 'reserved_output_tokens', 'measured_input_tokens')))


class GatewayShutdownTests(unittest.TestCase):
    def gateway(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        ledger = budget.BudgetLedger(Path(directory.name) / 'ledger', 'shutdown', 100, 100, create=True)
        gateway = budget.BudgetGateway(ledger, 'codex', 'http://127.0.0.1:1',
                                      model_bounds={'fixture': (80, 20, 'local fixture')})
        gateway.start()
        self.addCleanup(gateway.close)
        return ledger, gateway

    def test_accepted_request_during_shutdown_never_forwards_or_halts(self):
        ledger, gateway = self.gateway()
        entered, release = threading.Event(), threading.Event()
        original = gateway.check
        def delayed():
            entered.set()
            if not release.wait(2):
                raise RuntimeError('shutdown fixture timed out')
            original()
        gateway.check = delayed
        def request():
            address = urllib.parse.urlsplit(gateway.base_url)
            connection = http.client.HTTPConnection(address.hostname, address.port, timeout=3)
            try:
                connection.request('POST', address.path + '/responses',
                                   json.dumps({'model': 'fixture'}))
                response = connection.getresponse()
                response.read()
                return response.status
            finally:
                connection.close()
        with concurrent.futures.ThreadPoolExecutor(2) as pool:
            response = pool.submit(request)
            try:
                self.assertTrue(entered.wait(2))
                closing = pool.submit(gateway.close)
                self.assertTrue(gateway.closing.wait(2))
            finally:
                release.set()
            self.assertEqual(409, response.result(timeout=3))
            closing.result(timeout=3)
        state = ledger.snapshot()
        self.assertIsNone(state['halt_reason'])
        self.assertEqual((0, 0, 0), tuple(state[key] for key in (
            'generation_attempts', 'reserved_input_tokens', 'reserved_output_tokens')))

    def test_existing_halt_remains_fatal_during_shutdown(self):
        ledger, gateway = self.gateway()
        ledger.halt('existing controller failure')
        gateway.close()
        with self.assertRaises(budget.BudgetError) as raised:
            gateway.check()
        self.assertNotIsInstance(raised.exception, budget.AdmissionPaused)
        self.assertEqual('existing controller failure', ledger.snapshot()['halt_reason'])

    def test_unexpected_gateway_death_remains_fatal(self):
        ledger, gateway = self.gateway()
        gateway.server.shutdown()
        gateway.thread.join(timeout=2)
        with self.assertRaisesRegex(budget.BudgetError, 'budget gateway stopped'):
            gateway.check()
        self.assertEqual('budget gateway stopped', ledger.snapshot()['halt_reason'])


class CodexResponseProtocolTests(unittest.TestCase):
    def request(self, *, stream=True, content_type=None, status=200, malformed=False):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        ledger = budget.BudgetLedger(Path(directory.name) / 'ledger', 'protocol', 100, 100, create=True)
        release = threading.Event()
        self.addCleanup(release.set)
        usage = {'input_tokens': 10, 'output_tokens': 4, 'total_tokens': 14,
                 'input_tokens_details': {'cached_tokens': 2},
                 'output_tokens_details': {'reasoning_tokens': 1}}
        value = {'id': 'response_fixture', 'status': 'completed', 'usage': usage}
        if status == 429:
            first, last = b'{"error":', b'{"type":"rate_limit_error"}}'
        elif not stream or content_type == 'application/json':
            first, last = json.dumps(value).encode()[:1], json.dumps(value).encode()[1:]
        else:
            first = b'data: {"type":"response.created"}\n\n'
            last = ('data: ' + json.dumps({'type': 'response.completed', 'response': value}) + '\n\n').encode()
        if malformed:
            last = last[:-3]
        class Provider(http.server.BaseHTTPRequestHandler):
            def log_message(self, *unused): pass
            def do_POST(self):
                self.rfile.read(int(self.headers['Content-Length']))
                self.send_response(status)
                if content_type is not None:
                    self.send_header('Content-Type', content_type)
                self.send_header('Transfer-Encoding', 'chunked')
                self.end_headers()
                for chunk in (first, last):
                    self.wfile.write(('%x\r\n' % len(chunk)).encode() + chunk + b'\r\n')
                    self.wfile.flush()
                    if chunk is first:
                        release.wait(2)
                self.wfile.write(b'0\r\n\r\n')
        server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Provider)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        self.addCleanup(server.server_close)
        self.addCleanup(server.shutdown)
        gateway = budget.BudgetGateway(ledger, 'codex', f'http://127.0.0.1:{server.server_port}',
                                      model_bounds={'fixture': (80, 20, 'local fixture')})
        address = urllib.parse.urlsplit(gateway.start())
        self.addCleanup(gateway.close)
        connection = http.client.HTTPConnection(address.hostname, address.port, timeout=3)
        self.addCleanup(connection.close)
        connection.request('POST', address.path + '/responses',
                           json.dumps({'model': 'fixture', 'stream': stream}))
        response = connection.getresponse()
        self.assertEqual(status, response.status)
        self.assertEqual(first[:1], response.read(1))
        self.assertFalse(release.is_set())
        self.assertEqual(80, ledger.snapshot()['reserved_input_tokens'])
        release.set()
        self.assertEqual((first + last)[1:], response.read())
        deadline = time.monotonic() + 2
        while time.monotonic() < deadline:
            state = ledger.snapshot()
            if state['halt_reason'] or ledger.requests()[0]['status'] != 'reserved':
                return state, ledger.requests()[0]
            time.sleep(.01)
        self.fail('response accounting did not finish')

    def assert_settled(self, state, row):
        self.assertIsNone(state['halt_reason'])
        self.assertEqual((10, 4, 0, 0), tuple(state[key] for key in (
            'measured_input_tokens', 'measured_output_tokens', 'reserved_input_tokens', 'reserved_output_tokens')))
        self.assertEqual('settled', row['status'])

    def test_requested_stream_without_content_type_reads_chunked_sse(self):
        self.assert_settled(*self.request())

    def test_nonstream_without_content_type_still_reads_json(self):
        self.assert_settled(*self.request(stream=False))

    def test_explicit_json_response_preserves_its_parser_despite_stream_request(self):
        self.assert_settled(*self.request(content_type='application/json'))

    def test_native_429_without_content_type_retains_full_liability(self):
        state, row = self.request(status=429)
        self.assertIsNone(state['halt_reason'])
        self.assertEqual('retained', row['status'])
        self.assertEqual((0, 0, 80, 20), tuple(state[key] for key in (
            'measured_input_tokens', 'measured_output_tokens', 'reserved_input_tokens', 'reserved_output_tokens')))

    def test_malformed_success_without_content_type_keeps_full_liability(self):
        state, row = self.request(malformed=True)
        self.assertIsNone(state['halt_reason'])
        self.assertEqual('retained', row['status'])
        self.assertEqual((0, 0, 80, 20), tuple(state[key] for key in (
            'measured_input_tokens', 'measured_output_tokens', 'reserved_input_tokens', 'reserved_output_tokens')))


if __name__ == '__main__':
    unittest.main()
