import io
import json
import os
import sqlite3
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
# Claude Code's PostToolUse hook receives an MCP result as its bare content list.
CLAUDE_READ_RESPONSE = READ_RESULT['result']['content']


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

    def close(self):
        pass


class McpProxyStdioTests(unittest.TestCase):
    def test_legacy_description_options_preserve_the_complete_catalog(self):
        request = {'jsonrpc': '2.0', 'id': 7, 'method': 'tools/list'}
        result = {'jsonrpc': '2.0', 'id': 7, 'result': {'tools': [{
            'name': 'get_job', 'description': 'Read a job.',
            'inputSchema': {'type': 'object', 'properties': {
                'short_code_id': {'type': 'string', 'description': 'The job code.'},
            }},
        }]}}
        for legacy in ([], ['--tool-descriptions', 'on-demand'],
                       ['--tool-descriptions', 'whole-list']):
            incoming = io.StringIO(json.dumps(request) + '\n')
            outgoing = io.StringIO()
            response = _BodyResponse(json.dumps(result))
            response.headers = {'Content-Type': 'application/json'}
            arguments = proxy.parse_args(['workspace-1', 'stage'] + legacy)
            with self.subTest(legacy=legacy), \
                    mock.patch.object(proxy.sys, 'stdin'), mock.patch.object(proxy.sys, 'stdout'), \
                    mock.patch.object(proxy.os, 'fdopen', side_effect=[incoming, outgoing]), \
                    mock.patch.object(proxy, 'parse_args', return_value=arguments), \
                    mock.patch.object(proxy, 'prune_token_audit_storage'), \
                    mock.patch.object(proxy, 'prune_inbox'), \
                    mock.patch.object(proxy, 'get_credentials', return_value={}), \
                    mock.patch.object(proxy, 'login', return_value={'uclusion_token': 'test-token'}), \
                    mock.patch.object(proxy.threading, 'Thread'), \
                    mock.patch.object(proxy, 'record_demo_input'), \
                    mock.patch.object(proxy, 'post_to_mcp_refreshing_token',
                                      return_value=(response, None)) as post:
                proxy.main()
            post.assert_called_once()
            self.assertNotIn('x-uclusion-tool-descriptions',
                             {name.lower() for name in post.call_args.args[1]})
            self.assertEqual(result, json.loads(outgoing.getvalue()))
        help_output = io.StringIO()
        with redirect_stdout(help_output), self.assertRaises(SystemExit):
            proxy.parse_args(['--help'])
        self.assertNotIn('--tool-descriptions', help_output.getvalue())

    def test_only_configured_audit_phases_reach_the_server(self):
        def phase(request_id, bucket):
            return {'jsonrpc': '2.0', 'id': request_id, 'method': 'tools/call', 'params': {
                'name': 'set_job_audit_phase', 'arguments': {
                    'job_id': 'J-all-1', 'audit_run_id': 'run-1',
                    'marker_sequence': 1, 'bucket': bucket,
                },
            }}
        invalid = phase(1, 'instruction source review')
        valid = phase(2, 'testing')
        incoming = io.StringIO(json.dumps(invalid) + '\n' + json.dumps(valid) + '\n')
        outgoing = io.StringIO()
        response = _BodyResponse(json.dumps({'jsonrpc': '2.0', 'id': 2, 'result': {'content': []}}))
        response.headers = {'Content-Type': 'application/json'}
        arguments = proxy.parse_args([
            'workspace-1', 'stage', '--token-audit', '--token-audit-buckets', 'planning,testing',
        ])
        with mock.patch.object(proxy.sys, 'stdin'), mock.patch.object(proxy.sys, 'stdout'), \
                mock.patch.object(proxy.os, 'fdopen', side_effect=[incoming, outgoing]), \
                mock.patch.object(proxy, 'parse_args', return_value=arguments), \
                mock.patch.object(proxy, 'prune_token_audit_storage'), \
                mock.patch.object(proxy, 'prune_inbox'), \
                mock.patch.object(proxy, 'get_credentials', return_value={}), \
                mock.patch.object(proxy, 'login', return_value={'uclusion_token': 'test-token'}), \
                mock.patch.object(proxy.threading, 'Thread'), \
                mock.patch.object(proxy, 'record_demo_input'), \
                mock.patch.object(proxy, 'post_to_mcp_refreshing_token', return_value=(response, None)) as post:
            proxy.main()
        post.assert_called_once()
        self.assertEqual(valid, json.loads(post.call_args.args[2]))
        replies = [json.loads(line) for line in outgoing.getvalue().splitlines()]
        self.assertEqual(-32602, replies[0]['error']['code'])
        self.assertEqual(1, replies[0]['id'])
        self.assertEqual(2, replies[1]['id'])

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
    def test_eof_and_input_failure_close_background_runtimes(self):
        import uclusionCodexNative as native
        import uclusionTokenAudit as audit
        arguments = proxy.parse_args([
            'workspace', 'stage', '--codex-native', '--token-collector', '--token-audit', '--work-claims',
            '--token-audit-port', '35109', '--token-audit-source', 'codex',
            '--token-audit-client', 'codex',
        ])
        for root, failure in ((False, None), (True, None), (True, OSError('input failed'))):
            def read_line():
                if root:
                    delivery.call_args.kwargs['on_root']()
                    delivery.call_args.kwargs['on_root']()
                if failure:
                    raise failure
                return ''

            def release_claims():
                if root:
                    self.assertFalse(thread.call_args.kwargs['args'][4].is_set())

            with self.subTest(root=root, failure=failure), \
                    mock.patch.object(proxy.sys, 'stdin'), mock.patch.object(proxy.sys, 'stdout'), \
                    mock.patch.object(proxy.os, 'fdopen', side_effect=[
                        mock.Mock(readline=mock.Mock(side_effect=read_line)), io.StringIO()]), \
                    mock.patch.object(proxy, 'parse_args', return_value=arguments), \
                    mock.patch.object(proxy, 'prune_token_audit_storage'), \
                    mock.patch.object(proxy, 'prune_inbox'), \
                    mock.patch.object(proxy, 'get_credentials', return_value={}), \
                    mock.patch.object(proxy, 'login', return_value={'uclusion_token': 'fixture'}), \
                    mock.patch.object(proxy.threading, 'Thread') as thread, \
                    mock.patch.object(proxy, 'record_demo_input'), \
                    mock.patch.object(native, 'NativeCodexDelivery') as delivery, \
                    mock.patch.object(proxy, 'WorkClaimsManager') as claims, \
                    mock.patch.object(audit, 'TokenAuditProxy') as collector, \
                    redirect_stderr(io.StringIO()):
                claims.return_value.release_all_on_exit.side_effect = release_claims
                if failure is None:
                    proxy.main()
                else:
                    with self.assertRaises(SystemExit):
                        proxy.main()
                delivery.return_value.close.assert_called_once()
                claims.return_value.release_all_on_exit.assert_called_once()
                collector.assert_called_once()
                self.assertFalse(collector.call_args.kwargs['publish_notes'])
                collector.return_value.close.assert_called_once()
                if root:
                    thread.assert_called_once()
                    self.assertTrue(thread.call_args.kwargs['args'][4].is_set())
                    collector.return_value.start_publishing.assert_called_once()
                else:
                    thread.assert_not_called()
                    collector.return_value.start_publishing.assert_not_called()

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

    def test_collector_records_bytes_and_repeat_fingerprints_without_a_file(self):
        import uclusionTokenAudit as audit
        recorded = []
        recorder = proxy.ResponseStats(None)
        recorder.bind_collector(recorded.append)
        self.addCleanup(recorder.close)
        request = {
            'method': 'tools/call',
            'params': {
                'name': 'get_job',
                '_meta': {'threadId': 'private-thread'},
                'arguments': {'short_code_id': 'R-example-1', 'thread_only': True},
            },
        }
        for _repeat in range(2):
            recorder.set_request(request)
            with redirect_stdout(io.StringIO()):
                proxy.write_message(READ_RESULT, stats=recorder)
        self.assertEqual([], list(self.directory.iterdir()))
        self.assertIsNone(recorded[0]['repeat_of'])
        self.assertEqual(recorded[0]['read_number'], recorded[1]['repeat_of'])
        self.assertTrue(recorded[0]['content_sha256'])
        self.assertEqual(recorded[0]['content_sha256'], recorded[1]['content_sha256'])
        self.assertGreater(recorded[0]['jsonrpc_utf8_bytes'], 0)
        self.assertGreater(recorded[0]['text_utf8_bytes'], 0)
        self.assertNotIn(READ_RESULT['result']['content'][0]['text'], json.dumps(recorded))

        database = self.directory / 'audit.sqlite3'
        with mock.patch.dict(os.environ, {
            'UCLUSION_TOKEN_AUDIT_DB': str(database),
            'UCLUSION_TOKEN_AUDIT_SALT': str(self.directory / 'audit.salt'),
        }):
            store = audit.AuditStore('stage', 'workspace-1')
            counts = {
                'input_tokens': 11, 'cached_input_tokens': 2, 'cache_write_tokens': 0,
                'output_tokens': 3, 'reasoning_output_tokens': 1,
                'cache_read_tokens': 4, 'cache_creation_tokens': 0,
                'normalized_total_tokens': 14, 'provider_total_tokens': 20,
            }
            for client in ('claude', 'codex'):
                self.assertTrue(store.record_usage(
                    client, 'session', 'event-1', counts, 'otel',
                ))
            def usage_row(client):
                connection = store.connect()
                try:
                    return dict(connection.execute(
                        "SELECT input_tokens, cached_input_tokens, cache_write_tokens, "
                        "output_tokens, reasoning_output_tokens, cache_read_tokens, "
                        "cache_creation_tokens, provider_total_tokens, normalized_total_tokens "
                        "FROM token_audit_usage WHERE client=?",
                        (client,),
                    ).fetchone())
                finally:
                    connection.close()

            before = {client: usage_row(client) for client in ('claude', 'codex')}
            for client in ('claude', 'codex'):
                self.assertTrue(store.record_response_measurement(client, recorded[0]))
                self.assertTrue(store.record_response_measurement(client, recorded[1]))
            self.assertFalse(store.record_response_measurement('cursor', recorded[0]))
            self.assertEqual([], store.response_measurements('cursor'))
            for client in ('claude', 'codex'):
                rows = store.response_measurements(client)
                self.assertEqual(recorded[0]['jsonrpc_utf8_bytes'], rows[0]['jsonrpc_utf8_bytes'])
                self.assertEqual(recorded[0]['text_utf8_bytes'], rows[0]['text_utf8_bytes'])
                self.assertEqual(recorded[0]['content_sha256'], rows[0]['content_sha256'])
                self.assertIsNone(rows[0]['repeat_of'])
                self.assertEqual(recorded[1]['repeat_of'], rows[1]['repeat_of'])
                self.assertEqual(recorded[0]['content_sha256'], rows[1]['content_sha256'])
                after = usage_row(client)
                self.assertEqual(before[client], after)
                self.assertEqual(20, after['provider_total_tokens'])
                self.assertEqual(11, after['input_tokens'])

    def test_failed_collector_write_still_returns_the_mcp_response(self):
        recorder = proxy.ResponseStats(None)
        recorder.bind_collector(mock.Mock(side_effect=OSError('private path or body')))
        self.addCleanup(recorder.close)
        recorder.set_request({'method': 'tools/list'})
        stdout = io.StringIO()
        with redirect_stdout(stdout), redirect_stderr(io.StringIO()):
            proxy.write_message(JSONRPC_RESULT, stats=recorder)
            proxy.write_message(JSONRPC_RESULT, stats=recorder)
        self.assertEqual(
            [JSONRPC_RESULT, JSONRPC_RESULT],
            [json.loads(line) for line in stdout.getvalue().splitlines()],
        )
        self.assertEqual([], list(self.directory.iterdir()))

    def test_a_statistics_file_still_receives_rows_when_the_collector_is_bound(self):
        recorded = []
        recorder = self.recorder()
        recorder.bind_collector(recorded.append)
        with redirect_stdout(io.StringIO()):
            proxy.write_message(JSONRPC_RESULT, stats=recorder)
        self.assertEqual(1, len(self.rows()))
        self.assertEqual(self.rows()[0]['jsonrpc_utf8_bytes'], recorded[0]['jsonrpc_utf8_bytes'])

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
                'tool_response': CLAUDE_READ_RESPONSE}
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
                   'tool_input': {'short_code_id': 'R-example-1'}, 'tool_response': CLAUDE_READ_RESPONSE}
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
        request = {'method': 'tools/call', 'params': {'name': 'get_job',
            'arguments': {'short_code_id': 'J-secret-1'}, '_meta': {'threadId': 'private-thread'}}}
        prior = self.recorder(request)
        with redirect_stdout(io.StringIO()):
            proxy.write_message(READ_RESULT, stats=prior)
        prior.close()
        original = self.path.read_bytes()
        original_rows = self.rows()
        recorder = self.recorder(request)
        output = io.StringIO()
        with redirect_stdout(output):
            proxy.write_message(READ_RESULT, stats=recorder)
        self.assertEqual(READ_RESULT, json.loads(output.getvalue()))
        self.assertTrue(self.path.read_bytes().startswith(original))
        rows = self.rows()
        self.assertEqual(original_rows, rows[:-1])
        self.assertEqual('ok', rows[-1]['status'])
        self.assertEqual(len(output.getvalue().encode()), rows[-1]['jsonrpc_utf8_bytes'])
        self.assertEqual(rows[0]['read_number'], rows[-1]['repeat_of'])
        self.assertEqual(request['params']['arguments'], rows[-1]['read_selector'])
        self.assertNotIn(READ_RESULT['result']['content'][0]['text'], self.path.read_text())

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



