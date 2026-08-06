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
  presence — not file presence — is the install signal). Cursor also gets a
  ``stop`` hook in ``~/.cursor/hooks.json`` that drains pending Pokes via
  ``uclusionCursorPokeDrain.py`` (S-all-192).
* Project level writes everything into a directory the user supplies: the
  workspace config (``uclusion.json``), project-scoped MCP registrations
  (``.mcp.json`` for Claude Code, ``.cursor/mcp.json`` for Cursor), the
  Cursor ``.cursor/hooks.json`` stop-hook entry, and the workflow docs
  (``CLAUDE.md``, ``.cursor/rules/uclusion.mdc``, ``AGENTS.md``).
  Codex receives its project-specific MCP table from ``uclusion codex`` at
  launch. The CLI binaries themselves always stay user-global under
  ``~/.local``.
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
# Cursor stop-hook drain binary name (S-all-192); also the hooks.json token.
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
    ('uclusionCLI.py', 'uclusion.py', 'uclusion'),
    ('uclusionMCPProxy.py', 'uclusionMCPProxy.py', 'uclusionMCPProxy.py'),
    ('uclusionCodexBridge.py', 'uclusionCodexBridge.py', 'uclusionCodexBridge.py'),
    ('uclusionTokenAudit.py', 'uclusionTokenAudit.py', TOKEN_AUDIT_SYMLINK_NAME),
    # Cursor stop-hook drain (S-all-192): claimed by hooks.json, not PATH UX.
    ('uclusionCursorPokeDrain.py', 'uclusionCursorPokeDrain.py',
     CURSOR_POKE_DRAIN_SYMLINK_NAME),
)

UCLUSION_HOME = os.path.join(os.path.expanduser('~'), '.uclusion')
# Workspace config filenames are environment-specific — the same names the CLI
# reads (S-all-163): production stays uclusion.json, stage/dev get prefixed so
# `uclusion -e stage ...` finds the config the installer wrote.
CONFIG_FILES = {
    'dev': 'dev_uclusion.json',
    'stage': 'stage_uclusion.json',
    'production': 'uclusion.json',
}
CURSOR_MCP_PATH = os.path.join(os.path.expanduser('~'), '.cursor', 'mcp.json')
CLAUDE_JSON_PATH = os.path.join(os.path.expanduser('~'), '.claude.json')
CLAUDE_MD_PATH = os.path.join(os.path.expanduser('~'), '.claude', 'CLAUDE.md')
CLAUDE_SETTINGS_PATH = os.path.join(os.path.expanduser('~'), '.claude', 'settings.json')
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
CURSOR_MDC_PATH = os.path.join(os.path.expanduser('~'), '.cursor', 'rules', 'uclusion.mdc')
CURSOR_HOOKS_PATH = os.path.join(os.path.expanduser('~'), '.cursor', 'hooks.json')
CURSOR_MDC_FRONTMATTER = (
    '---\n'
    'description: Uclusion job workflow — invoke when working on a Uclusion '
    'job/task/bug short code (J-*, T-*, B-*)\n'
    'alwaysApply: true\n'
    '---\n'
)
MCP_PROXY_SYMLINK_PATH = os.path.join(SYMLINK_DIR, 'uclusionMCPProxy.py')
TOKEN_AUDIT_SYMLINK_PATH = os.path.join(SYMLINK_DIR, TOKEN_AUDIT_SYMLINK_NAME)
CODEX_BRIDGE_SYMLINK_PATH = os.path.join(SYMLINK_DIR, 'uclusionCodexBridge.py')
CODEX_HOME = os.path.join(os.path.expanduser('~'), '.codex')
CODEX_CONFIG_PATH = os.path.join(CODEX_HOME, 'config.toml')
CODEX_AGENTS_MD_PATH = os.path.join(CODEX_HOME, 'AGENTS.md')
# The MCP table we manage in config.toml is delimited by TOML comment markers so
# reruns can replace it in place without disturbing the user's other settings.
CODEX_CONFIG_MARKER = '# uclusion-mcp:v1'
CODEX_CONFIG_END_MARKER = '# /uclusion-mcp:v1'
# Releases before J-all-369 installed lifecycle hooks for root-thread
# discovery. The inline relay now owns that authority directly, but these
# marker names remain part of the installer so an update can remove only the
# obsolete Uclusion-owned block without disturbing anybody else's hooks.
LEGACY_CODEX_HOOKS_MARKER = '# uclusion-codex-bridge-hooks:v1'
LEGACY_CODEX_HOOKS_END_MARKER = '# /uclusion-codex-bridge-hooks:v1'


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


