"""The demo bootstrap installs one disposable file and leaves setup alone."""

import importlib.util
import os
from pathlib import Path
import stat
import tempfile
import unittest
from unittest import mock


def load_script(name):
    path = Path(__file__).resolve().parents[1] / (name + '.py')
    spec = importlib.util.spec_from_file_location(name + '_install_test', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


INSTALL = load_script('uclusionInstall')
CLIENT_SOURCE = (Path(__file__).resolve().parents[1] / 'uclusionDemoMCP.py').read_bytes()


class DemoInstallTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        # gettempdir is cached after first use, so patch the resolved value.
        patcher = mock.patch.object(INSTALL.tempfile, 'gettempdir', return_value=self.temp.name)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.downloaded = []

    def fake_download(self, url, dest_path):
        self.downloaded.append(url)
        Path(dest_path).write_bytes(CLIENT_SOURCE)

    def install(self):
        with mock.patch.object(INSTALL, 'download_to', side_effect=self.fake_download):
            return INSTALL.install_demo_client('stage')

    def test_demo_install_writes_one_file_and_no_symlinks(self):
        target = self.install()
        self.assertEqual(self.downloaded,
                         ['https://stage.uclusion.com/scripts/uclusionDemoMCP.py'])
        written = sorted(Path(self.temp.name).rglob('*'))
        self.assertEqual(written, [Path(target).parent, Path(target)])
        self.assertFalse(any(path.is_symlink() for path in written))
        # Nothing lands beside the user's real scripts or on their PATH.
        self.assertNotIn(INSTALL.SCRIPT_INSTALL_PREFIX, target)
        self.assertNotIn(INSTALL.SYMLINK_DIR, target)

    def test_the_directory_is_not_reachable_by_other_users(self):
        target = self.install()
        directory = os.stat(os.path.dirname(target))
        self.assertEqual(stat.S_IMODE(directory.st_mode), 0o700)
        self.assertEqual(stat.S_IMODE(os.stat(target).st_mode), 0o700)

    def test_a_pre_existing_directory_we_do_not_own_is_refused(self):
        hostile = Path(INSTALL.demo_runtime_dir())
        # Simulate another user having claimed the name first. lstat is what the
        # installer checks, so a planted symlink must be refused rather than
        # followed into somewhere it could overwrite.
        hostile.rmdir()
        hostile.symlink_to(self.temp.name)
        with self.assertRaisesRegex(RuntimeError, 'not a directory'):
            INSTALL.demo_runtime_dir()

    def test_a_widened_directory_is_narrowed_before_anything_is_written(self):
        directory = Path(INSTALL.demo_runtime_dir())
        os.chmod(directory, 0o755)
        INSTALL.demo_runtime_dir()
        self.assertEqual(stat.S_IMODE(os.stat(directory).st_mode), 0o700)

    def test_the_descriptor_names_the_file_that_was_installed(self):
        target = self.install()
        descriptor = INSTALL.demo_mcp_descriptor('stage')
        self.assertEqual(descriptor['args'][0], target)
        self.assertEqual(descriptor['args'][1], 'stage')
        self.assertTrue(os.path.isfile(descriptor['args'][0]))
        # Deterministic, so a repeat install still matches the registration the
        # previous one wrote and the expected-descriptor comparison holds.
        self.assertEqual(INSTALL.demo_mcp_descriptor('stage'), descriptor)

    def test_a_corrupt_download_is_refused_by_the_release_pin(self):
        def wrong_bytes(url, dest_path):
            Path(dest_path).write_bytes(b'print("not the demo client")\n')

        with mock.patch.object(INSTALL, 'download_to', side_effect=wrong_bytes):
            with self.assertRaisesRegex(RuntimeError, 'does not match this installer release'):
                INSTALL.install_demo_client('stage')

    def test_setup_still_installs_every_script_and_symlink(self):
        """The regression that would hurt: demo and setup share this module.

        Exercised rather than inspected, because the demo branch was carved out
        of this path and an assertion about its source would not notice if the
        carve took the setup case with it.
        """
        scripts = Path(__file__).resolve().parents[1]
        prefix = Path(self.temp.name) / 'uclusion-cli'
        symlinks = Path(self.temp.name) / 'bin'

        def real_bytes(url, dest_path):
            Path(dest_path).write_bytes((scripts / url.rsplit('/', 1)[1]).read_bytes())

        with mock.patch.object(INSTALL, 'SCRIPT_INSTALL_PREFIX', str(prefix)), \
                mock.patch.object(INSTALL, 'SYMLINK_DIR', str(symlinks)), \
                mock.patch.object(INSTALL, 'download_to', side_effect=real_bytes), \
                mock.patch.object(INSTALL, '_preflight_activation_paths'), \
                mock.patch.object(INSTALL, '__file__', str(scripts / 'uclusionInstall.py')):
            INSTALL.install_scripts('stage', None, setup_bootstrap=True)

        expected = {installed for _source, installed, _symlink in INSTALL.SCRIPT_FILES}
        release = next(path for path in prefix.iterdir() if path.name.startswith('unversioned'))
        self.assertEqual({path.name for path in (release / 'bin').iterdir()}, expected)
        self.assertEqual(
            {path.name for path in symlinks.iterdir()},
            {symlink for _source, _installed, symlink in INSTALL.SCRIPT_FILES})
        # And the demo's disposable directory is untouched by a setup install.
        self.assertFalse((Path(self.temp.name) / f'uclusion-demo-{INSTALL._demo_user_token()}').exists())


class DemoClientGateTests(unittest.TestCase):
    """Which clients demo mode accepts, and that it refuses before writing."""

    def test_only_clients_whose_subagents_reach_the_parent_mcp_are_accepted(self):
        self.assertEqual(INSTALL.DEMO_SUBAGENT_CLIENTS, frozenset({'claude', 'codex'}))

    def test_a_refused_client_is_named_and_nothing_is_installed(self):
        with mock.patch.object(INSTALL, 'install_demo_client') as installed, \
                mock.patch.object(INSTALL, '_install_temporary_registration') as registered, \
                mock.patch.object(INSTALL, 'bootstrap_registration_expected') as inspected:
            with mock.patch.object(INSTALL.sys, 'argv',
                                   ['uclusionInstall.py', 'stage', 'demo', '--clients', 'cursor']):
                code = INSTALL.main()
        self.assertEqual(code, 1)
        # Refused ahead of the registration read, so nothing on disk or in the
        # client's configuration is touched or even inspected.
        installed.assert_not_called()
        registered.assert_not_called()
        inspected.assert_not_called()


if __name__ == '__main__':
    unittest.main()
