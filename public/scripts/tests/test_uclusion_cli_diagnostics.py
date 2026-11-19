"""Customer diagnostics through real CLI subprocesses and a loopback HTTP server."""
import http.server
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import threading
import unittest
from unittest import mock

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))
import uclusionDiagnostics as diagnostics

SECRET = 'CUSTOMER_SECRET_SENTINEL_never_log'
TOKEN = 'CUSTOMER_TOKEN_SENTINEL_never_log'
PAYLOAD = 'CUSTOMER_CONTENT_SENTINEL_never_log'
REQUEST_ID = 'd4cb8553-d96c-4fd2-8e2c-164090dbcaa4'

# Rewrite only Uclusion HTTP requests to the fixture; no external traffic is possible.
# A faster watchdog makes the forced-kill cases bounded without changing its logic.
CHILD = r'''
import sys, os, runpy, urllib.request
from pathlib import Path
sys.path.insert(0, sys.argv[1])
import uclusionDiagnostics as d
original_init = d.Diagnostics.__init__
def quick_init(self, directory):
    original_init(self, directory, interval=.05)
d.Diagnostics.__init__ = quick_init
fault = os.environ.get('DIAGNOSTICS_FIXTURE_FAULT')
if fault == 'metadata':
    def fail_metadata(response):
        raise RuntimeError('CUSTOMER_TOKEN_SENTINEL_never_log')
    d.response_metadata = fail_metadata
elif fault == 'full_disk':
    original_write = d.os.write
    def full_disk(fd, value):
        if d._active and fd == d._active.fd:
            raise OSError('CUSTOMER_SECRET_SENTINEL_never_log')
        return original_write(fd, value)
    d.os.write = full_disk
original_open = urllib.request.urlopen
port = sys.argv[2]
def local_open(request, *args, **kwargs):
    assert request.full_url.startswith(('https://sso.stage.api.uclusion.com/v1/cli',
                                        'https://investibles.stage.api.uclusion.com/v1/mcp'))
    url = 'http://127.0.0.1:' + port + '/' + request.full_url.split('/', 3)[3]
    redirected = urllib.request.Request(url, data=request.data, headers=dict(request.header_items()),
                                       method=request.get_method())
    return original_open(redirected, *args, **kwargs)
urllib.request.urlopen = local_open
sys.argv = [str(Path(sys.argv[1])/'uclusionCLI.py'), *sys.argv[3:]]
runpy.run_path(sys.argv[0], run_name='__main__')
'''


