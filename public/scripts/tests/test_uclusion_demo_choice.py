"""S-Marketing-93: the person running the demo chooses its model and effort.

They pay for the run, so their agent asks them and the demo abides by the
answer. Nothing is read from their own settings, and because a session cannot
see its own effort, the installer's record of the choice states it.
"""

import importlib.util
import io
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS_DIR))

import uclusionCLI as cli

spec = importlib.util.spec_from_file_location('demo_choice', SCRIPTS_DIR / 'uclusionInstall.py')
INSTALL = importlib.util.module_from_spec(spec)
spec.loader.exec_module(INSTALL)

DEMO_CLIENT_ID = 'ai-demo:3f2b8c1a-1111-4222-8333-944455556666:human_owner'


class DemoChoiceOptionTests(unittest.TestCase):
    def refusal(self, *argv):
        stderr = io.StringIO()
        with mock.patch.object(INSTALL.sys, 'argv', ['uclusionInstall.py', *argv]), \
                mock.patch.object(INSTALL, 'reexec_in_demo_home') as reexec, \
                mock.patch.object(INSTALL, 'provision_demo') as provision, \
                mock.patch('sys.stderr', stderr):
            with self.assertRaises(SystemExit):
                INSTALL.main()
        # Refused before anything is provisioned or started
        reexec.assert_not_called()
        provision.assert_not_called()
        return stderr.getvalue()

    def test_demo_mode_requires_both_choices(self):
        for extra, missing in (
            ([], '--model and --effort'),
            (['--model', 'opus'], '--effort'),
            (['--effort', 'high'], '--model'),
            (['--model', ' ', '--effort', 'high'], '--model'),
        ):
            with self.subTest(extra=extra):
                message = self.refusal('stage', 'demo', '--clients', 'claude', *extra)
                self.assertIn(f'demo mode requires {missing}.', message)
                self.assertIn('they pay for the run', message)

    def test_the_choices_only_go_with_demo_mode(self):
        for option in ('--model', '--effort'):
            with self.subTest(option=option):
                message = self.refusal('stage', 'setup', '--clients', 'claude', option, 'x')
                self.assertIn('--model and --effort only go with demo mode', message)

    def test_each_client_gets_its_own_spelling_of_the_choice(self):
        self.assertEqual(
            ['--model', 'opus', '--effort', 'xhigh'],
            INSTALL.demo_choice_args('claude', 'opus', 'xhigh'),
        )
        self.assertEqual(
            ['-m', 'gpt-6', '-c', 'model_reasoning_effort="high"'],
            INSTALL.demo_choice_args('codex', 'gpt-6', 'high'),
        )


class DemoChoiceHandOffTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.home = Path(directory.name)
        (self.home / '.uclusion').mkdir()
        (self.home / '.local' / 'bin').mkdir(parents=True)

    def test_the_supervisor_records_and_receives_the_choice(self):
        supervisor = mock.Mock(pid=4242)
        with mock.patch.object(INSTALL, 'UCLUSION_HOME', str(self.home / '.uclusion')), \
                mock.patch.object(INSTALL, 'SYMLINK_DIR', str(self.home / '.local' / 'bin')), \
                mock.patch.object(INSTALL, 'uclusion_home_root', return_value=str(self.home)), \
                mock.patch.object(INSTALL.subprocess, 'Popen', return_value=supervisor) as popen, \
                mock.patch('builtins.print'):
            self.assertEqual(0, INSTALL.start_demo_supervisor(
                'stage', 'claude', 'workspace', 'Start J-Demo-1.',
                model='opus', effort='xhigh'))
        command = popen.call_args.args[0]
        self.assertEqual(['opus', 'xhigh'], command[-2:])
        run_dir = Path((self.home / '.uclusion' / INSTALL.DEMO_CURRENT_RUN_FILE).read_text())
        self.assertEqual(
            {'client': 'claude', 'model': 'opus', 'effort': 'xhigh'},
            json.loads((run_dir / INSTALL.DEMO_RUN_CHOICE_FILE).read_text()),
        )
        # The detached half hands the same choice to the runner
        with mock.patch.object(INSTALL, 'run_claude_demo', return_value=0) as runner:
            self.assertEqual(0, INSTALL.supervise_demo(command[3:]))
        self.assertEqual('opus', runner.call_args.kwargs['model'])
        self.assertEqual('xhigh', runner.call_args.kwargs['effort'])

    def test_the_result_states_the_choice_above_the_unedited_report(self):
        run_dir = self.home / '.uclusion' / 'demo-runs' / 'run-1'
        run_dir.mkdir(parents=True)
        (self.home / '.uclusion' / cli.DEMO_CURRENT_RUN_FILE).write_text(str(run_dir))
        (run_dir / cli.DEMO_SUPERVISOR_PID_FILE).write_text(str(os.getpid()))
        (run_dir / cli.DEMO_RUN_CHOICE_FILE).write_text(
            json.dumps({'client': 'claude', 'model': 'opus', 'effort': 'xhigh'}))
        report = b'# Evaluation\n'
        (run_dir / 'evaluation.md').write_bytes(report)
        output = io.TextIOWrapper(io.BytesIO(), encoding='utf-8')
        args = cli.build_parser().parse_args(['-e', 'stage', 'demo', '--result'])
        with mock.patch.object(cli, 'uclusion_home_root', return_value=str(self.home)), \
                mock.patch.object(cli, 'get_credentials',
                                  return_value={'secret_key_id': DEMO_CLIENT_ID, 'secret_key': 'secret'}), \
                mock.patch.object(cli.sys, 'stdout', output):
            self.assertEqual(0, args.func(args))
        output.flush()
        self.assertEqual(
            b'Demo run: Claude Code, model opus, effort xhigh, as chosen by the person '
            b'who ran it.\n\n' + report,
            output.buffer.getvalue(),
        )


if __name__ == '__main__':
    unittest.main()
