#!/usr/bin/python3
"""Install the Uclusion CLI and MCP Proxy scripts and configure them.

Downloads ``uclusionCLI.py`` and ``uclusionMCPProxy.py`` from the Uclusion site
(environment-specific) into a versioned install directory under ``~/.local`` and
exposes them on ``PATH`` via symlinks in ``~/.local/bin`` (the same user-local
bin Claude and Codex install into). The install is always user-local, so it
never needs root or sudo.

The CLI file is named ``uclusion.py`` in the install directory and is exposed
on ``PATH`` via a ``uclusion`` symlink, so users invoke it simply as
``uclusion`` rather than the legacy ``uclusionCLI.py`` filename.

The installer then asks whether to configure Uclusion globally (the default) or
at the project level:

* Global writes a workspace config to ``~/.uclusion/uclusion.json`` and registers
  the Uclusion MCP server in ``~/.cursor/mcp.json`` and ``~/.claude.json`` if
  those files already exist, and in ``~/.codex/config.toml`` if the ``~/.codex``
  directory exists (Codex treats ``config.toml`` as optional, so directory
  presence — not file presence — is the install signal).
* Project level writes everything into a directory the user supplies: the
  workspace config (``uclusion.json``), project-scoped MCP registrations
  (``.mcp.json`` for Claude Code, ``.cursor/mcp.json`` for Cursor), and the
  workflow docs (``CLAUDE.md``, ``.cursor/rules/uclusion.mdc``, ``AGENTS.md``).
  The CLI binaries themselves always stay user-global under ``~/.local``.
"""
import argparse
import json
import os
import shutil
import stat
import subprocess
import sys
import tempfile
import urllib.request


LOCAL_PREFIX = os.path.join(os.path.expanduser('~'), '.local')
SCRIPT_INSTALL_PREFIX = os.path.join(LOCAL_PREFIX, 'uclusion-cli')
SCRIPT_INSTALL_VERSION = 'v1'
SCRIPT_INSTALL_DIR = os.path.join(
    SCRIPT_INSTALL_PREFIX, SCRIPT_INSTALL_VERSION, 'current', 'bin'
)
# Symlinks land in ~/.local/bin (where Claude and Codex install too), so the
# install is always user-writable and never needs root or sudo.
SYMLINK_DIR = os.path.join(LOCAL_PREFIX, 'bin')

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
)

UCLUSION_HOME = os.path.join(os.path.expanduser('~'), '.uclusion')
UCLUSION_CONFIG_PATH = os.path.join(UCLUSION_HOME, 'uclusion.json')
CURSOR_MCP_PATH = os.path.join(os.path.expanduser('~'), '.cursor', 'mcp.json')
CLAUDE_JSON_PATH = os.path.join(os.path.expanduser('~'), '.claude.json')
CLAUDE_MD_PATH = os.path.join(os.path.expanduser('~'), '.claude', 'CLAUDE.md')
CLAUDE_MD_MARKER = '<!-- uclusion-workflow:v1 -->'
CLAUDE_MD_END_MARKER = '<!-- /uclusion-workflow:v1 -->'
CURSOR_MDC_PATH = os.path.join(os.path.expanduser('~'), '.cursor', 'rules', 'uclusion.mdc')
CURSOR_MDC_FRONTMATTER = (
    '---\n'
    'description: Uclusion job workflow — invoke when working on a Uclusion '
    'job/task/bug short code (J-*, T-*, B-*)\n'
    'alwaysApply: false\n'
    '---\n'
)
MCP_PROXY_SYMLINK_PATH = os.path.join(SYMLINK_DIR, 'uclusionMCPProxy.py')
CODEX_HOME = os.path.join(os.path.expanduser('~'), '.codex')
CODEX_CONFIG_PATH = os.path.join(CODEX_HOME, 'config.toml')
CODEX_AGENTS_MD_PATH = os.path.join(CODEX_HOME, 'AGENTS.md')
# The MCP table we manage in config.toml is delimited by TOML comment markers so
# reruns can replace it in place without disturbing the user's other settings.
CODEX_CONFIG_MARKER = '# uclusion-mcp:v1'
CODEX_CONFIG_END_MARKER = '# /uclusion-mcp:v1'


def get_scripts_base_url(env):
    """Return the base URL the helper scripts can be downloaded from."""
    if env == 'dev':
        return f'https://localhost:3000/scripts/'
    if env in ('stage', 'production'):
        return f'https://{env}.uclusion.com/scripts/'
    return 'https://production.uclusion.com/scripts/'


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


def create_symlink(target, link_path):
    """Create or replace a symlink at ``link_path`` pointing to ``target``."""
    if os.path.lexists(link_path):
        os.remove(link_path)
    os.symlink(target, link_path)


