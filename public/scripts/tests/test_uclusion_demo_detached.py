"""S-Marketing-77: the demo command returns while the exercise runs detached.

A prospect's agent that ran the command in the foreground waited out the whole
exercise and could lose it to its own command timeout. Now the command starts a
supervisor and returns, and `uclusion demo --result --wait` prints the report.
"""

import importlib.util
import io
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS_DIR))

import uclusionCLI as cli

spec = importlib.util.spec_from_file_location('demo_detached', SCRIPTS_DIR / 'uclusionInstall.py')
INSTALL = importlib.util.module_from_spec(spec)
spec.loader.exec_module(INSTALL)

DEMO_CLIENT_ID = 'ai-demo:3f2b8c1a-1111-4222-8333-944455556666:human_owner'


class DetachedDemoTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.home = Path(directory.name)
        (self.home / '.uclusion').mkdir()
        (self.home / '.local' / 'bin').mkdir(parents=True)

    def test_the_command_returns_while_the_exercise_keeps_running(self):
        supervisor = mock.Mock(pid=4242)
        supervisor.poll.return_value = None
        with mock.patch.object(INSTALL, 'UCLUSION_HOME', str(self.home / '.uclusion')), \
                mock.patch.object(INSTALL, 'SYMLINK_DIR', str(self.home / '.local' / 'bin')), \
                mock.patch.object(INSTALL, 'uclusion_home_root', return_value=str(self.home)), \
                mock.patch.object(INSTALL.subprocess, 'Popen', return_value=supervisor) as popen, \
                mock.patch('builtins.print') as printed:
            self.assertEqual(0, INSTALL.start_demo_supervisor(
                'stage', 'claude', 'workspace', 'Start J-Demo-1.'))
        command, kwargs = popen.call_args.args[0], popen.call_args.kwargs
        # Started, never waited on: it lives in its own session and keeps running.
        self.assertTrue(kwargs['start_new_session'])
        supervisor.wait.assert_not_called()
        supervisor.communicate.assert_not_called()
        # It runs a copy from the home's .local, which is what lets `demo --remove` stop it.
        copy = self.home / '.local' / 'bin' / 'uclusionDemoSupervisor.py'
        self.assertEqual(str(copy), command[1])
        self.assertTrue(copy.is_file())
        self.assertEqual(INSTALL.DEMO_SUPERVISE_MODE, command[2])
        run_dir = Path((self.home / '.uclusion' / INSTALL.DEMO_CURRENT_RUN_FILE).read_text())
        self.assertEqual(self.home / '.uclusion' / 'demo-runs', run_dir.parent)
        self.assertIn(str(run_dir), command)
        self.assertEqual('4242', (run_dir / INSTALL.DEMO_SUPERVISOR_PID_FILE).read_text())
        told = ' '.join(str(call.args[0]) for call in printed.call_args_list)
        self.assertIn('demo --result --wait', told)

    def test_result_wait_prints_the_published_report(self):
        run_dir = self.home / '.uclusion' / 'demo-runs' / 'run-1'
        run_dir.mkdir(parents=True)
        (self.home / '.uclusion' / cli.DEMO_CURRENT_RUN_FILE).write_text(str(run_dir))
        (run_dir / cli.DEMO_SUPERVISOR_PID_FILE).write_text(str(os.getpid()))
        report = b'  Evaluation\r\nUnicode: \xe2\x9c\x93\n'
        waits = []

        def publish_while_waiting(_seconds):
            waits.append(True)
            (run_dir / 'evaluation.md').write_bytes(report)

        output = io.TextIOWrapper(io.BytesIO(), encoding='utf-8')
        args = cli.build_parser().parse_args(['-e', 'stage', 'demo', '--result', '--wait'])
        with mock.patch.object(cli, 'uclusion_home_root', return_value=str(self.home)), \
                mock.patch.object(cli, 'get_credentials',
                                  return_value={'secret_key_id': DEMO_CLIENT_ID, 'secret_key': 'secret'}), \
                mock.patch.object(cli.time, 'sleep', side_effect=publish_while_waiting), \
                mock.patch.object(cli.sys, 'stdout', output):
            self.assertEqual(0, args.func(args))
        output.flush()
        self.assertEqual(1, len(waits), 'It should wait until the report is published')
        self.assertEqual(report, output.buffer.getvalue())


if __name__ == '__main__':
    unittest.main()
