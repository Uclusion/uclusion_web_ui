#!/usr/bin/python3
"""Install the Uclusion CLI and MCP Proxy scripts and configure them.

Downloads ``uclusionCLI.py`` and ``uclusionMCPProxy.py`` from the Uclusion site
(environment-specific) into a versioned install directory under ``~/.local`` and
atomically activates that immutable release through ``uclusion-cli/current``.
Stable symlinks in ``~/.local/bin`` resolve through ``current/bin`` (the same
user-local bin Claude and Codex install into). The install is always user-local,
so it never needs root or sudo.

The CLI file is named ``uclusion.py`` in the install directory and is exposed
on ``PATH`` via a ``uclusion`` symlink, so users invoke it simply as
``uclusion`` rather than the legacy ``uclusionCLI.py`` filename.

With ``--clients`` (a comma list of ``claude``, ``cursor``, ``codex``) the
install is fully non-interactive: only the selected clients are configured,
their config files are created even when the client is not detected on the
machine, and ``--project`` configures the current working directory instead of
the home directory (T-all-2296 - the web setup page builds this command from a
selector instead of the installer asking questions).

Without ``--clients`` the installer asks whether to configure Uclusion globally
(the default) or at the project level:

* Global writes a workspace config to ``~/.uclusion/uclusion.json`` and registers
  the Uclusion MCP server in ``~/.cursor/mcp.json`` and ``~/.claude.json`` if
  those files already exist, and in ``~/.codex/config.toml`` if the ``~/.codex``
  directory exists (Codex treats ``config.toml`` as optional, so directory
  presence — not file presence — is the install signal). A Cursor workflow
  refresh also removes the obsolete Uclusion Poke drain stop hook.
* Project level writes everything into a directory the user supplies: the
  workspace config (``uclusion.json``), project-scoped MCP registrations
  (``.mcp.json`` for Claude Code, ``.cursor/mcp.json`` for Cursor), and the
  workflow docs
  (``CLAUDE.md``, ``.cursor/rules/uclusion.mdc``, ``AGENTS.md``) plus each
  client's native ``skills/uclusion`` package. Claude and Cursor use their
  client directories; Codex uses the cross-agent ``.agents/skills`` path.
  Agent-led setup also writes Codex's trusted-project ``.codex/config.toml``
  MCP table, while legacy project installs continue to use the equivalent
  ``uclusion codex`` launch override. The CLI binaries themselves always stay
  user-global under ``~/.local``.

``setup`` mode needs no Uclusion credential, workspace ID, or view ID. It
installs the same immutable script release and registers ``uclusionSetupMCP.py``
under the existing ``Uclusion`` key for exactly one selected client and scope.
The temporary MCP later invokes this installer without putting a secret on the
command line, replacing its own registration with the normal runtime proxy.
"""
import argparse
import errno
import filecmp
import hashlib
import json
import os
import re
import shlex
import shutil
import stat
import subprocess
import sys
import tempfile
import time
import urllib.parse
import urllib.request
import uuid
from contextlib import contextmanager

try:
    import fcntl
except ImportError:  # Native Windows does not provide POSIX flock.
    fcntl = None

try:
    import msvcrt
except ImportError:  # POSIX platforms do not provide Windows file locking.
    msvcrt = None

try:
    import tomllib
except ImportError:  # Python < 3.11 keeps standalone installer compatibility.
    tomllib = None


LOCAL_PREFIX = os.path.join(os.path.expanduser('~'), '.local')
SCRIPT_INSTALL_PREFIX = os.path.join(LOCAL_PREFIX, 'uclusion-cli')
# Scripts install into ~/.local/uclusion-cli/<script_reinstall_version>/bin —
# the same versions-in-the-path layout Claude uses (versions/2.1.220) — so the
# installed release is readable from the symlink target and the proxy/CLI can
# derive their own version from realpath (J-all-367). When the version cannot
# be fetched (no credentials yet, offline), every install gets a unique
# ``unversioned-*`` release. Version checks treat those releases as unknown,
# while their unique names preserve the immutable-release invariant.
UNVERSIONED_INSTALL_DIR = 'unversioned'
CURRENT_RELEASE_LINK = 'current'
INSTALL_LOCK_FILE = '.install.lock'
RESERVED_RELEASE_NAMES = frozenset({
    CURRENT_RELEASE_LINK,
    'v1',
    'bin',
    UNVERSIONED_INSTALL_DIR,
})
# Symlinks land in ~/.local/bin (where Claude and Codex install too), so the
# install is always user-writable and never needs root or sudo.
SYMLINK_DIR = os.path.join(LOCAL_PREFIX, 'bin')
# Legacy Cursor stop-hook helper; the token identifies entries to remove.
CURSOR_POKE_DRAIN_SYMLINK_NAME = 'uclusionCursorPokeDrain.py'
CURSOR_POKE_DRAIN_HOOK_TOKEN = 'uclusionCursorPokeDrain'
# Token-audit collection is a separate installed helper. Claude hooks invoke
# the stable public symlink, so updates move the hook and proxy to the same
# immutable release without rewriting settings.json.
TOKEN_AUDIT_SYMLINK_NAME = 'uclusionTokenAudit.py'
TOKEN_AUDIT_DEFAULT_PORT_BASE = 20000
TOKEN_AUDIT_PORT_SPAN = 30000

# Connect/read timeout (seconds) for every network fetch. Without it a stalled
# TLS handshake or read blocks urlopen forever and the installer has to be
# Ctrl-C'd; with it the fetch raises and we fail gracefully instead.
HTTP_TIMEOUT = 15

# Each entry maps (source filename served by Uclusion, installed filename,
# symlink name in SYMLINK_DIR). The CLI is downloaded as ``uclusionCLI.py``,
# installed as ``uclusion.py``, and exposed on ``PATH`` simply as ``uclusion``.
SCRIPT_FILES = (
    ('uclusionInstall.py', 'uclusionInstall.py', 'uclusionInstall.py'),
    ('uclusionCLI.py', 'uclusion.py', 'uclusion'),
    ('uclusionMCPProxy.py', 'uclusionMCPProxy.py', 'uclusionMCPProxy.py'),
    ('uclusionSetupMCP.py', 'uclusionSetupMCP.py', 'uclusionSetupMCP.py'),
    ('uclusionCodexBridge.py', 'uclusionCodexBridge.py', 'uclusionCodexBridge.py'),
    ('uclusionTokenAudit.py', 'uclusionTokenAudit.py', TOKEN_AUDIT_SYMLINK_NAME),
    # Retained for compatibility while workflow refreshes remove old hooks.
    ('uclusionCursorPokeDrain.py', 'uclusionCursorPokeDrain.py',
     CURSOR_POKE_DRAIN_SYMLINK_NAME),
)
# Setup has no account credential with which to resolve
# ``script_reinstall_version``. The downloaded installer is therefore its own
# release manifest: setup copies that exact running installer into staging and
# accepts the remaining scripts only when their bytes match these pins. The
# deployment gate validates this table before publishing, so a sequential S3
# deployment can fail a bootstrap safely but cannot install a mixed release.
SETUP_BOOTSTRAP_SCRIPT_SHA256 = {
    'uclusionCLI.py':
        '2f11ebfd32835758109e22430594bae72954425b2c82620c461e73467489bd34',
    'uclusionMCPProxy.py':
        '66f01fcd4aaec3750cb54d8fb8c0451dc3431534d0c39d264ea8bae68b18b0f8',
    'uclusionSetupMCP.py':
        'f91ea798847ec8f8cb3407dfcc8eb4ab36ffbaab0c9695fb6028b56b94549d51',
    'uclusionCodexBridge.py':
        'ce221d7dcfbd4dd460c8b50c7cce0367e36d78f83270dc08e01c59b05675e47c',
    'uclusionTokenAudit.py':
        '371e49d36c8393048f8e500bace829c9031f59f504673bdc40b1c1af12453df8',
    'uclusionCursorPokeDrain.py':
        '89e1f0bbbb8caaf5cc43b7fb399a9f0557b8c89c13c5e6f0e38ef5330f1518ca',
}

USER_HOME = os.path.expanduser('~')
UCLUSION_HOME = os.path.join(USER_HOME, '.uclusion')
# Workspace config filenames are environment-specific — the same names the CLI
# reads (S-all-163): production stays uclusion.json, stage/dev get prefixed so
# `uclusion -e stage ...` finds the config the installer wrote.
CONFIG_FILES = {
    'dev': 'dev_uclusion.json',
    'stage': 'stage_uclusion.json',
    'production': 'uclusion.json',
}
CURSOR_MCP_PATH = os.path.join(USER_HOME, '.cursor', 'mcp.json')
CLAUDE_JSON_PATH = os.path.join(USER_HOME, '.claude.json')
CLAUDE_CONFIG_HOME = os.path.abspath(os.path.expanduser(
    os.environ.get('CLAUDE_CONFIG_DIR', os.path.join(USER_HOME, '.claude'))
))
CLAUDE_MD_PATH = os.path.join(CLAUDE_CONFIG_HOME, 'CLAUDE.md')
CLAUDE_SKILL_DIR = os.path.join(
    CLAUDE_CONFIG_HOME, 'skills', 'uclusion'
)
CLAUDE_SETTINGS_PATH = os.path.join(CLAUDE_CONFIG_HOME, 'settings.json')
# Explicit allow rules are checked before Claude Code's permission classifier, so the Uclusion
# workflow tools never prompt or hit classifier outages (T-all-2299)
CLAUDE_ALLOW_RULE = 'mcp__Uclusion__*'
CLAUDE_TOKEN_AUDIT_MARKER_MATCHER = (
    r'^mcp__Uclusion__(start_job_audit|set_job_audit_phase|end_job_audit)$'
)
CLAUDE_TOKEN_AUDIT_HOOK_EVENTS = (
    ('PostToolUse', CLAUDE_TOKEN_AUDIT_MARKER_MATCHER),
    ('UserPromptSubmit', None),
    ('SessionStart', None),
    ('SubagentStart', None),
    ('SubagentStop', None),
    ('Stop', None),
    ('StopFailure', None),
    ('SessionEnd', None),
)
# Claude command hooks normally default to ten minutes, but SessionEnd has a
# separate 1.5-second overall budget that an explicit per-hook timeout can
# raise only as high as 60 seconds. Keep the lightweight OTel hooks tightly
# bounded while giving transcript fallback's bounded JSONL scan the full
# supported SessionEnd window.
CLAUDE_TOKEN_AUDIT_OTEL_HOOK_TIMEOUT_SECONDS = 10
CLAUDE_TOKEN_AUDIT_TRANSCRIPT_HOOK_TIMEOUT_SECONDS = 60
# Generic/log-specific exporters and content policy can affect Uclusion's log
# stream. Existing values without our ownership record belong to the user and
# select the transcript fallback instead of being overwritten.
CLAUDE_TOKEN_AUDIT_CONFLICT_KEYS = frozenset({
    'CLAUDE_CODE_ENABLE_TELEMETRY',
    'OTEL_LOGS_EXPORTER',
    'OTEL_EXPORTER_OTLP_ENDPOINT',
    'OTEL_EXPORTER_OTLP_PROTOCOL',
    'OTEL_EXPORTER_OTLP_HEADERS',
    'OTEL_EXPORTER_OTLP_LOGS_ENDPOINT',
    'OTEL_EXPORTER_OTLP_LOGS_PROTOCOL',
    'OTEL_EXPORTER_OTLP_LOGS_HEADERS',
    'OTEL_LOGS_EXPORT_INTERVAL',
    'OTEL_LOG_USER_PROMPTS',
    'OTEL_LOG_ASSISTANT_RESPONSES',
    'OTEL_LOG_TOOL_DETAILS',
    'OTEL_LOG_TOOL_CONTENT',
    'OTEL_LOG_RAW_API_BODIES',
})
CLAUDE_TOKEN_AUDIT_SETTINGS_POLICY_KEYS = frozenset({
    'otelHeadersHelper',
})
CLAUDE_MD_MARKER = '<!-- uclusion-workflow:v1 -->'
CLAUDE_MD_END_MARKER = '<!-- /uclusion-workflow:v1 -->'
CURSOR_MDC_PATH = os.path.join(USER_HOME, '.cursor', 'rules', 'uclusion.mdc')
CURSOR_SKILL_DIR = os.path.join(
    USER_HOME, '.cursor', 'skills', 'uclusion'
)
CURSOR_HOOKS_PATH = os.path.join(USER_HOME, '.cursor', 'hooks.json')
CURSOR_MDC_FRONTMATTER = (
    '---\n'
    'description: Uclusion job workflow — invoke when working on a Uclusion '
    'job/task/bug short code (J-*, T-*, B-*)\n'
    'alwaysApply: true\n'
    '---\n'
)
MCP_PROXY_SYMLINK_PATH = os.path.join(SYMLINK_DIR, 'uclusionMCPProxy.py')
SETUP_MCP_SYMLINK_PATH = os.path.join(SYMLINK_DIR, 'uclusionSetupMCP.py')
INSTALLER_SYMLINK_PATH = os.path.join(SYMLINK_DIR, 'uclusionInstall.py')
RUNTIME_PROXY_MODE = '--uclusion-runtime-after-setup'
RUNTIME_CLEANUP_MODE = '--uclusion-cleanup-after-setup'
TOKEN_AUDIT_SYMLINK_PATH = os.path.join(SYMLINK_DIR, TOKEN_AUDIT_SYMLINK_NAME)
CODEX_BRIDGE_SYMLINK_PATH = os.path.join(SYMLINK_DIR, 'uclusionCodexBridge.py')
CODEX_HOME = os.path.abspath(os.path.expanduser(
    os.environ.get('CODEX_HOME', os.path.join(USER_HOME, '.codex'))
))
CODEX_CONFIG_PATH = os.path.join(CODEX_HOME, 'config.toml')
CODEX_AGENTS_MD_PATH = os.path.join(CODEX_HOME, 'AGENTS.md')
# Codex discovers user skills from the cross-agent native directory. The
# older ~/.codex/skills location is compatibility-only and is not installed.
CODEX_SKILL_DIR = os.path.join(
    USER_HOME, '.agents', 'skills', 'uclusion'
)
# The MCP table we manage in config.toml is delimited by TOML comment markers so
# reruns can replace it in place without disturbing the user's other settings.
CODEX_CONFIG_MARKER = '# uclusion-mcp:v1'
CODEX_CONFIG_END_MARKER = '# /uclusion-mcp:v1'
MCP_SERVER_KEY = 'Uclusion'
SUPPORTED_CLIENTS = frozenset({'claude', 'cursor', 'codex'})
_UNCHECKED_MCP_DESCRIPTOR = object()
# Releases before J-all-369 installed lifecycle hooks for root-thread
# discovery. The inline relay now owns that authority directly, but these
# marker names remain part of the installer so an update can remove only the
# obsolete Uclusion-owned block without disturbing anybody else's hooks.
LEGACY_CODEX_HOOKS_MARKER = '# uclusion-codex-bridge-hooks:v1'
LEGACY_CODEX_HOOKS_END_MARKER = '# /uclusion-codex-bridge-hooks:v1'

SKILL_MARKER = '<!-- uclusion-skill:v1 -->'
SKILL_END_MARKER = '<!-- /uclusion-skill:v1 -->'
SKILL_REFERENCE_MARKER = '<!-- uclusion-skill-reference:v1 -->'
SKILL_REFERENCE_END_MARKER = '<!-- /uclusion-skill-reference:v1 -->'
WORKFLOW_ENV_PLACEHOLDER = '{{UCLUSION_CLI}}'
WORKFLOW_ASSET_PATHS = {
    'claude_stub': 'CLAUDE.md',
    'codex_stub': 'AGENTS.md',
    'cursor_stub': 'uclusion.mdc',
    'skill': 'skills/uclusion/SKILL.md',
    'pokes_reference': 'skills/uclusion/references/pokes.md',
    'operations_reference': 'skills/uclusion/references/operations.md',
    'openai_metadata': 'skills/uclusion/agents/openai.yaml',
}
# These digests bind the installer to one coherent workflow release. A host
# serving a partially-deployed asset set fails before any client mutation.
WORKFLOW_ASSET_SHA256 = {
    'claude_stub': 'b89451b4cf5dbba8199e2b2ac138e58250077415a1da6cac32e5e70ab03f425b',
    'codex_stub': '02ea82a01620a5909ea40ea33d0ed67a27f275b808d926e21f753cb51861135e',
    'cursor_stub': '2e4bf88903896ba312738f9a4ab7163582df99050b62f13e0e0324a6580a412f',
    'skill': '4ecccd5597a19de8913e2dd342ebadf0c9e765ced0b85cad099137960a58355e',
    'pokes_reference': '788d5b30b69c6aa09083b75e8784938be461382126ad37c5c345888ed9de45c1',
    'operations_reference': '2fe81054a9ad3e8803fc8d41674532766f8cebeda816acd92c46d791457ddf3e',
    'openai_metadata': 'ecf2759354ff3bbfd7178452a705650aff7a13352458bb20e1df122da7c30f40',
}
CLIENT_STUB_ASSET = {
    'claude': 'claude_stub',
    'codex': 'codex_stub',
    'cursor': 'cursor_stub',
}
SKILL_PACKAGE_ASSETS = (
    ('pokes_reference', os.path.join('references', 'pokes.md')),
    ('operations_reference', os.path.join('references', 'operations.md')),
    ('openai_metadata', os.path.join('agents', 'openai.yaml')),
    # Publish the entrypoint last so an interrupted refresh never exposes a
    # new SKILL.md before all files it routes to are durable.
    ('skill', 'SKILL.md'),
)


