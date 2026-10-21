"""Bounded uncertainty preserves native delivery and fresh shared admission."""
import concurrent.futures
import http.client
import json
import os
from pathlib import Path
import socket
import socketserver
import subprocess
import sys
import tempfile
import threading
import time
import unittest
from urllib.parse import urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import uclusionTokenBudget as budget
import uclusionInstall as install


def complete(provider):
    usage = {'input_tokens': 10, 'output_tokens': 2}
    return ({'id': 'response_test', 'status': 'completed', 'usage': usage} if provider == 'codex'
            else {'id': 'message_test', 'stop_reason': 'end_turn', 'usage': usage})


def event(value):
    return b'data: ' + json.dumps(value).encode() + b'\n\n'


class UncertaintyTests(unittest.TestCase):
    def fixture(self, provider='codex', *, caps=(1000, 1000), first=None, later=None, owned=False):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        root = Path(directory.name)
        seen = []
        lock = threading.Lock()
        class Provider(socketserver.BaseRequestHandler):
            def handle(self):
                stream = self.request.makefile('rb')
                line = stream.readline()
                if not line:
                    return
                headers = {}
                while True:
                    header = stream.readline()
                    if header == b'\r\n':
                        break
                    key, value = header.decode().split(':', 1)
                    headers[key.lower()] = value.strip()
                stream.read(int(headers.get('content-length', '0')))
                with lock:
                    index = len(seen)
                    seen.append(line.split()[1].decode())
                if index == 0 and first:
                    first(self.request)
                elif later:
                    later(self.request)
                else:
                    raw = json.dumps(complete(provider)).encode()
                    self.request.sendall(b'HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: '
                                         + str(len(raw)).encode() + b'\r\nConnection: close\r\n\r\n' + raw)
        server = socketserver.ThreadingTCPServer(('127.0.0.1', 0), Provider)
        server.daemon_threads = True
        threading.Thread(target=server.serve_forever, daemon=True).start()
        self.addCleanup(server.server_close)
        self.addCleanup(server.shutdown)
        upstream = f'http://127.0.0.1:{server.server_address[1]}'
        if owned:
            run = budget.RunBudget(root, provider, *caps, upstream_base=upstream, create=True)
            self.addCleanup(lambda: run.close() if not run.monitor_stop.is_set() else None)
            gateway, ledger = run.gateway, run.ledger
            gateway.model_bounds = {'fixture': (80, 20, 'local finite fixture')}
        else:
            run = None
            ledger = budget.BudgetLedger(root / 'ledger', 'uncertainty', *caps, create=True)
            gateway = budget.BudgetGateway(ledger, provider, upstream,
                        model_bounds={'fixture': (80, 20, 'local finite fixture')})
            gateway.start()
            self.addCleanup(gateway.close)
        address = urlsplit(gateway.base_url)
        path = address.path + ('/responses' if provider == 'codex' else '/v1/messages')
        body = {'model': 'fixture', 'stream': True}
        if provider == 'claude':
            body['max_tokens'] = 20
        def request(metadata=False):
            client = http.client.HTTPConnection(address.hostname, address.port, timeout=3)
            try:
                client.request('GET' if metadata else 'POST', address.path + '/models' if metadata else path,
                               None if metadata else json.dumps(body))
                response = client.getresponse()
                try:
                    wire = response.read()
                    interrupted = False
                except http.client.IncompleteRead as error:
                    wire, interrupted = error.partial, True
                return response.status, wire, dict(response.getheaders()), interrupted
            finally:
                client.close()
        return ledger, gateway, seen, request, run, (path, body)

    def drained(self, gateway):
        deadline = time.monotonic() + 3
        while time.monotonic() < deadline:
            with gateway.lock:
                if not gateway.handlers:
                    return
            time.sleep(.005)
        self.fail('live gateway did not drain')

    def test_parser_decoder_and_status_uncertainty_preserve_later_wire_and_retry(self):
        for provider in ('codex', 'claude'):
            good = (event({'type': 'response.completed', 'response': complete(provider)}) if provider == 'codex'
                    else event({'type': 'message_start', 'message': complete(provider)})
                    + event({'type': 'message_delta', 'delta': {'stop_reason': 'end_turn'}, 'usage': {'output_tokens': 2}})
                    + event({'type': 'message_stop'}))
            cases = [
                ('malformed_sse', 200, b'data: {bad}\n\n' + good + b': later sentinel\n\n', 'text/event-stream', ''),
                ('duplicate_terminal', 200, good + good, 'text/event-stream', ''),
                ('missing_terminal', 200, b'data: {"type":"progress"}\n\n', 'text/event-stream', ''),
                ('missing_usage', 200, b'{}', 'application/json', ''),
                ('invalid_json', 200, b'{bad}later sentinel', 'application/json', ''),
                ('invalid_decoder', 200, b'original compressed-looking wire sentinel', 'application/json', 'gzip'),
                ('unsupported_decoder', 200, b'original encoded wire sentinel', 'application/json', 'unknown'),
                ('native_503', 503, b'{"error":"native unavailable"}', 'application/json', ''),
                ('native_429', 429, b'{bad rate error}sentinel', 'application/json', ''),
            ]
            for name, status, wire, media, encoding in cases:
                with self.subTest(provider=provider, case=name):
                    def respond(connection):
                        head = (f'HTTP/1.1 {status} Fixture\r\nContent-Type: {media}\r\n'
                                f'Content-Length: {len(wire)}\r\nRetry-After: 3\r\nRequest-Id: fixture_id\r\n')
                        if encoding:
                            head += 'Content-Encoding: ' + encoding + '\r\n'
                        connection.sendall((head + 'Connection: close\r\n\r\n').encode())
                        split = max(1, len(wire) // 2)
                        connection.sendall(wire[:split])
                        time.sleep(.005)
                        connection.sendall(wire[split:])
                    ledger, gateway, seen, request, _, _ = self.fixture(provider, first=respond)
                    received = request()
                    self.drained(gateway)
                    self.assertEqual((status, wire), received[:2])
                    self.assertEqual('3', received[2]['Retry-After'])
                    gateway.check()
                    self.assertEqual((0, 0, 80, 20), tuple(ledger.snapshot()[k] for k in (
                        'measured_input_tokens', 'measured_output_tokens', 'reserved_input_tokens', 'reserved_output_tokens')))
                    self.assertIsNone(ledger.requests()[0]['usage'])
                    self.assertEqual(200, request()[0])
                    self.drained(gateway)
                    self.assertEqual(['retained', 'settled'], [row['status'] for row in ledger.requests()])
                    self.assertEqual(2, len(seen))
                    self.assertNotEqual(*[row['id'] for row in ledger.requests()])

    def test_transport_before_headers_and_truncated_framing_preserve_native_failure_and_next_admission(self):
        for case in ('headers', 'content_length', 'chunked', 'metadata'):
            with self.subTest(case=case):
                def respond(connection):
                    if case == 'headers':
                        return
                    connection.sendall(b'HTTP/1.1 200 OK\r\n' +
                        (b'Transfer-Encoding: chunked\r\n' if case == 'chunked' else b'Content-Length: 100\r\n')
                        + b'Connection: close\r\n\r\n' + (b'3\r\nabc\r\ninvalid\r\n' if case == 'chunked' else b'abc'))
                ledger, gateway, _, request, _, _ = self.fixture(first=respond)
                received = request(metadata=case == 'metadata')
                self.drained(gateway)
                self.assertEqual(502 if case == 'headers' else 200, received[0])
                if case != 'headers':
                    self.assertTrue(received[3], 'transport failure looked like completed native response')
                gateway.check()
                self.assertEqual(0 if case == 'metadata' else 80, ledger.snapshot()['reserved_input_tokens'])
                self.assertEqual(200, request()[0])
                self.drained(gateway)

    def test_all_held_and_pending_bounds_compete_atomically_with_measured_usage_on_each_axis(self):
        for caps, axis in (((250, 1000), 'input'), ((1000, 62), 'output')):
            with self.subTest(axis=axis), tempfile.TemporaryDirectory() as directory:
                ledger = budget.BudgetLedger(Path(directory) / 'ledger', 'concurrent', *caps, create=True)
                settled = ledger.reserve(80, 20, '/responses', 'fixture')
                ledger.settle(settled, 'codex', {'input_tokens': 10, 'output_tokens': 2})
                held = ledger.reserve(80, 20, '/responses', 'fixture')
                ledger.uncertain(held)
                pending = ledger.reserve(80, 20, '/responses', 'fixture')
                reopened = budget.BudgetLedger(ledger.path, 'concurrent', *caps)
                self.assertIsNone(reopened.snapshot()['halt_reason'])
                barrier = threading.Barrier(2)
                def reserve():
                    barrier.wait()
                    try:
                        return reopened.reserve(80, 20, '/responses', 'fixture')
                    except budget.BudgetError:
                        return None
                with concurrent.futures.ThreadPoolExecutor(2) as pool:
                    results = list(pool.map(lambda _: reserve(), range(2)))
                self.assertEqual(1, sum(value is not None for value in results))
                self.assertEqual((10, 2, 240, 60, 4), tuple(ledger.snapshot()[k] for k in (
                    'measured_input_tokens', 'measured_output_tokens', 'reserved_input_tokens', 'reserved_output_tokens', 'generation_attempts')))
                self.assertTrue(ledger.snapshot()['halt_reason'].startswith(axis + ' token ceiling'))
                ledger.settle(held, 'codex', {'input_tokens': 10, 'output_tokens': 2})
                ledger.settle(held, 'codex', {'input_tokens': 10, 'output_tokens': 2})
                self.assertIsNotNone(ledger.snapshot()['halt_reason'])
                self.assertEqual(pending, ledger.requests()[2]['id'])

    def test_unknown_retention_and_wrong_provider_are_integrity_failures(self):
        for case in ('retention', 'provider'):
            with self.subTest(case=case), tempfile.TemporaryDirectory() as directory:
                ledger = budget.BudgetLedger(Path(directory) / 'ledger', 'integrity', 100, 100, create=True)
                identity = ledger.reserve(80, 20, '/responses', 'fixture')
                with self.assertRaises(budget.BudgetError):
                    if case == 'retention':
                        ledger.uncertain('unknown')
                    else:
                        ledger.settle(identity, 'claude', {})
                self.assertIsNotNone(ledger.snapshot()['halt_reason'])
                self.assertEqual(80, ledger.snapshot()['reserved_input_tokens'])

    def test_quiescent_real_gateway_can_pause_and_resume_without_refunding_unknown_usage(self):
        def missing(connection):
            connection.sendall(b'HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\n{}')
        ledger, gateway, _, request, run, _ = self.fixture(first=missing, owned=True)
        request()
        self.drained(gateway)
        run.check()
        ledger.pause_active()  # The caller separately proves no owned process or live handler.
        self.assertTrue(ledger.snapshot()['admission_paused'])
        self.assertEqual(80, ledger.snapshot()['reserved_input_tokens'])
        identity = ledger.requests()[0]['id']
        with self.assertRaises(budget.AdmissionPaused):
            ledger.reserve(80, 20, '/responses', 'fixture')
        ledger.resume_active()
        self.assertEqual(200, request()[0])
        self.drained(gateway)
        run.check()
        self.assertNotEqual(identity, ledger.requests()[1]['id'])
        ledger.settle(identity, 'codex', {'input_tokens': 10, 'output_tokens': 2})
        ledger.settle(identity, 'codex', {'input_tokens': 10, 'output_tokens': 2})
        self.assertEqual((20, 4, 0, 0), tuple(ledger.snapshot()[k] for k in (
            'measured_input_tokens', 'measured_output_tokens', 'reserved_input_tokens', 'reserved_output_tokens')))

    def test_real_native_process_and_demo_owner_wait_continue_after_uncertainty(self):
        def missing(connection):
            connection.sendall(b'HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\n{}')
        ledger, gateway, _, _, run, (path, body) = self.fixture(first=missing, owned=True)
        address = urlsplit(gateway.base_url)
        script = '''import http.client,json,sys,time
for _ in range(2):
 c=http.client.HTTPConnection('127.0.0.1',int(sys.argv[1]),timeout=3)
 c.request('POST',sys.argv[2],sys.argv[3]);r=c.getresponse();r.read();c.close()
 if r.status!=200: sys.exit(4)
 time.sleep(.15)
'''
        owner = run.track(subprocess.Popen([sys.executable, '-c', script, str(address.port), path, json.dumps(body)], start_new_session=True))
        watch = run.track(subprocess.Popen([sys.executable, '-c', 'import time; time.sleep(30)'], start_new_session=True))
        native = run.track(subprocess.Popen([sys.executable, '-c', 'import time; time.sleep(30)'], start_new_session=True))
        self.assertEqual(0, install.wait_for_codex_owner(owner, run, watch, native))
        self.drained(gateway)
        run.check()
        self.assertEqual(['retained', 'settled'], [row['status'] for row in ledger.requests()])
        self.assertEqual((10, 2, 80, 20), tuple(ledger.snapshot()[k] for k in (
            'measured_input_tokens', 'measured_output_tokens', 'reserved_input_tokens', 'reserved_output_tokens')))

    def test_gateway_concurrency_counts_retained_and_live_pending_work_before_forwarding(self):
        for caps, axis in (((250, 1000), 'input'), ((1000, 62), 'output')):
            with self.subTest(axis=axis):
                started, release = threading.Event(), threading.Event()
                self.addCleanup(release.set)
                def pending(connection):
                    started.set()
                    release.wait(3)
                    raw = json.dumps(complete('codex')).encode()
                    connection.sendall(b'HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: '
                        + str(len(raw)).encode() + b'\r\n\r\n' + raw)
                ledger, gateway, seen, request, _, _ = self.fixture(caps=caps, first=pending, later=pending)
                measured = ledger.reserve(80, 20, '/responses', 'fixture')
                ledger.settle(measured, 'codex', {'input_tokens': 10, 'output_tokens': 2})
                retained = ledger.reserve(80, 20, '/responses', 'fixture')
                ledger.uncertain(retained)
                with concurrent.futures.ThreadPoolExecutor(3) as pool:
                    active = pool.submit(request)
                    self.assertTrue(started.wait(2))
                    barrier = threading.Barrier(2)
                    def retry():
                        barrier.wait()
                        return request()[0]
                    contenders = [pool.submit(retry) for _ in range(2)]
                    try:
                        deadline = time.monotonic() + 2
                        while not ledger.snapshot()['halt_reason'] and time.monotonic() < deadline:
                            time.sleep(.005)
                        self.assertIsNotNone(ledger.snapshot()['halt_reason'])
                    finally:
                        release.set()
                    self.assertEqual([200, 409], sorted(f.result(timeout=2) for f in contenders))
                    self.assertEqual(200, active.result(timeout=2)[0])
                self.drained(gateway)
                self.assertEqual(2, len(seen), 'refused request reached the provider')
                self.assertTrue(ledger.snapshot()['halt_reason'].startswith(axis + ' token ceiling'))
                self.assertEqual((30, 6, 80, 20), tuple(ledger.snapshot()[k] for k in (
                    'measured_input_tokens', 'measured_output_tokens', 'reserved_input_tokens', 'reserved_output_tokens')))

    def test_native_exit_is_reported_and_owned_cleanup_preserves_full_unknown_liability(self):
        def missing(connection):
            connection.sendall(b'HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\n{}')
        ledger, gateway, _, _, run, (path, body) = self.fixture(first=missing, owned=True)
        script = ("import http.client,sys; c=http.client.HTTPConnection('127.0.0.1',int(sys.argv[1])); "
                  "c.request('POST',sys.argv[2],sys.argv[3]); c.getresponse().read(); sys.exit(7)")
        owner = run.track(subprocess.Popen([sys.executable, '-c', script, str(urlsplit(gateway.base_url).port), path, json.dumps(body)], start_new_session=True))
        watch = run.track(subprocess.Popen([sys.executable, '-c', 'import time; time.sleep(30)'], start_new_session=True))
        native = run.track(subprocess.Popen([sys.executable, '-c', 'import time; time.sleep(30)'], start_new_session=True))
        self.assertEqual(7, install.wait_for_codex_owner(owner, run, watch, native))
        ledger.halt('native owner process exited unsuccessfully')
        run.close()
        self.assertIsNotNone(watch.poll())
        self.assertIsNotNone(native.poll())
        summary = json.loads((run.run_dir / 'token-budget-summary.json').read_text())
        self.assertTrue(summary['finished'])
        self.assertTrue(summary['owned_processes_stopped'])
        self.assertEqual((0, 80, 20), tuple(summary[k] for k in (
            'measured_input_tokens', 'reserved_input_tokens', 'reserved_output_tokens')))
        self.assertFalse((run.run_dir / 'report.json').exists())

    def test_true_gateway_failure_stops_owned_processes(self):
        ledger, gateway, _, _, run, _ = self.fixture(owned=True)
        child = run.track(subprocess.Popen([sys.executable, '-c', 'import time; time.sleep(30)'], start_new_session=True))
        gateway.server.shutdown()
        gateway.thread.join(timeout=2)
        deadline = time.monotonic() + 3
        while child.poll() is None and time.monotonic() < deadline:
            time.sleep(.02)
        self.assertIsNotNone(child.poll())
        self.assertEqual('budget gateway stopped', ledger.snapshot()['halt_reason'])


if __name__ == '__main__':
    unittest.main()
