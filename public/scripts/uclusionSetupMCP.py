#!/usr/bin/python3
"""Credential-free, temporary MCP server for agent-led Uclusion setup.

The authorization verifier deliberately lives only in ``SetupService`` memory.
Tool results are assembled from small allowlists and never serialize backend
responses, credentials, verifier material, exception text, or subprocess output.
"""

import argparse
import base64
import errno
import hashlib
import json
import os
import re
import secrets
import stat
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
import webbrowser

try:
    import fcntl
except ImportError:  # Native Windows does not provide POSIX flock.
    fcntl = None

try:
    import msvcrt
except ImportError:  # POSIX platforms do not provide Windows file locking.
    msvcrt = None


SUPPORTED_CLIENTS = ('claude', 'cursor', 'codex')
SUPPORTED_SCOPES = ('global', 'project')
CREDENTIAL_FILES = {
    'dev': 'dev_credentials',
    'stage': 'stage_credentials',
    'production': 'credentials',
}
SETUP_LIFETIME_SECONDS = 15 * 60
RECOVERY_GRACE_SECONDS = 60
HTTP_TIMEOUT_SECONDS = 10
INSTALL_TIMEOUT_SECONDS = 35
MAX_RESPONSE_BYTES = 64 * 1024
MCP_PROTOCOL_VERSION = '2024-11-05'
UCLUSION_HOME = os.path.join(os.path.expanduser('~'), '.uclusion')
RECEIPT_DIR = os.path.join(UCLUSION_HOME, 'setup-receipts')
_UNCHECKED_PRIVATE_CONTENT = object()


class SafeSetupError(Exception):
    """An internal failure with a fixed, model-safe public message."""

    def __init__(self, status, message):
        super().__init__(status)
        self.status = status
        self.public_message = message


class _NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    """Never forward setup POST bodies to a redirect target."""

    def redirect_request(self, _request, _file_pointer, _code, _message,
                         _headers, _new_url):
        return None


_NO_REDIRECT_OPENER = urllib.request.build_opener(_NoRedirectHandler())


def api_base_url(environment):
    return f'https://sso.{environment}.api.uclusion.com/v1'


def credential_path(environment):
    return os.path.join(UCLUSION_HOME, CREDENTIAL_FILES[environment])


def _read_response(response):
    body = response.read(MAX_RESPONSE_BYTES + 1)
    if len(body) > MAX_RESPONSE_BYTES:
        raise SafeSetupError(
            'service_unavailable',
            'Uclusion setup returned an invalid response. Retry shortly.',
        )
    if not body.strip():
        return {}
    try:
        parsed = json.loads(body.decode('utf-8'))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise SafeSetupError(
            'service_unavailable',
            'Uclusion setup returned an invalid response. Retry shortly.',
        ) from error
    return parsed if isinstance(parsed, dict) else {}


def post_json(url, payload):
    """POST JSON and return ``(status, object)`` without logging response data."""
    request = urllib.request.Request(
        url,
        data=json.dumps(payload, separators=(',', ':')).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'Accept': 'application/json'},
        method='POST',
    )
    try:
        with _NO_REDIRECT_OPENER.open(
            request, timeout=HTTP_TIMEOUT_SECONDS
        ) as response:
            status = getattr(response, 'status', None) or response.getcode()
            return status, _read_response(response)
    except urllib.error.HTTPError as error:
        try:
            return error.code, _read_response(error)
        finally:
            error.close()
    except (OSError, urllib.error.URLError, TimeoutError) as error:
        raise SafeSetupError(
            'service_unavailable',
            'Uclusion setup is temporarily unavailable. Retry shortly.',
        ) from error


def _stable_target_id(environment, client, scope, project_dir):
    target = '\0'.join((environment, client, scope, project_dir or ''))
    return hashlib.sha256(target.encode('utf-8')).hexdigest()[:32]


def receipt_path(environment, client, scope, project_dir):
    return os.path.join(
        RECEIPT_DIR,
        environment,
        _stable_target_id(environment, client, scope, project_dir) + '.json',
    )


def setup_lock_path(environment):
    """Return the one setup lock shared by every target in an environment."""
    return os.path.join(UCLUSION_HOME, f'{environment}-setup.lock')


def _resolved_write_target(path):
    logical_path = os.path.abspath(os.path.expanduser(path))
    if os.path.islink(logical_path):
        target_path = os.path.realpath(logical_path)
        if not os.path.exists(target_path):
            raise SafeSetupError(
                'local_write_failed',
                'A local Uclusion setup file could not be written safely.',
            )
    else:
        target_path = logical_path
    if os.path.exists(target_path):
        mode = os.stat(target_path).st_mode
        if not stat.S_ISREG(mode):
            raise SafeSetupError(
                'local_write_failed',
                'A local Uclusion setup file could not be written safely.',
            )
    return target_path


