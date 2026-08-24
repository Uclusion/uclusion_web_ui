import importlib.util
import io
import json
import os
import stat
import subprocess
import tempfile
import tomllib
import unittest
from unittest import mock


SCRIPT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_module(name, filename):
    spec = importlib.util.spec_from_file_location(
        name, os.path.join(SCRIPT_DIR, filename)
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


SETUP = load_module('uclusion_setup_mcp_under_test', 'uclusionSetupMCP.py')
INSTALL = load_module('uclusion_setup_install_under_test', 'uclusionInstall.py')


class SetupMCPTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp_dir.cleanup)
        self.uclusion_home = os.path.join(self.temp_dir.name, '.uclusion')
        self.receipt_dir = os.path.join(
            self.uclusion_home, 'setup-receipts'
        )
        self.state_patch = mock.patch.multiple(
            SETUP,
            UCLUSION_HOME=self.uclusion_home,
            RECEIPT_DIR=self.receipt_dir,
        )
        self.state_patch.start()
        self.addCleanup(self.state_patch.stop)

    @staticmethod
    def start_response(payload):
        setup_id = payload['setup_id']
        return 201, {
            'setup_id': setup_id,
            'state': 'PENDING',
            'proposal': payload['proposal'],
            'authorization_url': (
                f'https://stage.uclusion.com/setup/{setup_id}'
            ),
            'expires_at': '2026-08-23T20:15:00Z',
        }

    def test_credential_posts_never_follow_redirects(self):
        origin = 'https://sso.stage.api.uclusion.com/v1/setup/setup-1/recover'
        target = 'https://attacker.invalid/collect'
        request = SETUP.urllib.request.Request(
            origin,
            data=b'{"secret_key":"private"}',
            method='POST',
        )
        handler = SETUP._NoRedirectHandler()
        for status in (301, 302, 303, 307, 308):
            with self.subTest(status=status):
                self.assertIsNone(handler.redirect_request(
                    request, None, status, 'redirect', {'Location': target}, target
                ))

        redirect = SETUP.urllib.error.HTTPError(
            origin,
            307,
            'redirect',
            {'Location': target},
            io.BytesIO(b'{}'),
        )
        with mock.patch.object(
            SETUP._NO_REDIRECT_OPENER, 'open', side_effect=redirect
        ) as opened, mock.patch.object(
            SETUP.urllib.request, 'urlopen'
        ) as default_open:
            status, response = SETUP.post_json(origin, {
                'workspace_id': 'workspace-1',
                'view_id': 'view-1',
                'secret_key_id': 'account-1',
                'secret_key': 'private',
            })

        self.assertEqual((status, response), (307, {}))
        opened.assert_called_once()
        default_open.assert_not_called()

    def test_workspace_url_uses_exact_created_view_and_safe_values(self):
        self.assertEqual(
            SETUP._workspace_url('stage', 'workspace_1', 'view-1'),
            'https://stage.uclusion.com/dialog/workspace_1?groupId=view-1',
        )
        invalid_values = (
            ('preview', 'workspace-1', 'view-1'),
            ('stage', '../workspace-1', 'view-1'),
            ('stage', 'workspace-1', 'view-1&next=attacker.invalid'),
        )
        for values in invalid_values:
            with self.subTest(values=values), self.assertRaises(SETUP.SafeSetupError):
                SETUP._workspace_url(*values)

    def test_tool_surface_is_exact_and_create_exposes_no_private_proof(self):
        requests = []

        def requester(url, payload):
            requests.append((url, payload))
            return self.start_response(payload)

        project_dir = os.path.join(self.temp_dir.name, 'Sample Project')
        os.makedirs(project_dir)
        context = SETUP.SetupContext(
            'stage', 'codex', 'project', project_dir
        )
        service = SETUP.SetupService(
            context,
            requester=requester,
            browser_open=lambda *_args, **_kwargs: False,
        )
        self.addCleanup(service.close)

        self.assertEqual(
            [tool['name'] for tool in service.tools()],
            ['create_workspace', 'complete_setup'],
        )
        result = service.create_workspace({
            'workspace_name': '  Example   Workspace ',
            'client': 'codex',
            'scope': 'project',
        })
        setup_id = result['setup_id']
        enrollment = service.enrollment
        serialized = json.dumps(result)
        request_payload = requests[0][1]

        self.assertEqual(
            requests[0][0],
            'https://sso.stage.api.uclusion.com/v1/setup',
        )
        self.assertEqual(len(request_payload['code_challenge']), 43)
        self.assertNotEqual(
            request_payload['code_challenge'], enrollment['verifier']
        )
        self.assertNotIn(enrollment['verifier'], serialized)
        self.assertNotIn(project_dir, json.dumps(request_payload))
        self.assertEqual(
            request_payload['proposal'],
            {
                'workspace_name': 'Example Workspace',
                'client': 'codex',
                'scope': 'project',
                'token_audit': False,
                'work_claims': False,
                'project_label': 'Sample Project',
            },
        )
        self.assertFalse(os.path.exists(context.receipt_path))

    def test_project_label_normalizes_backend_disallowed_separators(self):
        project_dir = os.path.join(self.temp_dir.name, r'parent\child')
        os.makedirs(project_dir)
        requests = []
        service = SETUP.SetupService(
            SETUP.SetupContext('stage', 'codex', 'project', project_dir),
            requester=lambda url, payload: (
                requests.append((url, payload)) or self.start_response(payload)
            ),
            browser_open=lambda *_args, **_kwargs: False,
        )
        self.addCleanup(service.close)

        service.create_workspace({
            'workspace_name': 'Example',
            'client': 'codex',
            'scope': 'project',
        })

        self.assertEqual(
            requests[0][1]['proposal']['project_label'], 'parent child'
        )
        self.assertNotIn('\\', requests[0][1]['proposal']['project_label'])
        self.assertFalse(os.path.exists(SETUP.credential_path('stage')))

    def test_duplicate_create_returns_same_memory_only_enrollment(self):
        requester = mock.Mock(side_effect=lambda _url, payload: self.start_response(payload))
        service = SETUP.SetupService(
            SETUP.SetupContext('stage', 'claude', 'global'),
            requester=requester,
            browser_open=lambda *_args, **_kwargs: False,
        )

        first = service.create_workspace({
            'workspace_name': 'First choice',
            'client': 'claude',
            'scope': 'global',
            'token_audit': True,
        })
        verifier = service.enrollment['verifier']
        second = service.create_workspace({
            'workspace_name': 'Different retry values',
            'client': 'claude',
            'scope': 'global',
            'work_claims': True,
        })

        self.assertEqual(second, first)
        self.assertEqual(service.enrollment['verifier'], verifier)
        self.assertEqual(requester.call_count, 1)

    def test_cursor_schema_and_validation_reject_token_audit(self):
        requester = mock.Mock()
        service = SETUP.SetupService(
            SETUP.SetupContext('stage', 'cursor', 'global'),
            requester=requester,
        )
        create_tool = service.tools()[0]

        self.assertEqual(
            create_tool['inputSchema']['properties']['token_audit'],
            {'enum': [False], 'default': False},
        )
        with self.assertRaises(SETUP.SafeSetupError) as raised:
            service.create_workspace({
                'workspace_name': 'Example',
                'client': 'cursor',
                'scope': 'global',
                'token_audit': True,
            })

        self.assertEqual(raised.exception.status, 'invalid_request')
        requester.assert_not_called()

    def test_environment_lock_serializes_clients_and_scopes(self):
        project_dir = os.path.join(self.temp_dir.name, 'project')
        first = SETUP.SetupService(
            SETUP.SetupContext('stage', 'claude', 'global'),
            requester=lambda _url, payload: self.start_response(payload),
            browser_open=lambda *_args, **_kwargs: False,
        )
        second_requester = mock.Mock(
            side_effect=lambda _url, payload: self.start_response(payload)
        )
        second = SETUP.SetupService(
            SETUP.SetupContext('stage', 'codex', 'project', project_dir),
            requester=second_requester,
            browser_open=lambda *_args, **_kwargs: False,
        )
        arguments = {
            'workspace_name': 'First',
            'client': 'claude',
            'scope': 'global',
        }
        first.create_workspace(arguments)

        with self.assertRaises(SETUP.SafeSetupError) as raised:
            second.create_workspace({
                'workspace_name': 'Second',
                'client': 'codex',
                'scope': 'project',
            })

        self.assertEqual(raised.exception.status, 'setup_in_progress')
        second_requester.assert_not_called()
        first.close()
        created = second.create_workspace({
            'workspace_name': 'Second',
            'client': 'codex',
            'scope': 'project',
        })
        self.assertEqual(created['status'], 'pending_authorization')

    def test_crashed_receipt_blocks_other_target_until_original_recovers(self):
        original = SETUP.SetupContext('stage', 'claude', 'global')
        other = SETUP.SetupContext(
            'stage', 'codex', 'project', os.path.join(self.temp_dir.name, 'project')
        )
        SETUP.write_credentials('stage', {
            'secret_key_id': 'external_account',
            'secret_key': 'private-shared-secret',
        })
        SETUP.write_receipt(
            original.receipt_path, 'setup-1', 'workspace-1', 'view-1'
        )
        other_requester = mock.Mock(
            side_effect=lambda _url, payload: self.start_response(payload)
        )
        other_service = SETUP.SetupService(
            other,
            requester=other_requester,
            browser_open=lambda *_args, **_kwargs: False,
        )

        blocked = other_service.create_workspace({
            'workspace_name': 'Must wait',
            'client': 'codex',
            'scope': 'project',
        })

        self.assertEqual(blocked['status'], 'recovery_pending')
        self.assertNotIn('setup_id', blocked)
        other_requester.assert_not_called()

        recovery_installer = mock.Mock()
        recovery = SETUP.SetupService(
            original,
            requester=mock.Mock(return_value=(200, {
                'setup_id': 'setup-1',
                'state': 'CONSUMED',
                'workspace_id': 'workspace-1',
                'view_id': 'view-1',
                'settings': {
                    'token_audit': False,
                    'work_claims': True,
                },
            })),
            installer=recovery_installer,
        )
        result, is_error = recovery.complete_setup({'setup_id': 'setup-1'})

        self.assertFalse(is_error)
        self.assertEqual(result['status'], 'completed')
        recovery_installer.assert_called_once_with(
            original,
            'workspace-1',
            'view-1',
            {
                'client': 'claude',
                'scope': 'global',
                'token_audit': False,
                'work_claims': True,
            },
        )
        created = other_service.create_workspace({
            'workspace_name': 'Now safe',
            'client': 'codex',
            'scope': 'project',
        })
        self.assertEqual(created['status'], 'pending_authorization')
        self.assertEqual(other_requester.call_count, 1)

    def test_completion_privately_writes_credential_then_activates(self):
        secret = 'private-shared-secret'
        secret_id = 'external_account'
        requests = []
        receipt_seen = []
        write_order = []
        context = SETUP.SetupContext('stage', 'claude', 'global')
        os.makedirs(self.uclusion_home)
        credential_file = SETUP.credential_path('stage')
        with open(credential_file, 'w', encoding='utf-8') as target:
            target.write(
                'secret_key_id = external_account\nsecret_key = old\n'
            )
        os.chmod(credential_file, 0o644)

        def requester(url, payload):
            requests.append((url, dict(payload)))
            if url.endswith('/setup'):
                return self.start_response(payload)
            if payload.get('credentials_written'):
                credential_file = SETUP.credential_path('stage')
                self.assertTrue(os.path.exists(credential_file))
                with open(credential_file, encoding='utf-8') as source:
                    self.assertIn(secret, source.read())
                self.assertTrue(os.path.exists(context.receipt_path))
                return 200, {
                    'setup_id': setup_id,
                    'state': 'CONSUMED',
                    'workspace_id': 'workspace-1',
                    'view_id': 'view-1',
                }
            return 200, {
                'setup_id': setup_id,
                'state': 'COMPLETING',
                'workspace_id': 'workspace-1',
                'view_id': 'view-1',
                'credentials': {
                    'secret_key_id': secret_id,
                    'secret_key': secret,
                },
                'next': 'WRITE_CREDENTIALS_AND_ACK',
            }

        def installer(_context, workspace_id, view_id, proposal):
            with open(context.receipt_path, encoding='utf-8') as source:
                receipt_seen.append(json.load(source))
            self.assertEqual((workspace_id, view_id), ('workspace-1', 'view-1'))
            self.assertFalse(proposal['token_audit'])

        private_write = SETUP.atomic_private_write

        def record_private_write(path, content, **kwargs):
            write_order.append(path)
            return private_write(path, content, **kwargs)

        service = SETUP.SetupService(
            context,
            requester=requester,
            browser_open=lambda *_args, **_kwargs: False,
            installer=installer,
        )
        created = service.create_workspace({
            'workspace_name': 'Example',
            'client': 'claude',
            'scope': 'global',
        })
        setup_id = created['setup_id']
        verifier = service.enrollment['verifier']
        with mock.patch.object(
            SETUP, 'atomic_private_write', side_effect=record_private_write
        ):
            result, is_error = service.complete_setup({'setup_id': setup_id})
        serialized = json.dumps(result)

        self.assertFalse(is_error)
        self.assertEqual(result['status'], 'completed')
        self.assertEqual(
            result['workspace_url'],
            'https://stage.uclusion.com/dialog/workspace-1?groupId=view-1',
        )
        self.assertIn(result['workspace_url'], result['next'])
        self.assertNotIn(secret, serialized)
        self.assertNotIn(secret_id, serialized)
        self.assertNotIn(verifier, serialized)
        self.assertEqual(
            receipt_seen,
            [{
                'setup_id': setup_id,
                'workspace_id': 'workspace-1',
                'view_id': 'view-1',
            }],
        )
        self.assertEqual(
            write_order,
            [credential_file, context.receipt_path],
        )
        self.assertEqual(
            stat.S_IMODE(os.stat(credential_file).st_mode), 0o600
        )
        self.assertFalse(os.path.exists(context.receipt_path))
        self.assertEqual(
            requests[-2][1], {'verifier': verifier}
        )
        self.assertEqual(
            requests[-1][1], {
                'verifier': verifier,
                'credentials_written': True,
            },
        )

    def test_completion_requires_fresh_client_session_in_configured_scope(self):
        cases = (
            ('claude', 'global', 'stage', 'Fully exit Claude Code', None),
            ('claude', 'project', 'stage', 'Fully exit Claude Code', None),
            ('cursor', 'global', 'stage', 'Fully exit Cursor', None),
            ('cursor', 'project', 'stage', 'Fully exit Cursor', None),
            (
                'codex', 'global', 'production', 'Fully exit this Codex session',
                '`uclusion codex`',
            ),
            (
                'codex', 'project', 'stage', 'Fully exit this Codex session',
                '`uclusion -e stage codex`',
            ),
            (
                'codex', 'project', 'dev', 'Fully exit this Codex session',
                '`uclusion -e dev codex`',
            ),
        )
        for client, scope, environment, exit_text, command in cases:
            with self.subTest(client=client, scope=scope, environment=environment):
                context = SETUP.SetupContext(
                    environment,
                    client,
                    scope,
                    self.temp_dir.name if scope == 'project' else None,
                )
                service = SETUP.SetupService(context)
                try:
                    instruction = service._relaunch_instruction()
                finally:
                    service.close()

                self.assertIn(exit_text, instruction)
                self.assertIn('fresh client session', instruction)
                self.assertIn('MCP reconnect alone is insufficient', instruction)
                self.assertIn('Start the first normal turn with `Go`', instruction)
                self.assertIn('call find_work', instruction)
                self.assertIn('one-time first-session onboarding', instruction)
                self.assertIn(
                    (
                        'configured project directory'
                        if scope == 'project'
                        else 'configured global scope'
                    ),
                    instruction,
                )
                if command is not None:
                    self.assertIn(command, instruction)

    def _assert_existing_credentials_preserved(
        self, original, raced_content=None, race_after_write=False
    ):
        context = SETUP.SetupContext('stage', 'claude', 'global')
        os.makedirs(self.uclusion_home, exist_ok=True)
        credential_file = SETUP.credential_path('stage')
        with open(credential_file, 'wb') as target:
            target.write(original)
        requests = []

        def requester(url, payload):
            requests.append((url, dict(payload)))
            if url.endswith('/setup'):
                return self.start_response(payload)
            self.assertNotIn('credentials_written', payload)
            return 200, {
                'setup_id': setup_id,
                'state': 'COMPLETING',
                'workspace_id': 'workspace-1',
                'view_id': 'view-1',
                'credentials': {
                    'secret_key_id': 'approved-account',
                    'secret_key': 'approved-secret',
                },
                'next': 'WRITE_CREDENTIALS_AND_ACK',
            }

        installer = mock.Mock()
        service = SETUP.SetupService(
            context,
            requester=requester,
            browser_open=lambda *_args, **_kwargs: False,
            installer=installer,
        )
        created = service.create_workspace({
            'workspace_name': 'Example',
            'client': 'claude',
            'scope': 'global',
        })
        setup_id = created['setup_id']
        private_write = SETUP.atomic_private_write

        def race_then_write(path, content, **kwargs):
            if raced_content is not None and not race_after_write:
                with open(credential_file, 'wb') as target:
                    target.write(raced_content)
            result = private_write(path, content, **kwargs)
            if raced_content is not None and race_after_write:
                with open(credential_file, 'wb') as target:
                    target.write(raced_content)
            return result

        with mock.patch.object(
            SETUP, 'atomic_private_write', side_effect=race_then_write
        ), self.assertRaises(SETUP.SafeSetupError) as raised:
            service.complete_setup({'setup_id': setup_id})

        self.assertEqual(raised.exception.status, 'credential_conflict')
        self.assertEqual(len(requests), 2)
        installer.assert_not_called()
        with open(credential_file, 'rb') as source:
            self.assertEqual(source.read(), raced_content or original)
        self.assertFalse(os.path.exists(context.receipt_path))
        self.assertFalse(service.enrollment['credentials_written'])

    def test_different_account_credentials_are_preserved_before_ack(self):
        self._assert_existing_credentials_preserved(
            b'secret_key_id = other-account\nsecret_key = existing-secret\n'
        )

    def test_malformed_existing_credentials_are_preserved_before_ack(self):
        self._assert_existing_credentials_preserved(
            b'secret_key_id = approved-account\nmalformed private state\n'
        )

    def test_credential_change_before_atomic_replace_is_preserved(self):
        self._assert_existing_credentials_preserved(
            b'secret_key_id = approved-account\nsecret_key = original-secret\n',
            raced_content=(
                b'secret_key_id = other-account\n'
                b'secret_key = raced-secret\n'
            ),
        )

    def test_credential_change_after_atomic_replace_blocks_ack(self):
        self._assert_existing_credentials_preserved(
            b'secret_key_id = approved-account\nsecret_key = original-secret\n',
            raced_content=(
                b'secret_key_id = other-account\n'
                b'secret_key = raced-secret\n'
            ),
            race_after_write=True,
        )

    def test_crash_after_credential_before_receipt_allows_fresh_setup(self):
        context = SETUP.SetupContext('stage', 'claude', 'global')
        setup_id = None

        def requester(url, payload):
            nonlocal setup_id
            if url.endswith('/setup'):
                response = self.start_response(payload)
                setup_id = payload['setup_id']
                return response
            return 200, {
                'setup_id': setup_id,
                'state': 'COMPLETING',
                'workspace_id': 'workspace-1',
                'view_id': 'view-1',
                'credentials': {
                    'secret_key_id': 'external_account',
                    'secret_key': 'private-shared-secret',
                },
                'next': 'WRITE_CREDENTIALS_AND_ACK',
            }

        service = SETUP.SetupService(
            context,
            requester=requester,
            browser_open=lambda *_args, **_kwargs: False,
        )
        created = service.create_workspace({
            'workspace_name': 'Example',
            'client': 'claude',
            'scope': 'global',
        })
        failure = SETUP.SafeSetupError(
            'local_write_failed', 'Injected receipt failure.'
        )
        with mock.patch.object(
            SETUP, 'write_receipt', side_effect=failure
        ), self.assertRaises(SETUP.SafeSetupError):
            service.complete_setup({'setup_id': created['setup_id']})

        self.assertIsNotNone(SETUP.read_credentials('stage'))
        self.assertFalse(os.path.exists(context.receipt_path))
        service.close()
        replacement_requester = mock.Mock(
            side_effect=lambda _url, payload: self.start_response(payload)
        )
        replacement = SETUP.SetupService(
            SETUP.SetupContext('stage', 'cursor', 'global'),
            requester=replacement_requester,
            browser_open=lambda *_args, **_kwargs: False,
        )
        result = replacement.create_workspace({
            'workspace_name': 'Replacement',
            'client': 'cursor',
            'scope': 'global',
        })
        self.assertEqual(result['status'], 'pending_authorization')
        self.assertEqual(replacement_requester.call_count, 1)

    def test_crash_after_receipt_before_ack_recovers_with_exact_settings(self):
        context = SETUP.SetupContext('stage', 'claude', 'global')
        setup_id = None

        def requester(url, payload):
            nonlocal setup_id
            if url.endswith('/setup'):
                setup_id = payload['setup_id']
                return self.start_response(payload)
            if payload.get('credentials_written'):
                raise SETUP.SafeSetupError(
                    'service_unavailable', 'Injected lost ACK response.'
                )
            return 200, {
                'setup_id': setup_id,
                'state': 'COMPLETING',
                'workspace_id': 'workspace-1',
                'view_id': 'view-1',
                'credentials': {
                    'secret_key_id': 'external_account',
                    'secret_key': 'private-shared-secret',
                },
                'next': 'WRITE_CREDENTIALS_AND_ACK',
            }

        service = SETUP.SetupService(
            context,
            requester=requester,
            browser_open=lambda *_args, **_kwargs: False,
        )
        created = service.create_workspace({
            'workspace_name': 'Example',
            'client': 'claude',
            'scope': 'global',
            'token_audit': True,
            'work_claims': False,
        })
        with self.assertRaises(SETUP.SafeSetupError):
            service.complete_setup({'setup_id': created['setup_id']})

        self.assertIsNotNone(SETUP.read_credentials('stage'))
        self.assertIsNotNone(SETUP.load_receipt(context.receipt_path))
        service.close()
        installer = mock.Mock()
        restarted = SETUP.SetupService(
            context,
            requester=mock.Mock(return_value=(200, {
                'setup_id': setup_id,
                'state': 'CONSUMED',
                'workspace_id': 'workspace-1',
                'view_id': 'view-1',
                'settings': {
                    'token_audit': False,
                    'work_claims': False,
                },
            })),
            installer=installer,
        )
        result, is_error = restarted.complete_setup({'setup_id': setup_id})

        self.assertFalse(is_error)
        self.assertEqual(result['status'], 'completed')
        installer.assert_called_once_with(
            context,
            'workspace-1',
            'view-1',
            {
                'client': 'claude',
                'scope': 'global',
                'token_audit': False,
                'work_claims': False,
            },
        )
        self.assertFalse(os.path.exists(context.receipt_path))

    def test_pending_completion_is_one_bounded_check(self):
        completion_calls = []

        def requester(url, payload):
            if url.endswith('/setup'):
                return self.start_response(payload)
            completion_calls.append((url, payload))
            return 202, {
                'setup_id': created['setup_id'],
                'state': 'PENDING',
                'retry_after_seconds': 2,
                'expires_at': '2026-08-23T20:15:00Z',
            }

        service = SETUP.SetupService(
            SETUP.SetupContext('stage', 'cursor', 'global'),
            requester=requester,
            browser_open=lambda *_args, **_kwargs: False,
        )
        created = service.create_workspace({
            'workspace_name': 'Example',
            'client': 'cursor',
            'scope': 'global',
        })
        result, is_error = service.complete_setup({
            'setup_id': created['setup_id']
        })

        self.assertFalse(is_error)
        self.assertEqual(result['status'], 'pending_authorization')
        self.assertEqual(len(completion_calls), 1)

    def test_local_expiry_applies_only_before_credentials_are_written(self):
        context = SETUP.SetupContext('stage', 'cursor', 'global')
        now = [1000]

        def start_only(_url, payload):
            return self.start_response(payload)

        before_credentials = SETUP.SetupService(
            context,
            requester=start_only,
            browser_open=lambda *_args, **_kwargs: False,
            now=lambda: now[0],
        )
        created = before_credentials.create_workspace({
            'workspace_name': 'Example',
            'client': 'cursor',
            'scope': 'global',
        })
        now[0] += SETUP.SETUP_LIFETIME_SECONDS + 1
        result, is_error = before_credentials.complete_setup({
            'setup_id': created['setup_id']
        })

        self.assertTrue(is_error)
        self.assertEqual(result['status'], 'expired')

        requester = mock.Mock(return_value=(202, {
            'setup_id': 'setup-after-credential',
            'state': 'COMPLETING',
            'retry_after_seconds': 2,
        }))
        after_credentials = SETUP.SetupService(
            context, requester=requester, now=lambda: now[0]
        )
        after_credentials.enrollment = {
            'setup_id': 'setup-after-credential',
            'verifier': 'memory-only-verifier',
            'proposal': {'client': 'cursor', 'scope': 'global'},
            'expires_at_epoch': now[0] - 1,
            'credentials_written': True,
            'workspace_id': 'workspace-1',
            'view_id': 'view-1',
        }

        result, is_error = after_credentials.complete_setup({
            'setup_id': 'setup-after-credential'
        })

        self.assertFalse(is_error)
        self.assertEqual(result['status'], 'provisioning')
        self.assertEqual(
            requester.call_args.args[1],
            {
                'verifier': 'memory-only-verifier',
                'credentials_written': True,
            },
        )

    def test_process_restart_abandons_memory_only_verifier(self):
        def requester(url, payload):
            self.assertTrue(url.endswith('/setup'))
            return self.start_response(payload)

        context = SETUP.SetupContext('stage', 'codex', 'global')
        first_process = SETUP.SetupService(
            context,
            requester=requester,
            browser_open=lambda *_args, **_kwargs: False,
        )
        created = first_process.create_workspace({
            'workspace_name': 'Example',
            'client': 'codex',
            'scope': 'global',
        })
        verifier = first_process.enrollment['verifier']

        restarted = SETUP.SetupService(context, requester=mock.Mock())
        result, is_error = restarted.complete_setup({
            'setup_id': created['setup_id']
        })

        self.assertTrue(is_error)
        self.assertEqual(result['status'], 'authorization_process_lost')
        restarted.requester.assert_not_called()
        for root, _directories, filenames in os.walk(self.temp_dir.name):
            for filename in filenames:
                with open(os.path.join(root, filename), encoding='utf-8') as source:
                    self.assertNotIn(verifier, source.read())

    def test_consumed_without_local_receipt_releases_live_enrollment(self):
        context = SETUP.SetupContext('stage', 'codex', 'global')
        responses = []

        def requester(url, payload):
            if url.endswith('/setup'):
                responses.append(payload['setup_id'])
                return self.start_response(payload)
            return 200, {
                'setup_id': responses[-1],
                'state': 'CONSUMED',
                'workspace_id': 'workspace-1',
                'view_id': 'view-1',
            }

        service = SETUP.SetupService(
            context,
            requester=requester,
            browser_open=lambda *_args, **_kwargs: False,
        )
        created = service.create_workspace({
            'workspace_name': 'First attempt',
            'client': 'codex',
            'scope': 'global',
        })

        result, is_error = service.complete_setup({
            'setup_id': created['setup_id']
        })

        self.assertTrue(is_error)
        self.assertEqual(result['status'], 'authorization_process_lost')
        self.assertIsNone(service.enrollment)

        replacement = service.create_workspace({
            'workspace_name': 'Replacement',
            'client': 'codex',
            'scope': 'global',
        })
        self.assertEqual(replacement['status'], 'pending_authorization')
        self.assertNotEqual(replacement['setup_id'], created['setup_id'])

    def test_create_does_not_overwrite_retained_recovery_receipt(self):
        context = SETUP.SetupContext('stage', 'codex', 'global')
        SETUP.write_receipt(
            context.receipt_path,
            'retained-setup',
            'workspace-1',
            'view-1',
        )
        requester = mock.Mock()
        service = SETUP.SetupService(context, requester=requester)

        result = service.create_workspace({
            'workspace_name': 'Replacement',
            'client': 'codex',
            'scope': 'global',
        })

        self.assertEqual(result['status'], 'recovery_pending')
        self.assertEqual(result['setup_id'], 'retained-setup')
        self.assertIn('complete_setup', result['next'])
        requester.assert_not_called()
        self.assertEqual(
            SETUP.load_receipt(context.receipt_path),
            {
                'setup_id': 'retained-setup',
                'workspace_id': 'workspace-1',
                'view_id': 'view-1',
            },
        )

    def test_nonsecret_receipt_recovers_post_create_activation(self):
        context = SETUP.SetupContext('stage', 'cursor', 'global')
        SETUP.write_receipt(
            context.receipt_path, 'setup-1', 'workspace-1', 'view-1'
        )
        SETUP.write_credentials('stage', {
            'secret_key_id': 'external_account',
            'secret_key': 'private-shared-secret',
        })
        with open(context.receipt_path, encoding='utf-8') as source:
            self.assertEqual(
                set(json.load(source)),
                {'setup_id', 'workspace_id', 'view_id'},
            )
        installer = mock.Mock()

        def requester(url, payload):
            self.assertEqual(
                url,
                'https://sso.stage.api.uclusion.com/v1/setup/setup-1/recover',
            )
            self.assertEqual(payload, {
                'workspace_id': 'workspace-1',
                'view_id': 'view-1',
                'secret_key_id': 'external_account',
                'secret_key': 'private-shared-secret',
            })
            return 200, {
                'setup_id': 'setup-1',
                'state': 'CONSUMED',
                'workspace_id': 'workspace-1',
                'view_id': 'view-1',
                'settings': {
                    'token_audit': False,
                    'work_claims': False,
                },
            }

        restarted = SETUP.SetupService(
            context, requester=requester, installer=installer
        )
        result, is_error = restarted.complete_setup({'setup_id': 'setup-1'})

        self.assertFalse(is_error)
        self.assertEqual(result['status'], 'completed')
        self.assertNotIn('private', json.dumps(result))
        installer.assert_called_once_with(
            context,
            'workspace-1',
            'view-1',
            {
                'client': 'cursor',
                'scope': 'global',
                'token_audit': False,
                'work_claims': False,
            },
        )
        self.assertFalse(os.path.exists(context.receipt_path))

    def test_cursor_recovery_rejects_unsupported_token_audit(self):
        context = SETUP.SetupContext('stage', 'cursor', 'global')
        SETUP.write_receipt(
            context.receipt_path, 'setup-1', 'workspace-1', 'view-1'
        )
        SETUP.write_credentials('stage', {
            'secret_key_id': 'external_account',
            'secret_key': 'private-shared-secret',
        })
        installer = mock.Mock()
        service = SETUP.SetupService(
            context,
            requester=mock.Mock(return_value=(200, {
                'setup_id': 'setup-1',
                'state': 'CONSUMED',
                'workspace_id': 'workspace-1',
                'view_id': 'view-1',
                'settings': {
                    'token_audit': True,
                    'work_claims': False,
                },
            })),
            installer=installer,
        )

        with self.assertRaises(SETUP.SafeSetupError):
            service.complete_setup({'setup_id': 'setup-1'})

        installer.assert_not_called()
        self.assertTrue(os.path.exists(context.receipt_path))

    def test_recovery_404_retains_receipt_during_and_after_grace(self):
        for age, expected_status, expected_error in (
            (SETUP.RECOVERY_GRACE_SECONDS - 1, 'recovery_pending', False),
            (SETUP.RECOVERY_GRACE_SECONDS + 1, 'recovery_unavailable', True),
        ):
            with self.subTest(age=age):
                context = SETUP.SetupContext('stage', 'cursor', 'global')
                SETUP.write_receipt(
                    context.receipt_path, 'setup-1', 'workspace-1', 'view-1'
                )
                SETUP.write_credentials('stage', {
                    'secret_key_id': 'external_account',
                    'secret_key': 'private-shared-secret',
                })
                now = 5000
                os.utime(context.receipt_path, (now - age, now - age))
                service = SETUP.SetupService(
                    context,
                    requester=mock.Mock(return_value=(404, {
                        'error_code': 'SETUP_UNAVAILABLE',
                        'error_message': 'Setup authorization is unavailable.',
                    })),
                    now=lambda: now,
                )

                result, is_error = service.complete_setup({
                    'setup_id': 'setup-1'
                })

                self.assertEqual(is_error, expected_error)
                self.assertEqual(result['status'], expected_status)
                self.assertTrue(os.path.exists(context.receipt_path))

    def test_consumed_ids_only_never_trigger_credential_persistence(self):
        context = SETUP.SetupContext('stage', 'claude', 'global')
        SETUP.write_receipt(
            context.receipt_path, 'setup-1', 'workspace-1', 'view-1'
        )
        SETUP.write_credentials('stage', {
            'secret_key_id': 'external_account',
            'secret_key': 'private-shared-secret',
        })
        requests = []

        def requester(url, payload):
            requests.append((url, dict(payload)))
            return 200, {
                'setup_id': 'setup-1',
                'state': 'CONSUMED',
                'workspace_id': 'workspace-1',
                'view_id': 'view-1',
                'settings': {
                    'token_audit': True,
                    'work_claims': True,
                },
            }

        installer = mock.Mock()
        service = SETUP.SetupService(
            context, requester=requester, installer=installer
        )
        service.enrollment = {
            'setup_id': 'setup-1',
            'verifier': 'memory-only-verifier',
            'proposal': {
                'client': 'claude',
                'scope': 'global',
                'token_audit': True,
                'work_claims': True,
            },
            'expires_at_epoch': 10 ** 12,
            'credentials_written': False,
        }

        with mock.patch.object(SETUP, 'write_credentials') as persist:
            result, is_error = service.complete_setup({'setup_id': 'setup-1'})

        self.assertFalse(is_error)
        self.assertEqual(result['status'], 'completed')
        persist.assert_not_called()
        self.assertEqual(len(requests), 2)
        self.assertTrue(requests[0][0].endswith('/setup-1/complete'))
        self.assertTrue(requests[1][0].endswith('/setup-1/recover'))
        installer.assert_called_once_with(
            context,
            'workspace-1',
            'view-1',
            {
                'client': 'claude',
                'scope': 'global',
                'token_audit': True,
                'work_claims': True,
            },
        )

    def test_postcredential_unavailable_retains_proof_and_receipt(self):
        context = SETUP.SetupContext('stage', 'claude', 'global')
        SETUP.write_receipt(
            context.receipt_path, 'setup-1', 'workspace-1', 'view-1'
        )
        service = SETUP.SetupService(
            context,
            requester=mock.Mock(return_value=(404, {
                'error_code': 'SETUP_UNAVAILABLE',
                'error_message': 'Setup authorization is unavailable.',
            })),
        )
        enrollment = {
            'verifier': 'memory-only-verifier',
            'proposal': {'client': 'claude', 'scope': 'global'},
            'expires_at_epoch': 0,
            'credentials_written': True,
            'workspace_id': 'workspace-1',
            'view_id': 'view-1',
        }
        service.enrollment = {'setup_id': 'setup-1', **enrollment}

        result, is_error = service.complete_setup({'setup_id': 'setup-1'})

        self.assertFalse(is_error)
        self.assertEqual(result['status'], 'recovery_pending')
        self.assertNotIn('create_workspace', result['next'])
        self.assertEqual(service.enrollment, {'setup_id': 'setup-1', **enrollment})
        self.assertTrue(os.path.exists(context.receipt_path))

    def test_cleanup_failure_completes_and_runtime_start_removes_receipt(self):
        context = SETUP.SetupContext('stage', 'claude', 'global')
        SETUP.write_receipt(
            context.receipt_path, 'setup-1', 'workspace-1', 'view-1'
        )
        descriptor = None
        runtime_script = '/installed/uclusionMCPProxy.py'

        def installer(_context, workspace_id, view_id, _proposal):
            nonlocal descriptor
            descriptor = INSTALL.runtime_mcp_descriptor(
                workspace_id,
                'stage',
                setup_receipt_path=context.receipt_path,
                setup_view_id=view_id,
            )

        service = SETUP.SetupService(
            context,
            requester=mock.Mock(return_value=(200, {
                'setup_id': 'setup-1',
                'state': 'CONSUMED',
                'workspace_id': 'workspace-1',
                'view_id': 'view-1',
            })),
            installer=installer,
        )
        enrollment = {
            'verifier': 'memory-only-verifier',
            'proposal': {'client': 'claude', 'scope': 'global'},
            'expires_at_epoch': 0,
            'credentials_written': True,
            'workspace_id': 'workspace-1',
            'view_id': 'view-1',
        }
        service.enrollment = {'setup_id': 'setup-1', **enrollment}

        with mock.patch.multiple(
            INSTALL,
            UCLUSION_HOME=self.uclusion_home,
            MCP_PROXY_SYMLINK_PATH=runtime_script,
        ), mock.patch.object(
            SETUP.os, 'remove', side_effect=PermissionError
        ):
            result, is_error = service.complete_setup({'setup_id': 'setup-1'})

        self.assertFalse(is_error)
        self.assertEqual(result['status'], 'completed_cleanup_pending')
        self.assertIn('normal Uclusion MCP starts', result['next'])
        self.assertIsNone(service.enrollment)
        self.assertTrue(os.path.exists(context.receipt_path))

        with mock.patch.multiple(
            INSTALL,
            UCLUSION_HOME=self.uclusion_home,
            MCP_PROXY_SYMLINK_PATH=runtime_script,
        ), mock.patch.object(INSTALL.os, 'execv') as execute:
            argv = descriptor['args']
            with mock.patch.object(INSTALL.sys, 'argv', argv):
                self.assertEqual(INSTALL.main(), 0)

        self.assertFalse(os.path.exists(context.receipt_path))
        execute.assert_called_once_with(
            INSTALL.sys.executable,
            [
                INSTALL.sys.executable,
                runtime_script,
                'workspace-1',
                'stage',
            ],
        )

    def test_unfiltered_exception_never_enters_jsonrpc_result(self):
        raw_secret = 'exception-contained-secret'

        def requester(_url, _payload):
            raise RuntimeError(raw_secret)

        service = SETUP.SetupService(
            SETUP.SetupContext('stage', 'claude', 'global'),
            requester=requester,
        )
        request = {
            'jsonrpc': '2.0',
            'id': 1,
            'method': 'tools/call',
            'params': {
                'name': 'create_workspace',
                'arguments': {
                    'workspace_name': 'Example',
                    'client': 'claude',
                    'scope': 'global',
                },
            },
        }
        output = io.StringIO()
        with mock.patch.object(
            SETUP.sys, 'stdin', io.StringIO(json.dumps(request) + '\n')
        ), mock.patch.object(SETUP.sys, 'stdout', output):
            SETUP.serve(service)

        response = output.getvalue()
        self.assertNotIn(raw_secret, response)
        self.assertEqual(
            json.loads(response)['result']['isError'], True
        )

    def test_each_protocol_request_emits_exactly_one_response(self):
        requests = '\n'.join((
            json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': 'ping'}),
            json.dumps({'jsonrpc': '2.0', 'id': 2, 'method': 'tools/list'}),
        )) + '\n'
        output = io.StringIO()
        service = SETUP.SetupService(
            SETUP.SetupContext('stage', 'claude', 'global')
        )
        with mock.patch.object(
            SETUP.sys, 'stdin', io.StringIO(requests)
        ), mock.patch.object(SETUP.sys, 'stdout', output):
            SETUP.serve(service)

        responses = [json.loads(line) for line in output.getvalue().splitlines()]
        self.assertEqual([response['id'] for response in responses], [1, 2])

    def test_runtime_installer_argv_contains_no_private_material(self):
        context = SETUP.SetupContext(
            'stage', 'codex', 'project', self.temp_dir.name
        )
        completed = subprocess.CompletedProcess([], 0)
        with mock.patch.object(
            SETUP, '_installed_installer_path', return_value='/bin/uclusion-install'
        ), mock.patch.object(
            SETUP.subprocess, 'run', return_value=completed
        ) as run:
            SETUP.run_runtime_installer(
                context,
                'workspace-1',
                'view-1',
                {
                    'client': 'codex',
                    'scope': 'project',
                    'token_audit': True,
                    'work_claims': False,
                },
            )

        command = run.call_args.args[0]
        serialized = json.dumps(command)
        self.assertNotIn('secret', serialized)
        self.assertNotIn('verifier', serialized)
        self.assertIn('--replace-setup', command)
        self.assertEqual(
            command[command.index('--setup-receipt') + 1],
            context.receipt_path,
        )
        self.assertIn('--project', command)
        self.assertIn('--token-audit', command)
        self.assertIn('--no-work-claims', command)
        self.assertEqual(run.call_args.kwargs['cwd'], self.temp_dir.name)
        self.assertIs(run.call_args.kwargs['stdout'], subprocess.DEVNULL)
        self.assertIs(run.call_args.kwargs['stderr'], subprocess.DEVNULL)