class Fixture(http.server.BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        self.server.received.append((self.path, body))
        is_login = self.path.endswith('/cli')
        if self.server.mode == ('login_headers' if is_login else 'mcp_headers'):
            self.server.release.wait(5)
            return
        result = ({'uclusion_token': TOKEN, 'ui_url': 'http://example.invalid', 'user_id': 'fixture',
                   'stages': {}} if is_login else
                  {'jsonrpc': '2.0', 'id': body['id'], 'result': {'content': [{'type': 'text', 'text': PAYLOAD}]}})
        encoded = json.dumps(result).encode()
        if self.server.mode in ('http_error', 'http_error_body') and not is_login:
            self.send_response(500)
            encoded = (TOKEN + SECRET + PAYLOAD).encode()
        else:
            self.send_response(200)
        stream = self.server.mode == 'sse' and not is_login
        self.send_header('Content-Type', 'text/event-stream' if stream else 'application/json')
        self.send_header('x-amzn-RequestId', REQUEST_ID)
        self.send_header('Set-Cookie', TOKEN)
        self.send_header('Authorization', SECRET)
        if not stream:
            self.send_header('Content-Length', str(len(encoded)))
        self.end_headers()
        if self.server.mode in ('body', 'http_error_body') and not is_login:
            self.server.release.wait(5)
        elif stream:
            self.wfile.write(b'data: ' + encoded + b'\n\n')
            self.wfile.flush()
            self.server.release.wait(5)
        else:
            self.wfile.write(encoded)


class CLIDiagnosticsTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        config = self.root/'.uclusion'
        config.mkdir()
        (config/'stage_credentials').write_text('secret_key=' + SECRET + '\nsecret_key_id=test-client\n')
        (config/'stage_uclusion.json').write_text(json.dumps({'workspaceId': 'fixture-workspace'}))
        self.server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Fixture)
        self.server.daemon_threads = True
        self.server.release = threading.Event()
        self.server.received = []
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.addCleanup(self.server.server_close)
        self.addCleanup(self.server.shutdown)
        self.addCleanup(self.server.release.set)

    def invoke(self, mode, directory=None, timeout=5, explicit=None, fault=None):
        self.server.mode = mode
        environment = {**os.environ, 'UCLUSION_HOME': str(self.root), 'PYTHONDONTWRITEBYTECODE': '1'}
        environment.pop(diagnostics.ENVIRONMENT, None)
        if fault:
            environment['DIAGNOSTICS_FIXTURE_FAULT'] = fault
        if directory:
            environment[diagnostics.ENVIRONMENT] = str(directory)
        arguments = ['-e', 'stage']
        if explicit:
            arguments += ['--diagnostics', str(explicit)]
        arguments += ['get_job', '--arguments-json', '-', '--json']
        return subprocess.run([sys.executable, '-B', '-c', CHILD, str(SCRIPTS), str(self.server.server_port),
                               *arguments], input=json.dumps({'short_code_id': 'R-Demo-5', 'thread_only': True}),
                              text=True, capture_output=True, env=environment, cwd=self.root, timeout=timeout)

    def records(self, directory):
        paths = list(directory.glob('uclusion-cli-*.jsonl'))
        self.assertEqual(1, len(paths))
        self.assertEqual(0o600, paths[0].stat().st_mode & 0o777)
        self.assertEqual(0o700, directory.stat().st_mode & 0o777)
        raw = paths[0].read_text()
        for value in (SECRET, TOKEN, PAYLOAD):
            self.assertNotIn(value, raw)
        return [json.loads(line) for line in raw.splitlines()]

    def test_success_equivalence_and_explicit_directory_precedence(self):
        without = self.invoke('success')
        path = self.root/'diagnostics'
        with_logs = self.invoke('success', self.root/'unused', explicit=path)
        self.assertEqual((without.returncode, without.stdout, without.stderr),
                         (with_logs.returncode, with_logs.stdout, with_logs.stderr))
        self.assertEqual(0, with_logs.returncode, with_logs.stderr)
        self.assertFalse((self.root/'unused').exists())
        rows = self.records(path)
        self.assertTrue(any(r['event'] == 'mcp_request' and r['identifiers']['short_code_id'] == 'R-Demo-5'
                            for r in rows))
        self.assertTrue(any(r.get('aws_request_id') == REQUEST_ID for r in rows))
        self.assertTrue(any(r.get('phase') == 'connect' for r in rows))
        self.assertEqual('process_end', rows[-1]['event'])

    def test_forced_timeout_retains_phase_rpc_and_pretermination_stack(self):
        for mode, phase in (('login_headers', 'http_headers'), ('mcp_headers', 'http_headers'),
                            ('body', 'http_body'), ('sse', 'http_stream'),
                            ('http_error_body', 'http_error_body')):
            with self.subTest(mode=mode):
                path = self.root/mode
                with self.assertRaises(subprocess.TimeoutExpired):
                    self.invoke(mode, path, timeout=.8)
                rows = self.records(path)
                snapshots = [r for r in rows if r['event'] == 'stack_snapshot']
                self.assertTrue(snapshots)
                self.assertTrue(any(p['name'] == phase for r in snapshots
                                    for stack in r['active_phases'].values() for p in stack))
                self.assertTrue(all('source' not in f and 'locals' not in f for r in snapshots
                                    for stack in r['stacks'] for f in stack['frames']))
                self.assertFalse(any(r['event'] == 'process_end' for r in rows))
                if mode != 'login_headers':
                    self.assertTrue(any(r['event'] == 'mcp_request' for r in rows))
                if mode == 'sse':
                    self.assertTrue(any(r['event'] == 'sse_message' and r['has_result'] for r in rows))

    def test_late_instrumentation_gap_survives_hard_kill(self):
        path = self.root/'late-gap'
        with self.assertRaises(subprocess.TimeoutExpired):
            self.invoke('body', path, timeout=.8, fault='metadata')
        rows = self.records(path)
        self.assertTrue(any(row['event'] == 'coverage_gap' and row['boundary'] == 'headers' for row in rows))
        self.assertTrue(any(row['event'] == 'stack_snapshot' for row in rows))
        self.assertFalse(any(row['event'] == 'process_end' for row in rows))

    def test_http_error_is_unchanged_and_diagnostics_exclude_secret_body(self):
        without = self.invoke('http_error')
        path = self.root/'errors'
        logged = self.invoke('http_error', path)
        self.assertEqual((without.returncode, without.stdout, without.stderr),
                         (logged.returncode, logged.stdout, logged.stderr))
        self.assertNotEqual(0, logged.returncode)
        self.assertTrue(any(r['event'] == 'http_error_response' and r['status'] == 500
                            for r in self.records(path)))

    def test_unwritable_or_nonprivate_location_does_not_change_result(self):
        baseline = self.invoke('success')
        occupied = self.root/'file'
        occupied.write_text('unrelated')
        public = self.root/'public'
        public.mkdir(mode=0o755)
        for path in (occupied, public):
            with self.subTest(path=path):
                result = self.invoke('success', path)
                self.assertEqual((baseline.returncode, baseline.stdout, baseline.stderr),
                                 (result.returncode, result.stdout, result.stderr))
        self.assertEqual('unrelated', occupied.read_text())
        self.assertEqual([], list(public.iterdir()))

    def test_runtime_metadata_or_full_disk_failure_preserves_success(self):
        baseline = self.invoke('success')
        for fault in ('metadata', 'full_disk'):
            with self.subTest(fault=fault):
                path = self.root/fault
                result = self.invoke('success', path, fault=fault)
                self.assertEqual((baseline.returncode, baseline.stdout, baseline.stderr),
                                 (result.returncode, result.stdout, result.stderr))
                rows = self.records(path)
                if fault == 'metadata':
                    self.assertIn({'boundary': 'headers', 'error_type': 'RuntimeError'}, rows[-1]['gaps'])

    def test_retention_preserves_active_and_unrelated_files_and_caps_bytes(self):
        path = self.root/'retention'
        first = diagnostics.Diagnostics(path)
        self.addCleanup(first.close)
        unrelated = path/'customer.jsonl'
        unrelated.write_text('keep')
        with mock.patch.object(diagnostics, 'MAX_FILES', 2):
            for _ in range(4):
                item = diagnostics.Diagnostics(path)
                item.close()
        self.assertTrue(first.path.exists())
        self.assertEqual('keep', unrelated.read_text())
        self.assertLessEqual(len(list(path.glob('uclusion-cli-*.jsonl'))), 3)
        with mock.patch.object(diagnostics, 'MAX_BYTES', 2000):
            for _ in range(20):
                first.event('bounded', counter=1)
        self.assertLessEqual(first.path.stat().st_size, 2000)
        self.assertEqual('coverage_gap', json.loads(first.path.read_text().splitlines()[-1])['event'])

    @unittest.skipUnless(hasattr(__import__('time'), 'CLOCK_BOOTTIME'), 'optional clock not present')
    def test_unavailable_boottime_keeps_other_clock_and_phase_records(self):
        path = self.root/'clock-unavailable'
        with mock.patch.object(diagnostics.time, 'clock_gettime_ns', side_effect=OSError('unavailable')):
            observer = diagnostics.Diagnostics(path)
            observer.event('still_recording')
            observer.close()
        rows = self.records(path)
        self.assertTrue(any(row['event'] == 'still_recording' for row in rows))
        self.assertTrue(all('wall_ns' in row and 'monotonic_ns' in row for row in rows))
        self.assertTrue(any({'boundary': 'boottime', 'error_type': 'OSError'} in row.get('gaps', []) for row in rows))
        self.assertTrue(all('boottime_ns' not in row for row in rows))


if __name__ == '__main__':
    unittest.main()
