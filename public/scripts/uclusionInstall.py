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
  client's native ``skills/uclusion`` and ``skills/uclusion-design`` packages.
  Claude and Cursor use their client directories; Codex uses the cross-agent
  ``.agents/skills`` path.
  Agent-led setup also writes Codex's trusted-project ``.codex/config.toml``
  MCP table, while legacy project installs continue to use the equivalent
  ``uclusion codex`` launch override. The CLI binaries themselves always stay
  user-global under ``~/.local``.

``setup`` mode needs no Uclusion credential, workspace ID, or view ID. It
installs the same immutable script release and registers ``uclusionSetupMCP.py``
under the existing ``Uclusion`` key for exactly one selected client and scope.
The temporary MCP later invokes this installer without putting a secret on the
command line, replacing its own registration with the normal runtime proxy.

``demo`` mode provisions a disposable workspace, writes its restricted demo
credential under a private ``/tmp`` home, and then follows the ordinary install
path for one Poke-capable client. It prints the one-line prompt that starts the
evaluator on the fixture's first job.
"""
import argparse
import base64
import errno
import filecmp
import hashlib
import json
import os
import getpass
import re
import secrets
import selectors
import shlex
import shutil
import signal
import stat
import subprocess
import sys
import tempfile
import time
import urllib.parse
import urllib.error
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


def uclusion_home_root():
    """The directory Uclusion's own files are installed under.

    UCLUSION_HOME lets a disposable install - the AI demo runs one out of /tmp -
    place the ordinary client without touching a real installation. Unset, it is
    the user's home. USER_HOME stays the real home either way, because the client
    locations below are Cursor's, Claude's and Codex's rather than ours.
    """
    return os.path.abspath(os.path.expanduser(os.environ.get('UCLUSION_HOME', '~')))


LOCAL_PREFIX = os.path.join(uclusion_home_root(), '.local')
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
        '7a0e5ce672f1de0d24d469950eb211b774bf90545c253f31c927aa995e72ba80',
    'uclusionMCPProxy.py':
        '474d2a2c96aeea97689331f47107ab5aea78662be25de650b4cb5ef9d071bb53',
    'uclusionSetupMCP.py':
        'f91ea798847ec8f8cb3407dfcc8eb4ab36ffbaab0c9695fb6028b56b94549d51',
    'uclusionCodexBridge.py':
        '3b47745dfe4f76d066c9942e9f48912315b0cbb1a23f80a0b5fd31bd6590f010',
    'uclusionTokenAudit.py':
        '371e49d36c8393048f8e500bace829c9031f59f504673bdc40b1c1af12453df8',
    'uclusionCursorPokeDrain.py':
        '89e1f0bbbb8caaf5cc43b7fb399a9f0557b8c89c13c5e6f0e38ef5330f1518ca',
}

USER_HOME = os.path.expanduser('~')
UCLUSION_HOME = os.path.join(uclusion_home_root(), '.uclusion')
# Workspace config filenames are environment-specific — the same names the CLI
# reads (S-all-163): production stays uclusion.json, stage/dev get prefixed so
# `uclusion -e stage ...` finds the config the installer wrote.
CONFIG_FILES = {
    'dev': 'dev_uclusion.json',
    'stage': 'stage_uclusion.json',
    'production': 'uclusion.json',
}
CURSOR_MCP_PATH = os.path.join(USER_HOME, '.cursor', 'mcp.json')
CLAUDE_CONFIG_HOME = os.path.abspath(os.path.expanduser(
    os.environ.get('CLAUDE_CONFIG_DIR', os.path.join(USER_HOME, '.claude'))
))
# Claude Code keeps .claude.json beside the rest of its configuration whenever
# CLAUDE_CONFIG_DIR names one, so registering into USER_HOME would write a file
# the client never reads. Verified against a client started with the variable
# pointed elsewhere: it reported no MCP servers and created its own .claude.json
# in the directory it was given.
CLAUDE_JSON_PATH = (
    os.path.join(CLAUDE_CONFIG_HOME, '.claude.json')
    if os.environ.get('CLAUDE_CONFIG_DIR')
    else os.path.join(USER_HOME, '.claude.json')
)
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
# `uclusion demo --remove` runs the installer in these two modes. The first
# undoes the client-side traces; it then re-execs a staged copy of itself in
# the second mode to delete the disposable home it is running out of.
DEMO_REMOVE_MODE = '--uclusion-demo-remove'
DEMO_PURGE_MODE = '--uclusion-demo-purge'
# S-Marketing-77: the demo command hands the exercise to a copy of this installer
# running in this mode, detached, so the command returns instead of blocking for
# the length of the exercise. `uclusion demo --result` reads the run it names.
DEMO_SUPERVISE_MODE = '--uclusion-demo-supervise'
DEMO_CURRENT_RUN_FILE = 'demo-current-run'
DEMO_FAILURE_FILE = 'failure.txt'
DEMO_SUPERVISOR_PID_FILE = 'supervisor.pid'
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
DESIGN_SKILL_NAME = 'uclusion-design'
DESIGN_SKILL_MARKER = '<!-- uclusion-design-skill:v1 -->'
DESIGN_SKILL_END_MARKER = '<!-- /uclusion-design-skill:v1 -->'
DESIGN_SKILL_REFERENCE_MARKER = '<!-- uclusion-design-reference:v1 -->'
DESIGN_SKILL_REFERENCE_END_MARKER = '<!-- /uclusion-design-reference:v1 -->'
WORKFLOW_ENV_PLACEHOLDER = '{{UCLUSION_CLI}}'
WORKFLOW_ASSET_PATHS = {
    'claude_stub': 'CLAUDE.md',
    'codex_stub': 'AGENTS.md',
    'cursor_stub': 'uclusion.mdc',
    'skill': 'skills/uclusion/SKILL.md',
    'pokes_reference': 'skills/uclusion/references/pokes.md',
    'reading_reference': 'skills/uclusion/references/reading.md',
    'operations_reference': 'skills/uclusion/references/operations.md',
    'completion_reference': 'skills/uclusion/references/completion.md',
    'audit_reference': 'skills/uclusion/references/audit.md',
    'claims_reference': 'skills/uclusion/references/claims.md',
    'uploads_reference': 'skills/uclusion/references/uploads.md',
    'openai_metadata': 'skills/uclusion/agents/openai.yaml',
    'design_skill': 'skills/uclusion-design/SKILL.md',
    'design_examples': 'skills/uclusion-design/references/examples.md',
    'design_openai_metadata': 'skills/uclusion-design/agents/openai.yaml',
    # The owner's directions travel with the workflow rather than being
    # fetched: a session's grant holds the demo's tools and its CLI, and
    # nothing in that can retrieve a URL.
    'demo_brief': 'demo-brief.md',
}
# These digests bind the installer to one coherent workflow release. A host
# serving a partially-deployed asset set fails before any client mutation.
WORKFLOW_ASSET_SHA256 = {
    'reading_reference': '08e96395428e4544e57b4a99fb5b2126ccfbacc77aae63178b33472e6d994d77',
    'demo_brief': '0b7f19753523dcedb2327d4edd97dd15253c0ca1e41aba010db7363a7856cce4',
    'claude_stub': '2bcf5034fba89fe87e4020e70adac26aecaf373b50efd0c3c8137a4eeec73830',
    'codex_stub': '7cc3b75aa1b7af3799e47962d7ce2beb43b4a8f52541bb571c0dc968eb808336',
    'cursor_stub': 'c2e03afbaf55fd656b68478de9268955ef2af5813d3a2109ebce04ae0c8061bf',
    'skill': '185fb0cfa6ac9668d6618245cedb2a5f4741a521f67898ae5164fdbc49a36db6',
    'pokes_reference': 'cc1a6d6a5eead60f97869b3bfebc47d472b314c7185090f0638aebd1dff04618',
    'operations_reference': 'b2dd2fd2639ae888bcedcfe3566ffc9d7ec7e91335794f6f4154a239173ed3ce',
    'completion_reference': '2f627b9e6156958ce7940f11b0281a4ee3295517b60eb339b0bc577dd59240c3',
    'audit_reference': '6e064e0baf27e4a17bd3a15060dbb15f8730de31f71eb8df0caba180852be71d',
    'claims_reference': '7e935792deaacbd02369590625f947c025e54cb84dd56da14d93eab55a8f2e4f',
    'uploads_reference': 'd3fa9a9a9df21424068c26c840466c2d6aab78a3f85989007a529a09412233d3',
    'openai_metadata': 'ecf2759354ff3bbfd7178452a705650aff7a13352458bb20e1df122da7c30f40',
    'design_skill': '530da3be38712704b2853067e0f65f29404a02652dc134a5845ac45f4e63ac58',
    'design_examples': '4416eabe1980db0f7a6bb80530bb4cfb198188f462fc1cfa8917f5856279e37e',
    'design_openai_metadata': 'f31f258d8b76d5fcfa724b7e7468481ef18a863c9afbdd78b81b873641f9c7ba',
}
CLIENT_STUB_ASSET = {
    'claude': 'claude_stub',
    'codex': 'codex_stub',
    'cursor': 'cursor_stub',
}
SKILL_PACKAGE_ASSETS = (
    ('pokes_reference', os.path.join('references', 'pokes.md')),
    ('reading_reference', os.path.join('references', 'reading.md')),
    ('operations_reference', os.path.join('references', 'operations.md')),
    ('completion_reference', os.path.join('references', 'completion.md')),
    ('audit_reference', os.path.join('references', 'audit.md')),
    ('claims_reference', os.path.join('references', 'claims.md')),
    ('uploads_reference', os.path.join('references', 'uploads.md')),
    ('openai_metadata', os.path.join('agents', 'openai.yaml')),
    # Publish the entrypoint last so an interrupted refresh never exposes a
    # new SKILL.md before all files it routes to are durable.
    ('skill', 'SKILL.md'),
)
DESIGN_SKILL_PACKAGE_ASSETS = (
    ('design_examples', os.path.join('references', 'examples.md')),
    ('design_openai_metadata', os.path.join('agents', 'openai.yaml')),
    ('design_skill', 'SKILL.md'),
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

# C-Marketing-396: this is intentionally the same public constant used when
# the fixture creates the demo human. It opens only that demo's workspace and
# expires when the demo is retired; returning it from an API would not make it
# more secret.
DEMO_CLIENT_SECRET = 'uclusion-ai-demo-shared-secret-v1'
DEMO_PROVISION_TIMEOUT_SECONDS = 300
DEMO_RESPONSE_LIMIT_BYTES = 1024 * 1024


def read_credentials(env):
    """Parse the key=value credentials file for ``env``; None when absent."""
    cred_path = os.path.join(
        uclusion_home_root(), '.uclusion', CREDENTIALS_FILES[env]
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
    # `~/.uclusion/export` is right for an ordinary install and wrong for a
    # demo: the CLI expands it with expanduser at export time, which resolves
    # against the client home rather than UCLUSION_HOME, so a demo's export
    # lands in the person's real directory where the demo's own removal
    # neither looks nor should. A disposable home gets an absolute path
    # inside itself, so removal takes the exports with everything else.
    demo_home = uclusion_home_root() == demo_home_path()
    defaults = {
        'extensionsList': ['js', 'py'],
        'sourcesList': ['./src'],
        'uclusionMDFileType': 'export',
        'uclusionMDFolderPath': (
            os.path.join(UCLUSION_HOME, 'export') if demo_home
            else '~/.uclusion/export'
        ),
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


def workspace_config_path(env, project_dir=None):
    """Return the env-specific workspace config this install would write."""
    directory = os.path.abspath(os.path.expanduser(
        project_dir if project_dir is not None else UCLUSION_HOME
    ))
    return os.path.join(directory, CONFIG_FILES[env or 'production'])


def workspace_config_merge_path(env, project_dir=None):
    """Return the config file a rerun would merge, including legacy names."""
    target = workspace_config_path(env, project_dir)
    if os.path.isfile(target):
        return target
    legacy = os.path.join(os.path.dirname(target), CONFIG_FILES['production'])
    if legacy != target and os.path.isfile(legacy):
        return legacy
    return target


def _config_token_audit_enabled(config):
    value = config.get('tokenAudit')
    if isinstance(value, dict):
        return value.get('enabled') is True
    return value is True


def _config_work_claims_enabled(config):
    return config.get('workClaims') is True


def existing_install_feature_changes(
    config, token_audit_enabled, work_claims_enabled,
):
    """Return feature flips this install would apply to an existing config.

    A plain upgrade — omitted flags, or flags that match the current
    preference — is not a feature change (B-all-636).
    """
    if config is None:
        return ()
    changes = []
    if token_audit_enabled is not None:
        current = _config_token_audit_enabled(config)
        wanted = bool(token_audit_enabled)
        if wanted != current:
            changes.append(
                'token audit from '
                f"{'on' if current else 'off'} to {'on' if wanted else 'off'}"
            )
    if work_claims_enabled is not None:
        current = _config_work_claims_enabled(config)
        wanted = bool(work_claims_enabled)
        if wanted != current:
            changes.append(
                'work claims from '
                f"{'on' if current else 'off'} to {'on' if wanted else 'off'}"
            )
    return tuple(changes)


def confirm_existing_feature_changes(
    force, env, project_dir, token_audit_enabled, work_claims_enabled,
):
    """Ask before flipping token audit or work claims on an existing install."""
    if force:
        return True
    path = workspace_config_merge_path(env, project_dir)
    if not os.path.isfile(path):
        return True
    try:
        with open(path, encoding='utf-8') as source:
            config = json.load(source)
    except json.JSONDecodeError as err:
        raise RuntimeError(f'{path} is not valid JSON: {err}') from err
    if not isinstance(config, dict):
        raise RuntimeError(f'{path} top-level value must be a JSON object')
    changes = existing_install_feature_changes(
        config, token_audit_enabled, work_claims_enabled,
    )
    if not changes:
        return True
    detail = ' and '.join(changes)
    return prompt_yes_no(
        f'This will change the existing Uclusion install ({detail}). Continue?',
        default=False,
    )


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
    home = uclusion_home_root()
    if home != os.path.abspath(os.path.expanduser('~')):
        # A client starts this process with none of our environment, so an
        # install that does not live in the user home has to say where it does.
        proxy_args.extend(['--home', home])
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


DEMO_CLIENTS = frozenset({'claude', 'codex'})
DEMO_CLIENT_ID_RE = re.compile(
    r'^ai-demo:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-'
    r'[0-9a-f]{12}:human_[A-Za-z0-9._-]{1,241}$',
    re.IGNORECASE,
)
DEMO_SHORT_CODE_RE = re.compile(
    r'^[A-Z]-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$'
)
DEMO_CLIENT_ID_MAX_LENGTH = 292


def _demo_user_token():
    # Keeps one person's demo directory from colliding with another's on a
    # shared machine. Windows has no getuid, so fall back to the login name.
    if hasattr(os, 'getuid'):
        return str(os.getuid())
    return re.sub(r'[^A-Za-z0-9_.-]', '_', getpass.getuser() or 'user')


def demo_home_path():
    """Return the deterministic disposable home for this operating-system user."""
    return os.path.join(
        tempfile.gettempdir(), f'uclusion-demo-{_demo_user_token()}'
    )


DEMO_PLUGIN_NAME = 'uclusion-demo'


def demo_plugin_path():
    """The plugin directory a demo session loads its workflow skills from."""
    return os.path.join(UCLUSION_HOME, 'plugin')


def demo_bootstrap_path():
    """The bootstrap instructions a demo session appends to its system prompt."""
    return os.path.join(UCLUSION_HOME, 'bootstrap.md')


def install_demo_plugin(fetch_bundle):
    """Write the workflow into the demo's own directory instead of the person's.

    A demo session loads its skills with --plugin-dir and its bootstrap with
    --append-system-prompt, so the exercise needs nothing in the person's own
    configuration. Verified against a background session started this way,
    which reported a skill that exists only in this directory.

    The skill packages are written byte-for-byte as an ordinary install writes
    them; only the stub takes the CLI substitution, exactly as
    install_skill_and_stub does.
    """
    bundle = fetch_bundle()
    if bundle is None:
        raise RuntimeError('the Uclusion workflow bundle is unavailable')
    validate_workflow_bundle(bundle)
    environment = getattr(fetch_bundle, '__dict__', {}).get(
        'workflow_environment'
    )
    root = demo_plugin_path()
    if os.path.lexists(root):
        shutil.rmtree(root)
    manifest_dir = os.path.join(root, '.claude-plugin')
    ensure_dir(manifest_dir)
    manifest = {
        'name': DEMO_PLUGIN_NAME,
        'description': 'Uclusion workflow for this demo session.',
        'version': '1.0.0',
    }
    with open(os.path.join(manifest_dir, 'plugin.json'), 'w',
              encoding='utf-8') as handle:
        json.dump(manifest, handle, indent=2)
    for package in ('uclusion', DESIGN_SKILL_NAME):
        package_dir = os.path.join(root, 'skills', package)
        ensure_dir(package_dir)
        for asset_key, relative_path in _skill_package_definition(package)[0]:
            _write_staged_asset(package_dir, relative_path, bundle[asset_key])
    stub = bundle[CLIENT_STUB_ASSET['claude']]
    cli_command = workflow_cli_command(environment)
    if cli_command is not None:
        stub = stub.replace(WORKFLOW_ENV_PLACEHOLDER, cli_command)
    with open(demo_bootstrap_path(), 'w', encoding='utf-8') as handle:
        handle.write(stub)
    with open(demo_brief_path(), 'w', encoding='utf-8') as handle:
        handle.write(bundle['demo_brief'].replace(
            WORKFLOW_ENV_PLACEHOLDER, cli_command or 'uclusion'
        ))
    print(f'🧩 Wrote the demo workflow to {root}')
    return True


def demo_codex_environment():
    """Isolate demo skills while retaining the person's native Codex login."""
    environment = {
        key: value for key, value in os.environ.items()
        if not key.startswith('UCLUSION_CODEX_')
    }
    environment['HOME'] = uclusion_home_root()
    environment['UCLUSION_HOME'] = uclusion_home_root()
    environment['CODEX_HOME'] = CODEX_HOME
    environment['PATH'] = (
        SYMLINK_DIR + os.pathsep + environment.get('PATH', os.defpath)
    )
    return environment