def _assert_private_content_unchanged(path, target_path, expected_content):
    """Fail closed if a credential changed after account validation."""
    try:
        same_target = _resolved_write_target(path) == target_path
        if not same_target:
            unchanged = False
        elif expected_content is None:
            unchanged = not os.path.exists(target_path)
        else:
            with open(target_path, 'rb') as source:
                unchanged = source.read(len(expected_content) + 1) == expected_content
    except (OSError, SafeSetupError):
        unchanged = False
    if not unchanged:
        raise SafeSetupError(
            'credential_conflict',
            'Existing Uclusion credentials changed during setup. They were '
            'not overwritten.',
        )


def atomic_private_write(
    path, content, expected_content=_UNCHECKED_PRIVATE_CONTENT
):
    """Atomically replace one private text file with mode 0600."""
    target_path = _resolved_write_target(path)
    directory = os.path.dirname(target_path)
    try:
        os.makedirs(directory, mode=0o700, exist_ok=True)
        descriptor, temporary_path = tempfile.mkstemp(
            prefix='.' + os.path.basename(target_path) + '.uclusion-',
            dir=directory,
        )
        try:
            os.fchmod(descriptor, 0o600)
            with os.fdopen(descriptor, 'w', encoding='utf-8') as output:
                descriptor = None
                output.write(content)
                output.flush()
                os.fsync(output.fileno())
            if expected_content is not _UNCHECKED_PRIVATE_CONTENT:
                _assert_private_content_unchanged(
                    path, target_path, expected_content
                )
            os.replace(temporary_path, target_path)
            temporary_path = None
            os.chmod(target_path, 0o600)
            try:
                directory_fd = os.open(directory, os.O_RDONLY)
                try:
                    os.fsync(directory_fd)
                finally:
                    os.close(directory_fd)
            except OSError:
                pass
        finally:
            if descriptor is not None:
                os.close(descriptor)
            if temporary_path is not None and os.path.lexists(temporary_path):
                os.remove(temporary_path)
    except SafeSetupError:
        raise
    except OSError as error:
        raise SafeSetupError(
            'local_write_failed',
            'A local Uclusion setup file could not be written safely.',
        ) from error
    return target_path


def _try_exclusive_lock(lock_file):
    if fcntl is not None:
        try:
            fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            return True
        except OSError as error:
            if error.errno in (errno.EACCES, errno.EAGAIN, errno.EDEADLK):
                return False
            raise

    if msvcrt is None:
        raise OSError('No supported advisory file-lock implementation')
    lock_file.seek(0, os.SEEK_END)
    if lock_file.tell() == 0:
        lock_file.write(b'\0')
        lock_file.flush()
    lock_file.seek(0)
    try:
        msvcrt.locking(lock_file.fileno(), msvcrt.LK_NBLCK, 1)
        return True
    except OSError as error:
        if (
            error.errno in (errno.EACCES, errno.EAGAIN, errno.EDEADLK)
            or getattr(error, 'winerror', None) in (33, 36)
        ):
            return False
        raise


def _unlock(lock_file):
    if fcntl is not None:
        fcntl.flock(lock_file.fileno(), fcntl.LOCK_UN)
        return
    lock_file.seek(0)
    msvcrt.locking(lock_file.fileno(), msvcrt.LK_UNLCK, 1)


class EnvironmentSetupLock:
    """Hold a nonblocking advisory lock for one unresolved environment setup."""

    def __init__(self, environment):
        self.path = setup_lock_path(environment)
        self.file = None

    def acquire(self):
        if self.file is not None:
            return True
        lock_file = None
        try:
            os.makedirs(UCLUSION_HOME, mode=0o700, exist_ok=True)
            target_path = _resolved_write_target(self.path)
            lock_file = open(target_path, 'a+b')
            os.chmod(target_path, 0o600)
            if not _try_exclusive_lock(lock_file):
                lock_file.close()
                return False
            self.file = lock_file
            return True
        except OSError as error:
            if lock_file is not None:
                lock_file.close()
            raise SafeSetupError(
                'local_lock_failed',
                'Uclusion setup could not reserve its local credential safely.',
            ) from error

    def release(self):
        lock_file = self.file
        self.file = None
        if lock_file is None:
            return
        try:
            _unlock(lock_file)
        except Exception:
            pass
        finally:
            lock_file.close()


def _safe_identifier(value):
    return (
        isinstance(value, str)
        and 1 <= len(value) <= 128
        and re.fullmatch(r'[A-Za-z0-9_-]+', value) is not None
    )


def write_receipt(path, setup_id, workspace_id, view_id):
    if not all(_safe_identifier(value) for value in (
        setup_id, workspace_id, view_id
    )):
        raise SafeSetupError(
            'service_unavailable',
            'Uclusion setup returned invalid workspace identifiers.',
        )
    receipt = {
        'setup_id': setup_id,
        'workspace_id': workspace_id,
        'view_id': view_id,
    }
    atomic_private_write(
        path,
        json.dumps(receipt, sort_keys=True, separators=(',', ':')) + '\n',
    )


def load_receipt(path):
    try:
        with open(path, 'r', encoding='utf-8') as receipt_file:
            receipt = json.load(receipt_file)
    except FileNotFoundError:
        return None
    except (OSError, json.JSONDecodeError):
        return None
    if (
        not isinstance(receipt, dict)
        or set(receipt) != {'setup_id', 'workspace_id', 'view_id'}
        or not all(_safe_identifier(receipt.get(key)) for key in receipt)
    ):
        return None
    return receipt


