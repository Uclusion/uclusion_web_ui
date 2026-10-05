"""The Codex demo finishes from a published file, never from terminal prose."""

import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import unittest
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import uclusionCLI as CLI


spec = importlib.util.spec_from_file_location(
    'codex_demo_run', Path(__file__).resolve().parents[1] / 'uclusionInstall.py'
)
INSTALL = importlib.util.module_from_spec(spec)
spec.loader.exec_module(INSTALL)


class CodexDemoRunTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.home = Path(directory.name)
        self.output = io.TextIOWrapper(io.BytesIO(), encoding='utf-8')
        # The owner's first turn reports its thread and ends cleanly.
        self.owner = mock.Mock(pid=1001)
        self.owner.wait.return_value = 0
        self.owner.poll.return_value = 0
        self.first_turn = [{'type': 'thread.started', 'thread_id': 'thread-1'},
                           {'type': 'turn.completed'}]
        self.turns = []
        self.turn_poll = None
        # S-Marketing-107: the demo, not the owner, holds the watch.
        self.watch = mock.Mock(pid=1002)
        self.watch.poll.return_value = None
        self.watch_pipe = None
        self.turn_returncode = 0
        self.terminal = mock.Mock()
        self.terminal.process.poll.return_value = None
        self.report = None
        self.commands = []
        self.session_calls = []

        def session_args(*_args, **kwargs):
            self.session_calls.append(kwargs)
            return [] if kwargs.get('native') else ['-c', 'x=1']

        def start_terminal(command, environment, _log):
            self.commands.append(command)
            self.evaluator_environment = environment
            self.report = Path(environment['UCLUSION_DEMO_REPORT_FILE'])
            return self.terminal

        def popen(command, **kwargs):
            if command[-1] == 'watch':
                # Each run reads its own watch output, and closes it at the end.
                read, self.watch_pipe = os.pipe()
                self.watch.stdout = os.fdopen(read, 'rb', buffering=0)
                self.addCleanup(self.close_watch_pipe, self.watch_pipe, self.watch.stdout)
                return self.watch
            if 'resume' in command:
                turn = mock.Mock(pid=2000 + len(self.turns))
                turn.poll.side_effect = lambda: self.turn_poll
                turn.returncode = self.turn_returncode
                self.turns.append(turn)
                return turn
            for line in self.first_turn:
                text = line if isinstance(line, str) else json.dumps(line)
                kwargs['stdout'].write((text + '\n').encode('utf-8'))
            kwargs['stdout'].flush()
            return self.owner

        patches = [
            mock.patch.object(INSTALL, 'UCLUSION_HOME', str(self.home / '.uclusion')),
            mock.patch.object(INSTALL, 'SYMLINK_DIR', str(self.home / '.local/bin')),
            mock.patch.object(INSTALL, 'CODEX_CONFIG_PATH', str(self.home / 'native-codex/config.toml')),
            mock.patch.object(INSTALL, 'uclusion_home_root', return_value=str(self.home)),
            mock.patch.object(INSTALL, 'demo_codex_environment', return_value={}),
            mock.patch.object(INSTALL, 'demo_codex_session_args', side_effect=session_args),
            mock.patch.object(INSTALL, 'DemoCodexTerminal', side_effect=start_terminal),
            mock.patch.object(INSTALL.subprocess, 'Popen', side_effect=popen),
            mock.patch.object(INSTALL, 'wait_for_owner_watch', return_value=True),
            mock.patch.object(INSTALL, 'stop_demo_session'),
            mock.patch.object(INSTALL.sys, 'stdout', self.output),
        ]
        self.mocks = [patch.start() for patch in patches]
        for patch in reversed(patches):
            self.addCleanup(patch.stop)
        self.watch_ready = self.mocks[-3]
        self.stop = self.mocks[-2]

    @staticmethod
    def close_watch_pipe(write, stdout):
        for close in (lambda: os.close(write), stdout.close):
            try:
                close()
            except OSError:
                pass

    def notify(self, *lines):
        os.write(self.watch_pipe, ''.join(f'{line}\n' for line in lines).encode())

    def owner_commands(self):
        return [call.args[0] for call in INSTALL.subprocess.Popen.call_args_list
                if call.args[0][:2] == ['codex', 'exec']]

    def run_demo(self, **kwargs):
        return INSTALL.run_codex_demo('stage', 'workspace', 'Start J-Demo-1.', **kwargs)

    def test_only_the_evaluator_is_launched_with_statistics(self):
        for stats in (None, '/tmp/demo statistics/eval.jsonl'):
            with self.subTest(stats=stats):
                self.terminal.drain.side_effect = lambda: self.report.write_bytes(b'Report\n')
                self.assertEqual(self.run_demo(response_stats=stats), 0)
                owner_command = self.owner_commands()[-1]
                self.assertNotIn('--response-stats', owner_command)
                self.assertEqual('codex', self.commands[-1][0])
                self.assertEqual(stats, self.session_calls[-1]['response_stats'])
                self.assertNotIn('--response-stats', self.commands[-1])
                self.assertEqual(str(self.report.parent / 'evidence'),
                                 self.evaluator_environment['UCLUSION_DEMO_EVIDENCE_DIR'])
                owner_call = next(call for call in reversed(INSTALL.subprocess.Popen.call_args_list)
                                  if call.args[0][:2] == ['codex', 'exec'])
                self.assertNotIn('UCLUSION_DEMO_EVIDENCE_DIR', owner_call.kwargs['env'])
                self.assertEqual('owner', self.session_calls[-2]['evidence_role'])
                self.assertTrue(self.session_calls[-2]['evidence_dir'].endswith('/evidence'))
                self.assertEqual('evaluator', self.session_calls[-1]['evidence_role'])
                self.assertEqual(self.session_calls[-2]['evidence_dir'],
                                 self.session_calls[-1]['evidence_dir'])

    def test_publication_preserves_bytes_and_stops_both_live_sessions(self):
        report = b'  Evaluation\r\nUnicode: \xe2\x9c\x93\n\n'
        self.terminal.drain.side_effect = lambda: self.report.write_bytes(report)
        self.assertEqual(self.run_demo(), 0)
        self.output.flush()
        # J-all-492: the demo's breakdown follows the evaluator's exact bytes.
        printed = self.output.buffer.getvalue()
        self.assertLess(
            printed.index(report),
            printed.index(b'Uclusion token usage of the evaluating agent'),
        )
        self.assertEqual(report, self.report.read_bytes())
        self.assertTrue((self.report.parent / 'evaluator-tokens.md').is_file())
        self.stop.assert_any_call(self.terminal.process)
        self.stop.assert_any_call(self.watch)
        self.terminal.close.assert_called_once()
        self.assertIn('codex', self.commands[0])

    def test_the_evaluator_is_told_its_owner_is_scripted(self):
        # S-Marketing-88: the owner's records show as the human's, so the
        # evaluator must hear otherwise before it starts and keep them apart.
        self.terminal.drain.side_effect = lambda: self.report.write_bytes(b'Report\n')
        self.assertEqual(self.run_demo(), 0)
        prompt = (self.report.parent / 'evaluator-input.md').read_text()
        self.assertTrue(prompt.startswith(f'Start J-Demo-1. {INSTALL.DEMO_SCRIPTED_OWNER}\n\n'))
        self.assertTrue(prompt.endswith(INSTALL.DEMO_SCRIPT_SEPARATION))

    def test_both_sessions_run_at_the_person_s_choice(self):
        # S-Marketing-93: they pay for the run, so the choice holds for both.
        self.terminal.drain.side_effect = lambda: self.report.write_bytes(b'Report\n')
        self.assertEqual(self.run_demo(model='gpt-6', effort='high'), 0)
        choice = ['-m', 'gpt-6', '-c', 'model_reasoning_effort="high"']
        owner_command = self.owner_commands()[-1]
        self.assertEqual(choice, owner_command[:-1][-4:])
        self.assertEqual('gpt-6', self.session_calls[-1]['model'])
        self.assertEqual('high', self.session_calls[-1]['effort'])
        self.assertNotIn('-c', self.commands[-1])
        prompt = (self.report.parent / 'evaluator-input.md').read_text()
        self.assertIn(INSTALL.DEMO_EFFORT_NOTE, prompt)

    def test_draft_and_previous_run_do_not_signal_completion(self):
        old = self.home / '.uclusion/demo-runs/old/evaluation.md'
        old.parent.mkdir(parents=True)
        old.write_text('old report')
        checks = []

        def drain():
            checks.append(True)
            if len(checks) == 1:
                self.report.with_suffix('.partial').write_text('draft')
            else:
                self.report.write_text('complete report')

        self.terminal.drain.side_effect = drain
        self.assertEqual(self.run_demo(), 0)
        self.assertEqual(len(checks), 2)
        self.assertNotEqual(self.report, old)

    def test_evaluator_exit_without_publication_is_failure(self):
        self.terminal.process.poll.return_value = 0
        self.assertEqual(self.run_demo(), 1)
        self.stop.assert_any_call(self.watch)
        self.terminal.close.assert_called_once()

    def test_a_watch_that_never_starts_starts_neither_session(self):
        self.watch_ready.return_value = False
        self.assertEqual(self.run_demo(), 1)
        self.assertEqual([], self.owner_commands())
        self.assertEqual(self.commands, [])
        self.stop.assert_any_call(self.watch)

    def test_failed_first_turn_names_the_owners_last_error(self):
        # S-Marketing-105: run-79g5sk80's owner got a 404 for its model and
        # the failure said only that the watch never started.
        final = (
            'unexpected status 404 Not Found: The model `GPT-6.1-Sol` does not '
            'exist or you do not have access to it., url: '
            'https://api.openai.com/v1/responses, request id: req_5c21'
        )
        run_79g5sk80 = [
            'Reading additional input from stdin...',
            {'type': 'thread.started', 'thread_id': 'thread'},
            {'type': 'item.completed', 'item': {
                'id': 'item_0', 'type': 'error',
                'message': 'Model metadata for `GPT-6.1-Sol` not found.'}},
            {'type': 'error', 'message': f'Reconnecting... 5/5 ({final})'},
            {'type': 'error', 'message': final},
            {'type': 'turn.failed', 'error': {'message': final}},
        ]
        reason = 'the owner\'s first turn failed'
        timeout = INSTALL.subprocess.TimeoutExpired('codex', 180)
        for name, lines, ending, expected in (
            ('404', run_79g5sk80, 1, f'{reason}: {final}. Records:'),
            ('no top-level error', run_79g5sk80[:3], 1, f'{reason}. Records:'),
            ('no thread', [{'type': 'turn.completed'}], 0, f'{reason}. Records:'),
            ('timeout', run_79g5sk80[:3], timeout, f'{reason}. Records:'),
        ):
            with self.subTest(name):
                self.first_turn = lines
                self.owner.wait.side_effect = ending if ending is timeout else None
                self.owner.wait.return_value = ending
                run_dir = self.home / f'run-{name}'
                run_dir.mkdir()
                self.assertEqual(self.run_demo(run_dir=str(run_dir)), 1)
                self.assertEqual(self.commands, [])
                self.assertIn(expected, (run_dir / INSTALL.DEMO_FAILURE_FILE).read_text())

    def test_the_demo_feeds_the_owner_each_batch_of_notifications(self):
        steps = []

        def drain():
            steps.append(True)
            if len(steps) == 1:
                self.turn_poll = None
                self.notify('notification 2026-10-02T18:00:00Z')
            elif len(steps) == 2:
                # These arrive while the first fed turn is still running.
                self.notify('notification 2026-10-02T18:00:05Z',
                            'notification 2026-10-02T18:00:06Z')
            elif len(steps) == 3:
                self.turn_poll = 0
            elif len(steps) == 5:
                self.report.write_text('complete')

        self.terminal.drain.side_effect = drain
        self.assertEqual(self.run_demo(model='gpt-6', effort='high'), 0)
        launched = [call.args[0] for call in INSTALL.subprocess.Popen.call_args_list]
        self.assertEqual('watch', launched[0][-1])
        first, *resumed = self.owner_commands()
        self.assertEqual(2, len(resumed))
        for command in resumed:
            self.assertEqual(['codex', 'exec', 'resume'], command[:3])
            self.assertEqual(first[2:-1], command[3:-2])
            self.assertEqual('thread-1', command[-2])
        self.assertIn('18:00:00Z', resumed[0][-1])
        self.assertNotIn('18:00:05Z', resumed[0][-1])
        self.assertIn('18:00:05Z', resumed[1][-1])
        self.assertIn('18:00:06Z', resumed[1][-1])

    def test_a_failed_later_turn_fails_the_run(self):
        self.turn_poll = 1
        self.turn_returncode = 1
        self.terminal.drain.side_effect = lambda: self.notify('notification 2026-10-02T18:00:00Z')
        run_dir = self.home / 'run'
        run_dir.mkdir()
        self.assertEqual(self.run_demo(run_dir=str(run_dir)), 1)
        self.assertEqual(1, len(self.turns))
        self.assertIn('the owner failed before report publication',
                      (run_dir / INSTALL.DEMO_FAILURE_FILE).read_text())

    def test_the_watch_stopping_fails_the_run(self):
        self.watch.poll.return_value = 0
        run_dir = self.home / 'run'
        run_dir.mkdir()
        self.assertEqual(self.run_demo(run_dir=str(run_dir)), 1)
        self.assertIn('the notification watch stopped',
                      (run_dir / INSTALL.DEMO_FAILURE_FILE).read_text())

    def test_the_codex_owner_is_never_told_about_the_cli(self):
        self.terminal.drain.side_effect = lambda: self.report.write_text('complete')
        self.assertEqual(self.run_demo(), 0)
        cli = INSTALL.demo_codex_cli_args('stage')[0]
        brief = (Path(INSTALL.__file__).parent / 'demo-brief.md').read_text()
        role = INSTALL.DEMO_CODEX_OWNER_ROLE
        for name, text in (
                ('startup prompt', (self.report.parent / 'owner-input.md').read_text()),
                ('turn prompt', INSTALL.codex_owner_turn_prompt(['notification x'])),
                ('brief', brief),
                ('owner instructions', role)):
            with self.subTest(name):
                self.assertNotIn(cli, text)
                self.assertNotIn('{{UCLUSION_CLI}}', text)
                self.assertNotIn('watch', text)
                self.assertNotIn('CLI', text)

    def test_the_codex_owner_works_from_its_brief_alone(self):
        # S-Marketing-114: it read the evaluator's job workflow it never uses.
        self.terminal.drain.side_effect = lambda: self.report.write_text('complete')
        self.assertEqual(self.run_demo(), 0)
        prompt = (self.report.parent / 'owner-input.md').read_text()
        self.assertIn('The brief is your whole procedure', prompt)
        owner, evaluator = self.session_calls[-2], self.session_calls[-1]
        self.assertEqual(INSTALL.demo_codex_owner_instructions_path(),
                         owner['instructions_path'])
        self.assertIsNone(evaluator.get('instructions_path'))

    def test_normal_owner_exit_can_precede_report(self):
        self.terminal.drain.side_effect = lambda: self.report.write_text('complete')
        self.assertEqual(self.run_demo(), 0)

    def test_interrupt_cleans_up_both_sessions(self):
        self.terminal.drain.side_effect = KeyboardInterrupt
        self.assertEqual(self.run_demo(), 1)
        self.stop.assert_any_call(self.terminal.process)
        self.stop.assert_any_call(self.watch)