def get_scripts_base_url(env):
    """Return the base URL the helper scripts can be downloaded from."""
    if env == 'dev':
        return f'https://localhost:3000/scripts/'
    if env in ('stage', 'production'):
        return f'https://{env}.uclusion.com/scripts/'
    return 'https://production.uclusion.com/scripts/'


def get_api_base_url(env):
    """Return the API host the SSO endpoints live under for ``env``."""
    if env in ('dev', 'stage'):
        return f'{env}.api.uclusion.com/v1'
    return 'production.api.uclusion.com/v1'


# Same env-specific credential files the CLI and MCP proxy read; written by the
# user in setup step 1, before the installer runs in step 3.
CREDENTIALS_FILES = {
    'dev': 'dev_credentials',
    'stage': 'stage_credentials',
    'production': 'credentials',
}


def read_credentials(env):
    """Parse the key=value credentials file for ``env``; None when absent."""
    cred_path = os.path.join(
        os.path.expanduser('~'), '.uclusion', CREDENTIALS_FILES[env]
    )
    if not os.path.exists(cred_path):
        return None
    credentials = {}
    with open(cred_path, 'r', encoding='utf-8') as src:
        for line in src:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, value = line.split('=', 1)
                credentials[key.strip()] = value.strip()
    return credentials


def fetch_script_reinstall_version(env, workspace_id):
    """Return the current script_reinstall_version for this account, or None.

    This is the J-all-314 signal behind the web UI's reinstall banner: the
    backend persists the release that last changed the scripts and serves it
    from GET sso/app. Stamping it at install time (in the install path and the
    workspace config) is what later lets the MCP proxy and ``uclusion update
    --check`` compare installed-vs-current with a plain equality test. Any
    failure — missing credentials, offline, bad response — returns None so the
    install still succeeds; the version checks just stay silent until a
    versioned install exists.
    """
    try:
        credentials = read_credentials(env)
        if credentials is None:
            print("  ⚠️  No credentials file yet; installing without a version stamp.")
            return None
        api_url = get_api_base_url(env)
        login_body = json.dumps({
            'market_id': workspace_id,
            'client_secret': credentials['secret_key'],
            'client_id': credentials['secret_key_id'],
        }).encode('utf-8')
        login_request = urllib.request.Request(
            'https://sso.' + api_url + '/cli', data=login_body,
            headers={'Content-Type': 'application/json'}, method='POST'
        )
        with urllib.request.urlopen(login_request, timeout=HTTP_TIMEOUT) as response:
            token = json.loads(response.read().decode('utf-8'))['uclusion_token']
        app_url = 'https://sso.' + api_url + '/app?' + urllib.parse.urlencode(
            {'idToken': token}
        )
        with urllib.request.urlopen(app_url, timeout=HTTP_TIMEOUT) as response:
            app_info = json.loads(response.read().decode('utf-8'))
        version = app_info.get('script_reinstall_version')
        if not version or not re.fullmatch(r'[A-Za-z0-9._-]+', version):
            return None
        return version
    except Exception as err:
        print(f"  ⚠️  Could not fetch the current script version ({err}); "
              f"installing without a version stamp.")
        return None


def download_to(url, dest_path):
    print(f"  ⬇️  Downloading {url}")
    with urllib.request.urlopen(url, timeout=HTTP_TIMEOUT) as response:
        if response.status != 200:
            raise RuntimeError(f"Failed to download {url}: status {response.status}")
        with open(dest_path, 'wb') as out:
            shutil.copyfileobj(response, out)


def _validate_setup_bootstrap_pin_table():
    expected = {
        source_name
        for source_name, _installed_name, _symlink_name in SCRIPT_FILES
        if source_name != 'uclusionInstall.py'
    }
    if set(SETUP_BOOTSTRAP_SCRIPT_SHA256) != expected:
        raise RuntimeError(
            'setup bootstrap script pins do not match the installer bundle'
        )


def _validate_setup_bootstrap_script(source_name, path):
    try:
        with open(path, 'rb') as source:
            digest = hashlib.sha256(source.read()).hexdigest()
    except OSError as error:
        raise RuntimeError(
            f'setup bootstrap script {source_name} could not be read'
        ) from error
    if digest != SETUP_BOOTSTRAP_SCRIPT_SHA256.get(source_name):
        raise RuntimeError(
            f'setup bootstrap script {source_name} does not match this '
            'installer release'
        )


def validate_setup_script_bundle(scripts_dir):
    """Validate the setup scripts beside an installer before deployment."""
    _validate_setup_bootstrap_pin_table()
    for source_name in SETUP_BOOTSTRAP_SCRIPT_SHA256:
        _validate_setup_bootstrap_script(
            source_name, os.path.join(scripts_dir, source_name)
        )


def make_executable(path):
    current = os.stat(path).st_mode
    os.chmod(path, current | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)


def ensure_dir(path):
    """Create ``path`` and any missing parents. Always under ~/.local, so no sudo."""
    os.makedirs(path, exist_ok=True)


def install_file(src_path, dest_path):
    """Move ``src_path`` to ``dest_path`` and mark it executable."""
    shutil.move(src_path, dest_path)
    make_executable(dest_path)


def _fsync_file(path):
    """Flush one completed release file before its directory is published."""
    descriptor = os.open(path, os.O_RDONLY)
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def _fsync_directory(path):
    """Best-effort directory flush for filesystems that support it."""
    try:
        descriptor = os.open(path, os.O_RDONLY)
        try:
            os.fsync(descriptor)
        finally:
            os.close(descriptor)
    except OSError:
        # Windows and a few virtual filesystems do not allow directory fsync.
        pass


def create_symlink(target, link_path):
    """Create or replace a symlink at ``link_path`` pointing to ``target``."""
    temp_link = f'{link_path}.uclusion-{os.getpid()}-{uuid.uuid4().hex}'
    if os.path.lexists(temp_link):
        os.remove(temp_link)
    try:
        os.symlink(target, temp_link)
        os.replace(temp_link, link_path)
        _fsync_directory(os.path.dirname(link_path))
    finally:
        if os.path.lexists(temp_link):
            os.remove(temp_link)


def validate_python_script(path):
    """Compile a downloaded script before it can become part of an install."""
    with open(path, 'rb') as source:
        compile(source.read(), path, 'exec')


def warn_if_not_on_path(directory):
    """Print a hint if ``directory`` is not on ``PATH`` so symlinks aren't found."""
    target = os.path.normpath(directory)
    entries = [os.path.normpath(p) for p in os.environ.get('PATH', '').split(os.pathsep) if p]
    if target in entries:
        return
    print(f"  ⚠️  {directory} is not on your PATH; the 'uclusion' command won't be found.")
    print(f"      Add it, e.g.:  export PATH=\"{directory}:$PATH\"")


@contextmanager
def _exclusive_file_lock(lock_file):
    """Hold an exclusive advisory lock on an already-open binary file.

    Linux and macOS retain the existing ``flock`` behavior. Native Windows
    uses ``msvcrt.locking`` over the first byte instead; a lock byte is created
    once because Windows cannot lock a zero-length range.
    """
    if fcntl is not None:
        fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(lock_file.fileno(), fcntl.LOCK_UN)
        return

    if msvcrt is None:
        raise RuntimeError(
            'This Python platform provides neither fcntl nor msvcrt file locking.'
        )

    lock_file.seek(0, os.SEEK_END)
    if lock_file.tell() == 0:
        lock_file.write(b'\0')
        lock_file.flush()

    while True:
        lock_file.seek(0)
        try:
            msvcrt.locking(lock_file.fileno(), msvcrt.LK_NBLCK, 1)
            break
        except OSError as error:
            if (
                error.errno not in (errno.EACCES, errno.EAGAIN, errno.EDEADLK)
                and getattr(error, 'winerror', None) not in (33, 36)
            ):
                raise
            time.sleep(0.05)
    try:
        yield
    finally:
        lock_file.seek(0)
        msvcrt.locking(lock_file.fileno(), msvcrt.LK_UNLCK, 1)


@contextmanager
def install_lock():
    """Serialize release publication and activation across installer processes."""
    ensure_dir(SCRIPT_INSTALL_PREFIX)
    lock_path = os.path.join(SCRIPT_INSTALL_PREFIX, INSTALL_LOCK_FILE)
    with open(lock_path, 'a+b') as lock_file, _exclusive_file_lock(lock_file):
        yield


def validate_release_name(script_version):
    """Return a safe immutable release name or raise for reserved names."""
    if not isinstance(script_version, str) or not script_version:
        raise RuntimeError('Script version must be a non-empty string.')
    if not re.fullmatch(r'[A-Za-z0-9._-]+', script_version):
        raise RuntimeError(f'Unsafe script version: {script_version!r}')
    normalized = script_version.casefold()
    if (script_version in ('.', '..')
            or script_version.startswith('.')
            or normalized in RESERVED_RELEASE_NAMES
            or normalized.startswith(f'{UNVERSIONED_INSTALL_DIR}-')):
        raise RuntimeError(
            f'Script version {script_version!r} uses a reserved release name.'
        )
    return script_version


def _new_unversioned_release_name():
    """Return an unused name in the installer's reserved unversioned namespace."""
    while True:
        name = f'{UNVERSIONED_INSTALL_DIR}-{uuid.uuid4().hex}'
        if not os.path.lexists(os.path.join(SCRIPT_INSTALL_PREFIX, name)):
            return name


def _release_name_from_path(path):
    """Return the direct child release containing ``path``, when it is one."""
    prefix = os.path.realpath(SCRIPT_INSTALL_PREFIX)
    resolved = os.path.realpath(path)
    try:
        relative = os.path.relpath(resolved, prefix)
    except ValueError:
        return None
    if relative == os.pardir or relative.startswith(os.pardir + os.sep):
        return None
    name = relative.split(os.sep, 1)[0]
    if (not name or name in ('.', CURRENT_RELEASE_LINK)
            or name.startswith('.')):
        return None
    release_path = os.path.join(SCRIPT_INSTALL_PREFIX, name)
    if not os.path.isdir(release_path) or os.path.islink(release_path):
        return None
    return name


def _symlink_destination(link_path):
    """Return an absolute path represented by ``link_path``, or None."""
    if not os.path.islink(link_path):
        return None
    target = os.readlink(link_path)
    if not os.path.isabs(target):
        target = os.path.join(os.path.dirname(link_path), target)
    return os.path.normpath(target)


def _current_link_path():
    return os.path.join(SCRIPT_INSTALL_PREFIX, CURRENT_RELEASE_LINK)


def _public_link_path(symlink_name):
    return os.path.join(SYMLINK_DIR, symlink_name)


def _public_link_target(installed_name):
    return os.path.join(
        SCRIPT_INSTALL_PREFIX, CURRENT_RELEASE_LINK, 'bin', installed_name
    )


def _current_release_name():
    current_path = _current_link_path()
    destination = _symlink_destination(current_path)
    if destination is None:
        return None
    return _release_name_from_path(destination)


def _referenced_release_names():
    """Return every release reached by the current or a managed public link."""
    referenced = set()
    paths = [_current_link_path()]
    paths.extend(
        _public_link_path(symlink_name)
        for _source_name, _installed_name, symlink_name in SCRIPT_FILES
    )
    for path in paths:
        destination = _symlink_destination(path)
        if destination is None:
            continue
        release_name = _release_name_from_path(destination)
        if release_name is not None:
            referenced.add(release_name)
    return referenced


def _legacy_release_name():
    """Find the one release targeted by pre-``current`` public symlinks."""
    legacy_releases = set()
    current_prefix = os.path.normpath(_current_link_path()) + os.sep
    for _source_name, installed_name, symlink_name in SCRIPT_FILES:
        link_path = _public_link_path(symlink_name)
        destination = _symlink_destination(link_path)
        if destination is None:
            continue
        normalized = os.path.normpath(destination)
        if normalized.startswith(current_prefix):
            continue
        release_name = _release_name_from_path(destination)
        if release_name is None:
            continue
        expected_path = os.path.join(
            SCRIPT_INSTALL_PREFIX, release_name, 'bin', installed_name
        )
        if os.path.realpath(destination) == os.path.realpath(expected_path):
            legacy_releases.add(release_name)
    if len(legacy_releases) > 1:
        names = ', '.join(sorted(legacy_releases))
        raise RuntimeError(
            'Cannot safely migrate public links that reference multiple '
            f'Uclusion releases: {names}'
        )
    return next(iter(legacy_releases), None)


def _preflight_activation_paths():
    """Refuse user-owned paths before downloading or changing a release."""
    current_path = _current_link_path()
    if os.path.lexists(current_path) and not os.path.islink(current_path):
        raise RuntimeError(
            f'Refusing to replace non-symlink release pointer {current_path}'
        )
    for _source_name, _installed_name, symlink_name in SCRIPT_FILES:
        link_path = _public_link_path(symlink_name)
        if os.path.lexists(link_path) and not os.path.islink(link_path):
            raise RuntimeError(f'Refusing to replace non-symlink {link_path}')


def _prepare_public_links_for_atomic_switch():
    """Route existing commands through the old ``current`` release.

    Legacy installs linked each command directly to a release. Creating
    ``current`` for that release first, then converting those links one at a
    time, cannot change what any command executes. A termination anywhere in
    this migration therefore leaves the old release consistently usable.
    """
    current_release = _current_release_name()
    if current_release is None:
        current_release = _legacy_release_name()
        if current_release is None:
            return
        create_symlink(current_release, _current_link_path())

    for _source_name, installed_name, symlink_name in SCRIPT_FILES:
        link_path = _public_link_path(symlink_name)
        if not os.path.islink(link_path):
            continue
        old_release_file = os.path.join(
            SCRIPT_INSTALL_PREFIX, current_release, 'bin', installed_name
        )
        # A legacy release can predate a newly added script. Leave that absent
        # command alone until the complete new release becomes current.
        if os.path.isfile(old_release_file):
            target = _public_link_target(installed_name)
            if _symlink_destination(link_path) != os.path.normpath(target):
                create_symlink(target, link_path)


def _repair_all_public_links():
    """Expose every script through the stable current/bin path."""
    for _source_name, installed_name, symlink_name in SCRIPT_FILES:
        link_path = _public_link_path(symlink_name)
        target = _public_link_target(installed_name)
        if (_symlink_destination(link_path) == os.path.normpath(target)):
            continue
        create_symlink(target, link_path)
        print(f"  🔗 Linked {link_path} -> {target}")


def prune_old_install_dirs(keep_dir_name, retain_previous=1):
    """Keep the active release plus the newest ``retain_previous`` releases.

    Every release referenced by ``current`` or any managed public symlink is
    protected, even when it is older than the retained rollback release. This
    also protects a legacy direct link after a partially completed migration.
    """
    if not os.path.isdir(SCRIPT_INSTALL_PREFIX):
        return
    protected = _referenced_release_names()
    protected.add(keep_dir_name)
    previous = []
    for entry in os.listdir(SCRIPT_INSTALL_PREFIX):
        entry_path = os.path.join(SCRIPT_INSTALL_PREFIX, entry)
        if (entry in protected or entry == CURRENT_RELEASE_LINK
                or entry.startswith('.') or not os.path.isdir(entry_path)
                or os.path.islink(entry_path)):
            continue
        previous.append((os.path.getmtime(entry_path), entry_path))
    previous.sort(reverse=True)
    for _mtime, entry_path in previous[retain_previous:]:
        shutil.rmtree(entry_path, ignore_errors=True)
        print(f"  🧹 Removed old install {entry_path}")


