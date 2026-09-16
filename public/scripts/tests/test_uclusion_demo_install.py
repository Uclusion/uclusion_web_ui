"""The demo provisions once, then uses the ordinary disposable install."""

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


class DemoHomeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        patcher = mock.patch.object(
            INSTALL.tempfile, 'gettempdir', return_value=self.temp.name
        )
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_demo_home_is_private_and_deterministic(self):
        first = INSTALL.demo_runtime_dir()
        second = INSTALL.demo_runtime_dir()
        self.assertEqual(first, second)
        self.assertEqual(stat.S_IMODE(os.stat(first).st_mode), 0o700)

    def test_a_pre_existing_path_we_do_not_own_is_refused(self):
        hostile = Path(INSTALL.demo_runtime_dir())
        hostile.rmdir()
        hostile.symlink_to(self.temp.name)
        with self.assertRaisesRegex(RuntimeError, 'not a directory'):
            INSTALL.demo_runtime_dir()

    def test_a_widened_directory_is_narrowed(self):
        directory = Path(INSTALL.demo_runtime_dir())
        os.chmod(directory, 0o755)
        INSTALL.demo_runtime_dir()
        self.assertEqual(stat.S_IMODE(os.stat(directory).st_mode), 0o700)

    def test_reexec_sets_home_before_import_time_paths_are_recomputed(self):
        home = INSTALL.demo_runtime_dir()
        with mock.patch.object(
            INSTALL, 'uclusion_home_root', return_value='/real/home'
        ), mock.patch.object(
            INSTALL.os, 'execve', side_effect=RuntimeError('reexec')
        ) as execute:
            with self.assertRaisesRegex(RuntimeError, 'reexec'):
                INSTALL.reexec_in_demo_home()
        environment = execute.call_args.args[2]
        self.assertEqual(environment['UCLUSION_HOME'], home)


class DemoProvisionTests(unittest.TestCase):
    def test_provision_polls_until_ready(self):
        ready = {
            'demo_id': 'ignored until assigned',
            'state': 'READY',
            'workspace_id': 'workspace-1',
            'view_id': 'view-1',
            'client_id': (
                'ai-demo:11111111-1111-4111-8111-111111111111:human_account-1'
            ),
            'starting_job_short_codes': ['J-Demo-1'],
        }

        def request(_url, payload):
            if 'code_challenge' in payload:
                return 202, {
                    'demo_id': request.demo_id,
                    'state': 'PROVISIONING',
                }
            if request.calls == 0:
                request.calls += 1
                return 202, {
                    'demo_id': request.demo_id,
                    'state': 'PROVISIONING',
                    'retry_after_seconds': 0,
                }
            return 200, {**ready, 'demo_id': request.demo_id}

        request.calls = 0
        request.demo_id = None

        def capture_uuid():
            value = '11111111-1111-4111-8111-111111111111'
            request.demo_id = value
            return value

        with mock.patch.object(
            INSTALL.uuid, 'uuid4', side_effect=capture_uuid
        ), mock.patch.object(
            INSTALL, 'request_demo_json', side_effect=request
        ), mock.patch.object(INSTALL.time, 'sleep') as sleep:
            result = INSTALL.provision_demo('stage')

        self.assertEqual(result['workspace_id'], 'workspace-1')
        self.assertEqual(result['client_id'], ready['client_id'])
        sleep.assert_called_once_with(0.25)

    def test_credentials_use_the_ready_client_id_and_public_demo_secret(self):
        with tempfile.TemporaryDirectory() as directory, mock.patch.object(
            INSTALL, 'UCLUSION_HOME', directory
        ):
            INSTALL.write_demo_credentials(
                'stage', 'ai-demo:demo:human_account-1'
            )
            path = Path(directory) / INSTALL.CREDENTIALS_FILES['stage']
            self.assertEqual(path.read_text(), (
                'secret_key_id=ai-demo:demo:human_account-1\n'
                f'secret_key={INSTALL.DEMO_CLIENT_SECRET}\n'
            ))
            self.assertEqual(stat.S_IMODE(path.stat().st_mode), 0o600)


class OrdinaryInstallRegressionTests(unittest.TestCase):
    def test_demo_accepts_only_clients_with_poke_delivery(self):
        self.assertEqual(INSTALL.DEMO_CLIENTS, frozenset({'claude', 'codex'}))

    def test_demo_proxy_is_not_part_of_the_shipped_script_bundle(self):
        sources = {
            source for source, _installed, _symlink in INSTALL.SCRIPT_FILES
        }
        self.assertNotIn('uclusionDemoMCP.py', sources)
        self.assertNotIn(
            'uclusionDemoMCP.py', INSTALL.SETUP_BOOTSTRAP_SCRIPT_SHA256
        )

    def test_setup_still_installs_every_script_and_symlink(self):
        with tempfile.TemporaryDirectory() as directory:
            scripts = Path(__file__).resolve().parents[1]
            prefix = Path(directory) / 'uclusion-cli'
            symlinks = Path(directory) / 'bin'

            def real_bytes(url, dest_path):
                Path(dest_path).write_bytes(
                    (scripts / url.rsplit('/', 1)[1]).read_bytes()
                )

            with mock.patch.object(
                INSTALL, 'SCRIPT_INSTALL_PREFIX', str(prefix)
            ), mock.patch.object(
                INSTALL, 'SYMLINK_DIR', str(symlinks)
            ), mock.patch.object(
                INSTALL, 'download_to', side_effect=real_bytes
            ), mock.patch.object(
                INSTALL, '_preflight_activation_paths'
            ), mock.patch.object(
                INSTALL, '__file__', str(scripts / 'uclusionInstall.py')
            ):
                INSTALL.install_scripts(
                    'stage', None, setup_bootstrap=True
                )

            expected = {
                installed
                for _source, installed, _symlink in INSTALL.SCRIPT_FILES
            }
            release = next(
                path for path in prefix.iterdir()
                if path.name.startswith('unversioned')
            )
            self.assertEqual(
                {path.name for path in (release / 'bin').iterdir()},
                expected,
            )
            self.assertEqual(
                {path.name for path in symlinks.iterdir()},
                {
                    symlink
                    for _source, _installed, symlink in INSTALL.SCRIPT_FILES
                },
            )


if __name__ == '__main__':
    unittest.main()