def install_scripts(env, script_version):
    """Publish a complete immutable release and atomically make it current."""
    base_url = get_scripts_base_url(env)
    with install_lock():
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
                download_to(base_url + source_name, staging_path)
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
                           token_audit_enabled=None):
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
    """
    print(f"🗂  Writing workspace config to {config_path}")
    os.makedirs(os.path.dirname(config_path), exist_ok=True)
    # Older installs wrote plain uclusion.json regardless of environment
    # (S-all-163); when the env-specific target does not exist yet, seed the
    # merge from that legacy file so user customizations migrate.
    merge_path = config_path
    if not os.path.exists(config_path):
        legacy_path = os.path.join(os.path.dirname(config_path), 'uclusion.json')
        if legacy_path != config_path and os.path.exists(legacy_path):
            merge_path = legacy_path
            print(f"  📎 Migrating settings from legacy {legacy_path}")
    config = {}
    if os.path.exists(merge_path):
        try:
            with open(merge_path, 'r', encoding='utf-8') as src:
                existing = json.load(src)
            if isinstance(existing, dict):
                config = existing
        except json.JSONDecodeError as err:
            print(f"  ⚠️  {merge_path} is not valid JSON ({err}); rewriting it.")
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
    with open(config_path, 'w', encoding='utf-8') as out:
        json.dump(config, out, indent=2)
        out.write('\n')
    print(f"  ✅ Wrote {config_path}")
    return dict(token_audit)


def update_token_audit_client_config(config_path, source=None, managed_env=None):
    """Persist Claude collection ownership after settings were merged.

    Ownership metadata lets ``--no-token-audit`` remove only values previously
    written by Uclusion. A user-modified value is never removed.
    """
    try:
        with open(config_path, 'r', encoding='utf-8') as src:
            config = json.load(src)
    except (OSError, json.JSONDecodeError) as err:
        print(f"  ⚠️  Could not record Claude token-audit settings in {config_path}: {err}")
        return
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
    with open(config_path, 'w', encoding='utf-8') as out:
        json.dump(config, out, indent=2)
        out.write('\n')


def register_mcp_json(path, label, workspace_id, env, require_existing,
                      token_audit=None, token_audit_client=None):
    """Register the Uclusion MCP server in a JSON config at ``path``.

    Handles every ``{"mcpServers": {...}}`` surface: the global Cursor
    ``mcp.json`` and Claude Code ``~/.claude.json``, plus the project-scoped
    ``.mcp.json`` / ``.cursor/mcp.json`` written by a project-level install.
    ``require_existing`` skips the file when it is absent — the global files are
    owned by those tools, so we never create them from scratch — whereas project
    files are ours to create and pass ``require_existing=False``.
    """
    exists = os.path.exists(path)
    if require_existing and not exists:
        print(f"ℹ️  No {path} found; skipping {label} MCP server registration.")
        return

    print(f"🧩 Registering Uclusion MCP server in {path}")
    config = {}
    if exists:
        try:
            with open(path, 'r', encoding='utf-8') as src:
                config = json.load(src)
        except json.JSONDecodeError as err:
            print(f"  ❌ {path} is not valid JSON: {err}")
            return
        if not isinstance(config, dict):
            print(f"  ❌ {path} top-level value must be a JSON object.")
            return

    args = [MCP_PROXY_SYMLINK_PATH, workspace_id]
    if env is not None:
        args.append(env)
    if token_audit and token_audit.get('enabled'):
        args.extend([
            '--token-audit',
            '--token-audit-port', str(token_audit['port']),
        ])
        source = token_audit.get('claudeSource')
        if source in ('otel', 'transcript'):
            args.extend(['--token-audit-source', source])
        if token_audit_client is not None:
            args.extend(['--token-audit-client', token_audit_client])

    servers = config.setdefault('mcpServers', {})
    if not isinstance(servers, dict):
        print(f"  ❌ 'mcpServers' in {path} must be a JSON object.")
        return

    servers['Uclusion'] = {
        'command': 'python3',
        'args': args,
    }

    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as out:
        json.dump(config, out, indent=2)
        out.write('\n')
    print(f"  ✅ Updated {path}")


def cursor_poke_drain_hook_entry():
    """Return the Cursor ``stop`` hook dict that drains pending Pokes."""
    return {
        # Absolute path through the installer symlink so project and global
        # hooks.json both track `uclusion update` without copying the script.
        # Computed from SYMLINK_DIR at call time so tests can patch the dir.
        'command': os.path.join(SYMLINK_DIR, CURSOR_POKE_DRAIN_SYMLINK_NAME),
        # Each follow-up is a real claimed Poke, not a retry of the same turn.
        'loop_limit': None,
    }


def _is_cursor_poke_drain_hook(entry):
    if not isinstance(entry, dict):
        return False
    command = entry.get('command')
    return isinstance(command, str) and CURSOR_POKE_DRAIN_HOOK_TOKEN in command


def install_cursor_poke_drain_hook(hooks_path=CURSOR_HOOKS_PATH):
    """Merge the Uclusion Poke drain ``stop`` hook into a Cursor hooks.json.

    ``hooks_path`` is ``~/.cursor/hooks.json`` for a global install and
    ``<project>/.cursor/hooks.json`` for a project-level one. Existing non-Uclusion
    hooks are preserved; a prior Uclusion stop entry is replaced in place.
    """
    print(f"🪝 Installing Cursor Poke drain stop hook in {hooks_path}")
    config = {}
    if os.path.exists(hooks_path):
        try:
            with open(hooks_path, 'r', encoding='utf-8') as src:
                config = json.load(src)
        except json.JSONDecodeError as err:
            print(f"  ❌ {hooks_path} is not valid JSON: {err}")
            return
        if not isinstance(config, dict):
            print(f"  ❌ {hooks_path} top-level value must be a JSON object.")
            return

    if 'version' not in config:
        config['version'] = 1
    elif config.get('version') != 1:
        print(
            f"  ❌ {hooks_path} has unsupported hooks version "
            f"{config.get('version')!r}; expected 1."
        )
        return

    hooks = config.setdefault('hooks', {})
    if not isinstance(hooks, dict):
        print(f"  ❌ 'hooks' in {hooks_path} must be a JSON object.")
        return
    stop_hooks = hooks.get('stop')
    if stop_hooks is None:
        stop_hooks = []
        hooks['stop'] = stop_hooks
    if not isinstance(stop_hooks, list):
        print(f"  ❌ 'hooks.stop' in {hooks_path} must be a JSON array.")
        return

    entry = cursor_poke_drain_hook_entry()
    replaced = False
    for index, existing in enumerate(stop_hooks):
        if _is_cursor_poke_drain_hook(existing):
            stop_hooks[index] = entry
            replaced = True
            break
    if not replaced:
        stop_hooks.append(entry)

    try:
        os.makedirs(os.path.dirname(hooks_path), exist_ok=True)
        with open(hooks_path, 'w', encoding='utf-8') as out:
            json.dump(config, out, indent=2)
            out.write('\n')
        action = 'Refreshed' if replaced else 'Added'
        print(f"  ✅ {action} Uclusion stop hook in {hooks_path}")
    except OSError as err:
        print(f"  ❌ Could not write {hooks_path}: {err}")


def add_claude_permissions(settings_path):
    """Merge the Uclusion allow rule into a Claude Code settings file (T-all-2299).

    ``settings_path`` is ``~/.claude/settings.json`` for a global install and
    ``<project>/.claude/settings.local.json`` for a project-level one -
    settings.local.json is the per-machine file Claude Code itself writes
    approved permissions to, so each collaborator picks the rule up by running
    the installer rather than through a committed file.
    """
    print(f"🔓 Allowing Uclusion MCP tools in {settings_path}")
    config = {}
    if os.path.exists(settings_path):
        try:
            with open(settings_path, 'r', encoding='utf-8') as src:
                config = json.load(src)
        except json.JSONDecodeError as err:
            print(f"  ❌ {settings_path} is not valid JSON: {err}")
            return
        if not isinstance(config, dict):
            print(f"  ❌ {settings_path} top-level value must be a JSON object.")
            return

    permissions = config.setdefault('permissions', {})
    if not isinstance(permissions, dict):
        print(f"  ❌ 'permissions' in {settings_path} must be a JSON object.")
        return
    allow = permissions.setdefault('allow', [])
    if not isinstance(allow, list):
        print(f"  ❌ 'permissions.allow' in {settings_path} must be a JSON array.")
        return
    if CLAUDE_ALLOW_RULE in allow:
        print(f"  ⏭  {settings_path} already allows {CLAUDE_ALLOW_RULE}.")
        return
    allow.insert(0, CLAUDE_ALLOW_RULE)

    try:
        os.makedirs(os.path.dirname(settings_path), exist_ok=True)
        with open(settings_path, 'w', encoding='utf-8') as out:
            json.dump(config, out, indent=2)
            out.write('\n')
        print(f"  ✅ Added {CLAUDE_ALLOW_RULE} to {settings_path}")
    except OSError as err:
        print(f"  ❌ Could not write {settings_path}: {err}")


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
    exists = os.path.exists(settings_path)
    if not exists and not enabled:
        return {'source': None, 'managedEnv': {}}
    config = {}
    if exists:
        try:
            with open(settings_path, 'r', encoding='utf-8') as src:
                config = json.load(src)
        except json.JSONDecodeError as err:
            print(f"  ❌ {settings_path} is not valid JSON: {err}")
            return None
        if not isinstance(config, dict):
            print(f"  ❌ {settings_path} top-level value must be a JSON object.")
            return None

    existing_hooks = config.get('hooks')
    if existing_hooks is None:
        hooks = {}
    elif isinstance(existing_hooks, dict):
        hooks = existing_hooks
    else:
        print(f"  ❌ 'hooks' in {settings_path} must be a JSON object.")
        return None
    for event, _matcher in CLAUDE_TOKEN_AUDIT_HOOK_EVENTS:
        groups = hooks.get(event)
        if groups is not None and not isinstance(groups, list):
            print(f"  ❌ 'hooks.{event}' in {settings_path} must be a JSON array.")
            return None

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

    try:
        os.makedirs(os.path.dirname(settings_path), exist_ok=True)
        with open(settings_path, 'w', encoding='utf-8') as out:
            json.dump(config, out, indent=2)
            out.write('\n')
        if enabled and not available:
            print(f"  ℹ️  Left Claude token audit disabled in {settings_path}")
        else:
            print(
                f"  ✅ {'Configured ' + source if enabled else 'Removed Uclusion-owned'} "
                f"token-audit settings in {settings_path}"
            )
    except OSError as err:
        print(f"  ❌ Could not write {settings_path}: {err}")
        return None
    result = {'source': source, 'managedEnv': next_owned}
    if not available:
        result['available'] = False
    return result


def build_codex_mcp_block(workspace_id, env):
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
    lines = [
        CODEX_CONFIG_MARKER,
        '[mcp_servers.Uclusion]',
        'command = "python3"',
        'args = [',
        f'    "{MCP_PROXY_SYMLINK_PATH}",',
        f'    "{workspace_id}",',
    ]
    if env is not None:
        lines.append(f'    "{env}",')
    lines.append(']')
    lines.append('default_tools_approval_mode = "approve"')
    lines.append(CODEX_CONFIG_END_MARKER)
    return '\n'.join(lines) + '\n'


@contextmanager
def codex_config_lock():
    """Serialize Uclusion's read/modify/replace cycle across installers."""
    lock_path = f'{CODEX_CONFIG_PATH}.uclusion.lock'
    ensure_dir(os.path.dirname(lock_path))
    with open(lock_path, 'a+b') as lock_file, _exclusive_file_lock(lock_file):
        yield