class ServedCatalogAccountingTests(unittest.TestCase):
    def test_catalog_storage_failure_preserves_json_and_sse_success_responses(self):
        import sqlite3
        import threading
        from types import SimpleNamespace
        import uclusionCodexNative as native
        import uclusionTokenAudit as audit
        for transport in ('json', 'sse'):
            with self.subTest(transport=transport):
                delivery = native.NativeCodexDelivery.__new__(native.NativeCodexDelivery)
                delivery.lock = threading.RLock()
                store = SimpleNamespace(record_catalog=mock.Mock(side_effect=sqlite3.OperationalError('private failure')))
                delivery.collectors = {'root': SimpleNamespace(primary_session_fp='session', store=store)}
                output, errors = io.StringIO(), io.StringIO()
                with mock.patch.object(audit, 'load_token_manifest', return_value={}), \
                        redirect_stdout(output), redirect_stderr(errors):
                    if transport == 'json':
                        proxy.handle_json_response(_BodyResponse(json.dumps(JSONRPC_RESULT)),
                            response_observer=delivery.observe_catalog)
                    else:
                        proxy.handle_sse_response(_LineResponse(['data: ' + json.dumps(JSONRPC_RESULT) + '\n']),
                            response_observer=delivery.observe_catalog)
                self.assertEqual(JSONRPC_RESULT, json.loads(output.getvalue()))
                self.assertEqual(1, store.record_catalog.call_count)
                self.assertTrue(errors.getvalue())
                self.assertNotIn('private failure', errors.getvalue())

    def test_json_and_sse_observe_exact_outgoing_catalog_for_all_options(self):
        catalog = {"jsonrpc": "2.0", "id": 7, "result": {"tools": [
            {"name": "get_job", "description": "Current work", "inputSchema": {"type": "object"}},
            {"name": "end_job_audit", "inputSchema": {"properties": {"job_id": {}, "finalization": {"type": "object"}}}}]}}
        for handler, body in ((proxy.handle_json_response, json.dumps(catalog)),
                              (proxy.handle_sse_response, "data: " + json.dumps(catalog) + "\n")):
            for enabled in (True, False):
                for claims in (True, False):
                    observed, written = [], []
                    response = _BodyResponse(body) if handler is proxy.handle_json_response else _LineResponse([body])
                    with mock.patch.object(proxy, "write_message", side_effect=lambda message, **kwargs: written.append(message)):
                        handler(response, token_audit_enabled=enabled, work_claims_enabled=claims,
                                response_observer=observed.append)
                    self.assertEqual(written, observed)
                    names = [t["name"] for t in observed[0]["result"]["tools"]]
                    self.assertEqual(enabled, "end_job_audit" in names)
                    self.assertEqual(claims, "claim_work" in names)

    def test_served_definition_manifest_lookup_preserves_historical_counts(self):
        import uclusionTokenAudit as audit
        old = {"name": "get_job", "description": "Old", "inputSchema": {}}
        current = {"name": "get_job", "description": "Current", "inputSchema": {}}
        old_key = audit.tool_definition_key(old["name"], old["description"], {})
        key = audit.tool_definition_key(current["name"], current["description"], {})
        manifest = {"tools": {old_key: {"name": "get_job", "tokens": {"openai": 300}},
                              key: {"name": "get_job", "tokens": {"openai": 400}}}}
        report = audit.catalog_token_report([current], manifest, "openai")
        self.assertEqual(400, report["definition_tokens"])
        self.assertEqual([key], report["definition_fingerprints"])
        self.assertEqual("unknown", report["provider_injection"])
        self.assertEqual(2, len(manifest["tools"]))