def install_scripts(env, script_version, *, setup_bootstrap=False):
    """Publish a complete immutable release and atomically make it current."""
    base_url = get_scripts_base_url(env)
    with install_lock():
        if setup_bootstrap:
            _validate_setup_bootstrap_pin_table()
        version_dir_name = (
            _new_unversioned_release_name()
            if not script_version
            else validate_release_name(script_version)
        )
        version_dir = os.path.join(SCRIPT_INSTALL_PREFIX, version_dir_name)
        install_dir = os.path.join(version_dir, 'bin')
        print(f"📦 Installing scripts from {base_url}")
        print(f"    install dir : {install_dir}")
        print(f"    symlink dir : {SYMLINK_DIR}")

        ensure_dir(SYMLINK_DIR)
        _preflight_activation_paths()
        staging_dir = tempfile.mkdtemp(
            prefix='.staging-', dir=SCRIPT_INSTALL_PREFIX
        )
        staging_bin = os.path.join(staging_dir, 'bin')
        ensure_dir(staging_bin)
        try:
            # Nothing outside staging changes until every script validates.
            for source_name, installed_name, _symlink_name in SCRIPT_FILES:
                staging_path = os.path.join(staging_bin, installed_name)
                if setup_bootstrap and source_name == 'uclusionInstall.py':
                    shutil.copyfile(os.path.abspath(__file__), staging_path)
                else:
                    download_to(base_url + source_name, staging_path)
                    if setup_bootstrap:
                        _validate_setup_bootstrap_script(
                            source_name, staging_path
                        )
                validate_python_script(staging_path)
                make_executable(staging_path)
                _fsync_file(staging_path)
            _fsync_directory(staging_bin)
            _fsync_directory(staging_dir)

            if os.path.lexists(version_dir):
                if not os.path.isdir(version_dir) or os.path.islink(version_dir):
                    raise RuntimeError(
                        f'Existing release path is not a directory: {version_dir}'
                    )
                if not os.path.isdir(install_dir) or os.path.islink(install_dir):
                    raise RuntimeError(
                        f'Release {version_dir_name} has an invalid bin '
                        'directory; publish a new script version.'
                    )
                missing = [
                    installed_name
                    for _source_name, installed_name, _symlink_name in SCRIPT_FILES
                    if (not os.path.isfile(
                            os.path.join(install_dir, installed_name))
                        or os.path.islink(
                            os.path.join(install_dir, installed_name)))
                ]
                if missing:
                    raise RuntimeError(
                        f'Release {version_dir_name} is incomplete for this '
                        f'installer (missing {", ".join(missing)}); publish a '
                        'new script version.'
                    )
                existing_paths = []
                for _source_name, installed_name, _symlink_name in SCRIPT_FILES:
                    existing_path = os.path.join(install_dir, installed_name)
                    staged_path = os.path.join(staging_bin, installed_name)
                    if not filecmp.cmp(
                            existing_path, staged_path, shallow=False):
                        raise RuntimeError(
                            f'Release {version_dir_name} is already installed '
                            'with different contents; publish a new script '
                            'version.'
                        )
                    existing_paths.append(existing_path)
                # Byte-identical same-version installs repair executable modes
                # without replacing any release file or directory.
                for existing_path in existing_paths:
                    make_executable(existing_path)
                    _fsync_file(existing_path)
                shutil.rmtree(staging_dir)
                staging_dir = None
            else:
                # Publication is one rename. ``current`` cannot observe a
                # partial release because it is not changed until afterwards.
                os.replace(staging_dir, version_dir)
                staging_dir = None
                _fsync_directory(SCRIPT_INSTALL_PREFIX)

            for _source_name, installed_name, _symlink_name in SCRIPT_FILES:
                print(f"  ✅ Installed {os.path.join(install_dir, installed_name)}")

            # Existing public commands are first routed through the old
            # pointer without changing their resolved files. The sole commit
            # point is the atomic replacement of ``current`` below.
            _prepare_public_links_for_atomic_switch()
            create_symlink(version_dir_name, _current_link_path())
            _repair_all_public_links()
        finally:
            if staging_dir is not None:
                shutil.rmtree(staging_dir, ignore_errors=True)

        prune_old_install_dirs(version_dir_name, retain_previous=1)
        warn_if_not_on_path(SYMLINK_DIR)


def token_audit_default_port(workspace_id):
    """Return a stable, non-privileged collector port for a workspace."""
    digest = hashlib.sha256(workspace_id.encode('utf-8')).digest()
    offset = int.from_bytes(digest[:4], 'big') % TOKEN_AUDIT_PORT_SPAN
    return TOKEN_AUDIT_DEFAULT_PORT_BASE + offset


def write_uclusion_config(workspace_id, view_id, config_path, script_version=None,
                           token_audit_enabled=None, work_claims_enabled=None):
    """Write or refresh the workspace config, preserving user customizations.

    Merging (rather than rewriting) matters because ``uclusion update`` reruns
    the installer over existing installs: keys the user tuned (sourcesList,
    extensionsList, ...) must survive. Only the identity keys (workspaceId,
    todoViewId) are authoritative from the arguments, defaults fill in only
    when missing, and ``scriptReinstallVersion`` stamps which release wrote
    this config so stale project installs are detectable (T-all-2410).

    ``token_audit_enabled`` is deliberately tri-state. Explicit True/False
    updates the preference selected by the user; None preserves an existing
    preference and defaults a new install to off. The returned copy is used to
    configure client-specific collection without rereading the file.

    ``work_claims_enabled`` follows the same tri-state contract for the opt-in
    work claim lock; the merged boolean is returned alongside the token-audit
    settings so registration passes the proxy flag without rereading.
    """
    print(f"🗂  Writing workspace config to {config_path}")
    logical_path = os.path.abspath(os.path.expanduser(config_path))
    target_path = _config_write_target(logical_path)
    target_text, target_signature = _read_text_snapshot(target_path)
    # Older installs wrote plain uclusion.json regardless of environment
    # (S-all-163); when the env-specific target does not exist yet, seed the
    # merge from that legacy file so user customizations migrate.
    merge_path = config_path
    merge_text = target_text
    merge_signature = target_signature
    if target_signature is None:
        legacy_path = os.path.join(os.path.dirname(config_path), 'uclusion.json')
        if legacy_path != config_path and os.path.exists(legacy_path):
            merge_path = legacy_path
            legacy_target = _config_write_target(legacy_path)
            merge_text, merge_signature = _read_text_snapshot(legacy_target)
            print(f"  📎 Migrating settings from legacy {legacy_path}")
    config = {}
    if merge_signature is not None:
        try:
            existing = json.loads(merge_text)
            if not isinstance(existing, dict):
                raise RuntimeError(
                    f'{merge_path} top-level value must be a JSON object'
                )
            config = existing
        except json.JSONDecodeError as err:
            raise RuntimeError(
                f'{merge_path} is not valid JSON: {err}'
            ) from err
    defaults = {
        'extensionsList': ['js', 'py'],
        'sourcesList': ['./src'],
        'uclusionMDFileType': 'export',
        'uclusionMDFolderPath': '~/.uclusion/export',
    }
    for key, value in defaults.items():
        config.setdefault(key, value)
    config['workspaceId'] = workspace_id
    if view_id is not None and view_id != workspace_id:
        config['todoViewId'] = view_id
    else:
        config.pop('todoViewId', None)
    if script_version:
        config['scriptReinstallVersion'] = script_version
    else:
        config.pop('scriptReinstallVersion', None)
    token_audit_value = config.get('tokenAudit')
    if isinstance(token_audit_value, dict):
        token_audit = token_audit_value
    elif isinstance(token_audit_value, bool):
        token_audit = {'enabled': token_audit_value}
    else:
        token_audit = {}
    if token_audit_enabled is not None:
        token_audit['enabled'] = bool(token_audit_enabled)
    elif not isinstance(token_audit.get('enabled'), bool):
        token_audit['enabled'] = False
    port = token_audit.get('port')
    if not isinstance(port, int) or isinstance(port, bool) or not 1024 <= port <= 65535:
        token_audit['port'] = token_audit_default_port(workspace_id)
    config['tokenAudit'] = token_audit
    if work_claims_enabled is not None:
        config['workClaims'] = bool(work_claims_enabled)
    elif not isinstance(config.get('workClaims'), bool):
        config['workClaims'] = False
    updated = json.dumps(config, indent=2) + '\n'
    with config_file_lock(logical_path):
        atomic_write_text(
            logical_path,
            updated,
            target_text,
            target_path,
            target_signature,
        )
    print(f"  ✅ Wrote {config_path}")
    return dict(token_audit), config['workClaims']


def update_token_audit_client_config(config_path, source=None, managed_env=None):
    """Persist Claude collection ownership after settings were merged.

    Ownership metadata lets ``--no-token-audit`` remove only values previously
    written by Uclusion. A user-modified value is never removed.
    """
    logical_path = os.path.abspath(os.path.expanduser(config_path))
    target_path = _config_write_target(logical_path)
    existing, signature = _read_text_snapshot(target_path)
    try:
        config = json.loads(existing)
    except json.JSONDecodeError as err:
        raise RuntimeError(
            f'could not record Claude token-audit settings in '
            f'{config_path}: {err}'
        ) from err
    if not isinstance(config, dict):
        raise RuntimeError(f'{config_path} top-level value must be a JSON object')
    token_audit = config.get('tokenAudit')
    if not isinstance(token_audit, dict):
        token_audit = {'enabled': False}
        config['tokenAudit'] = token_audit
    if source is None:
        token_audit.pop('claudeSource', None)
    else:
        token_audit['claudeSource'] = source
    if managed_env:
        token_audit['claudeManagedEnv'] = dict(managed_env)
    else:
        token_audit.pop('claudeManagedEnv', None)
    updated = json.dumps(config, indent=2) + '\n'
    with config_file_lock(logical_path):
        atomic_write_text(
            logical_path, updated, existing, target_path, signature
        )


def _setup_identifier(value):
    return (
        isinstance(value, str)
        and 1 <= len(value) <= 128
        and re.fullmatch(r'[A-Za-z0-9_-]+', value) is not None
    )


def _setup_receipt_location(path, environment):
    if environment not in CONFIG_FILES or not isinstance(path, str):
        raise ValueError('invalid setup receipt location')
    candidate = os.path.abspath(os.path.expanduser(path))
    expected_dir = os.path.abspath(os.path.join(
        UCLUSION_HOME, 'setup-receipts', environment
    ))
    if (
        candidate != path
        or os.path.dirname(candidate) != expected_dir
        or re.fullmatch(r'[0-9a-f]{32}\.json', os.path.basename(candidate)) is None
    ):
        raise ValueError('invalid setup receipt location')
    return candidate


def _expected_setup_receipt_path(environment, client, project_dir=None):
    scope = 'project' if project_dir is not None else 'global'
    target = '\0'.join((
        environment,
        client,
        scope,
        os.path.abspath(project_dir) if project_dir is not None else '',
    ))
    target_id = hashlib.sha256(target.encode('utf-8')).hexdigest()[:32]
    return os.path.join(
        UCLUSION_HOME, 'setup-receipts', environment, target_id + '.json'
    )


def _assert_setup_receipt_target(path, environment, client, project_dir=None):
    candidate = _setup_receipt_location(path, environment)
    if candidate != _expected_setup_receipt_path(
        environment, client, project_dir
    ):
        raise ValueError('setup receipt does not match the selected target')
    return candidate


def cleanup_setup_receipt(path, environment, workspace_id, view_id):
    """Best-effort removal of one exact, IDs-only setup receipt."""
    try:
        candidate = _setup_receipt_location(path, environment)
        before = os.lstat(candidate)
        if not stat.S_ISREG(before.st_mode):
            return False
        flags = os.O_RDONLY
        if hasattr(os, 'O_NOFOLLOW'):
            flags |= os.O_NOFOLLOW
        descriptor = os.open(candidate, flags)
        try:
            opened = os.fstat(descriptor)
            if not stat.S_ISREG(opened.st_mode):
                return False
            with os.fdopen(descriptor, 'r', encoding='utf-8') as source:
                descriptor = None
                content = source.read(4097)
        finally:
            if descriptor is not None:
                os.close(descriptor)
        if len(content) > 4096:
            return False
        receipt = json.loads(content)
        if (
            not isinstance(receipt, dict)
            or set(receipt) != {'setup_id', 'workspace_id', 'view_id'}
            or not all(_setup_identifier(receipt.get(key)) for key in receipt)
            or receipt['workspace_id'] != workspace_id
            or receipt['view_id'] != view_id
        ):
            return False
        current = os.lstat(candidate)
        if (
            not stat.S_ISREG(current.st_mode)
            or (current.st_dev, current.st_ino) != (opened.st_dev, opened.st_ino)
        ):
            return False
        os.remove(candidate)
        return True
    except FileNotFoundError:
        return True
    except (OSError, UnicodeError, json.JSONDecodeError, ValueError):
        return False


def _runtime_launcher_values(arguments):
    if len(arguments) < 5:
        raise ValueError('invalid setup runtime launcher arguments')
    environment, receipt_path, view_id = arguments[:3]
    proxy_args = arguments[3:]
    if (
        environment not in CONFIG_FILES
        or proxy_args[0] != MCP_PROXY_SYMLINK_PATH
        or not _setup_identifier(proxy_args[1])
        or not _setup_identifier(view_id)
    ):
        raise ValueError('invalid setup runtime launcher arguments')
    proxy_tail = proxy_args[2:]
    if environment == 'production':
        if proxy_tail and not proxy_tail[0].startswith('--'):
            raise ValueError('invalid setup runtime launcher environment')
    elif not proxy_tail or proxy_tail[0] != environment:
        raise ValueError('invalid setup runtime launcher environment')
    return environment, receipt_path, view_id, proxy_args


def cleanup_runtime_receipt(arguments):
    """Consume one validated setup runtime launcher's recovery receipt."""
    environment, receipt_path, view_id, proxy_args = (
        _runtime_launcher_values(arguments)
    )
    cleanup_setup_receipt(
        receipt_path, environment, proxy_args[1], view_id
    )
    return 0


def launch_runtime_proxy(arguments):
    """Clean setup recovery state, then become the ordinary MCP proxy."""
    environment, receipt_path, view_id, proxy_args = (
        _runtime_launcher_values(arguments)
    )
    cleanup_setup_receipt(
        receipt_path, environment, proxy_args[1], view_id
    )
    os.execv(sys.executable, [sys.executable] + proxy_args)
    return 0


def runtime_mcp_descriptor(workspace_id, env, token_audit=None,
                           token_audit_client=None, work_claims=False,
                           setup_receipt_path=None, setup_view_id=None):
    """Describe the existing credential-backed runtime MCP command."""
    proxy_args = [MCP_PROXY_SYMLINK_PATH, workspace_id]
    if env is not None:
        proxy_args.append(env)
    if token_audit and token_audit.get('enabled'):
        proxy_args.extend([
            '--token-audit',
            '--token-audit-port', str(token_audit['port']),
        ])
        source = token_audit.get('claudeSource')
        if source in ('otel', 'transcript'):
            proxy_args.extend(['--token-audit-source', source])
        if token_audit_client is not None:
            proxy_args.extend(['--token-audit-client', token_audit_client])
    if work_claims:
        proxy_args.append('--work-claims')
    if setup_receipt_path is None and setup_view_id is None:
        return {'command': 'python3', 'args': proxy_args}
    if setup_receipt_path is None or not _setup_identifier(setup_view_id):
        raise ValueError('setup runtime descriptor requires receipt and view ID')
    environment = env or 'production'
    receipt_path = _setup_receipt_location(
        setup_receipt_path, environment
    )
    return {
        'command': 'python3',
        'args': [
            INSTALLER_SYMLINK_PATH,
            RUNTIME_PROXY_MODE,
            environment,
            receipt_path,
            setup_view_id,
        ] + proxy_args,
    }


def setup_mcp_descriptor(env, client, project_dir=None):
    """Describe one credential-free setup MCP registration."""
    if client not in SUPPORTED_CLIENTS:
        raise ValueError(f'unsupported setup client: {client}')
    scope = 'project' if project_dir is not None else 'global'
    args = [
        SETUP_MCP_SYMLINK_PATH,
        env or 'production',
        '--client', client,
        '--scope', scope,
    ]
    if project_dir is not None:
        args.extend(['--project-dir', os.path.abspath(project_dir)])
    return {'command': 'python3', 'args': args}


def _validate_mcp_descriptor(descriptor):
    if (
        not isinstance(descriptor, dict)
        or set(descriptor) != {'command', 'args'}
        or not isinstance(descriptor.get('command'), str)
        or not descriptor['command']
        or not isinstance(descriptor.get('args'), list)
        or not all(isinstance(arg, str) for arg in descriptor['args'])
    ):
        raise ValueError('invalid MCP command descriptor')
    return {'command': descriptor['command'], 'args': list(descriptor['args'])}


def _toml_basic_string(value):
    """Render one validated MCP string with TOML-compatible JSON escaping."""
    return json.dumps(value, ensure_ascii=False)


def _assert_expected_json_descriptor(servers, expected_descriptor, path):
    if expected_descriptor is _UNCHECKED_MCP_DESCRIPTOR:
        return
    if expected_descriptor is None:
        if MCP_SERVER_KEY in servers:
            raise RuntimeError(
                f'{path} already defines a Uclusion MCP server; refusing setup bootstrap'
            )
        return
    expected_descriptor = _validate_mcp_descriptor(expected_descriptor)
    if (
        MCP_SERVER_KEY not in servers
        or servers[MCP_SERVER_KEY] != expected_descriptor
    ):
        raise RuntimeError(
            f'{path} setup MCP descriptor changed or is missing; refusing replacement'
        )