def replace_owned_block(existing, start_marker, end_marker, block, label):
    """Append or replace exactly one ordered marker-owned config block."""
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
            f'{CODEX_CONFIG_PATH} has duplicate, orphaned, or reversed '
            f'Uclusion {label} markers; refusing to modify it'
        )
    end_index = ends[0].end()
    if end_index < len(existing) and existing[end_index] == '\n':
        end_index += 1
    remainder = (
        existing[:starts[0].start()] + existing[end_index:]
    ).rstrip()
    return (remainder + '\n\n' + block) if remainder else block, True


def remove_owned_block(existing, start_marker, end_marker, label):
    """Remove exactly one marker-owned block, preserving all other config."""
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
            f'{CODEX_CONFIG_PATH} has duplicate, orphaned, or reversed '
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


def _codex_config_write_target(path):
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
    current_target = _codex_config_write_target(logical_path)
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
    target_path = _codex_config_write_target(logical_path)
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
):
    """Apply Codex config changes and remove obsolete Uclusion bridge hooks."""
    if not os.path.isdir(CODEX_HOME):
        if not force or not include_mcp:
            print(f"ℹ️  No {CODEX_HOME} found; skipping Codex configuration.")
            return False
        ensure_dir(CODEX_HOME)

    with codex_config_lock():
        config_target = _codex_config_write_target(CODEX_CONFIG_PATH)
        existing, config_signature = _read_text_snapshot(config_target)
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
                    build_codex_mcp_block(workspace_id, env),
                    'MCP',
                )
        updated, legacy_hooks_removed = remove_owned_block(
            updated,
            LEGACY_CODEX_HOOKS_MARKER,
            LEGACY_CODEX_HOOKS_END_MARKER,
            'legacy bridge-hook',
        )
        validate_codex_config(updated)
        if updated != existing:
            atomic_write_text(
                CODEX_CONFIG_PATH,
                updated,
                existing,
                config_target,
                config_signature,
            )

    if mcp_skipped:
        print(
            f"  ⏭  {CODEX_CONFIG_PATH} already defines "
            "[mcp_servers.Uclusion] outside Uclusion's markers; "
            "leaving that table untouched."
        )
    elif include_mcp:
        verb = 'Refreshed' if mcp_refreshed else 'Added'
        print(f"  ✅ {verb} Uclusion MCP server in {CODEX_CONFIG_PATH}")
    if legacy_hooks_removed:
        print(
            "  ✅ Removed obsolete Uclusion Codex bridge hooks from "
            f"{CODEX_CONFIG_PATH}"
        )
    if include_mcp:
        print("  🔄 Restart Codex (or reload its IDE extension) to apply this configuration.")
    return True