def demo_codex_cli_args(environment):
    """Use a literal executable prefix that native Codex rules can match."""
    command = [os.path.join(SYMLINK_DIR, 'uclusion')]
    if environment != 'production':
        command.extend(['-e', environment])
    return command


def install_demo_codex_workflow(fetch_bundle):
    """Install Codex's skills, bootstrap and additive rules only in the demo."""
    bundle = fetch_bundle()
    validate_workflow_bundle(bundle)
    environment = getattr(fetch_bundle, 'workflow_environment', 'production')
    command = demo_codex_cli_args(environment)
    cli = ' '.join(shlex.quote(part) for part in command)
    home = uclusion_home_root()
    for package in ('uclusion', DESIGN_SKILL_NAME):
        for asset_key, relative_path in _skill_package_definition(package)[0]:
            _write_staged_asset(
                home,
                os.path.join('.agents', 'skills', package, relative_path),
                bundle[asset_key],
            )
    _write_staged_asset(
        home, os.path.join('.uclusion', 'bootstrap.md'),
        bundle['codex_stub'].replace(WORKFLOW_ENV_PLACEHOLDER, cli)
        + '\nWhen assigned the workshop owner role, follow the installed owner '
        'brief and watch human notifications through the demo CLI. Do not '
        'arm a listener, wait for or drain Pokes, call find_work, or take jobs. '
        'Answer through human-role records, including the completion-package '
        'reply on the review required by the owner brief, then stop. These '
        'owner-role directions override the normal work discovery and Poke delivery directions '
        'above. They do not change the evaluator workflow.\n',
    )
    _write_staged_asset(
        home, os.path.join('.uclusion', 'demo-brief.md'),
        bundle['demo_brief'].replace(WORKFLOW_ENV_PLACEHOLDER, cli),
    )
    # A project config layer makes its sibling rules discoverable. Trust is
    # supplied on the launch line, never saved in the person's configuration.
    _write_staged_asset(home, os.path.join('.codex', 'config.toml'), '')
    _write_staged_asset(
        home, os.path.join('.codex', 'rules', 'uclusion-demo.rules'),
        'prefix_rule(pattern=' + repr(command) + ', decision="allow")\n',
    )
    print(f'🧩 Wrote the Codex demo workflow to {home}')
    return True


def _read_demo_codex_config(codex, arguments, environment):
    """Read effective settings through Codex without starting a model thread."""
    process = subprocess.Popen(
        [codex, *arguments, 'app-server'],
        stdin=subprocess.PIPE, stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL, env=environment, cwd=uclusion_home_root(),
    )
    selector = selectors.DefaultSelector()
    selector.register(process.stdout, selectors.EVENT_READ)
    pending = bytearray()
    deadline = time.monotonic() + 20

    def request(method, params, request_id):
        payload = {'id': request_id, 'method': method, 'params': params}
        process.stdin.write((json.dumps(payload) + '\n').encode('utf-8'))
        process.stdin.flush()
        while time.monotonic() < deadline:
            if not selector.select(min(0.25, max(0, deadline - time.monotonic()))):
                continue
            chunk = os.read(process.stdout.fileno(), 65536)
            if not chunk:
                raise RuntimeError('Codex exited while reading demo settings')
            pending.extend(chunk)
            while b'\n' in pending:
                line, _, remainder = pending.partition(b'\n')
                pending[:] = remainder
                message = json.loads(line)
                if message.get('id') == request_id:
                    if ('error' in message
                            or not isinstance(message.get('result'), dict)):
                        raise RuntimeError('Codex could not read its demo settings')
                    return message['result']
        raise RuntimeError('Codex timed out while reading demo settings')

    try:
        request('initialize', {
            'clientInfo': {'name': 'uclusion-demo-config', 'version': '1'},
        }, 1)
        process.stdin.write(b'{"method":"initialized"}\n')
        process.stdin.flush()
        return request('config/read', {
            'cwd': uclusion_home_root(), 'includeLayers': False,
        }, 2)['config']
    finally:
        selector.close()
        if process.poll() is None:
            process.terminate()
        try:
            process.wait(timeout=3)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=3)
        process.stdin.close()
        process.stdout.close()


def demo_codex_session_args(environment, workspace_id):
    """Build and check the Codex demo sessions' launch-local settings."""
    child_environment = demo_codex_environment()
    codex = shutil.which('codex', path=child_environment['PATH'])
    if codex is None:
        raise RuntimeError('the Codex demo requires codex on PATH')
    disabled_features = ('plugins', 'apps', 'remote_plugin')
    arguments = []
    for feature in disabled_features:
        arguments.extend(['--disable', feature])
    arguments.extend([
        '-c', 'projects={' + _toml_basic_string(uclusion_home_root())
        + '={trust_level="trusted"}}',
    ])
    config = _read_demo_codex_config(codex, arguments, child_environment)
    if not isinstance(config, dict):
        raise RuntimeError('Codex returned unsupported demo settings')
    features = config.get('features', {})
    if not isinstance(features, dict) or any(
        features.get(feature) is not False for feature in disabled_features
    ):
        raise RuntimeError(
            'Codex did not disable plugin and app MCP servers for the demo'
        )
    servers = config.get('mcp_servers', {})
    if not isinstance(servers, dict) or any(
        not isinstance(name, str) or not isinstance(server, dict)
        for name, server in servers.items()
    ):
        raise RuntimeError('Codex returned an unsupported MCP configuration')
    if servers.get(MCP_SERVER_KEY, {}).get('url') is not None:
        raise RuntimeError(
            'The Codex demo cannot replace an inherited HTTP Uclusion server '
            'for one invocation. Use a Codex configuration without that '
            'HTTP registration.'
        )
    descriptor = runtime_mcp_descriptor(
        workspace_id, None if environment == 'production' else environment,
    )
    server_overrides = [
        _toml_basic_string(name) + '={enabled=false}'
        for name in sorted(servers) if name != MCP_SERVER_KEY
    ]
    server_overrides.append(
        _toml_basic_string(MCP_SERVER_KEY) + '={enabled=true,required=true,'
        'command=' + _toml_basic_string(descriptor['command'])
        + ',args=[' + ','.join(_toml_basic_string(arg) for arg in descriptor['args'])
        + '],default_tools_approval_mode="approve"}'
    )
    with open(demo_bootstrap_path(), encoding='utf-8') as handle:
        bootstrap = handle.read()
    native_instructions = config.get('developer_instructions') or ''
    if not isinstance(native_instructions, str):
        raise RuntimeError('Codex returned invalid developer instructions')
    instructions = (
        native_instructions + ('\n\n' if native_instructions else '') + bootstrap
    )
    arguments.extend([
        '-c', 'mcp_servers={' + ','.join(server_overrides) + '}',
        '-c', 'developer_instructions=' + _toml_basic_string(instructions),
    ])
    result = subprocess.run(
        [codex, *arguments, 'mcp', 'list', '--json'],
        capture_output=True, text=True, timeout=20,
        env=child_environment, cwd=uclusion_home_root(),
    )
    if result.returncode:
        raise RuntimeError('Codex could not validate the demo MCP configuration')
    inventory = json.loads(result.stdout)
    if not isinstance(inventory, list) or any(
        not isinstance(server, dict)
        or not isinstance(server.get('name'), str)
        or not isinstance(server.get('enabled'), bool)
        for server in inventory
    ):
        raise RuntimeError('Codex returned an unsupported MCP inventory')
    enabled = [server for server in inventory if server.get('enabled') is True]
    if len(enabled) != 1 or enabled[0].get('name') != MCP_SERVER_KEY:
        raise RuntimeError('Codex did not select only the demo Uclusion server')
    transport = enabled[0].get('transport', {})
    if (not isinstance(transport, dict)
            or transport.get('command') != descriptor['command']
            or transport.get('args') != descriptor['args']):
        raise RuntimeError('Codex did not select the demo proxy and workspace')
    return arguments


