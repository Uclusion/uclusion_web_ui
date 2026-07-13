#!/usr/bin/env bash
# Bootstrap installer for Uclusion. Downloads uclusionInstall.py from the
# environment-specific Uclusion site and runs it with the supplied arguments.
#
# Usage:
#   install.sh <workspaceId> <viewId> [environment] [--project] [--clients claude,cursor,codex]
#
# Extra flags after the positional arguments are forwarded to uclusionInstall.py;
# --clients makes the install non-interactive and --project configures the
# current working directory instead of the home directory.
#
# Typical invocation (one-liner):
#   curl -fsSL https://production.uclusion.com/scripts/install.sh | bash -s -- <workspaceId> <viewId>
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <workspaceId> <viewId> [environment] [--project] [--clients claude,cursor,codex]" >&2
  echo "  environment: dev | stage | production (default: production)" >&2
  exit 64
fi

WORKSPACE_ID="$1"
VIEW_ID="$2"
shift 2

ENVIRONMENT="production"
if [ "$#" -gt 0 ]; then
  case "$1" in
    dev|stage|production)
      ENVIRONMENT="$1"
      shift
      ;;
  esac
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "Error: python3 is required but was not found on PATH." >&2
  exit 1
fi

BASE_URL="https://${ENVIRONMENT}.uclusion.com/scripts"
INSTALL_URL="${BASE_URL}/uclusionInstall.py"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

INSTALL_SCRIPT="${TMP_DIR}/uclusionInstall.py"

echo "⬇️  Downloading ${INSTALL_URL}"
if command -v curl >/dev/null 2>&1; then
  curl -fsSL "$INSTALL_URL" -o "$INSTALL_SCRIPT"
elif command -v wget >/dev/null 2>&1; then
  wget -q -O "$INSTALL_SCRIPT" "$INSTALL_URL"
else
  echo "Error: neither curl nor wget is available." >&2
  exit 1
fi

exec python3 "$INSTALL_SCRIPT" "$ENVIRONMENT" "$WORKSPACE_ID" "$VIEW_ID" "$@"
