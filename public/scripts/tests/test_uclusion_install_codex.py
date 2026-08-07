import importlib.util
import os
import stat
import tempfile
import threading
import time
import tomllib
import unittest
from unittest import mock


SCRIPT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODULE_PATH = os.path.join(SCRIPT_DIR, 'uclusionInstall.py')
SPEC = importlib.util.spec_from_file_location('uclusion_install_under_test', MODULE_PATH)
INSTALL = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(INSTALL)


class WorkflowProtocolContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        workflow_path = os.path.join(SCRIPT_DIR, 'CLAUDE.md')
        with open(workflow_path, encoding='utf-8') as workflow:
            cls.workflow = ' '.join(workflow.read().split())

    def test_protocol_reserves_start_for_explicit_ui_poke(self):
        self.assertIn(
            '`Start <target>` is reserved exclusively for an explicit human '
            'click on',
            self.workflow,
        )
        self.assertIn('never uses `Start`', self.workflow)
        # T-all-2428 / Q-all-349 / T-all-2430: Start only auto-starts when
        # live and idle; replayed lines are dropped on the floor
        self.assertIn(
            'A deferred `Start` does NOT convert into an auto-start',
            self.workflow,
        )
        self.assertIn('drop it like every replayed line', self.workflow)
        # S-all-205: fresh session cursors start at arm time; the marked-line
        # rule survives only as the older-CLI compatibility note
        self.assertIn("cursor starts at arm time", self.workflow)
        self.assertIn('drop them on the floor', self.workflow)
        # Q-all-351 O-1: the backlog stays reachable on explicit request
        self.assertIn('--deliver-existing-pokes', self.workflow)

    def test_codex_bridge_skips_startup_backlog_by_default(self):
        self.assertIn(
            'establishes a startup cutoff and atomically skips every Poke '
            'already queued at that cutoff',
            self.workflow,
        )
        self.assertIn(
            'uclusion codex --deliver-existing-pokes',
            self.workflow,
        )
        self.assertIn(
            'Never add this flag on your own initiative',
            self.workflow,
        )

    def test_added_and_updated_preserve_active_scope_and_stage_lock(self):
        self.assertIn(
            '`Added` and `Updated` are additive event notices',
            self.workflow,
        )
        # T-all-2428: in-lane targets incorporate; out-of-lane defers unreloaded
        self.assertIn(
            'abandon the work merely because the event arrived',
            self.workflow,
        )
        self.assertIn(
            'whatever assistance it awaits',
            self.workflow,
        )
        self.assertIn(
            'defer it unreloaded',
            self.workflow,
        )
        self.assertIn(
            'make the loaded target active subject to the same stage',
            self.workflow,
        )
        self.assertIn(
            'returns the current enclosing job with the deleted item absent',
            self.workflow,
        )

    def test_direct_and_compound_targets_have_explicit_lookup_rules(self):
        self.assertIn(
            'For a direct prompt, call `get_job` with exactly its',
            self.workflow,
        )
        self.assertIn(
            'For any compound prompt, call `get_job` with the parent code after',
            self.workflow,
        )
        self.assertIn(
            'needs no research to',
            self.workflow,
        )
        self.assertIn(
            'the parent code after `of` names the enclosing work',
            self.workflow,
        )
        self.assertIn(
            'A direct lookup makes five short-code attempts total',
            self.workflow,
        )
        self.assertIn(
            'retry `get_job` later instead of discarding the event',
            self.workflow,
        )

    def test_stage_changing_addition_is_delivered_after_workflow_commit(self):
        self.assertIn(
            'withholds that item\'s `Added` event until the workflow write has',
            self.workflow,
        )
        self.assertIn(
            'include both the new item and the current',
            self.workflow,
        )
        self.assertIn(
            'Do not expect or wait for a second stage Poke',
            self.workflow,
        )

    def test_cursor_stop_hook_drain_is_documented(self):
        self.assertIn('Cursor stop-hook drain', self.workflow)
        self.assertIn('uclusionCursorPokeDrain.py', self.workflow)
        self.assertIn('followup_message', self.workflow)
        self.assertIn(
            'does **not** wake a fully idle chat',
            self.workflow,
        )

    def test_auto_take_starts_first_marked_item_and_persists_handoffs(self):
        # T-all-2440 / Q-all-370 O-1: auto-take is an idle, same-turn action,
        # and every material handoff survives outside transient chat.
        self.assertIn('When the response carries `auto_take_directions`', self.workflow)
        self.assertIn('you are idle', self.workflow)
        self.assertIn('in the same turn', self.workflow)
        self.assertIn('call `get_job` for the FIRST `auto_take` item', self.workflow)
        self.assertIn('Merely announcing that you will start is not enough', self.workflow)
        self.assertIn('handoff rule lasts for its entire active work lane', self.workflow)
        self.assertIn('initial auto-take turn or any later turn', self.workflow)
        self.assertIn('MUST leave a material handoff in Uclusion', self.workflow)
        self.assertIn('specialized Uclusion MCP tool', self.workflow)
        self.assertIn('otherwise use `add_info` on the active item', self.workflow)
        self.assertIn('must never be its only copy', self.workflow)
        self.assertIn('Transient conversation', self.workflow)

    def test_execution_is_allowed_in_doable_or_reviewable(self):
        # T-all-2441: Reviewable remains governed by review authorship, but it
        # is an executable stage alongside Doable for review work and revisions.
        self.assertIn(
            'Execute and document - only applies if the job is in stage '
            '"Doable" or "Reviewable"',
            self.workflow,
        )
        self.assertIn(
            'Finding a job already in "Doable" or "Reviewable" does NOT mean',
            self.workflow,
        )
        self.assertIn('Both stages unlock execution', self.workflow)
        self.assertIn(
            'after the job returns to either "Doable" or "Reviewable"',
            self.workflow,
        )
        self.assertIn(
            'reaching "Doable" or "Reviewable" only unlocks execution',
            self.workflow,
        )
        self.assertIn(
            'review-direction rules in step 6 still determine whether to work or wait',
            self.workflow,
        )
        self.assertIn(
            'If the job is in neither "Doable" nor "Reviewable" and you are ready',
            self.workflow,
        )
        self.assertNotIn(
            'implement only after the job is back in "Doable"',
            self.workflow,
        )
        self.assertNotIn(
            'reaching "Doable" only unlocks execution',
            self.workflow,
        )

    def test_token_audit_boundaries_and_bucket_semantics_are_documented(self):
        self.assertIn('`start_job_audit` before substantive planning', self.workflow)
        self.assertIn('initial bucket is `planning`', self.workflow)
        self.assertIn('applies to the next model request', self.workflow)
        self.assertIn('Bucket labels are user-labelable', self.workflow)
        self.assertIn('ordinary defaults are `planning`', self.workflow)
        self.assertIn('but they are not restrictions', self.workflow)
        self.assertIn('no more than 32 distinct labels', self.workflow)
        self.assertIn('Every request belongs to exactly one active bucket', self.workflow)
        self.assertIn('do not create separate standard/custom dimensions', self.workflow)
        self.assertIn('switch to `testing` when you begin running tests', self.workflow)
        self.assertIn('reserve custom labels like `commit and push`', self.workflow)
        self.assertIn('lookup performed only to classify an inbound Poke', self.workflow)
        self.assertIn('collection finishes out of band', self.workflow)
        self.assertIn('partial client telemetry never block', self.workflow)