def warn_if_not_on_path(directory):
    """Print a hint if ``directory`` is not on ``PATH`` so symlinks aren't found."""
    target = os.path.normpath(directory)
    entries = [os.path.normpath(p) for p in os.environ.get('PATH', '').split(os.pathsep) if p]
    if target in entries:
        return
    print(f"  ⚠️  {directory} is not on your PATH; the 'uclusion' command won't be found.")
    print(f"      Add it, e.g.:  export PATH=\"{directory}:$PATH\"")


def install_scripts(env):
    base_url = get_scripts_base_url(env)
    print(f"📦 Installing scripts from {base_url}")
    print(f"    install dir : {SCRIPT_INSTALL_DIR}")
    print(f"    symlink dir : {SYMLINK_DIR}")

    ensure_dir(SCRIPT_INSTALL_DIR)
    ensure_dir(SYMLINK_DIR)

    with tempfile.TemporaryDirectory() as tmp_dir:
        for source_name, installed_name, symlink_name in SCRIPT_FILES:
            url = base_url + source_name
            tmp_path = os.path.join(tmp_dir, installed_name)
            download_to(url, tmp_path)
            make_executable(tmp_path)

            install_path = os.path.join(SCRIPT_INSTALL_DIR, installed_name)
            install_file(tmp_path, install_path)
            print(f"  ✅ Installed {install_path}")

            symlink_path = os.path.join(SYMLINK_DIR, symlink_name)
            create_symlink(install_path, symlink_path)
            print(f"  🔗 Linked {symlink_path} -> {install_path}")

    warn_if_not_on_path(SYMLINK_DIR)


def write_uclusion_config(workspace_id, view_id, config_path):
    print(f"🗂  Writing workspace config to {config_path}")
    os.makedirs(os.path.dirname(config_path), exist_ok=True)
    config = {
        'workspaceId': workspace_id,
        'extensionsList': ['js', 'py'],
        'sourcesList': ['./src'],
        'uclusionMDFileType': 'report',
        'uclusionMDFilePath': 'uclusion.md',
    }
    if view_id is not None and view_id != workspace_id:
        config['todoViewId'] = view_id
    with open(config_path, 'w', encoding='utf-8') as out:
        json.dump(config, out, indent=2)
        out.write('\n')
    print(f"  ✅ Wrote {config_path}")


def register_mcp_json(path, label, workspace_id, env, require_existing):
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