def demo_brief_path():
    """The owner's directions, written into the demo home beside the bootstrap.

    A file rather than an address: a session's grant is the demo's Uclusion
    tools and the demo's own CLI, and nothing in that can fetch a URL. An
    owner handed a link starts correctly and then has no instructions.
    """
    return os.path.join(UCLUSION_HOME, 'demo-brief.md')


# The owner's `uclusion watch` appends each notification it sees to this log
# in a demo home, and `uclusion demo --progress` estimates from it.
DEMO_NOTIFICATION_LOG = 'demo-notifications.log'


def demo_notification_log_path():
    return os.path.join(UCLUSION_HOME, DEMO_NOTIFICATION_LOG)


def reset_demo_progress(env):
    """Start this run's progress from nothing, and say how to follow it.

    The home is reused across runs, so an old log would report an exercise
    that is already over. Printed before either session starts, because the
    person's agent reads this output while the command is still running.
    """
    try:
        os.remove(demo_notification_log_path())
    except FileNotFoundError:
        pass
    print(
        '👀 To follow the exercise while it runs, repeat '
        f'`{workflow_cli_command(env)} demo --progress --wait`. It prints one '
        'line estimating how far the exercise has got, from the notifications '
        'the owner has received, and changes nothing.'
    )


def demo_home_processes(home, needle=None):
    """(pid, args) for live processes whose command line names this home.

    One mechanism for two needs: waiting until the owner's watch is up before
    the evaluator can say anything, and refusing to delete a home something is
    still using. Best effort - a platform without `ps` returns nothing rather
    than failing the run, so callers treat an empty list as "cannot tell".
    """
    try:
        listing = subprocess.run(
            ['ps', '-eo', 'pid=,args='],
            capture_output=True, text=True, timeout=30,
        ).stdout
    except Exception:
        return []
    found = []
    for line in listing.splitlines():
        pid_text, _, args = line.strip().partition(' ')
        if not args or home not in args:
            continue
        # Mentioning the home is not enough to be killed for. A grep, an
        # editor, or a script passed the path as an argument all name it and
        # none of them is this demo; naming a file inside the home does not
        # help either, because a command line that references one still is
        # not running it. What distinguishes a demo process is that it *runs*
        # from this home, or is a client session pointed at it.
        fields = args.split()
        program = fields[0]
        script = fields[1] if len(fields) > 1 else ''
        # An interpreter running one of this demo's own executables counts;
        # an editor with a file from the home open does not, and the second
        # argument being somewhere in the home is not the difference.
        runs_from_home = (
            program.startswith(home)
            or script.startswith(os.path.join(home, '.local'))
        )
        is_demo_session = (
            os.path.basename(program) == 'claude'
            and any(field.startswith(home) for field in fields[1:])
        )
        is_demo_codex = (
            os.path.basename(program) == 'codex'
            and os.path.join(home, '.local', 'bin', 'uclusionMCPProxy.py') in args
            and ('-c projects={' + _toml_basic_string(home)
                 + '={trust_level="trusted"}}') in args
        )
        if not (runs_from_home or is_demo_session or is_demo_codex):
            continue
        if needle is not None:
            # A native client's prompt can itself name the watch command.
            # Readiness requires the running CLI, not text inside a prompt.
            if is_demo_session or is_demo_codex or needle not in args:
                continue
        try:
            pid = int(pid_text)
        except ValueError:
            continue
        if pid in (os.getpid(), os.getppid()):
            continue
        # The removal pipeline names this home on its own command line, as
        # does whatever shell invoked it. Stopping those would be stopping
        # ourselves partway through a delete.
        if DEMO_REMOVE_MODE in args or DEMO_PURGE_MODE in args:
            continue
        if 'demo --remove' in args:
            continue
        # The person's agent follows the run with this; it only reads a log
        # and ends on its own. Stopping it as the run ends would hand the
        # agent a killed command just as the report arrives.
        if 'demo --progress' in args or 'demo --result' in args:
            continue
        found.append((pid, args))
    return found


def wait_for_owner_watch(home, deadline_seconds=180, owner=None):
    """Hold the evaluator until the owner can hear it.

    The owner learns it is needed from `watch`; an evaluator that writes before
    that is up is writing where nobody is looking, which is how the first run
    to reach the exercise died.
    """
    deadline = time.monotonic() + deadline_seconds
    while time.monotonic() < deadline:
        if owner is not None and owner.poll() is not None:
            return False
        if demo_home_processes(home, ' watch'):
            return True
        time.sleep(2)
    return False


def stop_demo_home_processes(home):
    """Stop anything still running against this home. Returns (stopped, left)."""
    stopped, left = 0, []
    for pid, args in demo_home_processes(home):
        try:
            os.kill(pid, signal.SIGTERM)
            stopped += 1
        except Exception:
            left.append((pid, args))
    if stopped:
        time.sleep(3)
        for pid, args in demo_home_processes(home):
            try:
                os.kill(pid, signal.SIGKILL)
            except Exception:
                left.append((pid, args))
    return stopped, left


def demo_session_args(env, mcp_config=None):
    """The flags every demo session is started with.

    ``mcp_config`` replaces the demo's shared MCP config for one session; the
    evaluator gets its own only when its response sizes are being recorded.

    Argv, not a shell line: values must not be shell-quoted. Passing
    shlex.quote output here made the client reject both --allowedTools rules
    as malformed - the quotes arrived as literal characters - so every session
    ran with no grant at all and the owner could not run its own watch.
    """
    demo_cli = workflow_cli_command(env)
    return [
        # S-Marketing-75: none of the person's user-level settings, CLAUDE.md,
        # skills or plugins. The sessions start in the demo home, so project
        # and local mean that home, which holds none either. Login is kept.
        '--setting-sources', 'project,local',
        '--mcp-config', mcp_config or demo_mcp_config_path(),
        '--strict-mcp-config',
        '--plugin-dir', demo_plugin_path(),
        # The file form rather than --append-system-prompt "$(cat ...)": a
        # command substitution cannot be analysed statically, so an agent
        # asked to run that line has it refused.
        '--append-system-prompt-file', demo_bootstrap_path(),
        # S-Marketing-92: text output is written only when a turn ends, and
        # the supervisor stops both sessions before theirs do, so their logs
        # stayed empty. Streamed output lands in them as it happens.
        '--output-format', 'stream-json', '--verbose',
        '--allowedTools',
        f'mcp__{MCP_SERVER_KEY}__*',
        f'Bash({demo_cli}:*)',
        # The Claude sessions start in the demo home, where the brief and the
        # workflow references sit; naming it keeps them readable from any
        # directory a session is started in.
        '--add-dir', uclusion_home_root(),
    ]


class DemoCodexTerminal:
    """Drain the ordinary Codex TUI; completion comes only from its report."""

    def __init__(self, command, environment, log):
        import pty
        import struct
        import termios

        self.master, slave = pty.openpty()
        self.pending = b''
        self.log = log
        fcntl.ioctl(slave, termios.TIOCSWINSZ, struct.pack('HHHH', 30, 100, 0, 0))

        def own_terminal():
            os.setsid()
            fcntl.ioctl(0, termios.TIOCSCTTY, 0)

        try:
            self.process = subprocess.Popen(
                command, cwd=uclusion_home_root(), env=environment,
                stdin=slave, stdout=slave, stderr=slave,
                preexec_fn=own_terminal,
            )
        except BaseException:
            os.close(self.master)
            raise
        finally:
            os.close(slave)

    def drain(self, timeout=0.25):
        import select

        if not select.select([self.master], [], [], timeout)[0]:
            return False
        try:
            data = os.read(self.master, 65536)
        except OSError as error:
            if error.errno == errno.EIO:  # PTY slave closed.
                return False
            raise
        if not data:
            return False
        self.log.write(data)
        self.log.flush()
        # The TUI expects a terminal to answer capability queries. Keep a
        # short tail because a query can cross reads; consume each match so
        # an old query is not answered again. No model text is interpreted.
        self.pending += data
        replies = (
            (b'\x1b[6n', b'\x1b[1;1R'),
            (b'\x1b[?u', b'\x1b[?0u'),
            (b'\x1b[c', b'\x1b[?1;2c'),
            (b'\x1b]10;?\x1b\\', b'\x1b]10;rgb:ffff/ffff/ffff\x1b\\'),
            (b'\x1b]11;?\x1b\\', b'\x1b]11;rgb:0000/0000/0000\x1b\\'),
            (b'\x1b]10;?\x07', b'\x1b]10;rgb:ffff/ffff/ffff\x07'),
            (b'\x1b]11;?\x07', b'\x1b]11;rgb:0000/0000/0000\x07'),
        )
        for query, reply in replies:
            count = self.pending.count(query)
            if count:
                try:
                    os.write(self.master, reply * count)
                except OSError as error:
                    if error.errno != errno.EIO:
                        raise
                self.pending = self.pending.replace(query, b'')
        self.pending = self.pending[-32:]
        return True

    def close(self):
        try:
            while self.drain(timeout=0):
                pass
        finally:
            os.close(self.master)


def stop_demo_session(process):
    """Let an owned launcher clean up, then stop its remaining process group."""
    if process is None:
        return
    if process.poll() is None:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            pass
    # Shell tools may outlive their parent, so include the group even when
    # the launcher has already exited. Each session owns its own group.
    try:
        os.killpg(process.pid, signal.SIGTERM)
    except ProcessLookupError:
        process.wait(timeout=5)
        return
    deadline = time.monotonic() + 2
    while time.monotonic() < deadline:
        process.poll()
        try:
            os.killpg(process.pid, 0)
        except ProcessLookupError:
            break
        time.sleep(0.05)
    else:
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
    process.wait(timeout=5)


@contextmanager
def demo_shutdown_signals():
    """Route installer termination through the same finally cleanup as errors."""
    previous = {}

    def interrupt(signum, _frame):
        raise KeyboardInterrupt(f'signal {signum}')

    try:
        for signum in (signal.SIGTERM, signal.SIGHUP):
            previous[signum] = signal.signal(signum, interrupt)
        yield
    finally:
        for signum, handler in previous.items():
            signal.signal(signum, handler)


def new_demo_run_dir():
    runs = os.path.join(UCLUSION_HOME, 'demo-runs')
    ensure_dir(runs)
    return tempfile.mkdtemp(prefix='run-', dir=runs)


def demo_current_run_path():
    return os.path.join(UCLUSION_HOME, DEMO_CURRENT_RUN_FILE)


def record_demo_failure(run_dir, message):
    """What `uclusion demo --result` prints when the exercise ends without a report."""
    with open(os.path.join(run_dir, DEMO_FAILURE_FILE), 'w', encoding='utf-8') as handle:
        handle.write(message + '\n')


# S-Marketing-88: the owner's records show as the human's, so an evaluator
# that is not told otherwise credits replies written in advance to a person.
DEMO_SCRIPTED_OWNER = (
    "This job's owner shows as the human in this workspace, but it is a "
    'scripted stand-in run by the demo: its replies and votes follow a plan '
    'written in advance.'
)
DEMO_SCRIPT_SEPARATION = (
    ' Keep what Uclusion did apart from what the scripted owner supplied.'
)
# S-Marketing-93: the person running the demo pays for it, so they choose the
# model and effort both sessions run at, and nothing is read from their own
# settings. A session cannot see its own effort, so the run states it instead.
DEMO_RUN_CHOICE_FILE = 'run-choice.json'
DEMO_EFFORT_NOTE = (
    'Do not state an effort level in your records or your report: you cannot '
    'see yours, and the demo reports the model and effort this run used.'
)


def demo_choice_args(client, model, effort):
    """The launch options that hold a demo session to the person's choice."""
    arguments = []
    if client == 'codex':
        if model:
            arguments.extend(['-m', model])
        if effort:
            arguments.extend([
                '-c', 'model_reasoning_effort=' + _toml_basic_string(effort),
            ])
        return arguments
    if model:
        arguments.extend(['--model', model])
    if effort:
        arguments.extend(['--effort', effort])
    return arguments


def start_demo_supervisor(env, client, workspace_id, start_prompt, response_stats=None,
                          model=None, effort=None):
    """S-Marketing-77: start the exercise detached and return.

    A prospect's agent that ran this command in the foreground waited out the
    whole exercise and could lose it to its own command timeout. The copy runs
    from the home's .local directory so the demo's process scan, and therefore
    `demo --remove`, recognises it as this demo's.
    """
    run_dir = new_demo_run_dir()
    supervisor = os.path.join(SYMLINK_DIR, 'uclusionDemoSupervisor.py')
    shutil.copyfile(os.path.abspath(__file__), supervisor)
    with open(demo_current_run_path(), 'w', encoding='utf-8') as handle:
        handle.write(run_dir)
    with open(os.path.join(run_dir, DEMO_RUN_CHOICE_FILE), 'w', encoding='utf-8') as handle:
        json.dump({'client': client, 'model': model, 'effort': effort}, handle)
    with open(os.path.join(run_dir, 'supervisor.log'), 'wb') as log:
        process = subprocess.Popen(
            [sys.executable, supervisor, DEMO_SUPERVISE_MODE, env, client, workspace_id, run_dir,
             start_prompt, response_stats or '', model or '', effort or ''],
            cwd=uclusion_home_root(), stdin=subprocess.DEVNULL, stdout=log,
            stderr=subprocess.STDOUT, start_new_session=True,
        )
    with open(os.path.join(run_dir, DEMO_SUPERVISOR_PID_FILE), 'w', encoding='utf-8') as handle:
        handle.write(str(process.pid))
    cli = workflow_cli_command(env)
    print(f'📁 Demo session records: {run_dir}')
    print('🚀 The workshop owner and the evaluating agent are starting on their own. The '
          'exercise takes several minutes and needs nothing from anyone.')
    print(f'📝 `{cli} demo --result --wait` prints the evaluating agent\'s report once it is '
          'published. It returns within about 100 seconds either way, so repeat it until the '
          'report appears.')
    # S-Marketing-87: the prompt promises a removal that takes everything, so
    # name the command that does, including what the client keeps outside.
    kept = (
        ', and the transcripts, task output and project entry Claude Code keeps for it'
        if client == 'claude' else ''
    )
    print(f'🧹 `{cli} demo --remove` removes the demo: {uclusion_home_root()}{kept}.',
          flush=True)
    return 0


