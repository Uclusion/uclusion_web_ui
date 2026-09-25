"""The Claude demo finishes from a published file, never from its last output.

S-Marketing-73: a Monitor expiry woke a Claude evaluator after its evaluation,
and whatever that extra turn said would have replaced the report.
"""

import importlib.util
import io
from pathlib import Path
import tempfile
import unittest
from unittest import mock


spec = importlib.util.spec_from_file_location(
    'claude_demo_run', Path(__file__).resolve().parents[1] / 'uclusionInstall.py'
)
INSTALL = importlib.util.module_from_spec(spec)
spec.loader.exec_module(INSTALL)


class ClaudeDemoRunTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.home = Path(directory.name)
        self.output = io.TextIOWrapper(io.BytesIO(), encoding='utf-8')
        self.owner = self.session()
        self.evaluator = self.session()
        self.launches = []
        # Called whenever the installer waits, standing in for the evaluator
        self.evaluator_turn = lambda: None

        def launch(command, **kwargs):
            self.launches.append((command, kwargs))
            return self.owner if len(self.launches) == 1 else self.evaluator

        patches = [
            mock.patch.object(INSTALL, 'UCLUSION_HOME', str(self.home / '.uclusion')),
            mock.patch.object(INSTALL, 'uclusion_home_root', return_value=str(self.home)),
            mock.patch.object(INSTALL, 'demo_session_args',
                              side_effect=lambda _env, config=None: ['--mcp-config', config or 'shared']),
            mock.patch.object(INSTALL, 'write_demo_evaluator_mcp_config',
                              side_effect=lambda stats: stats and 'evaluator.json'),
            mock.patch.object(INSTALL.subprocess, 'Popen', side_effect=launch),
            mock.patch.object(INSTALL, 'wait_for_owner_watch', return_value=True),
            mock.patch.object(INSTALL, 'stop_demo_session'),
            mock.patch.object(INSTALL, 'stop_demo_home_processes', return_value=(0, [])),
            mock.patch.object(INSTALL.time, 'sleep', side_effect=lambda _seconds: self.evaluator_turn()),
            mock.patch.object(INSTALL.sys, 'stdout', self.output),
        ]
        for patch in patches:
            patch.start()
            self.addCleanup(patch.stop)
        self.stop = INSTALL.stop_demo_session

    @staticmethod
    def session():
        process = mock.Mock()
        process.poll.return_value = None
        return process

    def run_demo(self, **kwargs):
        return INSTALL.run_claude_demo('stage', 'workspace', 'Start J-Demo-1.', **kwargs)

    def report_path(self):
        return Path(self.launches[1][1]['env']['UCLUSION_DEMO_REPORT_FILE'])

    def printed(self):
        self.output.flush()
        return self.output.buffer.getvalue()

    def test_publication_prints_the_report_bytes_and_stops_both_sessions(self):
        report = b'  Evaluation\r\nUnicode: \xe2\x9c\x93\n\n'
        self.evaluator_turn = lambda: self.report_path().write_bytes(report)
        self.assertEqual(self.run_demo(), 0)
        self.assertTrue(self.printed().endswith(report))
        self.stop.assert_has_calls([mock.call(self.evaluator), mock.call(self.owner)])
        INSTALL.stop_demo_home_processes.assert_called_once_with(str(self.home))

    def test_only_the_evaluator_is_told_where_to_publish(self):
        self.evaluator_turn = lambda: self.report_path().write_text('Report')
        self.assertEqual(self.run_demo(), 0)
        (owner_command, owner_kwargs), (evaluator_command, evaluator_kwargs) = self.launches
        self.assertNotIn('env', owner_kwargs)
        report = self.report_path()
        self.assertEqual('evaluation.md', report.name)
        self.assertEqual(self.home / '.uclusion' / 'demo-runs', report.parent.parent)
        self.assertEqual(['claude', '--mcp-config', 'shared'], owner_command)
        self.assertTrue(owner_kwargs['start_new_session'] and evaluator_kwargs['start_new_session'])
        # S-Marketing-75: both start in the demo home, not the person's project
        self.assertEqual(str(self.home), owner_kwargs['cwd'])
        self.assertEqual(str(self.home), evaluator_kwargs['cwd'])

    def test_the_prompt_asks_for_publication_and_the_run_keeps_its_inputs(self):
        self.evaluator_turn = lambda: self.report_path().write_text('Report')
        self.assertEqual(self.run_demo(), 0)
        run = self.report_path().parent
        prompt = (run / 'evaluator-input.md').read_text()
        self.assertEqual(prompt, self.evaluator.stdin.write.call_args.args[0])
        self.assertIn(f'{INSTALL.workflow_cli_command("stage")} demo --report', prompt)
        self.assertIn('The installer will stop this session after publication', prompt)
        self.assertNotIn('print that answer as the last thing you say', prompt)
        self.assertIn('Read the file', (run / 'owner-input.md').read_text())
        self.assertTrue((run / 'owner.log').exists() and (run / 'evaluator.log').exists())

    def test_the_evaluator_is_told_its_owner_is_scripted(self):
        # S-Marketing-88: the owner's records show as the human's, so the
        # evaluator must hear otherwise before it starts and keep them apart.
        self.evaluator_turn = lambda: self.report_path().write_text('Report')
        self.assertEqual(self.run_demo(), 0)
        prompt = (self.report_path().parent / 'evaluator-input.md').read_text()
        self.assertTrue(prompt.startswith(f'Start J-Demo-1. {INSTALL.DEMO_SCRIPTED_OWNER}\n\n'))
        self.assertTrue(prompt.endswith(INSTALL.DEMO_SCRIPT_SEPARATION))

    def test_both_sessions_run_at_the_person_s_choice(self):
        # S-Marketing-93: they pay for the run, so the choice holds for both.
        self.evaluator_turn = lambda: self.report_path().write_text('Report')
        self.assertEqual(self.run_demo(model='opus', effort='xhigh'), 0)
        for command, _kwargs in self.launches:
            self.assertEqual(['--model', 'opus', '--effort', 'xhigh'], command[-4:])
        prompt = (self.report_path().parent / 'evaluator-input.md').read_text()
        self.assertIn(INSTALL.DEMO_EFFORT_NOTE, prompt)

    def test_what_the_session_says_after_publishing_is_not_the_report(self):
        def publish_then_wake():
            self.report_path().write_text('The evaluation')
            (self.report_path().parent / 'evaluator.log').write_text('Monitor expired; re-arming')

        self.evaluator_turn = publish_then_wake
        self.assertEqual(self.run_demo(), 0)
        self.assertTrue(self.printed().endswith(b'The evaluation'))
        self.assertNotIn(b'Monitor expired', self.printed())

    def test_exit_before_publication_is_a_failure_that_names_the_records(self):
        self.evaluator.poll.return_value = 0
        self.assertEqual(self.run_demo(), 1)
        output = self.printed().decode()
        self.assertIn('the evaluator exited before publishing its report', output)
        self.assertIn('demo-runs', output)
        self.assertIn('workspace', output)
        self.stop.assert_has_calls([mock.call(self.evaluator), mock.call(self.owner)])

    def test_a_blank_report_is_a_failure(self):
        self.evaluator_turn = lambda: self.report_path().write_text(' \n')
        self.assertEqual(self.run_demo(), 1)
        self.assertIn('the published evaluation is empty', self.printed().decode())

    def test_interruption_stops_both_sessions(self):
        def interrupt():
            raise KeyboardInterrupt

        self.evaluator_turn = interrupt
        self.assertEqual(self.run_demo(), 1)
        self.stop.assert_has_calls([mock.call(self.evaluator), mock.call(self.owner)])

    def test_an_owner_not_yet_watching_warns_and_the_run_continues(self):
        INSTALL.wait_for_owner_watch.return_value = False
        self.evaluator_turn = lambda: self.report_path().write_text('Report')
        self.assertEqual(self.run_demo(), 0)
        self.assertIn('The owner is not watching for notifications yet', self.printed().decode())
        self.assertEqual(2, len(self.launches))

    def test_only_the_evaluator_is_launched_with_statistics(self):
        self.evaluator_turn = lambda: self.report_path().write_text('Report')
        self.assertEqual(self.run_demo(response_stats='/tmp/eval.jsonl'), 0)
        self.assertEqual(['claude', '--mcp-config', 'shared'], self.launches[0][0])
        self.assertEqual(['claude', '--mcp-config', 'evaluator.json'], self.launches[1][0])


if __name__ == '__main__':
    unittest.main()
