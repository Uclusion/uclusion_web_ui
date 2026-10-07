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
import uclusionInstall as installer


class ProjectInstallDiscoveryTests(unittest.TestCase):
    def test_json_client_discovery_recognizes_current_and_legacy_namespace(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'mcp.json'
            for namespace in ('uclusion', 'Uclusion'):
                with self.subTest(namespace=namespace):
                    path.write_text(json.dumps({'mcpServers': {namespace: {}}}))
                    self.assertTrue(cli.json_has_uclusion_server(str(path)))

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

    def test_global_detection_finds_only_mcp_registration_in_custom_claude_directory(self):
        with tempfile.TemporaryDirectory() as directory:
            claude_root = Path(directory) / 'claude-data'
            claude_root.mkdir()
            (claude_root / '.claude.json').write_text(
                json.dumps({'mcpServers': {'Uclusion': {'command': 'python3'}}}),
                encoding='utf-8',
            )
            with mock.patch.dict(os.environ, {'CLAUDE_CONFIG_DIR': str(claude_root)}), \
                    mock.patch.object(cli.os.path, 'expanduser', side_effect=lambda path:
                                      path.replace('~', str(Path(directory) / 'home'), 1)):
                self.assertIn('claude', cli.detect_global_clients())

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

    def test_load_config_finds_ancestor_project_config(self):
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
            credentials_home = temp_path / 'home'
            (credentials_home / '.uclusion').mkdir(parents=True)
            (credentials_home / '.uclusion' / cli.STAGE_CREDENTIALS_FILE).write_text(
                '', encoding='utf-8'
            )
            stderr = io.StringIO()
            with ExitStack() as stack:
                stack.enter_context(
                    mock.patch.dict(os.environ, {'UCLUSION_HOME': str(credentials_home)})
                )
                stack.enter_context(
                    mock.patch.object(cli.os, 'getcwd', return_value=str(nested))
                )
                stack.enter_context(
                    mock.patch.object(cli.shutil, 'which', return_value=None)
                )
                stack.enter_context(mock.patch('sys.stderr', stderr))

                config = cli.load_config(cli.STAGE_SOURCES_CONFIG_FILE)


            self.assertEqual(
                {'workspaceId': 'project-workspace'}, config
            )
            self.assertNotIn('Configuration file', stderr.getvalue())


class UpdateReleaseConsistencyTests(unittest.TestCase):
    def update_args(self, token_audit=None):
        return SimpleNamespace(
            env='stage', check=False, token_audit=token_audit
        )

    def test_response_stats_parser_preserves_update_flag_and_rejects_invalid_modes(self):
        expected = os.path.abspath('sizes.jsonl')
        for command in (
            ['--response-stats', 'sizes.jsonl', 'update'],
            ['update', '--response-stats', 'sizes.jsonl'],
        ):
            with self.subTest(command=command):
                self.assertEqual(expected, cli.parse_args(command).response_stats)
        self.assertIsNone(cli.parse_args(['update']).response_stats)
        self.assertIs(cli.parse_args(['update', '--no-response-stats']).response_stats, False)
        for command in (
            ['update', '--response-stats', 'sizes', '--no-response-stats'],
            ['update', '--check', '--response-stats', 'sizes'],
            ['update', '--check', '--no-response-stats'],
            ['--response-stats', 'sizes', 'export'],
            ['--response-stats', ' ', 'update'],
        ):
            with self.subTest(command=command), mock.patch('sys.stderr', io.StringIO()):
                with self.assertRaises(SystemExit) as raised:
                    cli.parse_args(command)
                self.assertEqual(2, raised.exception.code)

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

    def test_run_installer_passes_stats_choice_to_recording_client_scopes(self):
        for clients in ({'claude', 'codex'}, {'claude'}, {'codex'}, {'codex', 'cursor'}, {'cursor'}, set()):
            for choice in (None, False, '/work/sizes.jsonl'):
                with self.subTest(clients=clients, choice=choice), mock.patch.object(
                    cli.subprocess, 'run', return_value=SimpleNamespace(returncode=0)
                ) as run:
                    self.assertTrue(cli.run_installer(
                        '/tmp/installer.py', 'stage', {'workspaceId': 'workspace'},
                        None, clients, project=True, script_version='release-one',
                        project_dir='/work/project', response_stats=choice,
                    ))
                    command = run.call_args.args[0]
                    if {'claude', 'codex'}.intersection(clients) and choice is False:
                        self.assertIn('--no-response-stats', command)
                        self.assertNotIn('--response-stats', command)
                    elif {'claude', 'codex'}.intersection(clients) and choice is not None:
                        index = command.index('--response-stats')
                        self.assertEqual(choice, command[index + 1])
                    else:
                        self.assertNotIn('--response-stats', command)
                        self.assertNotIn('--no-response-stats', command)
                    self.assertEqual('/work/project', run.call_args.kwargs['cwd'])

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

    def test_update_response_stats_choice_reaches_both_scopes_with_one_absolute_path(self):
        for client, choice in ((client, choice) for client in ('claude', 'codex')
                               for choice in (['--response-stats', 'sizes.jsonl'], ['--no-response-stats'], [])):
            with self.subTest(client=client, choice=choice), ExitStack() as stack:
                self.patch_update_context(stack)
                stack.enter_context(mock.patch.object(
                    cli, 'detect_global_clients', return_value={client}))
                stack.enter_context(mock.patch.object(
                    cli, 'detect_project_clients', return_value={client}))
                stack.enter_context(mock.patch.object(
                    cli, 'fetch_script_version_for_workspace', return_value='release-one'))
                response = mock.MagicMock()
                response.__enter__.return_value.read.return_value = b'# installer\n'
                stack.enter_context(mock.patch.object(
                    cli.urllib.request, 'urlopen', return_value=response))
                run = stack.enter_context(mock.patch.object(cli, 'run_installer', return_value=True))
                args = cli.parse_args(['-e', 'stage', 'update'] + choice)

                self.assertEqual(0, cli.cmd_update(args))

                self.assertEqual(2, run.call_count)
                expected = '/work/project/sizes.jsonl' if len(choice) == 2 else False if choice else None
                for invocation in run.call_args_list:
                    self.assertEqual(expected, invocation.kwargs['response_stats'])

    def test_update_response_stats_refuses_missing_recording_client_before_download(self):
        with ExitStack() as stack:
            self.patch_update_context(stack)
            stack.enter_context(mock.patch.object(
                cli, 'detect_global_clients', return_value={'cursor'}))
            stack.enter_context(mock.patch.object(
                cli, 'detect_project_clients', return_value={'cursor'}))
            stack.enter_context(mock.patch.object(
                cli, 'workflow_clients_needing_repair', return_value=set()))
            resolve = stack.enter_context(mock.patch.object(cli, 'resolve_update_release'))
            download = stack.enter_context(mock.patch.object(cli.urllib.request, 'urlopen'))
            output = stack.enter_context(mock.patch('sys.stdout', io.StringIO()))
            self.assertEqual(1, cli.cmd_update(cli.parse_args(['update', '--no-response-stats'])))
            self.assertIn('No installed Claude or Codex Uclusion connection', output.getvalue())
            resolve.assert_not_called()
            download.assert_not_called()

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