def build_codex_mcp_block(workspace_id, env):
    """Return the marker-delimited ``[mcp_servers.Uclusion]`` table for config.toml.

    There is no TOML writer in the standard library (``tomllib`` only reads, and
    only on 3.11+), and the installer must run standalone via ``curl | bash`` with
    nothing but ``python3``. The table is fixed-shape, so we render the text from a
    template rather than parse-and-reserialize — which also preserves any comments
    and formatting the user has elsewhere in the file.
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
    lines.append(CODEX_CONFIG_END_MARKER)
    return '\n'.join(lines) + '\n'


def update_codex_config(workspace_id, env):
    """Register the Uclusion MCP server in ``~/.codex/config.toml``.

    Gated on the ``~/.codex`` directory rather than the file: Codex creates the
    directory on login but leaves ``config.toml`` optional, so requiring the file
    (as the Cursor/Claude paths do for their JSON) would skip most real users.
    Our table is appended at the end of the file behind comment markers and, on
    reruns, stripped and re-appended at the end so it never captures trailing
    keys the user added after it.
    """
    if not os.path.isdir(CODEX_HOME):
        print(f"ℹ️  No {CODEX_HOME} found; skipping Codex MCP server registration.")
        return

    print(f"🧩 Registering Uclusion MCP server in {CODEX_CONFIG_PATH}")
    existing = ''
    if os.path.exists(CODEX_CONFIG_PATH):
        try:
            with open(CODEX_CONFIG_PATH, 'r', encoding='utf-8') as src:
                existing = src.read()
        except OSError as err:
            print(f"  ❌ Could not read {CODEX_CONFIG_PATH}: {err}")
            return

    has_start = CODEX_CONFIG_MARKER in existing
    has_end = CODEX_CONFIG_END_MARKER in existing
    if has_start != has_end:
        which = 'start' if has_start else 'end'
        print(f"  ❌ {CODEX_CONFIG_PATH} has the Uclusion {which} marker but not its")
        print(f"      counterpart; refusing to modify. Remove the orphan marker and re-run.")
        return

    if not has_start and '[mcp_servers.Uclusion]' in existing:
        print(f"  ⏭  {CODEX_CONFIG_PATH} already defines [mcp_servers.Uclusion] outside the")
        print(f"      Uclusion markers; leaving it untouched to avoid a duplicate table.")
        return

    block = build_codex_mcp_block(workspace_id, env)

    if has_start:
        start_idx = existing.find(CODEX_CONFIG_MARKER)
        end_idx = existing.find(CODEX_CONFIG_END_MARKER, start_idx) + len(CODEX_CONFIG_END_MARKER)
        if end_idx < len(existing) and existing[end_idx] == '\n':
            end_idx += 1
        remainder = (existing[:start_idx] + existing[end_idx:]).rstrip()
        updated = (remainder + '\n\n' + block) if remainder else block
        verb = 'Refreshed Uclusion MCP server in'
    elif existing.strip():
        sep = '' if existing.endswith('\n') else '\n'
        updated = existing + sep + '\n' + block
        verb = 'Added Uclusion MCP server to'
    else:
        updated = block
        verb = 'Added Uclusion MCP server to'

    try:
        with open(CODEX_CONFIG_PATH, 'w', encoding='utf-8') as out:
            out.write(updated)
        print(f"  ✅ {verb} {CODEX_CONFIG_PATH}")
    except OSError as err:
        print(f"  ❌ Could not write {CODEX_CONFIG_PATH}: {err}")


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


def install_workflow_md(fetch_md, target_path, client_label, require_dir=None):
    """Install or refresh the Uclusion workflow block in ``target_path``.

    Used for both ``~/.claude/CLAUDE.md`` (Claude Code) and ``~/.codex/AGENTS.md``
    (Codex); both clients read a plain-Markdown instructions file and use the
    same delimited block so the workflow text never drifts between surfaces. The
    block is delimited by ``CLAUDE_MD_MARKER`` and ``CLAUDE_MD_END_MARKER`` so
    that on reruns we can replace it in place without disturbing anything the
    user appended afterwards. ``require_dir`` gates the install on a directory
    existing (Codex's ``~/.codex``) rather than on the target file. ``fetch_md``
    supplies the (shared, cached) CLAUDE.md content.
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

    if not prompt_yes_no(prompt, default=default_yes):
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


def install_cursor_mdc(fetch_md, target_path=CURSOR_MDC_PATH):
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

    if not prompt_yes_no(prompt, default=default_yes):
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
    return parser


def install_global(workspace_id, view_id, mcp_env, fetch_md):
    """Configure Uclusion in the user's home directory (the default)."""
    write_uclusion_config(workspace_id, view_id, UCLUSION_CONFIG_PATH)
    register_mcp_json(CURSOR_MCP_PATH, 'Cursor', workspace_id, mcp_env, require_existing=True)
    register_mcp_json(CLAUDE_JSON_PATH, 'Claude Code', workspace_id, mcp_env, require_existing=True)
    update_codex_config(workspace_id, mcp_env)
    install_workflow_md(fetch_md, CLAUDE_MD_PATH, 'Claude Code')
    install_cursor_mdc(fetch_md)
    install_workflow_md(fetch_md, CODEX_AGENTS_MD_PATH, 'Codex', require_dir=CODEX_HOME)


def install_project_level(workspace_id, view_id, mcp_env, fetch_md, project_dir):
    """Configure Uclusion inside ``project_dir`` instead of the home directory.

    Writes the workspace config and the project-scoped MCP registrations and
    workflow docs into the project. The CLI binaries stay user-global under
    ~/.local; only configuration becomes project-local. Codex has no per-project
    MCP config mechanism (its config.toml is global), so project mode registers
    only Codex's AGENTS.md workflow doc and leaves ~/.codex untouched.
    """
    print(f"📁 Project-level install into {project_dir}")
    os.makedirs(project_dir, exist_ok=True)

    write_uclusion_config(workspace_id, view_id, os.path.join(project_dir, 'uclusion.json'))
    register_mcp_json(os.path.join(project_dir, '.mcp.json'),
                      'Claude Code (project)', workspace_id, mcp_env, require_existing=False)
    register_mcp_json(os.path.join(project_dir, '.cursor', 'mcp.json'),
                      'Cursor (project)', workspace_id, mcp_env, require_existing=False)
    install_workflow_md(fetch_md, os.path.join(project_dir, 'CLAUDE.md'), 'Claude Code (project)')
    install_cursor_mdc(fetch_md, os.path.join(project_dir, '.cursor', 'rules', 'uclusion.mdc'))
    install_workflow_md(fetch_md, os.path.join(project_dir, 'AGENTS.md'), 'Codex (project)')


def main():
    args = build_parser().parse_args()
    env = args.environment
    workspace_id = args.workspace_id
    view_id = args.view_id
    mcp_env = None if env == 'production' else env

    try:
        install_scripts(env)
        project_dir = prompt_install_scope()
        fetch_md = make_workflow_md_fetcher(env)
        if project_dir is None:
            install_global(workspace_id, view_id, mcp_env, fetch_md)
        else:
            install_project_level(workspace_id, view_id, mcp_env, fetch_md, project_dir)
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
