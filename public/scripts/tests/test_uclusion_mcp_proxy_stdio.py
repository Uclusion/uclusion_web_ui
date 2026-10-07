import io
import json
import os
import stat
import subprocess
import sys
import tempfile
import time
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest import mock


SCRIPT_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import uclusionMCPProxy as proxy


JSONRPC_RESULT = {
    'jsonrpc': '2.0',
    'id': 7,
    'result': {'tools': [{'name': 'get_job'}]},
}
READ_RESULT = {'jsonrpc': '2.0', 'id': 8,
               'result': {'content': [{'type': 'text', 'text': 'Private unchanged view note body.'}]}}


class _BodyResponse:
    def __init__(self, body):
        self._body = body.encode('utf-8')

    def read(self):
        return self._body


class _LineResponse:
    def __init__(self, lines):
        self._lines = [line.encode('utf-8') for line in lines]

    def __iter__(self):
        return iter(self._lines)


class McpProxyStdioTests(unittest.TestCase):
    def test_write_message_drops_a_root_json_string(self):
        stdout = io.StringIO()
        stderr = io.StringIO()
        with redirect_stdout(stdout), redirect_stderr(stderr):
            proxy.write_message('not-an-object')
        self.assertEqual('', stdout.getvalue())
        self.assertIn('str is not a JSON-RPC object', stderr.getvalue())

    def test_json_object_response_is_forwarded(self):
        stdout = io.StringIO()
        with redirect_stdout(stdout), redirect_stderr(io.StringIO()):
            proxy.handle_json_response(
                _BodyResponse(json.dumps(JSONRPC_RESULT)),
                request_id=7,
            )
        self.assertEqual(
            JSONRPC_RESULT,
            json.loads(stdout.getvalue()),
        )

    def test_double_encoded_json_string_does_not_reach_stdout(self):
        stdout = io.StringIO()
        stderr = io.StringIO()
        with redirect_stdout(stdout), redirect_stderr(stderr):
            proxy.handle_json_response(
                _BodyResponse(json.dumps(json.dumps(JSONRPC_RESULT))),
                request_id=7,
            )
        messages = [
            json.loads(line)
            for line in stdout.getvalue().splitlines()
            if line.strip()
        ]
        self.assertEqual(1, len(messages))
        self.assertIsInstance(messages[0], dict)
        self.assertEqual(
            'MCP server returned a non-object JSON payload',
            messages[0]['error']['message'],
        )
        self.assertIn('payload is str, not a JSON object', stderr.getvalue())

    def test_sse_skips_done_and_string_frames_then_forwards_object(self):
        stdout = io.StringIO()
        stderr = io.StringIO()
        with redirect_stdout(stdout), redirect_stderr(stderr):
            proxy.handle_sse_response(
                _LineResponse([
                    'event: message\n',
                    'data: "[DONE]"\n',
                    'data: [DONE]\n',
                    'data: ' + json.dumps(JSONRPC_RESULT) + '\n',
                    'data: [DONE]\n',
                ]),
                request_id=7,
            )
        self.assertEqual(
            JSONRPC_RESULT,
            json.loads(stdout.getvalue()),
        )
        self.assertIn('payload is str, not a JSON object', stderr.getvalue())

    def test_sse_string_only_stream_returns_jsonrpc_error(self):
        stdout = io.StringIO()
        with redirect_stdout(stdout), redirect_stderr(io.StringIO()):
            proxy.handle_sse_response(
                _LineResponse([
                    'data: "not-an-object"\n',
                    'data: [DONE]\n',
                ]),
                request_id=7,
            )
        message = json.loads(stdout.getvalue())
        self.assertEqual(-32001, message['error']['code'])
        self.assertEqual(7, message['id'])


class ProxyStartupFailureTests(unittest.TestCase):
    def test_missing_credentials_answers_initialize(self):
        initialize = {
            'jsonrpc': '2.0',
            'id': 0,
            'method': 'initialize',
            'params': {
                'protocolVersion': '2025-06-18',
                'capabilities': {},
                'clientInfo': {'name': 'codex-mcp-client', 'version': '0.160.0'},
            },
        }
        with tempfile.TemporaryDirectory() as home:
            result = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT_DIR / 'uclusionMCPProxy.py'),
                    'workspace-id',
                    'production',
                ],
                input=json.dumps(initialize) + '\n',
                capture_output=True,
                text=True,
                env={**os.environ, 'UCLUSION_HOME': home},
                timeout=15,
                check=False,
            )
        self.assertEqual(0, result.returncode)
        message = json.loads(result.stdout)
        self.assertEqual(0, message['id'])
        self.assertEqual(-32000, message['error']['code'])
        self.assertEqual(proxy.CREDENTIALS_MISSING, message['error']['message'])
        self.assertIn(proxy.CREDENTIALS_MISSING, result.stderr)


class ResponseStatsTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.directory = Path(directory.name)
        self.path = self.directory / 'responses.jsonl'

    def recorder(self, request=None, path=None):
        recorder = proxy.ResponseStats(str(path or self.path))
        self.addCleanup(recorder.close)
        recorder.set_request(request or {
            'jsonrpc': '2.0', 'id': 'private-request-id', 'method': 'tools/call',
            'params': {'name': 'get_job', 'arguments': {'short_code_id': 'J-secret-1'}},
        })
        return recorder

    def rows(self, path=None):
        return [json.loads(line) for line in (path or self.path).read_text().splitlines()]

    def test_flag_and_disabled_output_without_file_creation(self):
        for argv in (
            ['workspace', '--response-stats', str(self.path)],
            ['workspace', 'stage', '--response-stats', str(self.path)],
        ):
            self.assertEqual(str(self.path), proxy.parse_args(argv).response_stats)
        self.assertIsNone(proxy.parse_args(['workspace']).response_stats)
        recorder = proxy.ResponseStats(None)
        stdout = io.StringIO()
        with redirect_stdout(stdout):
            proxy.write_message(JSONRPC_RESULT, stats=recorder)
        self.assertEqual(JSONRPC_RESULT, json.loads(stdout.getvalue()))
        self.assertEqual([], list(self.directory.iterdir()))

    def test_exact_wire_and_decoded_text_bytes_without_content(self):
        recorder = self.recorder({
            'id': 'private-request-id', 'method': 'tools/call',
            'params': {'name': 'get_job', 'arguments': {
                'thread_only': True, 'sections': ['notes'], 'short_code_id': 'J-secret-1',
            }},
        })
        text = 'é🚀\n'
        message = {
            'jsonrpc': '2.0', 'id': 'private-request-id',
            'result': {
                'content': [
                    {'type': 'text', 'text': text},
                    {'type': 'image', 'data': 'private-image-data'},
                ],
                'structuredContent': {'private': 'private-structured-data'},
            },
        }
        raw = io.BytesIO()
        # A text writer would change both encoding and line endings here.
        stdout = io.TextIOWrapper(raw, encoding='utf-16', newline='\r\n')
        with redirect_stdout(stdout):
            proxy.write_message(message, stats=recorder)
        emitted = raw.getvalue()
        self.assertEqual(message, json.loads(emitted))
        self.assertTrue(emitted.endswith(b'\n'))
        self.assertFalse(emitted.endswith(b'\r\n'))
        rows = self.rows()
        self.assertEqual([{
            'method': 'tools/call', 'tool': 'get_job', 'scope': 'thread_only', 'status': 'ok',
            'jsonrpc_utf8_bytes': len(emitted), 'text_utf8_bytes': len(text.encode('utf-8')),
        }], [{key: row[key] for key in ('method', 'tool', 'scope', 'status', 'jsonrpc_utf8_bytes', 'text_utf8_bytes')}
             for row in rows])
        self.assertEqual('J-secret-1', rows[0]['read_selector']['short_code_id'])
        self.assertNotIn(text, self.path.read_text())
        self.assertNotIn('private-image-data', self.path.read_text())
        self.assertNotIn('private-structured-data', self.path.read_text())
        self.assertEqual(0o600, stat.S_IMODE(self.path.stat().st_mode))

    def test_identical_reads_match_within_their_context_until_reset(self):
        recorder = self.recorder()
        for root in ('first', 'second', 'first'):
            recorder.set_request({'method': 'tools/call', 'params': {
                'name': 'get_job', '_meta': {'threadId': root},
                'arguments': {'short_code_id': 'R-example-1', 'thread_only': True}}})
            recorder.record(READ_RESULT, b'wire')
        reads = self.rows()
        self.assertIsNone(reads[0]['repeat_of'])
        self.assertIsNone(reads[1]['repeat_of'])
        self.assertEqual(reads[0]['read_number'], reads[2]['repeat_of'])
        self.assertEqual('unknown', reads[2]['context_coverage'])
        recorder.context_event('first', 'compact')
        recorder.record(READ_RESULT, b'wire')
        self.assertIsNone(self.rows()[-1]['repeat_of'])
        self.assertEqual('observed', self.rows()[-1]['context_coverage'])
        recorder.set_request({'method': 'tools/call', 'params': {
            'name': 'get_job', '_meta': {'threadId': 'second'},
            'arguments': {'short_code_id': 'R-example-1', 'thread_only': True}}})
        recorder.record(READ_RESULT, b'wire')
        self.assertEqual(reads[1]['read_number'], self.rows()[-1]['repeat_of'])

    def test_claude_hooks_share_read_history_and_clear_it_at_boundaries(self):
        def hook(payload):
            process = subprocess.run(
                [sys.executable, str(SCRIPT_DIR / 'uclusionMCPProxy.py'), 'workspace', 'stage',
                 '--response-stats-hook', str(self.path)],
                input=json.dumps({'session_id': 'private-session', **payload}),
                text=True, capture_output=True, check=True,
            )
            self.assertEqual('', process.stdout)
            self.assertEqual('', process.stderr)
        start = {'hook_event_name': 'SessionStart', 'source': 'startup'}
        read = {'hook_event_name': 'PostToolUse', 'tool_name': 'mcp__Uclusion__get_job',
                'tool_input': {'short_code_id': 'R-example-1', 'thread_only': True},
                'tool_response': READ_RESULT['result']}
        hook(start)
        hook(read)
        hook(read)
        self.assertEqual(self.rows()[1]['read_number'], self.rows()[2]['repeat_of'])
        for boundary in ('compact', 'clear'):
            hook({**start, 'source': boundary})
            hook(read)
            self.assertIsNone(self.rows()[-1]['repeat_of'])
            self.assertEqual('observed', self.rows()[-1]['context_coverage'])
        self.assertNotIn('private-session', self.path.read_text())
        self.assertNotIn(READ_RESULT['result']['content'][0]['text'], self.path.read_text())

    def test_failed_and_mutating_calls_do_not_enter_repeat_history(self):
        recorder = self.recorder()
        recorder.record({'result': {'isError': True, 'content': [{'type': 'text', 'text': 'failure'}]}}, b'wire')
        recorder.set_request({'method': 'tools/call', 'params': {'name': 'add_info', 'arguments': {}}})
        recorder.record(JSONRPC_RESULT, b'wire')
        self.assertTrue(all('repeat_of' not in row for row in self.rows()))

    def test_merged_claude_hooks_record_one_row_for_each_actual_read(self):
        payload = {'session_id': 'session', 'hook_event_name': 'PostToolUse',
                   'tool_name': 'mcp__uclusion__get_job', 'tool_use_id': 'first-call',
                   'tool_input': {'short_code_id': 'R-example-1'}, 'tool_response': READ_RESULT['result']}
        for invocation in ('first-call', 'first-call', 'second-call', 'second-call'):
            recorder = self.recorder()
            recorder.claude_hook({**payload, 'tool_use_id': invocation})
            recorder.close()
        rows = self.rows()
        self.assertEqual(2, len(rows))
        self.assertIsNone(rows[0]['repeat_of'])
        self.assertEqual(rows[0]['read_number'], rows[1]['repeat_of'])
        self.assertNotIn('first-call', self.path.read_text())

    def test_claude_without_hooks_reports_candidate_repeats_with_unknown_coverage(self):
        recorder = self.recorder()
        recorder.set_request({'method': 'initialize', 'params': {'clientInfo': {'name': 'claude-code'}}})
        recorder.set_request({'method': 'tools/call', 'params': {
            'name': 'get_job', 'arguments': {'short_code_id': 'R-example-1'}}})
        recorder.record(READ_RESULT, b'wire')
        recorder.record(READ_RESULT, b'wire')
        rows = self.rows()
        self.assertEqual(rows[0]['read_number'], rows[1]['repeat_of'])
        self.assertEqual('unknown', rows[1]['context_coverage'])

    def test_a_held_log_lock_does_not_block_mcp_indefinitely(self):
        recorder = self.recorder()
        descriptor = os.open(self.path, os.O_RDWR)
        self.addCleanup(os.close, descriptor)
        proxy.fcntl.flock(descriptor, proxy.fcntl.LOCK_EX)
        started = time.monotonic()
        with redirect_stdout(io.StringIO()) as output, redirect_stderr(io.StringIO()):
            proxy.write_message(READ_RESULT, stats=recorder)
        self.assertLess(time.monotonic() - started, 1)
        self.assertEqual(READ_RESULT, json.loads(output.getvalue()))
        self.assertEqual([], self.rows())
        self.assertIsNone(recorder._fd)

    def test_unlock_failure_stops_only_the_recorder(self):
        recorder = self.recorder()
        with mock.patch.object(proxy.fcntl, 'flock', side_effect=[None, OSError('unlock failed')]), \
                redirect_stderr(io.StringIO()):
            recorder.context_event('first', 'compact')
        self.assertIsNone(recorder._fd)

    def test_scope_categories_do_not_record_arguments(self):
        recorder = self.recorder()
        for arguments in ({}, {'sections': ['private-section']}, {'thread_only': True}):
            recorder.set_request({
                'method': 'tools/call',
                'params': {'name': 'get_job', 'arguments': arguments},
            })
            with redirect_stdout(io.StringIO()):
                proxy.write_message(JSONRPC_RESULT, stats=recorder)
        recorder.set_request({'method': 'initialize', 'params': {'name': 'private-not-a-tool'}})
        with redirect_stdout(io.StringIO()):
            proxy.write_message(JSONRPC_RESULT, stats=recorder)
        rows = self.rows()
        self.assertEqual(['default', 'sections', 'thread_only', None], [row['scope'] for row in rows])
        self.assertIsNone(rows[-1]['tool'])
        self.assertNotIn('private', self.path.read_text())

    def test_json_and_sse_measure_after_tool_filtering_and_injection(self):
        payload = {
            'jsonrpc': '2.0', 'id': 7,
            'result': {'tools': [{'name': 'get_job'}, {'name': 'start_job_audit'}]},
        }
        notification = {'jsonrpc': '2.0', 'method': 'notifications/tools/list_changed'}
        for transport in ('json', 'sse'):
            with self.subTest(transport=transport):
                path = self.directory / (transport + '.jsonl')
                recorder = self.recorder({'method': 'tools/list'}, path=path)
                stdout = io.StringIO()
                with redirect_stdout(stdout), redirect_stderr(io.StringIO()):
                    if transport == 'json':
                        proxy.handle_json_response(
                            _BodyResponse(json.dumps(payload)), work_claims_enabled=True,
                            request_id=7, stats=recorder,
                        )
                    else:
                        proxy.handle_sse_response(
                            _LineResponse([
                                'event: message\n', 'data: "not an object"\n',
                                'data: ' + json.dumps(notification) + '\n',
                                'data: ' + json.dumps(payload) + '\n', 'data: [DONE]\n',
                            ]), work_claims_enabled=True, request_id=7, stats=recorder,
                        )
                lines = stdout.getvalue().splitlines(keepends=True)
                rows = self.rows(path)
                self.assertEqual(len(lines), len(rows))
                self.assertEqual(
                    [len(line.encode('utf-8')) for line in lines],
                    [row['jsonrpc_utf8_bytes'] for row in rows],
                )
                self.assertEqual(
                    ['get_job', 'claim_work'],
                    [tool['name'] for tool in json.loads(lines[-1])['result']['tools']],
                )
                self.assertTrue(all(row['text_utf8_bytes'] == 0 for row in rows))
                self.assertEqual('ok', rows[-1]['status'])
                if transport == 'sse':
                    self.assertEqual('notification', rows[0]['status'])

    def test_local_tool_and_rpc_errors_record_only_sizes(self):
        recorder = self.recorder({'method': 'tools/call', 'params': {'name': 'claim_work'}})
        claims = mock.Mock()
        claims.request.return_value = None
        stdout = io.StringIO()
        with redirect_stdout(stdout):
            proxy.handle_claim_tool_call(
                claims, 1, {'arguments': {'operation': 'claim', 'short_code_id': 'J-secret-1'}},
                stats=recorder,
            )
            proxy.write_jsonrpc_error(2, -32000, 'private error', {'body': 'private body'}, stats=recorder)
        rows = self.rows()
        self.assertEqual(['tool_error', 'rpc_error'], [row['status'] for row in rows])
        lines = stdout.getvalue().splitlines(keepends=True)
        self.assertEqual([len(line.encode()) for line in lines], [row['jsonrpc_utf8_bytes'] for row in rows])
        self.assertGreater(rows[0]['text_utf8_bytes'], 0)
        self.assertEqual(0, rows[1]['text_utf8_bytes'])
        self.assertNotIn('private', self.path.read_text())
        self.assertNotIn('J-secret-1', self.path.read_text())

    def test_invalid_payload_measures_generated_error(self):
        recorder = self.recorder()
        stdout = io.StringIO()
        with redirect_stdout(stdout), redirect_stderr(io.StringIO()):
            proxy.handle_sse_response(
                _LineResponse(['data: "not an object"\n', 'data: [DONE]\n']),
                request_id=7, stats=recorder,
            )
        self.assertEqual('rpc_error', self.rows()[0]['status'])
        self.assertEqual(len(stdout.getvalue().encode()), self.rows()[0]['jsonrpc_utf8_bytes'])

    def test_existing_private_file_is_appended(self):
        self.path.write_text('{"prior":true}\n')
        self.path.chmod(0o600)
        recorder = self.recorder()
        with redirect_stdout(io.StringIO()):
            proxy.write_message(JSONRPC_RESULT, stats=recorder)
        self.assertEqual({'prior': True}, self.rows()[0])
        self.assertEqual(2, len(self.rows()))

    def test_unsafe_or_missing_destinations_disable_without_altering_them(self):
        public = self.directory / 'public.jsonl'
        public.write_text('preserve this')
        public.chmod(0o644)
        private = self.directory / 'private.jsonl'
        private.write_text('private contents')
        private.chmod(0o600)
        symlink = self.directory / 'link.jsonl'
        symlink.symlink_to(private)
        paths = [public, symlink, self.directory, self.directory / 'missing' / 'out.jsonl']
        if hasattr(os, 'mkfifo'):
            fifo = self.directory / 'fifo'
            os.mkfifo(fifo, 0o600)
            paths.append(fifo)
        for path in paths:
            with self.subTest(path=path):
                stderr, stdout = io.StringIO(), io.StringIO()
                with redirect_stderr(stderr), redirect_stdout(stdout):
                    recorder = self.recorder(path=path)
                    proxy.write_message(JSONRPC_RESULT, stats=recorder)
                    proxy.write_message(JSONRPC_RESULT, stats=recorder)
                self.assertEqual('Uclusion response statistics disabled.\n', stderr.getvalue())
                self.assertEqual(2, len(stdout.getvalue().splitlines()))
        self.assertEqual('preserve this', public.read_text())
        self.assertEqual(0o644, stat.S_IMODE(public.stat().st_mode))
        self.assertEqual('private contents', private.read_text())
        self.assertFalse((self.directory / 'missing').exists())

    @unittest.skipUnless(hasattr(os, 'geteuid'), 'POSIX file ownership')
    def test_file_owned_by_another_user_is_not_used(self):
        self.path.write_text('preserve this')
        self.path.chmod(0o600)
        stderr = io.StringIO()
        with mock.patch.object(proxy.os, 'geteuid', return_value=self.path.stat().st_uid + 1), \
                redirect_stderr(stderr):
            recorder = self.recorder()
        with redirect_stdout(io.StringIO()):
            proxy.write_message(JSONRPC_RESULT, stats=recorder)
        self.assertEqual('preserve this', self.path.read_text())
        self.assertEqual('Uclusion response statistics disabled.\n', stderr.getvalue())

    def test_write_failure_disables_once_without_affecting_mcp(self):
        recorder = self.recorder()
        stderr, stdout = io.StringIO(), io.StringIO()
        with redirect_stderr(stderr), redirect_stdout(stdout), \
                mock.patch.object(proxy.os, 'write', side_effect=OSError('private path or body')) as write:
            proxy.write_message(JSONRPC_RESULT, stats=recorder)
            proxy.write_message(JSONRPC_RESULT, stats=recorder)
        self.assertEqual(1, write.call_count)
        self.assertEqual('Uclusion response statistics disabled.\n', stderr.getvalue())
        self.assertEqual([JSONRPC_RESULT, JSONRPC_RESULT], [json.loads(line) for line in stdout.getvalue().splitlines()])
        self.assertEqual('', self.path.read_text())

    def test_close_failure_does_not_retry_the_descriptor_or_record_again(self):
        recorder = self.recorder()
        close = os.close

        def close_then_interrupt(descriptor):
            close(descriptor)
            raise InterruptedError('private close detail')

        stderr = io.StringIO()
        with redirect_stderr(stderr), mock.patch.object(proxy.os, 'close', side_effect=close_then_interrupt) as closing:
            recorder.close()
            recorder.close()
        with redirect_stdout(io.StringIO()):
            proxy.write_message(JSONRPC_RESULT, stats=recorder)
        self.assertEqual(1, closing.call_count)
        self.assertEqual('Uclusion response statistics disabled.\n', stderr.getvalue())
        self.assertEqual('', self.path.read_text())


if __name__ == '__main__':
    unittest.main()
