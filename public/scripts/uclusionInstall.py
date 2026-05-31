#!/usr/bin/python3
"""Install the Uclusion CLI and MCP Proxy scripts and configure them.

Downloads ``uclusionCLI.py`` and ``uclusionMCPProxy.py`` from the Uclusion site
(environment-specific) into a versioned install directory and exposes them on
``PATH`` via symlinks in ``/usr/local/bin``, mirroring how the AWS CLI is laid
out (``/usr/local/bin/aws -> /usr/local/aws-cli/v2/current/bin/aws``).

The CLI file is named ``uclusion.py`` in the install directory and is exposed
on ``PATH`` via a ``uclusion`` symlink, so users invoke it simply as
``uclusion`` rather than the legacy ``uclusionCLI.py`` filename.

Also writes a workspace config to ``~/.uclusion/uclusion.json`` and registers
the Uclusion MCP server in ``~/.cursor/mcp.json`` and ``~/.claude.json`` if
those files already exist, and in ``~/.codex/config.toml`` if the ``~/.codex``
directory exists (Codex treats ``config.toml`` as optional, so directory
presence — not file presence — is the install signal).
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


SCRIPT_INSTALL_PREFIX = '/usr/local/uclusion-cli'
SCRIPT_INSTALL_VERSION = 'v1'
SCRIPT_INSTALL_DIR = os.path.join(
    SCRIPT_INSTALL_PREFIX, SCRIPT_INSTALL_VERSION, 'current', 'bin'
)
SYMLINK_DIR = '/usr/local/bin'

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


def ensure_dir_with_sudo_if_needed(path):
    """Create ``path`` (and parents) world-readable, escalating to sudo on EACCES."""
    try:
        os.makedirs(path, exist_ok=True)
        return
    except PermissionError:
        pass

    print(f"  🔐 Need elevated permissions to create {path}; using sudo.")
    subprocess.run(['sudo', 'install', '-d', '-m', '0755', path], check=True)


def install_file_with_sudo_if_needed(src_path, dest_path):
    """Move ``src_path`` to ``dest_path``, falling back to ``sudo`` on EACCES."""
    try:
        shutil.move(src_path, dest_path)
        make_executable(dest_path)
        return
    except PermissionError:
        pass

    print(f"  🔐 Need elevated permissions to write {dest_path}; using sudo.")
    subprocess.run(['sudo', 'install', '-m', '0755', src_path, dest_path], check=True)
    try:
        os.remove(src_path)
    except OSError:
        pass


def create_symlink_with_sudo_if_needed(target, link_path):
    """Create or replace a symlink at ``link_path`` pointing to ``target``."""
    try:
        if os.path.lexists(link_path):
            os.remove(link_path)
        os.symlink(target, link_path)
        return
    except PermissionError:
        pass

    print(f"  🔐 Need elevated permissions to write {link_path}; using sudo.")
    subprocess.run(['sudo', 'ln', '-sfn', target, link_path], check=True)


def install_scripts(env):
    base_url = get_scripts_base_url(env)
    print(f"📦 Installing scripts from {base_url}")
    print(f"    install dir : {SCRIPT_INSTALL_DIR}")
    print(f"    symlink dir : {SYMLINK_DIR}")

    ensure_dir_with_sudo_if_needed(SCRIPT_INSTALL_DIR)

    with tempfile.TemporaryDirectory() as tmp_dir:
        for source_name, installed_name, symlink_name in SCRIPT_FILES:
            url = base_url + source_name
            tmp_path = os.path.join(tmp_dir, installed_name)
            download_to(url, tmp_path)
            make_executable(tmp_path)

            install_path = os.path.join(SCRIPT_INSTALL_DIR, installed_name)
            install_file_with_sudo_if_needed(tmp_path, install_path)
            print(f"  ✅ Installed {install_path}")

            symlink_path = os.path.join(SYMLINK_DIR, symlink_name)
            create_symlink_with_sudo_if_needed(install_path, symlink_path)
            print(f"  🔗 Linked {symlink_path} -> {install_path}")


def write_uclusion_config(workspace_id, view_id):
    print(f"🗂  Writing workspace config to {UCLUSION_CONFIG_PATH}")
    os.makedirs(UCLUSION_HOME, exist_ok=True)
    config = {
        'workspaceId': workspace_id,
        'extensionsList': ['js', 'py'],
        'sourcesList': ['./src'],
        'uclusionMDFileType': 'report',
        'uclusionMDFilePath': 'uclusion.md',
    }
    if view_id is not None and view_id != workspace_id:
        config['todoViewId'] = view_id
    with open(UCLUSION_CONFIG_PATH, 'w', encoding='utf-8') as out:
        json.dump(config, out, indent=2)
        out.write('\n')
    print(f"  ✅ Wrote {UCLUSION_CONFIG_PATH}")


def update_cursor_mcp(workspace_id, env):
    if not os.path.exists(CURSOR_MCP_PATH):
        print(f"ℹ️  No {CURSOR_MCP_PATH} found; skipping MCP server registration.")
        return

    print(f"🧩 Registering Uclusion MCP server in {CURSOR_MCP_PATH}")
    try:
        with open(CURSOR_MCP_PATH, 'r', encoding='utf-8') as src:
            mcp_config = json.load(src)
    except json.JSONDecodeError as err:
        print(f"  ❌ {CURSOR_MCP_PATH} is not valid JSON: {err}")
        return

    if not isinstance(mcp_config, dict):
        print(f"  ❌ {CURSOR_MCP_PATH} top-level value must be a JSON object.")
        return

    args = [MCP_PROXY_SYMLINK_PATH, workspace_id]
    if env is not None:
        args.append(env)

    servers = mcp_config.setdefault('mcpServers', {})
    if not isinstance(servers, dict):
        print(f"  ❌ 'mcpServers' in {CURSOR_MCP_PATH} must be a JSON object.")
        return

    servers['Uclusion'] = {
        'command': 'python3',
        'args': args,
    }

    with open(CURSOR_MCP_PATH, 'w', encoding='utf-8') as out:
        json.dump(mcp_config, out, indent=2)
        out.write('\n')
    print(f"  ✅ Updated {CURSOR_MCP_PATH}")


def update_claude_json_mcp(workspace_id, env):
    if not os.path.exists(CLAUDE_JSON_PATH):
        print(f"ℹ️  No {CLAUDE_JSON_PATH} found; skipping Claude Code MCP server registration.")
        return

    print(f"🧩 Registering Uclusion MCP server in {CLAUDE_JSON_PATH}")
    try:
        with open(CLAUDE_JSON_PATH, 'r', encoding='utf-8') as src:
            claude_config = json.load(src)
    except json.JSONDecodeError as err:
        print(f"  ❌ {CLAUDE_JSON_PATH} is not valid JSON: {err}")
        return

    if not isinstance(claude_config, dict):
        print(f"  ❌ {CLAUDE_JSON_PATH} top-level value must be a JSON object.")
        return

    args = [MCP_PROXY_SYMLINK_PATH, workspace_id]
    if env is not None:
        args.append(env)

    servers = claude_config.setdefault('mcpServers', {})
    if not isinstance(servers, dict):
        print(f"  ❌ 'mcpServers' in {CLAUDE_JSON_PATH} must be a JSON object.")
        return

    servers['Uclusion'] = {
        'command': 'python3',
        'args': args,
    }

    with open(CLAUDE_JSON_PATH, 'w', encoding='utf-8') as out:
        json.dump(claude_config, out, indent=2)
        out.write('\n')
    print(f"  ✅ Updated {CLAUDE_JSON_PATH}")


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


def prompt_yes_no(question):
    """Prompt for a y/N answer; return True only on explicit yes.

    Reads from /dev/tty so the prompt still works when the installer is run via
    ``curl ... | bash`` (in which case stdin is the pipe, not the terminal).
    Uses separate read/write handles to avoid buffering quirks that can make a
    shared ``r+`` handle return EOF on the first ``readline`` call.
    """
    prompt = f"{question} [y/N] "
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
            return False

    if not answer:
        return False
    return answer.strip().lower() in ('y', 'yes')


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
    elif exists:
        print(f"📝 Found existing {target_path}")
        action = 'append'
        prompt = f"  Append Uclusion job workflow to {target_path}?"
    else:
        print(f"📝 No {target_path} found.")
        action = 'create'
        prompt = f"  Create {target_path} with Uclusion job workflow?"

    if not prompt_yes_no(prompt):
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


def install_cursor_mdc(fetch_md):
    """Install or refresh ~/.cursor/rules/uclusion.mdc as a Cursor rule.

    The body of the rule is the same workflow markdown that lands in
    CLAUDE.md — we take the (shared, cached) CLAUDE.md content, strip the
    install markers, prepend a description-based Cursor frontmatter, and write
    the result. Keeping CLAUDE.md as the single source of truth means the two
    surfaces never drift.
    """
    exists = os.path.exists(CURSOR_MDC_PATH)
    if exists:
        print(f"📝 Found existing {CURSOR_MDC_PATH}")
        prompt = f"  Refresh Uclusion Cursor rule at {CURSOR_MDC_PATH}?"
        verb = 'Refreshed'
    else:
        print(f"📝 No {CURSOR_MDC_PATH} found.")
        prompt = f"  Create {CURSOR_MDC_PATH} with Uclusion job workflow?"
        verb = 'Wrote'

    if not prompt_yes_no(prompt):
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
        os.makedirs(os.path.dirname(CURSOR_MDC_PATH), exist_ok=True)
        with open(CURSOR_MDC_PATH, 'w', encoding='utf-8') as out:
            out.write(mdc_content)
        print(f"  ✅ {verb} {CURSOR_MDC_PATH}")
    except OSError as err:
        print(f"  ❌ Could not write {CURSOR_MDC_PATH}: {err}")


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


def main():
    args = build_parser().parse_args()
    env = args.environment
    workspace_id = args.workspace_id
    view_id = args.view_id

    try:
        install_scripts(env)
        write_uclusion_config(workspace_id, view_id)
        mcp_env = None if env == 'production' else env
        update_cursor_mcp(workspace_id, mcp_env)
        update_claude_json_mcp(workspace_id, mcp_env)
        update_codex_config(workspace_id, mcp_env)
        fetch_md = make_workflow_md_fetcher(env)
        install_workflow_md(fetch_md, CLAUDE_MD_PATH, 'Claude Code')
        install_cursor_mdc(fetch_md)
        install_workflow_md(fetch_md, CODEX_AGENTS_MD_PATH, 'Codex', require_dir=CODEX_HOME)
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