def environment_receipts(environment):
    """Return valid IDs-only receipts discoverable across every target."""
    directory = os.path.join(RECEIPT_DIR, environment)
    try:
        entries = sorted(os.scandir(directory), key=lambda entry: entry.name)
    except FileNotFoundError:
        return []
    except OSError as error:
        raise SafeSetupError(
            'local_read_failed',
            'Uclusion setup could not inspect local recovery state safely.',
        ) from error
    receipts = []
    for entry in entries:
        if not entry.name.endswith('.json') or not entry.is_file(follow_symlinks=False):
            continue
        receipt = load_receipt(entry.path)
        if receipt is not None:
            receipts.append((entry.path, receipt))
    return receipts


def receipt_age_seconds(path, now):
    """Return a nonnegative receipt age, or None when it cannot be proven."""
    try:
        return max(0, now - os.path.getmtime(path))
    except OSError:
        return None


def remove_receipt(path):
    try:
        os.remove(path)
    except FileNotFoundError:
        return
    except OSError as error:
        raise SafeSetupError(
            'activation_pending',
            'Uclusion is active, but local recovery cleanup is not complete.',
        ) from error


def _credential_value(value):
    return (
        isinstance(value, str)
        and 1 <= len(value) <= 512
        and value == value.strip()
        and '\n' not in value
        and '\r' not in value
        and '\0' not in value
    )


def _credential_file_state(environment):
    """Return state, parsed values, and exact bytes for a guarded update."""
    values = {}
    try:
        with open(credential_path(environment), 'rb') as source:
            content = source.read(4097)
    except FileNotFoundError:
        return 'absent', None, None
    except OSError:
        return 'invalid', None, None
    if len(content) > 4096:
        return 'invalid', None, content
    try:
        lines = content.decode('utf-8').splitlines()
    except UnicodeError:
        return 'invalid', None, content
    for raw_line in lines:
        line = raw_line.strip()
        if not line or line.startswith('#'):
            continue
        if '=' not in line:
            return 'invalid', None, content
        key, value = line.split('=', 1)
        key = key.strip()
        if key not in ('secret_key_id', 'secret_key') or key in values:
            return 'invalid', None, content
        values[key] = value.strip()
    if set(values) != {'secret_key_id', 'secret_key'} or not all(
        _credential_value(values[key]) for key in values
    ):
        return 'invalid', None, content
    return 'valid', values, content


def write_credentials(environment, credentials):
    """Persist one account-bound credential while its setup lock is held."""
    if not isinstance(credentials, dict):
        raise SafeSetupError(
            'service_unavailable',
            'Uclusion setup did not provide valid private credentials.',
        )
    secret_key_id = credentials.get('secret_key_id')
    secret_key = credentials.get('secret_key')
    if not _credential_value(secret_key_id) or not _credential_value(secret_key):
        raise SafeSetupError(
            'service_unavailable',
            'Uclusion setup did not provide valid private credentials.',
        )
    state, existing, existing_content = _credential_file_state(environment)
    if state == 'invalid' or (
        state == 'valid' and existing['secret_key_id'] != secret_key_id
    ):
        raise SafeSetupError(
            'credential_conflict',
            'Existing Uclusion credentials could not be safely matched to '
            'the approved account. They were not changed.',
        )
    serialized = (
        f'secret_key_id = {secret_key_id}\nsecret_key = {secret_key}\n'
    )
    path = credential_path(environment)
    written_target = atomic_private_write(
        path,
        serialized,
        expected_content=existing_content,
    )
    written_state, written, written_content = _credential_file_state(environment)
    try:
        private_target = _resolved_write_target(path) == written_target
        private_mode = stat.S_IMODE(os.stat(written_target).st_mode) == 0o600
    except (OSError, SafeSetupError):
        private_target = False
        private_mode = False
    if (
        written_state != 'valid'
        or written != {
            'secret_key_id': secret_key_id,
            'secret_key': secret_key,
        }
        or written_content != serialized.encode('utf-8')
        or not private_target
        or not private_mode
    ):
        raise SafeSetupError(
            'credential_conflict',
            'Uclusion credentials changed during setup. Setup did not '
            'acknowledge the credential write.',
        )


def read_credentials(environment):
    state, values, _content = _credential_file_state(environment)
    return values if state == 'valid' else None


def _installed_installer_path():
    sibling = os.path.join(
        os.path.dirname(os.path.realpath(__file__)), 'uclusionInstall.py'
    )
    if os.path.isfile(sibling):
        return sibling
    return os.path.join(
        os.path.expanduser('~'), '.local', 'bin', 'uclusionInstall.py'
    )