class PortableFileLockTests(unittest.TestCase):
    def test_installer_imports_without_fcntl(self):
        real_import = __import__
        fake_msvcrt = mock.Mock()

        def import_without_fcntl(name, globals=None, locals=None, fromlist=(), level=0):
            if name == 'fcntl':
                raise ImportError('fcntl is unavailable on native Windows')
            if name == 'msvcrt':
                return fake_msvcrt
            return real_import(name, globals, locals, fromlist, level)

        spec = importlib.util.spec_from_file_location(
            'uclusion_install_windows_import_test',
            MODULE_PATH,
        )
        windows_install = importlib.util.module_from_spec(spec)
        with mock.patch('builtins.__import__', side_effect=import_without_fcntl):
            spec.loader.exec_module(windows_install)

        self.assertIsNone(windows_install.fcntl)
        self.assertIs(windows_install.msvcrt, fake_msvcrt)

    def test_windows_file_lock_retries_contention_and_releases(self):
        fake_msvcrt = mock.Mock()
        fake_msvcrt.LK_NBLCK = 1
        fake_msvcrt.LK_UNLCK = 2
        fake_msvcrt.locking.side_effect = [
            OSError(INSTALL.errno.EACCES, 'already locked'),
            None,
            None,
        ]

        with tempfile.TemporaryDirectory() as temp_dir:
            lock_path = os.path.join(temp_dir, 'portable.lock')
            with open(lock_path, 'a+b') as lock_file, \
                    mock.patch.object(INSTALL, 'fcntl', None), \
                    mock.patch.object(INSTALL, 'msvcrt', fake_msvcrt), \
                    mock.patch.object(INSTALL.time, 'sleep') as sleep:
                with INSTALL._exclusive_file_lock(lock_file):
                    self.assertEqual(lock_file.tell(), 0)

            with open(lock_path, 'rb') as lock_file:
                self.assertEqual(lock_file.read(), b'\0')

        modes = [
            call.args[1]
            for call in fake_msvcrt.locking.call_args_list
        ]
        self.assertEqual(modes, [fake_msvcrt.LK_NBLCK] * 2 + [fake_msvcrt.LK_UNLCK])
        sleep.assert_called_once_with(0.05)