@unittest.skipUnless(os.name == 'posix', 'Codex demo requires a Unix PTY')
class CodexTerminalTests(unittest.TestCase):
    def test_fast_exit_retains_its_final_diagnostic(self):
        with tempfile.TemporaryDirectory() as home, mock.patch.object(
            INSTALL, 'uclusion_home_root', return_value=home
        ):
            log = io.BytesIO()
            terminal = INSTALL.DemoCodexTerminal(
                [sys.executable, '-c', 'print("startup failed")'],
                dict(os.environ), log,
            )
            terminal.process.wait(timeout=5)
            terminal.close()
            self.assertIn(b'startup failed', log.getvalue())

    def test_split_terminal_query_is_answered_and_logged(self):
        # The child cannot finish unless the PTY has a controlling terminal
        # and the split cursor query gets a response.
        program = (
            'import os,sys,termios,tty,time; '
            'tty.setraw(0); '
            'assert os.tcgetpgrp(0) == os.getpgrp(); '
            'os.write(1,b"\\x1b[6"); time.sleep(.03); '
            'os.write(1,b"n"); '
            'response=os.read(0,20); '
            'sys.exit(0 if response == b"\\x1b[1;1R" else 2)'
        )
        with tempfile.TemporaryDirectory() as home, mock.patch.object(
            INSTALL, 'uclusion_home_root', return_value=home
        ):
            log = io.BytesIO()
            terminal = INSTALL.DemoCodexTerminal(
                [sys.executable, '-c', program], dict(os.environ), log
            )
            try:
                deadline = time.monotonic() + 5
                while terminal.process.poll() is None and time.monotonic() < deadline:
                    terminal.drain()
                self.assertEqual(terminal.process.poll(), 0)
                self.assertIn(b'\x1b[6n', log.getvalue())
            finally:
                INSTALL.stop_demo_session(terminal.process)
                terminal.close()

    def test_stopping_a_session_reaps_its_process(self):
        process = subprocess.Popen(
            [sys.executable, '-c', 'import time; time.sleep(60)'],
            start_new_session=True,
        )
        INSTALL.stop_demo_session(process)
        self.assertIsNotNone(process.poll())


if __name__ == '__main__':
    unittest.main()