def supervise_demo(argv):
    """The detached half of the demo command: run the exercise to its end."""
    env, client, workspace_id, run_dir, start_prompt, response_stats, model, effort = argv
    runner = run_codex_demo if client == 'codex' else run_claude_demo
    try:
        return runner(env, workspace_id, start_prompt,
                      response_stats=response_stats or None, run_dir=run_dir,
                      model=model or None, effort=effort or None)
    except (OSError, RuntimeError) as error:
        message = f'Could not start the demo: {error}. Records: {run_dir}.'
        record_demo_failure(run_dir, message)
        print(f'❌ {message}', flush=True)
        return 1


def run_codex_demo(env, workspace_id, start_prompt, response_stats=None, run_dir=None,
                   model=None, effort=None):
    """Supervise the ordinary owner and bridged evaluator until publication."""
    run_dir = run_dir or new_demo_run_dir()
    report_path = os.path.join(run_dir, 'evaluation.md')
    environment = demo_codex_environment()
    environment['TERM'] = 'xterm-256color'
    environment['UCLUSION_DEMO_REPORT_FILE'] = report_path
    session_args = (
        demo_codex_session_args(env, workspace_id)
        + demo_choice_args('codex', model, effort)
    )
    evaluator_command = demo_codex_cli_args(env)
    if response_stats:
        evaluator_command.extend(['--response-stats', response_stats])
    cli_command = shlex.join(demo_codex_cli_args(env))
    owner_prompt = (
        f'Read the file {demo_brief_path()} and follow it exactly. '
        'It is addressed to you. You play the human workshop owner, so use '
        f'{cli_command} watch for human notifications and do not start a '
        'Poke listener or drain. Keep working until the brief says to stop.\n'
    )
    evaluator_prompt = (
        f'{start_prompt} {DEMO_SCRIPTED_OWNER}\n\n{DEMO_EFFORT_NOTE}\n\n'
        'After presenting your completion package, wait for the owner\'s '
        'selection on the review and handle it through the normal workflow. '
        'Do not begin the evaluation merely because you presented the package. '
        'Once its selected actions, terminal record and final selected clear '
        'are complete, call find_work as your last workflow step before the '
        'evaluation. Do not take another job. In that same continuation turn, '
        'answer the following as ordinary Uclusion records. If a package action '
        'fails, follow the package stop rules, skip discovery, and report the '
        'unfinished actions in your evaluation. Then publish that '
        f'complete answer by running {cli_command} demo --report with the '
        'answer on standard input. This command publishes the final report '
        'atomically to the designated file; do not write drafts to that '
        'destination. The installer will stop this session after publication, '
        'so you do not need to exit yourself.\n\n'
        'Report on Uclusion itself, from your point of view as the agent '
        'that just used it. Which of its collaboration capabilities did you '
        'actually use or observe, what does each one do, and did it work? '
        'Say plainly which ones you could not inspect or did not exercise, '
        'and do not treat those as absent. Say where it got in your way as '
        'readily as where it helped.' + DEMO_SCRIPT_SEPARATION
    )
    for name, prompt in (('owner-input.md', owner_prompt),
                         ('evaluator-input.md', evaluator_prompt)):
        with open(os.path.join(run_dir, name), 'w', encoding='utf-8') as handle:
            handle.write(prompt)
    owner = terminal = None
    print(f'📁 Demo session records: {run_dir}', flush=True)
    try:
        with demo_shutdown_signals(), open(
            os.path.join(run_dir, 'owner.jsonl'), 'wb'
        ) as owner_log, open(
            os.path.join(run_dir, 'evaluator-terminal.log'), 'wb'
        ) as evaluator_log:
            try:
                print('🤝 Starting the workshop owner.', flush=True)
                owner = subprocess.Popen(
                    ['codex', 'exec', '--skip-git-repo-check', '--json',
                     *session_args, owner_prompt],
                    cwd=uclusion_home_root(), env=environment,
                    stdin=subprocess.DEVNULL, stdout=owner_log,
                    stderr=subprocess.STDOUT, start_new_session=True,
                )
                if not wait_for_owner_watch(uclusion_home_root(), owner=owner):
                    raise RuntimeError('the owner did not start its notification watch')
                print('🧠 Starting the evaluating agent.', flush=True)
                terminal = DemoCodexTerminal(
                    [*evaluator_command, 'codex', '--', *session_args, evaluator_prompt],
                    environment, evaluator_log,
                )
                while True:
                    if os.path.isfile(report_path):
                        with open(report_path, 'rb') as handle:
                            answer = handle.read()
                        if not answer.decode('utf-8').strip():
                            raise RuntimeError('the published evaluation is empty')
                        sys.stdout.flush()
                        sys.stdout.buffer.write(answer)
                        sys.stdout.buffer.flush()
                        return 0
                    if terminal.process.poll() is not None:
                        raise RuntimeError('the evaluator exited before publishing its report')
                    if owner.poll() not in (None, 0):
                        raise RuntimeError('the owner failed before report publication')
                    terminal.drain()
            finally:
                try:
                    if terminal is not None:
                        try:
                            stop_demo_session(terminal.process)
                        finally:
                            terminal.close()
                finally:
                    try:
                        stop_demo_session(owner)
                    finally:
                        # Codex shell tools may create their own process
                        # groups. The demo's existing removal scan catches
                        # its CLI/watch/proxy children that escaped ours.
                        _stopped, left = stop_demo_home_processes(uclusion_home_root())
                        if left:
                            raise RuntimeError(
                                'could not stop demo processes: '
                                + ', '.join(str(pid) for pid, _args in left)
                            )
    except (OSError, RuntimeError, UnicodeError, KeyboardInterrupt) as error:
        message = f'Codex demo failed: {error}. Records: {run_dir}; Uclusion workspace: {workspace_id}.'
        record_demo_failure(run_dir, message)
        print(f'❌ {message}', flush=True)
        return 1


def run_claude_demo(env, workspace_id, start_prompt, response_stats=None, run_dir=None,
                    model=None, effort=None):
    """Supervise the Claude owner and evaluator until the evaluator publishes.

    S-Marketing-73: the report is the file the evaluator publishes with
    demo --report, as on Codex, not the session's last output. A Monitor
    expiry once woke the evaluator after its evaluation, and whatever that
    extra turn said would have replaced the report.
    """
    run_dir = run_dir or new_demo_run_dir()
    report_path = os.path.join(run_dir, 'evaluation.md')
    # Both sessions are started here rather than printed for someone else to
    # run: this process is the only participant that ever sees both, so
    # ordering and cleanup can live in one place. A session already running
    # cannot acquire --mcp-config or --plugin-dir, which is why these have to
    # be new processes.
    choice_args = demo_choice_args('claude', model, effort)
    session_args = demo_session_args(env) + choice_args
    evaluator_session_args = demo_session_args(
        env, write_demo_evaluator_mcp_config(response_stats),
    ) + choice_args
    # Only the evaluator is given the report destination; the owner has
    # nothing to publish.
    evaluator_environment = dict(os.environ)
    evaluator_environment['UCLUSION_DEMO_REPORT_FILE'] = report_path
    # The owner has no other way to learn where its directions are: the
    # installer's output is addressed to the agent that ran it and the owner
    # never sees it. S-Marketing-74: its bootstrap says to arm Poke delivery,
    # but it shares the evaluator's credential, so a listener would hand it
    # the evaluator's AI events - the Codex owner is told the same.
    owner_prompt = (
        f'Read the file {demo_brief_path()} and follow it exactly. '
        'It is addressed to you. You play the human workshop owner, so use '
        f'{workflow_cli_command(env)} watch for human notifications and do not '
        'start a Poke listener or drain.\n'
    )
    # Its prompt carries the starting job and the ask it answers at the end.
    # The ask lives here rather than reaching it later as a Poke so that the
    # published evaluation is the evaluator's last act.
    evaluator_prompt = (
        f'{start_prompt} {DEMO_SCRIPTED_OWNER}\n\n{DEMO_EFFORT_NOTE}\n\n'
        'After presenting your completion package, wait for the owner\'s '
        'selection on the review and handle it through the normal workflow. '
        'Do not begin the evaluation merely because you presented the package. '
        'Once its selected actions, terminal record and final selected clear '
        'are complete, call find_work as your last workflow step before the '
        'evaluation. Do not take another job. In that same continuation turn, '
        'answer the following as ordinary Uclusion records. If a package action '
        'fails, follow the package stop rules, skip discovery, and report the '
        'unfinished actions in your evaluation. Then publish that complete '
        f'answer by running {workflow_cli_command(env)} demo --report with the '
        'answer on standard input. This command publishes the final report '
        'atomically to the designated file; do not write drafts to that '
        'destination. The installer will stop this session after publication, '
        'so you do not need to exit yourself.\n\n'
        'Report on Uclusion itself, from your point of view as the '
        'agent that just used it. Which of its collaboration '
        'capabilities did you actually use or observe, what does each '
        'one do, and did it work? Say plainly which ones you could '
        'not inspect or did not exercise, and do not treat those as '
        'absent. Say where it got in your way as readily as where it '
        'helped.' + DEMO_SCRIPT_SEPARATION
    )
    for name, prompt in (('owner-input.md', owner_prompt),
                         ('evaluator-input.md', evaluator_prompt)):
        with open(os.path.join(run_dir, name), 'w', encoding='utf-8') as handle:
            handle.write(prompt)
    # Kept rather than discarded: when a session fails, its log is the only
    # evidence of why, and removal takes it with the home.
    owner_log_path = os.path.join(run_dir, 'owner.log')
    owner = evaluator = None
    print(f'📁 Demo session records: {run_dir}', flush=True)
    try:
        with demo_shutdown_signals(), open(
            owner_log_path, 'w', encoding='utf-8'
        ) as owner_log, open(
            os.path.join(run_dir, 'evaluator.log'), 'w', encoding='utf-8'
        ) as evaluator_log:
            try:
                print('🤝 Starting the workshop owner.', flush=True)
                # Started in the demo home, as the Codex sessions are, so no
                # project's settings or CLAUDE.md reach them (S-Marketing-75).
                owner = subprocess.Popen(
                    ['claude'] + session_args, cwd=uclusion_home_root(),
                    stdin=subprocess.PIPE, stdout=owner_log,
                    stderr=subprocess.STDOUT, text=True, start_new_session=True,
                )
                owner.stdin.write(owner_prompt)
                owner.stdin.close()
                if not wait_for_owner_watch(uclusion_home_root()):
                    print(
                        '⚠️  The owner is not watching for notifications yet. '
                        'Continuing, but if it never wakes the exercise will not '
                        f'finish. Its session is in {owner_log_path}.', flush=True,
                    )
                print(
                    '🧠 Starting the evaluating agent. This runs for several '
                    'minutes and needs nothing from anyone while it does.',
                    flush=True,
                )
                evaluator = subprocess.Popen(
                    ['claude'] + evaluator_session_args, cwd=uclusion_home_root(),
                    stdin=subprocess.PIPE, stdout=evaluator_log,
                    stderr=subprocess.STDOUT, text=True,
                    env=evaluator_environment, start_new_session=True,
                )
                evaluator.stdin.write(evaluator_prompt)
                evaluator.stdin.close()
                while True:
                    # A published report is complete: the CLI links it into
                    # place only after writing it in full.
                    if os.path.isfile(report_path):
                        with open(report_path, 'rb') as handle:
                            answer = handle.read()
                        if not answer.decode('utf-8').strip():
                            raise RuntimeError('the published evaluation is empty')
                        break
                    if evaluator.poll() is not None:
                        raise RuntimeError(
                            'the evaluator exited before publishing its report'
                        )
                    time.sleep(0.25)
            finally:
                # Stop what this process started. An owner left running fails
                # silently - it just sits on a watch against a workspace
                # nobody is using - and an evaluator left running can wake
                # and act after its evaluation is done.
                try:
                    stop_demo_session(evaluator)
                finally:
                    try:
                        stop_demo_session(owner)
                    finally:
                        stopped, left = stop_demo_home_processes(uclusion_home_root())
                        if stopped:
                            print(f'🧹 Stopped {stopped} other demo process(es).', flush=True)
                        for pid, _args in left:
                            print(f'  ⚠️  Could not stop process {pid}.', flush=True)
    except (OSError, RuntimeError, UnicodeError, KeyboardInterrupt) as error:
        message = (f'Claude demo failed: {error}. Records: {run_dir}; everything the exercise '
                   f'wrote is in demo workspace {workspace_id} and under {uclusion_home_root()} '
                   'until that directory is removed.')
        record_demo_failure(run_dir, message)
        print(f'❌ {message}', flush=True)
        return 1
    print(flush=True)
    sys.stdout.flush()
    sys.stdout.buffer.write(answer)
    sys.stdout.buffer.flush()
    return 0