def run_runtime_installer(context, workspace_id, view_id, proposal):
    """Run the normal installer without placing credentials in argv/output."""
    token_audit = proposal.get('token_audit') if isinstance(proposal, dict) else None
    work_claims = proposal.get('work_claims') if isinstance(proposal, dict) else None
    if not isinstance(token_audit, bool) or not isinstance(work_claims, bool):
        raise SafeSetupError(
            'activation_pending',
            'Uclusion is created, but its approved settings could not be activated safely.',
        )
    if context.client == 'cursor' and token_audit:
        raise SafeSetupError(
            'activation_pending',
            'Uclusion is created, but Cursor cannot activate token audit.',
        )
    command = [
        sys.executable,
        _installed_installer_path(),
        context.environment,
        workspace_id,
        view_id,
        '--clients', context.client,
        '--skip-scripts',
        '--replace-setup',
        '--setup-receipt', context.receipt_path,
        '--token-audit' if token_audit else '--no-token-audit',
        '--work-claims' if work_claims else '--no-work-claims',
    ]
    if context.scope == 'project':
        command.append('--project')
    try:
        completed = subprocess.run(
            command,
            cwd=context.project_dir if context.scope == 'project' else None,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=INSTALL_TIMEOUT_SECONDS,
            check=False,
        )
    except (OSError, subprocess.SubprocessError) as error:
        raise SafeSetupError(
            'activation_pending',
            'Uclusion is created, but local activation is not complete. Retry complete_setup.',
        ) from error
    if completed.returncode != 0:
        raise SafeSetupError(
            'activation_pending',
            'Uclusion is created, but local activation is not complete. Retry complete_setup.',
        )


class SetupContext:
    def __init__(self, environment, client, scope, project_dir=None):
        self.environment = environment
        self.client = client
        self.scope = scope
        self.project_dir = (
            os.path.abspath(project_dir) if project_dir is not None else None
        )
        if scope == 'project' and self.project_dir is None:
            raise ValueError('project scope requires --project-dir')
        if scope == 'global' and self.project_dir is not None:
            raise ValueError('global scope does not take --project-dir')

    @property
    def receipt_path(self):
        return receipt_path(
            self.environment,
            self.client,
            self.scope,
            self.project_dir,
        )


def _project_label(project_dir):
    label = os.path.basename(project_dir.rstrip(os.sep)) if project_dir else ''
    label = re.sub(r'[/\\\x00-\x1f\x7f]+', ' ', label)
    label = ' '.join(label.split())[:80]
    return label or 'Current project'


def _authorization_url(value, environment, setup_id):
    if not isinstance(value, str) or len(value) > 2048:
        return None
    parsed = urllib.parse.urlsplit(value)
    if (
        parsed.scheme != 'https'
        or parsed.hostname != f'{environment}.uclusion.com'
        or parsed.username is not None
        or parsed.password is not None
        or parsed.port is not None
        or parsed.query
        or parsed.fragment
        or parsed.path != f'/setup/{setup_id}'
    ):
        return None
    return value


def _safe_expires_at(value):
    if not isinstance(value, str):
        return None
    timestamp = re.fullmatch(
        r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}'
        r'(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})',
        value,
    )
    return value if timestamp is not None else None


def _safe_retry_after(value):
    if isinstance(value, int) and not isinstance(value, bool):
        return max(1, min(value, 30))
    return 2


def _tool_result(payload, is_error=False):
    return {
        'content': [{
            'type': 'text',
            'text': json.dumps(payload, sort_keys=True, separators=(',', ':')),
        }],
        'isError': bool(is_error),
    }


