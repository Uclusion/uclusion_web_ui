"""Installer permission scope and real Codex hook inventory, without model calls."""
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import tomllib
import unittest
from contextlib import contextmanager
from unittest.mock import patch


SPEC = importlib.util.spec_from_file_location(
    'handoff_install', Path(__file__).resolve().parents[1] / 'uclusionInstall.py')
INSTALL = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(INSTALL)


class HandoffPermissionTests(unittest.TestCase):
    def test_windows_command_uses_native_argument_quoting(self):
        executable = r'C:\Program Files\Python\python.exe'
        with patch.object(INSTALL.os, 'name', 'nt'), \
                patch.object(INSTALL.sys, 'executable', executable), \
                patch.object(INSTALL.subprocess, 'list2cmdline', wraps=subprocess.list2cmdline) as quote:
            command = INSTALL.codex_handoff_command()
        self.assertTrue(command.startswith('"' + executable + '" -I -c "'))
        self.assertEqual(executable, quote.call_args.args[0][0])

    def test_hook_ignores_project_and_pythonpath_imports(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            marker = root / 'project-module-ran'
            (root / 'json.py').write_text('from pathlib import Path\n'
                                         + 'Path(' + repr(str(marker)) + ').touch()\n')
            result = subprocess.run(
                INSTALL.codex_handoff_command(), shell=True, cwd=directory,
                env={**os.environ, 'PYTHONPATH': directory},
                input=json.dumps({'hook_event_name': 'PermissionRequest',
                                  'tool_name': INSTALL.CODEX_HANDOFF_TOOL}),
                capture_output=True, text=True, check=True,
            )
            self.assertEqual('allow', json.loads(result.stdout)['hookSpecificOutput']['decision']['behavior'])
            self.assertFalse(marker.exists())

    def test_command_allows_only_exact_tool_and_event(self):
        for event, tool, allowed in (
                ('PermissionRequest', INSTALL.CODEX_HANDOFF_TOOL, True),
                ('PreToolUse', INSTALL.CODEX_HANDOFF_TOOL, False),
                ('PermissionRequest', 'mcp__codex_tui__create_thread', False),
                ('PermissionRequest', 'mcp__other__send_message_to_thread', False),
                ('PermissionRequest', INSTALL.CODEX_HANDOFF_TOOL + '_other', False),
                ('PermissionRequest', 'Bash', False)):
            with self.subTest(event=event, tool=tool):
                result = subprocess.run(INSTALL.codex_handoff_command(), shell=True,
                                        input=json.dumps({'hook_event_name': event, 'tool_name': tool}),
                                        capture_output=True, text=True, check=True)
                value = json.loads(result.stdout)
                self.assertEqual({'hookSpecificOutput': {
                    'hookEventName': 'PermissionRequest', 'decision': {'behavior': 'allow'}}}
                                 if allowed else {}, value)

    def test_only_verified_owned_hook_receives_trust(self):
        for mismatch in ('sourcePath', 'matcher', 'command', 'eventName', 'async', 'isManaged'):
            with self.subTest(mismatch=mismatch), tempfile.TemporaryDirectory() as directory:
                path = Path(directory) / 'config.toml'
                writes = []

                @contextmanager
                def session(*unused):
                    def request(method, params):
                        if method == 'config/read':
                            return {'config': {}}
                        if method == 'configRequirements/read':
                            return {'requirements': None}
                        if method == 'hooks/list':
                            hook = {'sourcePath': str(path), 'eventName': 'permissionRequest',
                                    'handlerType': 'command', 'command': INSTALL.codex_handoff_command(),
                                    'matcher': INSTALL.CODEX_HANDOFF_MATCHER, 'async': False,
                                    'isManaged': False, 'enabled': True, 'key': 'foreign-key',
                                    'currentHash': 'foreign-hash', 'trustStatus': 'untrusted'}
                            hook[mismatch] = True if mismatch in ('async', 'isManaged') else 'other'
                            return {'data': [{'cwd': directory, 'hooks': [hook]}]}
                        writes.append((method, params))
                        raise AssertionError('Unverified hook must never be trusted')
                    yield request

                with patch.object(INSTALL.shutil, 'which', return_value='codex'), \
                        patch.object(INSTALL, 'codex_config_session', session):
                    with self.assertRaisesRegex(RuntimeError, 'did not load'):
                        INSTALL.configure_codex_handoff(str(path), directory)
                self.assertEqual([], writes)

    def test_disabled_and_managed_only_hooks_do_not_report_ready(self):
        for config, requirements, reason in (
                ({'features': {'hooks': False}}, {}, 'explicitly disabled'),
                ({'features': {'codex_hooks': False}}, {}, 'explicitly disabled'),
                ({}, {'allowManagedHooksOnly': True}, 'only managed hooks')):
            with self.subTest(reason=reason), tempfile.TemporaryDirectory() as directory:
                @contextmanager
                def session(*unused):
                    def request(method, params):
                        if method == 'config/read':
                            return {'config': config}
                        if method == 'configRequirements/read':
                            return {'requirements': requirements}
                        raise AssertionError('Disabled hook must not be trusted')
                    yield request
                with patch.object(INSTALL.shutil, 'which', return_value='codex'), \
                        patch.object(INSTALL, 'codex_config_session', session):
                    with self.assertRaisesRegex(RuntimeError, reason):
                        INSTALL.configure_codex_handoff(str(Path(directory) / 'config.toml'), directory)

    def test_missing_codex_leaves_existing_config_unchanged(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'config.toml'
            path.write_text('approval_policy = "on-request"\n')
            original = path.read_bytes()
            with patch.object(INSTALL.shutil, 'which', return_value=None):
                with self.assertRaisesRegex(RuntimeError, 'install Codex'):
                    INSTALL.configure_codex_handoff(str(path), directory)
            self.assertEqual(original, path.read_bytes())


@unittest.skipUnless(shutil.which('codex'), 'Codex is needed for the isolated configuration API check')
class NativeHandoffConfigurationTests(unittest.TestCase):
    def test_symlinked_config_is_trusted_without_replacing_symlink(self):
        with tempfile.TemporaryDirectory(prefix='uclusion-handoff-test-') as directory:
            home = Path(directory) / 'codex'
            home.mkdir()
            target = Path(directory) / 'settings.toml'
            target.write_text('approval_policy = "on-request"\n')
            path = home / 'config.toml'
            path.symlink_to(target)
            with patch.object(INSTALL, 'CODEX_HOME', str(home)):
                INSTALL.configure_codex_handoff(str(path), directory)
            self.assertTrue(path.is_symlink())
            self.assertEqual(target.read_bytes(), path.read_bytes())
            self.assertEqual(1, len(tomllib.loads(target.read_text())['hooks']['state']))

    def test_repeated_install_preserves_policies_other_hooks_and_their_trust(self):
        with tempfile.TemporaryDirectory(prefix='uclusion-handoff-test-') as directory:
            home = Path(directory) / 'codex'
            home.mkdir()
            path = home / 'config.toml'
            path.write_text('approval_policy = "on-request"\nsandbox_mode = "read-only"\n'
                            '# Customer policy\n[[hooks.PermissionRequest]]\nmatcher = "^Bash$"\n'
                            '[[hooks.PermissionRequest.hooks]]\ntype = "command"\ncommand = "true"\n'
                            '[hooks.state.customer_hook]\ntrusted_hash = "keep-this-hash"\n')
            with patch.object(INSTALL, 'CODEX_HOME', str(home)):
                INSTALL.configure_codex_handoff(str(path), directory)
                first = path.read_bytes()
                INSTALL.configure_codex_handoff(str(path), directory)
                self.assertEqual(first, path.read_bytes())
                parsed = tomllib.loads(path.read_text())
                self.assertEqual('on-request', parsed['approval_policy'])
                self.assertEqual('read-only', parsed['sandbox_mode'])
                self.assertEqual('keep-this-hash', parsed['hooks']['state']['customer_hook']['trusted_hash'])
                self.assertEqual(['^Bash$', INSTALL.CODEX_HANDOFF_MATCHER],
                                 [group['matcher'] for group in parsed['hooks']['PermissionRequest']])
                with INSTALL.codex_config_session(shutil.which('codex'), [],
                                                  {**os.environ, 'CODEX_HOME': str(home)}, directory) as request:
                    hooks = request('hooks/list', {'cwds': [directory]})['data'][0]['hooks']
                self.assertEqual(['untrusted', 'trusted'], [hook['trustStatus'] for hook in hooks])
                self.assertEqual(2, len(parsed['hooks']['state']))
                self.assertIn('# Customer policy', path.read_text())

    def test_explicitly_disabled_hooks_remain_disabled(self):
        with tempfile.TemporaryDirectory(prefix='uclusion-handoff-test-') as directory:
            home = Path(directory) / 'codex'
            home.mkdir()
            path = home / 'config.toml'
            path.write_text('[features]\nhooks = false\n')
            with patch.object(INSTALL, 'CODEX_HOME', str(home)):
                with self.assertRaisesRegex(RuntimeError, 'explicitly disabled'):
                    INSTALL.configure_codex_handoff(str(path), directory)
            self.assertFalse(tomllib.loads(path.read_text())['features']['hooks'])
            self.assertNotIn('state', tomllib.loads(path.read_text())['hooks'])


if __name__ == '__main__':
    unittest.main()