SYNTHETIC_ROOT = 'synthetic-root'
ROOT_ARGUMENTS = [
    'workspace-1', 'stage', '--codex-native', '--token-audit', '--token-collector',
    '--token-audit-port', '35109', '--token-audit-source', 'codex',
    '--token-audit-client', 'codex',
]


def _root_call(request_id, name, arguments):
    return json.dumps({'jsonrpc': '2.0', 'id': request_id, 'method': 'tools/call', 'params': {
        'name': name, 'arguments': arguments,
        '_meta': {'threadId': SYNTHETIC_ROOT,
                  'x-codex-turn-metadata': {'turn_id': 'synthetic-turn'}},
    }})


def _end_job_audit(request_id):
    return _root_call(request_id, 'end_job_audit', {
        'job_id': 'J-example-1', 'audit_run_id': 'synthetic-run',
        'handoff_type': 'review_requested',
    })


def _get_job(request_id):
    return json.dumps({'jsonrpc': '2.0', 'id': request_id, 'method': 'tools/call', 'params': {
        'name': 'get_job', 'arguments': {'short_code_id': 'J-example-1'}}})


class _SyntheticAppServer:
    """The Codex app-server, reporting this MCP instance on one independent root."""

    def __init__(self, delivery, path):
        self.version = '1+' + delivery.identity + '.' + delivery.scope_marker
        self.thread = {'id': SYNTHETIC_ROOT, 'threadSource': 'user', 'parentThreadId': None,
                       'canAcceptDirectInput': True, 'status': {'type': 'active'}, 'path': path}

    def request(self, method, params):
        if method == 'thread/loaded/list':
            return {'data': [SYNTHETIC_ROOT], 'nextCursor': None}
        if method == 'thread/list':
            return {'data': [{'id': SYNTHETIC_ROOT}], 'nextCursor': None}
        if method == 'mcpServerStatus/list':
            servers = [{'runtimeStatus': 'connected', 'serverInfo': {'version': self.version}}]
            return {'data': servers if params['serverName'] == 'uclusion' else [],
                    'nextCursor': None}
        if method == 'thread/read':
            thread = dict(self.thread)
            if params.get('includeTurns'):
                thread['turns'] = [{'id': 'synthetic-turn', 'status': 'inProgress', 'items': []}]
            return {'thread': thread}
        if method == 'thread/resume':
            return {'thread': dict(self.thread)}
        raise AssertionError('Unexpected app-server request ' + method)

    def close(self):
        pass


