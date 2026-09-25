"""S-all-338: a project install in the home directory is the global install."""
import importlib.util
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock


SCRIPT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPEC = importlib.util.spec_from_file_location(
    'uclusion_install_home_project_under_test',
    os.path.join(SCRIPT_DIR, 'uclusionInstall.py'),
)
INSTALL = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(INSTALL)
sys.path.insert(0, SCRIPT_DIR)
import uclusionCLI as cli  # noqa: E402

PORT = 35109


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + '\n', encoding='utf-8')


def audit_hook(source='otel'):
    return {'type': 'command', 'command': INSTALL.claude_token_audit_hook_command(
        'stage', 'workspace-1', source, PORT)}


class HomeDirectoryTestCase(unittest.TestCase):
    def setUp(self):
        scratch = tempfile.TemporaryDirectory()
        self.addCleanup(scratch.cleanup)
        self.home = Path(scratch.name) / 'home'
        self.home.mkdir()
        self.mcp_json = self.home / '.mcp.json'
        self.local_settings = self.home / '.claude' / 'settings.local.json'
        patcher = mock.patch.multiple(
            INSTALL,
            USER_HOME=str(self.home),
            HOME_PROJECT_MCP_JSON_PATH=str(self.mcp_json),
            HOME_PROJECT_CLAUDE_SETTINGS_PATH=str(self.local_settings),
        )
        patcher.start()
        self.addCleanup(patcher.stop)


class ProjectDirectoryChoiceTests(HomeDirectoryTestCase):
    def test_the_home_directory_becomes_the_global_install(self):
        with mock.patch('builtins.print') as output:
            self.assertIsNone(INSTALL.project_dir_or_global(str(self.home)))
            self.assertIsNone(INSTALL.project_dir_or_global(str(self.home) + '/'))
        self.assertIn('global install', output.call_args.args[0])
        project = self.home / 'dev' / 'project'
        self.assertEqual(str(project), INSTALL.project_dir_or_global(str(project)))
        self.assertIsNone(INSTALL.project_dir_or_global(None))

    def test_an_interactive_answer_naming_home_is_the_global_install(self):
        with mock.patch.object(INSTALL, 'prompt_yes_no', return_value=True), \
                mock.patch.object(INSTALL, 'prompt_line', return_value=str(self.home)), \
                mock.patch('builtins.print'):
            self.assertIsNone(INSTALL.prompt_install_scope())

    def test_project_flag_run_from_home_does_the_global_install(self):
        with mock.patch.object(INSTALL.sys, 'argv', [
                    'uclusionInstall', 'stage', 'workspace-1', 'view-1',
                    '--clients', 'claude', '--skip-scripts',
                    '--script-version', 'release-1', '--project',
                ]), mock.patch.object(INSTALL.os, 'getcwd', return_value=str(self.home)), \
                mock.patch.object(INSTALL, 'confirm_existing_feature_changes',
                                  return_value=True) as confirm, \
                mock.patch.object(INSTALL, 'make_workflow_bundle_fetcher',
                                  return_value=mock.Mock()), \
                mock.patch.object(INSTALL, 'install_global') as install_global, \
                mock.patch.object(INSTALL, 'install_project_level') as install_project, \
                mock.patch('builtins.print'):
            self.assertEqual(0, INSTALL.main())
        install_global.assert_called_once()
        install_project.assert_not_called()
        self.assertIsNone(confirm.call_args.args[2], 'Existing features are checked globally')


