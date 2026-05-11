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
the Uclusion MCP server in ``~/.cursor/mcp.json`` if that file already exists.
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
MCP_PROXY_SYMLINK_PATH = os.path.join(SYMLINK_DIR, 'uclusionMCPProxy.py')


def get_scripts_base_url(env):
    """Return the base URL the helper scripts can be downloaded from."""
    if env == 'dev':
        return f'https://localhost:3000/scripts/'
    if env in ('stage', 'production'):
        return f'https://{env}.uclusion.com/scripts/'
    return 'https://production.uclusion.com/scripts/'


def download_to(url, dest_path):
    print(f"  ⬇️  Downloading {url}")
    with urllib.request.urlopen(url) as response:
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