def register_mcp_json(path, label, workspace_id, env, require_existing,
                      token_audit=None, token_audit_client=None,
                      work_claims=False, descriptor=None,
                      expected_descriptor=_UNCHECKED_MCP_DESCRIPTOR):
    """Register the Uclusion MCP server in a JSON config at ``path``.

    Handles every ``{"mcpServers": {...}}`` surface: the global Cursor
    ``mcp.json`` and Claude Code ``~/.claude.json``, plus the project-scoped
    ``.mcp.json`` / ``.cursor/mcp.json`` written by a project-level install.
    ``require_existing`` skips an absent file. Interactive global installs use
    that guard for clients that have not created their own config yet; explicit
    client selection, setup bootstrap, and project installs may instead pass
    ``require_existing=False`` and create the selected config.
    """
    exists = os.path.exists(path)
    if require_existing and not exists:
        print(f"ℹ️  No {path} found; skipping {label} MCP server registration.")
        return False

    print(f"🧩 Registering Uclusion MCP server in {path}")
    config = {}
    target_path = _config_write_target(path)
    existing_text, existing_signature = _read_text_snapshot(target_path)
    if exists:
        try:
            config = json.loads(existing_text)
        except json.JSONDecodeError as err:
            raise RuntimeError(f'{path} is not valid JSON: {err}') from err
        if not isinstance(config, dict):
            raise RuntimeError(f'{path} top-level value must be a JSON object')

    if descriptor is None:
        descriptor = runtime_mcp_descriptor(
            workspace_id,
            env,
            token_audit,
            token_audit_client,
            work_claims,
        )
    descriptor = _validate_mcp_descriptor(descriptor)

    servers = config.setdefault('mcpServers', {})
    if not isinstance(servers, dict):
        raise RuntimeError(f"'mcpServers' in {path} must be a JSON object")

    _assert_expected_json_descriptor(servers, expected_descriptor, path)

    servers[MCP_SERVER_KEY] = descriptor

    updated = json.dumps(config, indent=2) + '\n'
    if updated != existing_text:
        with config_file_lock(path):
            atomic_write_text(
                path,
                updated,
                existing_text,
                target_path,
                existing_signature,
            )
    print(f"  ✅ Updated {path}")
    return True


def _is_cursor_poke_drain_hook(entry):
    if not isinstance(entry, dict):
        return False
    command = entry.get('command')
    if not isinstance(command, str):
        return False
    expected = os.path.join(SYMLINK_DIR, CURSOR_POKE_DRAIN_SYMLINK_NAME)
    return os.path.normcase(os.path.normpath(command)) == os.path.normcase(
        os.path.normpath(expected)
    )


def remove_cursor_poke_drain_hook(hooks_path=CURSOR_HOOKS_PATH):
    """Remove Uclusion Poke drain entries from a Cursor hooks.json.

    Existing non-Uclusion hooks and all unrelated configuration are preserved.
    A missing file or a file without a managed entry is left unchanged.
    """
    logical_path = os.path.abspath(os.path.expanduser(hooks_path))
    with install_lock():
        target_path = _config_write_target(logical_path)
        existing, signature = _read_text_snapshot(target_path)
        if signature is None:
            return False
        if CURSOR_POKE_DRAIN_HOOK_TOKEN not in existing:
            return False
        try:
            config = json.loads(existing)
        except json.JSONDecodeError as err:
            raise RuntimeError(
                f'{hooks_path} is not valid JSON: {err}'
            ) from err
        if not isinstance(config, dict):
            raise RuntimeError(
                f'{hooks_path} top-level value must be a JSON object'
            )

        hooks = config.get('hooks')
        if hooks is None:
            return False
        if not isinstance(hooks, dict):
            raise RuntimeError(f"'hooks' in {hooks_path} must be a JSON object")
        stop_hooks = hooks.get('stop')
        if stop_hooks is None:
            return False
        if not isinstance(stop_hooks, list):
            raise RuntimeError(
                f"'hooks.stop' in {hooks_path} must be a JSON array"
            )

        retained = [
            entry for entry in stop_hooks
            if not _is_cursor_poke_drain_hook(entry)
        ]
        if len(retained) == len(stop_hooks):
            return False
        version = config.get('version')
        if type(version) is not int or version != 1:
            raise RuntimeError(
                f'{hooks_path} has unsupported hooks version '
                f'{version!r}; expected 1'
            )
        if retained:
            hooks['stop'] = retained
        else:
            hooks.pop('stop')
        updated = json.dumps(config, indent=2) + '\n'
        atomic_write_text(
            logical_path,
            updated,
            existing,
            target_path,
            signature,
        )

    print(f"  ✅ Removed Uclusion Poke drain stop hook from {hooks_path}")
    return True


def add_claude_permissions(settings_path):
    """Merge the Uclusion allow rule into a Claude Code settings file (T-all-2299).

    ``settings_path`` is ``~/.claude/settings.json`` for a global install and
    ``<project>/.claude/settings.local.json`` for a project-level one -
    settings.local.json is the per-machine file Claude Code itself writes
    approved permissions to, so each collaborator picks the rule up by running
    the installer rather than through a committed file.
    """
    print(f"🔓 Allowing Uclusion MCP tools in {settings_path}")
    logical_path = os.path.abspath(os.path.expanduser(settings_path))
    target_path = _config_write_target(logical_path)
    existing, signature = _read_text_snapshot(target_path)
    config = {}
    if signature is not None:
        try:
            config = json.loads(existing)
        except json.JSONDecodeError as err:
            raise RuntimeError(
                f'{settings_path} is not valid JSON: {err}'
            ) from err
        if not isinstance(config, dict):
            raise RuntimeError(
                f'{settings_path} top-level value must be a JSON object'
            )

    permissions = config.setdefault('permissions', {})
    if not isinstance(permissions, dict):
        raise RuntimeError(
            f"'permissions' in {settings_path} must be a JSON object"
        )
    allow = permissions.setdefault('allow', [])
    if not isinstance(allow, list):
        raise RuntimeError(
            f"'permissions.allow' in {settings_path} must be a JSON array"
        )
    if CLAUDE_ALLOW_RULE in allow:
        print(f"  ⏭  {settings_path} already allows {CLAUDE_ALLOW_RULE}.")
        return True
    allow.insert(0, CLAUDE_ALLOW_RULE)

    updated = json.dumps(config, indent=2) + '\n'
    with config_file_lock(logical_path):
        atomic_write_text(
            logical_path, updated, existing, target_path, signature
        )
    print(f"  ✅ Added {CLAUDE_ALLOW_RULE} to {settings_path}")
    return True


def claude_token_audit_env(port):
    """Return the privacy-minimized Claude Code OTel log configuration."""
    return {
        'CLAUDE_CODE_ENABLE_TELEMETRY': '1',
        'OTEL_LOGS_EXPORTER': 'otlp',
        'OTEL_EXPORTER_OTLP_LOGS_PROTOCOL': 'http/json',
        'OTEL_EXPORTER_OTLP_LOGS_ENDPOINT': f'http://127.0.0.1:{port}/v1/logs',
        'OTEL_LOGS_EXPORT_INTERVAL': '1000',
        'OTEL_LOG_USER_PROMPTS': '0',
        'OTEL_LOG_ASSISTANT_RESPONSES': '0',
        'OTEL_LOG_TOOL_DETAILS': '0',
        'OTEL_LOG_TOOL_CONTENT': '0',
        'OTEL_LOG_RAW_API_BODIES': '0',
    }


def _is_claude_token_audit_policy_key(key):
    """Whether a Claude env key can govern the log stream or its content."""
    if key in CLAUDE_TOKEN_AUDIT_CONFLICT_KEYS:
        return True
    if key.startswith(('OTEL_LOG_', 'OTEL_LOGS_', 'OTEL_EXPORTER_OTLP_LOGS_')):
        return True
    if key.startswith('OTEL_EXPORTER_OTLP_'):
        # Signal-specific metrics/traces settings can safely coexist with the
        # Uclusion logs receiver. Generic exporter settings affect logs too.
        suffix = key[len('OTEL_EXPORTER_OTLP_'):]
        return not suffix.startswith(('METRICS_', 'TRACES_'))
    return False


def claude_token_audit_hook_command(environment, workspace_id, source, port):
    """Build the command shared by Claude marker and lifecycle hooks."""
    command = [
        TOKEN_AUDIT_SYMLINK_PATH,
        'hook',
        '--environment', environment or 'production',
        '--workspace-id', workspace_id,
        '--source', source,
        '--port', str(port),
    ]
    return ' '.join(shlex.quote(part) for part in command)


def _is_claude_token_audit_handler(handler):
    if not isinstance(handler, dict):
        return False
    command = handler.get('command')
    if not isinstance(command, str):
        return False
    try:
        parts = shlex.split(command)
    except ValueError:
        return False
    return (
        len(parts) >= 2
        and os.path.basename(parts[0]) == TOKEN_AUDIT_SYMLINK_NAME
        and parts[1] == 'hook'
    )


def _remove_claude_token_audit_hooks(hooks):
    """Remove only Uclusion-owned handlers, retaining mixed hook groups."""
    for event, groups in list(hooks.items()):
        if not isinstance(groups, list):
            continue
        retained_groups = []
        removed_from_event = False
        for group in groups:
            if not isinstance(group, dict):
                retained_groups.append(group)
                continue
            handlers = group.get('hooks')
            if not isinstance(handlers, list):
                retained_groups.append(group)
                continue
            retained_handlers = [
                handler for handler in handlers
                if not _is_claude_token_audit_handler(handler)
            ]
            removed_owned_handler = len(retained_handlers) != len(handlers)
            removed_from_event = removed_from_event or removed_owned_handler
            if retained_handlers or not removed_owned_handler:
                if removed_owned_handler:
                    group = dict(group)
                    group['hooks'] = retained_handlers
                retained_groups.append(group)
        if retained_groups or not removed_from_event:
            hooks[event] = retained_groups
        else:
            hooks.pop(event, None)


def configure_claude_token_audit(settings_path, enabled, environment,
                                 workspace_id, port, managed_env=None):
    """Merge or remove Claude token-audit settings without claiming user data.

    A clean Claude settings file uses OTel logs over localhost HTTP/JSON. If a
    relevant telemetry or content-policy value already exists and was not
    recorded as Uclusion-owned, the existing policy is preserved wholesale and
    hooks select transcript collection instead. The return value contains the
    chosen source and the exact env values Uclusion owns for later cleanup.
    Claude's ``disableAllHooks`` setting is a hard boundary: without hooks the
    collector cannot bind usage to a job or observe bucket and handoff markers,
    so the function cleans up prior Uclusion-owned settings and reports that
    Claude auditing is unavailable instead of pretending telemetry is usable.
    """
    print(
        f"📊 {'Configuring' if enabled else 'Disabling'} Claude token audit "
        f"in {settings_path}"
    )
    logical_path = os.path.abspath(os.path.expanduser(settings_path))
    target_path = _config_write_target(logical_path)
    existing, signature = _read_text_snapshot(target_path)
    exists = signature is not None
    if not exists and not enabled:
        return {'source': None, 'managedEnv': {}}
    config = {}
    if exists:
        try:
            config = json.loads(existing)
        except json.JSONDecodeError as err:
            raise RuntimeError(
                f'{settings_path} is not valid JSON: {err}'
            ) from err
        if not isinstance(config, dict):
            raise RuntimeError(
                f'{settings_path} top-level value must be a JSON object'
            )

    existing_hooks = config.get('hooks')
    if existing_hooks is None:
        hooks = {}
    elif isinstance(existing_hooks, dict):
        hooks = existing_hooks
    else:
        raise RuntimeError(
            f"'hooks' in {settings_path} must be a JSON object"
        )
    for event, _matcher in CLAUDE_TOKEN_AUDIT_HOOK_EVENTS:
        groups = hooks.get(event)
        if groups is not None and not isinstance(groups, list):
            raise RuntimeError(
                f"'hooks.{event}' in {settings_path} must be a JSON array"
            )

    existing_env = config.get('env')
    env_is_object = existing_env is None or isinstance(existing_env, dict)
    env = {} if existing_env is None else existing_env
    owned = managed_env if isinstance(managed_env, dict) else {}
    owned = {
        key: value for key, value in owned.items()
        if isinstance(key, str) and isinstance(value, str)
    }

    def remove_owned_values():
        if not isinstance(env, dict):
            return
        for key, owned_value in owned.items():
            if env.get(key) == owned_value:
                env.pop(key, None)

    _remove_claude_token_audit_hooks(hooks)
    if not enabled:
        remove_owned_values()
        source = None
        next_owned = {}
        available = True
    elif config.get('disableAllHooks') is True:
        remove_owned_values()
        source = None
        next_owned = {}
        available = False
        print(
            "  ⚠️  Claude settings contain disableAllHooks=true. "
            "Uclusion token audit needs hooks to bind usage to jobs and "
            "buckets, so Claude token audit was not enabled. Remove that "
            "setting (or set it to false) and reinstall to enable auditing."
        )
    else:
        available = True
        conflicts = not env_is_object or any(
            key in config for key in CLAUDE_TOKEN_AUDIT_SETTINGS_POLICY_KEYS
        )
        if isinstance(env, dict):
            conflicts = conflicts or any(
                _is_claude_token_audit_policy_key(key)
                and not (key in owned and env[key] == owned[key])
                for key in env
            )
        if conflicts:
            # Our per-log settings would override a user's generic exporter,
            # so remove only values we still own and leave their policy intact.
            remove_owned_values()
            source = 'transcript'
            next_owned = {}
            print(
                "  ℹ️  Preserving existing Claude telemetry policy; "
                "using transcript fallback."
            )
        else:
            source = 'otel'
            next_owned = claude_token_audit_env(port)
            env.update(next_owned)

        command = claude_token_audit_hook_command(
            environment, workspace_id, source, port
        )
        timeout = (
            CLAUDE_TOKEN_AUDIT_TRANSCRIPT_HOOK_TIMEOUT_SECONDS
            if source == 'transcript'
            else CLAUDE_TOKEN_AUDIT_OTEL_HOOK_TIMEOUT_SECONDS
        )
        handler = {'type': 'command', 'command': command, 'timeout': timeout}
        for event, matcher in CLAUDE_TOKEN_AUDIT_HOOK_EVENTS:
            group = {'hooks': [dict(handler)]}
            if matcher is not None:
                group['matcher'] = matcher
            hooks.setdefault(event, []).append(group)

    if hooks or existing_hooks is not None:
        config['hooks'] = hooks
    else:
        config.pop('hooks', None)
    if isinstance(env, dict):
        if env or existing_env is not None:
            config['env'] = env
        else:
            config.pop('env', None)
    # A non-object user value is preserved exactly in transcript mode.

    updated = json.dumps(config, indent=2) + '\n'
    with config_file_lock(logical_path):
        atomic_write_text(
            logical_path, updated, existing, target_path, signature
        )
    if enabled and not available:
        print(f"  ℹ️  Left Claude token audit disabled in {settings_path}")
    else:
        print(
            f"  ✅ {'Configured ' + source if enabled else 'Removed Uclusion-owned'} "
            f"token-audit settings in {settings_path}"
        )
    result = {'source': source, 'managedEnv': next_owned}
    if not available:
        result['available'] = False
    return result


def build_codex_mcp_block(workspace_id=None, env=None, work_claims=False,
                          descriptor=None):
    """Return the marker-delimited ``[mcp_servers.Uclusion]`` table for config.toml.

    There is no TOML writer in the standard library (``tomllib`` only reads, and
    only on 3.11+), and the installer must run standalone via ``curl | bash`` with
    nothing but ``python3``. The table is fixed-shape, so we render the text from a
    template rather than parse-and-reserialize — which also preserves any comments
    and formatting the user has elsewhere in the file.

    ``default_tools_approval_mode`` is Codex's server-wide equivalent of Claude's
    ``mcp__Uclusion__*`` allow rule. It covers all current and future tools exposed
    by the Uclusion server instead of requiring a per-tool approval entry.
    """
    if descriptor is None:
        descriptor = runtime_mcp_descriptor(
            workspace_id, env, work_claims=work_claims
        )
    descriptor = _validate_mcp_descriptor(descriptor)
    lines = [
        CODEX_CONFIG_MARKER,
        f'[mcp_servers.{MCP_SERVER_KEY}]',
        f'command = {_toml_basic_string(descriptor["command"])}',
        'args = [',
    ]
    lines.extend(
        f'    {_toml_basic_string(arg)},'
        for arg in descriptor['args']
    )
    lines.append(']')
    lines.append('default_tools_approval_mode = "approve"')
    lines.append(CODEX_CONFIG_END_MARKER)
    return '\n'.join(lines) + '\n'


@contextmanager
def config_file_lock(path):
    """Serialize one config file's read/modify/replace cycle."""
    lock_path = f'{path}.uclusion.lock'
    ensure_dir(os.path.dirname(lock_path))
    with open(lock_path, 'a+b') as lock_file, _exclusive_file_lock(lock_file):
        yield


@contextmanager
def codex_config_lock(config_path=None):
    """Serialize Uclusion's Codex config updates across installers."""
    with config_file_lock(config_path or CODEX_CONFIG_PATH):
        yield


def replace_owned_block(
    existing, start_marker, end_marker, block, label, config_path=None
):
    """Append or replace exactly one ordered marker-owned config block."""
    config_path = config_path or CODEX_CONFIG_PATH

    def marker_matches(marker):
        return list(re.finditer(
            rf'(?m)^{re.escape(marker)}\r?$',
            existing,
        ))

    starts = marker_matches(start_marker)
    ends = marker_matches(end_marker)
    if not starts and not ends:
        if existing.strip():
            separator = '' if existing.endswith('\n') else '\n'
            return existing + separator + '\n' + block, False
        return block, False
    if len(starts) != 1 or len(ends) != 1 or starts[0].start() >= ends[0].start():
        raise RuntimeError(
            f'{config_path} has duplicate, orphaned, or reversed '
            f'Uclusion {label} markers; refusing to modify it'
        )
    end_index = ends[0].end()
    if end_index < len(existing) and existing[end_index] == '\n':
        end_index += 1
    remainder = (
        existing[:starts[0].start()] + existing[end_index:]
    ).rstrip()
    return (remainder + '\n\n' + block) if remainder else block, True