def demo_mcp_config_path():
    """The standalone MCP config this demo's launch line hands the client.

    Passing the server on the command line is what keeps a background session
    out of the per-project "new MCP server found" trust prompt, which such a
    session has no way to answer.
    """
    return os.path.join(UCLUSION_HOME, 'mcp.json')


def demo_evaluator_mcp_config_path():
    return os.path.join(UCLUSION_HOME, 'mcp-evaluator.json')


def write_demo_evaluator_mcp_config(response_stats):
    """The evaluator's MCP config when it records response sizes, else None.

    Copied from the demo's shared config and differing only by the flag, so
    the owner records nothing and the evaluator is otherwise identical. The
    home is reused across runs, so a run that asks for no statistics removes
    an earlier run's copy rather than recording into its old path.
    """
    path = demo_evaluator_mcp_config_path()
    if not response_stats:
        try:
            os.remove(path)
        except FileNotFoundError:
            pass
        return None
    with open(demo_mcp_config_path(), encoding='utf-8') as handle:
        config = json.load(handle)
    server = config['mcpServers'][MCP_SERVER_KEY]
    server['args'] = list(server['args']) + ['--response-stats', response_stats]
    with open(path, 'w', encoding='utf-8') as handle:
        handle.write(json.dumps(config, indent=2) + '\n')
    return path


def demo_runtime_dir():
    """Create and secure the disposable home used by the ordinary client."""
    path = demo_home_path()
    try:
        os.mkdir(path, 0o700)
    except FileExistsError:
        pass
    # lstat, so a symlink planted in a shared temp directory is refused rather
    # than followed. Everything below runs before anything is written.
    info = os.lstat(path)
    if not stat.S_ISDIR(info.st_mode):
        raise RuntimeError(f'{path} exists and is not a directory')
    if hasattr(os, 'getuid') and info.st_uid != os.getuid():
        raise RuntimeError(f'{path} is owned by another user')
    if info.st_mode & (stat.S_IRWXG | stat.S_IRWXO):
        os.chmod(path, 0o700)
    return path


def legacy_demo_mcp_descriptor(env):
    """Describe the removed demo proxy so setup can safely replace one."""
    return {
        'command': 'python3',
        'args': [
            os.path.join(demo_home_path(), 'uclusionDemoMCP.py'),
            env or 'production',
        ],
    }


def reexec_in_demo_home():
    """Restart this installer so import-time paths all use the demo home.

    UCLUSION_HOME is read at import, so it has to be set before this module's
    path constants resolve. It moves what Uclusion owns and nothing else.

    What the client owns stays where the client put it. Moving it with
    CLAUDE_CONFIG_DIR looked like a way to write nothing into the person's own
    configuration, but a relocated directory holds no credentials, and the
    person's identity is a logged-in session rather than anything an installer
    could copy into one. A session started against a moved directory reported
    "Not logged in" and could not begin the exercise, so the demo keeps the
    directory the person is already signed in to.
    """
    home = demo_runtime_dir()
    if uclusion_home_root() == home:
        return
    environment = dict(os.environ)
    environment['UCLUSION_HOME'] = home
    os.execve(
        sys.executable,
        [sys.executable, os.path.abspath(__file__)] + sys.argv[1:],
        environment,
    )
    raise RuntimeError('the installer could not restart in the demo home')


class _NoDemoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, _request, _fp, _code, _message, _headers, _url):
        return None


def request_demo_json(url, payload):
    """POST one bounded JSON request without forwarding the verifier on redirect."""
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        method='POST',
    )
    try:
        try:
            response = urllib.request.build_opener(
                _NoDemoRedirectHandler()
            ).open(request, timeout=HTTP_TIMEOUT)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            body = response.read(DEMO_RESPONSE_LIMIT_BYTES + 1)
            if len(body) > DEMO_RESPONSE_LIMIT_BYTES:
                raise ValueError('oversize response')
            parsed = json.loads(body)
            if not isinstance(parsed, dict):
                raise ValueError('response is not an object')
            return response.code, parsed
    except (OSError, UnicodeError, ValueError, urllib.error.URLError) as error:
        raise RuntimeError(
            'the demo service did not return a valid response'
        ) from error


def provision_demo(env):
    """Allocate a demo and wait for the ordinary client's workspace details.

    J-Marketing-43: the service hands out a demo it built in advance, so it names
    the demo. Only the verifier's challenge goes out; the id comes back.
    """
    verifier = secrets.token_urlsafe(32)
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode('ascii')).digest()
    ).decode('ascii').rstrip('=')
    base_url = f'https://sso.{get_api_base_url(env)}/ai-demo'
    status, result = request_demo_json(base_url, {'code_challenge': challenge})
    if status == 429:
        # Q-Marketing-204: the service limits how many demos one network starts an hour.
        message = result.get('message') if isinstance(result, dict) else None
        raise RuntimeError(message if isinstance(message, str) and message else
                           'too many demos were started from this network in the last hour; try again later')
    demo_id = result.get('demo_id') if isinstance(result, dict) else None
    try:
        if not isinstance(demo_id, str) or str(uuid.UUID(demo_id)) != demo_id:
            raise ValueError(demo_id)
    except ValueError:
        demo_id = None
    if status not in (200, 202) or demo_id is None:
        raise RuntimeError('the demo could not be allocated; start a fresh demo')

    print('⏳ Preparing the demo workspace...')
    deadline = time.monotonic() + DEMO_PROVISION_TIMEOUT_SECONDS
    while True:
        status, result = request_demo_json(
            f'{base_url}/{demo_id}/status', {'verifier': verifier}
        )
        if status not in (200, 202) or result.get('demo_id') != demo_id:
            raise RuntimeError(
                'the demo could not be prepared; start a fresh demo'
            )
        state = result.get('state')
        if state == 'READY':
            required = ('workspace_id', 'view_id', 'client_id')
            if not all(
                isinstance(result.get(key), str) and result[key]
                for key in required
            ):
                raise RuntimeError(
                    'the demo service returned incomplete workspace details'
                )
            starting_jobs = result.get('starting_job_short_codes')
            if (
                not isinstance(starting_jobs, list)
                or not starting_jobs
                or not all(
                    isinstance(short_code, str)
                    and DEMO_SHORT_CODE_RE.fullmatch(short_code)
                    for short_code in starting_jobs
                )
            ):
                raise RuntimeError(
                    'the demo service returned incomplete starting work'
                )
            client_id = result['client_id']
            if (
                len(client_id) > DEMO_CLIENT_ID_MAX_LENGTH
                or not client_id.lower().startswith(
                    f'ai-demo:{demo_id.lower()}:human_'
                )
                or DEMO_CLIENT_ID_RE.fullmatch(client_id) is None
            ):
                raise RuntimeError('the demo service returned an invalid client id')
            return result
        if state != 'PROVISIONING':
            raise RuntimeError(
                'the demo could not be prepared; start a fresh demo'
            )
        if time.monotonic() >= deadline:
            raise RuntimeError(
                'the demo took too long to prepare; start a fresh demo'
            )
        retry = result.get('retry_after_seconds', 2)
        if not isinstance(retry, (int, float)) or isinstance(retry, bool):
            retry = 2
        time.sleep(max(0.25, min(float(retry), 10)))


def write_demo_credentials(env, client_id):
    """Write the demo human's ordinary CLI credential into the disposable home."""
    path = os.path.join(UCLUSION_HOME, CREDENTIALS_FILES[env])
    target = _config_write_target(path)
    existing, signature = _read_text_snapshot(target)
    content = (
        f'secret_key_id={client_id}\n'
        f'secret_key={DEMO_CLIENT_SECRET}\n'
    )
    with config_file_lock(path):
        atomic_write_text(path, content, existing, target, signature)
    print(f'  ✅ Wrote demo credentials to {path}')


def workflow_cli_command(environment):
    """The CLI invocation resident stubs should use for this install."""
    if environment == 'production':
        invocation = 'uclusion'
    elif environment in ('dev', 'stage'):
        invocation = f'uclusion -e {environment}'
    else:
        return None
    if uclusion_home_root() == os.path.abspath(os.path.expanduser('~')):
        return invocation
    prefix = (
        f'UCLUSION_HOME={shlex.quote(uclusion_home_root())} '
        f'{shlex.quote(os.path.join(SYMLINK_DIR, "uclusion"))}'
    )
    if environment == 'production':
        return prefix
    return f'{prefix} -e {environment}'


def _args_belong_to_this_demo(args, raw_text=None):
    home = demo_home_path()
    if isinstance(args, list):
        if '--home' in args:
            index = args.index('--home')
            return index + 1 < len(args) and args[index + 1] == home
        return os.path.join(home, 'uclusionDemoMCP.py') in args
    if not raw_text:
        return False
    return home in raw_text and (
        '--home' in raw_text or 'uclusionDemoMCP.py' in raw_text
    )


def _codex_uclusion_args(text):
    if tomllib is None:
        return None
    parsed = tomllib.loads(text)
    servers = parsed.get('mcp_servers')
    if not isinstance(servers, dict):
        return None
    server = servers.get(MCP_SERVER_KEY)
    if not isinstance(server, dict):
        return None
    args = server.get('args')
    return args if isinstance(args, list) else None


def _demo_workspace_config_path(env=None):
    """Locate this disposable home's workspace config, whatever its environment."""
    directory = os.path.join(uclusion_home_root(), '.uclusion')
    names = (
        [CONFIG_FILES[env]] if env in CONFIG_FILES
        else list(CONFIG_FILES.values())
    )
    for name in names:
        candidate = os.path.join(directory, name)
        if os.path.isfile(candidate):
            return candidate
    return None


def demo_installed_clients(env=None):
    """The clients this demo wrote to, taken from its own workspace config.

    Re-detecting the client would answer a different question - what is
    running now - so removal asks what the install recorded. An unreadable
    config falls back to every demo-capable client, which is safe because
    each removal step independently tests the mark it owns.
    """
    path = _demo_workspace_config_path(env)
    if path is not None:
        try:
            with open(path, 'r', encoding='utf-8') as handle:
                config = json.load(handle)
        except (OSError, ValueError):
            config = None
        if isinstance(config, dict):
            clients = config.get('workflowClients')
            if isinstance(clients, list):
                found = [
                    client for client in clients if client in DEMO_CLIENTS
                ]
                if found:
                    return found
    return sorted(DEMO_CLIENTS)


def _remove_demo_registration(client):
    """Drop the MCP entry only when its args name this demo's home."""
    path, _label, is_codex = _setup_registration_target(client, None)
    target = _config_write_target(path)
    existing, signature = _read_text_snapshot(target)
    if signature is None or not existing.strip():
        return 'absent', f'no Uclusion MCP server in {path}'
    if is_codex:
        if not _codex_has_uclusion_descriptor(existing):
            return 'absent', f'no Uclusion MCP server in {path}'
        if not _args_belong_to_this_demo(
            _codex_uclusion_args(existing), existing
        ):
            return 'kept', (
                f'{path} has a Uclusion MCP server that is not this demo\'s'
            )
        updated, changed = remove_owned_block(
            existing, CODEX_CONFIG_MARKER, CODEX_CONFIG_END_MARKER, 'MCP', path
        )
        if not changed:
            return 'kept', f'{path} has an unmarked Uclusion MCP server'
        validate_codex_config(updated)
        with codex_config_lock(path):
            atomic_write_text(path, updated, existing, target, signature)
        return 'removed', f'Uclusion MCP server from {path}'
    try:
        config = json.loads(existing)
    except json.JSONDecodeError as err:
        return 'kept', f'{path} is not valid JSON: {err}'
    if not isinstance(config, dict):
        return 'kept', f'{path} top-level value is not a JSON object'
    servers = config.get('mcpServers')
    if not isinstance(servers, dict) or MCP_SERVER_KEY not in servers:
        return 'absent', f'no Uclusion MCP server in {path}'
    descriptor = servers[MCP_SERVER_KEY]
    args = descriptor.get('args') if isinstance(descriptor, dict) else None
    if not _args_belong_to_this_demo(args):
        return 'kept', (
            f'{path} has a Uclusion MCP server that is not this demo\'s'
        )
    del servers[MCP_SERVER_KEY]
    if not servers:
        config.pop('mcpServers', None)
    updated = json.dumps(config, indent=2) + '\n'
    with config_file_lock(path):
        atomic_write_text(path, updated, existing, target, signature)
    return 'removed', f'Uclusion MCP server from {path}'