class SetupService:
    """Own one setup MCP process's memory-only authorization proofs."""

    def __init__(
        self,
        context,
        requester=post_json,
        browser_open=webbrowser.open,
        installer=run_runtime_installer,
        now=time.time,
    ):
        self.context = context
        self.requester = requester
        self.browser_open = browser_open
        self.installer = installer
        self.now = now
        self.enrollment = None
        self.setup_lock = EnvironmentSetupLock(context.environment)

    def close(self):
        self.setup_lock.release()

    def __del__(self):
        setup_lock = getattr(self, 'setup_lock', None)
        if setup_lock is not None:
            setup_lock.release()

    def _require_setup_lock(self):
        if not self.setup_lock.acquire():
            raise SafeSetupError(
                'setup_in_progress',
                'Another Uclusion setup is already active for this environment.',
            )

    def _clear_enrollment(self):
        self.enrollment = None
        self.setup_lock.release()

    def _current_create_result(self):
        enrollment = self.enrollment
        if enrollment['credentials_written']:
            return {
                'status': 'recovery_pending',
                'setup_id': enrollment['setup_id'],
                'next': 'Call complete_setup with this setup_id to finish setup.',
            }
        return {
            'status': 'pending_authorization',
            'setup_id': enrollment['setup_id'],
            'authorization_url': enrollment['authorization_url'],
            'expires_at': enrollment['expires_at'],
            'expires_in_seconds': SETUP_LIFETIME_SECONDS,
            'proposal': enrollment['proposal'],
            'browser_opened': enrollment['browser_opened'],
            'next': 'Approve or deny this exact setup in the Uclusion page, then call complete_setup.',
        }

    def tools(self):
        return [
            {
                'name': 'create_workspace',
                'description': (
                    'Start a 15-minute Uclusion workspace setup after the human '
                    'has confirmed the proposed name, client, scope, and defaults. '
                    'Returns only a public Uclusion authorization URL and safe status.'
                ),
                'inputSchema': {
                    'type': 'object',
                    'additionalProperties': False,
                    'properties': {
                        'workspace_name': {
                            'type': 'string', 'minLength': 1, 'maxLength': 80,
                        },
                        'client': {'enum': [self.context.client]},
                        'scope': {'enum': [self.context.scope]},
                        'token_audit': (
                            {'enum': [False], 'default': False}
                            if self.context.client == 'cursor'
                            else {'type': 'boolean', 'default': False}
                        ),
                        'work_claims': {'type': 'boolean', 'default': False},
                    },
                    'required': ['workspace_name', 'client', 'scope'],
                },
            },
            {
                'name': 'complete_setup',
                'description': (
                    'Check the approved setup once, finish private local '
                    'credential/configuration work when ready, and return only '
                    'safe status plus the final reconnect instruction.'
                ),
                'inputSchema': {
                    'type': 'object',
                    'additionalProperties': False,
                    'properties': {
                        'setup_id': {
                            'type': 'string', 'minLength': 1, 'maxLength': 128,
                        },
                    },
                    'required': ['setup_id'],
                },
            },
        ]

    def create_workspace(self, arguments):
        proposal = self._proposal(arguments)
        if self.enrollment is not None:
            return self._current_create_result()
        self._require_setup_lock()
        try:
            receipts = environment_receipts(self.context.environment)
        except Exception:
            self.setup_lock.release()
            raise
        retained = next((
            receipt for path, receipt in receipts
            if path == self.context.receipt_path
        ), None)
        if retained is not None:
            return {
                'status': 'recovery_pending',
                'setup_id': retained['setup_id'],
                'next': (
                    'Do not start another setup. Call complete_setup with this '
                    'retained setup_id to finish or diagnose recovery.'
                ),
            }
        if receipts:
            self.setup_lock.release()
            return {
                'status': 'recovery_pending',
                'next': (
                    'An unresolved Uclusion setup exists for this environment. '
                    'Finish it from its original client and scope before starting another.'
                ),
            }
        try:
            setup_id = str(uuid.uuid4())
            verifier = secrets.token_urlsafe(32)
            challenge = base64.urlsafe_b64encode(
                hashlib.sha256(verifier.encode('ascii')).digest()
            ).rstrip(b'=').decode('ascii')
            status, response = self.requester(
                api_base_url(self.context.environment) + '/setup',
                {
                    'setup_id': setup_id,
                    'code_challenge': challenge,
                    'proposal': proposal,
                },
            )
            if status not in (200, 201):
                raise SafeSetupError(
                    'setup_unavailable',
                    'A new Uclusion setup could not be started. Retry create_workspace.',
                )
            authorization_url = _authorization_url(
                response.get('authorization_url'),
                self.context.environment,
                setup_id,
            )
            expires_at = _safe_expires_at(response.get('expires_at'))
            if (
                response.get('setup_id') != setup_id
                or response.get('state') != 'PENDING'
                or response.get('proposal') != proposal
                or authorization_url is None
                or expires_at is None
            ):
                raise SafeSetupError(
                    'service_unavailable',
                    'Uclusion setup returned an invalid response. Retry create_workspace.',
                )
            browser_opened = False
            try:
                browser_opened = bool(
                    self.browser_open(authorization_url, new=2)
                )
            except Exception:
                pass
            self.enrollment = {
                'setup_id': setup_id,
                'verifier': verifier,
                'proposal': proposal,
                'authorization_url': authorization_url,
                'expires_at': expires_at,
                'expires_at_epoch': self.now() + SETUP_LIFETIME_SECONDS,
                'credentials_written': False,
                'browser_opened': browser_opened,
            }
            return self._current_create_result()
        except Exception:
            self.setup_lock.release()
            raise

    def complete_setup(self, arguments):
        if not isinstance(arguments, dict) or set(arguments) != {'setup_id'}:
            raise SafeSetupError(
                'invalid_request', 'complete_setup requires only setup_id.'
            )
        setup_id = arguments.get('setup_id')
        if not _safe_identifier(setup_id):
            raise SafeSetupError(
                'invalid_request', 'complete_setup requires a valid setup_id.'
            )
        enrollment = self.enrollment
        if enrollment is None:
            return self._recover(setup_id)
        if enrollment['setup_id'] != setup_id:
            return {
                'status': 'setup_in_progress',
                'setup_id': enrollment['setup_id'],
                'next': 'Finish the current setup before starting or recovering another.',
            }, True
        if (
            not enrollment['credentials_written']
            and self.now() >= enrollment['expires_at_epoch']
        ):
            self._clear_enrollment()
            return {
                'status': 'expired',
                'setup_id': setup_id,
                'next': 'Call create_workspace to start a new 15-minute setup.',
            }, True

        response_status, response = self._request_completion(
            setup_id,
            enrollment['verifier'],
            enrollment['credentials_written'],
        )
        return self._process_completion(
            setup_id, enrollment, response_status, response
        )

    def _proposal(self, arguments):
        if not isinstance(arguments, dict):
            raise SafeSetupError('invalid_request', 'Setup values are invalid.')
        allowed = {
            'workspace_name', 'client', 'scope', 'token_audit', 'work_claims'
        }
        if set(arguments) - allowed:
            raise SafeSetupError('invalid_request', 'Setup values are invalid.')
        workspace_name = arguments.get('workspace_name')
        if not isinstance(workspace_name, str):
            raise SafeSetupError('invalid_request', 'Workspace name is required.')
        workspace_name = ' '.join(workspace_name.split())
        if not 1 <= len(workspace_name) <= 80:
            raise SafeSetupError(
                'invalid_request', 'Workspace name must be 1 to 80 characters.'
            )
        if (
            arguments.get('client') != self.context.client
            or arguments.get('scope') != self.context.scope
        ):
            raise SafeSetupError(
                'invalid_request',
                'Client and scope must match the confirmed bootstrap target.',
            )
        token_audit = arguments.get('token_audit', False)
        work_claims = arguments.get('work_claims', False)
        if not isinstance(token_audit, bool) or not isinstance(work_claims, bool):
            raise SafeSetupError(
                'invalid_request', 'Advanced setup values must be true or false.'
            )
        if self.context.client == 'cursor' and token_audit:
            raise SafeSetupError(
                'invalid_request',
                'Cursor setup does not support token audit.',
            )
        proposal = {
            'workspace_name': workspace_name,
            'client': self.context.client,
            'scope': self.context.scope,
            'token_audit': token_audit,
            'work_claims': work_claims,
        }
        if self.context.scope == 'project':
            proposal['project_label'] = _project_label(self.context.project_dir)
        return proposal

    def _request_completion(self, setup_id, verifier, credentials_written):
        payload = {'verifier': verifier}
        if credentials_written:
            payload['credentials_written'] = True
        return self.requester(
            api_base_url(self.context.environment)
            + '/setup/' + urllib.parse.quote(setup_id, safe='') + '/complete',
            payload,
        )

    def _process_completion(self, setup_id, enrollment, status, response):
        if response.get('setup_id') not in (None, setup_id):
            raise SafeSetupError(
                'service_unavailable',
                'Uclusion setup returned an invalid response. Retry complete_setup.',
            )
        if status == 202 and response.get('state') in ('PENDING', 'COMPLETING'):
            state = response['state']
            return {
                'status': (
                    'pending_authorization' if state == 'PENDING'
                    else 'provisioning'
                ),
                'setup_id': setup_id,
                'expires_at': _safe_expires_at(response.get('expires_at')),
                'retry_after_seconds': _safe_retry_after(
                    response.get('retry_after_seconds')
                ),
                'next': 'Retry complete_setup after the indicated delay.',
            }, False
        if status in (404, 410) and enrollment['credentials_written']:
            return {
                'status': 'recovery_pending',
                'setup_id': setup_id,
                'retry_after_seconds': 2,
                'next': (
                    'Retry complete_setup shortly. The in-memory proof and '
                    'recovery receipt have been retained.'
                ),
            }, False
        if status == 410:
            self._clear_enrollment()
            reason = response.get('reason')
            final_status = 'denied' if reason == 'DENIED' else 'expired'
            return {
                'status': final_status,
                'setup_id': setup_id,
                'next': 'Call create_workspace to start a new setup.',
            }, True
        if status == 404:
            self._clear_enrollment()
            return {
                'status': 'setup_unavailable',
                'setup_id': setup_id,
                'next': 'Call create_workspace to start a new setup.',
            }, True
        if status != 200:
            raise SafeSetupError(
                'service_unavailable',
                'Uclusion setup is temporarily unavailable. Retry complete_setup.',
            )

        if response.get('setup_id') != setup_id:
            raise SafeSetupError(
                'service_unavailable',
                'Uclusion setup returned an invalid response. Retry complete_setup.',
            )
        state = response.get('state')
        if state == 'COMPLETING':
            if not enrollment['credentials_written']:
                if response.get('next') != 'WRITE_CREDENTIALS_AND_ACK':
                    raise SafeSetupError(
                        'service_unavailable',
                        'Uclusion setup returned an invalid response. Retry complete_setup.',
                    )
                self._persist_private_completion(setup_id, enrollment, response)
            ack_status, ack_response = self._request_completion(
                setup_id, enrollment['verifier'], True
            )
            return self._process_ack(
                setup_id, enrollment, ack_status, ack_response
            )
        if state == 'CONSUMED':
            if not enrollment['credentials_written']:
                return self._recover(setup_id)
            return self._activate_consumed(setup_id, enrollment, response)
        raise SafeSetupError(
            'service_unavailable',
            'Uclusion setup returned an invalid response. Retry complete_setup.',
        )

    def _process_ack(self, setup_id, enrollment, status, response):
        if (
            status in (200, 202)
            and response.get('setup_id') != setup_id
        ) or response.get('setup_id') not in (None, setup_id):
            raise SafeSetupError(
                'service_unavailable',
                'Uclusion setup returned an invalid response. Retry complete_setup.',
            )
        if status == 202 and response.get('state') == 'COMPLETING':
            return {
                'status': 'provisioning',
                'setup_id': setup_id,
                'retry_after_seconds': _safe_retry_after(
                    response.get('retry_after_seconds')
                ),
                'next': 'Retry complete_setup after the indicated delay.',
            }, False
        if status == 200 and response.get('state') == 'CONSUMED':
            return self._activate_consumed(setup_id, enrollment, response)
        raise SafeSetupError(
            'service_unavailable',
            'Uclusion setup is temporarily unavailable. Retry complete_setup.',
        )

    def _activate_consumed(self, setup_id, enrollment, response):
        if (
            response.get('workspace_id') != enrollment.get('workspace_id')
            or response.get('view_id') != enrollment.get('view_id')
        ):
            raise SafeSetupError(
                'service_unavailable',
                'Uclusion setup returned an invalid response. Retry complete_setup.',
            )
        return self._activate(setup_id, enrollment)

    def _persist_private_completion(self, setup_id, enrollment, response):
        workspace_id = response.get('workspace_id')
        view_id = response.get('view_id')
        if not _safe_identifier(workspace_id) or not _safe_identifier(view_id):
            raise SafeSetupError(
                'service_unavailable',
                'Uclusion setup returned invalid workspace identifiers.',
            )
        write_credentials(self.context.environment, response.get('credentials'))
        write_receipt(
            self.context.receipt_path, setup_id, workspace_id, view_id
        )
        enrollment['workspace_id'] = workspace_id
        enrollment['view_id'] = view_id
        enrollment['credentials_written'] = True

    def _activate(self, setup_id, enrollment):
        workspace_id = enrollment.get('workspace_id')
        view_id = enrollment.get('view_id')
        if not _safe_identifier(workspace_id) or not _safe_identifier(view_id):
            receipt = load_receipt(self.context.receipt_path)
            if receipt is None or receipt.get('setup_id') != setup_id:
                raise SafeSetupError(
                    'activation_pending',
                    'Uclusion is created, but local activation is not complete. Retry complete_setup.',
                )
            workspace_id = receipt['workspace_id']
            view_id = receipt['view_id']
        return self._finish_activation(
            setup_id,
            workspace_id,
            view_id,
            enrollment['proposal'],
        )

    def _finish_activation(self, setup_id, workspace_id, view_id, proposal):
        self.installer(
            self.context,
            workspace_id,
            view_id,
            proposal,
        )
        cleanup_pending = False
        try:
            remove_receipt(self.context.receipt_path)
        except SafeSetupError:
            cleanup_pending = True
        self._clear_enrollment()
        return {
            'status': (
                'completed_cleanup_pending'
                if cleanup_pending else 'completed'
            ),
            'setup_id': setup_id,
            'workspace_id': workspace_id,
            'view_id': view_id,
            'next': (
                self._reconnect_instruction()
                + (
                    ' Local recovery cleanup will finish when the normal '
                    'Uclusion MCP starts.'
                    if cleanup_pending else ''
                )
            ),
        }, False

    def _recover(self, setup_id):
        receipt = load_receipt(self.context.receipt_path)
        if receipt is None or receipt.get('setup_id') != setup_id:
            self._clear_enrollment()
            return {
                'status': 'authorization_process_lost',
                'setup_id': setup_id,
                'next': 'Call create_workspace to start a new 15-minute setup.',
            }, True
        self._require_setup_lock()
        credentials = read_credentials(self.context.environment)
        if credentials is None:
            return {
                'status': 'recovery_needs_credentials',
                'setup_id': setup_id,
                'next': 'Restore the current Uclusion shared-secret credential, then retry complete_setup.',
            }, True
        status, response = self.requester(
            api_base_url(self.context.environment)
            + '/setup/' + urllib.parse.quote(setup_id, safe='') + '/recover',
            {
                'workspace_id': receipt['workspace_id'],
                'view_id': receipt['view_id'],
                'secret_key_id': credentials['secret_key_id'],
                'secret_key': credentials['secret_key'],
            },
        )
        if status == 202 and response.get('state') == 'COMPLETING':
            if response.get('setup_id') != setup_id:
                raise SafeSetupError(
                    'service_unavailable',
                    'Uclusion setup returned an invalid response. Retry complete_setup.',
                )
            return {
                'status': 'recovery_pending',
                'setup_id': setup_id,
                'retry_after_seconds': _safe_retry_after(
                    response.get('retry_after_seconds')
                ),
                'next': 'Retry complete_setup after the indicated delay.',
            }, False
        if status == 404:
            age = receipt_age_seconds(
                self.context.receipt_path, self.now()
            )
            if age is None or age < RECOVERY_GRACE_SECONDS:
                return {
                    'status': 'recovery_pending',
                    'setup_id': setup_id,
                    'retry_after_seconds': 2,
                    'next': 'Retry complete_setup shortly.',
                }, False
            return {
                'status': 'recovery_unavailable',
                'setup_id': setup_id,
                'next': (
                    'Verify or restore the current Uclusion shared-secret '
                    'credential, then retry complete_setup. The recovery '
                    'receipt has been retained.'
                ),
            }, True
        if status != 200 or response.get('state') != 'CONSUMED':
            return {
                'status': 'recovery_pending',
                'setup_id': setup_id,
                'retry_after_seconds': 2,
                'next': 'Retry complete_setup shortly.',
            }, False
        if (
            response.get('setup_id') != setup_id
            or response.get('workspace_id') != receipt['workspace_id']
            or response.get('view_id') != receipt['view_id']
        ):
            raise SafeSetupError(
                'service_unavailable',
                'Uclusion setup returned an invalid response. Retry complete_setup.',
            )
        settings = response.get('settings')
        if (
            not isinstance(settings, dict)
            or set(settings) != {'token_audit', 'work_claims'}
            or not all(isinstance(value, bool) for value in settings.values())
            or (
                self.context.client == 'cursor'
                and settings.get('token_audit') is not False
            )
        ):
            raise SafeSetupError(
                'service_unavailable',
                'Uclusion setup returned invalid approved settings. Retry complete_setup.',
            )
        proposal = {
            'client': self.context.client,
            'scope': self.context.scope,
            'token_audit': settings['token_audit'],
            'work_claims': settings['work_claims'],
        }
        return self._finish_activation(
            setup_id,
            receipt['workspace_id'],
            receipt['view_id'],
            proposal,
        )

    def _reconnect_instruction(self):
        if self.context.client == 'codex':
            return (
                'Restart Codex from the configured scope using `uclusion codex`; '
                'then confirm normal Uclusion tools are listed without calling find_work.'
            )
        label = 'Claude Code' if self.context.client == 'claude' else 'Cursor'
        return (
            f'Restart or reconnect {label}; then confirm normal Uclusion tools '
            'are listed without calling find_work.'
        )