def remove_owned_block(
    existing, start_marker, end_marker, label, config_path=None
):
    """Remove exactly one marker-owned block, preserving all other config."""
    config_path = config_path or CODEX_CONFIG_PATH

    def marker_matches(marker):
        return list(re.finditer(
            rf'(?m)^{re.escape(marker)}\r?$',
            existing,
        ))

    starts = marker_matches(start_marker)
    ends = marker_matches(end_marker)
    if not starts and not ends:
        return existing, False
    if len(starts) != 1 or len(ends) != 1 or starts[0].start() >= ends[0].start():
        raise RuntimeError(
            f'{config_path} has duplicate, orphaned, or reversed '
            f'Uclusion {label} markers; refusing to modify it'
        )
    end_index = ends[0].end()
    if end_index < len(existing) and existing[end_index] == '\r':
        end_index += 1
    if end_index < len(existing) and existing[end_index] == '\n':
        end_index += 1
    before = existing[:starts[0].start()].rstrip()
    after = existing[end_index:].lstrip('\r\n')
    if before and after:
        return before + '\n\n' + after, True
    if before:
        return before + '\n', True
    return after, True


def validate_codex_config(text):
    """Parse when stdlib TOML support exists; Codex must never see a partial block."""
    if tomllib is not None:
        try:
            tomllib.loads(text)
        except tomllib.TOMLDecodeError as error:
            raise RuntimeError(
                f'refusing to write invalid Codex TOML: {error}'
            ) from error


def _codex_has_uclusion_descriptor(text):
    if tomllib is not None:
        parsed = tomllib.loads(text)
        servers = parsed.get('mcp_servers')
        if isinstance(servers, dict) and MCP_SERVER_KEY in servers:
            return True
    table_pattern = (
        r'(?m)^\s*\[\s*["\']?mcp_servers["\']?\s*\.\s*'
        r'["\']?Uclusion["\']?\s*\]'
    )
    return (
        CODEX_CONFIG_MARKER in text
        or CODEX_CONFIG_END_MARKER in text
        or re.search(table_pattern, text) is not None
    )


def _assert_expected_codex_descriptor(text, expected_descriptor, config_path):
    if expected_descriptor is None:
        if _codex_has_uclusion_descriptor(text):
            raise RuntimeError(
                f'{config_path} already defines a Uclusion MCP server; '
                'refusing setup bootstrap'
            )
        return

    expected_block = build_codex_mcp_block(descriptor=expected_descriptor)
    starts = list(re.finditer(
        rf'(?m)^{re.escape(CODEX_CONFIG_MARKER)}\r?$', text
    ))
    ends = list(re.finditer(
        rf'(?m)^{re.escape(CODEX_CONFIG_END_MARKER)}\r?$', text
    ))
    if len(starts) == 1 and len(ends) == 1 and starts[0].start() < ends[0].start():
        end_index = ends[0].end()
        if end_index < len(text) and text[end_index] == '\n':
            end_index += 1
        current_block = text[starts[0].start():end_index]
    else:
        current_block = None
    if current_block != expected_block:
        raise RuntimeError(
            f'{config_path} setup MCP descriptor changed or is missing; '
            'refusing replacement'
        )
    remainder = text[:starts[0].start()] + text[end_index:]
    if _codex_has_uclusion_descriptor(remainder):
        raise RuntimeError(
            f'{config_path} has an additional Uclusion MCP descriptor; '
            'refusing replacement'
        )


def _stat_signature(file_stat):
    """Return the identity and mutation fields relevant to an atomic rewrite."""
    return (
        file_stat.st_dev,
        file_stat.st_ino,
        file_stat.st_size,
        getattr(
            file_stat,
            'st_mtime_ns',
            int(file_stat.st_mtime * 1_000_000_000),
        ),
        getattr(
            file_stat,
            'st_ctime_ns',
            int(file_stat.st_ctime * 1_000_000_000),
        ),
        stat.S_IMODE(file_stat.st_mode),
    )


def _config_write_target(path):
    """Resolve a live config symlink without replacing the symlink itself."""
    logical_path = os.path.abspath(os.path.expanduser(path))
    try:
        logical_stat = os.lstat(logical_path)
    except FileNotFoundError:
        logical_stat = None
    target_path = os.path.realpath(logical_path)
    if logical_stat is not None and stat.S_ISLNK(logical_stat.st_mode):
        if not os.path.exists(target_path):
            raise RuntimeError(
                f'{logical_path} is a dangling symlink; refusing to replace it'
            )
    if os.path.exists(target_path) and not os.path.isfile(target_path):
        raise RuntimeError(
            f'{logical_path} does not resolve to a regular file; '
            'refusing to modify it'
        )
    return target_path


def _read_text_snapshot(path):
    """Read one regular file and return content plus a stable stat signature."""
    flags = os.O_RDONLY
    if hasattr(os, 'O_NOFOLLOW'):
        flags |= os.O_NOFOLLOW
    try:
        descriptor = os.open(path, flags)
    except FileNotFoundError:
        return '', None
    try:
        before = os.fstat(descriptor)
        if not stat.S_ISREG(before.st_mode):
            raise RuntimeError(
                f'{path} is not a regular file; refusing to modify it'
            )
        with os.fdopen(descriptor, 'r', encoding='utf-8') as source:
            descriptor = None
            content = source.read()
            after = os.fstat(source.fileno())
    finally:
        if descriptor is not None:
            os.close(descriptor)
    before_signature = _stat_signature(before)
    after_signature = _stat_signature(after)
    if before_signature != after_signature:
        raise RuntimeError(
            f'{path} changed while Uclusion was reading it; retry install'
        )
    return content, after_signature


def _assert_expected_text_snapshot(
    logical_path,
    target_path,
    expected_existing,
    expected_signature,
):
    """Reject retargeting, replacement, or mutation since the caller's read."""
    current_target = _config_write_target(logical_path)
    if current_target != target_path:
        raise RuntimeError(
            f'{logical_path} changed targets while Uclusion was updating it; '
            'retry install'
        )
    current, current_signature = _read_text_snapshot(target_path)
    if (
        current != expected_existing
        or current_signature != expected_signature
    ):
        raise RuntimeError(
            f'{logical_path} changed while Uclusion was updating it; '
            'retry install'
        )


def atomic_write_text(
    path,
    text,
    expected_existing,
    expected_target,
    expected_signature,
):
    """Durably update a stable config target without replacing its symlink."""
    logical_path = os.path.abspath(os.path.expanduser(path))
    target_path = _config_write_target(logical_path)
    if target_path != expected_target:
        raise RuntimeError(
            f'{logical_path} changed targets while Uclusion was updating it; '
            'retry install'
        )
    _assert_expected_text_snapshot(
        logical_path,
        target_path,
        expected_existing,
        expected_signature,
    )
    directory = os.path.dirname(target_path)
    ensure_dir(directory)
    mode = (
        expected_signature[-1]
        if expected_signature is not None
        else 0o600
    )
    descriptor, temporary_path = tempfile.mkstemp(
        prefix=f'.{os.path.basename(target_path)}.uclusion-',
        dir=directory,
    )
    try:
        with os.fdopen(descriptor, 'w', encoding='utf-8') as output:
            output.write(text)
            output.flush()
            os.fsync(output.fileno())
        os.chmod(temporary_path, mode)
        _assert_expected_text_snapshot(
            logical_path,
            target_path,
            expected_existing,
            expected_signature,
        )
        # Python exposes no portable rename-if-this-inode-is-still-current
        # primitive. The install lock coordinates every Uclusion writer and
        # the two full snapshots detect normal editor replacement windows;
        # os.replace keeps the published file itself atomic for readers.
        os.replace(temporary_path, target_path)
        temporary_path = None
        try:
            directory_fd = os.open(directory, os.O_RDONLY)
            try:
                os.fsync(directory_fd)
            finally:
                os.close(directory_fd)
        except OSError:
            # Some filesystems do not support directory fsync.
            pass
    finally:
        if temporary_path is not None and os.path.lexists(temporary_path):
            os.remove(temporary_path)


def mutate_codex_config(
    workspace_id=None,
    env=None,
    include_mcp=False,
    force=False,
    work_claims=False,
    descriptor=None,
    config_path=None,
    expected_descriptor=_UNCHECKED_MCP_DESCRIPTOR,
):
    """Apply Codex config changes and remove obsolete Uclusion bridge hooks."""
    config_path = config_path or CODEX_CONFIG_PATH
    config_home = os.path.dirname(config_path)
    if not os.path.isdir(config_home):
        if not force or not include_mcp:
            print(f"ℹ️  No {config_home} found; skipping Codex configuration.")
            return False
        ensure_dir(config_home)

    with codex_config_lock(config_path):
        config_target = _config_write_target(config_path)
        existing, config_signature = _read_text_snapshot(config_target)
        if expected_descriptor is not _UNCHECKED_MCP_DESCRIPTOR:
            validate_codex_config(existing)
            _assert_expected_codex_descriptor(
                existing, expected_descriptor, config_path
            )
        updated = existing
        mcp_refreshed = False
        legacy_hooks_removed = False
        mcp_skipped = False
        if include_mcp:
            has_any_owned_mcp_marker = (
                CODEX_CONFIG_MARKER in updated
                or CODEX_CONFIG_END_MARKER in updated
            )
            if (
                not has_any_owned_mcp_marker
                and '[mcp_servers.Uclusion]' in updated
            ):
                mcp_skipped = True
            else:
                updated, mcp_refreshed = replace_owned_block(
                    updated,
                    CODEX_CONFIG_MARKER,
                    CODEX_CONFIG_END_MARKER,
                    build_codex_mcp_block(
                        workspace_id,
                        env,
                        work_claims,
                        descriptor,
                    ),
                    'MCP',
                    config_path,
                )
        updated, legacy_hooks_removed = remove_owned_block(
            updated,
            LEGACY_CODEX_HOOKS_MARKER,
            LEGACY_CODEX_HOOKS_END_MARKER,
            'legacy bridge-hook',
            config_path,
        )
        validate_codex_config(updated)
        if updated != existing:
            atomic_write_text(
                config_path,
                updated,
                existing,
                config_target,
                config_signature,
            )

    if mcp_skipped:
        print(
            f"  ⏭  {config_path} already defines "
            "[mcp_servers.Uclusion] outside Uclusion's markers; "
            "leaving that table untouched."
        )
    elif include_mcp:
        verb = 'Refreshed' if mcp_refreshed else 'Added'
        print(f"  ✅ {verb} Uclusion MCP server in {config_path}")
    if legacy_hooks_removed:
        print(
            "  ✅ Removed obsolete Uclusion Codex bridge hooks from "
            f"{config_path}"
        )
    if include_mcp:
        print("  🔄 Restart Codex (or reload its IDE extension) to apply this configuration.")
    return True


def remove_legacy_codex_hooks_config(force=False):
    """Remove only Uclusion's obsolete marker-owned lifecycle-hook block."""
    return mutate_codex_config(force=force)


def update_codex_config(workspace_id, env, force=False, work_claims=False):
    """Register the Uclusion MCP server in ``~/.codex/config.toml``."""
    return mutate_codex_config(
        workspace_id=workspace_id,
        env=env,
        include_mcp=True,
        force=force,
        work_claims=work_claims,
    )


def update_codex_integration_config(workspace_id, env, force=False,
                                    work_claims=False):
    """Install the MCP table and remove obsolete bridge hooks atomically."""
    return mutate_codex_config(
        workspace_id=workspace_id,
        env=env,
        include_mcp=True,
        force=force,
        work_claims=work_claims,
    )


def register_codex_descriptor(
    descriptor,
    config_path=None,
    expected_descriptor=_UNCHECKED_MCP_DESCRIPTOR,
):
    """Register one setup or runtime descriptor in a Codex config scope."""
    config_path = config_path or CODEX_CONFIG_PATH
    result = mutate_codex_config(
        include_mcp=True,
        force=True,
        descriptor=descriptor,
        config_path=config_path,
        expected_descriptor=expected_descriptor,
    )
    expected = build_codex_mcp_block(descriptor=descriptor)
    current, _signature = _read_text_snapshot(
        _config_write_target(config_path)
    )
    if expected not in current:
        raise RuntimeError(
            f'{config_path} has an unmanaged [mcp_servers.Uclusion] table; '
            'refusing to report setup registration as complete'
        )
    return result


def prompt_yes_no(question, default=False):
    """Prompt for a yes/no answer, returning ``default`` on an empty response.

    ``default`` controls both the displayed hint ([Y/n] vs [y/N]) and what an
    empty answer (just Enter) means. Refresh prompts pass ``default=True`` so
    that re-running the installer keeps the managed Uclusion blocks current
    without the user having to type ``y`` each time.

    Reads from /dev/tty so the prompt still works when the installer is run via
    ``curl ... | bash`` (in which case stdin is the pipe, not the terminal).
    Uses separate read/write handles to avoid buffering quirks that can make a
    shared ``r+`` handle return EOF on the first ``readline`` call.
    """
    hint = '[Y/n]' if default else '[y/N]'
    prompt = f"{question} {hint} "
    answer = None
    try:
        tty_in = open('/dev/tty', 'r', encoding='utf-8')
    except OSError:
        tty_in = None

    if tty_in is not None:
        try:
            try:
                with open('/dev/tty', 'w', encoding='utf-8') as tty_out:
                    tty_out.write(prompt)
                    tty_out.flush()
            except OSError:
                sys.stderr.write(prompt)
                sys.stderr.flush()
            answer = tty_in.readline()
        finally:
            tty_in.close()
    else:
        try:
            answer = input(prompt)
        except EOFError:
            return default

    if not answer:
        return default
    text = answer.strip().lower()
    if not text:
        return default
    if text in ('y', 'yes'):
        return True
    if text in ('n', 'no'):
        return False
    return default


def prompt_line(question):
    """Prompt for a free-text line, reading from /dev/tty so it works under curl|bash.

    Mirrors prompt_yes_no's terminal handling. Returns the entered text (stripped
    of the trailing newline) or None when no terminal is available to read from.
    """
    prompt = f"{question} "
    try:
        tty_in = open('/dev/tty', 'r', encoding='utf-8')
    except OSError:
        try:
            return input(prompt)
        except EOFError:
            return None

    try:
        try:
            with open('/dev/tty', 'w', encoding='utf-8') as tty_out:
                tty_out.write(prompt)
                tty_out.flush()
        except OSError:
            sys.stderr.write(prompt)
            sys.stderr.flush()
        answer = tty_in.readline()
    finally:
        tty_in.close()

    if not answer:
        return None
    return answer.rstrip('\n')


def prompt_install_scope():
    """Ask whether to configure Uclusion globally (default) or at the project level.

    Returns the absolute project directory for a project-level install, or None
    to fall back to the global (home-directory) install. A project install needs
    a path, so if none can be read (no terminal, or an empty answer) we fall back
    to global rather than guessing a directory.
    """
    if not prompt_yes_no("Configure Uclusion at the project level instead of globally?"):
        return None

    path = prompt_line("  Project directory path:")
    if path is None:
        print("  ⏭  No terminal to read a path from; using a global install.")
        return None
    path = path.strip()
    if not path:
        print("  ⏭  No path given; using a global install.")
        return None
    return os.path.abspath(os.path.expanduser(path))


def validate_workflow_bundle(bundle):
    """Validate every resident stub and portable-skill asset as one unit."""
    if not isinstance(bundle, dict) or set(bundle) != set(WORKFLOW_ASSET_PATHS):
        raise RuntimeError('workflow bundle has an unexpected asset set')
    for key, content in bundle.items():
        if not isinstance(content, str) or not content.strip():
            raise RuntimeError(f'workflow asset {key} is empty or not text')
        digest = hashlib.sha256(content.encode('utf-8')).hexdigest()
        if digest != WORKFLOW_ASSET_SHA256[key]:
            raise RuntimeError(
                f'workflow asset {key} does not match this installer release'
            )

    for key in CLIENT_STUB_ASSET.values():
        content = bundle[key]
        if (
            content.count(CLAUDE_MD_MARKER) != 1
            or content.count(CLAUDE_MD_END_MARKER) != 1
            or content.find(CLAUDE_MD_MARKER)
            > content.find(CLAUDE_MD_END_MARKER)
        ):
            raise RuntimeError(f'workflow asset {key} has invalid markers')
        if WORKFLOW_ENV_PLACEHOLDER not in content:
            raise RuntimeError(
                f'workflow asset {key} lacks its CLI environment placeholder'
            )
        if len(content.encode('utf-8')) > 4096:
            raise RuntimeError(f'workflow asset {key} exceeds 4 KiB')

    skill = bundle['skill']
    if (
        not skill.startswith('---\n')
        or '\nname: uclusion\n' not in skill
        or '\ndescription:' not in skill
        or skill.count(SKILL_MARKER) != 1
        or skill.count(SKILL_END_MARKER) != 1
        or not skill.rstrip().endswith(SKILL_END_MARKER)
    ):
        raise RuntimeError('SKILL.md has invalid frontmatter or ownership markers')
    if len(skill.splitlines()) > 500:
        raise RuntimeError('SKILL.md exceeds the 500-line entrypoint budget')

    for key in ('pokes_reference', 'operations_reference'):
        reference = bundle[key]
        if (
            reference.count(SKILL_REFERENCE_MARKER) != 1
            or reference.count(SKILL_REFERENCE_END_MARKER) != 1
            or not reference.rstrip().endswith(SKILL_REFERENCE_END_MARKER)
        ):
            raise RuntimeError(
                f'workflow asset {key} has invalid reference markers'
            )

    metadata = bundle['openai_metadata']
    if (
        'display_name: "Uclusion"' not in metadata
        or '$uclusion' not in metadata
        or 'allow_implicit_invocation: true' not in metadata
    ):
        raise RuntimeError('agents/openai.yaml has invalid Uclusion metadata')