class _LockedAgentInbox:
    """An inbox connection whose agent identity write finds the database locked."""

    def __init__(self, connection):
        object.__setattr__(self, '_connection', connection)

    def execute(self, sql, *args):
        if 'INTO codex_native_agents' in sql:
            raise sqlite3.OperationalError('database is locked')
        return self._connection.execute(sql, *args)

    def __enter__(self):
        self._connection.__enter__()
        return self

    def __exit__(self, *exc_info):
        return self._connection.__exit__(*exc_info)

    def __getattr__(self, name):
        return getattr(self._connection, name)

    def __setattr__(self, name, value):
        setattr(self._connection, name, value)


class LocalRequestFailureTests(unittest.TestCase):
    """A failure in the proxy's own handling of one request answers only that request."""

    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.home = directory.name
        environment = mock.patch.dict(os.environ, {
            'UCLUSION_HOME': self.home, 'UCLUSION_TOKEN_AUDIT_HOME': self.home,
            'CODEX_HOME': self.home,
        })
        environment.start()
        self.addCleanup(environment.stop)
        for name in ('UCLUSION_TOKEN_AUDIT_DB', 'UCLUSION_TOKEN_AUDIT_SALT',
                     'UCLUSION_CODEX_NATIVE_SOCKET', proxy.DEMO_EVIDENCE_ENV):
            os.environ.pop(name, None)
        self.deliveries = []
        self.forwarded = []
        self.store_calls = []

    def backend(self, url, headers, body, refresh):
        request = json.loads(body)
        self.forwarded.append(request['params']['name'])
        response = _BodyResponse(json.dumps({'jsonrpc': '2.0', 'id': request['id'], 'result': {
            'content': [{'type': 'text', 'text': 'Backend answer.'}]}}))
        response.headers = {'Content-Type': 'application/json'}
        return response, None

    def watch_store(self, delivery, locked=False):
        """Record each audit store connection, optionally failing the first one."""
        store = delivery.collectors[SYNTHETIC_ROOT].store
        connect = store.connect

        def watched_connect():
            self.store_calls.append(sys._getframe(1).f_code.co_name)
            if locked and len(self.store_calls) == 1:
                raise sqlite3.OperationalError('database is locked')
            return connect()
        store.connect = watched_connect

    def run_proxy(self, argv, lines, prepare=None):
        """Run the real main loop over stdin lines and return replies and exit status."""
        import uclusionCodexNative as native
        import uclusionTokenAudit as audit
        test = self
        streams = [io.StringIO(''.join(line + '\n' for line in lines)), io.StringIO()]
        outgoing = streams[1]
        real_fdopen = os.fdopen

        def fdopen(descriptor, *args, **kwargs):
            # main() reopens the mocked stdin and stdout. Audit storage keeps real files.
            if isinstance(descriptor, int):
                return real_fdopen(descriptor, *args, **kwargs)
            return streams.pop(0)

        class RegisteredDelivery(native.NativeCodexDelivery):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                # Threads are mocked, so this stands in for the delivery thread
                # after it confirms an independent root: the real scan
                # registers and joins that root's collector.
                self.client = _SyntheticAppServer(self, os.path.join(test.home, 'root.jsonl'))
                self.healthy.set()
                self._scan()
                self.registered = (SYNTHETIC_ROOT in self.joined_roots
                                   and SYNTHETIC_ROOT in self.collectors)
                test.deliveries.append(self)
                if prepare is not None:
                    prepare(self)

        arguments = proxy.parse_args(argv)
        stderr = io.StringIO()
        status = None
        with mock.patch.object(proxy.sys, 'stdin'), mock.patch.object(proxy.sys, 'stdout'), \
                mock.patch.object(proxy.os, 'fdopen', side_effect=fdopen), \
                mock.patch.object(proxy, 'parse_args', return_value=arguments), \
                mock.patch.object(proxy, 'prune_token_audit_storage'), \
                mock.patch.object(proxy, 'prune_inbox'), \
                mock.patch.object(proxy, 'get_credentials', return_value={}), \
                mock.patch.object(proxy, 'login', return_value={'uclusion_token': 'test-token'}), \
                mock.patch.object(proxy.threading, 'Thread'), \
                mock.patch.object(proxy, 'record_demo_input'), \
                mock.patch.object(native, 'NativeCodexDelivery', RegisteredDelivery), \
                mock.patch.object(audit, 'TokenAuditProxy'), \
                mock.patch.object(proxy, 'post_to_mcp_refreshing_token', side_effect=self.backend), \
                redirect_stderr(stderr):
            try:
                proxy.main()
            except SystemExit as exited:
                status = exited.code
        self.stderr = stderr.getvalue()
        return [json.loads(line) for line in outgoing.getvalue().splitlines()], status

    def assert_root_registered(self):
        self.assertEqual(1, len(self.deliveries))
        self.assertTrue(self.deliveries[0].registered)

    def test_root_collector_storage_failure_rejects_only_the_audit_call(self):
        replies, status = self.run_proxy(
            ROOT_ARGUMENTS, [_end_job_audit(1), _get_job(2)],
            prepare=lambda delivery: self.watch_store(delivery, locked=True))
        self.assertIsNone(status, 'The proxy exited instead of serving the next request')
        self.assert_root_registered()
        self.assertEqual('bind_session', self.store_calls[0])
        self.assertEqual([1, 2], [reply['id'] for reply in replies])
        self.assertEqual({
            'code': -32002,
            'message': 'Token audit collector is unavailable for this connection '
                       '{"error":"OperationalError"}',
            'data': {'error': 'OperationalError'},
        }, replies[0]['error'])
        self.assertIn('result', replies[1])
        self.assertEqual(['get_job'], self.forwarded)
        self.assertIn('Uclusion token collector could not bind this audit call '
                      '(OperationalError: database is locked).\n', self.stderr)

    def test_root_collector_with_a_working_store_forwards_the_audit_call(self):
        replies, status = self.run_proxy(
            ROOT_ARGUMENTS, [_end_job_audit(1), _get_job(2)], prepare=self.watch_store)
        self.assertIsNone(status)
        self.assert_root_registered()
        self.assertEqual('bind_session', self.store_calls[0])
        self.assertEqual([1, 2], [reply['id'] for reply in replies])
        self.assertTrue(all('result' in reply for reply in replies))
        self.assertEqual(['end_job_audit', 'get_job'], self.forwarded)
        self.assertNotIn('could not', self.stderr)

    def test_root_subscription_storage_failure_answers_only_that_request(self):
        import uclusionCodexNative as native
        open_inbox = native.open_inbox
        subscription = _root_call(1, 'set_agent_subscription', {'short_code_id': 'J-example-1'})
        with mock.patch.object(native, 'open_inbox',
                               side_effect=lambda: _LockedAgentInbox(open_inbox())):
            replies, status = self.run_proxy(ROOT_ARGUMENTS, [subscription, _get_job(2)])
        self.assertIsNone(status, 'The proxy exited instead of serving the next request')
        self.assert_root_registered()
        self.assertEqual([1, 2], [reply['id'] for reply in replies])
        self.assertEqual({
            'code': -32603,
            'message': 'Uclusion proxy could not handle this request locally (OperationalError)',
            'data': {'error': 'OperationalError'},
        }, replies[0]['error'])
        self.assertIn('result', replies[1])
        self.assertEqual(['get_job'], self.forwarded)
        self.assertIn('Uclusion proxy could not handle tools/call set_agent_subscription locally '
                      '(OperationalError: database is locked).\n', self.stderr)

    def test_non_object_message_is_skipped_without_a_response(self):
        replies, status = self.run_proxy(['workspace-1', 'stage'], ['[]', _get_job(2)])
        self.assertIsNone(status, 'The proxy exited instead of serving the next request')
        self.assertEqual([2], [reply['id'] for reply in replies])
        self.assertIn('result', replies[0])
        self.assertEqual(['get_job'], self.forwarded)
        self.assertEqual('Invalid JSON-RPC message from stdin: list is not an object\n',
                         self.stderr)


if __name__ == '__main__':
    unittest.main()