class SetupInstallerRegistrationTests(unittest.TestCase):
    def test_runtime_cleanup_retains_invalid_or_mismatched_receipts(self):
        cases = (
            b'{"setup_id":"setup-1","workspace_id":"other",'
            b'"view_id":"view-1"}\n',
            b'{"setup_id":"setup-1","workspace_id":"workspace-1",'
            b'"view_id":"other"}\n',
            b'{"setup_id":"setup-1","workspace_id":"workspace-1",'
            b'"view_id":"view-1","extra":"value"}\n',
            b'not json\n',
        )
        for original in cases:
            with self.subTest(original=original), \
                    tempfile.TemporaryDirectory() as temp_dir:
                uclusion_home = os.path.join(temp_dir, 'uclusion')
                runtime_script = os.path.join(temp_dir, 'proxy.py')
                with mock.patch.multiple(
                    INSTALL,
                    UCLUSION_HOME=uclusion_home,
                    MCP_PROXY_SYMLINK_PATH=runtime_script,
                ):
                    path = INSTALL._expected_setup_receipt_path(
                        'stage', 'claude'
                    )
                    os.makedirs(os.path.dirname(path))
                    with open(path, 'wb') as target:
                        target.write(original)
                    with mock.patch.object(INSTALL.os, 'execv') as execute:
                        INSTALL.launch_runtime_proxy([
                            'stage',
                            path,
                            'view-1',
                            runtime_script,
                            'workspace-1',
                            'stage',
                        ])

                with open(path, 'rb') as source:
                    self.assertEqual(source.read(), original)
                execute.assert_called_once()

    def test_cleanup_only_installer_mode_removes_receipt_without_proxy_exec(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            uclusion_home = os.path.join(temp_dir, 'uclusion')
            runtime_script = os.path.join(temp_dir, 'proxy.py')
            with mock.patch.multiple(
                INSTALL,
                UCLUSION_HOME=uclusion_home,
                MCP_PROXY_SYMLINK_PATH=runtime_script,
            ):
                path = INSTALL._expected_setup_receipt_path(
                    'stage', 'codex'
                )
                os.makedirs(os.path.dirname(path))
                with open(path, 'w', encoding='utf-8') as target:
                    json.dump({
                        'setup_id': 'setup-1',
                        'workspace_id': 'workspace-1',
                        'view_id': 'view-1',
                    }, target)
                argv = [
                    'uclusionInstall.py',
                    INSTALL.RUNTIME_CLEANUP_MODE,
                    'stage',
                    path,
                    'view-1',
                    runtime_script,
                    'workspace-1',
                    'stage',
                ]
                with mock.patch.object(
                    INSTALL.sys, 'argv', argv
                ), mock.patch.object(INSTALL.os, 'execv') as execute:
                    self.assertEqual(INSTALL.main(), 0)

            self.assertFalse(os.path.exists(path))
            execute.assert_not_called()

    def test_codex_setup_descriptor_supports_unicode_project_paths(self):
        project_dir = os.path.join(
            os.path.abspath(tempfile.gettempdir()), 'emoji-U0001f600-"quoted"'
        )
        descriptor = INSTALL.setup_mcp_descriptor(
            'stage', 'codex', project_dir
        )

        block = INSTALL.build_codex_mcp_block(descriptor=descriptor)
        INSTALL.validate_codex_config(block)
        parsed = tomllib.loads(block)

        self.assertEqual(
            parsed['mcp_servers']['Uclusion']['args'], descriptor['args']
        )

    def test_bootstrap_refuses_any_existing_descriptor_in_every_scope(self):
        for client in ('claude', 'cursor', 'codex'):
            for scope in ('global', 'project'):
                with self.subTest(client=client, scope=scope), \
                        tempfile.TemporaryDirectory() as temp_dir:
                    project_dir = os.path.join(temp_dir, 'project')
                    os.makedirs(project_dir)
                    global_dir = os.path.join(temp_dir, 'global')
                    os.makedirs(global_dir)
                    paths = {
                        'CLAUDE_JSON_PATH': os.path.join(global_dir, 'claude.json'),
                        'CURSOR_MCP_PATH': os.path.join(global_dir, 'cursor.json'),
                        'CODEX_CONFIG_PATH': os.path.join(global_dir, 'config.toml'),
                        'SCRIPT_INSTALL_PREFIX': os.path.join(temp_dir, 'locks'),
                    }
                    target_project = project_dir if scope == 'project' else None
                    with mock.patch.multiple(INSTALL, **paths):
                        INSTALL.install_setup_registration(
                            'stage', client, target_project
                        )
                        selected = self._selected_path(
                            client,
                            scope,
                            project_dir,
                            paths['CLAUDE_JSON_PATH'],
                            paths['CURSOR_MCP_PATH'],
                            paths['CODEX_CONFIG_PATH'],
                        )
                        with open(selected, 'rb') as source:
                            original = source.read()
                        with self.assertRaisesRegex(
                            RuntimeError, 'already defines'
                        ):
                            INSTALL.install_setup_registration(
                                'stage', client, target_project
                            )
                        with open(selected, 'rb') as source:
                            self.assertEqual(source.read(), original)

    def test_runtime_replacement_requires_exact_setup_descriptor(self):
        for client in ('claude', 'cursor', 'codex'):
            for scope in ('global', 'project'):
                for state in ('changed', 'missing'):
                    with self.subTest(
                        client=client, scope=scope, state=state
                    ), tempfile.TemporaryDirectory() as temp_dir:
                        project_dir = os.path.join(temp_dir, 'project')
                        os.makedirs(project_dir)
                        global_dir = os.path.join(temp_dir, 'global')
                        os.makedirs(global_dir)
                        paths = {
                            'CLAUDE_JSON_PATH': os.path.join(global_dir, 'claude.json'),
                            'CURSOR_MCP_PATH': os.path.join(global_dir, 'cursor.json'),
                            'CODEX_CONFIG_PATH': os.path.join(global_dir, 'config.toml'),
                            'SCRIPT_INSTALL_PREFIX': os.path.join(temp_dir, 'locks'),
                        }
                        target_project = project_dir if scope == 'project' else None
                        with mock.patch.multiple(INSTALL, **paths):
                            INSTALL.install_setup_registration(
                                'stage', client, target_project
                            )
                            selected = self._selected_path(
                                client,
                                scope,
                                project_dir,
                                paths['CLAUDE_JSON_PATH'],
                                paths['CURSOR_MCP_PATH'],
                                paths['CODEX_CONFIG_PATH'],
                            )
                            if client == 'codex':
                                with open(selected, encoding='utf-8') as source:
                                    changed = source.read()
                                if state == 'changed':
                                    changed = changed.replace(
                                        INSTALL.SETUP_MCP_SYMLINK_PATH,
                                        '/changed/setup.py',
                                        1,
                                    )
                                else:
                                    changed, _removed = INSTALL.remove_owned_block(
                                        changed,
                                        INSTALL.CODEX_CONFIG_MARKER,
                                        INSTALL.CODEX_CONFIG_END_MARKER,
                                        'MCP',
                                    )
                                with open(selected, 'w', encoding='utf-8') as target:
                                    target.write(changed)
                            else:
                                with open(selected, encoding='utf-8') as source:
                                    changed = json.load(source)
                                if state == 'changed':
                                    changed['mcpServers']['Uclusion']['command'] = 'changed'
                                else:
                                    changed['mcpServers'].pop('Uclusion')
                                with open(selected, 'w', encoding='utf-8') as target:
                                    json.dump(changed, target, indent=2)
                                    target.write('\n')
                            with open(selected, 'rb') as source:
                                before = source.read()

                            with self.assertRaisesRegex(
                                RuntimeError, 'changed or is missing'
                            ):
                                INSTALL.replace_setup_registration(
                                    'stage',
                                    client,
                                    'workspace-1',
                                    project_dir=target_project,
                                    view_id='view-1',
                                    setup_receipt_path=(
                                        INSTALL._expected_setup_receipt_path(
                                            'stage', client, target_project
                                        )
                                    ),
                                )

                            with open(selected, 'rb') as source:
                                self.assertEqual(source.read(), before)

    def test_replace_setup_preflight_runs_before_every_mutation(self):
        for client in ('claude', 'cursor', 'codex'):
            for scope in ('global', 'project'):
                with self.subTest(client=client, scope=scope), \
                        tempfile.TemporaryDirectory() as temp_dir:
                    project_dir = os.path.join(temp_dir, 'project')
                    os.makedirs(project_dir)
                    global_dir = os.path.join(temp_dir, 'global')
                    os.makedirs(global_dir)
                    paths = {
                        'UCLUSION_HOME': os.path.join(temp_dir, 'uclusion'),
                        'CLAUDE_JSON_PATH': os.path.join(global_dir, 'claude.json'),
                        'CURSOR_MCP_PATH': os.path.join(global_dir, 'cursor.json'),
                        'CODEX_CONFIG_PATH': os.path.join(global_dir, 'config.toml'),
                        'SCRIPT_INSTALL_PREFIX': os.path.join(temp_dir, 'locks'),
                    }
                    target_project = project_dir if scope == 'project' else None
                    with mock.patch.multiple(INSTALL, **paths):
                        INSTALL.install_setup_registration(
                            'stage', client, target_project
                        )
                        selected = self._selected_path(
                            client,
                            scope,
                            project_dir,
                            paths['CLAUDE_JSON_PATH'],
                            paths['CURSOR_MCP_PATH'],
                            paths['CODEX_CONFIG_PATH'],
                        )
                        if client == 'codex':
                            with open(selected, encoding='utf-8') as source:
                                changed = source.read().replace(
                                    INSTALL.SETUP_MCP_SYMLINK_PATH,
                                    '/changed/setup.py',
                                    1,
                                )
                            with open(selected, 'w', encoding='utf-8') as target:
                                target.write(changed)
                        else:
                            with open(selected, encoding='utf-8') as source:
                                changed = json.load(source)
                            changed['mcpServers']['Uclusion']['command'] = 'changed'
                            with open(selected, 'w', encoding='utf-8') as target:
                                json.dump(changed, target)
                        argv = [
                            'uclusionInstall',
                            'stage',
                            'workspace-1',
                            'view-1',
                            '--clients',
                            client,
                            '--replace-setup',
                            '--setup-receipt',
                            INSTALL._expected_setup_receipt_path(
                                'stage', client, target_project
                            ),
                        ]
                        if scope == 'project':
                            argv.append('--project')
                        with mock.patch.object(
                            INSTALL.sys, 'argv', argv
                        ), mock.patch.object(
                            INSTALL.os, 'getcwd', return_value=project_dir
                        ), mock.patch.object(
                            INSTALL, 'make_workflow_bundle_fetcher'
                        ) as fetcher, mock.patch.object(
                            INSTALL, 'fetch_script_reinstall_version'
                        ) as fetch_version, mock.patch.object(
                            INSTALL, 'install_scripts'
                        ) as install_scripts, mock.patch.object(
                            INSTALL, 'write_uclusion_config'
                        ) as write_config:
                            result = INSTALL.main()

                        self.assertEqual(result, 1)
                        fetcher.assert_not_called()
                        fetch_version.assert_not_called()
                        install_scripts.assert_not_called()
                        write_config.assert_not_called()

    def test_codex_exact_replacement_rejects_duplicate_without_tomllib(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = os.path.join(temp_dir, 'config.toml')
            expected = INSTALL.setup_mcp_descriptor('stage', 'codex')
            duplicate = (
                INSTALL.build_codex_mcp_block(descriptor=expected)
                + '\n[mcp_servers.Uclusion]\ncommand = "other"\nargs = []\n'
            )
            with open(config_path, 'w', encoding='utf-8') as target:
                target.write(duplicate)
            with mock.patch.multiple(
                INSTALL,
                CODEX_CONFIG_PATH=config_path,
                tomllib=None,
            ), self.assertRaisesRegex(RuntimeError, 'additional'):
                INSTALL.assert_setup_registration('stage', 'codex')

    def test_full_nonclaude_replacement_preserves_claude_settings(self):
        for client in ('cursor', 'codex'):
            for scope in ('global', 'project'):
                with self.subTest(client=client, scope=scope), \
                        tempfile.TemporaryDirectory() as temp_dir:
                    project_dir = os.path.join(temp_dir, 'project')
                    global_dir = os.path.join(temp_dir, 'global')
                    uclusion_home = os.path.join(temp_dir, 'uclusion')
                    os.makedirs(project_dir)
                    os.makedirs(global_dir)
                    global_claude_settings = os.path.join(
                        global_dir, 'claude-settings.json'
                    )
                    project_claude_settings = os.path.join(
                        project_dir, '.claude', 'settings.local.json'
                    )
                    claude_settings = (
                        project_claude_settings
                        if scope == 'project' else global_claude_settings
                    )
                    os.makedirs(os.path.dirname(claude_settings), exist_ok=True)
                    original = (
                        b'{"env":{"USER_POLICY":"keep"},'
                        b'"disableAllHooks":true,"custom":"unchanged"}\n'
                    )
                    with open(claude_settings, 'wb') as target:
                        target.write(original)
                    paths = {
                        'UCLUSION_HOME': uclusion_home,
                        'CLAUDE_SETTINGS_PATH': global_claude_settings,
                        'CLAUDE_JSON_PATH': os.path.join(global_dir, 'claude.json'),
                        'CURSOR_MCP_PATH': os.path.join(global_dir, 'cursor.json'),
                        'CURSOR_HOOKS_PATH': os.path.join(global_dir, 'hooks.json'),
                        'CODEX_HOME': os.path.join(global_dir, '.codex'),
                        'CODEX_CONFIG_PATH': os.path.join(global_dir, 'config.toml'),
                        'SCRIPT_INSTALL_PREFIX': os.path.join(temp_dir, 'locks'),
                    }
                    target_project = project_dir if scope == 'project' else None
                    with mock.patch.multiple(INSTALL, **paths), mock.patch.object(
                        INSTALL, 'install_skill_and_stub', return_value=True
                    ), mock.patch.object(
                        INSTALL,
                        'configure_claude_token_audit',
                        wraps=INSTALL.configure_claude_token_audit,
                    ) as configure_claude:
                        INSTALL.install_setup_registration(
                            'stage', client, target_project
                        )
                        if scope == 'global':
                            INSTALL.install_global(
                                'workspace-1',
                                'view-1',
                                'stage',
                                mock.Mock(),
                                clients={client},
                                token_audit_enabled=False,
                                work_claims_enabled=False,
                                replace_setup=True,
                                setup_receipt_path=(
                                    INSTALL._expected_setup_receipt_path(
                                        'stage', client
                                    )
                                ),
                            )
                        else:
                            INSTALL.install_project_level(
                                'workspace-1',
                                'view-1',
                                'stage',
                                mock.Mock(),
                                project_dir,
                                clients={client},
                                token_audit_enabled=False,
                                work_claims_enabled=False,
                                replace_setup=True,
                                setup_receipt_path=(
                                    INSTALL._expected_setup_receipt_path(
                                        'stage', client, project_dir
                                    )
                                ),
                            )

                    configure_claude.assert_not_called()
                    with open(claude_settings, 'rb') as source:
                        self.assertEqual(source.read(), original)

    def test_atomic_workspace_config_failure_preserves_retryable_json(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = os.path.join(temp_dir, 'uclusion_stage.json')
            original = {'workspaceId': 'old', 'custom': {'keep': True}}
            with open(config_path, 'w', encoding='utf-8') as target:
                json.dump(original, target)
                target.write('\n')

            with mock.patch.object(
                INSTALL.os, 'replace', side_effect=OSError('injected crash')
            ), self.assertRaises(OSError):
                INSTALL.write_uclusion_config(
                    'workspace-1',
                    'view-1',
                    config_path,
                    token_audit_enabled=False,
                    work_claims_enabled=False,
                )

            with open(config_path, encoding='utf-8') as source:
                self.assertEqual(json.load(source), original)
            INSTALL.write_uclusion_config(
                'workspace-1',
                'view-1',
                config_path,
                token_audit_enabled=False,
                work_claims_enabled=False,
            )
            with open(config_path, encoding='utf-8') as source:
                recovered = json.load(source)
            self.assertEqual(recovered['workspaceId'], 'workspace-1')
            self.assertEqual(recovered['todoViewId'], 'view-1')
            self.assertEqual(recovered['custom'], {'keep': True})

    def test_codex_setup_and_runtime_conflicts_fail_closed_in_each_scope(self):
        original = (
            '[mcp_servers.Uclusion]\n'
            'command = "custom"\n'
            'args = []\n'
        )
        for scope in ('global', 'project'):
            for phase in ('setup', 'runtime'):
                with self.subTest(scope=scope, phase=phase), \
                        tempfile.TemporaryDirectory() as temp_dir:
                    project_dir = (
                        os.path.join(temp_dir, 'project')
                        if scope == 'project' else None
                    )
                    config_path = (
                        os.path.join(project_dir, '.codex', 'config.toml')
                        if project_dir is not None
                        else os.path.join(temp_dir, 'global-config.toml')
                    )
                    os.makedirs(os.path.dirname(config_path), exist_ok=True)
                    with open(config_path, 'w', encoding='utf-8') as target:
                        target.write(original)

                    with mock.patch.object(
                        INSTALL, 'CODEX_CONFIG_PATH', config_path
                    ), self.assertRaisesRegex(
                        RuntimeError, 'already defines|unmanaged'
                    ):
                        if phase == 'setup':
                            INSTALL.install_setup_registration(
                                'stage', 'codex', project_dir
                            )
                        else:
                            INSTALL.register_codex_descriptor(
                                INSTALL.runtime_mcp_descriptor(
                                    'workspace-1', 'stage'
                                ),
                                config_path=config_path,
                            )

                    with open(config_path, encoding='utf-8') as source:
                        self.assertEqual(source.read(), original)

    def test_setup_main_is_credential_free_and_targets_one_project_client(self):
        with tempfile.TemporaryDirectory() as project_dir, mock.patch.object(
            INSTALL.sys,
            'argv',
            [
                'uclusionInstall',
                'stage',
                'setup',
                '--clients',
                'codex',
                '--project',
            ],
        ), mock.patch.object(
            INSTALL.os, 'getcwd', return_value=project_dir
        ), mock.patch.object(
            INSTALL, 'install_scripts'
        ) as install_scripts, mock.patch.object(
            INSTALL, 'install_setup_registration'
        ) as register, mock.patch.object(
            INSTALL, 'fetch_script_reinstall_version'
        ) as fetch_version, mock.patch.object(
            INSTALL, 'make_workflow_bundle_fetcher'
        ) as fetch_workflow:
            result = INSTALL.main()

        self.assertEqual(result, 0)
        install_scripts.assert_called_once_with(
            'stage', None, setup_bootstrap=True
        )
        register.assert_called_once_with('stage', 'codex', project_dir)
        fetch_version.assert_not_called()
        fetch_workflow.assert_not_called()

    def test_setup_main_does_not_register_a_mixed_script_release(self):
        with mock.patch.object(
            INSTALL.sys,
            'argv',
            [
                'uclusionInstall',
                'stage',
                'setup',
                '--clients',
                'codex',
            ],
        ), mock.patch.object(
            INSTALL, 'assert_setup_registration_absent'
        ), mock.patch.object(
            INSTALL,
            'install_scripts',
            side_effect=RuntimeError('script digest mismatch'),
        ) as install_scripts, mock.patch.object(
            INSTALL, 'install_setup_registration'
        ) as register:
            result = INSTALL.main()

        self.assertEqual(result, 1)
        install_scripts.assert_called_once_with(
            'stage', None, setup_bootstrap=True
        )
        register.assert_not_called()

    def test_setup_scripts_are_in_every_immutable_release(self):
        self.assertIn(
            ('uclusionInstall.py', 'uclusionInstall.py', 'uclusionInstall.py'),
            INSTALL.SCRIPT_FILES,
        )
        self.assertIn(
            ('uclusionSetupMCP.py', 'uclusionSetupMCP.py', 'uclusionSetupMCP.py'),
            INSTALL.SCRIPT_FILES,
        )

    def test_setup_and_runtime_registration_for_every_client_and_scope(self):
        for client in ('claude', 'cursor', 'codex'):
            for scope in ('global', 'project'):
                with self.subTest(client=client, scope=scope), \
                        tempfile.TemporaryDirectory() as temp_dir:
                    global_dir = os.path.join(temp_dir, 'global')
                    project_dir = os.path.join(temp_dir, 'project')
                    os.makedirs(global_dir)
                    os.makedirs(project_dir)
                    claude_path = os.path.join(global_dir, 'claude.json')
                    cursor_path = os.path.join(global_dir, 'cursor.json')
                    codex_path = os.path.join(global_dir, 'config.toml')
                    setup_script = os.path.join(temp_dir, 'bin', 'setup.py')
                    runtime_script = os.path.join(temp_dir, 'bin', 'proxy.py')
                    installer_script = os.path.join(
                        temp_dir, 'bin', 'installer.py'
                    )
                    uclusion_home = os.path.join(temp_dir, 'uclusion')
                    project_arg = project_dir if scope == 'project' else None
                    setup_receipt_path = None
                    with mock.patch.multiple(
                        INSTALL,
                        UCLUSION_HOME=uclusion_home,
                        CLAUDE_JSON_PATH=claude_path,
                        CURSOR_MCP_PATH=cursor_path,
                        CODEX_CONFIG_PATH=codex_path,
                        SETUP_MCP_SYMLINK_PATH=setup_script,
                        MCP_PROXY_SYMLINK_PATH=runtime_script,
                        INSTALLER_SYMLINK_PATH=installer_script,
                    ):
                        INSTALL.install_setup_registration(
                            'stage', client, project_arg
                        )
                        selected_path = self._selected_path(
                            client,
                            scope,
                            project_dir,
                            claude_path,
                            cursor_path,
                            codex_path,
                        )
                        setup_descriptor = self._read_descriptor(
                            client, selected_path
                        )
                        self.assertEqual(setup_descriptor['command'], 'python3')
                        self.assertEqual(setup_descriptor['args'][0], setup_script)
                        self.assertIn('--client', setup_descriptor['args'])
                        self.assertIn(client, setup_descriptor['args'])
                        self.assertIn(scope, setup_descriptor['args'])
                        self.assertNotIn('workspace-1', setup_descriptor['args'])

                        setup_receipt_path = (
                            INSTALL._expected_setup_receipt_path(
                                'stage', client, project_arg
                            )
                        )
                        INSTALL.replace_setup_registration(
                            'stage',
                            client,
                            'workspace-1',
                            project_dir=project_arg,
                            token_audit=None,
                            work_claims=False,
                            view_id='view-1',
                            setup_receipt_path=setup_receipt_path,
                        )
                        runtime_descriptor = self._read_descriptor(
                            client, selected_path
                        )

                    self.assertEqual(
                        runtime_descriptor['args'],
                        [
                            installer_script,
                            INSTALL.RUNTIME_PROXY_MODE,
                            'stage',
                            setup_receipt_path,
                            'view-1',
                            runtime_script,
                            'workspace-1',
                            'stage',
                        ],
                    )
                    self.assertNotIn(setup_script, runtime_descriptor['args'])
                    self.assertEqual(
                        stat.S_IMODE(os.stat(selected_path).st_mode), 0o600
                    )

    @staticmethod
    def _selected_path(
        client, scope, project_dir, claude_path, cursor_path, codex_path
    ):
        if scope == 'global':
            return {
                'claude': claude_path,
                'cursor': cursor_path,
                'codex': codex_path,
            }[client]
        return {
            'claude': os.path.join(project_dir, '.mcp.json'),
            'cursor': os.path.join(project_dir, '.cursor', 'mcp.json'),
            'codex': os.path.join(project_dir, '.codex', 'config.toml'),
        }[client]

    @staticmethod
    def _read_descriptor(client, path):
        if client == 'codex':
            with open(path, 'rb') as source:
                return tomllib.load(source)['mcp_servers']['Uclusion']
        with open(path, encoding='utf-8') as source:
            return json.load(source)['mcpServers']['Uclusion']


if __name__ == '__main__':
    unittest.main()