def parse_args(argv=None):
    parser = argparse.ArgumentParser(
        description='Temporary credential-free Uclusion setup MCP.'
    )
    parser.add_argument('environment', choices=tuple(CREDENTIAL_FILES))
    parser.add_argument('--client', required=True, choices=SUPPORTED_CLIENTS)
    parser.add_argument('--scope', required=True, choices=SUPPORTED_SCOPES)
    parser.add_argument('--project-dir')
    args = parser.parse_args(argv)
    if args.scope == 'project' and not args.project_dir:
        parser.error('--scope project requires --project-dir')
    if args.scope == 'global' and args.project_dir:
        parser.error('--project-dir requires --scope project')
    return args


def write_message(message):
    sys.stdout.write(json.dumps(message, separators=(',', ':')) + '\n')
    sys.stdout.flush()


def write_error(request_id, code, message):
    write_message({
        'jsonrpc': '2.0',
        'id': request_id,
        'error': {'code': code, 'message': message},
    })


def serve(service):
    for raw_line in sys.stdin:
        if not raw_line.strip():
            continue
        try:
            request = json.loads(raw_line)
        except json.JSONDecodeError:
            sys.stderr.write('Uclusion setup MCP received invalid JSON.\n')
            sys.stderr.flush()
            continue
        if not isinstance(request, dict):
            continue
        request_id = request.get('id')
        method = request.get('method')
        if method == 'notifications/initialized' or 'id' not in request:
            continue
        if method == 'initialize':
            write_message({
                'jsonrpc': '2.0',
                'id': request_id,
                'result': {
                    'protocolVersion': MCP_PROTOCOL_VERSION,
                    'capabilities': {'tools': {}},
                    'serverInfo': {
                        'name': 'Uclusion Setup',
                        'version': '1',
                    },
                    'instructions': (
                        'Confirm the proposed setup with the human, call '
                        'create_workspace once, complete the Uclusion browser '
                        'authorization, then call complete_setup. Never request '
                        'or display credentials or authorization proof.'
                    ),
                },
            })
            continue
        if method == 'ping':
            write_message({'jsonrpc': '2.0', 'id': request_id, 'result': {}})
            continue
        if method == 'tools/list':
            write_message({
                'jsonrpc': '2.0',
                'id': request_id,
                'result': {'tools': service.tools()},
            })
            continue
        if method != 'tools/call':
            write_error(request_id, -32601, 'Method not found')
            continue
        params = request.get('params')
        if not isinstance(params, dict):
            write_error(request_id, -32602, 'Invalid tool request')
            continue
        name = params.get('name')
        arguments = params.get('arguments', {})
        try:
            if name == 'create_workspace':
                payload = service.create_workspace(arguments)
                result = _tool_result(
                    payload, payload.get('status') == 'recovery_pending'
                )
            elif name == 'complete_setup':
                payload, is_error = service.complete_setup(arguments)
                result = _tool_result(payload, is_error)
            else:
                write_error(request_id, -32601, 'Unknown setup tool')
                continue
        except SafeSetupError as error:
            result = _tool_result({
                'status': error.status,
                'message': error.public_message,
            }, True)
        except Exception:
            result = _tool_result({
                'status': 'setup_failed',
                'message': 'Uclusion setup could not complete safely. Retry the current step.',
            }, True)
        write_message({'jsonrpc': '2.0', 'id': request_id, 'result': result})


def main(argv=None):
    args = parse_args(argv)
    context = SetupContext(
        args.environment, args.client, args.scope, args.project_dir
    )
    service = SetupService(context)
    try:
        serve(service)
    finally:
        service.close()
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception:
        sys.stderr.write('Uclusion setup MCP could not start.\n')
        sys.exit(1)
