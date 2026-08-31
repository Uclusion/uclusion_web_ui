import io
import hashlib
import json
import os
import socket
import sys
import tempfile
import unittest
from contextlib import ExitStack
from pathlib import Path
from types import SimpleNamespace
from unittest import mock


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS_DIR))

import uclusionCLI as cli
import uclusionCodexBridge as codex_bridge
import uclusionInstall as installer


class FakeProcess:
    next_pid = 4100

    def __init__(self, poll_results, wait_result=0, pid=None, output=b''):
        self.poll_results = list(poll_results)
        self.wait_result = wait_result
        if pid is None:
            pid = FakeProcess.next_pid
            FakeProcess.next_pid += 1
        self.pid = pid
        self.terminate_called = False
        self.kill_called = False
        self.wait_calls = []
        self.stdout = io.BytesIO(output)

    def poll(self):
        if len(self.poll_results) > 1:
            return self.poll_results.pop(0)
        return self.poll_results[0]

    def terminate(self):
        self.terminate_called = True

    def kill(self):
        self.kill_called = True

    def wait(self, timeout=None):
        self.wait_calls.append(timeout)
        return self.wait_result


class FakeTemporaryDirectory:
    def __init__(self, path='/private/runtime'):
        self.path = path
        self.exited = False

    def __enter__(self):
        return self.path

    def __exit__(self, exc_type, exc_value, traceback):
        self.exited = True


