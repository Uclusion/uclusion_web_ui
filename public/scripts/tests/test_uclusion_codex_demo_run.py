"""The Codex demo finishes from a published file, never from terminal prose."""

import importlib.util
import io
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import unittest
from unittest import mock


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
        self.owner = mock.Mock(pid=1001)
        self.owner.poll.return_value = None
        self.terminal = mock.Mock()
        self.terminal.process.poll.return_value = None
        self.report = None
        self.commands = []

        def start_terminal(command, environment, _log):
            self.commands.append(command)
            self.report = Path(environment['UCLUSION_DEMO_REPORT_FILE'])
            return self.terminal

        patches = [
            mock.patch.object(INSTALL, 'UCLUSION_HOME', str(self.home / '.uclusion')),
            mock.patch.object(INSTALL, 'SYMLINK_DIR', str(self.home / '.local/bin')),
            mock.patch.object(INSTALL, 'uclusion_home_root', return_value=str(self.home)),
            mock.patch.object(INSTALL, 'demo_codex_environment', return_value={}),
            mock.patch.object(INSTALL, 'demo_codex_session_args', return_value=['-c', 'x=1']),
            mock.patch.object(INSTALL, 'DemoCodexTerminal', side_effect=start_terminal),
            mock.patch.object(INSTALL.subprocess, 'Popen', return_value=self.owner),
            mock.patch.object(INSTALL, 'wait_for_owner_watch', return_value=True),
            mock.patch.object(INSTALL, 'stop_demo_session'),
            mock.patch.object(INSTALL.sys, 'stdout', self.output),
        ]
        self.mocks = [patch.start() for patch in patches]
        for patch in reversed(patches):
            self.addCleanup(patch.stop)
        self.stop = self.mocks[-2]

    def run_demo(self, **kwargs):
        return INSTALL.run_codex_demo('stage', 'workspace', 'Start J-Demo-1.', **kwargs)

    def test_only_the_evaluator_is_launched_with_statistics(self):
        self.mocks[4].side_effect = (
            lambda _env, _workspace, response_stats=None:
            ['-c', f'stats={response_stats}']
        )
        self.terminal.drain.side_effect = lambda: self.report.write_bytes(b'Report\n')
        self.assertEqual(self.run_demo(response_stats='/tmp/eval.jsonl'), 0)
        owner_command = next(
            call.args[0] for call in INSTALL.subprocess.Popen.call_args_list
            if call.args[0][:2] == ['codex', 'exec']
        )
        self.assertIn('stats=None', owner_command)
        self.assertNotIn('stats=/tmp/eval.jsonl', owner_command)
        self.assertIn('stats=/tmp/eval.jsonl', self.commands[0])

    def test_publication_preserves_bytes_and_stops_both_live_sessions(self):
        report = b'  Evaluation\r\nUnicode: \xe2\x9c\x93\n\n'
        self.terminal.drain.side_effect = lambda: self.report.write_bytes(report)
        self.assertEqual(self.run_demo(), 0)
        self.output.flush()
        self.assertTrue(self.output.buffer.getvalue().endswith(report))
        self.stop.assert_has_calls([
            mock.call(self.terminal.process), mock.call(self.owner)
        ])
        self.terminal.close.assert_called_once()
        self.assertIn('codex', self.commands[0])

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
        self.stop.assert_any_call(self.owner)
        self.terminal.close.assert_called_once()

    def test_owner_watch_failure_does_not_start_evaluator(self):
        self.mocks[7].return_value = False
        self.assertEqual(self.run_demo(), 1)
        self.assertEqual(self.commands, [])
        self.stop.assert_called_once_with(self.owner)

    def test_normal_owner_exit_can_precede_report(self):
        self.owner.poll.return_value = 0
        self.terminal.drain.side_effect = lambda: self.report.write_text('complete')
        self.assertEqual(self.run_demo(), 0)

    def test_interrupt_cleans_up_both_sessions(self):
        self.terminal.drain.side_effect = KeyboardInterrupt
        self.assertEqual(self.run_demo(), 1)
        self.stop.assert_has_calls([
            mock.call(self.terminal.process), mock.call(self.owner)
        ])


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