def make_workflow_bundle_fetcher(env):
    """Return a callable that downloads and validates the workflow bundle once.

    A partial or invalid download is cached as failure. Consequently no client
    can receive a stub from one release and a skill from another, and repeated
    client installs do not re-fetch identical assets.
    """
    base_url = get_scripts_base_url(env)
    cache = {}

    def fetch():
        if 'result' in cache:
            return cache['result']
        if 'error' in cache:
            raise RuntimeError(
                'the Uclusion workflow bundle could not be downloaded'
            ) from cache['error']

        bundle = {}
        try:
            for key, relative_path in WORKFLOW_ASSET_PATHS.items():
                url = base_url + relative_path
                print(f"  ⬇️  Downloading {url}")
                with urllib.request.urlopen(
                    url, timeout=HTTP_TIMEOUT
                ) as response:
                    if response.status != 200:
                        raise RuntimeError(
                            f'{relative_path}: status {response.status}'
                        )
                    content = response.read().decode('utf-8')
                if not content.endswith('\n'):
                    content += '\n'
                bundle[key] = content
            validate_workflow_bundle(bundle)
        except Exception as err:
            print(f"  ❌ Failed to download the Uclusion workflow bundle: {err}")
            cache['error'] = err
            raise RuntimeError(
                f'failed to download the Uclusion workflow bundle: {err}'
            ) from err

        cache['result'] = bundle
        return bundle

    # install_skill_and_stub uses this only for real installer fetchers. Tests
    # and embedders that supply an ordinary callable receive the unrendered
    # source asset, which makes the helper independently testable.
    fetch.workflow_environment = env
    return fetch


WORKFLOW_TRANSACTION_OWNER = 'uclusion-workflow-installer:v1'
WORKFLOW_STAGING_SUFFIX = '.uclusion-install-staging'
WORKFLOW_BACKUP_SUFFIX = '.uclusion-install-backup'
WORKFLOW_TRANSACTION_SUFFIX = '.uclusion-install-transaction.json'


def _skill_transaction_paths(skill_dir):
    skill_dir = os.path.abspath(os.path.expanduser(skill_dir))
    return (
        skill_dir,
        skill_dir + WORKFLOW_STAGING_SUFFIX,
        skill_dir + WORKFLOW_BACKUP_SUFFIX,
        skill_dir + WORKFLOW_TRANSACTION_SUFFIX,
    )


def _validate_regular_tree(root):
    """Reject links and special files anywhere in an existing skill tree."""
    root_stat = os.lstat(root)
    if stat.S_ISLNK(root_stat.st_mode):
        raise RuntimeError(f'{root} is a symlink; refusing to install')
    if not stat.S_ISDIR(root_stat.st_mode):
        raise RuntimeError(f'{root} exists and is not a skill directory')

    pending = [root]
    while pending:
        directory = pending.pop()
        with os.scandir(directory) as entries:
            for entry in entries:
                entry_stat = entry.stat(follow_symlinks=False)
                if stat.S_ISLNK(entry_stat.st_mode):
                    raise RuntimeError(
                        f'{entry.path} is a symlink; refusing to install'
                    )
                if stat.S_ISDIR(entry_stat.st_mode):
                    pending.append(entry.path)
                elif not stat.S_ISREG(entry_stat.st_mode):
                    raise RuntimeError(
                        f'{entry.path} is not a regular file; refusing to install'
                    )


def _validate_owned_skill(skill_dir):
    """Validate a managed package while permitting safe extra files."""
    if not os.path.lexists(skill_dir):
        return False
    _validate_regular_tree(skill_dir)
    skill_path = os.path.join(skill_dir, 'SKILL.md')
    if not os.path.lexists(skill_path):
        if os.listdir(skill_dir):
            raise RuntimeError(
                f'{skill_dir} contains an unmarked skill package; '
                'refusing to overwrite it'
            )
        return True
    if not stat.S_ISREG(os.lstat(skill_path).st_mode):
        raise RuntimeError(
            f'{skill_path} is not a regular managed file; refusing to install'
        )
    content, _signature = _read_text_snapshot(skill_path)
    if (
        content.count(SKILL_MARKER) != 1
        or content.count(SKILL_END_MARKER) != 1
        or content.find(SKILL_MARKER) > content.find(SKILL_END_MARKER)
    ):
        raise RuntimeError(
            f'{skill_path} is not a Uclusion-managed skill; '
            'refusing to overwrite it'
        )

    for _asset_key, relative_path in SKILL_PACKAGE_ASSETS:
        managed_path = os.path.join(skill_dir, relative_path)
        if os.path.lexists(managed_path) and not stat.S_ISREG(
            os.lstat(managed_path).st_mode
        ):
            raise RuntimeError(
                f'{managed_path} is not a regular managed file; '
                'refusing to install'
            )
    return True


def _remove_installer_tree(path):
    """Remove an installer-owned tree without ever following its root."""
    if not os.path.lexists(path):
        return
    path_stat = os.lstat(path)
    if stat.S_ISLNK(path_stat.st_mode) or not stat.S_ISDIR(path_stat.st_mode):
        raise RuntimeError(
            f'installer transaction path {path} is not a directory'
        )
    # shutil.rmtree unlinks nested links instead of following them. These are
    # private staging paths authenticated by the sibling transaction record.
    shutil.rmtree(path)


def _resident_state_digest(content, signature):
    """Hash a resident snapshot, distinguishing absence from an empty file."""
    if signature is None:
        return 'missing'
    return hashlib.sha256(content.encode('utf-8')).hexdigest()


def _write_skill_transaction(
    path,
    skill_dir,
    had_existing,
    resident_target,
    resident_before_digest,
    resident_after_digest,
    resident_before_signature=None,
):
    payload = json.dumps({
        'owner': WORKFLOW_TRANSACTION_OWNER,
        'skillDir': skill_dir,
        'hadExisting': bool(had_existing),
        'residentTarget': resident_target,
        'residentBefore': resident_before_digest,
        'residentAfter': resident_after_digest,
        'residentBeforeSignature': (
            list(resident_before_signature)
            if resident_before_signature is not None
            else None
        ),
    }, sort_keys=True) + '\n'
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
    if hasattr(os, 'O_NOFOLLOW'):
        flags |= os.O_NOFOLLOW
    descriptor = os.open(path, flags, 0o600)
    try:
        with os.fdopen(descriptor, 'w', encoding='utf-8') as output:
            descriptor = None
            output.write(payload)
            output.flush()
            os.fsync(output.fileno())
    finally:
        if descriptor is not None:
            os.close(descriptor)
    _fsync_directory(os.path.dirname(path))


def _read_skill_transaction(path, skill_dir):
    path_stat = os.lstat(path)
    if stat.S_ISLNK(path_stat.st_mode) or not stat.S_ISREG(path_stat.st_mode):
        raise RuntimeError(f'unsafe workflow transaction record at {path}')
    payload, _signature = _read_text_snapshot(path)
    try:
        transaction = json.loads(payload)
    except json.JSONDecodeError as err:
        raise RuntimeError(
            f'invalid workflow transaction record at {path}: {err}'
        ) from err
    if (
        not isinstance(transaction, dict)
        or set(transaction) != {
            'owner',
            'skillDir',
            'hadExisting',
            'residentTarget',
            'residentBefore',
            'residentAfter',
            'residentBeforeSignature',
        }
        or transaction.get('owner') != WORKFLOW_TRANSACTION_OWNER
        or transaction.get('skillDir') != skill_dir
        or not isinstance(transaction.get('hadExisting'), bool)
        or not isinstance(transaction.get('residentTarget'), str)
        or not os.path.isabs(transaction.get('residentTarget'))
        or not isinstance(transaction.get('residentBefore'), str)
        or not isinstance(transaction.get('residentAfter'), str)
        or (
            transaction.get('residentBeforeSignature') is not None
            and (
                not isinstance(
                    transaction.get('residentBeforeSignature'), list
                )
                or len(transaction.get('residentBeforeSignature')) != 6
                or not all(
                    isinstance(value, int)
                    for value in transaction.get('residentBeforeSignature')
                )
            )
        )
    ):
        raise RuntimeError(f'unrecognized workflow transaction record at {path}')
    return transaction


def _transaction_resident_state(transaction):
    target = transaction['residentTarget']
    content, signature = _read_text_snapshot(target)
    digest = _resident_state_digest(content, signature)
    matches_before = digest == transaction['residentBefore']
    matches_after = digest == transaction['residentAfter']
    if matches_before and matches_after:
        before_signature = transaction['residentBeforeSignature']
        return (
            'before'
            if before_signature is not None
            and list(signature) == before_signature
            else 'after'
        )
    if matches_before:
        return 'before'
    if matches_after:
        return 'after'
    raise RuntimeError(
        f'{target} does not match either resident state recorded by the '
        'interrupted Uclusion workflow transaction; refusing recovery'
    )


def _rollback_skill_transaction(skill_dir, transaction=None):
    """Restore the pre-transaction package without changing the resident."""
    skill_dir, staging_dir, backup_dir, transaction_path = (
        _skill_transaction_paths(skill_dir)
    )
    if transaction is None:
        transaction = _read_skill_transaction(transaction_path, skill_dir)
    had_existing = transaction['hadExisting']
    if os.path.lexists(backup_dir):
        if not had_existing:
            raise RuntimeError(
                f'unexpected workflow backup for new package {skill_dir}'
            )
        _validate_owned_skill(backup_dir)
        if os.path.lexists(skill_dir):
            _validate_owned_skill(skill_dir)
            _remove_installer_tree(skill_dir)
        os.replace(backup_dir, skill_dir)
        _fsync_directory(os.path.dirname(skill_dir))
    elif had_existing:
        if not os.path.lexists(skill_dir):
            raise RuntimeError(
                f'workflow transaction lost both {skill_dir} and its backup'
            )
        _validate_owned_skill(skill_dir)
    elif os.path.lexists(skill_dir):
        _validate_owned_skill(skill_dir)
        _remove_installer_tree(skill_dir)

    if os.path.lexists(staging_dir):
        _remove_installer_tree(staging_dir)
    os.remove(transaction_path)
    _fsync_directory(os.path.dirname(skill_dir))


def _recover_skill_transaction(skill_dir):
    """Roll back an interrupted package swap identified by its owned record."""
    skill_dir, staging_dir, backup_dir, transaction_path = (
        _skill_transaction_paths(skill_dir)
    )
    has_artifact = os.path.lexists(staging_dir) or os.path.lexists(backup_dir)
    if not os.path.lexists(transaction_path):
        if has_artifact:
            raise RuntimeError(
                f'unowned workflow transaction artifact beside {skill_dir}'
            )
        return

    transaction = _read_skill_transaction(transaction_path, skill_dir)
    had_existing = transaction['hadExisting']
    resident_state = _transaction_resident_state(transaction)
    if resident_state == 'after':
        if os.path.lexists(staging_dir) and os.path.lexists(skill_dir):
            # A staged tree plus the original live tree means the package swap
            # never began. The resident cannot legitimately be in its after
            # state, so do not guess which tree should survive.
            raise RuntimeError(
                f'interrupted workflow transaction published its resident '
                f'before swapping the package at {skill_dir}'
            )
        if not os.path.lexists(skill_dir):
            if os.path.lexists(staging_dir):
                _validate_owned_skill(staging_dir)
                os.replace(staging_dir, skill_dir)
                _fsync_directory(os.path.dirname(skill_dir))
            else:
                raise RuntimeError(
                    f'interrupted workflow transaction published its resident '
                    f'but has no new package at {skill_dir}'
                )
        _validate_owned_skill(skill_dir)
        if os.path.lexists(staging_dir):
            _remove_installer_tree(staging_dir)
        if os.path.lexists(backup_dir):
            _remove_installer_tree(backup_dir)
        os.remove(transaction_path)
        _fsync_directory(os.path.dirname(skill_dir))
        return

    _rollback_skill_transaction(skill_dir, transaction)


def _ensure_staging_parent(directory):
    if os.path.lexists(directory):
        directory_stat = os.lstat(directory)
        if stat.S_ISLNK(directory_stat.st_mode) or not stat.S_ISDIR(
            directory_stat.st_mode
        ):
            raise RuntimeError(
                f'{directory} is not a regular package directory'
            )
        return
    os.mkdir(directory, 0o700)


def _write_staged_asset(staging_dir, relative_path, content):
    components = relative_path.split(os.sep)
    parent = staging_dir
    for component in components[:-1]:
        parent = os.path.join(parent, component)
        _ensure_staging_parent(parent)
    target = os.path.join(staging_dir, relative_path)
    if os.path.lexists(target) and not stat.S_ISREG(os.lstat(target).st_mode):
        raise RuntimeError(f'{target} is not a regular managed file')
    flags = os.O_WRONLY | os.O_CREAT | os.O_TRUNC
    if hasattr(os, 'O_NOFOLLOW'):
        flags |= os.O_NOFOLLOW
    descriptor = os.open(target, flags, 0o600)
    try:
        with os.fdopen(descriptor, 'w', encoding='utf-8') as output:
            descriptor = None
            output.write(content)
            output.flush()
            os.fsync(output.fileno())
    finally:
        if descriptor is not None:
            os.close(descriptor)


def _fsync_skill_tree(skill_dir):
    directories = []
    for root, dir_names, file_names in os.walk(skill_dir, followlinks=False):
        directories.append(root)
        for name in dir_names + file_names:
            path = os.path.join(root, name)
            path_stat = os.lstat(path)
            if stat.S_ISLNK(path_stat.st_mode):
                raise RuntimeError(f'{path} is a symlink; refusing to install')
            if stat.S_ISREG(path_stat.st_mode):
                _fsync_file(path)
            elif not stat.S_ISDIR(path_stat.st_mode):
                raise RuntimeError(
                    f'{path} is not a regular package path; refusing to install'
                )
    for directory in reversed(directories):
        _fsync_directory(directory)


def _stage_skill_package(skill_dir, staging_dir, bundle):
    if os.path.lexists(skill_dir):
        # Preserve a raced-in link as a link so validation rejects it; never
        # follow it and copy data from outside the managed package.
        shutil.copytree(skill_dir, staging_dir, symlinks=True)
    else:
        os.mkdir(staging_dir, 0o700)
    for asset_key, relative_path in SKILL_PACKAGE_ASSETS:
        _write_staged_asset(staging_dir, relative_path, bundle[asset_key])
    _validate_owned_skill(staging_dir)
    _fsync_skill_tree(staging_dir)
    _fsync_directory(os.path.dirname(staging_dir))


def _begin_skill_transaction(
    skill_dir,
    bundle,
    resident_target,
    resident_before_digest,
    resident_after_digest,
    resident_before_signature,
):
    skill_dir, staging_dir, backup_dir, transaction_path = (
        _skill_transaction_paths(skill_dir)
    )
    _recover_skill_transaction(skill_dir)
    had_existing = _validate_owned_skill(skill_dir)
    ensure_dir(os.path.dirname(skill_dir))
    for path in (staging_dir, backup_dir, transaction_path):
        if os.path.lexists(path):
            raise RuntimeError(f'workflow transaction path already exists: {path}')
    _write_skill_transaction(
        transaction_path,
        skill_dir,
        had_existing,
        resident_target,
        resident_before_digest,
        resident_after_digest,
        resident_before_signature,
    )
    try:
        _stage_skill_package(skill_dir, staging_dir, bundle)
    except Exception:
        _rollback_skill_transaction(skill_dir)
        raise
    return skill_dir, staging_dir, backup_dir, transaction_path, had_existing


def _swap_staged_skill(skill_dir, staging_dir, backup_dir, had_existing):
    if had_existing:
        os.replace(skill_dir, backup_dir)
        _fsync_directory(os.path.dirname(skill_dir))
    try:
        os.replace(staging_dir, skill_dir)
        _fsync_directory(os.path.dirname(skill_dir))
    except Exception:
        if had_existing and os.path.lexists(backup_dir):
            os.replace(backup_dir, skill_dir)
            _fsync_directory(os.path.dirname(skill_dir))
        # The caller's recovery path will now observe the resident's before
        # hash and clean up the journal without deleting the restored package.
        raise


def _commit_skill_transaction(skill_dir):
    skill_dir, staging_dir, backup_dir, transaction_path = (
        _skill_transaction_paths(skill_dir)
    )
    if os.path.lexists(staging_dir):
        _remove_installer_tree(staging_dir)
    if os.path.lexists(backup_dir):
        _remove_installer_tree(backup_dir)
    if os.path.lexists(transaction_path):
        os.remove(transaction_path)
    _fsync_directory(os.path.dirname(skill_dir))