class CodexLauncherTests(unittest.TestCase):
    def launcher_args(
        self,
        env='stage',
        codex_args=None,
        deliver_existing_pokes=False,
    ):
        return SimpleNamespace(
            env=env,
            codex_args=[] if codex_args is None else codex_args,
            deliver_existing_pokes=deliver_existing_pokes,
        )

    def launcher_prerequisites(self, stack, config=None):
        stack.enter_context(
            mock.patch.object(
                cli,
                'get_env_paths',
                return_value=('api.example', 'stage_uclusion.json', 'stage_credentials'),
            )
        )
        stack.enter_context(
            mock.patch.object(
                cli,
                'load_config',
                return_value={'workspaceId': 'workspace-123'} if config is None else config,
            )
        )
        stack.enter_context(mock.patch.object(cli.shutil, 'which', return_value='/opt/bin/codex'))
        stack.enter_context(mock.patch.object(cli.os.path, 'exists', return_value=True))
        stack.enter_context(
            mock.patch.object(cli, 'is_unix_socket', return_value=True)
        )
        stack.enter_context(
            mock.patch.object(
                cli,
                'resolve_codex_companion_paths',
                return_value=(
                    '/release/bin/uclusionCodexBridge.py',
                    '/release/bin/uclusionMCPProxy.py',
                ),
            )
        )
        stack.enter_context(mock.patch.object(cli.uuid, 'uuid4', return_value='instance-456'))
        stack.enter_context(mock.patch.object(cli.os, 'getcwd', return_value='/work/project'))
        stack.enter_context(mock.patch.object(cli.time, 'sleep'))
        def bridge_ready(bridge, _app_server, *_args, **_kwargs):
            returncode = bridge.poll()
            if returncode is not None:
                return False, 'bridge', returncode
            return True, None, None

        self.bridge_ready_wait = stack.enter_context(
            mock.patch.object(
                cli, 'wait_for_bridge_ready', side_effect=bridge_ready
            )
        )
        self.receiver_registration = stack.enter_context(
            mock.patch.object(cli, 'write_codex_receiver_file')
        )
        self.version_run = stack.enter_context(
            mock.patch.object(
                cli.subprocess,
                'run',
                return_value=SimpleNamespace(
                    returncode=0,
                    stdout='codex-cli 0.145.0\n',
                    stderr='',
                ),
            )
        )
        self.runtime_directory = FakeTemporaryDirectory()
        stack.enter_context(
            mock.patch.object(
                cli.tempfile,
                'TemporaryDirectory',
                return_value=self.runtime_directory,
            )
        )
        self.stage_companions = stack.enter_context(
            mock.patch.object(
                cli,
                'stage_codex_companions',
                return_value=(
                    '/private/runtime/bin/uclusion.py',
                    '/private/runtime/bin/uclusionCodexBridge.py',
                    '/private/runtime/bin/uclusionMCPProxy.py',
                ),
            )
        )
        self.installed_release = stack.enter_context(
            mock.patch.object(
                cli,
                'get_installed_script_version',
                return_value='release-123',
            )
        )

    @staticmethod
    def setup_codex_block(runtime_args):
        return installer.build_codex_mcp_block(
            descriptor={
                'command': 'python3',
                'args': runtime_args,
            },
        )

    def test_parser_accepts_environment_backlog_opt_in_and_codex_passthrough(self):
        args = cli.build_parser().parse_args([
            '-e', 'stage', 'codex', '--deliver-existing-pokes', '--',
            '--no-alt-screen', 'resume', '--last',
        ])

        self.assertEqual(args.env, 'stage')
        self.assertTrue(args.deliver_existing_pokes)
        self.assertEqual(
            args.codex_args,
            ['--', '--no-alt-screen', 'resume', '--last'],
        )
        self.assertIs(args.func, cli.cmd_codex)
        default_args = cli.build_parser().parse_args(['codex'])
        self.assertFalse(default_args.deliver_existing_pokes)
        legacy_args = cli.build_parser().parse_args([
            'codex', '--ignore-existing-pokes',
        ])
        self.assertTrue(legacy_args.ignore_existing_pokes)
        self.assertFalse(legacy_args.deliver_existing_pokes)

    def test_rejects_passthrough_remote_override_before_process_start(self):
        for codex_args in (
            ['--', '--remote', 'unix:///tmp/other.sock'],
            ['--', '--remote=unix:///tmp/other.sock'],
        ):
            with self.subTest(codex_args=codex_args), ExitStack() as stack:
                self.launcher_prerequisites(stack)
                popen = stack.enter_context(
                    mock.patch.object(cli.subprocess, 'Popen')
                )
                stderr = io.StringIO()
                stack.enter_context(mock.patch('sys.stderr', stderr))

                result = cli.cmd_codex(
                    self.launcher_args(codex_args=codex_args)
                )

            self.assertEqual(1, result)
            self.assertIn('owns the Codex `--remote`', stderr.getvalue())
            popen.assert_not_called()
            self.stage_companions.assert_not_called()

    def test_similar_passthrough_argument_is_not_misclassified_as_remote(self):
        self.assertTrue(
            cli.validate_codex_passthrough_args(['--remote-debug'])
        )
        self.assertTrue(
            cli.validate_codex_passthrough_args(['--', '--remote'])
        )

    def test_backend_configuration_passthrough_is_explicit_and_bounded(self):
        self.assertEqual(
            [
                '--disable', 'apps',
                '--enable=web_search',
                '-c', 'model="gpt-test"',
                '-c=features.apps=false',
                '-cfeatures.remote_plugin=false',
                '--config=features.plugins=false',
                '--strict-config',
            ],
            cli.codex_app_server_passthrough_args(
                [
                    '--no-alt-screen',
                    '--disable', 'apps',
                    '--enable=web_search',
                    '-c', 'model="gpt-test"',
                    '-c=features.apps=false',
                    '-cfeatures.remote_plugin=false',
                    '--config=features.plugins=false',
                    '--strict-config',
                    'resume', '--last',
                ]
            ),
        )
        self.assertEqual(
            [],
            cli.codex_app_server_passthrough_args(
                ['--', '--disable', 'apps']
            ),
        )
        for arguments in (
            ['--disable'],
            ['--enable', '--'],
            ['-c='],
            ['--config='],
        ):
            with self.subTest(arguments=arguments), self.assertRaises(
                ValueError
            ):
                cli.codex_app_server_passthrough_args(arguments)

    def test_mcp_overrides_define_complete_project_table_for_every_environment(self):
        for environment in ('dev', 'stage', 'production'):
            with self.subTest(environment=environment):
                overrides = cli.build_codex_mcp_overrides(
                    'project-B', environment
                )
                expected_proxy_args = json.dumps([
                    cli.UCLUSION_MCP_PROXY_SYMLINK,
                    'project-B',
                    environment,
                ])
                self.assertEqual(
                    overrides,
                    [
                        '-c',
                        'mcp_servers.Uclusion={ enabled = true, '
                        'required = true, command = "python3", args = '
                        f'{expected_proxy_args}, '
                        'default_tools_approval_mode = "approve" }',
                    ],
                )
                self.assertNotIn('global-A', ' '.join(overrides))

    def test_codex_token_audit_settings_use_canonical_object_and_legacy_fallback(self):
        self.assertEqual(
            {'enabled': True, 'port': 23456},
            cli.codex_token_audit_settings(
                {
                    'tokenAudit': {
                        'enabled': True,
                        'port': 23456,
                        'claudeSource': 'otel',
                    }
                },
                'workspace-123',
            ),
        )
        self.assertIsNone(
            cli.codex_token_audit_settings(
                {'tokenAudit': {'enabled': False, 'port': 23456}},
                'workspace-123',
            )
        )
        legacy = cli.codex_token_audit_settings(
            {'tokenAudit': True}, 'workspace-123'
        )
        self.assertTrue(legacy['enabled'])
        self.assertGreaterEqual(legacy['port'], 20000)
        self.assertLess(legacy['port'], 50000)

    def test_codex_mcp_override_forwards_token_audit_collector_contract(self):
        overrides = cli.build_codex_mcp_overrides(
            'project-B',
            'stage',
            '/release/uclusionMCPProxy.py',
            token_audit={'enabled': True, 'port': 23456},
            token_audit_ready_file='/private/token-audit.ready',
            token_audit_owner='instance-456',
        )

        self.assertEqual('-c', overrides[0])
        self.assertIn('"--token-audit"', overrides[1])
        self.assertIn('"--token-audit-port", "23456"', overrides[1])
        self.assertIn('"--token-audit-source", "codex"', overrides[1])
        self.assertIn(
            '"--token-audit-ready-file", "/private/token-audit.ready"',
            overrides[1],
        )
        self.assertIn('"--token-audit-owner", "instance-456"', overrides[1])

    def test_launches_private_server_bridge_and_remote_tui_with_shared_environment(self):
        app_server = FakeProcess([None])
        bridge = FakeProcess([None])
        tui = FakeProcess([7])
        with ExitStack() as stack:
            self.launcher_prerequisites(stack)
            popen = stack.enter_context(
                mock.patch.object(
                    cli.subprocess,
                    'Popen',
                    side_effect=[app_server, bridge, tui],
                )
            )
            stack.enter_context(
                mock.patch.dict(
                    os.environ,
                    {
                        'PRESERVED': 'yes',
                        'UCLUSION_CODEX_BRIDGE_SCRIPT':
                            '/stale/hook-bridge.py',
                        'UCLUSION_CODEX_BRIDGE_INSTANCE':
                            'stale-instance',
                        'UCLUSION_CODEX_ACTIVE_RELEASE':
                            'stale-release',
                        'UCLUSION_CODEX_STAGED_CLI':
                            '/stale/runtime/uclusion.py',
                    },
                    clear=True,
                )
            )

            result = cli.cmd_codex(self.launcher_args(
                codex_args=[
                    '--', '--disable', 'apps',
                    '--no-alt-screen', 'resume', '--last',
                ],
            ))

        self.assertEqual(result, 7)
        self.version_run.assert_called_once_with(
            ['/opt/bin/codex', '--version'],
            capture_output=True,
            text=True,
            timeout=10,
        )
        self.assertEqual(popen.call_count, 3)
        app_server_call, bridge_call, tui_call = popen.call_args_list
        expected_proxy_args = json.dumps([
            '/private/runtime/bin/uclusionMCPProxy.py',
            'workspace-123',
            'stage',
        ])
        self.assertEqual(
            app_server_call.args[0],
            [
                '/opt/bin/codex', 'app-server',
                '--disable', 'apps',
                '-c',
                'mcp_servers.Uclusion={ enabled = true, '
                'required = true, command = "python3", args = '
                f'{expected_proxy_args}, '
                'default_tools_approval_mode = "approve" }',
                '--listen',
                'unix:///private/runtime/app-server.sock',
            ],
        )
        self.assertEqual(
            bridge_call.args[0],
            [
                sys.executable,
                '/private/runtime/bin/uclusionCodexBridge.py',
                'run',
                '--environment', 'stage',
                '--workspace-id', 'workspace-123',
                '--instance', 'instance-456',
                '--cwd', '/work/project',
                '--app-server-socket', '/private/runtime/app-server.sock',
                '--frontend-socket', '/private/runtime/tui-relay.sock',
                '--ready-file', '/private/runtime/bridge.ready',
                '--receiver-pid-file', '/private/runtime/receiver.pid',
            ],
        )
        self.assertEqual(
            tui_call.args[0],
            [
                '/opt/bin/codex', '--remote',
                'unix:///private/runtime/tui-relay.sock',
                '--disable', 'apps',
                '--no-alt-screen', 'resume', '--last',
            ],
        )
        expected_bridge_env = {
            'PRESERVED': 'yes',
            'UCLUSION_CODEX_BRIDGE_ACTIVE': '1',
            'UCLUSION_CODEX_ACTIVE_RELEASE': 'release-123',
            'UCLUSION_CODEX_STAGED_CLI':
                '/private/runtime/bin/uclusion.py',
        }
        self.assertEqual(app_server_call.kwargs['env'], expected_bridge_env)
        self.assertIs(app_server_call.kwargs['stdout'], cli.subprocess.PIPE)
        self.assertIs(app_server_call.kwargs['stderr'], cli.subprocess.STDOUT)
        self.assertEqual(app_server_call.kwargs['bufsize'], 0)
        self.assertNotIn('stdout', bridge_call.kwargs)
        self.assertNotIn('stderr', bridge_call.kwargs)
        self.assertNotIn('stdout', tui_call.kwargs)
        self.assertNotIn('stderr', tui_call.kwargs)
        self.assertEqual(bridge_call.kwargs['env'], expected_bridge_env)
        self.assertEqual(tui_call.kwargs['env'], expected_bridge_env)
        self.assertTrue(app_server.terminate_called)
        self.assertEqual(app_server.wait_calls, [cli.CODEX_CHILD_SHUTDOWN_TIMEOUT])
        self.assertTrue(bridge.terminate_called)
        self.assertEqual(bridge.wait_calls, [cli.CODEX_CHILD_SHUTDOWN_TIMEOUT])
        self.assertFalse(tui.terminate_called)
        self.assertEqual(tui.wait_calls, [None])
        self.assertTrue(self.runtime_directory.exited)
        self.bridge_ready_wait.assert_called_once_with(
            bridge,
            app_server,
            '/private/runtime/bridge.ready',
            'instance-456',
            '/private/runtime/tui-relay.sock',
            should_stop=mock.ANY,
        )
        self.receiver_registration.assert_called_once_with(
            '/private/runtime/receiver.pid',
            'instance-456',
            tui.pid,
        )
        self.stage_companions.assert_called_once_with(
            '/private/runtime',
            os.path.realpath(cli.__file__),
            '/release/bin/uclusionCodexBridge.py',
            '/release/bin/uclusionMCPProxy.py',
            token_audit_required=False,
        )

    def test_setup_cleanup_command_accepts_only_exact_selected_wrapper(self):
        with tempfile.TemporaryDirectory() as directory, ExitStack() as stack:
            root = Path(directory)
            uclusion_home = root / '.uclusion'
            installer = root / 'bin' / 'uclusionInstall.py'
            proxy = root / 'bin' / 'uclusionMCPProxy.py'
            global_config = root / '.codex' / 'config.toml'
            stack.enter_context(mock.patch.object(
                cli, 'UCLUSION_HOME', str(uclusion_home)
            ))
            stack.enter_context(mock.patch.object(
                cli, 'UCLUSION_INSTALLER_SYMLINK', str(installer)
            ))
            stack.enter_context(mock.patch.object(
                cli, 'UCLUSION_MCP_PROXY_SYMLINK', str(proxy)
            ))
            stack.enter_context(mock.patch.object(
                cli, 'CODEX_CONFIG_PATH', str(global_config)
            ))
            cases = (
                ('stage', root / 'project', 'view-456', True),
                ('production', None, None, False),
            )
            for environment, project_dir, todo_view_id, work_claims in cases:
                scope = 'project' if project_dir else 'global'
                selected_config = (
                    project_dir / cli.STAGE_SOURCES_CONFIG_FILE
                    if project_dir else None
                )
                codex_config = (
                    project_dir / '.codex' / 'config.toml'
                    if project_dir else global_config
                )
                view_id = todo_view_id or 'workspace-123'
                target = '\0'.join((
                    environment,
                    'codex',
                    scope,
                    str(project_dir) if project_dir else '',
                ))
                receipt = uclusion_home / 'setup-receipts' / environment / (
                    hashlib.sha256(target.encode()).hexdigest()[:32] + '.json'
                )
                runtime_args = [
                    str(installer),
                    '--uclusion-runtime-after-setup',
                    environment,
                    str(receipt),
                    view_id,
                    str(proxy),
                    'workspace-123',
                ]
                if environment != 'production':
                    runtime_args.append(environment)
                if work_claims:
                    runtime_args.append('--work-claims')
                config = {
                    'workspaceId': 'workspace-123',
                    'workClaims': work_claims,
                }
                if todo_view_id:
                    config['todoViewId'] = todo_view_id
                codex_config.parent.mkdir(parents=True, exist_ok=True)
                exact_block = self.setup_codex_block(runtime_args)
                codex_config.write_text(exact_block, encoding='utf-8')
                with mock.patch.object(
                    cli,
                    'get_project_config_path',
                    return_value=(
                        str(selected_config) if selected_config else None
                    ),
                ):
                    command = cli.codex_setup_cleanup_command(
                        environment, config
                    )
                    self.assertEqual([
                        sys.executable,
                        str(installer),
                        '--uclusion-cleanup-after-setup',
                        *runtime_args[2:],
                    ], command)
                    codex_config.write_text(
                        exact_block.replace(str(receipt), str(receipt) + '.bad'),
                        encoding='utf-8',
                    )
                    self.assertIsNone(
                        cli.codex_setup_cleanup_command(environment, config)
                    )
                    codex_config.write_text(
                        '[mcp_servers.Uclusion]\ncommand = "python3"\n',
                        encoding='utf-8',
                    )
                    self.assertIsNone(
                        cli.codex_setup_cleanup_command(environment, config)
                    )

    def test_setup_cleanup_is_ordered_and_availability_safe(self):
        cleanup_command = ['/installer', '--cleanup']
        outcomes = (
            SimpleNamespace(returncode=9),
            cli.subprocess.TimeoutExpired(cleanup_command, 10),
        )
        for outcome in outcomes:
            with self.subTest(outcome=type(outcome).__name__), ExitStack() as stack:
                self.launcher_prerequisites(stack)
                stack.enter_context(mock.patch.object(
                    cli,
                    'codex_setup_cleanup_command',
                    return_value=cleanup_command,
                ))
                version_result = SimpleNamespace(
                    returncode=0,
                    stdout='codex-cli 0.145.0\n',
                    stderr='',
                )
                self.version_run.side_effect = [version_result, outcome]
                popen = stack.enter_context(mock.patch.object(
                    cli.subprocess,
                    'Popen',
                    side_effect=[
                        FakeProcess([None]),
                        FakeProcess([None]),
                        FakeProcess([7]),
                    ],
                ))
                lifecycle = mock.Mock()
                lifecycle.attach_mock(self.version_run, 'run')
                lifecycle.attach_mock(self.stage_companions, 'stage')
                lifecycle.attach_mock(popen, 'popen')

                result = cli.cmd_codex(self.launcher_args())

            self.assertEqual(7, result)
            self.assertEqual(3, popen.call_count)
            events = [call[0] for call in lifecycle.mock_calls]
            self.assertLess(events.index('stage'), events.index('run', 1))
            self.assertLess(events.index('run', 1), events.index('popen'))
            command = ' '.join(popen.call_args_list[0].args[0])
            self.assertIn('/private/runtime/bin/uclusionMCPProxy.py', command)
            self.assertNotIn('/installer', command)

    def test_explicit_backlog_opt_in_is_forwarded_only_to_bridge(self):
        app_server = FakeProcess([None])
        bridge = FakeProcess([None])
        tui = FakeProcess([7])
        with ExitStack() as stack:
            self.launcher_prerequisites(stack)
            popen = stack.enter_context(
                mock.patch.object(
                    cli.subprocess,
                    'Popen',
                    side_effect=[app_server, bridge, tui],
                )
            )

            result = cli.cmd_codex(self.launcher_args(
                deliver_existing_pokes=True,
            ))

        self.assertEqual(7, result)
        self.assertEqual(3, popen.call_count)
        app_server_call, bridge_call, tui_call = popen.call_args_list
        self.assertNotIn(
            '--deliver-existing-pokes', app_server_call.args[0]
        )
        self.assertIn('--deliver-existing-pokes', bridge_call.args[0])
        self.assertNotIn('--deliver-existing-pokes', tui_call.args[0])

    def test_token_audit_config_is_forwarded_to_proxy_and_bridge_only(self):
        app_server = FakeProcess([None])
        bridge = FakeProcess([None])
        tui = FakeProcess([7])
        with ExitStack() as stack:
            self.launcher_prerequisites(
                stack,
                config={
                    'workspaceId': 'workspace-123',
                    'tokenAudit': {
                        'enabled': True,
                        'port': 23456,
                        'claudeSource': 'transcript',
                    },
                },
            )
            popen = stack.enter_context(
                mock.patch.object(
                    cli.subprocess,
                    'Popen',
                    side_effect=[app_server, bridge, tui],
                )
            )

            result = cli.cmd_codex(self.launcher_args())

        self.assertEqual(7, result)
        app_server_call, bridge_call, tui_call = popen.call_args_list
        app_server_command = app_server_call.args[0]
        mcp_override = app_server_command[
            app_server_command.index('-c') + 1
        ]
        self.assertIn('"--token-audit"', mcp_override)
        self.assertIn('"--token-audit-port", "23456"', mcp_override)
        self.assertIn('"--token-audit-source", "codex"', mcp_override)
        self.assertIn(
            '"--token-audit-ready-file", '
            '"/private/runtime/token-audit.ready"',
            mcp_override,
        )
        self.assertIn('"--token-audit-owner", "instance-456"', mcp_override)
        self.assertIn('--token-audit', bridge_call.args[0])
        ready_index = bridge_call.args[0].index('--token-audit-ready-file')
        self.assertEqual(
            '/private/runtime/token-audit.ready',
            bridge_call.args[0][ready_index + 1],
        )
        self.stage_companions.assert_called_once_with(
            '/private/runtime',
            os.path.realpath(cli.__file__),
            '/release/bin/uclusionCodexBridge.py',
            '/release/bin/uclusionMCPProxy.py',
            token_audit_required=True,
        )
        self.assertNotIn('--token-audit', tui_call.args[0])

    def test_bridge_ready_wait_accepts_only_the_expected_instance(self):
        bridge = FakeProcess([None])
        app_server = FakeProcess([None])
        with tempfile.TemporaryDirectory() as directory:
            ready_file = os.path.join(directory, 'bridge.ready')
            Path(ready_file).write_text('instance-456\n', encoding='utf-8')

            with mock.patch.object(
                cli, 'is_unix_socket', return_value=True
            ):
                result = cli.wait_for_bridge_ready(
                    bridge,
                    app_server,
                    ready_file,
                    'instance-456',
                    os.path.join(directory, 'tui-relay.sock'),
                )

        self.assertEqual((True, None, None), result)

    def test_bridge_ready_wait_reports_early_exit_and_timeout(self):
        early = cli.wait_for_bridge_ready(
            FakeProcess([6]),
            FakeProcess([None]),
            '/does/not/exist',
            'instance-456',
            '/does/not/exist.sock',
        )
        self.assertEqual((False, 'bridge', 6), early)

        with mock.patch.object(
            cli.time, 'monotonic', side_effect=[0, 11]
        ), mock.patch.object(cli.time, 'sleep'):
            timed_out = cli.wait_for_bridge_ready(
                FakeProcess([None]),
                FakeProcess([None]),
                '/does/not/exist',
                'instance-456',
                '/does/not/exist.sock',
            )
        self.assertEqual((False, None, None), timed_out)

    def test_bridge_ready_marker_requires_bound_frontend_socket(self):
        bridge = FakeProcess([None])
        app_server = FakeProcess([None])
        with tempfile.TemporaryDirectory() as directory:
            ready_file = os.path.join(directory, 'bridge.ready')
            frontend_socket = os.path.join(
                directory, 'tui-relay.sock'
            )
            Path(ready_file).write_text(
                'instance-456\n', encoding='utf-8'
            )
            with mock.patch.object(
                cli, 'is_unix_socket', return_value=False
            ):
                result = cli.wait_for_bridge_ready(
                    bridge,
                    app_server,
                    ready_file,
                    'instance-456',
                    frontend_socket,
                )

        self.assertEqual((False, 'invalid', None), result)

    def test_regular_file_is_not_accepted_as_app_server_socket(self):
        with tempfile.TemporaryDirectory() as directory:
            regular_file = os.path.join(directory, 'app-server.sock')
            Path(regular_file).write_text('not a socket', encoding='utf-8')
            with mock.patch.object(
                cli.time, 'monotonic', side_effect=[0, 11]
            ), mock.patch.object(cli.time, 'sleep'):
                result = cli.wait_for_app_server_socket(
                    FakeProcess([None]), regular_file
                )

        self.assertEqual((False, None), result)

    @unittest.skipUnless(hasattr(socket, 'AF_UNIX'), 'requires Unix sockets')
    def test_unix_socket_runtime_check_accepts_bound_socket(self):
        with tempfile.TemporaryDirectory() as directory:
            path = os.path.join(directory, 'relay.sock')
            relay = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
            try:
                relay.bind(path)
                self.assertTrue(cli.is_unix_socket(path))
            finally:
                relay.close()

    def test_receiver_file_is_private_and_instance_bound(self):
        with tempfile.TemporaryDirectory() as directory:
            receiver_file = os.path.join(directory, 'receiver.pid')
            cli.write_codex_receiver_file(
                receiver_file, 'instance-456', 8192
            )
            value = Path(receiver_file).read_text(encoding='utf-8')
            mode = os.stat(receiver_file).st_mode & 0o777

        self.assertEqual('instance-456 8192\n', value)
        self.assertEqual(0o600, mode)

    def test_runtime_staging_survives_source_release_removal(self):
        with tempfile.TemporaryDirectory() as directory:
            source_bin = Path(directory) / 'release' / 'bin'
            runtime_dir = Path(directory) / 'runtime'
            source_bin.mkdir(parents=True)
            runtime_dir.mkdir()
            sources = (
                source_bin / 'uclusionCLI.py',
                source_bin / 'uclusionCodexBridge.py',
                source_bin / 'uclusionMCPProxy.py',
            )
            for index, source in enumerate(sources):
                source.write_text(f'payload-{index}\n', encoding='utf-8')
                source.chmod(0o755 if index < 2 else 0o644)

            staged = cli.stage_codex_companions(
                str(runtime_dir), *(str(source) for source in sources)
            )
            for source in sources:
                source.unlink()

            contents = [
                Path(path).read_text(encoding='utf-8') for path in staged
            ]
            modes = [os.stat(path).st_mode & 0o777 for path in staged]

        self.assertEqual(
            ['payload-0\n', 'payload-1\n', 'payload-2\n'],
            contents,
        )
        self.assertEqual([0o755, 0o755, 0o644], modes)

    def test_runtime_staging_includes_optional_token_audit_sibling(self):
        with tempfile.TemporaryDirectory() as directory:
            source_bin = Path(directory) / 'release' / 'bin'
            runtime_dir = Path(directory) / 'runtime'
            source_bin.mkdir(parents=True)
            runtime_dir.mkdir()
            cli_source = source_bin / 'uclusion.py'
            bridge_source = source_bin / 'uclusionCodexBridge.py'
            proxy_source = source_bin / 'uclusionMCPProxy.py'
            audit_source = source_bin / 'uclusionTokenAudit.py'
            for source in (
                cli_source, bridge_source, proxy_source, audit_source
            ):
                source.write_text(source.name + '\n', encoding='utf-8')

            cli.stage_codex_companions(
                str(runtime_dir),
                str(cli_source),
                str(bridge_source),
                str(proxy_source),
            )

            staged_audit = (
                runtime_dir / 'bin' / 'uclusionTokenAudit.py'
            )
            self.assertEqual(
                'uclusionTokenAudit.py\n',
                staged_audit.read_text(encoding='utf-8'),
            )

    def test_staged_cli_uses_launcher_release_for_update_checks(self):
        with mock.patch.dict(
            os.environ,
            {
                'UCLUSION_CODEX_ACTIVE_RELEASE': 'release-123',
                'UCLUSION_CODEX_STAGED_CLI':
                    '/private/runtime/bin/uclusion.py',
            },
            clear=False,
        ), mock.patch.object(
            cli, '__file__', '/private/runtime/bin/uclusion.py'
        ):
            self.assertEqual(
                'release-123', cli.get_installed_script_version()
            )

    def test_version_parser_accepts_prerelease_and_build_suffixes(self):
        self.assertEqual(
            cli.parse_codex_version('codex-cli 0.145.0-rc.2+linux.x86_64\n'),
            (0, 145, 0),
        )

    def test_newer_codex_version_passes_minimum_check(self):
        result = SimpleNamespace(
            returncode=0,
            stdout='codex-cli 0.200.0\n',
            stderr='',
        )
        with mock.patch.object(
            cli.subprocess, 'run', return_value=result
        ):
            self.assertTrue(cli.check_codex_version('/opt/bin/codex'))

    def test_unique_unversioned_install_path_reports_unknown_version(self):
        prefix = '/tmp/uclusion-cli'
        installed_file = os.path.join(
            prefix,
            'unversioned-0123456789abcdef',
            'bin',
            'uclusion.py',
        )
        with mock.patch.object(cli, 'SCRIPT_INSTALL_PREFIX', prefix), \
                mock.patch.object(cli, '__file__', installed_file):
            self.assertIsNone(cli.get_installed_script_version())

    def test_bridge_connection_failure_points_user_to_update(self):
        stderr = io.StringIO()
        with mock.patch('sys.stderr', stderr):
            cli.print_bridge_exit_error(
                cli.CODEX_BRIDGE_RELAY_FAILED_EXIT
            )

        self.assertEqual(
            codex_bridge.EXIT_RELAY_FAILED,
            cli.CODEX_BRIDGE_RELAY_FAILED_EXIT,
        )
        self.assertIn('safe private Codex connection', stderr.getvalue())
        self.assertIn('uclusion update', stderr.getvalue())
        self.assertNotIn('/hooks', stderr.getvalue())

    def test_rejects_codex_just_below_minimum_version(self):
        with ExitStack() as stack:
            self.launcher_prerequisites(stack)
            self.version_run.return_value = SimpleNamespace(
                returncode=0,
                stdout='codex-cli 0.144.99\n',
                stderr='',
            )
            popen = stack.enter_context(mock.patch.object(cli.subprocess, 'Popen'))
            stderr = io.StringIO()
            stack.enter_context(mock.patch('sys.stderr', stderr))

            result = cli.cmd_codex(self.launcher_args())

        self.assertEqual(result, 1)
        self.assertIn('Codex 0.144.99 is too old', stderr.getvalue())
        self.assertIn('codex update', stderr.getvalue())
        popen.assert_not_called()

    def test_rejects_malformed_codex_version(self):
        with ExitStack() as stack:
            self.launcher_prerequisites(stack)
            self.version_run.return_value = SimpleNamespace(
                returncode=0,
                stdout='codex-cli version unknown\n',
                stderr='',
            )
            popen = stack.enter_context(mock.patch.object(cli.subprocess, 'Popen'))
            stderr = io.StringIO()
            stack.enter_context(mock.patch('sys.stderr', stderr))

            result = cli.cmd_codex(self.launcher_args())

        self.assertEqual(result, 1)
        self.assertIn('Could not parse `codex --version`', stderr.getvalue())
        self.assertIn('Codex 0.145.0 or newer', stderr.getvalue())
        self.assertIn('codex update', stderr.getvalue())
        popen.assert_not_called()

    def test_loads_selected_config_without_login(self):
        with ExitStack() as stack:
            get_env_paths = stack.enter_context(
                mock.patch.object(
                    cli,
                    'get_env_paths',
                    return_value=('dev-api', 'dev_uclusion.json', 'dev_credentials'),
                )
            )
            load_config = stack.enter_context(
                mock.patch.object(cli, 'load_config', return_value={'workspaceId': 'dev-workspace'})
            )
            login = stack.enter_context(mock.patch.object(cli, 'login'))
            stack.enter_context(mock.patch.object(cli.shutil, 'which', return_value=None))
            stack.enter_context(mock.patch('sys.stderr', io.StringIO()))

            result = cli.cmd_codex(self.launcher_args(env='dev'))

        self.assertEqual(result, 1)
        get_env_paths.assert_called_once_with('dev')
        load_config.assert_called_once_with('dev_uclusion.json')
        login.assert_not_called()

    def test_rejects_config_without_workspace_id_before_starting_processes(self):
        with ExitStack() as stack:
            self.launcher_prerequisites(stack, config={})
            popen = stack.enter_context(mock.patch.object(cli.subprocess, 'Popen'))
            stderr = io.StringIO()
            stack.enter_context(mock.patch('sys.stderr', stderr))

            result = cli.cmd_codex(self.launcher_args())

        self.assertEqual(result, 1)
        self.assertIn('no workspaceId', stderr.getvalue())
        popen.assert_not_called()

    def test_unsupported_receiver_liveness_fails_before_process_start(self):
        with ExitStack() as stack:
            self.launcher_prerequisites(stack)
            stack.enter_context(
                mock.patch.object(
                    cli,
                    'codex_receiver_liveness_supported',
                    return_value=False,
                )
            )
            popen = stack.enter_context(
                mock.patch.object(cli.subprocess, 'Popen')
            )
            stderr = io.StringIO()
            stack.enter_context(mock.patch('sys.stderr', stderr))

            result = cli.cmd_codex(self.launcher_args())

        self.assertEqual(result, 1)
        self.assertIn('Cannot launch Codex safely', stderr.getvalue())
        popen.assert_not_called()

    def test_rejects_incomplete_companion_release(self):
        with ExitStack() as stack:
            self.launcher_prerequisites(stack)
            stack.enter_context(
                mock.patch.object(
                    cli,
                    'resolve_codex_companion_paths',
                    side_effect=RuntimeError(
                        'the Uclusion bridge/proxy release is incomplete; '
                        'run `uclusion update`'
                    ),
                )
            )
            popen = stack.enter_context(mock.patch.object(cli.subprocess, 'Popen'))
            stderr = io.StringIO()
            stack.enter_context(mock.patch('sys.stderr', stderr))

            result = cli.cmd_codex(self.launcher_args())

        self.assertEqual(result, 1)
        self.assertIn('bridge/proxy release is incomplete', stderr.getvalue())
        popen.assert_not_called()

    def test_rejects_public_companions_from_different_releases(self):
        with mock.patch.object(cli.os.path, 'isfile', return_value=False), \
                mock.patch.object(cli.os.path, 'islink', return_value=True), \
                mock.patch.object(cli.os.path, 'exists', return_value=True), \
                mock.patch.object(
                    cli.os.path,
                    'realpath',
                    side_effect=lambda path: (
                        '/release-a/bin/uclusionCodexBridge.py'
                        if path == cli.CODEX_BRIDGE_SYMLINK
                        else '/release-b/bin/uclusionMCPProxy.py'
                    ),
                ):
            with self.assertRaisesRegex(RuntimeError, 'different releases'):
                cli.resolve_codex_companion_paths()

    def test_app_server_exit_before_socket_prevents_bridge_start(self):
        app_server = FakeProcess(
            [12],
            output=(
                b'\x1b[31m2026-08-05 ERROR codex_server::startup: '
                b'backend stopped\x1b[0m\n'
            ),
        )
        with ExitStack() as stack:
            self.launcher_prerequisites(stack)
            popen = stack.enter_context(
                mock.patch.object(cli.subprocess, 'Popen', return_value=app_server)
            )
            stderr = io.StringIO()
            stack.enter_context(mock.patch('sys.stderr', stderr))

            result = cli.cmd_codex(self.launcher_args())

        self.assertEqual(result, 1)
        self.assertIn('app-server exited unexpectedly with status 12', stderr.getvalue())
        self.assertIn('Private app-server diagnostic tail:', stderr.getvalue())
        self.assertIn(
            '2026-08-05 ERROR codex_server::startup: backend stopped',
            stderr.getvalue(),
        )
        self.assertNotIn('\x1b[31m', stderr.getvalue())
        self.assertEqual(popen.call_count, 1)
        self.assertEqual(app_server.wait_calls, [None])
        self.assertTrue(self.runtime_directory.exited)

    def test_app_server_diagnostics_keep_only_bounded_in_memory_tail(self):
        diagnostics = cli.CodexAppServerDiagnostics(
            io.BytesIO(
                (b'discard-me\n' * 100)
                + (b'x' * 700)
                + b'\nfinal\x00line\n'
            ),
            max_bytes=720,
        )
        diagnostics.wait_for_eof()

        lines, truncated = diagnostics.lines()

        self.assertTrue(truncated)
        self.assertNotIn('discard-me', '\n'.join(lines))
        self.assertLessEqual(
            len(lines), cli.CODEX_APP_SERVER_DIAGNOSTIC_LINES
        )
        self.assertTrue(all(
            len(line) <= cli.CODEX_APP_SERVER_DIAGNOSTIC_LINE_CHARS
            for line in lines
        ))
        self.assertIn('final\ufffdline', lines)
        diagnostics.close()

    def test_normal_tui_exit_never_echoes_private_app_server_tracing(self):
        app_server = FakeProcess(
            [None],
            output=(
                b'2026-08-05 ERROR codex_core::tools::router: '
                b'apply_patch verification failed\n'
            ),
        )
        bridge = FakeProcess([None])
        tui = FakeProcess([0])
        with ExitStack() as stack:
            self.launcher_prerequisites(stack)
            stack.enter_context(
                mock.patch.object(
                    cli.subprocess,
                    'Popen',
                    side_effect=[app_server, bridge, tui],
                )
            )
            stderr = io.StringIO()
            stack.enter_context(mock.patch('sys.stderr', stderr))

            result = cli.cmd_codex(self.launcher_args())

        self.assertEqual(result, 0)
        self.assertNotIn('apply_patch verification failed', stderr.getvalue())
        self.assertNotIn('codex_core::tools::router', stderr.getvalue())

    def test_socket_readiness_timeout_stops_app_server(self):
        app_server = FakeProcess([None])
        with ExitStack() as stack:
            self.launcher_prerequisites(stack)
            stack.enter_context(
                mock.patch.object(
                    cli,
                    'is_unix_socket',
                    return_value=False,
                )
            )
            stack.enter_context(
                mock.patch.object(cli.time, 'monotonic', side_effect=[0, 11])
            )
            popen = stack.enter_context(
                mock.patch.object(cli.subprocess, 'Popen', return_value=app_server)
            )
            stderr = io.StringIO()
            stack.enter_context(mock.patch('sys.stderr', stderr))

            result = cli.cmd_codex(self.launcher_args())

        self.assertEqual(result, 1)
        self.assertIn('Timed out waiting', stderr.getvalue())
        self.assertEqual(popen.call_count, 1)
        self.assertTrue(app_server.terminate_called)
        self.assertTrue(self.runtime_directory.exited)

    def test_sigterm_state_stops_app_server_before_bridge_start(self):
        app_server = FakeProcess([None])
        signal_context = mock.MagicMock()
        signal_context.__enter__.return_value = {
            'signum': cli.signal.SIGTERM
        }
        with ExitStack() as stack:
            self.launcher_prerequisites(stack)
            stack.enter_context(
                mock.patch.object(
                    cli,
                    'codex_shutdown_signals',
                    return_value=signal_context,
                )
            )
            popen = stack.enter_context(
                mock.patch.object(
                    cli.subprocess, 'Popen', return_value=app_server
                )
            )

            result = cli.cmd_codex(self.launcher_args())

        self.assertEqual(result, 128 + cli.signal.SIGTERM)
        self.assertEqual(popen.call_count, 1)
        self.assertTrue(app_server.terminate_called)

    def test_one_cleanup_failure_does_not_skip_other_children(self):
        broken = mock.Mock()
        broken.poll.side_effect = OSError('already gone')
        healthy = FakeProcess([None])
        stderr = io.StringIO()

        with mock.patch('sys.stderr', stderr):
            cli.stop_codex_children(broken, healthy)

        self.assertIn('Could not fully stop', stderr.getvalue())
        self.assertTrue(healthy.terminate_called)
        self.assertEqual(
            healthy.wait_calls, [cli.CODEX_CHILD_SHUTDOWN_TIMEOUT]
        )

    def test_generic_bridge_exit_before_tui_is_reported_and_reaped(self):
        app_server = FakeProcess([None])
        bridge = FakeProcess([3])
        with ExitStack() as stack:
            self.launcher_prerequisites(stack)
            popen = stack.enter_context(
                mock.patch.object(
                    cli.subprocess,
                    'Popen',
                    side_effect=[app_server, bridge],
                )
            )
            stderr = io.StringIO()
            stack.enter_context(mock.patch('sys.stderr', stderr))

            result = cli.cmd_codex(self.launcher_args())

        self.assertEqual(result, 1)
        self.assertEqual(popen.call_count, 2)
        self.assertIn(
            'exited unexpectedly with status 3', stderr.getvalue()
        )
        self.assertFalse(bridge.terminate_called)
        self.assertEqual(bridge.wait_calls, [None])
        self.assertTrue(app_server.terminate_called)

    def test_bridge_readiness_timeout_prevents_tui_start(self):
        app_server = FakeProcess([None])
        bridge = FakeProcess([None])
        with ExitStack() as stack:
            self.launcher_prerequisites(stack)
            self.bridge_ready_wait.side_effect = None
            self.bridge_ready_wait.return_value = (False, None, None)
            popen = stack.enter_context(
                mock.patch.object(
                    cli.subprocess,
                    'Popen',
                    side_effect=[app_server, bridge],
                )
            )
            stderr = io.StringIO()
            stack.enter_context(mock.patch('sys.stderr', stderr))

            result = cli.cmd_codex(self.launcher_args())

        self.assertEqual(result, 1)
        self.assertEqual(popen.call_count, 2)
        self.assertIn(
            'Timed out waiting for the Uclusion Codex bridge',
            stderr.getvalue(),
        )
        self.receiver_registration.assert_not_called()
        self.assertTrue(bridge.terminate_called)
        self.assertTrue(app_server.terminate_called)

    def test_bridge_exit_while_tui_runs_stops_tui_and_reaps_both(self):
        app_server = FakeProcess([None])
        bridge = FakeProcess([None, 2])
        tui = FakeProcess([None])
        with ExitStack() as stack:
            self.launcher_prerequisites(stack)
            stack.enter_context(
                mock.patch.object(
                    cli.subprocess,
                    'Popen',
                    side_effect=[app_server, bridge, tui],
                )
            )
            stderr = io.StringIO()
            stack.enter_context(mock.patch('sys.stderr', stderr))

            result = cli.cmd_codex(self.launcher_args())

        self.assertEqual(result, 1)
        self.assertIn('exited unexpectedly with status 2', stderr.getvalue())
        self.assertTrue(tui.terminate_called)
        self.assertEqual(tui.wait_calls, [cli.CODEX_CHILD_SHUTDOWN_TIMEOUT])
        self.assertEqual(bridge.wait_calls, [None])
        self.assertTrue(app_server.terminate_called)

    def test_app_server_exit_while_tui_runs_stops_tui_and_bridge(self):
        app_server = FakeProcess([None, 8])
        bridge = FakeProcess([None])
        tui = FakeProcess([None])
        with ExitStack() as stack:
            self.launcher_prerequisites(stack)
            stack.enter_context(
                mock.patch.object(
                    cli.subprocess,
                    'Popen',
                    side_effect=[app_server, bridge, tui],
                )
            )
            stderr = io.StringIO()
            stack.enter_context(mock.patch('sys.stderr', stderr))

            result = cli.cmd_codex(self.launcher_args())

        self.assertEqual(result, 1)
        self.assertIn('app-server exited unexpectedly with status 8', stderr.getvalue())
        self.assertTrue(tui.terminate_called)
        self.assertTrue(bridge.terminate_called)
        self.assertEqual(app_server.wait_calls, [None])

    def test_tui_start_failure_still_terminates_bridge(self):
        app_server = FakeProcess([None])
        bridge = FakeProcess([None])
        with ExitStack() as stack:
            self.launcher_prerequisites(stack)
            stack.enter_context(
                mock.patch.object(
                    cli.subprocess,
                    'Popen',
                    side_effect=[app_server, bridge, OSError('no terminal')],
                )
            )
            stderr = io.StringIO()
            stack.enter_context(mock.patch('sys.stderr', stderr))

            result = cli.cmd_codex(self.launcher_args())

        self.assertEqual(result, 1)
        self.assertIn('Could not start the Codex TUI', stderr.getvalue())
        self.assertTrue(bridge.terminate_called)
        self.assertEqual(bridge.wait_calls, [cli.CODEX_CHILD_SHUTDOWN_TIMEOUT])
        self.assertTrue(app_server.terminate_called)