def _remove_demo_allow_rule():
    """Take back the allow rule, and the settings file if it held only that."""
    path = CLAUDE_SETTINGS_PATH
    target = _config_write_target(path)
    existing, signature = _read_text_snapshot(target)
    if signature is None:
        return 'absent', f'no {path}'
    try:
        config = json.loads(existing) if existing.strip() else {}
    except json.JSONDecodeError as err:
        return 'kept', f'{path} is not valid JSON: {err}'
    if not isinstance(config, dict):
        return 'kept', f'{path} top-level value is not a JSON object'
    permissions = config.get('permissions')
    allow = permissions.get('allow') if isinstance(permissions, dict) else None
    if not isinstance(allow, list) or CLAUDE_ALLOW_RULE not in allow:
        return 'absent', f'{path} does not allow {CLAUDE_ALLOW_RULE}'
    remaining = [rule for rule in allow if rule != CLAUDE_ALLOW_RULE]
    if remaining:
        permissions['allow'] = remaining
    else:
        permissions.pop('allow', None)
    if not permissions:
        config.pop('permissions', None)
    if not config:
        os.remove(path)
        return 'removed', f'{path}, which held only the Uclusion allow rule'
    updated = json.dumps(config, indent=2) + '\n'
    with config_file_lock(path):
        atomic_write_text(path, updated, existing, target, signature)
    return 'removed', f'{CLAUDE_ALLOW_RULE} from {path}'


def _remove_demo_stub(resident_path):
    """Take back the marker-owned block, and the file if nothing else is in it."""
    target = _config_write_target(resident_path)
    existing, signature = _read_text_snapshot(target)
    if signature is None:
        return 'absent', f'no {resident_path}'
    if CLAUDE_MD_MARKER not in existing:
        return 'absent', f'no Uclusion block in {resident_path}'
    updated, changed = remove_owned_block(
        existing, CLAUDE_MD_MARKER, CLAUDE_MD_END_MARKER, 'workflow',
        resident_path,
    )
    if not changed:
        return 'absent', f'no Uclusion block in {resident_path}'
    if not updated.strip():
        os.remove(resident_path)
        return 'removed', f'{resident_path}, which held only the Uclusion block'
    with config_file_lock(resident_path):
        atomic_write_text(
            resident_path, updated, existing, target, signature
        )
    return 'removed', f'the Uclusion block from {resident_path}'


def _demo_client_paths(client):
    """The resident stub and the two skill directories for ``client``."""
    if client == 'codex':
        return (
            CODEX_AGENTS_MD_PATH,
            (
                CODEX_SKILL_DIR,
                os.path.join(os.path.dirname(CODEX_SKILL_DIR), DESIGN_SKILL_NAME),
            ),
        )
    return (
        CLAUDE_MD_PATH,
        (
            CLAUDE_SKILL_DIR,
            os.path.join(CLAUDE_CONFIG_HOME, 'skills', DESIGN_SKILL_NAME),
        ),
    )


def _remove_demo_skill(skill_dir, package):
    """Remove a managed package whole, the way an install replaces it whole."""
    if not os.path.lexists(skill_dir):
        return 'absent', f'no {skill_dir}'
    try:
        _validate_owned_skill(skill_dir, package)
    except RuntimeError as err:
        return 'kept', str(err)
    _remove_installer_tree(skill_dir)
    return 'removed', skill_dir


def _remove_demo_config_lock(path):
    """Take the lock file with the config it guarded.

    These are ours by name and empty by design, so they are removed without a
    line of their own rather than reported as though the person had to care.
    """
    lock_path = f'{path}.uclusion.lock'
    try:
        os.remove(lock_path)
    except OSError:
        pass


def remove_demo_client_traces(env=None):
    """Undo every client-side trace this demo wrote, and report each one.

    The registration is removed first because it is the only trace that
    carries this demo's identity in its own content. The bootstrap block and
    the skill packages carry Uclusion's marks but not the demo's, and a real
    prospect's demo writes them into the same locations a genuine install
    uses, so removing them on their own marks would take a real install
    apart. They go only behind a registration this demo could prove was
    its own.
    """
    outcomes = []
    for client in demo_installed_clients(env):
        resident_path, skill_dirs = _demo_client_paths(client)
        isolated_workflow = (
            client == 'claude' and os.path.isdir(demo_plugin_path())
        ) or (
            client == 'codex' and os.path.isfile(os.path.join(
                uclusion_home_root(), '.codex', 'rules', 'uclusion-demo.rules'
            ))
        )
        if isolated_workflow and client == 'codex':
            # A rerun reuses the demo home. Its new isolated files do not
            # erase an older demo's native registration, which must still
            # lead the existing ownership-checked cleanup below.
            existing, _signature = _read_text_snapshot(
                _config_write_target(CODEX_CONFIG_PATH)
            )
            if existing.strip() and _codex_has_uclusion_descriptor(existing):
                if tomllib is None:
                    raise RuntimeError(
                        'Python 3.11 or newer is needed to check whether the '
                        'existing Codex Uclusion registration belongs to this '
                        'demo before removing it.'
                    )
                isolated_workflow = not _args_belong_to_this_demo(
                    _codex_uclusion_args(existing)
                )
        if isolated_workflow:
            # This demo kept its workflow in its own home and started every
            # session with it. Any unrelated native Uclusion install belongs
            # to the person and is not a trace of this demo.
            outcomes.append((
                'absent',
                f'anything in {client}, because this demo keeps its workflow '
                'in its own home and starts each session with it',
            ))
            continue
        registration = _remove_demo_registration(client)
        outcomes.append(registration)
        if registration[0] != 'removed':
            outcomes.append((
                'kept',
                f'everything else {client} holds, because no MCP server this '
                'demo installed was there to prove the rest is the demo\'s',
            ))
            continue
        if client == 'claude':
            outcomes.append(_remove_demo_allow_rule())
            _remove_demo_config_lock(CLAUDE_SETTINGS_PATH)
        outcomes.append(_remove_demo_stub(resident_path))
        outcomes.append(_remove_demo_skill(skill_dirs[0], 'uclusion'))
        outcomes.append(_remove_demo_skill(skill_dirs[1], DESIGN_SKILL_NAME))
        registration_path, _label, _is_codex = _setup_registration_target(
            client, None
        )
        _remove_demo_config_lock(registration_path)
        _remove_demo_config_lock(resident_path)
    return outcomes


def _print_removal_outcomes(outcomes):
    """Report each removal outcome; 1 when anything was left alone."""
    status = 0
    for state, detail in outcomes:
        if state == 'removed':
            print(f'  ✅ Removed {detail}')
        elif state == 'absent':
            print(f'  ⏭  Nothing to remove: {detail}')
        else:
            print(f'  ⚠️  Left alone: {detail}')
            status = 1
    return status


# Claude Code names a project's folders after its path, and past this length
# shortens the name with a hash of its own that removal cannot reproduce.
CLAUDE_PROJECT_NAME_LIMIT = 200


def claude_project_name(path):
    """Claude Code's folder name for a project path, or None past its limit."""
    name = re.sub(r'[^a-zA-Z0-9]', '-', path)
    return name if len(name) <= CLAUDE_PROJECT_NAME_LIMIT else None


def _claude_temp_roots():
    """Where Claude Code may have put its per-user temp directory."""
    roots = []
    for root in (os.environ.get('CLAUDE_CODE_TMPDIR'), tempfile.gettempdir(), '/tmp'):
        if root and os.path.abspath(root) not in roots:
            roots.append(os.path.abspath(root))
    return roots


def _remove_claude_folder(folder, label):
    if os.path.islink(folder) or not os.path.isdir(folder):
        return 'kept', f'{folder}, which is not a plain directory'
    try:
        shutil.rmtree(folder)
    except OSError as err:
        return 'kept', f'{folder} ({err})'
    return 'removed', f'{label} in {folder}'


def _remove_demo_claude_project_entries(paths):
    """Drop only the .claude.json project entries keyed by the demo home."""
    path = CLAUDE_JSON_PATH
    absent = ('absent', f'a project entry for the demo in {path}')
    try:
        target = _config_write_target(path)
        existing, signature = _read_text_snapshot(target)
        if signature is None or not existing.strip():
            return absent
        try:
            config = json.loads(existing)
        except json.JSONDecodeError as err:
            return 'kept', f'{path}, which is not valid JSON: {err}'
        projects = config.get('projects') if isinstance(config, dict) else None
        keys = [key for key in paths if isinstance(projects, dict) and key in projects]
        if not keys:
            return absent
        for key in keys:
            del projects[key]
        updated = json.dumps(config, indent=2) + '\n'
        try:
            with config_file_lock(path):
                atomic_write_text(path, updated, existing, target, signature)
        finally:
            # The lock is ours by name and would otherwise be a new trace.
            _remove_demo_config_lock(path)
    except (OSError, RuntimeError) as err:
        return 'kept', f'the demo\'s project entry in {path} ({err})'
    return 'removed', f'the demo\'s project entry from {path}'


def remove_demo_claude_session_traces(home):
    """S-Marketing-87: take back what Claude Code kept for the demo home.

    The demo's sessions run in its home, so Claude Code files their
    transcripts, their task output and a project entry under that path, all
    outside the home. Only names derived from this home's own path are touched.
    """
    paths = list(dict.fromkeys((home, os.path.realpath(home))))
    names = [claude_project_name(path) for path in paths]
    if None in names:
        return [('kept', f'Claude Code\'s folders for {home}, whose name it '
                         'shortens with a hash')]
    uid = os.getuid() if hasattr(os, 'getuid') else 0
    places = (
        ('the demo sessions\' transcripts',
         [os.path.join(CLAUDE_CONFIG_HOME, 'projects', name) for name in names]),
        ('the demo sessions\' task output',
         [os.path.join(root, f'claude-{uid}', name)
          for root in _claude_temp_roots() for name in names]),
    )
    outcomes = []
    for label, folders in places:
        found = [folder for folder in dict.fromkeys(folders) if os.path.lexists(folder)]
        outcomes.extend(_remove_claude_folder(folder, label) for folder in found)
        if not found:
            outcomes.append(('absent', label))
    outcomes.append(_remove_demo_claude_project_entries(paths))
    return outcomes


def remove_demo_install(argv):
    """Undo the client-side traces, then hand the home to a staged copy."""
    env = argv[0] if argv else None
    home = uclusion_home_root()
    if home != demo_home_path():
        print(
            '❌ This is not a disposable demo install, so there is nothing '
            'for the demo removal to undo.',
            file=sys.stderr,
        )
        return 1
    print(f'🧹 Removing the Uclusion demo installed under {home}.')
    status = _print_removal_outcomes(remove_demo_client_traces(env))
    # Nothing records the sessions a run started, so removal has to look for
    # them. A session started against this home keeps its client and its
    # credentials inside it, and deleting underneath one does not fail
    # anywhere a person is watching - it fails the next time that session
    # tries to do anything.
    stopped, left = stop_demo_home_processes(home)
    if stopped:
        print(f'  ✅ Stopped {stopped} session(s) still using {home}.')
    if left:
        for pid, _args in left:
            print(f'  ❌ Process {pid} is still using {home}.', file=sys.stderr)
        print(
            '❌ Refusing to delete a demo home that is still in use. Stop the '
            'processes above, then run removal again.',
            file=sys.stderr,
        )
        return 1
    # Only now, with no session left to write them again.
    status = _print_removal_outcomes(remove_demo_claude_session_traces(home)) or status

    # The rest of this process lives inside the directory it is about to
    # delete, so it continues from a copy outside it.
    staging = tempfile.mkdtemp(prefix='uclusion-demo-remove-')
    staged_installer = os.path.join(staging, 'uclusionInstall.py')
    shutil.copy2(os.path.abspath(__file__), staged_installer)
    sys.stdout.flush()
    os.execve(
        sys.executable,
        [
            sys.executable, staged_installer, DEMO_PURGE_MODE,
            home, staging, str(status),
        ],
        dict(os.environ),
    )
    raise RuntimeError('the demo removal could not restart outside the home')