class LeftoverCleanupTests(HomeDirectoryTestCase):
    def cleanup(self):
        with mock.patch('builtins.print'):
            return INSTALL.remove_home_project_leftovers()

    def test_only_the_uclusion_server_leaves_a_shared_mcp_json(self):
        write_json(self.mcp_json, {'mcpServers': {
            'Uclusion': {'command': 'python3', 'args': ['proxy']},
            'Other': {'command': 'keep-me'},
        }, 'note': 'mine'})
        self.assertEqual(1, len(self.cleanup()))
        self.assertEqual({'mcpServers': {'Other': {'command': 'keep-me'}}, 'note': 'mine'},
                         json.loads(self.mcp_json.read_text(encoding='utf-8')))

    def test_an_mcp_json_holding_only_uclusion_is_deleted(self):
        write_json(self.mcp_json, {'mcpServers': {'Uclusion': {'command': 'python3'}}})
        self.cleanup()
        self.assertFalse(self.mcp_json.exists())

    def test_only_uclusion_audit_settings_leave_settings_local(self):
        user_hook = {'type': 'command', 'command': 'my-own-hook'}
        write_json(self.local_settings, {
            'env': {**INSTALL.claude_token_audit_env(PORT), 'KEEP_ME': 'yes'},
            'hooks': {
                'PostToolUse': [{'hooks': [audit_hook(), user_hook]}],
                'Stop': [{'hooks': [audit_hook()]}],
            },
            'permissions': {'allow': ['mcp__Uclusion__*', 'Bash(ls)']},
        })
        self.assertEqual(1, len(self.cleanup()))
        self.assertEqual({
            'env': {'KEEP_ME': 'yes'},
            'hooks': {'PostToolUse': [{'hooks': [user_hook]}]},
            'permissions': {'allow': ['mcp__Uclusion__*', 'Bash(ls)']},
        }, json.loads(self.local_settings.read_text(encoding='utf-8')))

    def test_edited_telemetry_values_are_not_treated_as_uclusion_s(self):
        edited = {**INSTALL.claude_token_audit_env(PORT), 'OTEL_LOG_USER_PROMPTS': '1'}
        write_json(self.local_settings, {'env': edited, 'hooks': {'Stop': [{'hooks': [audit_hook()]}]}})
        self.cleanup()
        self.assertEqual({'env': edited},
                         json.loads(self.local_settings.read_text(encoding='utf-8')))

    def test_nothing_of_uclusion_s_leaves_the_files_untouched(self):
        write_json(self.mcp_json, {'mcpServers': {'Other': {'command': 'keep-me'}}})
        self.local_settings.parent.mkdir(parents=True)
        self.local_settings.write_text('{"env": {"A": "1"}}', encoding='utf-8')
        self.assertEqual([], self.cleanup())
        self.assertEqual('{"env": {"A": "1"}}', self.local_settings.read_text(encoding='utf-8'))

    def test_the_global_claude_install_removes_the_leftovers(self):
        write_json(self.mcp_json, {'mcpServers': {'Uclusion': {'command': 'python3'}}})
        write_json(self.local_settings, {'hooks': {'Stop': [{'hooks': [audit_hook()]}]}})
        directory = self.home / 'uclusion-home'
        with mock.patch.multiple(
                    INSTALL,
                    UCLUSION_HOME=str(directory),
                    SCRIPT_INSTALL_PREFIX=str(directory / 'releases'),
                    CLAUDE_JSON_PATH=str(self.home / '.claude.json'),
                    CLAUDE_SETTINGS_PATH=str(self.home / '.claude' / 'settings.json'),
                    CURSOR_MCP_PATH=str(self.home / '.cursor' / 'mcp.json'),
                ), mock.patch.object(INSTALL, 'add_claude_permissions'), \
                mock.patch.object(INSTALL, 'configure_claude_token_audit',
                                  return_value={'source': None, 'managedEnv': {}}), \
                mock.patch.object(INSTALL, 'install_skill_and_stub', return_value=True), \
                mock.patch.object(INSTALL, 'remove_cursor_poke_drain_hook'), \
                mock.patch('builtins.print'):
            INSTALL.install_global('workspace-1', 'view-1', 'stage', mock.Mock(),
                                   clients={'claude'})
        self.assertFalse(self.mcp_json.exists())
        self.assertEqual({}, json.loads(self.local_settings.read_text(encoding='utf-8')))
        registered = json.loads((self.home / '.claude.json').read_text(encoding='utf-8'))
        self.assertIn('Uclusion', registered['mcpServers'])


class StrayEndpointWarningTests(HomeDirectoryTestCase):
    def configure(self, env):
        settings = self.home / '.claude' / 'settings.json'
        write_json(settings, {'env': env})
        with mock.patch('builtins.print') as output:
            result = INSTALL.configure_claude_token_audit(
                str(settings), True, 'stage', 'workspace-1', PORT)
        return result, ' '.join(str(call.args[0]) for call in output.call_args_list)

    def test_a_lone_uclusion_shaped_endpoint_on_another_port_is_named(self):
        result, printed = self.configure(
            {'OTEL_EXPORTER_OTLP_LOGS_ENDPOINT': 'http://127.0.0.1:20496/v1/logs'})
        self.assertEqual('transcript', result['source'])
        self.assertIn('OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=http://127.0.0.1:20496/v1/logs', printed)
        self.assertIn(f'port {PORT}', printed)

    def test_the_user_s_own_telemetry_policy_is_preserved_quietly(self):
        for env in ({'OTEL_EXPORTER_OTLP_LOGS_ENDPOINT': 'https://otel.example.com/v1/logs'},
                    {'OTEL_EXPORTER_OTLP_LOGS_ENDPOINT': 'http://127.0.0.1:20496/v1/logs',
                     'OTEL_LOGS_EXPORTER': 'otlp'}):
            with self.subTest(env=env):
                result, printed = self.configure(env)
                self.assertEqual('transcript', result['source'])
                self.assertIn('Preserving existing Claude telemetry policy', printed)
                self.assertNotIn('⚠️', printed)


class UpdateDiscoveryTests(unittest.TestCase):
    def test_update_never_treats_the_home_directory_as_a_project(self):
        with tempfile.TemporaryDirectory() as scratch:
            home = Path(scratch) / 'home'
            skill = home / '.claude' / 'skills' / 'uclusion' / 'SKILL.md'
            skill.parent.mkdir(parents=True)
            skill.write_text(cli.WORKFLOW_SKILL_MARKER + '\n', encoding='utf-8')
            write_json(home / '.mcp.json', {'mcpServers': {'Uclusion': {}}})
            (home / '.git').mkdir()
            nested = home / 'dev' / 'notes'
            nested.mkdir(parents=True)
            with mock.patch.object(cli.os.path, 'expanduser',
                                   side_effect=lambda path: path.replace('~', str(home), 1)):
                for start in (home, nested):
                    with self.subTest(start=start):
                        self.assertIsNone(cli.get_project_install_root('stage', str(start)))
                        self.assertEqual(set(), cli.detect_project_clients(str(start)))
                project = home / 'dev' / 'project'
                (project / '.claude' / 'skills' / 'uclusion').mkdir(parents=True)
                write_json(project / '.mcp.json', {'mcpServers': {'Uclusion': {}}})
                self.assertEqual(str(project),
                                 cli.get_project_install_root('stage', str(project)))


if __name__ == '__main__':
    unittest.main()
