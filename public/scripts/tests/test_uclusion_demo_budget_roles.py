"""Launch wiring only; native executables, accounts and installation are mocked."""
from contextlib import ExitStack, nullcontext
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import uclusionInstall as install
import uclusionTokenBudget as budget


class CapturedLaunches(Exception):
    pass


class DemoBudgetRoleTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.run_dir = directory.name
        self.patches = ExitStack()
        self.addCleanup(self.patches.close)
        replacements = {
            'uclusion_home_root': self.run_dir,
            'demo_choice_args': [],
            'demo_session_args': [],
            'demo_codex_session_args': [],
            'demo_codex_cli_args': ['uclusion'],
            'demo_codex_environment': {},
            'demo_claude_session_environment': {},
            'snapshot_demo_evidence': self.run_dir,
            'wait_for_owner_watch': True,
            'wait_for_codex_owner': 0,
            'codex_owner_thread_id': 'thread_fixture',
            'stop_demo_home_processes': (0, []),
        }
        for name, value in replacements.items():
            patcher = (mock.patch.object(install, name, side_effect=dict)
                       if name.endswith('_environment')
                       else mock.patch.object(install, name, return_value=value))
            self.patches.enter_context(patcher)
        for name in ('accept_demo_workspace_trust', '_write_staged_asset',
                     'write_demo_owner_mcp_config', 'write_demo_evaluator_mcp_config',
                     'stop_demo_session'):
            self.patches.enter_context(mock.patch.object(install, name))
        self.patches.enter_context(mock.patch.object(install, 'demo_shutdown_signals',
                                                     side_effect=nullcontext))
        self.patches.enter_context(mock.patch('builtins.print'))
        self.run_budget = mock.Mock()
        self.run_budget.gateway.url_for_role.side_effect = (
            lambda role: f'http://127.0.0.1:1234/{role}/run-token/backend-api/codex')

    def test_claude_owner_and_evaluator_receive_their_own_gateway_urls(self):
        launched = []
        def launch(command, environment, log):
            launched.append((command, dict(environment)))
            if len(launched) == 2:
                raise CapturedLaunches()
            return mock.Mock()
        with mock.patch.object(install, 'DemoCodexTerminal', side_effect=launch), \
                self.assertRaises(CapturedLaunches):
            install._run_claude_demo('stage', 'workspace', 'Start fixture.',
                                     run_dir=self.run_dir, budget=self.run_budget)
        self.assertEqual(['claude', 'claude'], [command[0] for command, _env in launched])
        self.assertEqual([self.run_budget.gateway.url_for_role(role) for role in ('owner', 'evaluator')],
                         [environment['ANTHROPIC_BASE_URL'] for _command, environment in launched])

    def test_codex_exec_owner_and_native_evaluator_receive_their_own_gateway_urls(self):
        server = mock.Mock(socket_path='/fixture/native.sock', remote_args=['--remote', 'unix:///fixture/native.sock'])
        launched = []
        def popen(command, **kwargs):
            launched.append(command)
            return mock.Mock()
        with mock.patch.object(budget, 'OwnedCodexServer', return_value=server), \
                mock.patch.object(budget, 'bind_codex_account'), \
                mock.patch.object(install.selectors, 'DefaultSelector'), \
                mock.patch.object(install.subprocess, 'Popen', side_effect=popen), \
                mock.patch.object(install, 'DemoCodexTerminal', side_effect=CapturedLaunches), \
                self.assertRaises(CapturedLaunches):
            install._run_codex_demo('stage', 'workspace', 'Start fixture.',
                                    run_dir=self.run_dir, budget=self.run_budget)
        owner = next(command for command in launched if command[:2] == ['codex', 'exec'])
        owner_url = self.run_budget.gateway.url_for_role('owner')
        evaluator_url = self.run_budget.gateway.url_for_role('evaluator')
        self.assertIn('base_url="' + owner_url + '"', ' '.join(owner))
        self.assertIn('base_url="' + evaluator_url + '"', ' '.join(server.args))
        self.assertNotIn(evaluator_url, ' '.join(owner))
        self.assertNotIn(owner_url, ' '.join(server.args))


if __name__ == '__main__':
    unittest.main()