def remove_legacy_codex_hooks_config(force=False):
    """Remove only Uclusion's obsolete marker-owned lifecycle-hook block."""
    return mutate_codex_config(force=force)


def update_codex_config(workspace_id, env, force=False):
    """Register the Uclusion MCP server in ``~/.codex/config.toml``."""
    return mutate_codex_config(
        workspace_id=workspace_id,
        env=env,
        include_mcp=True,
        force=force,
    )


def update_codex_integration_config(workspace_id, env, force=False):
    """Install the MCP table and remove obsolete bridge hooks atomically."""
    return mutate_codex_config(
        workspace_id=workspace_id,
        env=env,
        include_mcp=True,
        force=force,
    )


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


def make_workflow_md_fetcher(env):
    """Return a callable that downloads ``CLAUDE.md`` at most once and caches it.

    The same ``CLAUDE.md`` feeds three surfaces in one run — ``~/.claude/CLAUDE.md``,
    the Cursor ``.mdc``, and ``~/.codex/AGENTS.md`` — so we fetch it lazily on first
    need and memoize the result (including a failure) instead of pulling the identical
    URL three times. Lazy means a user who declines every prompt triggers no network
    call; memoizing a failure means a single bounded timeout, not one per surface.
    Returns the marker-validated, newline-terminated content, or ``None`` on any
    download/validation failure.
    """
    base_url = get_scripts_base_url(env)
    url = base_url + 'CLAUDE.md'
    cache = {}

    def fetch():
        if 'result' in cache:
            return cache['result']

        print(f"  ⬇️  Downloading {url}")
        try:
            with urllib.request.urlopen(url, timeout=HTTP_TIMEOUT) as response:
                if response.status != 200:
                    raise RuntimeError(f"status {response.status}")
                content = response.read().decode('utf-8')
        except Exception as err:
            print(f"  ❌ Failed to download {url}: {err}")
            cache['result'] = None
            return None

        if CLAUDE_MD_MARKER not in content or CLAUDE_MD_END_MARKER not in content:
            print(f"  ❌ Downloaded CLAUDE.md is missing the workflow markers; refusing to write.")
            cache['result'] = None
            return None

        if not content.endswith('\n'):
            content += '\n'
        cache['result'] = content
        return content

    return fetch


