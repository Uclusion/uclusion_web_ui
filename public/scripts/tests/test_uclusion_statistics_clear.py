"""Offline fixtures for paired measurement resets; execution requires approval."""

import hashlib
import io
import json
import os
import stat
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from datetime import datetime
from pathlib import Path
from unittest import mock


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS_DIR))

import uclusionCLI as cli
import uclusionMCPProxy as proxy
import uclusionTokenAudit as audit


BOOTSTRAP = ('<!-- uclusion-workflow:v1 -->\n'
             '# Uclusion fixture\nRetained Uclusion instructions.\n'
             '<!-- /uclusion-workflow:v1 -->')
MANIFEST = {
    'schema_version': 1,
    'artifacts': {hashlib.sha256(BOOTSTRAP.encode()).hexdigest(): {
        'tokens': {'claude': 7, 'openai': 7},
    }},
    'tools': {},
    'bytes_per_token': {'claude': 4, 'openai': 4},
}
READ_RESULT = {'result': {'content': [{'type': 'text', 'text': 'Unchanged fixture note.'}]}}


def utc(second):
    return f'2026-10-08T00:00:{second:02d}Z'


def epoch(second):
    return datetime.fromisoformat(utc(second).replace('Z', '+00:00')).timestamp()


@unittest.skipUnless(proxy.fcntl is not None and hasattr(os, 'O_NOFOLLOW'),
                     'Existing private-file support requires POSIX')