class ProjectInstallDiscoveryTests(unittest.TestCase):
    def test_unmanaged_cursor_rule_filename_is_not_treated_as_an_install(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            home = temp_path / 'home'
            project = temp_path / 'project'
            (project / '.git').mkdir(parents=True)
            global_rule = home / '.cursor' / 'rules' / 'uclusion.mdc'
            project_rule = project / '.cursor' / 'rules' / 'uclusion.mdc'
            global_rule.parent.mkdir(parents=True)
            project_rule.parent.mkdir(parents=True)
            global_rule.write_text('# User-owned Cursor rule\n', encoding='utf-8')
            project_rule.write_text('# User-owned Cursor rule\n', encoding='utf-8')

            with mock.patch.object(
                cli.os.path,
                'expanduser',
                side_effect=lambda path: path.replace('~', str(home), 1),
            ):
                self.assertNotIn('cursor', cli.detect_global_clients())
            self.assertNotIn(
                'cursor', cli.detect_project_clients(str(project))
            )

    def test_workflow_release_state_fails_closed_for_pending_or_stale_clients(self):
        self.assertFalse(cli.workflow_install_is_stale({}, 'release-one'))
        self.assertFalse(cli.workflow_install_is_stale({
            'workflowClients': ['codex'],
            'workflowReinstallVersion': 'release-one',
        }, 'release-one'))
        self.assertTrue(cli.workflow_install_is_stale({
            'workflowClients': ['codex'],
            'workflowReinstallVersion': 'release-old',
        }, 'release-one'))
        self.assertEqual(
            {'codex', 'cursor'},
            cli.workflow_clients_needing_repair({
                'workflowClients': ['codex'],
                'workflowInstallPending': ['cursor', 'unknown'],
            }),
        )
        self.assertTrue(cli.workflow_install_is_stale({
            'workflowClients': ['codex'],
            'workflowReinstallVersion': 'release-one',
            'workflowInstallPending': ['codex'],
        }, 'release-one'))

    def test_global_detection_honors_client_config_directory_overrides(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            claude_root = temp_path / 'claude-data'
            codex_root = temp_path / 'codex-data'
            claude_skill = claude_root / 'skills' / 'uclusion' / 'SKILL.md'
            claude_skill.parent.mkdir(parents=True)
            claude_skill.write_text(
                cli.WORKFLOW_SKILL_MARKER + '\n', encoding='utf-8'
            )
            codex_override = codex_root / 'AGENTS.override.md'
            codex_override.parent.mkdir(parents=True)
            codex_override.write_text(
                cli.WORKFLOW_MD_MARKER + '\n', encoding='utf-8'
            )

            with mock.patch.dict(os.environ, {
                'CLAUDE_CONFIG_DIR': str(claude_root),
                'CODEX_HOME': str(codex_root),
            }, clear=False), mock.patch.object(
                cli.os.path,
                'expanduser',
                side_effect=lambda path: path.replace(
                    '~', str(temp_path / 'unused-home'), 1
                ),
            ):
                clients = cli.detect_global_clients()

            self.assertIn('claude', clients)
            self.assertIn('codex', clients)

    def test_codex_override_bootstraps_are_detected_globally_and_in_project(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            global_base = temp_path / '.codex' / 'AGENTS.md'
            global_override = temp_path / '.codex' / 'AGENTS.override.md'
            global_override.parent.mkdir(parents=True)
            global_base.write_text(
                cli.WORKFLOW_MD_MARKER + '\n', encoding='utf-8'
            )
            global_override.write_text(
                cli.WORKFLOW_MD_MARKER + '\n', encoding='utf-8'
            )

            project = temp_path / 'project'
            (project / '.git').mkdir(parents=True)
            project_base = project / 'AGENTS.md'
            project_override = project / 'AGENTS.override.md'
            project_base.write_text(
                cli.WORKFLOW_MD_MARKER + '\n', encoding='utf-8'
            )
            project_override.write_text(
                cli.WORKFLOW_MD_MARKER + '\n', encoding='utf-8'
            )

            with mock.patch.object(
                cli.os.path,
                'expanduser',
                side_effect=lambda path: path.replace('~', temp_dir, 1),
            ):
                self.assertIn('codex', cli.detect_global_clients())
            self.assertEqual({'codex'}, cli.detect_project_clients(str(project)))

            global_override.write_text(
                '# Different global override\n', encoding='utf-8'
            )
            project_override.write_text(
                '# Different project override\n', encoding='utf-8'
            )
            with mock.patch.object(
                cli.os.path,
                'expanduser',
                side_effect=lambda path: path.replace('~', temp_dir, 1),
            ):
                self.assertNotIn('codex', cli.detect_global_clients())
            self.assertEqual(set(), cli.detect_project_clients(str(project)))

            global_override.write_text('\n', encoding='utf-8')
            project_override.write_text('\n', encoding='utf-8')
            with mock.patch.object(
                cli.os.path,
                'expanduser',
                side_effect=lambda path: path.replace('~', temp_dir, 1),
            ):
                self.assertIn('codex', cli.detect_global_clients())
            self.assertEqual({'codex'}, cli.detect_project_clients(str(project)))

    def test_closest_ancestor_install_is_selected_without_crossing_repo_root(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            outside = temp_path / 'outside'
            repo = outside / 'repo'
            service = repo / 'services' / 'api'
            nested = service / 'src' / 'handlers'
            nested.mkdir(parents=True)
            (repo / '.git').mkdir()
            (outside / cli.STAGE_SOURCES_CONFIG_FILE).write_text(
                '{}\n', encoding='utf-8'
            )
            (repo / cli.STAGE_SOURCES_CONFIG_FILE).write_text(
                '{}\n', encoding='utf-8'
            )
            (service / cli.STAGE_SOURCES_CONFIG_FILE).write_text(
                '{}\n', encoding='utf-8'
            )
            (service / 'AGENTS.override.md').write_text(
                cli.WORKFLOW_MD_MARKER + '\n', encoding='utf-8'
            )

            self.assertEqual(
                str(service),
                cli.get_project_install_root('stage', str(nested)),
            )
            self.assertEqual(
                str(service / cli.STAGE_SOURCES_CONFIG_FILE),
                cli.get_project_config_path('stage', str(nested)),
            )
            self.assertEqual({'codex'}, cli.detect_project_clients(str(nested)))

            empty_repo = outside / 'empty-repo'
            empty_nested = empty_repo / 'src'
            empty_nested.mkdir(parents=True)
            (empty_repo / '.git').mkdir()
            self.assertIsNone(
                cli.get_project_install_root('stage', str(empty_nested))
            )
            self.assertIsNone(
                cli.get_project_config_path('stage', str(empty_nested))
            )
            self.assertEqual(
                set(), cli.detect_project_clients(str(empty_nested))
            )

    def test_nearer_client_only_marker_does_not_hide_ancestor_config(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            repo = Path(temp_dir) / 'repo'
            nested = repo / 'service' / 'src'
            nested.mkdir(parents=True)
            (repo / '.git').mkdir()
            config_path = repo / cli.STAGE_SOURCES_CONFIG_FILE
            config_path.write_text('{}\n', encoding='utf-8')
            (repo / 'service' / 'AGENTS.md').write_text(
                cli.WORKFLOW_MD_MARKER + '\n', encoding='utf-8'
            )

            self.assertEqual(
                str(config_path),
                cli.get_project_config_path('stage', str(nested)),
            )

    def test_stage_config_discovery_does_not_reuse_production_config(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            repo = Path(temp_dir) / 'repo'
            nested = repo / 'src'
            nested.mkdir(parents=True)
            (repo / '.git').mkdir()
            (repo / cli.SOURCES_CONFIG_FILE).write_text(
                '{}\n', encoding='utf-8'
            )

            self.assertIsNone(
                cli.get_project_config_path('stage', str(nested))
            )
            self.assertEqual(
                str(repo / cli.SOURCES_CONFIG_FILE),
                cli.get_project_config_path('production', str(nested)),
            )

    def test_wait_update_check_uses_ancestor_project_workspace(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            repo = Path(temp_dir) / 'repo'
            nested = repo / 'src' / 'package'
            nested.mkdir(parents=True)
            (repo / '.git').mkdir()
            (repo / cli.STAGE_SOURCES_CONFIG_FILE).write_text(
                json.dumps({
                    'workspaceId': 'project-workspace',
                    'scriptReinstallVersion': 'release-old',
                }),
                encoding='utf-8',
            )
            fetch_project = mock.Mock(return_value='release-new')
            with ExitStack() as stack:
                stack.enter_context(
                    mock.patch.object(
                        cli.os.path,
                        'expanduser',
                        side_effect=lambda path: path.replace(
                            '~', str(Path(temp_dir) / 'home'), 1
                        ),
                    )
                )
                stack.enter_context(
                    mock.patch.object(cli.os, 'getcwd', return_value=str(nested))
                )
                stack.enter_context(
                    mock.patch.object(
                        cli, 'get_installed_script_version', return_value=None
                    )
                )
                stack.enter_context(
                    mock.patch.object(cli, 'load_update_check_state', return_value={})
                )
                stack.enter_context(mock.patch.object(cli, 'save_update_check_state'))
                stack.enter_context(
                    mock.patch.object(
                        cli,
                        'fetch_script_version_for_workspace',
                        fetch_project,
                    )
                )
                fetch_global = stack.enter_context(
                    mock.patch.object(cli, 'fetch_latest_script_version')
                )

                notice = cli.check_wait_update_notice('stage')

            self.assertIsNotNone(notice)
            self.assertIn("project's Uclusion workflow files", notice)
            fetch_project.assert_called_once_with('stage', 'project-workspace')
            fetch_global.assert_not_called()

    def test_wait_update_check_stays_silent_during_workspace_rollout_disagreement(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            home = temp_path / 'home'
            repo = temp_path / 'repo'
            (home / '.uclusion').mkdir(parents=True)
            repo.mkdir()
            (repo / '.git').mkdir()
            (home / '.uclusion' / cli.STAGE_SOURCES_CONFIG_FILE).write_text(
                json.dumps({'workspaceId': 'global-workspace'}),
                encoding='utf-8',
            )
            (repo / cli.STAGE_SOURCES_CONFIG_FILE).write_text(
                json.dumps({'workspaceId': 'project-workspace'}),
                encoding='utf-8',
            )
            with ExitStack() as stack:
                stack.enter_context(mock.patch.object(
                    cli.os.path,
                    'expanduser',
                    side_effect=lambda path: path.replace('~', str(home), 1),
                ))
                stack.enter_context(mock.patch.object(
                    cli.os, 'getcwd', return_value=str(repo)
                ))
                stack.enter_context(mock.patch.object(
                    cli, 'get_installed_script_version', return_value='old'
                ))
                stack.enter_context(mock.patch.object(
                    cli, 'load_update_check_state', return_value={}
                ))
                stack.enter_context(mock.patch.object(
                    cli, 'save_update_check_state'
                ))
                stack.enter_context(mock.patch.object(
                    cli,
                    'fetch_script_version_for_workspace',
                    side_effect=lambda _env, workspace: {
                        'global-workspace': 'release-a',
                        'project-workspace': 'release-b',
                    }[workspace],
                ))

                notice = cli.check_wait_update_notice('stage')

            self.assertIsNone(notice)

    def test_update_check_reports_the_resolved_project_root(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            repo = temp_path / 'repo'
            nested = repo / 'src' / 'package'
            nested.mkdir(parents=True)
            (repo / '.git').mkdir()
            (repo / cli.STAGE_SOURCES_CONFIG_FILE).write_text(
                json.dumps({
                    'workspaceId': 'project-workspace',
                    'scriptReinstallVersion': 'release-current',
                }),
                encoding='utf-8',
            )
            (repo / 'AGENTS.override.md').write_text(
                cli.WORKFLOW_MD_MARKER + '\n', encoding='utf-8'
            )
            stdout = io.StringIO()
            with ExitStack() as stack:
                stack.enter_context(
                    mock.patch.object(cli.os, 'getcwd', return_value=str(nested))
                )
                stack.enter_context(
                    mock.patch.object(
                        cli.os.path,
                        'expanduser',
                        side_effect=lambda path: path.replace(
                            '~', str(temp_path / 'home'), 1
                        ),
                    )
                )
                stack.enter_context(
                    mock.patch.object(
                        cli,
                        'get_installed_script_version',
                        return_value='release-current',
                    )
                )
                fetch_project = stack.enter_context(
                    mock.patch.object(
                        cli,
                        'fetch_script_version_for_workspace',
                        return_value='release-current',
                    )
                )
                fetch_global = stack.enter_context(
                    mock.patch.object(cli, 'fetch_latest_script_version')
                )
                stack.enter_context(mock.patch('sys.stdout', stdout))

                result = cli.cmd_update(SimpleNamespace(
                    env='stage', check=True, token_audit=None
                ))

            self.assertEqual(0, result)
            self.assertIn(
                f'Project install in {repo} is current.', stdout.getvalue()
            )
            self.assertNotIn(str(nested), stdout.getvalue())
            fetch_project.assert_called_once_with(
                'stage', 'project-workspace'
            )
            fetch_global.assert_not_called()

    def test_update_check_reports_pending_project_workflow_at_current_script(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            repo = Path(temp_dir) / 'repo'
            repo.mkdir()
            (repo / '.git').mkdir()
            config_path = repo / cli.STAGE_SOURCES_CONFIG_FILE
            config_path.write_text(json.dumps({
                'workspaceId': 'project-workspace',
                'scriptReinstallVersion': 'release-current',
                'workflowReinstallVersion': 'release-current',
                'workflowClients': ['codex'],
                'workflowInstallPending': ['codex'],
            }), encoding='utf-8')
            stdout = io.StringIO()
            with ExitStack() as stack:
                stack.enter_context(
                    mock.patch.object(cli.os, 'getcwd', return_value=str(repo))
                )
                stack.enter_context(
                    mock.patch.object(
                        cli.os.path,
                        'expanduser',
                        side_effect=lambda path: path.replace(
                            '~', str(Path(temp_dir) / 'home'), 1
                        ),
                    )
                )
                stack.enter_context(mock.patch.object(
                    cli, 'get_installed_script_version',
                    return_value='release-current',
                ))
                stack.enter_context(mock.patch.object(
                    cli, 'fetch_script_version_for_workspace',
                    return_value='release-current',
                ))
                stack.enter_context(mock.patch('sys.stdout', stdout))

                result = cli.cmd_update(SimpleNamespace(
                    env='stage', check=True, token_audit=None
                ))

            self.assertEqual(2, result)
            self.assertIn('pending', stdout.getvalue())
            self.assertIn('Project workflow packages', stdout.getvalue())

    def test_update_check_refuses_global_project_rollout_disagreement(self):
        stdout = io.StringIO()
        with ExitStack() as stack:
            stack.enter_context(
                mock.patch.object(cli, 'get_project_install_root', return_value='/work/project')
            )
            stack.enter_context(
                mock.patch.object(
                    cli, 'get_project_config_path', return_value='/work/project/stage_uclusion.json'
                )
            )
            stack.enter_context(
                mock.patch.object(cli, 'detect_project_clients', return_value={'codex'})
            )
            stack.enter_context(
                mock.patch.object(
                    cli,
                    'load_config_at',
                    side_effect=[
                        {'workspaceId': 'global-workspace'},
                        {'workspaceId': 'project-workspace'},
                    ],
                )
            )
            stack.enter_context(
                mock.patch.object(
                    cli,
                    'fetch_script_version_for_workspace',
                    side_effect=lambda _env, workspace: {
                        'global-workspace': 'release-a',
                        'project-workspace': 'release-b',
                    }[workspace],
                )
            )
            stack.enter_context(mock.patch('sys.stdout', stdout))

            result = cli.cmd_update(SimpleNamespace(
                env='stage', check=True, token_audit=None
            ))

        self.assertEqual(1, result)
        self.assertIn('resolve to different script releases', stdout.getvalue())

    def test_load_config_and_codex_launch_find_ancestor_project_config(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            repo = temp_path / 'repo'
            nested = repo / 'src' / 'package'
            nested.mkdir(parents=True)
            (repo / '.git').mkdir()
            (repo / cli.STAGE_SOURCES_CONFIG_FILE).write_text(
                json.dumps({'workspaceId': 'project-workspace'}),
                encoding='utf-8',
            )
            stderr = io.StringIO()
            with ExitStack() as stack:
                stack.enter_context(
                    mock.patch.object(cli.os, 'getcwd', return_value=str(nested))
                )
                stack.enter_context(
                    mock.patch.object(cli.shutil, 'which', return_value=None)
                )
                stack.enter_context(mock.patch('sys.stderr', stderr))

                config = cli.load_config(cli.STAGE_SOURCES_CONFIG_FILE)
                result = cli.cmd_codex(SimpleNamespace(
                    env='stage', codex_args=[], deliver_existing_pokes=False
                ))

            self.assertEqual(
                {'workspaceId': 'project-workspace'}, config
            )
            self.assertEqual(1, result)
            self.assertIn("'codex' executable was not found", stderr.getvalue())
            self.assertNotIn('Configuration file', stderr.getvalue())


class UpdateReleaseConsistencyTests(unittest.TestCase):
    def update_args(self, token_audit=None):
        return SimpleNamespace(
            env='stage', check=False, token_audit=token_audit
        )

    def test_update_parser_exposes_mutually_exclusive_token_audit_flags(self):
        parser = cli.build_parser()

        default_args = parser.parse_args(['update'])
        enabled_args = parser.parse_args(['update', '--token-audit'])
        disabled_args = parser.parse_args(['update', '--no-token-audit'])
        stage_enabled_args = parser.parse_args([
            '-e', 'stage', 'update', '--token-audit'
        ])

        self.assertIsNone(default_args.token_audit)
        self.assertTrue(enabled_args.token_audit)
        self.assertFalse(disabled_args.token_audit)
        self.assertEqual(stage_enabled_args.env, 'stage')
        self.assertTrue(stage_enabled_args.token_audit)
        help_output = io.StringIO()
        with mock.patch('sys.stdout', help_output):
            with self.assertRaises(SystemExit):
                parser.parse_args(['update', '--help'])
        self.assertIn('--token-audit', help_output.getvalue())
        self.assertIn('--no-token-audit', help_output.getvalue())
        with mock.patch('sys.stderr', io.StringIO()):
            with self.assertRaises(SystemExit):
                parser.parse_args([
                    'update', '--token-audit', '--no-token-audit'
                ])
            with self.assertRaises(SystemExit):
                parser.parse_args(['update', '--check', '--token-audit'])

    def patch_update_context(self, stack):
        stack.enter_context(
            mock.patch.object(cli.os, 'getcwd', return_value='/work/project')
        )
        stack.enter_context(
            mock.patch.object(
                cli, 'get_project_config_path', return_value='/work/project/uclusion.json'
            )
        )
        stack.enter_context(
            mock.patch.object(
                cli, 'detect_project_clients', return_value={'codex'}
            )
        )
        stack.enter_context(
            mock.patch.object(
                cli,
                'get_env_paths',
                return_value=(
                    'stage.api.example',
                    'stage_uclusion.json',
                    'stage_credentials',
                ),
            )
        )
        stack.enter_context(
            mock.patch.object(
                cli,
                'load_config_at',
                side_effect=[
                    {
                        'workspaceId': 'global-workspace',
                        'workflowClients': ['codex'],
                    },
                    {
                        'workspaceId': 'project-workspace',
                        'workflowClients': ['cursor', 'unknown', 42],
                    },
                ],
            )
        )

    def test_run_installer_receives_the_pinned_release(self):
        completed = SimpleNamespace(returncode=0)
        with mock.patch.object(
            cli.subprocess, 'run', return_value=completed
        ) as run:
            result = cli.run_installer(
                '/tmp/installer.py',
                'stage',
                {'workspaceId': 'workspace-1'},
                None,
                {'codex'},
                project=True,
                script_version='release-123',
                skip_scripts=True,
            )

        self.assertTrue(result)
        self.assertEqual(
            run.call_args.args[0],
            [
                sys.executable,
                '/tmp/installer.py',
                'stage',
                'workspace-1',
                'workspace-1',
                '--script-version',
                'release-123',
                '--no-token-audit',
                '--no-work-claims',
                '--clients',
                'codex',
                '--project',
                '--skip-scripts',
            ],
        )

    def test_run_installer_preserves_enabled_token_audit(self):
        completed = SimpleNamespace(returncode=0)
        with mock.patch.object(
            cli.subprocess, 'run', return_value=completed
        ) as run:
            result = cli.run_installer(
                '/tmp/installer.py',
                'stage',
                {
                    'workspaceId': 'workspace-1',
                    'tokenAudit': {'enabled': True, 'port': 23456},
                },
                None,
                {'claude'},
                project=False,
                script_version='release-123',
            )

        self.assertTrue(result)
        self.assertIn('--token-audit', run.call_args.args[0])
        self.assertNotIn('--no-token-audit', run.call_args.args[0])

    def test_run_installer_explicit_token_audit_choice_overrides_config(self):
        completed = SimpleNamespace(returncode=0)
        cases = (
            ({'enabled': False, 'port': 23456}, True, '--token-audit'),
            ({'enabled': True, 'port': 23456}, False, '--no-token-audit'),
        )
        for token_audit, override, expected_flag in cases:
            with self.subTest(override=override), mock.patch.object(
                cli.subprocess, 'run', return_value=completed
            ) as run:
                result = cli.run_installer(
                    '/tmp/installer.py',
                    'stage',
                    {
                        'workspaceId': 'workspace-1',
                        'tokenAudit': token_audit,
                    },
                    None,
                    {'codex'},
                    project=False,
                    script_version='release-123',
                    token_audit_enabled=override,
                )

            self.assertTrue(result)
            command = run.call_args.args[0]
            self.assertIn(expected_flag, command)
            unexpected_flag = (
                '--no-token-audit'
                if expected_flag == '--token-audit'
                else '--token-audit'
            )
            self.assertNotIn(unexpected_flag, command)

    def test_project_only_update_forwards_environment_and_token_audit_choice(self):
        response = mock.MagicMock()
        response.__enter__.return_value.read.return_value = b'# installer\n'
        response.__exit__.return_value = False
        completed = SimpleNamespace(returncode=0)
        with ExitStack() as stack:
            stack.enter_context(
                mock.patch.object(
                    cli.os, 'getcwd', return_value='/work/project/src/package'
                )
            )
            stack.enter_context(
                mock.patch.object(
                    cli,
                    'get_project_config_path',
                    return_value='/work/project/stage_uclusion.json',
                )
            )
            stack.enter_context(
                mock.patch.object(
                    cli, 'detect_project_clients', return_value={'codex'}
                )
            )
            stack.enter_context(
                mock.patch.object(
                    cli,
                    'get_env_paths',
                    return_value=(
                        'stage.api.example',
                        'stage_uclusion.json',
                        'stage_credentials',
                    ),
                )
            )
            stack.enter_context(
                mock.patch.object(
                    cli,
                    'load_config_at',
                    side_effect=[
                        None,
                        {
                            'workspaceId': 'project-workspace',
                            'tokenAudit': {'enabled': False, 'port': 23456},
                        },
                    ],
                )
            )
            stack.enter_context(
                mock.patch.object(
                    cli,
                    'fetch_script_version_for_workspace',
                    return_value='release-one',
                )
            )
            stack.enter_context(
                mock.patch.object(
                    cli.urllib.request, 'urlopen', return_value=response
                )
            )
            run = stack.enter_context(
                mock.patch.object(
                    cli.subprocess, 'run', return_value=completed
                )
            )

            result = cli.cmd_update(
                SimpleNamespace(env='stage', check=False, token_audit=True)
            )

        self.assertEqual(result, 0)
        run.assert_called_once()
        command = run.call_args.args[0]
        self.assertEqual(command[2:5], [
            'stage', 'project-workspace', 'project-workspace'
        ])
        self.assertIn('--token-audit', command)
        self.assertIn('--project', command)
        self.assertNotIn('--skip-scripts', command)
        self.assertEqual(run.call_args.kwargs['cwd'], '/work/project')

    def test_update_rejects_workspace_release_disagreement_before_download(self):
        with ExitStack() as stack:
            self.patch_update_context(stack)
            stack.enter_context(
                mock.patch.object(
                    cli,
                    'fetch_script_version_for_workspace',
                    side_effect=lambda _env, workspace: {
                        'global-workspace': 'release-a',
                        'project-workspace': 'release-b',
                    }[workspace],
                )
            )
            urlopen = stack.enter_context(
                mock.patch.object(cli.urllib.request, 'urlopen')
            )
            stdout = io.StringIO()
            stack.enter_context(mock.patch('sys.stdout', stdout))

            result = cli.cmd_update(self.update_args())

        self.assertEqual(result, 1)
        self.assertIn('different script releases', stdout.getvalue())
        urlopen.assert_not_called()

    def test_update_passes_one_release_and_audit_choice_to_both_installers(self):
        for token_audit in (None, True, False):
            with self.subTest(token_audit=token_audit):
                response = mock.MagicMock()
                response.__enter__.return_value.read.return_value = b'# installer\n'
                response.__exit__.return_value = False
                with ExitStack() as stack:
                    self.patch_update_context(stack)
                    stack.enter_context(
                        mock.patch.object(
                            cli,
                            'fetch_script_version_for_workspace',
                            return_value='release-one',
                        )
                    )
                    stack.enter_context(
                        mock.patch.object(
                            cli.urllib.request, 'urlopen', return_value=response
                        )
                    )
                    stack.enter_context(
                        mock.patch.object(
                            cli, 'detect_global_clients', return_value={'claude'}
                        )
                    )
                    run_installer = stack.enter_context(
                        mock.patch.object(
                            cli, 'run_installer', return_value=True
                        )
                    )

                    result = cli.cmd_update(
                        self.update_args(token_audit=token_audit)
                    )

                self.assertEqual(result, 0)
                self.assertEqual(run_installer.call_count, 2)
                global_call, project_call = run_installer.call_args_list
                self.assertEqual(
                    global_call.kwargs['script_version'], 'release-one'
                )
                self.assertEqual(
                    global_call.args[4], {'claude', 'codex'}
                )
                self.assertEqual(
                    project_call.kwargs['script_version'], 'release-one'
                )
                self.assertIs(
                    global_call.kwargs['token_audit_enabled'], token_audit
                )
                self.assertIs(
                    project_call.kwargs['token_audit_enabled'], token_audit
                )
                self.assertEqual(
                    project_call.args[4], {'codex', 'cursor'}
                )
                self.assertNotIn('skip_scripts', global_call.kwargs)
                self.assertTrue(project_call.kwargs['skip_scripts'])


if __name__ == '__main__':
    unittest.main()