def install_workflow_md(fetch_md, target_path, client_label, require_dir=None, assume_yes=False):
    """Install or refresh the Uclusion workflow block in ``target_path``.

    Used for both ``~/.claude/CLAUDE.md`` (Claude Code) and ``~/.codex/AGENTS.md``
    (Codex); both clients read a plain-Markdown instructions file and use the
    same delimited block so the workflow text never drifts between surfaces. The
    block is delimited by ``CLAUDE_MD_MARKER`` and ``CLAUDE_MD_END_MARKER`` so
    that on reruns we can replace it in place without disturbing anything the
    user appended afterwards. ``require_dir`` gates the install on a directory
    existing (Codex's ``~/.codex``) rather than on the target file. ``fetch_md``
    supplies the (shared, cached) CLAUDE.md content. ``assume_yes`` (an explicit
    ``--clients`` selection) writes without prompting.
    """
    if require_dir is not None and not os.path.isdir(require_dir):
        print(f"ℹ️  No {require_dir} found; skipping {client_label} workflow file.")
        return

    exists = os.path.exists(target_path)
    existing = ''
    if exists:
        try:
            with open(target_path, 'r', encoding='utf-8') as src:
                existing = src.read()
        except OSError as err:
            print(f"  ❌ Could not read {target_path}: {err}")
            return

    has_start = CLAUDE_MD_MARKER in existing
    has_end = CLAUDE_MD_END_MARKER in existing

    if has_start != has_end:
        which = 'start' if has_start else 'end'
        print(f"  ❌ {target_path} has the Uclusion {which} marker but not its")
        print(f"      counterpart; refusing to modify. Remove the orphan marker and re-run.")
        return

    if has_start:
        print(f"📝 Found Uclusion workflow block in {target_path}")
        action = 'replace'
        prompt = f"  Refresh Uclusion job workflow in {target_path}?"
        default_yes = True
    elif exists:
        print(f"📝 Found existing {target_path}")
        action = 'append'
        prompt = f"  Append Uclusion job workflow to {target_path}?"
        default_yes = False
    else:
        print(f"📝 No {target_path} found.")
        action = 'create'
        prompt = f"  Create {target_path} with Uclusion job workflow?"
        default_yes = False

    if not assume_yes and not prompt_yes_no(prompt, default=default_yes):
        print(f"  ⏭  Skipped {os.path.basename(target_path)} update.")
        return

    content = fetch_md()
    if content is None:
        return

    if action == 'replace':
        start_idx = existing.find(CLAUDE_MD_MARKER)
        end_idx = existing.find(CLAUDE_MD_END_MARKER, start_idx) + len(CLAUDE_MD_END_MARKER)
        if end_idx < len(existing) and existing[end_idx] == '\n':
            end_idx += 1
        updated = existing[:start_idx] + content + existing[end_idx:]
        verb = 'Refreshed Uclusion workflow in'
    elif action == 'append':
        sep = '' if existing.endswith('\n') else '\n'
        updated = existing + sep + '\n' + content
        verb = 'Appended Uclusion workflow to'
    else:  # create
        updated = content
        verb = 'Wrote'

    try:
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        with open(target_path, 'w', encoding='utf-8') as out:
            out.write(updated)
        print(f"  ✅ {verb} {target_path}")
    except OSError as err:
        print(f"  ❌ Could not write {target_path}: {err}")