def purge_demo_home(argv):
    """Delete the disposable home, then the staging copy this runs from."""
    if len(argv) < 3:
        return 1
    home, staging, inherited = argv[0], argv[1], argv[2]
    status = 1 if inherited not in ('0', '') else 0
    if os.path.abspath(home) != demo_home_path():
        print(
            f'❌ Refusing to delete {home}: it is not this user\'s demo home.',
            file=sys.stderr,
        )
        return 1
    try:
        shutil.rmtree(home)
        print(f'  ✅ Removed {home}')
    except OSError as err:
        print(f'  ⚠️  Left alone: {home} ({err})')
        status = 1
    shutil.rmtree(staging, ignore_errors=True)
    if status == 0:
        print(
            '🎉 The demo is removed. Restart or reconnect your client, and '
            'the demo workspace expires on its own.'
        )
    else:
        print(
            '⚠️  The demo is partly removed. What was left alone is listed '
            'above, and nothing else was touched.'
        )
    return status


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
                      expected_descriptor=_UNCHECKED_MCP_DESCRIPTOR,
                      response_stats=None):
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

    normal_claude = descriptor is None and token_audit_client == 'claude'
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

    if normal_claude:
        previous = servers.get(MCP_SERVER_KEY, {})
        if not isinstance(previous, dict):
            previous = {}
        if response_stats is None:
            previous_args = previous.get('args', [])
            if isinstance(previous_args, list):
                for index, arg in enumerate(previous_args):
                    if (arg == '--response-stats'
                            and index + 1 < len(previous_args)
                            and isinstance(previous_args[index + 1], str)):
                        response_stats = previous_args[index + 1]
                    elif (isinstance(arg, str)
                          and arg.startswith('--response-stats=')):
                        response_stats = arg.split('=', 1)[1]
        if response_stats:
            descriptor['args'].extend(['--response-stats', response_stats])
        # Preserve custom Claude fields while refreshing the owned command.
        # Explicit setup descriptors still use their exact-match contract.
        descriptor = {**previous, **descriptor}

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
            foreign = [
                key for key in (env if isinstance(env, dict) else {})
                if _is_claude_token_audit_policy_key(key)
            ] + [key for key in CLAUDE_TOKEN_AUDIT_SETTINGS_POLICY_KEYS
                 if key in config]
            stray_port = (
                _loopback_logs_port(env.get('OTEL_EXPORTER_OTLP_LOGS_ENDPOINT'))
                if env_is_object and foreign == ['OTEL_EXPORTER_OTLP_LOGS_ENDPOINT']
                else None
            )
            if stray_port is not None and stray_port != port:
                # S-all-338: a lone endpoint shaped like ours is most likely
                # left over from an earlier install, not a policy of the user's.
                print(
                    "  ⚠️  Claude settings set OTEL_EXPORTER_OTLP_LOGS_ENDPOINT="
                    f"{env['OTEL_EXPORTER_OTLP_LOGS_ENDPOINT']}, which is not "
                    f"Uclusion's receiver (port {port}), so usage will be read "
                    "from the transcript. Remove that key and run "
                    "`uclusion update` again to use OpenTelemetry instead."
                )
            else:
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


HOME_PROJECT_MCP_JSON_PATH = os.path.join(USER_HOME, '.mcp.json')
HOME_PROJECT_CLAUDE_SETTINGS_PATH = os.path.join(
    USER_HOME, '.claude', 'settings.local.json'
)


def is_home_directory(path):
    """S-all-338: whether ``path`` is the user's home directory."""
    return os.path.realpath(path) == os.path.realpath(USER_HOME)


def project_dir_or_global(project_dir):
    """A project install in the home directory is the global install.

    The home directory's project paths are the global ones, or sit beside them
    where Claude Code prefers them: its skills are the global skills, while
    ~/.mcp.json and ~/.claude/settings.local.json would add a second
    registration and a second token-audit setup (S-all-338, Q-all-783).
    """
    if project_dir is not None and is_home_directory(project_dir):
        print(f"ℹ️  {project_dir} is your home directory, so this is the "
              "global install.")
        return None
    return project_dir


def _loopback_logs_port(value):
    """The port of a localhost OTel logs endpoint of the form Uclusion writes."""
    if not isinstance(value, str):
        return None
    match = re.fullmatch(r'http://127\.0\.0\.1:(\d+)/v1/logs', value)
    return int(match.group(1)) if match else None


def _remove_home_project_registration():
    """Drop the Uclusion server from ~/.mcp.json, and the file if that empties it."""
    path = HOME_PROJECT_MCP_JSON_PATH
    target = _config_write_target(path)
    existing, signature = _read_text_snapshot(target)
    if signature is None or not existing.strip():
        return None
    try:
        config = json.loads(existing)
    except json.JSONDecodeError:
        return None
    servers = config.get('mcpServers') if isinstance(config, dict) else None
    if not isinstance(servers, dict) or MCP_SERVER_KEY not in servers:
        return None
    del servers[MCP_SERVER_KEY]
    if not servers:
        config.pop('mcpServers', None)
    if not config:
        os.remove(path)
        return f'{path}, which held only the Uclusion MCP server'
    updated = json.dumps(config, indent=2) + '\n'
    with config_file_lock(path):
        atomic_write_text(path, updated, existing, target, signature)
    return f'the Uclusion MCP server from {path}'


def _remove_home_project_token_audit():
    """Drop Uclusion's audit hooks and exactly matching telemetry values."""
    path = HOME_PROJECT_CLAUDE_SETTINGS_PATH
    target = _config_write_target(path)
    existing, signature = _read_text_snapshot(target)
    if signature is None or not existing.strip():
        return None
    try:
        config = json.loads(existing)
    except json.JSONDecodeError:
        return None
    if not isinstance(config, dict):
        return None
    changed = False
    hooks = config.get('hooks')
    if isinstance(hooks, dict):
        before = json.dumps(hooks, sort_keys=True)
        _remove_claude_token_audit_hooks(hooks)
        if json.dumps(hooks, sort_keys=True) != before:
            changed = True
            if not hooks:
                config.pop('hooks', None)
    env = config.get('env')
    if isinstance(env, dict):
        port = _loopback_logs_port(env.get('OTEL_EXPORTER_OTLP_LOGS_ENDPOINT'))
        owned = claude_token_audit_env(port) if port is not None else {}
        # Only a complete, unedited copy of what Uclusion writes is Uclusion's.
        if owned and all(env.get(key) == value for key, value in owned.items()):
            for key in owned:
                env.pop(key, None)
            changed = True
            if not env:
                config.pop('env', None)
    if not changed:
        return None
    updated = json.dumps(config, indent=2) + '\n'
    with config_file_lock(path):
        atomic_write_text(path, updated, existing, target, signature)
    return f"Uclusion's token-audit hooks and telemetry settings from {path}"


def remove_home_project_leftovers():
    """Remove what a project install in the home directory added beside the global one."""
    removed = [
        outcome for outcome in (
            _remove_home_project_registration(),
            _remove_home_project_token_audit(),
        ) if outcome is not None
    ]
    for outcome in removed:
        print(f"  🧹 Removed {outcome}, left by a project install in your home "
              "directory. The global install covers it.")
    return removed


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
    return project_dir_or_global(os.path.abspath(os.path.expanduser(path)))


def validate_workflow_bundle(bundle):
    """Validate every resident stub and both portable skills as one unit."""
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

    for key, name, marker, end_marker in (
        ('skill', 'uclusion', SKILL_MARKER, SKILL_END_MARKER),
        (
            'design_skill', DESIGN_SKILL_NAME,
            DESIGN_SKILL_MARKER, DESIGN_SKILL_END_MARKER,
        ),
    ):
        skill = bundle[key]
        if (
            not skill.startswith('---\n')
            or f'\nname: {name}\n' not in skill
            or '\ndescription:' not in skill
            or skill.count(marker) != 1
            or skill.count(end_marker) != 1
            or skill.find(marker) > skill.find(end_marker)
            or not skill.rstrip().endswith(end_marker)
        ):
            raise RuntimeError(
                f'workflow asset {key} has invalid frontmatter or markers'
            )
        if len(skill.splitlines()) > 500:
            raise RuntimeError(
                f'workflow asset {key} exceeds the 500-line entrypoint budget'
            )

    for key, relative_path in SKILL_PACKAGE_ASSETS:
        if os.path.dirname(relative_path) != 'references':
            continue
        reference = bundle[key]
        if (
            reference.count(SKILL_REFERENCE_MARKER) != 1
            or reference.count(SKILL_REFERENCE_END_MARKER) != 1
            or not reference.rstrip().endswith(SKILL_REFERENCE_END_MARKER)
        ):
            raise RuntimeError(
                f'workflow asset {key} has invalid reference markers'
            )

    design_examples = bundle['design_examples']
    if (
        design_examples.count(DESIGN_SKILL_REFERENCE_MARKER) != 1
        or design_examples.count(DESIGN_SKILL_REFERENCE_END_MARKER) != 1
        or design_examples.find(DESIGN_SKILL_REFERENCE_MARKER)
        > design_examples.find(DESIGN_SKILL_REFERENCE_END_MARKER)
        or not design_examples.rstrip().endswith(
            DESIGN_SKILL_REFERENCE_END_MARKER
        )
    ):
        raise RuntimeError(
            'workflow asset design_examples has invalid reference markers'
        )

    metadata = bundle['openai_metadata']
    if (
        'display_name: "Uclusion"' not in metadata
        or '$uclusion' not in metadata
        or 'allow_implicit_invocation: true' not in metadata
    ):
        raise RuntimeError('agents/openai.yaml has invalid Uclusion metadata')

    design_metadata = bundle['design_openai_metadata']
    if (
        'display_name: "Uclusion Design"' not in design_metadata
        or '$uclusion-design' not in design_metadata
        or 'allow_implicit_invocation: true' not in design_metadata
    ):
        raise RuntimeError(
            'agents/openai.yaml has invalid Uclusion Design metadata'
        )


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


def _skill_package_definition(package):
    if package == 'uclusion':
        return SKILL_PACKAGE_ASSETS, SKILL_MARKER, SKILL_END_MARKER
    if package == DESIGN_SKILL_NAME:
        return (
            DESIGN_SKILL_PACKAGE_ASSETS,
            DESIGN_SKILL_MARKER,
            DESIGN_SKILL_END_MARKER,
        )
    raise ValueError(f'unsupported Uclusion skill package: {package}')


def _validate_owned_skill(skill_dir, package='uclusion'):
    """Validate a managed package while permitting safe extra files."""
    package_assets, marker, end_marker = _skill_package_definition(package)
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
        content.count(marker) != 1
        or content.count(end_marker) != 1
        or content.find(marker) > content.find(end_marker)
    ):
        raise RuntimeError(
            f'{skill_path} is not a Uclusion-managed skill; '
            'refusing to overwrite it'
        )

    for _asset_key, relative_path in package_assets:
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


def _rollback_skill_transaction(
    skill_dir, transaction=None, package='uclusion'
):
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
        _validate_owned_skill(backup_dir, package)
        if os.path.lexists(skill_dir):
            _validate_owned_skill(skill_dir, package)
            _remove_installer_tree(skill_dir)
        os.replace(backup_dir, skill_dir)
        _fsync_directory(os.path.dirname(skill_dir))
    elif had_existing:
        if not os.path.lexists(skill_dir):
            raise RuntimeError(
                f'workflow transaction lost both {skill_dir} and its backup'
            )
        _validate_owned_skill(skill_dir, package)
    elif os.path.lexists(skill_dir):
        _validate_owned_skill(skill_dir, package)
        _remove_installer_tree(skill_dir)

    if os.path.lexists(staging_dir):
        _remove_installer_tree(staging_dir)
    os.remove(transaction_path)
    _fsync_directory(os.path.dirname(skill_dir))


def _recover_skill_transaction(skill_dir, package='uclusion'):
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
                _validate_owned_skill(staging_dir, package)
                os.replace(staging_dir, skill_dir)
                _fsync_directory(os.path.dirname(skill_dir))
            else:
                raise RuntimeError(
                    f'interrupted workflow transaction published its resident '
                    f'but has no new package at {skill_dir}'
                )
        _validate_owned_skill(skill_dir, package)
        if os.path.lexists(staging_dir):
            _remove_installer_tree(staging_dir)
        if os.path.lexists(backup_dir):
            _remove_installer_tree(backup_dir)
        os.remove(transaction_path)
        _fsync_directory(os.path.dirname(skill_dir))
        return

    _rollback_skill_transaction(skill_dir, transaction, package)


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


def _stage_skill_package(
    skill_dir, staging_dir, bundle, package='uclusion'
):
    package_assets = _skill_package_definition(package)[0]
    if os.path.lexists(skill_dir):
        # Preserve a raced-in link as a link so validation rejects it; never
        # follow it and copy data from outside the managed package.
        shutil.copytree(skill_dir, staging_dir, symlinks=True)
    else:
        os.mkdir(staging_dir, 0o700)
    for asset_key, relative_path in package_assets:
        _write_staged_asset(staging_dir, relative_path, bundle[asset_key])
    _validate_owned_skill(staging_dir, package)
    _fsync_skill_tree(staging_dir)
    _fsync_directory(os.path.dirname(staging_dir))


