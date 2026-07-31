#!/usr/bin/python3
"""Cursor ``stop`` hook: drain pending Uclusion Pokes into a follow-up turn.

Configured by ``uclusionInstall`` in ``~/.cursor/hooks.json`` (global) or
``<project>/.cursor/hooks.json`` (project). On each completed agent turn it runs
``uclusion wait --timeout 0`` and, when lines are claimed, returns them as
``followup_message`` so Cursor auto-submits the next user message.

This covers Pokes that arrived *during* a turn. It does not wake a fully idle
chat — drain-at-turn-start remains required for that case (S-all-192 / O-1).
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys

UCLUSION_BIN_DIR = os.path.join(os.path.expanduser('~'), '.local', 'bin')
DEFAULT_UCLUSION = os.path.join(UCLUSION_BIN_DIR, 'uclusion')
HOOK_TIMEOUT_SECONDS = 30


def _read_payload():
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, OSError, UnicodeDecodeError):
        return {}
    return payload if isinstance(payload, dict) else {}


def _mcp_environment_from_path(path):
    """Return stage/dev when Uclusion MCP args name that env; else None."""
    try:
        with open(path, 'r', encoding='utf-8') as src:
            config = json.load(src)
    except (OSError, json.JSONDecodeError, UnicodeDecodeError):
        return None
    if not isinstance(config, dict):
        return None
    servers = config.get('mcpServers')
    if not isinstance(servers, dict):
        return None
    server = servers.get('Uclusion')
    if not isinstance(server, dict):
        return None
    args = server.get('args')
    if not isinstance(args, list) or not args:
        return None
    last = args[-1]
    if isinstance(last, str) and last in ('stage', 'dev'):
        return last
    return None


def infer_environment(workspace_roots):
    """Match the Cursor MCP proxy's environment for this workspace.

    Prefer a project ``.cursor/mcp.json`` under a workspace root, then the
    global ``~/.cursor/mcp.json``. Fall back to production when neither names
    stage/dev (the MCP proxy omits the env arg for production).
    """
    candidates = []
    if isinstance(workspace_roots, list):
        for root in workspace_roots:
            if isinstance(root, str) and root:
                candidates.append(os.path.join(root, '.cursor', 'mcp.json'))
    candidates.append(
        os.path.join(os.path.expanduser('~'), '.cursor', 'mcp.json')
    )
    for path in candidates:
        env = _mcp_environment_from_path(path)
        if env is not None:
            return env
    return 'production'


def resolve_uclusion_command():
    """Prefer PATH, then the installer symlink under ``~/.local/bin``."""
    found = shutil.which('uclusion')
    if found:
        return found
    if os.path.isfile(DEFAULT_UCLUSION) and os.access(DEFAULT_UCLUSION, os.X_OK):
        return DEFAULT_UCLUSION
    return None


def drain_pokes(environment):
    """Return claimed poke lines (possibly empty). Fail open on errors."""
    uclusion = resolve_uclusion_command()
    if uclusion is None:
        return []
    cmd = [uclusion]
    if environment and environment != 'production':
        cmd.extend(['-e', environment])
    cmd.extend(['wait', '--timeout', '0'])
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=HOOK_TIMEOUT_SECONDS,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return []
    if result.returncode != 0:
        return []
    lines = []
    for raw in (result.stdout or '').splitlines():
        line = raw.strip()
        if line:
            lines.append(line)
    return lines


def followup_for_payload(payload):
    """Return a stop-hook output dict for the given Cursor payload."""
    if payload.get('status') != 'completed':
        return {}
    lines = drain_pokes(infer_environment(payload.get('workspace_roots')))
    if not lines:
        return {}
    return {'followup_message': '\n'.join(lines)}


def main():
    # Always emit valid JSON on stdout; never let traceback poison the hook.
    try:
        output = followup_for_payload(_read_payload())
    except Exception:
        output = {}
    sys.stdout.write(json.dumps(output))
    sys.stdout.write('\n')


if __name__ == '__main__':
    main()