def install_cursor_mdc(fetch_md, target_path=CURSOR_MDC_PATH, assume_yes=False):
    """Install or refresh a Cursor rule (.mdc) at ``target_path``.

    ``target_path`` is ~/.cursor/rules/uclusion.mdc for a global install and
    ``<project>/.cursor/rules/uclusion.mdc`` for a project-level one. The body of
    the rule is the same workflow markdown that lands in CLAUDE.md — we take the
    (shared, cached) CLAUDE.md content, strip the install markers, prepend a
    description-based Cursor frontmatter, and write the result. Keeping CLAUDE.md
    as the single source of truth means the two surfaces never drift.
    """
    exists = os.path.exists(target_path)
    if exists:
        print(f"📝 Found existing {target_path}")
        prompt = f"  Refresh Uclusion Cursor rule at {target_path}?"
        verb = 'Refreshed'
        default_yes = True
    else:
        print(f"📝 No {target_path} found.")
        prompt = f"  Create {target_path} with Uclusion job workflow?"
        verb = 'Wrote'
        default_yes = False

    if not assume_yes and not prompt_yes_no(prompt, default=default_yes):
        print("  ⏭  Skipped uclusion.mdc update.")
        return

    content = fetch_md()
    if content is None:
        return

    start_idx = content.find(CLAUDE_MD_MARKER) + len(CLAUDE_MD_MARKER)
    end_idx = content.find(CLAUDE_MD_END_MARKER, start_idx)
    body = content[start_idx:end_idx].lstrip('\n').rstrip() + '\n'
    mdc_content = CURSOR_MDC_FRONTMATTER + body

    try:
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        with open(target_path, 'w', encoding='utf-8') as out:
            out.write(mdc_content)
        print(f"  ✅ {verb} {target_path}")
    except OSError as err:
        print(f"  ❌ Could not write {target_path}: {err}")


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
        help='Uclusion workspaceId to configure.',
    )
    parser.add_argument(
        'view_id',
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
    parser.add_argument(
        '--script-version',
        help=argparse.SUPPRESS,
    )
    return parser


def parse_clients(clients_arg):
    """Validate the ``--clients`` comma list; exits with an error on unknown names."""
    clients = {client.strip().lower() for client in clients_arg.split(',') if client.strip()}
    unknown = clients - {'claude', 'cursor', 'codex'}
    if unknown:
        print(f"❌ Unknown --clients value(s): {', '.join(sorted(unknown))} "
              f"(expected claude, cursor, codex)")
        sys.exit(64)
    if not clients:
        print("❌ --clients was supplied but named no clients (expected claude, cursor, codex)")
        sys.exit(64)
    return clients


def install_global(workspace_id, view_id, mcp_env, fetch_md, clients=None,
                   script_version=None, token_audit_enabled=None):
    """Configure Uclusion in the user's home directory (the default).

    Without ``clients`` every detected client is offered interactively. With
    ``clients`` (an explicit ``--clients`` selection) only those clients are
    configured, without prompts, and their config files are created even when
    the client is not detected on the machine. An empty ``clients`` set (the
    ``--scripts-only`` update path) writes just the workspace config.
    """
    interactive = clients is None
    config_path = os.path.join(UCLUSION_HOME, CONFIG_FILES[mcp_env or 'production'])
    token_audit = write_uclusion_config(
        workspace_id, view_id, config_path, script_version, token_audit_enabled
    )
    claude_registration_audit = token_audit
    claude_selected = interactive or 'claude' in clients
    claude_detected = not interactive or os.path.exists(CLAUDE_JSON_PATH)
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
            # A malformed/unwritable Claude settings file must degrade only
            # auditing. Registering an enabled proxy without a selected source
            # would make Claude's entire Uclusion MCP process fail argument
            # validation.
            claude_registration_audit = None
    elif (
        clients
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
    if interactive or 'cursor' in clients:
        register_mcp_json(CURSOR_MCP_PATH, 'Cursor', workspace_id, mcp_env, require_existing=interactive)
    if claude_selected:
        register_mcp_json(
            CLAUDE_JSON_PATH, 'Claude Code', workspace_id, mcp_env,
            require_existing=interactive, token_audit=claude_registration_audit,
            token_audit_client='claude'
        )
    if interactive or 'codex' in clients:
        update_codex_integration_config(
            workspace_id, mcp_env, force=not interactive
        )
    if interactive or 'claude' in clients:
        install_workflow_md(fetch_md, CLAUDE_MD_PATH, 'Claude Code', assume_yes=not interactive)
    if interactive or 'cursor' in clients:
        install_cursor_mdc(fetch_md, assume_yes=not interactive)
        # Merge/create hooks.json whenever Cursor is being configured (S-all-192).
        install_cursor_poke_drain_hook(CURSOR_HOOKS_PATH)
    if interactive or 'codex' in clients:
        install_workflow_md(fetch_md, CODEX_AGENTS_MD_PATH, 'Codex',
                            require_dir=CODEX_HOME if interactive else None,
                            assume_yes=not interactive)


def install_project_level(workspace_id, view_id, mcp_env, fetch_md, project_dir, clients=None,
                          script_version=None, token_audit_enabled=None):
    """Configure Uclusion inside ``project_dir`` instead of the home directory.

    Writes the workspace config and the project-scoped MCP registrations and
    workflow docs into the project. The CLI binaries stay user-global under
    ~/.local; only configuration becomes project-local. Codex has no persisted
    per-project MCP table (its config.toml is global), so project mode installs
    the project's AGENTS.md while ``uclusion codex`` supplies the selected
    project's workspace and environment as private app-server config overrides
    at launch. This keeps its MCP proxy and Poke companion on the same workspace.
    The installer also removes the obsolete marker-owned Uclusion lifecycle-hook
    block from global Codex config when one is present. With ``clients`` (an
    explicit ``--clients`` selection) only those clients are configured and
    nothing prompts.
    """
    interactive = clients is None
    print(f"📁 Project-level install into {project_dir}")
    os.makedirs(project_dir, exist_ok=True)

    config_path = os.path.join(project_dir, CONFIG_FILES[mcp_env or 'production'])
    token_audit = write_uclusion_config(
        workspace_id, view_id, config_path, script_version, token_audit_enabled
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
            claude_registration_audit = None
        register_mcp_json(
            os.path.join(project_dir, '.mcp.json'),
            'Claude Code (project)', workspace_id, mcp_env,
            require_existing=False, token_audit=claude_registration_audit,
            token_audit_client='claude'
        )
    elif (
        clients
        and token_audit_enabled is False
        and os.path.exists(claude_settings_path)
    ):
        result = configure_claude_token_audit(
            claude_settings_path, False, mcp_env or 'production', workspace_id,
            token_audit['port'], token_audit.get('claudeManagedEnv')
        )
        if result is not None:
            update_token_audit_client_config(config_path, None, {})
    if interactive or 'cursor' in clients:
        register_mcp_json(os.path.join(project_dir, '.cursor', 'mcp.json'),
                          'Cursor (project)', workspace_id, mcp_env, require_existing=False)
        install_cursor_poke_drain_hook(
            os.path.join(project_dir, '.cursor', 'hooks.json')
        )
    if interactive or 'claude' in clients:
        install_workflow_md(fetch_md, os.path.join(project_dir, 'CLAUDE.md'), 'Claude Code (project)',
                            assume_yes=not interactive)
    if interactive or 'cursor' in clients:
        install_cursor_mdc(fetch_md, os.path.join(project_dir, '.cursor', 'rules', 'uclusion.mdc'),
                           assume_yes=not interactive)
    if interactive or 'codex' in clients:
        # The relay-authoritative companion needs no Codex lifecycle hooks.
        # Clean up only the obsolete Uclusion-owned block left by older
        # installs; unrelated user/project hooks remain untouched.
        remove_legacy_codex_hooks_config(force=not interactive)
        install_workflow_md(fetch_md, os.path.join(project_dir, 'AGENTS.md'), 'Codex (project)',
                            assume_yes=not interactive)


def main():
    args = build_parser().parse_args()
    env = args.environment
    workspace_id = args.workspace_id
    view_id = args.view_id
    mcp_env = None if env == 'production' else env

    if args.scripts_only:
        clients = set()
    else:
        clients = parse_clients(args.clients) if args.clients else None

    try:
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
        fetch_md = make_workflow_md_fetcher(env)
        if project_dir is None:
            install_global(workspace_id, view_id, mcp_env, fetch_md, clients,
                           script_version, args.token_audit)
        else:
            install_project_level(workspace_id, view_id, mcp_env, fetch_md, project_dir,
                                  clients, script_version, args.token_audit)
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