class StatisticsClearFixtures(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.directory = Path(directory.name)
        self.path = self.directory / 'responses.jsonl'

    def rows(self, path=None):
        return [json.loads(line) for line in (path or self.path).read_text().splitlines()]

    def recorder(self, root='root'):
        recorder = proxy.ResponseStats(str(self.path))
        self.addCleanup(recorder.close)
        recorder.set_request({'method': 'tools/call', 'params': {
            'name': 'get_job', '_meta': {'threadId': root},
            'arguments': {'short_code_id': 'R-fixture-1', 'thread_only': True},
        }})
        return recorder

    def usage(self, arguments, second=20):
        output, errors = io.StringIO(), io.StringIO()
        with mock.patch.object(proxy.ResponseStats, '_utc_now', return_value=utc(second)), \
                mock.patch.object(cli, 'load_token_audit_module', return_value=audit), \
                mock.patch.object(audit, 'load_token_manifest', return_value=MANIFEST), \
                redirect_stdout(output), redirect_stderr(errors):
            status = cli.cmd_usage(cli.parse_args(['-e', 'stage', 'usage', *arguments]))
        return status, output.getvalue(), errors.getvalue()

    def append(self, path, records):
        with path.open('a') as handle:
            for record in records:
                handle.write(json.dumps(record) + '\n')

    def codex_usage(self, second, response):
        return {'type': 'token_usage_record', 'timestamp': utc(second), 'payload': {
            'response_id': response, 'usage': {'input_tokens': 100, 'output_tokens': 0},
        }}

    def native_logs(self):
        root = self.directory / 'sessions' / 'rollout-2026-root.jsonl'
        root.parent.mkdir()
        child = root.with_name('rollout-2026-child.jsonl')
        self.append(root, [
            {'type': 'session_meta', 'timestamp': utc(0),
             'payload': {'id': 'root', 'timestamp': utc(0), 'cwd': str(self.directory)}},
            {'type': 'response_item', 'timestamp': utc(1), 'payload': {
                'type': 'message', 'role': 'developer', 'content': BOOTSTRAP}},
            {'type': 'response_item', 'timestamp': utc(5), 'payload': {
                'type': 'function_call', 'name': 'spawn_agent', 'call_id': 'spawn-child',
                'arguments': json.dumps({'fork_turns': 'none'})}},
            {'type': 'response_item', 'timestamp': utc(6), 'payload': {
                'type': 'function_call_output', 'call_id': 'spawn-child',
                'output': json.dumps({'agent_id': 'child'})}},
            self.codex_usage(9, 'pre-window'),
            self.codex_usage(10, 'shared-request'),
            self.codex_usage(10, 'shared-request'),
            self.codex_usage(20, 'first-endpoint'),
            self.codex_usage(21, 'after-first-endpoint'),
            self.codex_usage(30, 'second-cutoff'),
            self.codex_usage(40, 'second-endpoint'),
        ])
        self.append(child, [
            {'type': 'session_meta', 'timestamp': utc(6), 'payload': {
                'id': 'child', 'parent_thread_id': 'root', 'timestamp': utc(6)}},
            {'type': 'response_item', 'timestamp': utc(7), 'payload': {
                'type': 'message', 'role': 'developer', 'content': BOOTSTRAP}},
            self.codex_usage(15, 'child-first'),
            self.codex_usage(35, 'child-second'),
            self.codex_usage(41, 'child-after-endpoint'),
        ])
        return root, child

    def test_successive_paired_windows_before_session_and_retained_resends(self):
        args = ['--clear', '--response-stats', str(self.path), '--json']
        with mock.patch.object(cli, 'find_session_log') as find, \
                mock.patch.object(cli, 'load_token_audit_module') as load, \
                mock.patch.object(proxy.ResponseStats, '_utc_now', return_value=utc(10)), \
                redirect_stdout(io.StringIO()) as output:
            self.assertEqual(0, cli.cmd_usage(cli.parse_args(['-e', 'stage', 'usage', *args])))
            find.assert_not_called()
            load.assert_not_called()
        first_marker = self.rows()[0]
        self.assertEqual(first_marker['reset_id'], json.loads(output.getvalue())['measurement']['reset_id'])
        self.assertEqual(0o600, stat.S_IMODE(self.path.stat().st_mode))
        recorder = self.recorder()
        recorder.record(READ_RESULT, b'first-window')
        root, child = self.native_logs()
        root_before, child_before = root.read_bytes(), child.read_bytes()
        report_arguments = ['--response-stats', str(self.path), '--session', str(root)]
        status, encoded, errors = self.usage([*report_arguments, '--json'])
        self.assertEqual((0, ''), (status, errors))
        first = json.loads(encoded)
        self.assertEqual(3, first['model_requests'])
        self.assertEqual(300, first['provider_total_tokens'])
        bootstrap = next(item for item in first['items'] if item['line'] == 'bootstrap')
        self.assertEqual((0, 21), (bootstrap['arrival_tokens'], bootstrap['total_tokens']))
        self.assertEqual('complete', first['coverage']['inherited_context'])
        self.assertEqual(1, first['coverage']['descendants_included'])
        self.assertEqual(1, first['response_stats']['response_rows'])
        self.assertEqual({'session_log': str(root), 'response_stats': str(self.path)},
                         first['measurement']['sources'])
        status, text, errors = self.usage(report_arguments)
        self.assertEqual((0, ''), (status, errors))
        for value in (first_marker['reset_id'], utc(10), utc(20), str(root), str(self.path)):
            self.assertIn(value, text)
        self.assertEqual(root_before, root.read_bytes())
        self.assertEqual(child_before, child.read_bytes())

        # Saved telemetry may arrive after an earlier report with an in-window timestamp.
        self.append(root, [self.codex_usage(19, 'late-root')])
        self.append(child, [self.codex_usage(18, 'late-child')])
        status, encoded, _errors = self.usage([*report_arguments, '--json'])
        self.assertEqual(0, status)
        late = json.loads(encoded)
        self.assertEqual((5, 500), (late['model_requests'], late['provider_total_tokens']))
        saved_report = self.directory / 'saved-report.json'
        saved_report.write_text(encoded)
        old_rows = self.path.read_bytes()
        status, clear_text, errors = self.usage(args[:-1], second=30)
        self.assertEqual((0, ''), (status, errors))
        second_marker = self.rows()[-1]
        self.assertNotEqual(first_marker['reset_id'], second_marker['reset_id'])
        self.assertIn(second_marker['reset_id'], clear_text)
        self.assertTrue(self.path.read_bytes().startswith(old_rows))
        recorder.record(READ_RESULT, b'second-window')
        status, encoded, _errors = self.usage([*report_arguments, '--json'], second=40)
        second = json.loads(encoded)
        self.assertEqual(0, status)
        self.assertEqual((3, 300), (second['model_requests'], second['provider_total_tokens']))
        self.assertEqual((second_marker['reset_id'], utc(30), utc(40)), tuple(
            second['measurement'][key] for key in ('reset_id', 'started_at', 'ended_at')))
        self.assertEqual(1, second['response_stats']['response_reads']['repeat_rows'])
        status, text, errors = self.usage(report_arguments, second=40)
        self.assertEqual((0, ''), (status, errors))
        for value in (second_marker['reset_id'], utc(30), utc(40), str(root), str(self.path)):
            self.assertIn(value, text)
        self.assertEqual(late['measurement'],
                         json.loads(saved_report.read_text())['measurement'])
        with mock.patch.object(cli, 'claude_session_logs', return_value=[]), \
                mock.patch.object(cli, 'codex_session_logs', return_value=[str(root)]):
            self.assertEqual(str(root), cli.find_session_log())
            self.assertEqual(str(root), cli.find_session_log('root'))
            status, plain, _errors = self.usage(['--json'])
            self.assertEqual(0, status)
            self.assertGreater(json.loads(plain)['model_requests'], second['model_requests'])
            self.assertNotIn('measurement', json.loads(plain))

        # Claude chunks belonging to one request remain grouped inside the window.
        claude = self.directory / 'claude.jsonl'
        self.append(claude, [{'type': 'attachment', 'timestamp': utc(1), 'sessionId': 'claude',
                             'attachment': {'type': 'instructions', 'files': [{'content': BOOTSTRAP}]}}])
        for second, identity in ((10, 'shared'), (15, 'shared'), (20, 'next')):
            self.append(claude, [{'type': 'assistant', 'timestamp': utc(second), 'message': {
                'id': identity, 'usage': {'input_tokens': 50, 'output_tokens': 1}, 'content': []}}])
        grouped = audit.breakdown_session_log(str(claude), MANIFEST, window=(epoch(10), epoch(20)))
        self.assertEqual((2, 102), (grouped['model_requests'], grouped['provider_total_tokens']))
        bootstrap = next(item for item in grouped['items'] if item['line'] == 'bootstrap')
        self.assertEqual((0, 14), (bootstrap['arrival_tokens'], bootstrap['total_tokens']))

    def test_existing_and_new_writers_keep_context_and_invocation_history(self):
        existing = self.recorder()
        existing.context_event('root', 'startup')
        existing.record(READ_RESULT, b'old-wire')
        before = self.rows()[-1]
        hook = {'session_id': 'claude', 'hook_event_name': 'PostToolUse',
                'tool_name': 'mcp__uclusion__get_job', 'tool_use_id': 'call-before-reset',
                'tool_input': {'short_code_id': 'R-fixture-1'}, 'tool_response': READ_RESULT['result']}
        existing.claude_hook({'session_id': 'claude', 'hook_event_name': 'SessionStart', 'source': 'startup'})
        existing.claude_hook(hook)
        hook_before = self.rows()[-1]
        earlier = self.path.read_bytes()
        status, _output, _errors = self.usage(['--clear', '--response-stats', str(self.path)], second=10)
        self.assertEqual(0, status)
        self.assertTrue(self.path.read_bytes().startswith(earlier))
        existing.record(READ_RESULT, b'existing-wire')
        self.assertEqual(before['read_number'], self.rows()[-1]['repeat_of'])
        self.assertEqual('observed', self.rows()[-1]['context_coverage'])
        new = self.recorder()
        new.record(READ_RESULT, b'new-wire')
        self.assertEqual(self.rows()[-2]['read_number'], self.rows()[-1]['repeat_of'])
        count = len(self.rows())
        for writer in (existing, new):
            writer.claude_hook(hook)
        self.assertEqual(count, len(self.rows()))
        new.claude_hook({**hook, 'tool_use_id': 'call-after-reset'})
        self.assertEqual(hook_before['read_number'], self.rows()[-1]['repeat_of'])
        new.set_request({'method': 'tools/call', 'params': {
            'name': 'get_job', '_meta': {'threadId': 'different-conversation'},
            'arguments': {'short_code_id': 'R-fixture-1', 'thread_only': True}}})
        new.record(READ_RESULT, b'separate-wire')
        self.assertIsNone(self.rows()[-1]['repeat_of'])
        existing.context_event('root', 'compact')
        existing.record(READ_RESULT, b'compacted-wire')
        self.assertIsNone(self.rows()[-1]['repeat_of'])
        new.claude_hook({'session_id': 'claude', 'hook_event_name': 'SessionStart', 'source': 'clear'})
        new.claude_hook({**hook, 'tool_use_id': 'after-conversation-clear'})
        self.assertIsNone(self.rows()[-1]['repeat_of'])
        summary = proxy.ResponseStats.measurement_summary(str(self.path))['response_stats']
        self.assertEqual(4, summary['response_rows'])
        self.assertEqual(2, summary['claude_hook_reads']['rows'])
        self.assertEqual(1, summary['claude_hook_reads']['repeat_rows'])
        self.assertEqual(2, summary['response_reads']['repeat_rows'])
        self.assertEqual(sum(len(wire) for wire in
                             (b'existing-wire', b'new-wire', b'separate-wire', b'compacted-wire')),
                         summary['jsonrpc_utf8_bytes'])

        no_marker = self.directory / 'whole-history.jsonl'
        no_marker.write_text(json.dumps({'jsonrpc_utf8_bytes': 9, 'text_utf8_bytes': 4}) + '\n')
        no_marker.chmod(0o600)
        summary = proxy.ResponseStats.measurement_summary(str(no_marker))
        self.assertIsNone(summary['measurement']['reset_id'])
        self.assertEqual(9, summary['response_stats']['jsonrpc_utf8_bytes'])
        token_reader = mock.Mock()
        token_reader.breakdown_session_log.return_value = {'status': 'available'}
        with mock.patch.object(cli, 'find_session_log', return_value='selected-log'), \
                mock.patch.object(cli, 'load_token_audit_module', return_value=token_reader), \
                redirect_stdout(io.StringIO()):
            self.assertEqual(0, cli.cmd_usage(cli.parse_args([
                '-e', 'stage', '--response-stats', str(no_marker), 'usage', '--json'])))
        token_reader.breakdown_session_log.assert_called_once_with('selected-log', window=None)

    def test_rejected_destinations_and_malformed_lock_write_failures_never_announce_reset(self):
        with redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit):
                cli.parse_args(['-e', 'stage', 'usage', '--clear'])

        def rejected(path):
            status, output, errors = self.usage(['--clear', '--response-stats', str(path), '--json'])
            self.assertEqual(1, status)
            self.assertEqual('', output)
            self.assertIn('Cannot reset measurement windows', errors)

        target = self.directory / 'target'
        target.write_text('untouched')
        symlink = self.directory / 'link'
        symlink.symlink_to(target)
        rejected(symlink)
        self.assertEqual('untouched', target.read_text())
        public = self.directory / 'public.jsonl'
        public.touch(mode=0o644)
        public.chmod(0o644)
        rejected(public)
        self.assertEqual(b'', public.read_bytes())
        rejected(self.directory)
        rejected(self.directory / 'missing-parent' / 'stats.jsonl')
        for index, body in enumerate((b'not-json\n', b'[]\n', b'{}\n', b'{"event":"read"}\n',
                                      b'{"event":"measurement_reset","reset_id":"x","cutoff_utc":"badZ"}\n',
                                      b'{"event":"measurement_reset","reset_id":"x","cutoff_utc":"2026-10-08Z"}\n',
                                      b'{"jsonrpc_utf8_bytes":-1,"text_utf8_bytes":0}\n',
                                      b'{"jsonrpc_utf8_bytes":1,"text_utf8_bytes":0}')):
            with self.subTest(history=body):
                malformed = self.directory / f'malformed-{index}.jsonl'
                malformed.write_bytes(body)
                malformed.chmod(0o600)
                rejected(malformed)
                self.assertEqual(body, malformed.read_bytes())
                status, output, errors = self.usage(['--response-stats', str(malformed), '--json'])
                self.assertEqual((1, ''), (status, output))
                self.assertIn('Cannot read response statistics', errors)
        self.path.touch(mode=0o600)
        with mock.patch.object(proxy.os, 'fstat', side_effect=lambda _fd: type('WrongOwner', (), {
                'st_mode': stat.S_IFREG | 0o600, 'st_uid': os.geteuid() + 1})()):
            rejected(self.path)
        with mock.patch.object(proxy.fcntl, 'flock', side_effect=BlockingIOError('lock held')):
            rejected(self.path)
        self.assertEqual(b'', self.path.read_bytes())
        with mock.patch.object(proxy.os, 'write', side_effect=OSError('write failed')):
            rejected(self.path)
        self.assertEqual(b'', self.path.read_bytes())
        original_write = os.write

        def partial_write(descriptor, encoded):
            return original_write(descriptor, encoded[:10])

        with mock.patch.object(proxy.os, 'write', side_effect=partial_write):
            rejected(self.path)
        self.assertEqual(10, self.path.stat().st_size)
        rejected(self.path)
        unlock_path = self.directory / 'unlock.jsonl'
        with mock.patch.object(proxy.fcntl, 'flock', side_effect=[None, OSError('unlock failed')]):
            rejected(unlock_path)


if __name__ == '__main__':
    unittest.main()
