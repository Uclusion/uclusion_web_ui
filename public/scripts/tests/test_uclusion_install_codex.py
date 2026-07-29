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


if __name__ == '__main__':
    unittest.main()