class CodexIntegrationConfigTests(unittest.TestCase):
    LEGACY_HOOK_BLOCK = (
        f'{INSTALL.LEGACY_CODEX_HOOKS_MARKER}\n'
        '[[hooks.SessionStart]]\n'
        'matcher = "startup|resume|clear|compact"\n'
        '[[hooks.SessionStart.hooks]]\n'
        'type = "command"\n'
        'command = "legacy-uclusion-register"\n'
        f'{INSTALL.LEGACY_CODEX_HOOKS_END_MARKER}\n'
    )
    UNRELATED_HOOK_BLOCK = (
        '[[hooks.Stop]]\n'
        '[[hooks.Stop.hooks]]\n'
        'type = "command"\n'
        'command = "keep-this-hook"\n'
    )

    def test_bridge_script_is_part_of_release(self):
        self.assertIn(
            ('uclusionCodexBridge.py', 'uclusionCodexBridge.py', 'uclusionCodexBridge.py'),
            INSTALL.SCRIPT_FILES,
        )

    def test_cursor_poke_drain_script_is_part_of_release(self):
        self.assertIn(
            (
                'uclusionCursorPokeDrain.py',
                'uclusionCursorPokeDrain.py',
                INSTALL.CURSOR_POKE_DRAIN_SYMLINK_NAME,
            ),
            INSTALL.SCRIPT_FILES,
        )

    def test_legacy_hook_cleanup_is_idempotent_and_preserves_other_config(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = os.path.join(temp_dir, 'config.toml')
            with open(config_path, 'w', encoding='utf-8') as config:
                config.write(
                    'model = "gpt-test"\n\n'
                    + self.UNRELATED_HOOK_BLOCK
                    + '\n'
                    + self.LEGACY_HOOK_BLOCK
                )
            with mock.patch.object(INSTALL, 'CODEX_HOME', temp_dir), \
                    mock.patch.object(INSTALL, 'CODEX_CONFIG_PATH', config_path):
                INSTALL.remove_legacy_codex_hooks_config(force=True)
                INSTALL.remove_legacy_codex_hooks_config(force=True)
            with open(config_path, encoding='utf-8') as config:
                result = config.read()

        parsed = tomllib.loads(result)
        self.assertIn('model = "gpt-test"', result)
        self.assertNotIn(INSTALL.LEGACY_CODEX_HOOKS_MARKER, result)
        self.assertNotIn(INSTALL.LEGACY_CODEX_HOOKS_END_MARKER, result)
        self.assertEqual(
            parsed['hooks']['Stop'][0]['hooks'][0]['command'],
            'keep-this-hook',
        )

    @unittest.skipUnless(hasattr(os, 'symlink'), 'requires symlink support')
    def test_config_symlink_is_preserved_while_target_is_updated(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            codex_home = os.path.join(temp_dir, 'codex')
            dotfiles_dir = os.path.join(temp_dir, 'dotfiles')
            os.makedirs(codex_home)
            os.makedirs(dotfiles_dir)
            config_path = os.path.join(codex_home, 'config.toml')
            target_path = os.path.join(dotfiles_dir, 'codex.toml')
            original = (
                'model = "gpt-test"\n\n'
                + self.UNRELATED_HOOK_BLOCK
                + '\n'
                + self.LEGACY_HOOK_BLOCK
            )
            with open(target_path, 'w', encoding='utf-8') as config:
                config.write(original)
            os.chmod(target_path, 0o640)
            relative_target = os.path.relpath(target_path, codex_home)
            os.symlink(relative_target, config_path)

            with mock.patch.object(INSTALL, 'CODEX_HOME', codex_home), \
                    mock.patch.object(
                        INSTALL, 'CODEX_CONFIG_PATH', config_path
                    ):
                INSTALL.remove_legacy_codex_hooks_config(force=True)

            with open(target_path, encoding='utf-8') as config:
                result = config.read()

            self.assertTrue(os.path.islink(config_path))
            self.assertEqual(relative_target, os.readlink(config_path))
            self.assertEqual(0o640, stat.S_IMODE(os.stat(target_path).st_mode))

        parsed = tomllib.loads(result)
        self.assertNotIn(INSTALL.LEGACY_CODEX_HOOKS_MARKER, result)
        self.assertEqual(
            parsed['hooks']['Stop'][0]['hooks'][0]['command'],
            'keep-this-hook',
        )

    @unittest.skipUnless(hasattr(os, 'symlink'), 'requires symlink support')
    def test_dangling_config_symlink_is_rejected_without_replacement(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = os.path.join(temp_dir, 'config.toml')
            missing_target = os.path.join(temp_dir, 'missing.toml')
            os.symlink(missing_target, config_path)

            with mock.patch.object(INSTALL, 'CODEX_HOME', temp_dir), \
                    mock.patch.object(
                        INSTALL, 'CODEX_CONFIG_PATH', config_path
                    ):
                with self.assertRaisesRegex(RuntimeError, 'dangling symlink'):
                    INSTALL.remove_legacy_codex_hooks_config(force=True)

            self.assertTrue(os.path.islink(config_path))
            self.assertEqual(missing_target, os.readlink(config_path))
            self.assertFalse(os.path.exists(missing_target))

    def test_same_content_concurrent_replacement_is_not_overwritten(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = os.path.join(temp_dir, 'config.toml')
            original = 'model = "gpt-test"\n\n' + self.LEGACY_HOOK_BLOCK
            with open(config_path, 'w', encoding='utf-8') as config:
                config.write(original)
            real_atomic_write = INSTALL.atomic_write_text
            racing_inode = []

            def replace_after_read(*args, **kwargs):
                replacement_path = config_path + '.editor'
                with open(
                    replacement_path, 'w', encoding='utf-8'
                ) as replacement:
                    replacement.write(original)
                os.replace(replacement_path, config_path)
                racing_inode.append(os.stat(config_path).st_ino)
                return real_atomic_write(*args, **kwargs)

            with mock.patch.object(INSTALL, 'CODEX_HOME', temp_dir), \
                    mock.patch.object(
                        INSTALL, 'CODEX_CONFIG_PATH', config_path
                    ), mock.patch.object(
                        INSTALL,
                        'atomic_write_text',
                        side_effect=replace_after_read,
                    ):
                with self.assertRaisesRegex(RuntimeError, 'changed while'):
                    INSTALL.remove_legacy_codex_hooks_config(force=True)

            with open(config_path, encoding='utf-8') as config:
                result = config.read()
            final_inode = os.stat(config_path).st_ino

        self.assertEqual(original, result)
        self.assertEqual(racing_inode, [final_inode])

    def test_cleanup_without_legacy_hooks_does_not_rewrite_config(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = os.path.join(temp_dir, 'config.toml')
            original = 'model = "gpt-test"\n'
            with open(config_path, 'w', encoding='utf-8') as config:
                config.write(original)
            with mock.patch.object(INSTALL, 'CODEX_HOME', temp_dir), \
                    mock.patch.object(INSTALL, 'CODEX_CONFIG_PATH', config_path), \
                    mock.patch.object(INSTALL, 'atomic_write_text') as write:
                INSTALL.remove_legacy_codex_hooks_config(force=True)
            write.assert_not_called()
            with open(config_path, encoding='utf-8') as config:
                self.assertEqual(config.read(), original)

    def test_orphan_hook_marker_refuses_to_modify(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = os.path.join(temp_dir, 'config.toml')
            original = (
                'model = "gpt-test"\n'
                f'{INSTALL.LEGACY_CODEX_HOOKS_MARKER}\n'
            )
            with open(config_path, 'w', encoding='utf-8') as config:
                config.write(original)
            with mock.patch.object(INSTALL, 'CODEX_HOME', temp_dir), \
                    mock.patch.object(INSTALL, 'CODEX_CONFIG_PATH', config_path):
                with self.assertRaisesRegex(RuntimeError, 'orphaned'):
                    INSTALL.remove_legacy_codex_hooks_config(force=True)
            with open(config_path, encoding='utf-8') as config:
                result = config.read()
        self.assertEqual(result, original)

    def test_duplicate_or_reversed_markers_refuse_without_modifying(self):
        malformed_configs = (
            (
                f'{INSTALL.LEGACY_CODEX_HOOKS_MARKER}\n'
                f'{INSTALL.LEGACY_CODEX_HOOKS_MARKER}\n'
                f'{INSTALL.LEGACY_CODEX_HOOKS_END_MARKER}\n'
            ),
            (
                f'{INSTALL.LEGACY_CODEX_HOOKS_END_MARKER}\n'
                f'{INSTALL.LEGACY_CODEX_HOOKS_MARKER}\n'
            ),
        )
        for original in malformed_configs:
            with self.subTest(original=original), \
                    tempfile.TemporaryDirectory() as temp_dir:
                config_path = os.path.join(temp_dir, 'config.toml')
                with open(config_path, 'w', encoding='utf-8') as config:
                    config.write(original)
                with mock.patch.object(INSTALL, 'CODEX_HOME', temp_dir), \
                        mock.patch.object(
                            INSTALL, 'CODEX_CONFIG_PATH', config_path
                        ):
                    with self.assertRaisesRegex(
                        RuntimeError, 'duplicate, orphaned, or reversed'
                    ):
                        INSTALL.remove_legacy_codex_hooks_config(force=True)
                with open(config_path, encoding='utf-8') as config:
                    self.assertEqual(config.read(), original)

    def test_combined_codex_update_adds_mcp_and_removes_legacy_hooks(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = os.path.join(temp_dir, 'config.toml')
            with open(config_path, 'w', encoding='utf-8') as config:
                config.write(
                    'model = "gpt-test"\n\n'
                    + self.UNRELATED_HOOK_BLOCK
                    + '\n'
                    + self.LEGACY_HOOK_BLOCK
                )
            with mock.patch.object(INSTALL, 'CODEX_HOME', temp_dir), \
                    mock.patch.object(INSTALL, 'CODEX_CONFIG_PATH', config_path):
                INSTALL.update_codex_integration_config(
                    'workspace-1', 'stage', force=True
                )
                INSTALL.update_codex_integration_config(
                    'workspace-1', 'stage', force=True
                )
            with open(config_path, encoding='utf-8') as config:
                result = config.read()

        parsed = tomllib.loads(result)
        self.assertEqual('gpt-test', parsed['model'])
        self.assertEqual(result.count(INSTALL.CODEX_CONFIG_MARKER), 1)
        self.assertEqual(result.count(INSTALL.CODEX_CONFIG_END_MARKER), 1)
        self.assertNotIn(INSTALL.LEGACY_CODEX_HOOKS_MARKER, result)
        self.assertNotIn(INSTALL.LEGACY_CODEX_HOOKS_END_MARKER, result)
        self.assertEqual(
            parsed['hooks']['Stop'][0]['hooks'][0]['command'],
            'keep-this-hook',
        )
        self.assertEqual(
            parsed['mcp_servers']['Uclusion']['default_tools_approval_mode'],
            'approve',
        )

    def test_atomic_config_write_failure_propagates_and_preserves_original(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = os.path.join(temp_dir, 'config.toml')
            original = 'model = "gpt-test"\n\n' + self.LEGACY_HOOK_BLOCK
            with open(config_path, 'w', encoding='utf-8') as config:
                config.write(original)
            with mock.patch.object(INSTALL, 'CODEX_HOME', temp_dir), \
                    mock.patch.object(INSTALL, 'CODEX_CONFIG_PATH', config_path), \
                    mock.patch.object(
                        INSTALL,
                        'atomic_write_text',
                        side_effect=OSError('disk full'),
                    ):
                with self.assertRaisesRegex(OSError, 'disk full'):
                    INSTALL.remove_legacy_codex_hooks_config(force=True)
            with open(config_path, encoding='utf-8') as config:
                self.assertEqual(config.read(), original)

    def test_project_codex_install_cleans_legacy_hooks_and_installs_agents(self):
        with tempfile.TemporaryDirectory() as project_dir, \
                mock.patch.object(INSTALL, 'write_uclusion_config'), \
                mock.patch.object(
                    INSTALL, 'remove_legacy_codex_hooks_config'
                ) as remove_hooks, \
                mock.patch.object(INSTALL, 'install_workflow_md') as install_md:
            fetch_md = mock.Mock()
            INSTALL.install_project_level(
                'workspace-1',
                'view-1',
                'stage',
                fetch_md,
                project_dir,
                clients={'codex'},
                script_version='release-1',
            )

        remove_hooks.assert_called_once_with(force=True)
        install_md.assert_called_once_with(
            fetch_md,
            os.path.join(project_dir, 'AGENTS.md'),
            'Codex (project)',
            assume_yes=True,
        )


class ConfigVersionStampTests(unittest.TestCase):
    def test_unversioned_activation_clears_stale_release_stamp(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = os.path.join(temp_dir, 'uclusion.json')
            INSTALL.write_uclusion_config(
                'workspace-1', None, config_path, 'release-1'
            )
            INSTALL.write_uclusion_config(
                'workspace-1', None, config_path, None
            )
            with open(config_path, encoding='utf-8') as config:
                result = INSTALL.json.load(config)

        self.assertNotIn('scriptReinstallVersion', result)


class TokenAuditInstallerTests(unittest.TestCase):
    def test_claude_disabled_hooks_declines_audit_and_preserves_setting(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            settings_path = os.path.join(temp_dir, 'settings.json')
            managed_env = INSTALL.claude_token_audit_env(23456)
            owned_command = INSTALL.claude_token_audit_hook_command(
                'stage', 'workspace-1', 'otel', 23456
            )
            with open(settings_path, 'w', encoding='utf-8') as settings:
                INSTALL.json.dump(
                    {
                        'disableAllHooks': True,
                        'env': dict(managed_env, KEEP_ME='yes'),
                        'hooks': {
                            'Stop': [
                                {
                                    'hooks': [
                                        {
                                            'type': 'command',
                                            'command': owned_command,
                                        },
                                        {
                                            'type': 'command',
                                            'command': 'keep-stop',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    settings,
                )

            with mock.patch('builtins.print') as output:
                result = INSTALL.configure_claude_token_audit(
                    settings_path, True, 'stage', 'workspace-1', 23456,
                    managed_env,
                )
            with open(settings_path, encoding='utf-8') as settings:
                config = INSTALL.json.load(settings)

        self.assertEqual(
            result,
            {'source': None, 'managedEnv': {}, 'available': False},
        )
        self.assertIs(config['disableAllHooks'], True)
        self.assertEqual(config['env'], {'KEEP_ME': 'yes'})
        self.assertEqual(
            config['hooks']['Stop'],
            [{'hooks': [{'type': 'command', 'command': 'keep-stop'}]}],
        )
        warning = ' '.join(
            str(call.args[0]) for call in output.call_args_list if call.args
        )
        self.assertIn('disableAllHooks=true', warning)
        self.assertIn('Claude token audit was not enabled', warning)

    def test_disabled_hooks_omits_audit_args_from_claude_registration(self):
        unavailable = {
            'source': None,
            'managedEnv': {},
            'available': False,
        }
        with tempfile.TemporaryDirectory() as project_dir, \
                mock.patch.object(INSTALL, 'write_uclusion_config', return_value={
                    'enabled': True, 'port': 23456,
                }), \
                mock.patch.object(INSTALL, 'add_claude_permissions'), \
                mock.patch.object(
                    INSTALL, 'configure_claude_token_audit',
                    return_value=unavailable,
                ), \
                mock.patch.object(INSTALL, 'update_token_audit_client_config'), \
                mock.patch.object(INSTALL, 'register_mcp_json') as register, \
                mock.patch.object(INSTALL, 'install_workflow_md'):
            INSTALL.install_project_level(
                'workspace-1', 'view-1', 'stage', mock.Mock(), project_dir,
                clients={'claude'}, token_audit_enabled=True,
            )

        self.assertIsNone(register.call_args.kwargs['token_audit'])

    def test_claude_settings_failure_degrades_audit_not_mcp_registration(self):
        with tempfile.TemporaryDirectory() as project_dir, \
                mock.patch.object(INSTALL, 'write_uclusion_config', return_value={
                    'enabled': True, 'port': 23456,
                }), \
                mock.patch.object(INSTALL, 'add_claude_permissions'), \
                mock.patch.object(
                    INSTALL, 'configure_claude_token_audit', return_value=None
                ), \
                mock.patch.object(INSTALL, 'register_mcp_json') as register, \
                mock.patch.object(INSTALL, 'install_workflow_md'):
            INSTALL.install_project_level(
                'workspace-1', 'view-1', 'stage', mock.Mock(), project_dir,
                clients={'claude'}, token_audit_enabled=True,
            )

        self.assertIsNone(register.call_args.kwargs['token_audit'])
        self.assertEqual('claude', register.call_args.kwargs['token_audit_client'])

    def test_helper_script_and_tri_state_flags(self):
        self.assertIn(
            (
                'uclusionTokenAudit.py',
                'uclusionTokenAudit.py',
                INSTALL.TOKEN_AUDIT_SYMLINK_NAME,
            ),
            INSTALL.SCRIPT_FILES,
        )
        base = ['stage', 'workspace-1', 'view-1']
        self.assertIsNone(INSTALL.build_parser().parse_args(base).token_audit)
        self.assertTrue(
            INSTALL.build_parser().parse_args(base + ['--token-audit']).token_audit
        )
        self.assertFalse(
            INSTALL.build_parser().parse_args(base + ['--no-token-audit']).token_audit
        )

    def test_config_defaults_off_and_preserves_explicit_preference(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = os.path.join(temp_dir, 'uclusion.json')
            initial = INSTALL.write_uclusion_config(
                'workspace-1', None, config_path
            )
            enabled = INSTALL.write_uclusion_config(
                'workspace-1', None, config_path, token_audit_enabled=True
            )
            preserved = INSTALL.write_uclusion_config(
                'workspace-1', None, config_path
            )
            disabled = INSTALL.write_uclusion_config(
                'workspace-1', None, config_path, token_audit_enabled=False
            )

        self.assertFalse(initial['enabled'])
        self.assertIsInstance(initial['port'], int)
        self.assertTrue(enabled['enabled'])
        self.assertEqual(enabled['port'], initial['port'])
        self.assertTrue(preserved['enabled'])
        self.assertFalse(disabled['enabled'])

    def test_enabled_claude_registration_receives_audit_arguments(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            mcp_path = os.path.join(temp_dir, '.mcp.json')
            INSTALL.register_mcp_json(
                mcp_path,
                'Claude Code',
                'workspace-1',
                'stage',
                require_existing=False,
                token_audit={
                    'enabled': True,
                    'port': 23456,
                    'claudeSource': 'otel',
                },
                token_audit_client='claude',
            )
            with open(mcp_path, encoding='utf-8') as mcp_file:
                args = INSTALL.json.load(mcp_file)['mcpServers']['Uclusion']['args']

        self.assertEqual(
            args,
            [
                INSTALL.MCP_PROXY_SYMLINK_PATH,
                'workspace-1',
                'stage',
                '--token-audit',
                '--token-audit-port', '23456',
                '--token-audit-source', 'otel',
                '--token-audit-client', 'claude',
            ],
        )

    def test_claude_otel_merge_is_private_and_idempotent(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            settings_path = os.path.join(temp_dir, 'settings.json')
            with open(settings_path, 'w', encoding='utf-8') as settings:
                INSTALL.json.dump(
                    {
                        'theme': 'dark',
                        'env': {'KEEP_ME': 'yes'},
                        'hooks': {
                            'Stop': [
                                {'hooks': [{'type': 'command', 'command': 'keep-stop'}]},
                            ],
                        },
                    },
                    settings,
                )

            first = INSTALL.configure_claude_token_audit(
                settings_path, True, 'stage', 'workspace-1', 23456
            )
            with open(settings_path, encoding='utf-8') as settings:
                first_config = INSTALL.json.load(settings)
            second = INSTALL.configure_claude_token_audit(
                settings_path, True, 'stage', 'workspace-1', 23456,
                first['managedEnv'],
            )
            with open(settings_path, encoding='utf-8') as settings:
                second_config = INSTALL.json.load(settings)

        self.assertEqual(first['source'], 'otel')
        self.assertEqual(second['source'], 'otel')
        self.assertEqual(first_config, second_config)
        self.assertEqual(first_config['theme'], 'dark')
        self.assertEqual(first_config['env']['KEEP_ME'], 'yes')
        for key, value in INSTALL.claude_token_audit_env(23456).items():
            self.assertEqual(first_config['env'][key], value)
        marker_groups = first_config['hooks']['PostToolUse']
        self.assertEqual(len(marker_groups), 1)
        self.assertEqual(
            marker_groups[0]['matcher'],
            INSTALL.CLAUDE_TOKEN_AUDIT_MARKER_MATCHER,
        )
        marker_command = INSTALL.shlex.split(
            marker_groups[0]['hooks'][0]['command']
        )
        self.assertEqual(
            marker_command,
            [
                INSTALL.TOKEN_AUDIT_SYMLINK_PATH,
                'hook',
                '--environment', 'stage',
                '--workspace-id', 'workspace-1',
                '--source', 'otel',
                '--port', '23456',
            ],
        )
        self.assertEqual(len(first_config['hooks']['Stop']), 2)
        for event, _matcher in INSTALL.CLAUDE_TOKEN_AUDIT_HOOK_EVENTS:
            owned_handlers = [
                handler
                for group in first_config['hooks'][event]
                for handler in group.get('hooks', [])
                if INSTALL._is_claude_token_audit_handler(handler)
            ]
            self.assertEqual(len(owned_handlers), 1, event)
            self.assertEqual(
                owned_handlers[0]['timeout'],
                INSTALL.CLAUDE_TOKEN_AUDIT_OTEL_HOOK_TIMEOUT_SECONDS,
                event,
            )

    def test_existing_telemetry_policy_uses_transcript_without_changes(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            settings_path = os.path.join(temp_dir, 'settings.json')
            existing_env = {
                'OTEL_EXPORTER_OTLP_ENDPOINT': 'https://telemetry.example',
                'OTEL_LOG_USER_PROMPTS': '1',
                'KEEP_ME': 'yes',
            }
            with open(settings_path, 'w', encoding='utf-8') as settings:
                INSTALL.json.dump({'env': existing_env}, settings)

            result = INSTALL.configure_claude_token_audit(
                settings_path, True, 'production', 'workspace-1', 23456
            )
            with open(settings_path, encoding='utf-8') as settings:
                config = INSTALL.json.load(settings)

        self.assertEqual(result, {'source': 'transcript', 'managedEnv': {}})
        self.assertEqual(config['env'], existing_env)
        command = config['hooks']['PostToolUse'][0]['hooks'][0]['command']
        self.assertIn('--source transcript', command)
        for event, _matcher in INSTALL.CLAUDE_TOKEN_AUDIT_HOOK_EVENTS:
            owned_handlers = [
                handler
                for group in config['hooks'][event]
                for handler in group.get('hooks', [])
                if INSTALL._is_claude_token_audit_handler(handler)
            ]
            self.assertEqual(len(owned_handlers), 1, event)
            self.assertEqual(
                owned_handlers[0]['timeout'],
                INSTALL.CLAUDE_TOKEN_AUDIT_TRANSCRIPT_HOOK_TIMEOUT_SECONDS,
                event,
            )

    def test_disable_removes_only_owned_values_and_hook_handlers(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            settings_path = os.path.join(temp_dir, 'settings.json')
            enabled = INSTALL.configure_claude_token_audit(
                settings_path, True, 'stage', 'workspace-1', 23456
            )
            with open(settings_path, encoding='utf-8') as settings:
                config = INSTALL.json.load(settings)
            config['env']['OTEL_LOG_USER_PROMPTS'] = '1'
            config['hooks']['Stop'][0]['hooks'].append(
                {'type': 'command', 'command': 'keep-stop'}
            )
            config['hooks']['PreToolUse'] = [
                {'matcher': '^keep$', 'hooks': []},
            ]
            with open(settings_path, 'w', encoding='utf-8') as settings:
                INSTALL.json.dump(config, settings)

            result = INSTALL.configure_claude_token_audit(
                settings_path, False, 'stage', 'workspace-1', 23456,
                enabled['managedEnv'],
            )
            with open(settings_path, encoding='utf-8') as settings:
                disabled = INSTALL.json.load(settings)

        self.assertEqual(result, {'source': None, 'managedEnv': {}})
        self.assertEqual(disabled['env'], {'OTEL_LOG_USER_PROMPTS': '1'})
        self.assertEqual(
            disabled['hooks']['Stop'],
            [{'hooks': [{'type': 'command', 'command': 'keep-stop'}]}],
        )
        self.assertEqual(
            disabled['hooks']['PreToolUse'],
            [{'matcher': '^keep$', 'hooks': []}],
        )
        for groups in disabled['hooks'].values():
            for group in groups:
                for handler in group.get('hooks', []):
                    self.assertFalse(INSTALL._is_claude_token_audit_handler(handler))


class AtomicScriptInstallTests(unittest.TestCase):
    FILES = (
        ('one.py', 'one.py', 'one'),
        ('two.py', 'two.py', 'two'),
        ('three.py', 'three.py', 'three'),
    )

    def patch_paths(self, temp_dir):
        prefix = os.path.join(temp_dir, 'releases')
        links = os.path.join(temp_dir, 'bin')
        return mock.patch.multiple(
            INSTALL,
            SCRIPT_INSTALL_PREFIX=prefix,
            SYMLINK_DIR=links,
            SCRIPT_FILES=self.FILES,
        )

    @staticmethod
    def successful_download(url, destination):
        with open(destination, 'w', encoding='utf-8') as script:
            script.write('#!/usr/bin/python3\nVALUE = 1\n')

    def release_bin(self, name):
        return os.path.join(INSTALL.SCRIPT_INSTALL_PREFIX, name, 'bin')

    def write_release(self, name, file_count=None, value=1):
        release_bin = self.release_bin(name)
        os.makedirs(release_bin)
        files = self.FILES if file_count is None else self.FILES[:file_count]
        for _source, installed, _link_name in files:
            path = os.path.join(release_bin, installed)
            with open(path, 'w', encoding='utf-8') as script:
                script.write(f'#!/usr/bin/python3\nVALUE = {value}\n')
            INSTALL.make_executable(path)
        return release_bin

    def link_directly_to_release(self, name, file_count=None):
        os.makedirs(INSTALL.SYMLINK_DIR, exist_ok=True)
        files = self.FILES if file_count is None else self.FILES[:file_count]
        for _source, installed, link_name in files:
            os.symlink(
                os.path.join(self.release_bin(name), installed),
                os.path.join(INSTALL.SYMLINK_DIR, link_name),
            )

    def link_through_current(self, name, file_count=None):
        os.makedirs(INSTALL.SYMLINK_DIR, exist_ok=True)
        os.symlink(name, os.path.join(
            INSTALL.SCRIPT_INSTALL_PREFIX, INSTALL.CURRENT_RELEASE_LINK
        ))
        files = self.FILES if file_count is None else self.FILES[:file_count]
        for _source, installed, link_name in files:
            os.symlink(
                os.path.join(
                    INSTALL.SCRIPT_INSTALL_PREFIX,
                    INSTALL.CURRENT_RELEASE_LINK,
                    'bin',
                    installed,
                ),
                os.path.join(INSTALL.SYMLINK_DIR, link_name),
            )

    def assert_public_links_use_current(self, release_name):
        current = os.path.join(
            INSTALL.SCRIPT_INSTALL_PREFIX, INSTALL.CURRENT_RELEASE_LINK
        )
        self.assertEqual(os.readlink(current), release_name)
        for _source, installed, link_name in self.FILES:
            link = os.path.join(INSTALL.SYMLINK_DIR, link_name)
            self.assertEqual(
                os.readlink(link),
                os.path.join(current, 'bin', installed),
            )
            self.assertEqual(
                os.path.realpath(link),
                os.path.join(self.release_bin(release_name), installed),
            )

    def test_download_failure_leaves_existing_release_and_links_untouched(self):
        with tempfile.TemporaryDirectory() as temp_dir, self.patch_paths(temp_dir):
            old_dir = self.write_release('old', value=0)
            self.link_directly_to_release('old')

            calls = 0

            def fail_last(url, destination):
                nonlocal calls
                calls += 1
                if calls == len(self.FILES):
                    raise OSError('last download failed')
                self.successful_download(url, destination)

            with mock.patch.object(INSTALL, 'download_to', side_effect=fail_last):
                with self.assertRaises(OSError):
                    INSTALL.install_scripts('stage', 'new')

            for _source, installed, link_name in self.FILES:
                link = os.path.join(INSTALL.SYMLINK_DIR, link_name)
                self.assertEqual(os.readlink(link), os.path.join(old_dir, installed))
            self.assertFalse(os.path.lexists(os.path.join(
                INSTALL.SCRIPT_INSTALL_PREFIX, INSTALL.CURRENT_RELEASE_LINK
            )))
            self.assertFalse(os.path.exists(
                os.path.join(INSTALL.SCRIPT_INSTALL_PREFIX, 'new')
            ))

    def test_activation_swings_one_current_pointer_and_public_links_are_stable(self):
        with tempfile.TemporaryDirectory() as temp_dir, self.patch_paths(temp_dir):
            with mock.patch.object(
                    INSTALL, 'download_to', side_effect=self.successful_download):
                INSTALL.install_scripts('stage', 'new')
            self.assert_public_links_use_current('new')

    def test_pointer_failure_leaves_old_release_active_and_new_complete(self):
        with tempfile.TemporaryDirectory() as temp_dir, self.patch_paths(temp_dir):
            old_dir = self.write_release('old', value=0)
            self.link_through_current('old')

            real_create_symlink = INSTALL.create_symlink

            def fail_pointer_activation(target, link_path):
                if (link_path == os.path.join(
                        INSTALL.SCRIPT_INSTALL_PREFIX,
                        INSTALL.CURRENT_RELEASE_LINK)
                        and target == 'new'):
                    raise OSError('pointer activation failed')
                real_create_symlink(target, link_path)

            with mock.patch.object(
                    INSTALL, 'download_to', side_effect=self.successful_download), \
                    mock.patch.object(
                        INSTALL,
                        'create_symlink',
                        side_effect=fail_pointer_activation,
                    ):
                with self.assertRaises(OSError):
                    INSTALL.install_scripts('stage', 'new')

            self.assertEqual(os.readlink(os.path.join(
                INSTALL.SCRIPT_INSTALL_PREFIX, INSTALL.CURRENT_RELEASE_LINK
            )), 'old')
            for _source, installed, link_name in self.FILES:
                link = os.path.join(INSTALL.SYMLINK_DIR, link_name)
                self.assertEqual(
                    os.path.realpath(link), os.path.join(old_dir, installed)
                )
            for _source, installed, _link_name in self.FILES:
                self.assertTrue(os.path.isfile(os.path.join(
                    self.release_bin('new'), installed
                )))

    def test_termination_after_pointer_switch_leaves_all_commands_on_new_release(self):
        with tempfile.TemporaryDirectory() as temp_dir, self.patch_paths(temp_dir):
            self.write_release('old', value=0)
            self.link_directly_to_release('old')

            with mock.patch.object(
                    INSTALL, 'download_to', side_effect=self.successful_download), \
                    mock.patch.object(
                        INSTALL,
                        '_repair_all_public_links',
                        side_effect=SystemExit('simulated termination'),
                    ):
                with self.assertRaises(SystemExit):
                    INSTALL.install_scripts('stage', 'new')

            # Pre-switch migration routed every existing command through
            # current, so a process death immediately after the one commit
            # operation cannot leave a mixed old/new command set.
            self.assert_public_links_use_current('new')

    def test_same_stamped_version_with_different_bytes_is_refused(self):
        with tempfile.TemporaryDirectory() as temp_dir, self.patch_paths(temp_dir):
            with mock.patch.object(
                    INSTALL, 'download_to', side_effect=self.successful_download):
                INSTALL.install_scripts('stage', 'release-1')
            original_targets = {
                link_name: os.readlink(os.path.join(INSTALL.SYMLINK_DIR, link_name))
                for _source, _installed, link_name in self.FILES
            }

            def changed_download(url, destination):
                with open(destination, 'w', encoding='utf-8') as script:
                    script.write('#!/usr/bin/python3\nVALUE = 2\n')

            with mock.patch.object(
                    INSTALL, 'download_to', side_effect=changed_download):
                with self.assertRaisesRegex(RuntimeError, 'different contents'):
                    INSTALL.install_scripts('stage', 'release-1')

            for _source, _installed, link_name in self.FILES:
                self.assertEqual(
                    os.readlink(os.path.join(INSTALL.SYMLINK_DIR, link_name)),
                    original_targets[link_name],
                )
            self.assertEqual(os.readlink(os.path.join(
                INSTALL.SCRIPT_INSTALL_PREFIX, INSTALL.CURRENT_RELEASE_LINK
            )), 'release-1')
            for _source, installed, _link_name in self.FILES:
                with open(
                    os.path.join(
                        INSTALL.SCRIPT_INSTALL_PREFIX,
                        'release-1',
                        'bin',
                        installed,
                    ),
                    encoding='utf-8',
                ) as script:
                    self.assertIn('VALUE = 1', script.read())

    def test_same_stamped_version_with_identical_bytes_is_reused(self):
        with tempfile.TemporaryDirectory() as temp_dir, self.patch_paths(temp_dir):
            with mock.patch.object(
                    INSTALL, 'download_to', side_effect=self.successful_download):
                INSTALL.install_scripts('stage', 'release-1')
                release_dir = os.path.join(
                    INSTALL.SCRIPT_INSTALL_PREFIX, 'release-1'
                )
                original_inode = os.stat(release_dir).st_ino
                INSTALL.install_scripts('stage', 'release-1')

            self.assertEqual(os.stat(release_dir).st_ino, original_inode)
            self.assert_public_links_use_current('release-1')

    def test_same_version_repairs_modes_pointer_and_links_without_replacing_files(self):
        with tempfile.TemporaryDirectory() as temp_dir, self.patch_paths(temp_dir):
            with mock.patch.object(
                    INSTALL, 'download_to', side_effect=self.successful_download):
                INSTALL.install_scripts('stage', 'release-1')
                paths = [
                    os.path.join(self.release_bin('release-1'), installed)
                    for _source, installed, _link_name in self.FILES
                ]
                inodes = [os.stat(path).st_ino for path in paths]
                for path in paths:
                    os.chmod(path, stat.S_IRUSR | stat.S_IWUSR)
                os.remove(os.path.join(
                    INSTALL.SCRIPT_INSTALL_PREFIX,
                    INSTALL.CURRENT_RELEASE_LINK,
                ))
                for (_source, installed, link_name), path in zip(
                        self.FILES, paths):
                    link = os.path.join(INSTALL.SYMLINK_DIR, link_name)
                    os.remove(link)
                    os.symlink(path, link)
                INSTALL.install_scripts('stage', 'release-1')

            self.assertEqual([os.stat(path).st_ino for path in paths], inodes)
            for path in paths:
                self.assertTrue(os.stat(path).st_mode & stat.S_IXUSR)
            self.assert_public_links_use_current('release-1')

    def test_old_two_file_same_version_requires_a_new_release_name(self):
        with tempfile.TemporaryDirectory() as temp_dir, self.patch_paths(temp_dir):
            self.write_release('release-1', file_count=2)
            self.link_directly_to_release('release-1', file_count=2)

            with mock.patch.object(
                    INSTALL, 'download_to', side_effect=self.successful_download):
                with self.assertRaisesRegex(
                        RuntimeError, 'incomplete.*new script version'):
                    INSTALL.install_scripts('stage', 'release-1')

            self.assertFalse(os.path.lexists(os.path.join(
                INSTALL.SCRIPT_INSTALL_PREFIX, INSTALL.CURRENT_RELEASE_LINK
            )))
            self.assertFalse(os.path.exists(os.path.join(
                self.release_bin('release-1'), self.FILES[2][1]
            )))
            for _source, installed, link_name in self.FILES[:2]:
                self.assertEqual(
                    os.path.realpath(os.path.join(
                        INSTALL.SYMLINK_DIR, link_name
                    )),
                    os.path.join(self.release_bin('release-1'), installed),
                )

    def test_new_version_migrates_legacy_two_file_release_safely(self):
        with tempfile.TemporaryDirectory() as temp_dir, self.patch_paths(temp_dir):
            self.write_release('old', file_count=2, value=0)
            self.link_directly_to_release('old', file_count=2)

            with mock.patch.object(
                    INSTALL, 'download_to', side_effect=self.successful_download):
                INSTALL.install_scripts('stage', 'new')

            self.assert_public_links_use_current('new')
            self.assertTrue(os.path.isdir(
                os.path.join(INSTALL.SCRIPT_INSTALL_PREFIX, 'old')
            ))

    def test_different_unversioned_installs_use_distinct_immutable_releases(self):
        with tempfile.TemporaryDirectory() as temp_dir, self.patch_paths(temp_dir):
            downloads = 0

            def changing_download(url, destination):
                nonlocal downloads
                # install_scripts downloads every release as one batch.
                release_number = downloads // len(self.FILES) + 1
                downloads += 1
                with open(destination, 'w', encoding='utf-8') as script:
                    script.write(
                        f'#!/usr/bin/python3\nVALUE = {release_number}\n'
                    )

            with mock.patch.object(
                    INSTALL, 'download_to', side_effect=changing_download), \
                    mock.patch.object(
                        INSTALL,
                        '_new_unversioned_release_name',
                        side_effect=('unversioned-first', 'unversioned-second'),
                    ):
                INSTALL.install_scripts('stage', None)
                current = os.path.join(
                    INSTALL.SCRIPT_INSTALL_PREFIX,
                    INSTALL.CURRENT_RELEASE_LINK,
                )
                first_release = os.readlink(current)
                INSTALL.install_scripts('stage', None)
                second_release = os.readlink(current)

            self.assertEqual(first_release, 'unversioned-first')
            self.assertEqual(second_release, 'unversioned-second')
            first_path = os.path.join(
                self.release_bin(first_release), self.FILES[0][1]
            )
            second_path = os.path.join(
                self.release_bin(second_release), self.FILES[0][1]
            )
            self.assertTrue(os.path.exists(first_path))
            self.assertTrue(os.path.exists(second_path))
            with open(first_path, encoding='utf-8') as first_script:
                self.assertIn('VALUE = 1', first_script.read())
            with open(second_path, encoding='utf-8') as second_script:
                self.assertIn('VALUE = 2', second_script.read())

    def test_reserved_release_names_are_rejected_before_download(self):
        reserved = (
            'current',
            'CURRENT',
            'v1',
            'bin',
            'unversioned',
            'unversioned-manual',
            '.staging-forged',
            '../outside',
        )
        for version in reserved:
            with self.subTest(version=version), \
                    tempfile.TemporaryDirectory() as temp_dir, \
                    self.patch_paths(temp_dir), \
                    mock.patch.object(INSTALL, 'download_to') as download:
                with self.assertRaisesRegex(RuntimeError, 'reserved|Unsafe'):
                    INSTALL.install_scripts('stage', version)
                download.assert_not_called()

    def test_prune_retains_prior_and_every_symlink_referenced_release(self):
        with tempfile.TemporaryDirectory() as temp_dir, self.patch_paths(temp_dir):
            os.makedirs(INSTALL.SCRIPT_INSTALL_PREFIX)
            for index, name in enumerate(
                    ('referenced', 'discard', 'previous', 'active'), start=1):
                path = os.path.join(INSTALL.SCRIPT_INSTALL_PREFIX, name)
                os.makedirs(path)
                os.utime(path, (index, index))
            os.makedirs(INSTALL.SYMLINK_DIR)
            os.symlink('active', os.path.join(
                INSTALL.SCRIPT_INSTALL_PREFIX, INSTALL.CURRENT_RELEASE_LINK
            ))
            os.symlink(
                os.path.join(
                    INSTALL.SCRIPT_INSTALL_PREFIX,
                    'referenced',
                    'bin',
                    self.FILES[0][1],
                ),
                os.path.join(INSTALL.SYMLINK_DIR, self.FILES[0][2]),
            )
            INSTALL.prune_old_install_dirs('active', retain_previous=1)
            self.assertFalse(os.path.exists(
                os.path.join(INSTALL.SCRIPT_INSTALL_PREFIX, 'discard')
            ))
            self.assertTrue(os.path.isdir(
                os.path.join(INSTALL.SCRIPT_INSTALL_PREFIX, 'referenced')
            ))
            self.assertTrue(os.path.isdir(
                os.path.join(INSTALL.SCRIPT_INSTALL_PREFIX, 'previous')
            ))
            self.assertTrue(os.path.isdir(
                os.path.join(INSTALL.SCRIPT_INSTALL_PREFIX, 'active')
            ))

    def test_install_lock_serializes_concurrent_publications(self):
        with tempfile.TemporaryDirectory() as temp_dir, self.patch_paths(temp_dir):
            first_started = threading.Event()
            allow_first_to_finish = threading.Event()
            download_threads = []
            errors = []

            def controlled_download(url, destination):
                thread_name = threading.current_thread().name
                download_threads.append(thread_name)
                if thread_name == 'installer-one' and not first_started.is_set():
                    first_started.set()
                    if not allow_first_to_finish.wait(timeout=3):
                        raise RuntimeError('test timed out waiting to release lock')
                self.successful_download(url, destination)

            def run(version):
                try:
                    INSTALL.install_scripts('stage', version)
                except Exception as err:  # pragma: no cover - asserted below
                    errors.append(err)

            with mock.patch.object(
                    INSTALL, 'download_to', side_effect=controlled_download), \
                    mock.patch.object(INSTALL, 'warn_if_not_on_path'):
                first = threading.Thread(
                    target=run, args=('first',), name='installer-one'
                )
                second = threading.Thread(
                    target=run, args=('second',), name='installer-two'
                )
                first.start()
                self.assertTrue(first_started.wait(timeout=3))
                second.start()
                time.sleep(0.1)
                self.assertNotIn('installer-two', download_threads)
                allow_first_to_finish.set()
                first.join(timeout=3)
                second.join(timeout=3)

            self.assertFalse(first.is_alive())
            self.assertFalse(second.is_alive())
            self.assertEqual(errors, [])
            self.assertEqual(os.readlink(os.path.join(
                INSTALL.SCRIPT_INSTALL_PREFIX, INSTALL.CURRENT_RELEASE_LINK
            )), 'second')
            self.assert_public_links_use_current('second')


class CursorPokeDrainHookInstallTests(unittest.TestCase):
    def test_creates_hooks_json_with_stop_entry(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            hooks_path = os.path.join(temp_dir, 'hooks.json')
            bin_dir = os.path.join(temp_dir, 'bin')
            with mock.patch.object(INSTALL, 'SYMLINK_DIR', bin_dir):
                INSTALL.install_cursor_poke_drain_hook(hooks_path)

            with open(hooks_path, encoding='utf-8') as hooks_file:
                config = INSTALL.json.load(hooks_file)

            self.assertEqual(config['version'], 1)
            stop_hooks = config['hooks']['stop']
            self.assertEqual(len(stop_hooks), 1)
            self.assertEqual(
                stop_hooks[0]['command'],
                os.path.join(bin_dir, INSTALL.CURSOR_POKE_DRAIN_SYMLINK_NAME),
            )
            self.assertIsNone(stop_hooks[0]['loop_limit'])

    def test_preserves_other_hooks_and_refreshes_uclusion_entry(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            hooks_path = os.path.join(temp_dir, 'hooks.json')
            bin_dir = os.path.join(temp_dir, 'bin')
            stale = os.path.join(temp_dir, 'stale', 'uclusionCursorPokeDrain.py')
            with open(hooks_path, 'w', encoding='utf-8') as hooks_file:
                INSTALL.json.dump(
                    {
                        'version': 1,
                        'hooks': {
                            'stop': [
                                {'command': './hooks/other.sh'},
                                {
                                    'command': stale,
                                    'loop_limit': 5,
                                },
                            ],
                            'sessionStart': [
                                {'command': './hooks/start.sh'},
                            ],
                        },
                    },
                    hooks_file,
                )
            with mock.patch.object(INSTALL, 'SYMLINK_DIR', bin_dir):
                INSTALL.install_cursor_poke_drain_hook(hooks_path)
                INSTALL.install_cursor_poke_drain_hook(hooks_path)

            with open(hooks_path, encoding='utf-8') as hooks_file:
                config = INSTALL.json.load(hooks_file)

            self.assertEqual(
                config['hooks']['sessionStart'],
                [{'command': './hooks/start.sh'}],
            )
            stop_hooks = config['hooks']['stop']
            self.assertEqual(len(stop_hooks), 2)
            self.assertEqual(stop_hooks[0], {'command': './hooks/other.sh'})
            self.assertEqual(
                stop_hooks[1]['command'],
                os.path.join(bin_dir, INSTALL.CURSOR_POKE_DRAIN_SYMLINK_NAME),
            )
            self.assertIsNone(stop_hooks[1]['loop_limit'])

    def test_project_cursor_install_writes_hooks_json(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            project_dir = os.path.join(temp_dir, 'project')
            os.makedirs(project_dir)
            bin_dir = os.path.join(temp_dir, 'bin')
            with mock.patch.object(INSTALL, 'SYMLINK_DIR', bin_dir), \
                    mock.patch.object(INSTALL, 'register_mcp_json'), \
                    mock.patch.object(INSTALL, 'install_cursor_mdc'), \
                    mock.patch.object(INSTALL, 'write_uclusion_config'), \
                    mock.patch.object(
                        INSTALL, 'remove_legacy_codex_hooks_config'
                    ):
                INSTALL.install_project_level(
                    'workspace-1',
                    None,
                    'stage',
                    fetch_md=lambda: None,
                    project_dir=project_dir,
                    clients={'cursor'},
                )

            hooks_path = os.path.join(project_dir, '.cursor', 'hooks.json')
            with open(hooks_path, encoding='utf-8') as hooks_file:
                config = INSTALL.json.load(hooks_file)
            self.assertTrue(
                any(
                    INSTALL._is_cursor_poke_drain_hook(entry)
                    for entry in config['hooks']['stop']
                )
            )


if __name__ == '__main__':
    unittest.main()