def _resident_update(existing, rendered_stub, client, target_path):
    """Build the new resident file while preserving non-Uclusion content."""
    has_start = CLAUDE_MD_MARKER in existing
    has_end = CLAUDE_MD_END_MARKER in existing
    if has_start != has_end:
        which = 'start' if has_start else 'end'
        raise RuntimeError(
            f'{target_path} has the Uclusion {which} marker but not its '
            'counterpart'
        )
    if has_start:
        if (
            existing.count(CLAUDE_MD_MARKER) != 1
            or existing.count(CLAUDE_MD_END_MARKER) != 1
        ):
            raise RuntimeError(
                f'{target_path} has duplicate Uclusion workflow markers'
            )
        # A Cursor rule is a dedicated Uclusion-owned file. Refresh the whole
        # asset so YAML frontmatter changes together with its managed body.
        if client == 'cursor':
            return rendered_stub
        old_start = existing.find(CLAUDE_MD_MARKER)
        old_end = (
            existing.find(CLAUDE_MD_END_MARKER, old_start)
            + len(CLAUDE_MD_END_MARKER)
        )
        if old_end < len(existing) and existing[old_end] == '\n':
            old_end += 1
        new_start = rendered_stub.find(CLAUDE_MD_MARKER)
        new_end = (
            rendered_stub.find(CLAUDE_MD_END_MARKER, new_start)
            + len(CLAUDE_MD_END_MARKER)
        )
        if new_end < len(rendered_stub) and rendered_stub[new_end] == '\n':
            new_end += 1
        block = rendered_stub[new_start:new_end]
        return existing[:old_start] + block + existing[old_end:]

    # Older releases generated a dedicated Cursor rule without ownership
    # markers. Recognize only that exact Uclusion-owned frontmatter; an
    # arbitrary same-named rule belongs to the user.
    if client == 'cursor':
        if existing.startswith(CURSOR_MDC_FRONTMATTER):
            return rendered_stub
        if existing:
            raise RuntimeError(
                f'{target_path} is not a Uclusion-managed Cursor rule; '
                'refusing to overwrite it'
            )
        return rendered_stub

    if not existing:
        return rendered_stub
    separator = '' if existing.endswith('\n') else '\n'
    return existing + separator + '\n' + rendered_stub


def install_skill_and_stub(
    fetch_bundle,
    skill_dir,
    resident_path,
    client,
    client_label,
    assume_yes=False,
    require_dir=None,
):
    """Install one native skill package, then shrink its resident instructions.

    The complete bundle is fetched and validated before the first write. The
    complete managed package is staged and durably swapped as one directory;
    a resident-write failure rolls that swap back. Existing unmarked packages,
    links, special files, and resident Cursor rules are user-owned collisions.
    """
    if client not in CLIENT_STUB_ASSET:
        raise ValueError(f'unsupported workflow client: {client}')
    if require_dir is not None and not os.path.isdir(require_dir):
        print(f"ℹ️  No {require_dir} found; skipping {client_label} workflow.")
        return False
    with install_lock():
        _recover_skill_transaction(skill_dir)
        _validate_owned_skill(skill_dir)
        resident_target = _config_write_target(resident_path)
        existing, resident_signature = _read_text_snapshot(resident_target)

        has_managed_resident = (
            (
                CLAUDE_MD_MARKER in existing
                and CLAUDE_MD_END_MARKER in existing
            )
            or (
                client == 'cursor'
                and existing.startswith(CURSOR_MDC_FRONTMATTER)
            )
        )
        action = 'refresh' if has_managed_resident else (
            'append' if existing and client != 'cursor' else 'create'
        )
        if not assume_yes:
            default_yes = action == 'refresh'
            prompt = (
                f"  Install Uclusion skill and {action} its {client_label} "
                f"bootstrap at {resident_path}?"
            )
            if not prompt_yes_no(prompt, default=default_yes):
                print(f"  ⏭  Skipped {client_label} workflow update.")
                return False

        bundle = fetch_bundle()
        if bundle is None:
            raise RuntimeError('the Uclusion workflow bundle is unavailable')
        validate_workflow_bundle(bundle)

        environment = getattr(fetch_bundle, '__dict__', {}).get(
            'workflow_environment'
        )
        rendered_stub = bundle[CLIENT_STUB_ASSET[client]]
        if environment in ('dev', 'stage', 'production'):
            cli_command = (
                'uclusion'
                if environment == 'production'
                else f'uclusion -e {environment}'
            )
            rendered_stub = rendered_stub.replace(
                WORKFLOW_ENV_PLACEHOLDER, cli_command
            )
        resident_content = _resident_update(
            existing, rendered_stub, client, resident_path
        )

        transaction = _begin_skill_transaction(
            skill_dir,
            bundle,
            resident_target,
            _resident_state_digest(existing, resident_signature),
            hashlib.sha256(resident_content.encode('utf-8')).hexdigest(),
            resident_signature,
        )
        normalized_skill_dir, staging_dir, backup_dir = transaction[:3]
        had_existing = transaction[4]
        try:
            _swap_staged_skill(
                normalized_skill_dir, staging_dir, backup_dir, had_existing
            )
            atomic_write_text(
                resident_path,
                resident_content,
                existing,
                resident_target,
                resident_signature,
            )
        except Exception:
            # atomic_write_text never raises after its os.replace commit. Any
            # caught error therefore leaves the resident uncommitted, so the
            # package must be restored even if an editor concurrently changed
            # unrelated resident text to a third journal hash.
            _rollback_skill_transaction(normalized_skill_dir)
            raise
        _commit_skill_transaction(normalized_skill_dir)

    print(f"  ✅ Installed Uclusion skill for {client_label} at {skill_dir}")
    action_past_tense = {
        'refresh': 'Refreshed',
        'append': 'Appended',
        'create': 'Created',
    }[action]
    print(f"  ✅ {action_past_tense} Uclusion bootstrap in {resident_path}")
    return True


def _codex_project_fallback_filenames():
    """Read safe project instruction fallback names from Codex config."""
    if tomllib is None:
        return ()
    config_target = _config_write_target(CODEX_CONFIG_PATH)
    if not os.path.exists(config_target):
        return ()
    try:
        with open(config_target, 'rb') as config_file:
            config = tomllib.load(config_file)
    except (OSError, tomllib.TOMLDecodeError) as err:
        raise RuntimeError(
            f'could not read Codex instruction fallbacks from '
            f'{CODEX_CONFIG_PATH}: {err}'
        ) from err
    names = config.get('project_doc_fallback_filenames', [])
    if not isinstance(names, list):
        raise RuntimeError(
            'Codex project_doc_fallback_filenames must be an array of names'
        )
    result = []
    for name in names:
        if (
            not isinstance(name, str)
            or not name
            or name in ('.', '..')
            or os.path.basename(name) != name
            or '/' in name
            or '\\' in name
        ):
            raise RuntimeError(
                f'unsafe Codex project instruction fallback name: {name!r}'
            )
        if name not in result:
            result.append(name)
    return tuple(result)


def effective_codex_instruction_path(scope_dir, include_fallbacks=False):
    """Return the first nonempty instruction file Codex reads in a scope."""
    names = ['AGENTS.override.md', 'AGENTS.md']
    if include_fallbacks:
        names.extend(_codex_project_fallback_filenames())
    for name in names:
        path = os.path.join(scope_dir, name)
        if not os.path.lexists(path):
            continue
        target = _config_write_target(path)
        existing, _signature = _read_text_snapshot(target)
        if existing.strip():
            return path
    return os.path.join(scope_dir, 'AGENTS.md')


_WORKFLOW_VERSION_UNSET = object()


def persist_workflow_install_state(
    config_path,
    installed_clients,
    workflow_version=_WORKFLOW_VERSION_UNSET,
    pending_add=(),
    pending_remove=(),
):
    """Merge successful client installs and optionally stamp their release."""
    clients = {
        client for client in installed_clients
        if client in CLIENT_STUB_ASSET
    }
    with install_lock():
        logical_path = os.path.abspath(os.path.expanduser(config_path))
        target_path = _config_write_target(logical_path)
        existing, signature = _read_text_snapshot(target_path)
        try:
            config = json.loads(existing)
        except json.JSONDecodeError as err:
            raise RuntimeError(
                f'{config_path} is not valid JSON: {err}'
            ) from err
        if not isinstance(config, dict):
            raise RuntimeError(f'{config_path} must contain a JSON object')
        previous = config.get('workflowClients', [])
        if not isinstance(previous, list):
            previous = []
        clients.update(
            client for client in previous if client in CLIENT_STUB_ASSET
        )
        config['workflowClients'] = sorted(clients)
        if workflow_version is not _WORKFLOW_VERSION_UNSET:
            if workflow_version:
                config['workflowReinstallVersion'] = workflow_version
            else:
                config.pop('workflowReinstallVersion', None)
        previous_pending = config.get('workflowInstallPending', [])
        if not isinstance(previous_pending, list):
            previous_pending = []
        pending = {
            client for client in previous_pending
            if client in CLIENT_STUB_ASSET
        }
        pending.difference_update({
            client for client in pending_remove
            if client in CLIENT_STUB_ASSET
        })
        pending.update({
            client for client in pending_add
            if client in CLIENT_STUB_ASSET
        })
        if pending:
            config['workflowInstallPending'] = sorted(pending)
        else:
            config.pop('workflowInstallPending', None)
        updated = json.dumps(config, indent=2) + '\n'
        atomic_write_text(
            logical_path,
            updated,
            existing,
            target_path,
            signature,
        )


def finish_workflow_installs(
    config_path,
    results,
    errors,
    script_version,
    allow_skips=True,
):
    """Persist successes, stamp only a fully successful selected install."""
    successful = {
        client for client, installed in results.items() if installed
    }
    skipped = {
        client for client, installed in results.items() if not installed
    }
    aggregate_errors = list(errors)
    if skipped and not allow_skips:
        aggregate_errors.extend(
            (
                client,
                RuntimeError('selected workflow did not install'),
            )
            for client in sorted(skipped)
            if not any(error_client == client for error_client, _ in errors)
        )
    failed = skipped | {
        client for client, _error in aggregate_errors
    }
    all_succeeded = (
        bool(results)
        and not skipped
        and not aggregate_errors
    )
    if results:
        workflow_version = (
            script_version if all_succeeded else _WORKFLOW_VERSION_UNSET
        )
        persist_workflow_install_state(
            config_path,
            successful,
            workflow_version,
            pending_add=failed,
            pending_remove=successful,
        )
    if aggregate_errors:
        detail = '; '.join(
            f'{client}: {error}' for client, error in aggregate_errors
        )
        raise RuntimeError(f'workflow installation failed ({detail})')
    return results


def build_parser():
    parser = argparse.ArgumentParser(
        prog='uclusionInstall',
        description='Install the Uclusion CLI and MCP proxy and configure them.',
    )
    parser.add_argument(
        'environment',
        choices=['dev', 'stage', 'production'],
        help='Uclusion environment to install scripts from.',
    )
    parser.add_argument(
        'workspace_id',
        help='Uclusion workspaceId to configure, or "setup" to bootstrap setup.',
    )
    parser.add_argument(
        'view_id', nargs='?',
        help='Uclusion viewId to configure.',
    )
    parser.add_argument(
        '--clients',
        help='Comma list of AI clients to configure (claude, cursor, codex). '
             'Supplying this makes the install non-interactive and forces '
             'configuration of the selected clients.',
    )
    parser.add_argument(
        '--project',
        action='store_true',
        help='With --clients, configure the current working directory instead '
             'of the home directory (run from your project root).',
    )
    parser.add_argument(
        '--scripts-only',
        action='store_true',
        help='Refresh the scripts and workspace config without touching any '
             'AI client configuration (used by `uclusion update` when no '
             'client surfaces are detected).',
    )
    parser.add_argument(
        '--skip-scripts',
        action='store_true',
        help='Configure surfaces without reinstalling the scripts (used by '
             '`uclusion update` for the project pass after its global pass '
             'already refreshed the scripts).',
    )
    token_audit_group = parser.add_mutually_exclusive_group()
    token_audit_group.add_argument(
        '--token-audit',
        dest='token_audit',
        action='store_true',
        help='Enable per-job token usage notes for supported AI clients.',
    )
    token_audit_group.add_argument(
        '--no-token-audit',
        dest='token_audit',
        action='store_false',
        help='Disable token usage notes and remove Uclusion-owned client settings.',
    )
    parser.set_defaults(token_audit=None)
    work_claims_group = parser.add_mutually_exclusive_group()
    work_claims_group.add_argument(
        '--work-claims',
        dest='work_claims',
        action='store_true',
        help='Enable the opt-in work claim lock so idle agents on any machine '
             'do not start the same job or bug.',
    )
    work_claims_group.add_argument(
        '--no-work-claims',
        dest='work_claims',
        action='store_false',
        help='Disable the work claim lock.',
    )
    parser.set_defaults(work_claims=None)
    parser.add_argument(
        '--script-version',
        help=argparse.SUPPRESS,
    )
    parser.add_argument(
        '--replace-setup',
        action='store_true',
        help=argparse.SUPPRESS,
    )
    parser.add_argument(
        '--setup-receipt',
        help=argparse.SUPPRESS,
    )
    return parser


def parse_clients(clients_arg):
    """Validate the ``--clients`` comma list; exits with an error on unknown names."""
    clients = {client.strip().lower() for client in clients_arg.split(',') if client.strip()}
    unknown = clients - SUPPORTED_CLIENTS
    if unknown:
        print(f"❌ Unknown --clients value(s): {', '.join(sorted(unknown))} "
              f"(expected claude, cursor, codex)")
        sys.exit(64)
    if not clients:
        print("❌ --clients was supplied but named no clients (expected claude, cursor, codex)")
        sys.exit(64)
    return clients


def _setup_registration_target(client, project_dir=None):
    if client == 'claude':
        path = (
            os.path.join(project_dir, '.mcp.json')
            if project_dir is not None else CLAUDE_JSON_PATH
        )
        label = 'Claude Code' + (' (project)' if project_dir else '')
        return path, label, False
    if client == 'cursor':
        path = (
            os.path.join(project_dir, '.cursor', 'mcp.json')
            if project_dir is not None else CURSOR_MCP_PATH
        )
        label = 'Cursor' + (' (project)' if project_dir else '')
        return path, label, False
    if client != 'codex':
        raise ValueError(f'unsupported setup client: {client}')
    path = (
        os.path.join(project_dir, '.codex', 'config.toml')
        if project_dir is not None else CODEX_CONFIG_PATH
    )
    return path, 'Codex' + (' (project)' if project_dir else ''), True


def _assert_setup_registration_state(client, project_dir, expected):
    path, _label, is_codex = _setup_registration_target(client, project_dir)
    target_path = _config_write_target(path)
    existing, signature = _read_text_snapshot(target_path)
    if is_codex:
        validate_codex_config(existing)
        _assert_expected_codex_descriptor(existing, expected, path)
        return
    if signature is None:
        config = {}
    else:
        try:
            config = json.loads(existing)
        except json.JSONDecodeError as error:
            raise RuntimeError(f'{path} is not valid JSON: {error}') from error
        if not isinstance(config, dict):
            raise RuntimeError(f'{path} top-level value must be a JSON object')
    servers = config.get('mcpServers', {})
    if not isinstance(servers, dict):
        raise RuntimeError(f"'mcpServers' in {path} must be a JSON object")
    _assert_expected_json_descriptor(servers, expected, path)


def assert_setup_registration(env, client, project_dir=None):
    """Read-only preflight proving the selected setup descriptor is unchanged."""
    _assert_setup_registration_state(
        client,
        project_dir,
        setup_mcp_descriptor(env, client, project_dir),
    )


def assert_setup_registration_absent(client, project_dir=None):
    """Read-only preflight proving the selected scope has no Uclusion server."""
    _assert_setup_registration_state(client, project_dir, None)


def install_setup_registration(env, client, project_dir=None):
    """Register setup only when the selected scope has no Uclusion descriptor."""
    descriptor = setup_mcp_descriptor(env, client, project_dir)
    path, label, is_codex = _setup_registration_target(client, project_dir)
    if is_codex:
        return register_codex_descriptor(
            descriptor,
            config_path=path,
            expected_descriptor=None,
        )
    return register_mcp_json(
        path,
        f'{label} setup',
        None,
        None,
        require_existing=False,
        descriptor=descriptor,
        expected_descriptor=None,
    )


def replace_setup_registration(
    env,
    client,
    workspace_id,
    project_dir=None,
    token_audit=None,
    work_claims=False,
    view_id=None,
    setup_receipt_path=None,
):
    """Atomically replace only this installer's exact temporary descriptor."""
    environment = env or 'production'
    receipt_path = _assert_setup_receipt_target(
        setup_receipt_path,
        environment,
        client,
        project_dir,
    )
    if not _setup_identifier(view_id):
        raise ValueError('setup replacement requires a valid view ID')
    expected = setup_mcp_descriptor(env, client, project_dir)
    descriptor = runtime_mcp_descriptor(
        workspace_id,
        env,
        token_audit=token_audit if client == 'claude' else None,
        token_audit_client='claude' if client == 'claude' else None,
        work_claims=work_claims,
        setup_receipt_path=receipt_path,
        setup_view_id=view_id,
    )
    path, label, is_codex = _setup_registration_target(client, project_dir)
    if is_codex:
        return register_codex_descriptor(
            descriptor,
            config_path=path,
            expected_descriptor=expected,
        )
    return register_mcp_json(
        path,
        label,
        None,
        None,
        require_existing=False,
        descriptor=descriptor,
        expected_descriptor=expected,
    )