def _begin_skill_transaction(
    skill_dir,
    bundle,
    resident_target,
    resident_before_digest,
    resident_after_digest,
    resident_before_signature,
    package='uclusion',
):
    skill_dir, staging_dir, backup_dir, transaction_path = (
        _skill_transaction_paths(skill_dir)
    )
    _recover_skill_transaction(skill_dir, package)
    had_existing = _validate_owned_skill(skill_dir, package)
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
        _stage_skill_package(skill_dir, staging_dir, bundle, package)
    except Exception:
        _rollback_skill_transaction(skill_dir, package=package)
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
    """Install both native skills, then shrink the resident instructions.

    The complete bundle is fetched and validated before the first write. The
    two managed packages are staged before either is published. Both directory
    swaps and the resident write form one recoverable release transaction.
    Existing unmarked packages, links, special files, and resident Cursor rules
    are user-owned collisions.
    """
    if client not in CLIENT_STUB_ASSET:
        raise ValueError(f'unsupported workflow client: {client}')
    if require_dir is not None and not os.path.isdir(require_dir):
        print(f"ℹ️  No {require_dir} found; skipping {client_label} workflow.")
        return False
    design_skill_dir = os.path.join(
        os.path.dirname(os.path.abspath(os.path.expanduser(skill_dir))),
        DESIGN_SKILL_NAME,
    )
    with install_lock():
        _recover_skill_transaction(skill_dir)
        _recover_skill_transaction(design_skill_dir, DESIGN_SKILL_NAME)
        _validate_owned_skill(design_skill_dir, DESIGN_SKILL_NAME)
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
                f"  Install Uclusion skills and {action} the {client_label} "
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
        cli_command = workflow_cli_command(environment)
        if cli_command is not None:
            rendered_stub = rendered_stub.replace(
                WORKFLOW_ENV_PLACEHOLDER, cli_command
            )
        resident_content = _resident_update(
            existing, rendered_stub, client, resident_path
        )

        resident_before_digest = _resident_state_digest(
            existing, resident_signature
        )
        resident_after_digest = hashlib.sha256(
            resident_content.encode('utf-8')
        ).hexdigest()
        design_transaction = _begin_skill_transaction(
            design_skill_dir,
            bundle,
            resident_target,
            resident_before_digest,
            resident_after_digest,
            resident_signature,
            DESIGN_SKILL_NAME,
        )
        try:
            core_transaction = _begin_skill_transaction(
                skill_dir,
                bundle,
                resident_target,
                resident_before_digest,
                resident_after_digest,
                resident_signature,
            )
        except Exception:
            _rollback_skill_transaction(
                design_skill_dir, package=DESIGN_SKILL_NAME
            )
            raise

        normalized_design_dir, design_staging, design_backup = (
            design_transaction[:3]
        )
        design_had_existing = design_transaction[4]
        normalized_skill_dir, staging_dir, backup_dir = core_transaction[:3]
        had_existing = core_transaction[4]
        try:
            _swap_staged_skill(
                normalized_design_dir,
                design_staging,
                design_backup,
                design_had_existing,
            )
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
            # packages must be restored even if an editor concurrently changed
            # unrelated resident text to a third journal hash.
            try:
                _rollback_skill_transaction(normalized_skill_dir)
            except Exception as rollback_error:
                raise RuntimeError(
                    'failed to restore the prior core Uclusion skill; the '
                    'matching design skill was retained for safe recovery'
                ) from rollback_error
            try:
                _rollback_skill_transaction(
                    normalized_design_dir, package=DESIGN_SKILL_NAME
                )
            except Exception as rollback_error:
                raise RuntimeError(
                    'restored the prior core Uclusion skill but could not '
                    'restore its design sibling'
                ) from rollback_error
            raise
        _commit_skill_transaction(normalized_skill_dir)
        _commit_skill_transaction(normalized_design_dir)

    print(
        f"  ✅ Installed Uclusion skills for {client_label} at "
        f"{skill_dir} and {design_skill_dir}"
    )
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


def response_stats_path(value):
    if not value.strip():
        raise argparse.ArgumentTypeError('response statistics require a nonblank file path')
    return os.path.abspath(os.path.expanduser(value))


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
        help='Uclusion workspaceId, "setup" for account setup, or "demo" to try Uclusion.',
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
    response_stats_group = parser.add_mutually_exclusive_group()
    response_stats_group.add_argument(
        '--response-stats',
        type=response_stats_path,
        metavar='PATH',
        help='Record local MCP response sizes for Claude in this JSONL file '
             'starting with its next connection.',
    )
    response_stats_group.add_argument(
        '--no-response-stats',
        dest='response_stats',
        action='store_const',
        const=False,
        help='Disable Claude MCP response-size recording on its next connection.',
    )
    parser.set_defaults(response_stats=None)
    parser.add_argument(
        '--model',
        help='Demo mode only, and required there: the model both demo sessions '
             'run at, as the person running the demo chose it.',
    )
    parser.add_argument(
        '--effort',
        help='Demo mode only, and required there: the effort level both demo '
             'sessions run at, as the person running the demo chose it.',
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help='Change token audit or work claims on an existing install without '
             'prompting. A plain upgrade still does not prompt.',
    )
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


def _install_temporary_registration(descriptor, client, project_dir, expected):
    """Write a bootstrap descriptor only over the state checked by its caller."""
    path, label, is_codex = _setup_registration_target(client, project_dir)
    if is_codex:
        return register_codex_descriptor(
            descriptor,
            config_path=path,
            expected_descriptor=expected,
        )
    return register_mcp_json(
        path,
        f'{label} bootstrap',
        None,
        None,
        require_existing=False,
        descriptor=descriptor,
        expected_descriptor=expected,
    )


def install_setup_registration(env, client, project_dir=None, *, expected=None):
    return _install_temporary_registration(
        setup_mcp_descriptor(env, client, project_dir), client, project_dir, expected,
    )


def bootstrap_registration_expected(env, client, project_dir):
    """Accept an empty slot or this environment's exact owned demo descriptor."""
    try:
        assert_setup_registration_absent(client, project_dir)
        return None
    except RuntimeError:
        expected = legacy_demo_mcp_descriptor(env)
        _assert_setup_registration_state(client, project_dir, expected)
        return expected


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
                   setup_receipt_path=None, response_stats=None):
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
    if (claude_selected and claude_detected
            and uclusion_home_root() != demo_home_path()):
        # A demo session carries its grant on --allowedTools instead, so there
        # is no rule left in the person's settings to take back out.
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
        if uclusion_home_root() == demo_home_path():
            # The demo registers nothing in the person's configuration. Both
            # of its sessions are started with --mcp-config naming this file,
            # which is also what keeps them clear of the per-project trust
            # prompt that a background session can never answer.
            register_mcp_json(
                demo_mcp_config_path(), "the demo's launch line", workspace_id,
                mcp_env, require_existing=False,
                token_audit=claude_registration_audit,
                token_audit_client='claude', work_claims=work_claims,
                response_stats=response_stats,
            )
        else:
            registered = register_mcp_json(
                CLAUDE_JSON_PATH, 'Claude Code', workspace_id, mcp_env,
                require_existing=interactive,
                token_audit=claude_registration_audit,
                token_audit_client='claude', work_claims=work_claims,
                response_stats=response_stats,
            )
            if registered:
                remove_home_project_leftovers()
    if claude_selected:
        if not claude_detected:
            workflow_results['claude'] = False
        else:
            try:
                if uclusion_home_root() == demo_home_path():
                    workflow_results['claude'] = install_demo_plugin(
                        fetch_bundle
                    )
                else:
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
                if uclusion_home_root() == demo_home_path():
                    workflow_results['codex'] = install_demo_codex_workflow(
                        fetch_bundle
                    )
                else:
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
    response_stats=None,
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
                token_audit_client='claude', work_claims=work_claims,
                response_stats=response_stats,
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
    if len(sys.argv) > 1 and sys.argv[1] == DEMO_REMOVE_MODE:
        try:
            return remove_demo_install(sys.argv[2:])
        except Exception as err:
            print(f'❌ Demo removal failed: {err}', file=sys.stderr)
            return 1
    if len(sys.argv) > 1 and sys.argv[1] == DEMO_PURGE_MODE:
        try:
            return purge_demo_home(sys.argv[2:])
        except Exception as err:
            print(f'❌ Demo removal failed: {err}', file=sys.stderr)
            return 1
    if len(sys.argv) > 1 and sys.argv[1] == DEMO_SUPERVISE_MODE:
        return supervise_demo(sys.argv[2:])
    parser = build_parser()
    args = parser.parse_args()
    env = args.environment
    workspace_id = args.workspace_id
    view_id = args.view_id
    mcp_env = None if env == 'production' else env

    bootstrap_mode = (
        workspace_id if workspace_id in ('setup', 'demo') else None
    )
    if bootstrap_mode != 'demo' and (args.model is not None or args.effort is not None):
        parser.error('--model and --effort only go with demo mode')
    if bootstrap_mode is not None:
        mode = bootstrap_mode
        if view_id is not None:
            parser.error(f'{mode} mode takes no workspace or view ID')
        if not args.clients:
            allowed = (
                'claude|codex' if mode == 'demo' else 'claude|cursor|codex'
            )
            parser.error(f'{mode} mode requires --clients <{allowed}>')
        clients = parse_clients(args.clients)
        if len(clients) != 1:
            parser.error(f'{mode} mode requires exactly one --clients value')
        if any((
            args.scripts_only,
            args.skip_scripts,
            args.replace_setup,
            args.setup_receipt is not None,
            args.token_audit is not None,
            args.work_claims is not None,
            # A demo may record its evaluator's response sizes; only a path
            # turns that on, so --no-response-stats has nothing to undo.
            args.response_stats is not None
            and not (mode == 'demo' and args.response_stats),
            args.force,
            args.script_version is not None,
        )):
            allowed = (
                '--clients, --model, --effort and optional --response-stats PATH'
                if mode == 'demo' else '--clients and optional --project'
            )
            parser.error(
                f'{mode} mode accepts only {allowed}'
            )
        if mode == 'demo' and args.project:
            parser.error(
                'demo mode always uses its disposable home and does not '
                'accept --project'
            )
        if mode == 'demo':
            missing = [
                option for option, value in (
                    ('--model', args.model), ('--effort', args.effort),
                ) if not (value or '').strip()
            ]
            if missing:
                parser.error(
                    'demo mode requires ' + ' and '.join(missing) + '. Ask the '
                    'person running the demo which model and effort level both '
                    'of its sessions should use: they pay for the run.'
                )
        try:
            setup_client = next(iter(clients))
            if mode == 'demo':
                # The person's agent reads this output while the command is
                # still running, often from a file once its client has moved
                # the command to the background; block buffering would hold
                # every line back until the evaluator had finished.
                if hasattr(sys.stdout, 'reconfigure'):
                    sys.stdout.reconfigure(line_buffering=True)
                if setup_client not in DEMO_CLIENTS:
                    raise RuntimeError(
                        'the demo requires Poke AI delivery through '
                        + ' or '.join(sorted(DEMO_CLIENTS))
                    )
                if setup_client == 'codex' and os.name == 'nt':
                    raise RuntimeError(
                        'the Codex demo needs a Unix receiver; use Claude Code '
                        'on this machine'
                    )
                # All Uclusion-owned files belong under /tmp. These paths are
                # constants resolved at import, so the first invocation has to
                # replace itself before it provisions or writes anything.
                reexec_in_demo_home()
                ready = provision_demo(env)
                write_demo_credentials(env, ready['client_id'])
                workspace_id = ready['workspace_id']
                view_id = ready['view_id']
                print(
                    '  ✅ Demo workspace ready: '
                    + ', '.join(ready.get('starting_job_short_codes', []))
                )
            else:
                project_dir = project_dir_or_global(
                    os.getcwd() if args.project else None
                )
                expected = bootstrap_registration_expected(
                    env, setup_client, project_dir
                )
                install_scripts(env, None, setup_bootstrap=True)
                install_setup_registration(
                    env, setup_client, project_dir, expected=expected
                )
        except Exception as err:
            print(f"❌ {mode.capitalize()} bootstrap failed: {err}")
            return 1
        if mode == 'setup':
            print(
                '🎉 Uclusion setup bootstrap complete. Restart or reconnect '
                'the selected client to load create_workspace and complete_setup.'
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
        requested_project_dir = project_dir_or_global(
            os.getcwd() if args.project else None
        )
        confirm_dir = requested_project_dir
        if not confirm_existing_feature_changes(
            args.force,
            env,
            confirm_dir,
            args.token_audit,
            args.work_claims,
        ):
            print('⏭  Existing install was left unchanged.')
            return 0
        if args.replace_setup:
            setup_project_dir = requested_project_dir
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
            project_dir = requested_project_dir
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
                # The demo's shared registration is the owner's; statistics
                # belong to the evaluator's own launch configuration.
                response_stats=(
                    None if bootstrap_mode == 'demo' else args.response_stats
                ),
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
                response_stats=args.response_stats,
            )
    except subprocess.CalledProcessError as err:
        print(f"❌ Command failed: {err}")
        return 1
    except Exception as err:
        print(f"❌ Installation failed: {err}")
        return 1

    if bootstrap_mode == 'demo':
        start_prompt = (
            f"Start {ready['starting_job_short_codes'][0]}."
        )
        print(
            f'🎉 Uclusion demo is ready under {uclusion_home_root()}.'
        )
        reset_demo_progress(env)
        if os.environ.get('UCLUSION_DEMO_INSTALL_ONLY'):
            print(
                '⏹  Installed only: UCLUSION_DEMO_INSTALL_ONLY is set, so '
                'the owner and the evaluator were not started.'
            )
            return 0
        if args.response_stats:
            print(
                '📊 The evaluating agent\'s MCP response sizes will be '
                f'appended to {args.response_stats}; the owner\'s are not '
                'recorded.'
            )
        try:
            return start_demo_supervisor(
                env, setup_client, workspace_id, start_prompt,
                response_stats=args.response_stats,
                model=args.model.strip(), effort=args.effort.strip(),
            )
        except OSError as error:
            print(f'❌ Could not start the demo: {error}')
            return 1
    else:
        print("🎉 Uclusion install complete.")
    return 0


if __name__ == '__main__':
    sys.exit(main())
