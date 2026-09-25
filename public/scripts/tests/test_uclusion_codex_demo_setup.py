"""Codex demo setup retains native settings and isolates its workflow."""

import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest import mock


SCRIPTS = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    'uclusion_codex_demo_setup_test', SCRIPTS / 'uclusionInstall.py'
)
INSTALL = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(INSTALL)

# S-all-338: install_global also removes a home-directory project install's
# leftovers. Point those paths into scratch so no test reaches the real home.
_HOME_PROJECT_SCRATCH = tempfile.TemporaryDirectory()
INSTALL.HOME_PROJECT_MCP_JSON_PATH = os.path.join(
    _HOME_PROJECT_SCRATCH.name, '.mcp.json'
)
INSTALL.HOME_PROJECT_CLAUDE_SETTINGS_PATH = os.path.join(
    _HOME_PROJECT_SCRATCH.name, '.claude', 'settings.local.json'
)


class CodexDemoSetupTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.home = self.root / 'demo with spaces'
        self.home.mkdir()
        self.native = self.root / 'native-codex'
        self.native.mkdir()
        self.config = self.home / '.uclusion'
        self.config.mkdir()
        self.bin = self.home / '.local' / 'bin'
        self.bin.mkdir(parents=True)
        patches = {
            'UCLUSION_HOME': str(self.config),
            'CODEX_HOME': str(self.native),
            'CODEX_CONFIG_PATH': str(self.native / 'config.toml'),
            'CODEX_AGENTS_MD_PATH': str(self.native / 'AGENTS.md'),
            'CODEX_SKILL_DIR': str(self.root / 'native-skills' / 'uclusion'),
            'SYMLINK_DIR': str(self.bin),
            'MCP_PROXY_SYMLINK_PATH': str(self.bin / 'uclusionMCPProxy.py'),
        }
        for name, value in patches.items():
            patcher = mock.patch.object(INSTALL, name, value)
            patcher.start()
            self.addCleanup(patcher.stop)
        patcher = mock.patch.dict(os.environ, {'UCLUSION_HOME': str(self.home)})
        patcher.start()
        self.addCleanup(patcher.stop)
        patcher = mock.patch.object(INSTALL, 'demo_home_path', return_value=str(self.home))
        patcher.start()
        self.addCleanup(patcher.stop)
        self.bundle = {
            key: (SCRIPTS / relative).read_text()
            for key, relative in INSTALL.WORKFLOW_ASSET_PATHS.items()
        }
        self.fetch = lambda: self.bundle
        self.fetch.workflow_environment = 'stage'
        self.effective = {
            'features': {'apps': False, 'plugins': False, 'remote_plugin': False},
            'developer_instructions': 'Keep the native instruction.',
            'mcp_servers': {
                'Uclusion': {'command': 'native-proxy', 'args': ['native-workspace']},
                'Other.Server': {'url': 'https://example.invalid/mcp'},
            },
        }

    def inventory(self):
        descriptor = INSTALL.runtime_mcp_descriptor('demo-workspace', 'stage')
        return [
            {'name': 'Uclusion', 'enabled': True, 'transport': descriptor},
            {'name': 'Other.Server', 'enabled': False},
        ]

    def session_args(self, inventory=None):
        if not (self.config / 'bootstrap.md').exists():
            (self.config / 'bootstrap.md').write_text('Demo bootstrap\n')
        result = subprocess.CompletedProcess(
            [], 0, json.dumps(self.inventory() if inventory is None else inventory), ''
        )
        with mock.patch.object(INSTALL.shutil, 'which', return_value='/native/codex'), \
                mock.patch.object(INSTALL, '_read_demo_codex_config', return_value=self.effective), \
                mock.patch.object(INSTALL.subprocess, 'run', return_value=result) as run:
            args = INSTALL.demo_codex_session_args(
                'stage', 'demo-workspace'
            )
        return args, run.call_args.kwargs

    def test_environment_retains_native_login_and_removes_parent_bridge_identity(self):
        with mock.patch.dict(os.environ, {
            'HOME': '/native/home', 'PATH': '/native/bin',
            'UCLUSION_CODEX_BRIDGE_ACTIVE': 'parent',
            'UCLUSION_CODEX_STAGED_CLI': '/parent/release',
            'GIT_CONFIG_GLOBAL': '/native/git-config',
        }):
            child = INSTALL.demo_codex_environment()
            self.assertEqual('/native/home', os.environ['HOME'])
        self.assertEqual(str(self.home), child['HOME'])
        self.assertEqual(str(self.native), child['CODEX_HOME'])
        self.assertEqual(str(self.home), child['UCLUSION_HOME'])
        self.assertEqual(str(self.bin) + os.pathsep + '/native/bin', child['PATH'])
        self.assertEqual('/native/git-config', child['GIT_CONFIG_GLOBAL'])
        self.assertFalse(any(name.startswith('UCLUSION_CODEX_') for name in child))

    def test_demo_install_preserves_native_configuration_and_installs_complete_packages(self):
        native_files = {
            self.native / 'config.toml': '[mcp_servers.Uclusion]\ncommand="native"\n',
            self.native / 'AGENTS.md': 'Native workflow\n',
            self.native / 'auth.json': 'test-only login sentinel\n',
        }
        for path, content in native_files.items():
            path.write_text(content)
        with mock.patch.object(INSTALL, 'update_codex_integration_config') as update, \
                mock.patch.object(INSTALL, 'install_skill_and_stub') as global_workflow:
            INSTALL.install_global(
                'demo-workspace', 'demo-view', 'stage', self.fetch,
                clients={'codex'}, script_version='test-release',
            )
        update.assert_not_called()
        global_workflow.assert_not_called()
        for path, content in native_files.items():
            self.assertEqual(content, path.read_text())
        for package in ('uclusion', INSTALL.DESIGN_SKILL_NAME):
            for key, relative in INSTALL._skill_package_definition(package)[0]:
                self.assertEqual(
                    self.bundle[key],
                    (self.home / '.agents' / 'skills' / package / relative).read_text(),
                )
        bootstrap = (self.config / 'bootstrap.md').read_text()
        self.assertNotIn(INSTALL.WORKFLOW_ENV_PLACEHOLDER, bootstrap)
        self.assertIn(str(self.bin / 'uclusion'), bootstrap)
        self.assertNotIn('UCLUSION_HOME=', bootstrap)
        self.assertNotIn(
            INSTALL.WORKFLOW_ENV_PLACEHOLDER,
            (self.config / 'demo-brief.md').read_text(),
        )
        self.assertTrue((self.home / '.codex' / 'rules' / 'uclusion-demo.rules').is_file())

    def test_workflow_refuses_a_skill_parent_symlink(self):
        (self.home / '.agents').symlink_to(self.native, target_is_directory=True)
        with self.assertRaises(RuntimeError):
            INSTALL.install_demo_codex_workflow(self.fetch)
        self.assertEqual([], list(self.native.iterdir()))

    @unittest.skipIf(INSTALL.tomllib is None, 'TOML parsing requires Python 3.11')
    def test_launch_overrides_preserve_instructions_and_select_exact_demo_transport(self):
        args, invocation = self.session_args()
        settings = {}
        for index, value in enumerate(args[:-1]):
            if value == '-c':
                settings.update(INSTALL.tomllib.loads(args[index + 1]))
        self.assertEqual(
            'Keep the native instruction.\n\nDemo bootstrap\n',
            settings['developer_instructions'],
        )
        self.assertEqual(
            {str(self.home): {'trust_level': 'trusted'}}, settings['projects']
        )
        servers = settings['mcp_servers']
        self.assertFalse(servers['Other.Server']['enabled'])
        self.assertTrue(servers['Uclusion']['enabled'])
        self.assertTrue(servers['Uclusion']['required'])
        self.assertEqual(self.inventory()[0]['transport']['args'], servers['Uclusion']['args'])
        self.assertEqual('approve', servers['Uclusion']['default_tools_approval_mode'])
        self.assertNotIn('approval_policy', settings)
        self.assertNotIn('sandbox_mode', settings)
        self.assertEqual(str(self.native), invocation['env']['CODEX_HOME'])
        self.assertEqual(str(self.home), invocation['cwd'])

    def test_inherited_http_uclusion_transport_is_rejected_before_inventory_launch(self):
        self.effective['mcp_servers']['Uclusion'] = {'url': 'https://example.invalid'}
        with self.assertRaisesRegex(RuntimeError, 'inherited HTTP Uclusion'):
            self.session_args()

    @unittest.skipIf(INSTALL.tomllib is None, 'TOML parsing requires Python 3.11')
    def test_launch_keeps_the_complete_bootstrap_including_owner_role_extension(self):
        INSTALL.install_demo_codex_workflow(self.fetch)
        bootstrap = (self.config / 'bootstrap.md').read_text()
        args, _ = self.session_args()
        settings = {}
        for index, value in enumerate(args[:-1]):
            if value == '-c':
                settings.update(INSTALL.tomllib.loads(args[index + 1]))
        self.assertEqual(
            self.effective['developer_instructions'] + '\n\n' + bootstrap,
            settings['developer_instructions'],
        )

    def test_disabled_plugin_feature_must_be_effective(self):
        self.effective['features']['plugins'] = True
        with self.assertRaisesRegex(RuntimeError, 'did not disable'):
            self.session_args()

    def test_unrelated_enabled_server_or_wrong_workspace_fails_before_model(self):
        extra = self.inventory() + [{'name': 'Unexpected', 'enabled': True}]
        wrong = self.inventory()
        wrong[0]['transport']['args'] = ['other-workspace']
        malformed = self.inventory() + [{'name': 'UnknownEnablement'}]
        for inventory in (extra, wrong, malformed):
            with self.subTest(inventory=inventory), self.assertRaises(RuntimeError):
                self.session_args(inventory)

    def test_removal_preserves_native_registration_for_an_isolated_codex_install(self):
        native_config = '[mcp_servers.Uclusion]\ncommand="native-proxy"\n'
        (self.native / 'config.toml').write_text(native_config)
        INSTALL.install_demo_codex_workflow(self.fetch)
        with mock.patch.object(INSTALL, 'demo_installed_clients', return_value=['codex']), \
                mock.patch.object(INSTALL, '_remove_demo_registration') as registration:
            outcomes = INSTALL.remove_demo_client_traces()
        registration.assert_not_called()
        self.assertEqual(native_config, (self.native / 'config.toml').read_text())
        self.assertEqual(['absent'], [state for state, _ in outcomes])

    @unittest.skipIf(INSTALL.tomllib is None, 'TOML parsing requires Python 3.11')
    def test_isolated_reinstall_still_removes_proven_legacy_demo_registration(self):
        descriptor = INSTALL.runtime_mcp_descriptor('legacy-workspace', 'stage')
        native_config = 'model="native-model"\n' + INSTALL.build_codex_mcp_block(
            descriptor=descriptor
        )
        (self.native / 'config.toml').write_text(native_config)
        (self.native / 'AGENTS.md').write_text('Native notes\n' + self.bundle['codex_stub'])
        native_skills = Path(INSTALL.CODEX_SKILL_DIR).parent
        for package in ('uclusion', INSTALL.DESIGN_SKILL_NAME):
            for key, relative in INSTALL._skill_package_definition(package)[0]:
                path = native_skills / package / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(self.bundle[key])
        INSTALL.install_demo_codex_workflow(self.fetch)
        self.assertEqual(native_config, (self.native / 'config.toml').read_text())
        with mock.patch.object(INSTALL, 'demo_installed_clients', return_value=['codex']):
            outcomes = INSTALL.remove_demo_client_traces()
        self.assertEqual(['removed'] * 4, [state for state, _ in outcomes])
        self.assertEqual(
            {'model': 'native-model'},
            INSTALL.tomllib.loads((self.native / 'config.toml').read_text()),
        )
        self.assertEqual('Native notes', (self.native / 'AGENTS.md').read_text().strip())
        self.assertFalse((native_skills / 'uclusion').exists())
        self.assertFalse((native_skills / INSTALL.DESIGN_SKILL_NAME).exists())

    def test_effective_config_read_starts_no_thread_and_closes_the_server(self):
        script = self.root / 'fake_app_server.py'
        methods = self.root / 'methods.jsonl'
        script.write_text(
            'import json, os, sys\n'
            'for line in sys.stdin:\n'
            '    message = json.loads(line)\n'
            '    with open(os.environ["METHOD_LOG"], "a") as log:\n'
            '        log.write(message["method"] + "\\n")\n'
            '    if message["method"] == "initialize":\n'
            '        print(json.dumps({"id": message["id"], "result": {}}), flush=True)\n'
            '    elif message["method"] == "config/read":\n'
            '        print(json.dumps({"id": message["id"], "result": {"config": '
            '{"developer_instructions": "native"}}}), flush=True)\n'
        )
        environment = INSTALL.demo_codex_environment()
        environment['METHOD_LOG'] = str(methods)
        value = INSTALL._read_demo_codex_config(sys.executable, [str(script)], environment)
        self.assertEqual({'developer_instructions': 'native'}, value)
        self.assertEqual(['initialize', 'initialized', 'config/read'], methods.read_text().splitlines())


if __name__ == '__main__':
    unittest.main()