def install_global(workspace_id, view_id, mcp_env, fetch_bundle, clients=None,
                   script_version=None, token_audit_enabled=None,
                   work_claims_enabled=None, replace_setup=False,
                   setup_receipt_path=None):
    """Configure Uclusion in the user's home directory (the default).

    Without ``clients`` every detected client is offered interactively. With
    ``clients`` (an explicit ``--clients`` selection) only those clients are
    configured, without prompts, and their config files are created even when
    the client is not detected on the machine. An empty ``clients`` set (the
    ``--scripts-only`` update path) writes just the workspace config.
    """
    setup_client = None
    if replace_setup:
        if not clients or len(clients) != 1:
            raise RuntimeError('setup replacement requires exactly one client')
        setup_client = next(iter(clients))
        _assert_setup_receipt_target(
            setup_receipt_path,
            mcp_env or 'production',
            setup_client,
        )
        if not _setup_identifier(view_id):
            raise ValueError('setup replacement requires a valid view ID')
        assert_setup_registration(mcp_env, setup_client)
    interactive = clients is None
    config_path = os.path.join(UCLUSION_HOME, CONFIG_FILES[mcp_env or 'production'])
    token_audit, work_claims = write_uclusion_config(
        workspace_id, view_id, config_path, script_version, token_audit_enabled,
        work_claims_enabled
    )
    if clients:
        persist_workflow_install_state(
            config_path,
            clients,
            pending_add=clients,
        )
    workflow_results = {}
    workflow_errors = []
    claude_registration_audit = token_audit
    claude_selected = interactive or 'claude' in clients
    claude_detected = (
        not interactive
        or os.path.exists(CLAUDE_JSON_PATH)
        or os.path.isdir(CLAUDE_CONFIG_HOME)
    )
    cursor_selected = interactive or 'cursor' in clients
    cursor_detected = not interactive or os.path.exists(CURSOR_MCP_PATH)
    codex_selected = interactive or 'codex' in clients
    codex_detected = not interactive or os.path.isdir(CODEX_HOME)
    if interactive:
        persist_workflow_install_state(
            config_path,
            set(),
            pending_add={
                client
                for client, detected in (
                    ('claude', claude_detected),
                    ('cursor', cursor_detected),
                    ('codex', codex_detected),
                )
                if detected
            },
        )
    if claude_selected and claude_detected:
        add_claude_permissions(CLAUDE_SETTINGS_PATH)
        result = configure_claude_token_audit(
            CLAUDE_SETTINGS_PATH,
            token_audit['enabled'],
            mcp_env or 'production',
            workspace_id,
            token_audit['port'],
            token_audit.get('claudeManagedEnv'),
        )
        if result is not None:
            update_token_audit_client_config(
                config_path, result['source'], result['managedEnv']
            )
            if result['source'] is None:
                token_audit.pop('claudeSource', None)
            else:
                token_audit['claudeSource'] = result['source']
            if result['managedEnv']:
                token_audit['claudeManagedEnv'] = result['managedEnv']
            else:
                token_audit.pop('claudeManagedEnv', None)
            if result.get('available') is False:
                claude_registration_audit = None
        else:
            raise RuntimeError(
                f'failed to configure Claude settings at '
                f'{CLAUDE_SETTINGS_PATH}'
            )
    elif (
        clients
        and not replace_setup
        and token_audit_enabled is False
        and os.path.exists(CLAUDE_SETTINGS_PATH)
    ):
        # An explicit global disable cleans up a prior Claude selection even
        # when this reinstall currently selects only Codex.
        result = configure_claude_token_audit(
            CLAUDE_SETTINGS_PATH, False, mcp_env or 'production', workspace_id,
            token_audit['port'], token_audit.get('claudeManagedEnv')
        )
        if result is not None:
            update_token_audit_client_config(config_path, None, {})
        else:
            raise RuntimeError(
                f'failed to disable Claude token audit at '
                f'{CLAUDE_SETTINGS_PATH}'
            )
    if cursor_selected and not replace_setup:
        register_mcp_json(CURSOR_MCP_PATH, 'Cursor', workspace_id, mcp_env,
                          require_existing=interactive, work_claims=work_claims)
    if claude_selected and not replace_setup:
        register_mcp_json(
            CLAUDE_JSON_PATH, 'Claude Code', workspace_id, mcp_env,
            require_existing=interactive, token_audit=claude_registration_audit,
            token_audit_client='claude', work_claims=work_claims
        )
    if claude_selected:
        if not claude_detected:
            workflow_results['claude'] = False
        else:
            try:
                workflow_results['claude'] = install_skill_and_stub(
                    fetch_bundle,
                    CLAUDE_SKILL_DIR,
                    CLAUDE_MD_PATH,
                    'claude',
                    'Claude Code',
                    assume_yes=not interactive,
                )
            except Exception as err:
                workflow_results['claude'] = False
                workflow_errors.append(('claude', err))
    if cursor_selected:
        if not cursor_detected:
            workflow_results['cursor'] = False
        else:
            try:
                installed = install_skill_and_stub(
                    fetch_bundle,
                    CURSOR_SKILL_DIR,
                    CURSOR_MDC_PATH,
                    'cursor',
                    'Cursor',
                    assume_yes=not interactive,
                )
                workflow_results['cursor'] = installed
                if installed:
                    remove_cursor_poke_drain_hook(CURSOR_HOOKS_PATH)
            except Exception as err:
                workflow_results['cursor'] = False
                workflow_errors.append(('cursor', err))
    if codex_selected:
        if not codex_detected:
            workflow_results['codex'] = False
        else:
            try:
                codex_resident_path = effective_codex_instruction_path(
                    CODEX_HOME
                )
                installed = install_skill_and_stub(
                    fetch_bundle,
                    CODEX_SKILL_DIR,
                    codex_resident_path,
                    'codex',
                    'Codex',
                    assume_yes=not interactive,
                    require_dir=CODEX_HOME if interactive else None,
                )
                workflow_results['codex'] = installed
                if installed and not replace_setup:
                    update_codex_integration_config(
                        workspace_id, mcp_env, force=not interactive,
                        work_claims=work_claims
                    )
            except Exception as err:
                workflow_results['codex'] = False
                workflow_errors.append(('codex', err))
    result = finish_workflow_installs(
        config_path,
        workflow_results,
        workflow_errors,
        script_version,
        allow_skips=interactive,
    )
    if replace_setup:
        replace_setup_registration(
            mcp_env,
            setup_client,
            workspace_id,
            token_audit=claude_registration_audit,
            work_claims=work_claims,
            view_id=view_id,
            setup_receipt_path=setup_receipt_path,
        )
    return result


def install_project_level(
    workspace_id,
    view_id,
    mcp_env,
    fetch_bundle,
    project_dir,
    clients=None,
    script_version=None,
    token_audit_enabled=None,
    work_claims_enabled=None,
    replace_setup=False,
    setup_receipt_path=None,
):
    """Configure Uclusion inside ``project_dir`` instead of the home directory.

    Writes the workspace config and the project-scoped MCP registrations and
    workflow docs into the project. The CLI binaries stay user-global under
    ~/.local; only configuration becomes project-local. Legacy project installs
    keep using ``uclusion codex`` launch overrides. An agent-led setup transition
    also replaces its temporary Uclusion entry in the trusted project's
    ``.codex/config.toml`` with the runtime proxy; ``uclusion codex`` can still
    supply the same selected workspace and environment as private app-server
    overrides at launch. This keeps its MCP proxy and Poke companion aligned.
    The installer also removes the obsolete marker-owned Uclusion lifecycle-hook
    block from global Codex config when one is present. With ``clients`` (an
    explicit ``--clients`` selection) only those clients are configured and
    nothing prompts.
    """
    setup_client = None
    if replace_setup:
        if not clients or len(clients) != 1:
            raise RuntimeError('setup replacement requires exactly one client')
        setup_client = next(iter(clients))
        _assert_setup_receipt_target(
            setup_receipt_path,
            mcp_env or 'production',
            setup_client,
            project_dir,
        )
        if not _setup_identifier(view_id):
            raise ValueError('setup replacement requires a valid view ID')
        assert_setup_registration(mcp_env, setup_client, project_dir)
    interactive = clients is None
    print(f"📁 Project-level install into {project_dir}")
    os.makedirs(project_dir, exist_ok=True)

    config_path = os.path.join(project_dir, CONFIG_FILES[mcp_env or 'production'])
    token_audit, work_claims = write_uclusion_config(
        workspace_id, view_id, config_path, script_version, token_audit_enabled,
        work_claims_enabled
    )
    if clients:
        persist_workflow_install_state(
            config_path,
            clients,
            pending_add=clients,
        )
    workflow_results = {}
    workflow_errors = []
    if interactive:
        persist_workflow_install_state(
            config_path,
            set(),
            pending_add=set(CLIENT_STUB_ASSET),
        )
    claude_registration_audit = token_audit
    claude_settings_path = os.path.join(project_dir, '.claude', 'settings.local.json')
    claude_selected = interactive or 'claude' in clients
    if claude_selected:
        add_claude_permissions(claude_settings_path)
        result = configure_claude_token_audit(
            claude_settings_path,
            token_audit['enabled'],
            mcp_env or 'production',
            workspace_id,
            token_audit['port'],
            token_audit.get('claudeManagedEnv'),
        )
        if result is not None:
            update_token_audit_client_config(
                config_path, result['source'], result['managedEnv']
            )
            if result['source'] is None:
                token_audit.pop('claudeSource', None)
            else:
                token_audit['claudeSource'] = result['source']
            if result['managedEnv']:
                token_audit['claudeManagedEnv'] = result['managedEnv']
            else:
                token_audit.pop('claudeManagedEnv', None)
            if result.get('available') is False:
                claude_registration_audit = None
        else:
            raise RuntimeError(
                f'failed to configure Claude settings at '
                f'{claude_settings_path}'
            )
        if not replace_setup:
            register_mcp_json(
                os.path.join(project_dir, '.mcp.json'),
                'Claude Code (project)', workspace_id, mcp_env,
                require_existing=False, token_audit=claude_registration_audit,
                token_audit_client='claude', work_claims=work_claims
            )
    elif (
        clients
        and not replace_setup
        and token_audit_enabled is False
        and os.path.exists(claude_settings_path)
    ):
        result = configure_claude_token_audit(
            claude_settings_path, False, mcp_env or 'production', workspace_id,
            token_audit['port'], token_audit.get('claudeManagedEnv')
        )
        if result is not None:
            update_token_audit_client_config(config_path, None, {})
        else:
            raise RuntimeError(
                f'failed to disable Claude token audit at '
                f'{claude_settings_path}'
            )
    if (interactive or 'cursor' in clients) and not replace_setup:
        register_mcp_json(os.path.join(project_dir, '.cursor', 'mcp.json'),
                          'Cursor (project)', workspace_id, mcp_env,
                          require_existing=False, work_claims=work_claims)
    if interactive or 'claude' in clients:
        try:
            workflow_results['claude'] = install_skill_and_stub(
                fetch_bundle,
                os.path.join(project_dir, '.claude', 'skills', 'uclusion'),
                os.path.join(project_dir, 'CLAUDE.md'),
                'claude',
                'Claude Code (project)',
                assume_yes=not interactive,
            )
        except Exception as err:
            workflow_results['claude'] = False
            workflow_errors.append(('claude', err))
    if interactive or 'cursor' in clients:
        try:
            installed = install_skill_and_stub(
                fetch_bundle,
                os.path.join(project_dir, '.cursor', 'skills', 'uclusion'),
                os.path.join(project_dir, '.cursor', 'rules', 'uclusion.mdc'),
                'cursor',
                'Cursor (project)',
                assume_yes=not interactive,
            )
            workflow_results['cursor'] = installed
            if installed:
                remove_cursor_poke_drain_hook(
                    os.path.join(project_dir, '.cursor', 'hooks.json')
                )
        except Exception as err:
            workflow_results['cursor'] = False
            workflow_errors.append(('cursor', err))
    if interactive or 'codex' in clients:
        try:
            codex_resident_path = effective_codex_instruction_path(
                project_dir, include_fallbacks=True
            )
            installed = install_skill_and_stub(
                fetch_bundle,
                os.path.join(project_dir, '.agents', 'skills', 'uclusion'),
                codex_resident_path,
                'codex',
                'Codex (project)',
                assume_yes=not interactive,
            )
            workflow_results['codex'] = installed
            if installed and not replace_setup:
                # The relay-authoritative companion needs no lifecycle hooks.
                remove_legacy_codex_hooks_config(force=not interactive)
        except Exception as err:
            workflow_results['codex'] = False
            workflow_errors.append(('codex', err))
    result = finish_workflow_installs(
        config_path,
        workflow_results,
        workflow_errors,
        script_version,
        allow_skips=interactive,
    )
    if replace_setup:
        replace_setup_registration(
            mcp_env,
            setup_client,
            workspace_id,
            project_dir=project_dir,
            token_audit=claude_registration_audit,
            work_claims=work_claims,
            view_id=view_id,
            setup_receipt_path=setup_receipt_path,
        )
    return result


def main():
    if len(sys.argv) > 1 and sys.argv[1] == RUNTIME_PROXY_MODE:
        try:
            return launch_runtime_proxy(sys.argv[2:])
        except Exception:
            sys.stderr.write('Uclusion MCP proxy could not start safely.\n')
            return 1
    if len(sys.argv) > 1 and sys.argv[1] == RUNTIME_CLEANUP_MODE:
        try:
            return cleanup_runtime_receipt(sys.argv[2:])
        except Exception:
            return 1
    parser = build_parser()
    args = parser.parse_args()
    env = args.environment
    workspace_id = args.workspace_id
    view_id = args.view_id
    mcp_env = None if env == 'production' else env

    if workspace_id == 'setup':
        if view_id is not None:
            parser.error('setup mode takes no workspace or view ID')
        if not args.clients:
            parser.error(
                'setup mode requires --clients <claude|cursor|codex>'
            )
        clients = parse_clients(args.clients)
        if len(clients) != 1:
            parser.error('setup mode requires exactly one --clients value')
        if any((
            args.scripts_only,
            args.skip_scripts,
            args.replace_setup,
            args.setup_receipt is not None,
            args.token_audit is not None,
            args.work_claims is not None,
            args.script_version is not None,
        )):
            parser.error(
                'setup mode accepts only --clients and optional --project'
            )
        try:
            project_dir = os.getcwd() if args.project else None
            setup_client = next(iter(clients))
            assert_setup_registration_absent(setup_client, project_dir)
            install_scripts(env, None, setup_bootstrap=True)
            install_setup_registration(env, setup_client, project_dir)
        except Exception as err:
            print(f"❌ Setup bootstrap failed: {err}")
            return 1
        print(
            "🎉 Uclusion setup bootstrap complete. Restart or reconnect "
            "the selected client to load create_workspace and complete_setup."
        )
        return 0

    if view_id is None:
        parser.error('a view ID is required for a normal install')
    if args.replace_setup and (not args.clients or args.scripts_only):
        parser.error('--replace-setup requires one client install')
    if args.replace_setup and args.setup_receipt is None:
        parser.error('--replace-setup requires setup recovery state')
    if args.setup_receipt is not None and not args.replace_setup:
        parser.error('--setup-receipt requires --replace-setup')

    if args.scripts_only:
        clients = set()
    else:
        clients = parse_clients(args.clients) if args.clients else None
    if args.replace_setup and len(clients) != 1:
        parser.error('--replace-setup requires exactly one --clients value')

    try:
        if args.replace_setup:
            setup_project_dir = os.getcwd() if args.project else None
            setup_client = next(iter(clients))
            _assert_setup_receipt_target(
                args.setup_receipt,
                env,
                setup_client,
                setup_project_dir,
            )
            assert_setup_registration(
                mcp_env,
                setup_client,
                setup_project_dir,
            )
        fetch_bundle = make_workflow_bundle_fetcher(env)
        # A web/update-selected workflow install must prove that every asset
        # belongs to this installer release before scripts or config change.
        if clients:
            fetch_bundle()
        script_version = (
            validate_release_name(args.script_version)
            if args.script_version is not None
            else fetch_script_reinstall_version(env, workspace_id)
        )
        if not args.skip_scripts:
            install_scripts(env, script_version)
        if clients is not None:
            # Non-interactive: the web setup page's selector chose everything already
            project_dir = os.getcwd() if args.project else None
        else:
            project_dir = prompt_install_scope()
        if project_dir is None:
            install_global(
                workspace_id,
                view_id,
                mcp_env,
                fetch_bundle,
                clients,
                script_version,
                args.token_audit,
                args.work_claims,
                args.replace_setup,
                args.setup_receipt,
            )
        else:
            install_project_level(
                workspace_id,
                view_id,
                mcp_env,
                fetch_bundle,
                project_dir,
                clients,
                script_version,
                args.token_audit,
                args.work_claims,
                args.replace_setup,
                args.setup_receipt,
            )
    except subprocess.CalledProcessError as err:
        print(f"❌ Command failed: {err}")
        return 1
    except Exception as err:
        print(f"❌ Installation failed: {err}")
        return 1

    print("🎉 Uclusion install complete.")
    return 0


if __name__ == '__main__':
    sys.exit(main())
