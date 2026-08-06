#!/usr/bin/env python3
"""Privacy-minimized token accounting for Uclusion job handoffs.

The module has three deliberately small public surfaces:

* :class:`CodexTokenAudit`, loaded by ``uclusionCodexBridge.py``;
* the ``hook`` command, invoked by Claude Code lifecycle hooks; and
* :class:`TokenAuditProxy`, owned by ``uclusionMCPProxy.py`` for the local
  OTLP receiver and authenticated durable-outbox publishing.

Only normalized counters, safe labels, timestamps, and salted hashes of
provider identifiers are persisted. Raw OTLP records, prompts, responses,
tool arguments/results, shell commands, transcript paths, and identities are
never written to disk.
"""

import argparse
import errno
import hashlib
import http.client
import json
import os
import queue
import re
import secrets
import socket
import sqlite3
import stat
import sys
import tempfile
import threading
import time
import uuid
from contextlib import closing
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit


SCHEMA_VERSION = 1
DATABASE_NAME = "token_audit.sqlite3"
SALT_NAME = "token_audit_salt"
MAX_HTTP_BODY = 4 * 1024 * 1024
MAX_HOOK_BODY = 2 * 1024 * 1024
MAX_SAFE_INTEGER = 9007199254740991
MAX_TRANSCRIPT_READ = 64 * 1024 * 1024
TRANSCRIPT_SCAN_CHUNK = 1024 * 1024
START_REQUEST_BACKFILL_SECONDS = 30
ORPHAN_RETENTION_SECONDS = 60 * 60
FINALIZED_RETENTION_SECONDS = 7 * 24 * 60 * 60
UNPUBLISHED_RETENTION_SECONDS = 30 * 24 * 60 * 60
CLAUDE_EXPORT_GRACE_SECONDS = 2.5
CLAUDE_TRANSCRIPT_GRACE_SECONDS = 10.0
CLAUDE_TRANSCRIPT_HOOK_DEADLINE_GRACE_SECONDS = 75.0
OUTBOX_LEASE_SECONDS = 30
OUTBOX_POLL_SECONDS = 0.5
CODEX_COLLECTOR_READY_TTL_SECONDS = 30.0
DEFAULT_BUCKET = "planning"
MAX_BUCKETS = 32
MAX_BUCKET_LABEL_LENGTH = 80
PARTIAL_REASON_PRIORITY = {
    "session_interrupted": 0,
    "unsupported_client_version": 1,
    "incomplete_descendant_coverage": 2,
    "collector_failure": 3,
    "telemetry_unavailable": 4,
    "telemetry_disabled": 5,
    "unknown": 6,
}
MARKER_TOOLS = {
    "start_job_audit",
    "set_job_audit_phase",
    "end_job_audit",
}
SAFE_LABEL = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:/+@ -]{0,254}$")
BUCKET_LABEL = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:/+@ -]{0,79}$")
SUPPORTED_CLAUDE_TRANSCRIPT_VERSION = re.compile(r"^2(?:\.[0-9]+){1,3}(?:[-+].*)?$")
TEST_COMMAND = re.compile(
    r"(?:^|[;&|()\s])(?:pytest|py\.test|npm\s+(?:run\s+)?test|pnpm\s+"
    r"(?:run\s+)?test|yarn\s+(?:run\s+)?test|bun\s+test|cargo\s+test|"
    r"go\s+test|dotnet\s+test|mvn\s+test|gradle\s+test|jest|vitest)(?:\s|$)",
    re.IGNORECASE,
)


def _uclusion_home():
    override = os.environ.get("UCLUSION_TOKEN_AUDIT_HOME")
    if override:
        return os.path.abspath(os.path.expanduser(override))
    return os.path.join(os.path.expanduser("~"), ".uclusion")


def _database_path():
    override = os.environ.get("UCLUSION_TOKEN_AUDIT_DB")
    if override:
        return os.path.abspath(os.path.expanduser(override))
    return os.path.join(_uclusion_home(), DATABASE_NAME)


def _utc_iso(timestamp=None):
    value = time.time() if timestamp is None else float(timestamp)
    return datetime.fromtimestamp(value, timezone.utc).isoformat().replace(
        "+00:00", "Z"
    )


def _non_negative_int(value):
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value if 0 <= value <= MAX_SAFE_INTEGER else None
    if (
        isinstance(value, float)
        and 0 <= value <= MAX_SAFE_INTEGER
        and value.is_integer()
    ):
        return int(value)
    if isinstance(value, str) and value.isdigit():
        # Bound the conversion first: Python intentionally rejects extremely
        # long decimal strings and SQLite cannot store arbitrary precision.
        if len(value) > len(str(MAX_SAFE_INTEGER)):
            return None
        try:
            parsed = int(value)
        except (TypeError, ValueError, OverflowError):
            return None
        return parsed if parsed <= MAX_SAFE_INTEGER else None
    return None


def _first_int(mapping, *names):
    if not isinstance(mapping, dict):
        return None
    for name in names:
        value = _non_negative_int(mapping.get(name))
        if value is not None:
            return value
    return None


def _safe_label(value):
    if not isinstance(value, str):
        return None
    value = value.strip()
    if SAFE_LABEL.fullmatch(value):
        return value
    return None


def _safe_bucket(value):
    """Return an exact, bounded user bucket label or ``None``.

    Unlike metadata labels, bucket labels are part of the user-visible audit
    note. Do not silently trim them: the marker arguments, MCP result, local
    assignment, and published item must all name exactly the same bucket.
    """
    if (
        not isinstance(value, str)
        or not 1 <= len(value) <= MAX_BUCKET_LABEL_LENGTH
        or value != value.strip()
    ):
        return None
    if BUCKET_LABEL.fullmatch(value):
        return value
    return None


def _json_object(value):
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
        except (TypeError, ValueError):
            return None
        return parsed if isinstance(parsed, dict) else None
    return None


def _canonical_json(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"))


def _preferred_partial_reason(existing, candidate):
    if not existing:
        return candidate
    if not candidate:
        return existing
    if PARTIAL_REASON_PRIORITY.get(candidate, 99) < (
        PARTIAL_REASON_PRIORITY.get(existing, 99)
    ):
        return candidate
    return existing


def _tool_basename(name):
    if not isinstance(name, str):
        return None
    for prefix in ("mcp__Uclusion__", "mcp_Uclusion_", "Uclusion/"):
        if name.startswith(prefix):
            name = name[len(prefix):]
            break
    return name if name in MARKER_TOOLS else None


def _extract_structured_result(value):
    """Extract the small structured MCP result without retaining raw content."""
    if isinstance(value, dict):
        structured = value.get("structuredContent")
        if isinstance(structured, dict):
            return structured
        structured = value.get("structured_content")
        if isinstance(structured, dict):
            return structured
        result = value.get("result")
        if result is not value:
            found = _extract_structured_result(result)
            if found is not None:
                return found
        content = value.get("content")
        if isinstance(content, list):
            for item in content:
                if not isinstance(item, dict):
                    continue
                candidate = _json_object(item.get("text"))
                if isinstance(candidate, dict):
                    return candidate
        if (
            value.get("schema_version") == 1
            and isinstance(value.get("state"), str)
        ):
            return value
    elif isinstance(value, list):
        for item in value:
            found = _extract_structured_result(item)
            if found is not None:
                return found
    elif isinstance(value, str):
        return _json_object(value)
    return None


class AuditStore:
    """Small SQLite store shared by bridges, hooks, and MCP proxies."""

    def __init__(self, environment, workspace_id, path=None):
        self.environment = str(environment or "production")
        self.workspace_id = str(workspace_id)
        self._database_path_overridden = (
            path is not None
            or bool(os.environ.get("UCLUSION_TOKEN_AUDIT_DB"))
        )
        self.path = path or _database_path()
        self._salt = self._load_salt()
        with closing(self.connect()) as connection:
            self.ensure_schema(connection)

    def _load_salt(self):
        directory = os.path.dirname(self.path) or "."
        directory_existed = os.path.isdir(directory)
        os.makedirs(directory, mode=0o700, exist_ok=True)
        # The default ~/.uclusion directory is private by contract. An
        # explicitly supplied database can intentionally live in an existing
        # shared/workspace directory, whose access mode is not ours to change.
        if not self._database_path_overridden or not directory_existed:
            try:
                os.chmod(directory, 0o700)
            except OSError:
                pass
        salt_path = os.environ.get("UCLUSION_TOKEN_AUDIT_SALT")
        if not salt_path:
            salt_path = os.path.join(directory, SALT_NAME)

        def read_existing(wait_for_writer=False):
            attempts = 8 if wait_for_writer else 1
            for attempt in range(attempts):
                try:
                    with open(salt_path, "rb") as source:
                        existing = source.read(64)
                except FileNotFoundError:
                    return None
                if len(existing) >= 32:
                    return existing[:32]
                if attempt + 1 < attempts:
                    # Older releases created the final path before writing its
                    # bytes. A concurrently starting bridge/proxy can observe
                    # that brief empty-file window, so tolerate it during the
                    # mixed-version upgrade path as well.
                    time.sleep(min(0.01 * (2 ** attempt), 0.25))
            raise RuntimeError("Uclusion token-audit salt is invalid")

        existing = read_existing(wait_for_writer=True)
        if existing is not None:
            return existing

        salt = secrets.token_bytes(32)
        salt_directory = os.path.dirname(salt_path) or "."
        descriptor, temporary_path = tempfile.mkstemp(
            prefix=".uclusion-token-audit-salt-",
            dir=salt_directory,
        )
        try:
            os.chmod(temporary_path, 0o600)
            with os.fdopen(descriptor, "wb") as destination:
                destination.write(salt)
                destination.flush()
                os.fsync(destination.fileno())
            try:
                # A same-directory hard link publishes all 32 bytes at once
                # without replacing a salt another process already selected.
                os.link(temporary_path, salt_path)
                return salt
            except FileExistsError:
                winner = read_existing(wait_for_writer=True)
                if winner is None:
                    raise RuntimeError(
                        "Uclusion token-audit salt disappeared during creation"
                    )
                return winner
            except (AttributeError, NotImplementedError, OSError):
                # Hard links can be unavailable on a supported filesystem.
                # The O_EXCL fallback preserves first-writer ownership; peers
                # use the bounded short-read retry above while these 32 bytes
                # are copied into the final path.
                try:
                    final_descriptor = os.open(
                        salt_path,
                        os.O_WRONLY | os.O_CREAT | os.O_EXCL,
                        0o600,
                    )
                except FileExistsError:
                    winner = read_existing(wait_for_writer=True)
                    if winner is None:
                        raise RuntimeError(
                            "Uclusion token-audit salt disappeared during creation"
                        )
                    return winner
                with os.fdopen(final_descriptor, "wb") as destination:
                    destination.write(salt)
                    destination.flush()
                    os.fsync(destination.fileno())
                return salt
        finally:
            try:
                os.unlink(temporary_path)
            except FileNotFoundError:
                pass

    def fingerprint(self, namespace, value):
        if not isinstance(value, str) or not value:
            return None
        digest = hashlib.sha256()
        digest.update(self._salt)
        digest.update(b"\0")
        digest.update(self.environment.encode("utf-8", errors="replace"))
        digest.update(b"\0")
        digest.update(self.workspace_id.encode("utf-8", errors="replace"))
        digest.update(b"\0")
        digest.update(str(namespace).encode("utf-8", errors="replace"))
        digest.update(b"\0")
        digest.update(value.encode("utf-8", errors="replace"))
        return digest.hexdigest()

    def connect(self):
        connection = sqlite3.connect(self.path, timeout=5)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA busy_timeout = 5000")
        connection.execute("PRAGMA journal_mode = WAL")
        connection.execute("PRAGMA foreign_keys = ON")
        try:
            os.chmod(self.path, 0o600)
        except OSError:
            pass
        return connection

    @staticmethod
    def ensure_schema(connection):
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS token_audit_runs (
                audit_run_id TEXT PRIMARY KEY,
                environment TEXT NOT NULL,
                workspace_id TEXT NOT NULL,
                job_id TEXT NOT NULL,
                provider TEXT NOT NULL,
                client TEXT NOT NULL,
                client_version TEXT,
                source_mode TEXT NOT NULL,
                root_session_fp TEXT,
                started_at REAL NOT NULL,
                current_phase TEXT NOT NULL,
                marker_sequence INTEGER NOT NULL DEFAULT 0,
                handoff_type TEXT,
                state TEXT NOT NULL,
                closing_at REAL,
                completed_at REAL,
                finalize_after REAL,
                partial_reason TEXT,
                model TEXT,
                effort TEXT,
                updated_at REAL NOT NULL
            );
            CREATE INDEX IF NOT EXISTS token_audit_runs_scope
                ON token_audit_runs(environment, workspace_id, state);

            CREATE TABLE IF NOT EXISTS token_audit_phase_markers (
                audit_run_id TEXT NOT NULL,
                marker_sequence INTEGER NOT NULL,
                phase TEXT NOT NULL,
                effective_at REAL NOT NULL,
                PRIMARY KEY (audit_run_id, marker_sequence)
            );
            CREATE INDEX IF NOT EXISTS token_audit_phase_marker_time
                ON token_audit_phase_markers(audit_run_id, effective_at);

            CREATE TABLE IF NOT EXISTS token_audit_marker_events (
                audit_run_id TEXT NOT NULL,
                event_key TEXT NOT NULL,
                phase TEXT NOT NULL,
                marker_sequence INTEGER NOT NULL,
                created_at REAL NOT NULL,
                PRIMARY KEY (audit_run_id, event_key)
            );

            CREATE TABLE IF NOT EXISTS token_audit_end_events (
                audit_run_id TEXT NOT NULL,
                event_key TEXT NOT NULL,
                handoff_type TEXT NOT NULL,
                created_at REAL NOT NULL,
                PRIMARY KEY (audit_run_id, event_key)
            );

            CREATE TABLE IF NOT EXISTS token_audit_sessions (
                environment TEXT NOT NULL,
                workspace_id TEXT NOT NULL,
                client TEXT NOT NULL,
                session_fp TEXT NOT NULL,
                audit_run_id TEXT,
                parent_session_fp TEXT,
                is_root INTEGER NOT NULL DEFAULT 0,
                usage_seen INTEGER NOT NULL DEFAULT 0,
                partial_reason TEXT,
                partial_reason_at REAL,
                client_version TEXT,
                updated_at REAL NOT NULL,
                PRIMARY KEY (environment, workspace_id, client, session_fp)
            );
            CREATE INDEX IF NOT EXISTS token_audit_sessions_run
                ON token_audit_sessions(audit_run_id);

            CREATE TABLE IF NOT EXISTS token_audit_run_sessions (
                audit_run_id TEXT NOT NULL,
                session_fp TEXT NOT NULL,
                parent_session_fp TEXT,
                is_root INTEGER NOT NULL DEFAULT 0,
                usage_seen INTEGER NOT NULL DEFAULT 0,
                partial_reason TEXT,
                client_version TEXT,
                updated_at REAL NOT NULL,
                PRIMARY KEY (audit_run_id, session_fp)
            );
            CREATE INDEX IF NOT EXISTS token_audit_run_sessions_session
                ON token_audit_run_sessions(session_fp, audit_run_id);

            CREATE TABLE IF NOT EXISTS token_audit_usage (
                environment TEXT NOT NULL,
                workspace_id TEXT NOT NULL,
                client TEXT NOT NULL,
                event_key TEXT NOT NULL,
                session_fp TEXT,
                turn_fp TEXT,
                audit_run_id TEXT,
                phase TEXT,
                source_mode TEXT NOT NULL,
                input_tokens INTEGER NOT NULL DEFAULT 0,
                cached_input_tokens INTEGER NOT NULL DEFAULT 0,
                cache_write_tokens INTEGER NOT NULL DEFAULT 0,
                output_tokens INTEGER NOT NULL DEFAULT 0,
                reasoning_output_tokens INTEGER NOT NULL DEFAULT 0,
                cache_read_tokens INTEGER NOT NULL DEFAULT 0,
                cache_creation_tokens INTEGER NOT NULL DEFAULT 0,
                provider_total_tokens INTEGER,
                normalized_total_tokens INTEGER NOT NULL,
                model TEXT,
                effort TEXT,
                created_at REAL NOT NULL,
                PRIMARY KEY (environment, workspace_id, client, event_key)
            );
            CREATE INDEX IF NOT EXISTS token_audit_usage_run
                ON token_audit_usage(audit_run_id, created_at);
            CREATE INDEX IF NOT EXISTS token_audit_usage_orphan
                ON token_audit_usage(environment, workspace_id, client,
                    session_fp, audit_run_id, created_at);

            CREATE TABLE IF NOT EXISTS token_audit_activity (
                environment TEXT NOT NULL,
                workspace_id TEXT NOT NULL,
                client TEXT NOT NULL,
                event_key TEXT NOT NULL,
                session_fp TEXT,
                audit_run_id TEXT,
                kind TEXT NOT NULL,
                failed INTEGER NOT NULL DEFAULT 0,
                is_test INTEGER NOT NULL DEFAULT 0,
                created_at REAL NOT NULL,
                PRIMARY KEY (environment, workspace_id, client, event_key)
            );
            CREATE INDEX IF NOT EXISTS token_audit_activity_run
                ON token_audit_activity(audit_run_id, created_at);

            CREATE TABLE IF NOT EXISTS token_audit_transcripts (
                environment TEXT NOT NULL,
                workspace_id TEXT NOT NULL,
                session_fp TEXT NOT NULL,
                path_fp TEXT NOT NULL,
                byte_offset INTEGER NOT NULL,
                schema_state TEXT NOT NULL,
                updated_at REAL NOT NULL,
                PRIMARY KEY (environment, workspace_id, session_fp, path_fp)
            );

            CREATE TABLE IF NOT EXISTS token_audit_outbox (
                audit_run_id TEXT PRIMARY KEY,
                environment TEXT NOT NULL,
                workspace_id TEXT NOT NULL,
                job_id TEXT NOT NULL,
                handoff_type TEXT NOT NULL,
                finalization_json TEXT NOT NULL,
                state TEXT NOT NULL,
                attempts INTEGER NOT NULL DEFAULT 0,
                next_attempt_at REAL NOT NULL,
                lease_until REAL,
                lease_token TEXT,
                last_error_code TEXT,
                created_at REAL NOT NULL,
                updated_at REAL NOT NULL
            );
            CREATE INDEX IF NOT EXISTS token_audit_outbox_due
                ON token_audit_outbox(environment, workspace_id, state,
                    next_attempt_at, lease_until);

            CREATE TABLE IF NOT EXISTS token_audit_source_health (
                environment TEXT NOT NULL,
                workspace_id TEXT NOT NULL,
                client TEXT NOT NULL,
                source_mode TEXT NOT NULL,
                available INTEGER NOT NULL,
                updated_at REAL NOT NULL,
                PRIMARY KEY (environment, workspace_id, client, source_mode)
            );
            """
        )
        # Existing opt-in installations may already have the v1 tables. Keep
        # migrations additive so an update never discards an unfinished run.
        # The historical ``phase`` table/column names deliberately remain:
        # their TEXT values now hold bucket labels, and old fixed values such
        # as planning/testing are valid labels. This lets old and new local
        # processes overlap without a destructive table rewrite.
        # Bridge, proxy, and hook processes can all initialize concurrently;
        # serialize the inspect-and-ALTER sequence and recheck only after the
        # write lock is held so two upgraders cannot add the same column.
        connection.execute("BEGIN IMMEDIATE")
        try:
            run_columns = {
                row[1] for row in connection.execute(
                    "PRAGMA table_info(token_audit_runs)"
                ).fetchall()
            }
            if "completed_at" not in run_columns:
                connection.execute(
                    "ALTER TABLE token_audit_runs ADD COLUMN completed_at REAL"
                )
            session_columns = {
                row[1] for row in connection.execute(
                    "PRAGMA table_info(token_audit_sessions)"
                ).fetchall()
            }
            if "partial_reason_at" not in session_columns:
                connection.execute(
                    "ALTER TABLE token_audit_sessions "
                    "ADD COLUMN partial_reason_at REAL"
                )
            outbox_columns = {
                row[1] for row in connection.execute(
                    "PRAGMA table_info(token_audit_outbox)"
                ).fetchall()
            }
            if "lease_token" not in outbox_columns:
                connection.execute(
                    "ALTER TABLE token_audit_outbox ADD COLUMN lease_token TEXT"
                )
            # Preserve membership for runs created by an immediately previous
            # release before the immutable per-run table existed.
            connection.execute(
                """
                INSERT OR IGNORE INTO token_audit_run_sessions (
                    audit_run_id, session_fp, parent_session_fp, is_root,
                    usage_seen, partial_reason, client_version, updated_at
                )
                SELECT audit_run_id, session_fp, parent_session_fp, is_root,
                    usage_seen, partial_reason, client_version, updated_at
                FROM token_audit_sessions WHERE audit_run_id IS NOT NULL
                """
            )
            connection.commit()
        except Exception:
            connection.rollback()
            raise

    def _scope(self):
        return self.environment, self.workspace_id

    @staticmethod
    def _ensure_run_session(
        connection,
        audit_run_id,
        session_fp,
        parent_session_fp=None,
        is_root=False,
        client_version=None,
        updated_at=None,
    ):
        if audit_run_id is None or session_fp is None:
            return
        timestamp = time.time() if updated_at is None else float(updated_at)
        connection.execute(
            """
            INSERT INTO token_audit_run_sessions (
                audit_run_id, session_fp, parent_session_fp, is_root,
                client_version, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(audit_run_id, session_fp) DO UPDATE SET
                parent_session_fp=COALESCE(
                    excluded.parent_session_fp,
                    token_audit_run_sessions.parent_session_fp
                ),
                is_root=MAX(
                    token_audit_run_sessions.is_root, excluded.is_root
                ),
                client_version=COALESCE(
                    excluded.client_version,
                    token_audit_run_sessions.client_version
                ),
                updated_at=MAX(
                    token_audit_run_sessions.updated_at, excluded.updated_at
                )
            """,
            (
                audit_run_id,
                session_fp,
                parent_session_fp,
                1 if is_root else 0,
                _safe_label(client_version),
                timestamp,
            ),
        )

    def bind_session(
        self,
        client,
        session_fp,
        audit_run_id=None,
        parent_session_fp=None,
        is_root=False,
        client_version=None,
    ):
        if session_fp is None:
            return
        now = time.time()
        with closing(self.connect()) as connection, connection:
            connection.execute(
                """
                INSERT INTO token_audit_sessions (
                    environment, workspace_id, client, session_fp,
                    audit_run_id, parent_session_fp, is_root, client_version,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(environment, workspace_id, client, session_fp)
                DO UPDATE SET
                    usage_seen=CASE
                        WHEN excluded.audit_run_id IS NOT NULL
                          AND token_audit_sessions.audit_run_id
                              IS NOT excluded.audit_run_id
                        THEN 0 ELSE token_audit_sessions.usage_seen END,
                    partial_reason=CASE
                        WHEN excluded.audit_run_id IS NOT NULL
                          AND token_audit_sessions.audit_run_id
                              IS NOT excluded.audit_run_id
                        THEN NULL ELSE token_audit_sessions.partial_reason END,
                    partial_reason_at=CASE
                        WHEN excluded.audit_run_id IS NOT NULL
                          AND token_audit_sessions.audit_run_id
                              IS NOT excluded.audit_run_id
                        THEN NULL ELSE token_audit_sessions.partial_reason_at END,
                    audit_run_id=COALESCE(excluded.audit_run_id,
                        token_audit_sessions.audit_run_id),
                    parent_session_fp=COALESCE(excluded.parent_session_fp,
                        token_audit_sessions.parent_session_fp),
                    is_root=MAX(token_audit_sessions.is_root,
                        excluded.is_root),
                    client_version=COALESCE(excluded.client_version,
                        token_audit_sessions.client_version),
                    updated_at=excluded.updated_at
                """,
                (
                    self.environment,
                    self.workspace_id,
                    client,
                    session_fp,
                    audit_run_id,
                    parent_session_fp,
                    1 if is_root else 0,
                    _safe_label(client_version),
                    now,
                ),
            )
            current = connection.execute(
                "SELECT audit_run_id, parent_session_fp, is_root, "
                "client_version FROM token_audit_sessions "
                "WHERE environment=? AND workspace_id=? AND client=? "
                "AND session_fp=?",
                (
                    self.environment,
                    self.workspace_id,
                    client,
                    session_fp,
                ),
            ).fetchone()
            if current is not None:
                self._ensure_run_session(
                    connection,
                    current["audit_run_id"],
                    session_fp,
                    parent_session_fp=current["parent_session_fp"],
                    is_root=bool(current["is_root"]),
                    client_version=current["client_version"],
                    updated_at=now,
                )

    def session_run(self, client, session_fp):
        if session_fp is None:
            return None
        with closing(self.connect()) as connection:
            row = connection.execute(
                """
                SELECT r.* FROM token_audit_sessions s
                JOIN token_audit_runs r ON r.audit_run_id=s.audit_run_id
                WHERE s.environment=? AND s.workspace_id=? AND s.client=?
                  AND s.session_fp=? AND r.state IN ('active', 'closing', 'queued')
                """,
                (self.environment, self.workspace_id, client, session_fp),
            ).fetchone()
        return dict(row) if row is not None else None

    def _backfill_start_request(
        self, connection, client, session_fp, audit_run_id, started_at
    ):
        """Attach only the newest request that could have invoked start.

        Provider export and transcript writes may arrive on either side of the
        PostToolUse marker. Older session history remains orphaned, even when a
        delayed telemetry batch is received after the run has started.
        """
        already = connection.execute(
            """
            SELECT event_key, created_at FROM token_audit_usage
            WHERE audit_run_id=? AND created_at<?
            ORDER BY created_at DESC, event_key DESC LIMIT 1
            """,
            (audit_run_id, started_at),
        ).fetchone()
        orphan = connection.execute(
            """
            SELECT event_key FROM token_audit_usage
            WHERE environment=? AND workspace_id=? AND client=?
              AND session_fp=? AND audit_run_id IS NULL
              AND created_at>=? AND created_at<=?
            ORDER BY created_at DESC, event_key DESC LIMIT 1
            """,
            (
                self.environment,
                self.workspace_id,
                client,
                session_fp,
                started_at - START_REQUEST_BACKFILL_SECONDS,
                started_at,
            ),
        ).fetchone()
        if orphan is None:
            return False
        candidate = connection.execute(
            "SELECT created_at FROM token_audit_usage WHERE environment=? "
            "AND workspace_id=? AND client=? AND event_key=?",
            (
                self.environment,
                self.workspace_id,
                client,
                orphan["event_key"],
            ),
        ).fetchone()
        if (
            already is not None
            and float(already["created_at"]) >= float(candidate["created_at"])
        ):
            return False
        outbox = connection.execute(
            "SELECT state, attempts FROM token_audit_outbox "
            "WHERE audit_run_id=?",
            (audit_run_id,),
        ).fetchone()
        if outbox is not None and (
            outbox["state"] != "pending" or int(outbox["attempts"]) > 0
        ):
            return False
        if already is not None:
            connection.execute(
                """
                UPDATE token_audit_usage SET audit_run_id=NULL, phase=NULL
                WHERE environment=? AND workspace_id=? AND client=?
                  AND event_key=? AND audit_run_id=?
                """,
                (
                    self.environment,
                    self.workspace_id,
                    client,
                    already["event_key"],
                    audit_run_id,
                ),
            )
        cursor = connection.execute(
            """
            UPDATE token_audit_usage SET audit_run_id=?, phase=?
            WHERE environment=? AND workspace_id=? AND client=?
              AND event_key=? AND audit_run_id IS NULL
            """,
            (
                audit_run_id,
                DEFAULT_BUCKET,
                self.environment,
                self.workspace_id,
                client,
                orphan["event_key"],
            ),
        )
        if cursor.rowcount != 1:
            return False
        connection.execute(
            """
            UPDATE token_audit_sessions SET usage_seen=1, updated_at=?
            WHERE environment=? AND workspace_id=? AND client=?
              AND session_fp=?
            """,
            (
                started_at,
                self.environment,
                self.workspace_id,
                client,
                session_fp,
            ),
        )
        self._ensure_run_session(
            connection,
            audit_run_id,
            session_fp,
            is_root=True,
            updated_at=started_at,
        )
        connection.execute(
            "UPDATE token_audit_run_sessions SET usage_seen=1, "
            "updated_at=MAX(updated_at, ?) "
            "WHERE audit_run_id=? AND session_fp=?",
            (started_at, audit_run_id, session_fp),
        )
        if outbox is not None:
            run = connection.execute(
                "SELECT source_mode FROM token_audit_runs WHERE audit_run_id=?",
                (audit_run_id,),
            ).fetchone()
            grace = (
                CLAUDE_TRANSCRIPT_GRACE_SECONDS
                if run is not None
                and run["source_mode"] == "transcript_fallback"
                else CLAUDE_EXPORT_GRACE_SECONDS
            )
            now = time.time()
            connection.execute(
                "DELETE FROM token_audit_outbox WHERE audit_run_id=?",
                (audit_run_id,),
            )
            connection.execute(
                """
                UPDATE token_audit_runs SET state='closing',
                    finalize_after=?, updated_at=? WHERE audit_run_id=?
                """,
                (now + grace, now, audit_run_id),
            )
        return True

    def backfill_start_request(self, client, session_fp):
        if session_fp is None:
            return False
        with closing(self.connect()) as connection, connection:
            # Backfill can replace a never-attempted queued payload, so its
            # selection and mutation share the publisher's writer lock.
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                """
                SELECT r.audit_run_id, r.started_at
                FROM token_audit_sessions s
                JOIN token_audit_runs r ON r.audit_run_id=s.audit_run_id
                WHERE s.environment=? AND s.workspace_id=? AND s.client=?
                  AND s.session_fp=?
                  AND r.state IN ('active','closing','queued')
                """,
                (
                    self.environment,
                    self.workspace_id,
                    client,
                    session_fp,
                ),
            ).fetchone()
            if row is None:
                return False
            return self._backfill_start_request(
                connection,
                client,
                session_fp,
                row["audit_run_id"],
                float(row["started_at"]),
            )

    def start_run(
        self,
        client,
        provider,
        source_mode,
        session_fp,
        audit_run_id,
        job_id,
        client_version=None,
    ):
        if not isinstance(audit_run_id, str) or not isinstance(job_id, str):
            return False
        try:
            uuid.UUID(audit_run_id)
        except (TypeError, ValueError, AttributeError):
            return False
        now = time.time()
        interrupted_prior = False
        with closing(self.connect()) as connection, connection:
            # Two accepted starts on one provider session must be observed in
            # one serial order so the earlier run is interrupted, never left
            # active and unreachable behind a last-writer-wins session bind.
            connection.execute("BEGIN IMMEDIATE")
            existing = connection.execute(
                "SELECT job_id, client, root_session_fp, state "
                "FROM token_audit_runs WHERE audit_run_id=?",
                (audit_run_id,),
            ).fetchone()
            if existing is not None:
                if (
                    existing["job_id"] != job_id
                    or existing["client"] != client
                    or (
                        existing["root_session_fp"] is not None
                        and existing["root_session_fp"] != session_fp
                    )
                ):
                    return False
                # Replayed successful start markers are pure idempotency. In
                # particular, an old replay must never steal the session from
                # a newer audit run.
                return True

            prior_session = None
            prior_run = None
            prior_session_reason = None
            if session_fp is not None:
                prior_session = connection.execute(
                    "SELECT audit_run_id, partial_reason, partial_reason_at "
                    "FROM token_audit_sessions WHERE environment=? "
                    "AND workspace_id=? AND client=? AND session_fp=?",
                    (
                        self.environment,
                        self.workspace_id,
                        client,
                        session_fp,
                    ),
                ).fetchone()
                prior_run_id = (
                    prior_session["audit_run_id"]
                    if prior_session is not None else None
                )
                if prior_run_id is not None:
                    prior_run = connection.execute(
                        "SELECT state, completed_at, source_mode "
                        "FROM token_audit_runs WHERE audit_run_id=?",
                        (prior_run_id,),
                    ).fetchone()
                if (
                    prior_session is not None
                    and prior_session["partial_reason"] is not None
                    and (
                        prior_run is None
                        or (
                            prior_run["completed_at"] is not None
                            and prior_session["partial_reason_at"] is not None
                            and float(prior_session["partial_reason_at"])
                            > float(prior_run["completed_at"])
                        )
                    )
                ):
                    prior_session_reason = prior_session["partial_reason"]

                if (
                    prior_run is not None
                    and prior_run["state"] in {"active", "closing"}
                    and prior_run["completed_at"] is None
                ):
                    # One provider session cannot represent two live job
                    # windows. Preserve both audits by explicitly interrupting
                    # the abandoned run before rebinding the accepted new one.
                    grace = (
                        CLAUDE_TRANSCRIPT_GRACE_SECONDS
                        if prior_run["source_mode"] == "transcript_fallback"
                        else (
                            CLAUDE_EXPORT_GRACE_SECONDS
                            if prior_run["source_mode"] in {"otel", "mixed"}
                            else 0.0
                        )
                    )
                    connection.execute(
                        "UPDATE token_audit_runs SET state='closing', "
                        "handoff_type=COALESCE(handoff_type, 'interrupted'), "
                        "closing_at=COALESCE(closing_at, ?), "
                        "completed_at=COALESCE(completed_at, ?), "
                        "finalize_after=MAX(COALESCE(finalize_after, 0), ?), "
                        "updated_at=? WHERE audit_run_id=?",
                        (
                            now,
                            now,
                            now + grace,
                            now,
                            prior_session["audit_run_id"],
                        ),
                    )
                    self._ensure_run_session(
                        connection,
                        prior_session["audit_run_id"],
                        session_fp,
                        is_root=True,
                        updated_at=now,
                    )
                    prior_membership = connection.execute(
                        "SELECT partial_reason FROM token_audit_run_sessions "
                        "WHERE audit_run_id=? AND session_fp=?",
                        (prior_session["audit_run_id"], session_fp),
                    ).fetchone()
                    connection.execute(
                        "UPDATE token_audit_run_sessions SET partial_reason=?, "
                        "updated_at=? WHERE audit_run_id=? AND session_fp=?",
                        (
                            _preferred_partial_reason(
                                prior_membership["partial_reason"]
                                if prior_membership is not None else None,
                                "session_interrupted",
                            ),
                            now,
                            prior_session["audit_run_id"],
                            session_fp,
                        ),
                    )
                    interrupted_prior = True
                    prior_session_reason = None

            connection.execute(
                """
                INSERT INTO token_audit_runs (
                    audit_run_id, environment, workspace_id, job_id,
                    provider, client, client_version, source_mode,
                    root_session_fp, started_at, current_phase, state,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
                """,
                (
                    audit_run_id,
                    self.environment,
                    self.workspace_id,
                    job_id,
                    provider,
                    client,
                    _safe_label(client_version),
                    source_mode,
                    session_fp,
                    now,
                    DEFAULT_BUCKET,
                    now,
                ),
            )
            if source_mode == "otel":
                health = connection.execute(
                    "SELECT available FROM token_audit_source_health "
                    "WHERE environment=? AND workspace_id=? AND client=? "
                    "AND source_mode=?",
                    (
                        self.environment,
                        self.workspace_id,
                        client,
                        source_mode,
                    ),
                ).fetchone()
                if health is None or not bool(health["available"]):
                    connection.execute(
                        "UPDATE token_audit_runs SET "
                        "partial_reason=COALESCE(partial_reason, ?), "
                        "updated_at=? WHERE audit_run_id=?",
                        ("telemetry_unavailable", now, audit_run_id),
                    )
            if session_fp is not None:
                connection.execute(
                    """
                    INSERT INTO token_audit_sessions (
                        environment, workspace_id, client, session_fp,
                        audit_run_id, is_root, updated_at
                    ) VALUES (?, ?, ?, ?, ?, 1, ?)
                    ON CONFLICT(environment, workspace_id, client, session_fp)
                    DO UPDATE SET usage_seen=0, partial_reason=NULL,
                        partial_reason_at=NULL, audit_run_id=excluded.audit_run_id,
                        is_root=1, updated_at=excluded.updated_at
                    """,
                    (
                        self.environment,
                        self.workspace_id,
                        client,
                        session_fp,
                        audit_run_id,
                        now,
                    ),
                )
                self._ensure_run_session(
                    connection,
                    audit_run_id,
                    session_fp,
                    is_root=True,
                    client_version=client_version,
                    updated_at=now,
                )
                if prior_session_reason is not None:
                    connection.execute(
                        "UPDATE token_audit_sessions SET partial_reason=?, "
                        "partial_reason_at=?, updated_at=? WHERE environment=? "
                        "AND workspace_id=? AND client=? AND session_fp=?",
                        (
                            prior_session_reason,
                            now,
                            now,
                            self.environment,
                            self.workspace_id,
                            client,
                            session_fp,
                        ),
                    )
                    connection.execute(
                        "UPDATE token_audit_run_sessions SET partial_reason=?, "
                        "updated_at=? WHERE audit_run_id=? AND session_fp=?",
                        (prior_session_reason, now, audit_run_id, session_fp),
                    )
                backfilled = self._backfill_start_request(
                    connection, client, session_fp, audit_run_id, now
                )
                if backfilled:
                    latest_activity = connection.execute(
                        "SELECT MAX(created_at) AS latest "
                        "FROM token_audit_activity WHERE environment=? "
                        "AND workspace_id=? AND client=? AND session_fp=? "
                        "AND audit_run_id IS NULL AND created_at>=?",
                        (
                            self.environment,
                            self.workspace_id,
                            client,
                            session_fp,
                            now - START_REQUEST_BACKFILL_SECONDS,
                        ),
                    ).fetchone()
                    if latest_activity is not None and latest_activity["latest"] is not None:
                        connection.execute(
                            "UPDATE token_audit_activity SET audit_run_id=? "
                            "WHERE environment=? AND workspace_id=? AND client=? "
                            "AND session_fp=? AND audit_run_id IS NULL "
                            "AND created_at>=?",
                            (
                                audit_run_id,
                                self.environment,
                                self.workspace_id,
                                client,
                                session_fp,
                                float(latest_activity["latest"]) - 1.0,
                            ),
                        )
        if interrupted_prior:
            self.prepare_due_outbox()
        return True

    def _marker_run_matches(
        self, connection, audit_run_id, client=None, session_fp=None, job_id=None
    ):
        row = connection.execute(
            "SELECT client, root_session_fp, job_id FROM token_audit_runs "
            "WHERE audit_run_id=?",
            (audit_run_id,),
        ).fetchone()
        if row is None:
            return False
        if client is not None and row["client"] != client:
            return False
        if session_fp is not None and row["root_session_fp"] != session_fp:
            bound = connection.execute(
                """
                SELECT 1 FROM token_audit_sessions
                WHERE environment=? AND workspace_id=? AND client=?
                  AND session_fp=? AND audit_run_id=? LIMIT 1
                """,
                (
                    self.environment,
                    self.workspace_id,
                    client,
                    session_fp,
                    audit_run_id,
                ),
            ).fetchone()
            if bound is None:
                return False
        return job_id is None or row["job_id"] == job_id

    def set_bucket(
        self,
        audit_run_id,
        bucket,
        marker_sequence=None,
        marker_identity=None,
        client=None,
        session_fp=None,
        job_id=None,
    ):
        bucket = _safe_bucket(bucket)
        if bucket is None:
            return False
        with closing(self.connect()) as connection, connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                "SELECT marker_sequence, current_phase, state "
                "FROM token_audit_runs "
                "WHERE audit_run_id=?",
                (audit_run_id,),
            ).fetchone()
            if row is None or not self._marker_run_matches(
                connection, audit_run_id, client, session_fp, job_id
            ) or row["state"] not in ("active", "closing"):
                return False
            event_key = None
            if isinstance(marker_identity, str) and marker_identity:
                event_key = self.fingerprint(
                    "phase-marker-event",
                    str(client or "") + "\0" + marker_identity,
                )
                existing_event = connection.execute(
                    "SELECT phase, marker_sequence "
                    "FROM token_audit_marker_events "
                    "WHERE audit_run_id=? AND event_key=?",
                    (audit_run_id, event_key),
                ).fetchone()
                if existing_event is not None:
                    supplied_sequence = _non_negative_int(marker_sequence)
                    return (
                        existing_event["phase"] == bucket
                        and (
                            marker_sequence is None
                            or supplied_sequence
                            == int(existing_event["marker_sequence"])
                        )
                    )
            sequence = _non_negative_int(marker_sequence)
            if marker_sequence is None:
                sequence = int(row["marker_sequence"]) + 1
            elif sequence is None or sequence < 1:
                return False
            current_sequence = int(row["marker_sequence"])
            if sequence < current_sequence:
                return False
            if sequence == current_sequence:
                existing_marker = connection.execute(
                    "SELECT phase FROM token_audit_phase_markers "
                    "WHERE audit_run_id=? AND marker_sequence=?",
                    (audit_run_id, sequence),
                ).fetchone()
                if existing_marker is None or existing_marker["phase"] != bucket:
                    return False
                if event_key is not None:
                    connection.execute(
                        "INSERT INTO token_audit_marker_events "
                        "(audit_run_id, event_key, phase, marker_sequence, created_at) "
                        "VALUES (?, ?, ?, ?, ?)",
                        (audit_run_id, event_key, bucket, sequence, time.time()),
                    )
                return True
            # ``phase`` is the legacy SQLite column name; it now stores the
            # single user-labelable bucket dimension. Count the default and
            # every marker, including labels that have not received a request
            # yet, so concurrent callers cannot exceed the closed API bound.
            existing_buckets = {DEFAULT_BUCKET, row["current_phase"]}
            existing_buckets.update(
                item["phase"] for item in connection.execute(
                    "SELECT DISTINCT phase FROM token_audit_phase_markers "
                    "WHERE audit_run_id=?",
                    (audit_run_id,),
                ).fetchall()
            )
            if bucket not in existing_buckets and len(existing_buckets) >= MAX_BUCKETS:
                return False
            now = time.time()
            connection.execute(
                """
                UPDATE token_audit_runs SET current_phase=?, marker_sequence=?,
                    updated_at=? WHERE audit_run_id=? AND state IN ('active','closing')
                """,
                (bucket, sequence, now, audit_run_id),
            )
            connection.execute(
                """
                INSERT INTO token_audit_phase_markers (
                    audit_run_id, marker_sequence, phase, effective_at
                ) VALUES (?, ?, ?, ?)
                """,
                (audit_run_id, sequence, bucket, now),
            )
            if event_key is not None:
                connection.execute(
                    "INSERT INTO token_audit_marker_events "
                    "(audit_run_id, event_key, phase, marker_sequence, created_at) "
                    "VALUES (?, ?, ?, ?, ?)",
                    (audit_run_id, event_key, bucket, sequence, now),
                )
        return True

    def request_end(
        self,
        audit_run_id,
        handoff_type,
        client=None,
        session_fp=None,
        job_id=None,
        marker_identity=None,
    ):
        if handoff_type not in {
            "progress", "blocked", "review_requested", "completed",
            "paused", "interrupted",
        }:
            return False
        now = time.time()
        with closing(self.connect()) as connection, connection:
            connection.execute("BEGIN IMMEDIATE")
            if not self._marker_run_matches(
                connection, audit_run_id, client, session_fp, job_id
            ):
                return False
            event_key = None
            if isinstance(marker_identity, str) and marker_identity:
                event_key = self.fingerprint(
                    "end-marker-event",
                    str(client or "") + "\0" + marker_identity,
                )
                existing_event = connection.execute(
                    "SELECT handoff_type FROM token_audit_end_events "
                    "WHERE audit_run_id=? AND event_key=?",
                    (audit_run_id, event_key),
                ).fetchone()
                if existing_event is not None:
                    return existing_event["handoff_type"] == handoff_type
            row = connection.execute(
                "SELECT state, handoff_type FROM token_audit_runs "
                "WHERE audit_run_id=?",
                (audit_run_id,),
            ).fetchone()
            if row is None:
                return False
            if row["state"] == "closing" and event_key is None:
                # The first accepted handoff is immutable. Replayed end items
                # are idempotent only when they describe that same handoff;
                # an older replay can never revert a newer accepted value.
                return row["handoff_type"] == handoff_type
            if row["state"] not in {"active", "closing"}:
                return False
            cursor = connection.execute(
                """
                UPDATE token_audit_runs SET handoff_type=?, state='closing',
                    closing_at=COALESCE(closing_at, ?), updated_at=?
                WHERE audit_run_id=? AND state IN ('active','closing')
                """,
                (handoff_type, now, now, audit_run_id),
            )
            if cursor.rowcount == 1 and event_key is not None:
                connection.execute(
                    "INSERT INTO token_audit_end_events "
                    "(audit_run_id, event_key, handoff_type, created_at) "
                    "VALUES (?, ?, ?, ?)",
                    (audit_run_id, event_key, handoff_type, now),
                )
        return cursor.rowcount > 0

    def mark_partial(
        self,
        client,
        session_fp,
        reason_code,
        event_time=None,
        ambiguous_timestamp=False,
    ):
        if reason_code not in {
            "telemetry_disabled", "telemetry_unavailable",
            "unsupported_client_version", "collector_failure",
            "session_interrupted", "incomplete_descendant_coverage", "unknown",
        }:
            reason_code = "unknown"
        now = time.time()
        try:
            effective_at = now if event_time is None else float(event_time)
        except (TypeError, ValueError, OverflowError):
            effective_at = now
        rebuild_outbox = False
        with closing(self.connect()) as connection, connection:
            # Serialize timestamp assignment, mutation, and any never-attempted
            # outbox rebuild against both finalization and publisher claims.
            connection.execute("BEGIN IMMEDIATE")
            if session_fp is not None:
                session = connection.execute(
                    "SELECT s.audit_run_id, s.parent_session_fp, s.is_root, "
                    "s.client_version, s.partial_reason, "
                    "s.partial_reason_at, r.started_at, r.completed_at "
                    "FROM token_audit_sessions s LEFT JOIN token_audit_runs r "
                    "ON r.audit_run_id=s.audit_run_id "
                    "WHERE s.environment=? AND s.workspace_id=? "
                    "AND s.client=? AND s.session_fp=?",
                    (
                        self.environment,
                        self.workspace_id,
                        client,
                        session_fp,
                    ),
                ).fetchone()
                current_run_id = (
                    session["audit_run_id"] if session is not None else None
                )
                run_id, _phase, assigned_is_root = (
                    self._assignment_for_timestamp(
                        connection, client, session_fp, effective_at
                    )
                )
                if (
                    run_id is None
                    and current_run_id is not None
                    and session["started_at"] is not None
                    and float(session["started_at"])
                        - START_REQUEST_BACKFILL_SECONDS
                        <= effective_at
                        <= float(session["started_at"])
                ):
                    # Malformed telemetry cannot be persisted and backfilled
                    # like a valid usage row. Preserve the same bounded rule
                    # for the request that invoked start by attaching only its
                    # partial evidence to the newest open run.
                    run_id = current_run_id
                    assigned_is_root = bool(session["is_root"])
                pending_for_future = (
                    run_id is None
                    and (
                        session is None
                        or current_run_id is None
                        or (
                            session["completed_at"] is not None
                            and effective_at > float(session["completed_at"])
                        )
                    )
                )
                update_current = (
                    run_id is not None and run_id == current_run_id
                ) or pending_for_future
                if update_current:
                    existing_reason = (
                        session["partial_reason"]
                        if session is not None else None
                    )
                    existing_reason_at = (
                        session["partial_reason_at"]
                        if session is not None else None
                    )
                    existing_is_pending = bool(
                        existing_reason
                        and existing_reason_at is not None
                        and (
                            current_run_id is None
                            or (
                                session["completed_at"] is not None
                                and float(existing_reason_at)
                                > float(session["completed_at"])
                            )
                        )
                    )
                    replace_reason = (
                        pending_for_future and not existing_is_pending
                    )
                    selected_reason = (
                        reason_code
                        if replace_reason
                        else _preferred_partial_reason(
                            existing_reason, reason_code
                        )
                    )
                    selected_reason_at = (
                        effective_at
                        if replace_reason
                        or (
                            selected_reason == reason_code
                            and selected_reason != existing_reason
                        )
                        else (
                            session["partial_reason_at"]
                            if session is not None
                            and session["partial_reason_at"] is not None
                            else effective_at
                        )
                    )
                    connection.execute(
                        """
                        INSERT INTO token_audit_sessions (
                            environment, workspace_id, client, session_fp,
                            partial_reason, partial_reason_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(environment, workspace_id, client, session_fp)
                        DO UPDATE SET partial_reason=excluded.partial_reason,
                            partial_reason_at=excluded.partial_reason_at,
                            updated_at=excluded.updated_at
                        """,
                        (
                            self.environment,
                            self.workspace_id,
                            client,
                            session_fp,
                            selected_reason,
                            selected_reason_at,
                            now,
                        ),
                    )
                if run_id is not None:
                    self._ensure_run_session(
                        connection,
                        run_id,
                        session_fp,
                        parent_session_fp=(
                            session["parent_session_fp"]
                            if session is not None else None
                        ),
                        is_root=bool(assigned_is_root),
                        client_version=(
                            session["client_version"]
                            if session is not None else None
                        ),
                        updated_at=now,
                    )
                    run_session = connection.execute(
                        "SELECT partial_reason FROM token_audit_run_sessions "
                        "WHERE audit_run_id=? AND session_fp=?",
                        (run_id, session_fp),
                    ).fetchone()
                    run_reason = _preferred_partial_reason(
                        run_session["partial_reason"]
                        if run_session is not None else None,
                        reason_code,
                    )
                    connection.execute(
                        "UPDATE token_audit_run_sessions SET "
                        "partial_reason=?, updated_at=? "
                        "WHERE audit_run_id=? AND session_fp=?",
                        (run_reason, now, run_id, session_fp),
                    )
                    connection.execute(
                        "UPDATE token_audit_runs SET updated_at=? "
                        "WHERE audit_run_id=? "
                        "AND state IN ('active','closing','queued')",
                        (now, run_id),
                    )
                    queued = connection.execute(
                        "SELECT state, attempts FROM token_audit_outbox "
                        "WHERE audit_run_id=?",
                        (run_id,),
                    ).fetchone()
                    if (
                        queued is not None
                        and queued["state"] == "pending"
                        and int(queued["attempts"]) == 0
                    ):
                        connection.execute(
                            "DELETE FROM token_audit_outbox WHERE audit_run_id=?",
                            (run_id,),
                        )
                        connection.execute(
                            "UPDATE token_audit_runs SET state='closing', "
                            "finalize_after=?, updated_at=? "
                            "WHERE audit_run_id=? AND state='queued'",
                            (now, now, run_id),
                        )
                        rebuild_outbox = True
                if ambiguous_timestamp:
                    # An asynchronous event without provider time can belong
                    # to any still-mutable window for this provider session.
                    # Mark every candidate partial; assigning it to only the
                    # receipt-time run could leave an earlier completed run
                    # claiming an exact undercount during its export grace.
                    candidates = connection.execute(
                        """
                        SELECT r.audit_run_id, o.state AS outbox_state,
                            o.attempts, rs.partial_reason
                        FROM token_audit_run_sessions rs
                        JOIN token_audit_runs r
                          ON r.audit_run_id=rs.audit_run_id
                        LEFT JOIN token_audit_outbox o
                          ON o.audit_run_id=r.audit_run_id
                        WHERE r.environment=? AND r.workspace_id=?
                          AND r.client=? AND rs.session_fp=?
                          AND r.state IN ('active','closing','queued')
                        """,
                        (
                            self.environment,
                            self.workspace_id,
                            client,
                            session_fp,
                        ),
                    ).fetchall()
                    for candidate in candidates:
                        candidate_run_id = candidate["audit_run_id"]
                        if (
                            candidate["outbox_state"] is not None
                            and not (
                                candidate["outbox_state"] == "pending"
                                and int(candidate["attempts"] or 0) == 0
                            )
                        ):
                            continue
                        candidate_reason = _preferred_partial_reason(
                            candidate["partial_reason"], reason_code
                        )
                        connection.execute(
                            "UPDATE token_audit_run_sessions SET "
                            "partial_reason=?, updated_at=? "
                            "WHERE audit_run_id=? AND session_fp=?",
                            (
                                candidate_reason,
                                now,
                                candidate_run_id,
                                session_fp,
                            ),
                        )
                        if candidate["outbox_state"] == "pending":
                            connection.execute(
                                "DELETE FROM token_audit_outbox "
                                "WHERE audit_run_id=?",
                                (candidate_run_id,),
                            )
                            connection.execute(
                                "UPDATE token_audit_runs SET state='closing', "
                                "finalize_after=?, updated_at=? "
                                "WHERE audit_run_id=? AND state='queued'",
                                (now, now, candidate_run_id),
                            )
                            rebuild_outbox = True
        if rebuild_outbox:
            self.prepare_due_outbox(now)

    def discover_descendant(self, client, parent_session_fp, child_session_fp):
        if parent_session_fp is None or child_session_fp is None:
            return False
        now = time.time()
        with closing(self.connect()) as connection, connection:
            connection.execute("BEGIN IMMEDIATE")
            parent = connection.execute(
                """
                SELECT audit_run_id FROM token_audit_sessions
                WHERE environment=? AND workspace_id=? AND client=?
                  AND session_fp=?
                """,
                (
                    self.environment,
                    self.workspace_id,
                    client,
                    parent_session_fp,
                ),
            ).fetchone()
            run_id = parent["audit_run_id"] if parent is not None else None
            before = connection.execute(
                """
                SELECT audit_run_id FROM token_audit_sessions
                WHERE environment=? AND workspace_id=? AND client=?
                  AND session_fp=?
                """,
                (
                    self.environment,
                    self.workspace_id,
                    client,
                    child_session_fp,
                ),
            ).fetchone()
            connection.execute(
                """
                INSERT INTO token_audit_sessions (
                    environment, workspace_id, client, session_fp,
                    audit_run_id, parent_session_fp, is_root, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, 0, ?)
                ON CONFLICT(environment, workspace_id, client, session_fp)
                DO UPDATE SET
                    usage_seen=CASE
                        WHEN excluded.audit_run_id IS NOT NULL
                          AND token_audit_sessions.audit_run_id
                              IS NOT excluded.audit_run_id
                        THEN 0 ELSE token_audit_sessions.usage_seen END,
                    partial_reason=CASE
                        WHEN excluded.audit_run_id IS NOT NULL
                          AND token_audit_sessions.audit_run_id
                              IS NOT excluded.audit_run_id
                        THEN NULL ELSE token_audit_sessions.partial_reason END,
                    partial_reason_at=CASE
                        WHEN excluded.audit_run_id IS NOT NULL
                          AND token_audit_sessions.audit_run_id
                              IS NOT excluded.audit_run_id
                        THEN NULL ELSE token_audit_sessions.partial_reason_at END,
                    audit_run_id=COALESCE(excluded.audit_run_id,
                        token_audit_sessions.audit_run_id),
                    parent_session_fp=COALESCE(excluded.parent_session_fp,
                        token_audit_sessions.parent_session_fp),
                    updated_at=excluded.updated_at
                """,
                (
                    self.environment,
                    self.workspace_id,
                    client,
                    child_session_fp,
                    run_id,
                    parent_session_fp,
                    now,
                ),
            )
            current = connection.execute(
                "SELECT audit_run_id, parent_session_fp, client_version "
                "FROM token_audit_sessions WHERE environment=? "
                "AND workspace_id=? AND client=? AND session_fp=?",
                (
                    self.environment,
                    self.workspace_id,
                    client,
                    child_session_fp,
                ),
            ).fetchone()
            if current is not None:
                self._ensure_run_session(
                    connection,
                    current["audit_run_id"],
                    child_session_fp,
                    parent_session_fp=current["parent_session_fp"],
                    is_root=False,
                    client_version=current["client_version"],
                    updated_at=now,
                )
        return run_id is not None and (
            before is None or before["audit_run_id"] != run_id
        )

    def _active_assignment(self, connection, client, session_fp):
        if session_fp is None:
            return None, None, None
        row = connection.execute(
            """
            SELECT r.audit_run_id, r.current_phase, s.is_root
            FROM token_audit_sessions s
            JOIN token_audit_runs r ON r.audit_run_id=s.audit_run_id
            WHERE s.environment=? AND s.workspace_id=? AND s.client=?
              AND s.session_fp=? AND r.state IN ('active','closing','queued')
            """,
            (self.environment, self.workspace_id, client, session_fp),
        ).fetchone()
        if row is None:
            return None, None, None
        return row["audit_run_id"], row["current_phase"], bool(row["is_root"])

    def _assignment_for_timestamp(
        self, connection, client, session_fp, timestamp
    ):
        """Resolve delayed events against immutable per-run membership."""
        if session_fp is None:
            return None, None, None
        rows = connection.execute(
            """
            SELECT r.audit_run_id, r.state, rs.is_root,
                o.state AS outbox_state, o.attempts
            FROM token_audit_run_sessions rs
            JOIN token_audit_runs r ON r.audit_run_id=rs.audit_run_id
            LEFT JOIN token_audit_outbox o ON o.audit_run_id=r.audit_run_id
            WHERE r.environment=? AND r.workspace_id=? AND r.client=?
              AND rs.session_fp=?
              AND r.state IN ('active','closing','queued')
              AND r.started_at<=?
              AND (r.completed_at IS NULL OR r.completed_at>=?)
            ORDER BY r.started_at DESC
            """,
            (
                self.environment,
                self.workspace_id,
                client,
                session_fp,
                timestamp,
                timestamp,
            ),
        ).fetchall()
        for row in rows:
            if row["state"] == "queued" and not (
                row["outbox_state"] == "pending"
                and int(row["attempts"] or 0) == 0
            ):
                continue
            marker = connection.execute(
                "SELECT phase FROM token_audit_phase_markers "
                "WHERE audit_run_id=? AND effective_at<=? "
                "ORDER BY effective_at DESC, marker_sequence DESC LIMIT 1",
                (row["audit_run_id"], timestamp),
            ).fetchone()
            return (
                row["audit_run_id"],
                marker["phase"] if marker is not None else DEFAULT_BUCKET,
                bool(row["is_root"]),
            )
        return None, None, None

    def record_usage(
        self,
        client,
        session_fp,
        event_identity,
        counts,
        source_mode,
        turn_fp=None,
        model=None,
        effort=None,
        created_at=None,
    ):
        """Persist one allowlisted provider usage event, idempotently."""
        if (
            not isinstance(event_identity, str)
            or not event_identity
            or not isinstance(counts, dict)
        ):
            return False
        allowed_modes = {"native", "otel", "transcript_fallback", "mixed"}
        if source_mode not in allowed_modes:
            source_mode = "mixed"
        normalized = _non_negative_int(counts.get("normalized_total_tokens"))
        if normalized is None:
            return False
        values = {}
        for name in (
            "input_tokens",
            "cached_input_tokens",
            "cache_write_tokens",
            "output_tokens",
            "reasoning_output_tokens",
            "cache_read_tokens",
            "cache_creation_tokens",
        ):
            raw_value = counts.get(name)
            parsed = _non_negative_int(raw_value)
            if raw_value is not None and parsed is None:
                return False
            values[name] = parsed or 0
        raw_provider_total = counts.get("provider_total_tokens")
        provider_total = _non_negative_int(raw_provider_total)
        if raw_provider_total is not None and provider_total is None:
            return False
        event_key = self.fingerprint("usage-event", client + "\0" + event_identity)
        received_at = time.time()
        timestamp = received_at if created_at is None else float(created_at)
        settle_grace = (
            CLAUDE_TRANSCRIPT_GRACE_SECONDS
            if source_mode == "transcript_fallback"
            else CLAUDE_EXPORT_GRACE_SECONDS
        )
        safe_model = _safe_label(model)
        safe_effort = _safe_label(effort)
        with closing(self.connect()) as connection, connection:
            # A deferred provider event and its payload rebuild are one atomic
            # operation relative to prepare_due_outbox/claim_outbox.
            connection.execute("BEGIN IMMEDIATE")
            run_id, bucket, is_root = self._assignment_for_timestamp(
                connection, client, session_fp, timestamp
            )
            cursor = connection.execute(
                """
                INSERT OR IGNORE INTO token_audit_usage (
                    environment, workspace_id, client, event_key,
                    session_fp, turn_fp, audit_run_id, phase, source_mode,
                    input_tokens, cached_input_tokens, cache_write_tokens,
                    output_tokens, reasoning_output_tokens, cache_read_tokens,
                    cache_creation_tokens, provider_total_tokens,
                    normalized_total_tokens, model, effort, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?)
                """,
                (
                    self.environment,
                    self.workspace_id,
                    client,
                    event_key,
                    session_fp,
                    turn_fp,
                    run_id,
                    bucket,
                    source_mode,
                    values["input_tokens"],
                    values["cached_input_tokens"],
                    values["cache_write_tokens"],
                    values["output_tokens"],
                    values["reasoning_output_tokens"],
                    values["cache_read_tokens"],
                    values["cache_creation_tokens"],
                    provider_total,
                    normalized,
                    safe_model,
                    safe_effort,
                    timestamp,
                ),
            )
            if cursor.rowcount != 1:
                return False
            connection.execute(
                """
                DELETE FROM token_audit_usage
                WHERE environment=? AND workspace_id=? AND audit_run_id IS NULL
                  AND created_at<?
                """,
                (
                    self.environment,
                    self.workspace_id,
                    received_at - ORPHAN_RETENTION_SECONDS,
                ),
            )
            if run_id is not None:
                connection.execute(
                    """
                    UPDATE token_audit_sessions SET usage_seen=1, updated_at=?
                    WHERE environment=? AND workspace_id=? AND client=?
                      AND session_fp=? AND audit_run_id=?
                    """,
                    (
                        timestamp,
                        self.environment,
                        self.workspace_id,
                        client,
                        session_fp,
                        run_id,
                    ),
                )
                self._ensure_run_session(
                    connection,
                    run_id,
                    session_fp,
                    is_root=bool(is_root),
                    updated_at=timestamp,
                )
                connection.execute(
                    "UPDATE token_audit_run_sessions SET usage_seen=1, "
                    "updated_at=MAX(updated_at, ?) "
                    "WHERE audit_run_id=? AND session_fp=?",
                    (timestamp, run_id, session_fp),
                )
                connection.execute(
                    """
                    UPDATE token_audit_runs SET
                        model=COALESCE(?, model), effort=COALESCE(?, effort),
                        finalize_after=CASE
                            WHEN state='closing' AND ? IN (
                                'otel','transcript_fallback','mixed'
                            )
                            THEN MAX(COALESCE(finalize_after, 0), ?)
                            ELSE finalize_after
                        END,
                        updated_at=?
                    WHERE audit_run_id=?
                    """,
                    (
                        safe_model,
                        safe_effort,
                        source_mode,
                        received_at + settle_grace,
                        received_at,
                        run_id,
                    ),
                )
                # A late OTLP export may arrive before the first publish claim.
                # Rebuild only that never-attempted payload. Once a request may
                # have reached the server, its idempotency body is immutable.
                queued = connection.execute(
                    """
                    SELECT state, attempts FROM token_audit_outbox
                    WHERE audit_run_id=?
                    """,
                    (run_id,),
                ).fetchone()
                if (
                    queued is not None
                    and queued["state"] == "pending"
                    and int(queued["attempts"]) == 0
                ):
                    connection.execute(
                        "DELETE FROM token_audit_outbox WHERE audit_run_id=?",
                        (run_id,),
                    )
                    connection.execute(
                        """
                        UPDATE token_audit_runs SET state='closing',
                            finalize_after=? WHERE audit_run_id=?
                        """,
                        (received_at + settle_grace, run_id),
                    )
        return True

    def record_activity(
        self,
        client,
        session_fp,
        event_identity,
        kind="tool",
        failed=False,
        is_test=False,
        created_at=None,
    ):
        if not isinstance(event_identity, str) or not event_identity:
            return False
        if kind not in {"tool", "model"}:
            kind = "tool"
        event_key = self.fingerprint(
            "activity-event", client + "\0" + event_identity
        )
        timestamp = time.time() if created_at is None else float(created_at)
        rebuild_outbox = False
        with closing(self.connect()) as connection, connection:
            connection.execute("BEGIN IMMEDIATE")
            run_id, _phase, _is_root = self._assignment_for_timestamp(
                connection, client, session_fp, timestamp
            )
            cursor = connection.execute(
                """
                INSERT INTO token_audit_activity (
                    environment, workspace_id, client, event_key, session_fp,
                    audit_run_id, kind, failed, is_test, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(environment, workspace_id, client, event_key)
                DO UPDATE SET
                    audit_run_id=COALESCE(
                        token_audit_activity.audit_run_id,
                        excluded.audit_run_id
                    ),
                    failed=MAX(token_audit_activity.failed, excluded.failed),
                    is_test=MAX(token_audit_activity.is_test, excluded.is_test)
                """,
                (
                    self.environment,
                    self.workspace_id,
                    client,
                    event_key,
                    session_fp,
                    run_id,
                    kind,
                    1 if failed else 0,
                    1 if is_test else 0,
                    timestamp,
                ),
            )
            connection.execute(
                """
                DELETE FROM token_audit_activity
                WHERE environment=? AND workspace_id=? AND audit_run_id IS NULL
                  AND created_at<?
                """,
                (
                    self.environment,
                    self.workspace_id,
                    time.time() - ORPHAN_RETENTION_SECONDS,
                ),
            )
            if run_id is not None:
                queued = connection.execute(
                    "SELECT o.state, o.attempts, r.source_mode "
                    "FROM token_audit_outbox o JOIN token_audit_runs r "
                    "ON r.audit_run_id=o.audit_run_id "
                    "WHERE o.audit_run_id=?",
                    (run_id,),
                ).fetchone()
                if (
                    queued is not None
                    and queued["state"] == "pending"
                    and int(queued["attempts"]) == 0
                ):
                    grace = (
                        CLAUDE_TRANSCRIPT_GRACE_SECONDS
                        if queued["source_mode"] == "transcript_fallback"
                        else (
                            CLAUDE_EXPORT_GRACE_SECONDS
                            if queued["source_mode"] in {"otel", "mixed"}
                            else 0.0
                        )
                    )
                    connection.execute(
                        "DELETE FROM token_audit_outbox WHERE audit_run_id=?",
                        (run_id,),
                    )
                    connection.execute(
                        "UPDATE token_audit_runs SET state='closing', "
                        "finalize_after=?, updated_at=? WHERE audit_run_id=?",
                        (time.time() + grace, time.time(), run_id),
                    )
                    rebuild_outbox = True
        if rebuild_outbox:
            self.prepare_due_outbox()
        return cursor.rowcount == 1

    def signal_complete(self, client, session_fp, failed=False, grace=0.0):
        with closing(self.connect()) as connection, connection:
            connection.execute("BEGIN IMMEDIATE")
            run_id, _phase, _is_root = self._active_assignment(
                connection, client, session_fp
            )
            if run_id is None:
                return False
            now = time.time()
            if failed:
                session = connection.execute(
                    "SELECT parent_session_fp, is_root, client_version, "
                    "partial_reason FROM token_audit_sessions "
                    "WHERE environment=? AND workspace_id=? AND client=? "
                    "AND session_fp=? AND audit_run_id=?",
                    (
                        self.environment,
                        self.workspace_id,
                        client,
                        session_fp,
                        run_id,
                    ),
                ).fetchone()
                if session is not None:
                    reason = _preferred_partial_reason(
                        session["partial_reason"], "session_interrupted"
                    )
                    connection.execute(
                        "UPDATE token_audit_sessions SET partial_reason=?, "
                        "partial_reason_at=?, updated_at=? WHERE environment=? "
                        "AND workspace_id=? AND client=? AND session_fp=? "
                        "AND audit_run_id=?",
                        (
                            reason,
                            now,
                            now,
                            self.environment,
                            self.workspace_id,
                            client,
                            session_fp,
                            run_id,
                        ),
                    )
                    self._ensure_run_session(
                        connection,
                        run_id,
                        session_fp,
                        parent_session_fp=session["parent_session_fp"],
                        is_root=bool(session["is_root"]),
                        client_version=session["client_version"],
                        updated_at=now,
                    )
                    membership = connection.execute(
                        "SELECT partial_reason FROM token_audit_run_sessions "
                        "WHERE audit_run_id=? AND session_fp=?",
                        (run_id, session_fp),
                    ).fetchone()
                    connection.execute(
                        "UPDATE token_audit_run_sessions SET partial_reason=?, "
                        "updated_at=? WHERE audit_run_id=? AND session_fp=?",
                        (
                            _preferred_partial_reason(
                                membership["partial_reason"]
                                if membership is not None else None,
                                "session_interrupted",
                            ),
                            now,
                            run_id,
                            session_fp,
                        ),
                    )
            cursor = connection.execute(
                """
                UPDATE token_audit_runs SET finalize_after=?,
                    completed_at=COALESCE(completed_at, ?),
                    updated_at=?
                WHERE audit_run_id=? AND state='closing'
                """,
                (now + max(0.0, float(grace)), now, now, run_id),
            )
        if grace <= 0:
            self.prepare_due_outbox()
        return cursor.rowcount > 0

    @staticmethod
    def _raw_count(field, value, semantics):
        return {"field": field, "value": int(value), "semantics": semantics}

    def _build_finalization(self, connection, run, ended_at):
        usage = connection.execute(
            """
            SELECT * FROM token_audit_usage
            WHERE audit_run_id=? ORDER BY created_at, event_key
            """,
            (run["audit_run_id"],),
        ).fetchall()
        activity = connection.execute(
            "SELECT * FROM token_audit_activity WHERE audit_run_id=?",
            (run["audit_run_id"],),
        ).fetchall()
        sessions = connection.execute(
            "SELECT * FROM token_audit_run_sessions WHERE audit_run_id=?",
            (run["audit_run_id"],),
        ).fetchall()

        sums = {
            "input_tokens": 0,
            "cached_input_tokens": 0,
            "cache_write_tokens": 0,
            "output_tokens": 0,
            "reasoning_output_tokens": 0,
            "cache_read_tokens": 0,
            "cache_creation_tokens": 0,
            "provider_total_tokens": 0,
            "normalized_total_tokens": 0,
        }
        # A normal dict preserves insertion order. Usage is selected in
        # provider-request order above, so this is also the first-use order
        # presented in the exported note. Re-entering a bucket adds to the
        # same item instead of creating a second dimension or duplicate row.
        bucket_totals = {}
        source_modes = set()
        models = set()
        efforts = set()
        provider_totals_complete = bool(usage)
        aggregate_overflow = False
        for event in usage:
            for field in sums:
                value = event[field]
                if value is not None:
                    sums[field] += int(value)
            if event["provider_total_tokens"] is None:
                provider_totals_complete = False
            bucket = _safe_bucket(event["phase"])
            if bucket is None:
                # Only a corrupted/foreign database can reach this path;
                # marker ingestion rejects unsafe labels. Preserve the token
                # total without publishing untrusted text and be honest that
                # the result is partial.
                bucket = DEFAULT_BUCKET
                aggregate_overflow = True
            if bucket not in bucket_totals and len(bucket_totals) >= MAX_BUCKETS:
                bucket = (
                    DEFAULT_BUCKET
                    if DEFAULT_BUCKET in bucket_totals
                    else next(iter(bucket_totals))
                )
                aggregate_overflow = True
            bucket_totals.setdefault(bucket, 0)
            bucket_totals[bucket] += int(event["normalized_total_tokens"])
            source_modes.add(event["source_mode"])
            if event["model"]:
                models.add(event["model"])
            if event["effort"]:
                efforts.add(event["effort"])
        for field, value in tuple(sums.items()):
            if value > MAX_SAFE_INTEGER:
                sums[field] = MAX_SAFE_INTEGER
                aggregate_overflow = True
        for bucket, value in tuple(bucket_totals.items()):
            if value > MAX_SAFE_INTEGER:
                bucket_totals[bucket] = MAX_SAFE_INTEGER
                aggregate_overflow = True
        remaining_bucket_tokens = sums["normalized_total_tokens"]
        for bucket in bucket_totals:
            if bucket_totals[bucket] > remaining_bucket_tokens:
                bucket_totals[bucket] = remaining_bucket_tokens
                aggregate_overflow = True
            remaining_bucket_tokens -= bucket_totals[bucket]

        descendants = [item for item in sessions if not bool(item["is_root"])]
        descendants_included = sum(1 for item in descendants if item["usage_seen"])
        main_sessions = [item for item in sessions if bool(item["is_root"])]
        main_seen = any(item["usage_seen"] for item in main_sessions)
        if (
            usage
            and run["client"] == "claude"
            and run["source_mode"] == "otel"
        ):
            # Claude's supported OTel contract emits one root session.id and a
            # query_source category for main/subagent/auxiliary requests; it
            # does not expose the hook's per-child agent_id. The root stream
            # therefore already contains descendant tokens even though they
            # cannot be assigned to individual child rows.
            descendants_included = len(descendants)
        run_reason = run["partial_reason"]
        root_reasons = [
            item["partial_reason"] for item in main_sessions
            if item["partial_reason"]
        ]
        descendant_reasons = [
            item["partial_reason"] for item in descendants
            if item["partial_reason"]
        ]
        if not main_seen:
            main_coverage = "unavailable"
        elif run_reason or root_reasons:
            main_coverage = "partial"
        else:
            main_coverage = "complete"
        if not descendants:
            descendant_coverage = "complete"
        elif not descendants_included:
            descendant_coverage = "unavailable"
        elif (
            descendants_included < len(descendants)
            or run_reason
            or descendant_reasons
        ):
            descendant_coverage = "partial"
        else:
            descendant_coverage = "complete"
        reasons = [
            value for value in (
                run["partial_reason"],
                *(item["partial_reason"] for item in sessions),
            ) if value
        ]
        if descendants_included < len(descendants):
            reasons.append("incomplete_descendant_coverage")
        if aggregate_overflow:
            reasons.append("collector_failure")
        reason = min(
            reasons,
            key=lambda value: PARTIAL_REASON_PRIORITY.get(value, 99),
            default=None,
        )

        normalized_total = sums["normalized_total_tokens"]
        if not usage:
            status = "unavailable"
            reason = reason or "telemetry_unavailable"
            bucket_totals = {}
        elif reason or not main_seen:
            status = "partial"
            reason = reason or "collector_failure"
        else:
            status = "exact"

        provider = run["provider"]
        raw_counts = []
        if provider == "openai":
            scalar_events = sum(
                1 for event in usage
                if event["provider_total_tokens"] is not None
                and all(int(event[field]) == 0 for field in (
                    "input_tokens", "cached_input_tokens",
                    "cache_write_tokens", "output_tokens",
                    "reasoning_output_tokens",
                ))
            )
            if scalar_events != len(usage):
                fresh_input = max(
                    0, sums["input_tokens"] - sums["cached_input_tokens"]
                )
                raw_counts.extend([
                    self._raw_count(
                        "fresh_input_tokens", fresh_input, "fresh_input"
                    ),
                    self._raw_count(
                        "cached_input_tokens",
                        sums["cached_input_tokens"],
                        "cached_input_subset",
                    ),
                    self._raw_count(
                        "output_tokens",
                        sums["output_tokens"],
                        "generated_output",
                    ),
                    self._raw_count(
                        "reasoning_output_tokens",
                        sums["reasoning_output_tokens"],
                        "reasoning_output_subset",
                    ),
                ])
                if sums["cache_write_tokens"]:
                    raw_counts.append(self._raw_count(
                        "cache_write_tokens",
                        sums["cache_write_tokens"],
                        "unknown",
                    ))
            if provider_totals_complete:
                raw_counts.append(self._raw_count(
                    "provider_total_tokens",
                    sums["provider_total_tokens"],
                    "provider_reported_total",
                ))
            if usage and scalar_events == len(usage):
                normalization = "provider_reported_total_v1"
            elif scalar_events:
                normalization = "unknown_v1"
            else:
                normalization = "openai_input_includes_cache_v1"
        elif provider == "anthropic":
            raw_counts.extend([
                self._raw_count(
                    "input_tokens", sums["input_tokens"], "fresh_input"
                ),
                self._raw_count(
                    "cache_read_tokens",
                    sums["cache_read_tokens"],
                    "cache_read_additive",
                ),
                self._raw_count(
                    "cache_creation_tokens",
                    sums["cache_creation_tokens"],
                    "cache_creation_additive",
                ),
                self._raw_count(
                    "output_tokens",
                    sums["output_tokens"],
                    "generated_output",
                ),
            ])
            normalization = "anthropic_input_excludes_cache_v1"
        else:
            raw_counts.append(self._raw_count(
                "normalized_total_tokens", normalized_total, "unknown"
            ))
            normalization = "unknown_v1"

        tool_activity = [item for item in activity if item["kind"] == "tool"]
        model_activity = [item for item in activity if item["kind"] == "model"]
        model_requests = max(len(usage), len(model_activity))
        source_mode = run["source_mode"]
        if len(source_modes) > 1:
            source_mode = "mixed"
        elif source_modes:
            source_mode = next(iter(source_modes))
        model = next(iter(models)) if len(models) == 1 else (
            "multiple" if len(models) > 1 else run["model"]
        )
        effort = next(iter(efforts)) if len(efforts) == 1 else (
            "multiple" if len(efforts) > 1 else run["effort"]
        )
        client_version = run["client_version"]
        if client_version is None:
            client_version = next(
                (item["client_version"] for item in sessions
                 if item["client_version"]),
                None,
            )
        measurement = {
            "status": status,
            "normalization": normalization,
            "raw_counts": raw_counts,
        }
        if status != "unavailable":
            measurement["normalized_total_tokens"] = normalized_total
        if reason:
            measurement["reason_code"] = reason

        started_at = float(run["started_at"])
        return {
            "schema_version": SCHEMA_VERSION,
            "source": {
                "provider": provider,
                "client": run["client"],
                "client_version": _safe_label(client_version),
                "model": _safe_label(model),
                "effort": _safe_label(effort),
                "source_mode": source_mode,
                "session_fingerprint": run["root_session_fp"],
            },
            "window": {
                "started_at": _utc_iso(started_at),
                "ended_at": _utc_iso(ended_at),
                "elapsed_ms": max(0, int((ended_at - started_at) * 1000)),
            },
            "measurement": measurement,
            "buckets": {
                "method": "next_request_marker_v1",
                "items": [
                    {"label": label, "tokens": tokens}
                    for label, tokens in bucket_totals.items()
                ],
            },
            "activity": {
                "model_requests": model_requests,
                "tool_calls": len(tool_activity),
                "tool_failures": sum(1 for item in tool_activity if item["failed"]),
                "test_commands": sum(1 for item in tool_activity if item["is_test"]),
            },
            "coverage": {
                "main_session": main_coverage,
                "descendants": descendant_coverage,
                "descendants_discovered": len(descendants),
                "descendants_included": descendants_included,
            },
        }

    def prepare_due_outbox(self, now=None):
        current = time.time() if now is None else float(now)
        prepared = 0
        with closing(self.connect()) as connection, connection:
            # Acquire the writer lock before selecting due runs so a late
            # event cannot extend a window after we have snapshotted it.
            connection.execute("BEGIN IMMEDIATE")
            rows = connection.execute(
                """
                SELECT * FROM token_audit_runs
                WHERE environment=? AND workspace_id=? AND state='closing'
                  AND handoff_type IS NOT NULL AND finalize_after IS NOT NULL
                  AND finalize_after<=?
                ORDER BY finalize_after
                """,
                (self.environment, self.workspace_id, current),
            ).fetchall()
            for run in rows:
                ended_at = (
                    float(run["completed_at"])
                    if run["completed_at"] is not None
                    else (
                        float(run["closing_at"])
                        if run["closing_at"] is not None
                        else current
                    )
                )
                finalization = self._build_finalization(
                    connection, run, ended_at
                )
                connection.execute(
                    """
                    INSERT INTO token_audit_outbox (
                        audit_run_id, environment, workspace_id, job_id,
                        handoff_type, finalization_json, state, next_attempt_at,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
                    ON CONFLICT(audit_run_id) DO NOTHING
                    """,
                    (
                        run["audit_run_id"],
                        self.environment,
                        self.workspace_id,
                        run["job_id"],
                        run["handoff_type"],
                        _canonical_json(finalization),
                        current,
                        current,
                        current,
                    ),
                )
                connection.execute(
                    """
                    UPDATE token_audit_runs SET state='queued', updated_at=?
                    WHERE audit_run_id=? AND state='closing'
                    """,
                    (current, run["audit_run_id"]),
                )
                prepared += 1
        return prepared

    def claim_outbox(self, now=None):
        current = time.time() if now is None else float(now)
        self.prepare_due_outbox(current)
        with closing(self.connect()) as connection:
            connection.execute("BEGIN IMMEDIATE")
            try:
                row = connection.execute(
                    """
                    SELECT * FROM token_audit_outbox
                    WHERE environment=? AND workspace_id=?
                      AND next_attempt_at<=?
                      AND (state='pending' OR
                        (state='publishing' AND lease_until<?))
                    ORDER BY created_at LIMIT 1
                    """,
                    (
                        self.environment,
                        self.workspace_id,
                        current,
                        current,
                    ),
                ).fetchone()
                if row is None:
                    connection.commit()
                    return None
                try:
                    stored_finalization = json.loads(row["finalization_json"])
                except (TypeError, ValueError):
                    stored_finalization = None
                if (
                    isinstance(stored_finalization, dict)
                    and "buckets" not in stored_finalization
                    and "phases" in stored_finalization
                ):
                    # An immediately previous release may have queued its
                    # fixed phase map before this process started. Rebuild it
                    # from the retained allowlisted usage rows, preserving
                    # first-use ordering and every lifecycle/coverage signal,
                    # instead of publishing the obsolete API shape.
                    run = connection.execute(
                        "SELECT * FROM token_audit_runs WHERE audit_run_id=?",
                        (row["audit_run_id"],),
                    ).fetchone()
                    if run is None:
                        raise RuntimeError(
                            "legacy audit outbox row has no retained run"
                        )
                    ended_at = (
                        float(run["completed_at"])
                        if run["completed_at"] is not None
                        else (
                            float(run["closing_at"])
                            if run["closing_at"] is not None
                            else current
                        )
                    )
                    rebuilt = self._build_finalization(
                        connection, run, ended_at
                    )
                    connection.execute(
                        "UPDATE token_audit_outbox SET finalization_json=?, "
                        "updated_at=? WHERE audit_run_id=?",
                        (
                            _canonical_json(rebuilt),
                            current,
                            row["audit_run_id"],
                        ),
                    )
                    row = connection.execute(
                        "SELECT * FROM token_audit_outbox "
                        "WHERE audit_run_id=?",
                        (row["audit_run_id"],),
                    ).fetchone()
                lease_token = uuid.uuid4().hex
                connection.execute(
                    """
                    UPDATE token_audit_outbox SET state='publishing',
                        lease_until=?, lease_token=?, updated_at=?
                    WHERE audit_run_id=?
                    """,
                    (
                        current + OUTBOX_LEASE_SECONDS,
                        lease_token,
                        current,
                        row["audit_run_id"],
                    ),
                )
                connection.commit()
            except Exception:
                connection.rollback()
                raise
        result = dict(row)
        result["lease_token"] = lease_token
        result["finalization"] = json.loads(result.pop("finalization_json"))
        return result

    def complete_outbox(self, audit_run_id, lease_token):
        if not isinstance(lease_token, str) or not lease_token:
            return False
        now = time.time()
        with closing(self.connect()) as connection, connection:
            cursor = connection.execute(
                """
                UPDATE token_audit_outbox SET state='sent', lease_until=NULL,
                    lease_token=NULL, last_error_code=NULL, updated_at=?
                WHERE audit_run_id=? AND state='publishing'
                  AND lease_token=?
                """,
                (now, audit_run_id, lease_token),
            )
            if cursor.rowcount == 1:
                connection.execute(
                    """
                    UPDATE token_audit_runs SET state='finalized', updated_at=?
                    WHERE audit_run_id=?
                    """,
                    (now, audit_run_id),
                )
                return True
        return False

    def retry_outbox(
        self, audit_run_id, lease_token, error_code="publish_failed"
    ):
        if not isinstance(lease_token, str) or not lease_token:
            return False
        now = time.time()
        with closing(self.connect()) as connection, connection:
            row = connection.execute(
                """
                SELECT attempts FROM token_audit_outbox
                WHERE audit_run_id=? AND state='publishing'
                  AND lease_token=?
                """,
                (audit_run_id, lease_token),
            ).fetchone()
            if row is None:
                return False
            attempts = (int(row["attempts"]) if row is not None else 0) + 1
            delay = min(300, 2 ** min(attempts, 8))
            cursor = connection.execute(
                """
                UPDATE token_audit_outbox SET state='pending', attempts=?,
                    next_attempt_at=?, lease_until=NULL, lease_token=NULL,
                    last_error_code=?, updated_at=?
                WHERE audit_run_id=? AND state='publishing'
                  AND lease_token=?
                """,
                (
                    attempts,
                    now + delay,
                    _safe_label(error_code) or "publish_failed",
                    now,
                    audit_run_id,
                    lease_token,
                ),
            )
        return cursor.rowcount == 1

    def prune_retained(self, now=None):
        """Apply the bounded local retention policy for this workspace.

        Sent rows remain seven days for safe replay/debugging. Runs that never
        reached a durable job note remain recoverable for thirty days from
        audit start, including across opt-out, and are then removed.
        """
        current = time.time() if now is None else float(now)
        finalized_cutoff = current - FINALIZED_RETENTION_SECONDS
        unpublished_cutoff = current - UNPUBLISHED_RETENTION_SECONDS
        orphan_cutoff = current - ORPHAN_RETENTION_SECONDS
        with closing(self.connect()) as connection, connection:
            # Retention competes with hooks, the bridge, and the publisher in
            # separate processes. Select and delete under the same writer lock
            # so a publish claim or late event cannot race a stale snapshot.
            connection.execute("BEGIN IMMEDIATE")
            sent_rows = connection.execute(
                """
                SELECT r.audit_run_id FROM token_audit_runs r
                JOIN token_audit_outbox o
                  ON o.audit_run_id=r.audit_run_id
                WHERE r.environment=? AND r.workspace_id=?
                  AND r.state='finalized' AND o.state='sent'
                  AND r.updated_at<? AND o.updated_at<?
                """,
                (
                    self.environment,
                    self.workspace_id,
                    finalized_cutoff,
                    finalized_cutoff,
                ),
            ).fetchall()
            unpublished_rows = connection.execute(
                """
                SELECT r.audit_run_id FROM token_audit_runs r
                LEFT JOIN token_audit_outbox o
                  ON o.audit_run_id=r.audit_run_id
                WHERE r.environment=? AND r.workspace_id=?
                  AND r.started_at<?
                  AND (r.state!='finalized' OR o.state IS NULL
                       OR o.state!='sent')
                """,
                (
                    self.environment,
                    self.workspace_id,
                    unpublished_cutoff,
                ),
            ).fetchall()
            run_ids = list(dict.fromkeys(
                row["audit_run_id"]
                for row in (*sent_rows, *unpublished_rows)
            ))
            for run_id in run_ids:
                connection.execute(
                    "DELETE FROM token_audit_marker_events WHERE audit_run_id=?",
                    (run_id,),
                )
                connection.execute(
                    "DELETE FROM token_audit_end_events WHERE audit_run_id=?",
                    (run_id,),
                )
                connection.execute(
                    "DELETE FROM token_audit_phase_markers WHERE audit_run_id=?",
                    (run_id,),
                )
                connection.execute(
                    "DELETE FROM token_audit_usage WHERE audit_run_id=?",
                    (run_id,),
                )
                connection.execute(
                    "DELETE FROM token_audit_activity WHERE audit_run_id=?",
                    (run_id,),
                )
                connection.execute(
                    "DELETE FROM token_audit_run_sessions "
                    "WHERE audit_run_id=?",
                    (run_id,),
                )
                connection.execute(
                    "DELETE FROM token_audit_sessions WHERE audit_run_id=?",
                    (run_id,),
                )
                connection.execute(
                    "DELETE FROM token_audit_outbox WHERE audit_run_id=?",
                    (run_id,),
                )
                connection.execute(
                    "DELETE FROM token_audit_runs WHERE audit_run_id=?",
                    (run_id,),
                )
            connection.execute(
                "DELETE FROM token_audit_sessions "
                "WHERE environment=? AND workspace_id=? "
                "AND audit_run_id IS NULL AND updated_at<?",
                (
                    self.environment,
                    self.workspace_id,
                    orphan_cutoff,
                ),
            )
            connection.execute(
                "DELETE FROM token_audit_usage "
                "WHERE environment=? AND workspace_id=? "
                "AND audit_run_id IS NULL AND created_at<?",
                (
                    self.environment,
                    self.workspace_id,
                    orphan_cutoff,
                ),
            )
            connection.execute(
                "DELETE FROM token_audit_activity "
                "WHERE environment=? AND workspace_id=? "
                "AND audit_run_id IS NULL AND created_at<?",
                (
                    self.environment,
                    self.workspace_id,
                    orphan_cutoff,
                ),
            )
            connection.execute(
                "DELETE FROM token_audit_transcripts "
                "WHERE environment=? AND workspace_id=? AND updated_at<?",
                (
                    self.environment,
                    self.workspace_id,
                    finalized_cutoff,
                ),
            )
        return len(run_ids)
    def source_available(self, client, source_mode):
        with closing(self.connect()) as connection:
            row = connection.execute(
                "SELECT available FROM token_audit_source_health "
                "WHERE environment=? AND workspace_id=? AND client=? "
                "AND source_mode=?",
                (
                    self.environment,
                    self.workspace_id,
                    client,
                    source_mode,
                ),
            ).fetchone()
        return None if row is None else bool(row["available"])

    def has_open_runs(self, client, source_mode):
        with closing(self.connect()) as connection:
            row = connection.execute(
                "SELECT 1 FROM token_audit_runs WHERE environment=? "
                "AND workspace_id=? AND client=? AND source_mode=? "
                "AND state IN ('active','closing','queued') LIMIT 1",
                (
                    self.environment,
                    self.workspace_id,
                    client,
                    source_mode,
                ),
            ).fetchone()
        return row is not None

    def set_source_available(
        self, client, source_mode, available, mark_gap=False
    ):
        """Persist collector health and make every overlapping run honest."""
        now = time.time()
        rebuild = False
        with closing(self.connect()) as connection, connection:
            connection.execute(
                """
                INSERT INTO token_audit_source_health (
                    environment, workspace_id, client, source_mode,
                    available, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(environment, workspace_id, client, source_mode)
                DO UPDATE SET available=excluded.available,
                    updated_at=excluded.updated_at
                """,
                (
                    self.environment,
                    self.workspace_id,
                    client,
                    source_mode,
                    1 if available else 0,
                    now,
                ),
            )
            if mark_gap or not available:
                rows = connection.execute(
                    "SELECT audit_run_id, state FROM token_audit_runs "
                    "WHERE environment=? AND workspace_id=? AND client=? "
                    "AND source_mode=? AND state IN ('active','closing','queued')",
                    (
                        self.environment,
                        self.workspace_id,
                        client,
                        source_mode,
                    ),
                ).fetchall()
                for row in rows:
                    run_id = row["audit_run_id"]
                    connection.execute(
                        "UPDATE token_audit_runs SET "
                        "partial_reason=COALESCE(partial_reason, ?), "
                        "updated_at=? WHERE audit_run_id=?",
                        ("telemetry_unavailable", now, run_id),
                    )
                    if row["state"] != "queued":
                        continue
                    outbox = connection.execute(
                        "SELECT state, attempts FROM token_audit_outbox "
                        "WHERE audit_run_id=?",
                        (run_id,),
                    ).fetchone()
                    if (
                        outbox is not None
                        and outbox["state"] == "pending"
                        and int(outbox["attempts"]) == 0
                    ):
                        connection.execute(
                            "DELETE FROM token_audit_outbox WHERE audit_run_id=?",
                            (run_id,),
                        )
                        connection.execute(
                            "UPDATE token_audit_runs SET state='closing', "
                            "finalize_after=?, updated_at=? "
                            "WHERE audit_run_id=?",
                            (now, now, run_id),
                        )
                        rebuild = True
        if rebuild:
            self.prepare_due_outbox(now)


def prune_existing_audit_store(environment, workspace_id):
    """Prune one existing scope without creating storage after opt-out."""
    path = _database_path()
    if not os.path.isfile(path):
        return 0
    return AuditStore(environment, workspace_id, path=path).prune_retained()


def _openai_counts(usage):
    input_tokens = _first_int(usage, "inputTokens", "input_tokens") or 0
    cached = _first_int(
        usage, "cachedInputTokens", "cached_input_tokens"
    ) or 0
    cache_write = _first_int(
        usage,
        "cacheWriteInputTokens",
        "cacheWriteTokens",
        "cache_write_input_tokens",
        "cache_write_tokens",
    ) or 0
    output = _first_int(usage, "outputTokens", "output_tokens") or 0
    reasoning = _first_int(
        usage, "reasoningOutputTokens", "reasoning_output_tokens"
    ) or 0
    provider_total = _first_int(usage, "totalTokens", "total_tokens")
    normalized = provider_total
    if normalized is None:
        normalized = input_tokens + output
    return {
        "input_tokens": input_tokens,
        "cached_input_tokens": min(cached, input_tokens),
        "cache_write_tokens": cache_write,
        "output_tokens": output,
        "reasoning_output_tokens": min(reasoning, output),
        "cache_read_tokens": 0,
        "cache_creation_tokens": 0,
        "provider_total_tokens": provider_total,
        "normalized_total_tokens": normalized,
    }


def _valid_openai_usage(usage):
    """Accept scalar totals or a complete input/output counter shape."""
    if not isinstance(usage, dict):
        return False
    total_names = ("totalTokens", "total_tokens")
    input_names = ("inputTokens", "input_tokens")
    output_names = ("outputTokens", "output_tokens")
    optional_names = (
        "cachedInputTokens", "cached_input_tokens",
        "cacheWriteInputTokens", "cacheWriteTokens",
        "cache_write_input_tokens", "cache_write_tokens",
        "reasoningOutputTokens", "reasoning_output_tokens",
    )
    recognized = total_names + input_names + output_names + optional_names
    for name in recognized:
        if name in usage and _non_negative_int(usage[name]) is None:
            return False
    total = _first_int(usage, *total_names)
    has_input = any(name in usage for name in input_names)
    has_output = any(name in usage for name in output_names)
    has_components = has_input or has_output or any(
        name in usage for name in optional_names
    )
    if has_components and not (has_input and has_output):
        return False
    if has_input and has_output:
        input_tokens = _first_int(usage, *input_names)
        output_tokens = _first_int(usage, *output_names)
        if input_tokens is None or output_tokens is None:
            return False
        if total is None and input_tokens + output_tokens > MAX_SAFE_INTEGER:
            return False
        if total is not None and total != input_tokens + output_tokens:
            return False
        cached = _first_int(
            usage, "cachedInputTokens", "cached_input_tokens"
        )
        reasoning = _first_int(
            usage, "reasoningOutputTokens", "reasoning_output_tokens"
        )
        if cached is not None and cached > input_tokens:
            return False
        if reasoning is not None and reasoning > output_tokens:
            return False
    return total is not None or (has_input and has_output)


def _anthropic_counts(usage):
    input_tokens = _first_int(usage, "input_tokens", "inputTokens") or 0
    output_tokens = _first_int(usage, "output_tokens", "outputTokens") or 0
    cache_read = _first_int(
        usage,
        "cache_read_input_tokens",
        "cache_read_tokens",
        "cacheReadInputTokens",
        "cacheReadTokens",
    ) or 0
    cache_creation = _first_int(
        usage,
        "cache_creation_input_tokens",
        "cache_creation_tokens",
        "cacheCreationInputTokens",
        "cacheCreationTokens",
    ) or 0
    return {
        "input_tokens": input_tokens,
        "cached_input_tokens": 0,
        "cache_write_tokens": 0,
        "output_tokens": output_tokens,
        "reasoning_output_tokens": 0,
        "cache_read_tokens": cache_read,
        "cache_creation_tokens": cache_creation,
        "provider_total_tokens": None,
        "normalized_total_tokens": (
            input_tokens + cache_read + cache_creation + output_tokens
        ),
    }


def _apply_marker(
    store,
    client,
    provider,
    source_mode,
    session_fp,
    tool_name,
    arguments,
    result,
    client_version=None,
    marker_identity=None,
):
    tool_name = _tool_basename(tool_name)
    arguments = arguments if isinstance(arguments, dict) else {}
    structured = _extract_structured_result(result)
    expected_state = {
        "start_job_audit": "active",
        "set_job_audit_phase": "marked",
        "end_job_audit": "pending_finalization",
    }.get(tool_name)
    if (
        expected_state is None
        or not isinstance(structured, dict)
        or structured.get("schema_version") != SCHEMA_VERSION
        or structured.get("state") != expected_state
    ):
        return None
    if tool_name == "start_job_audit":
        run_id = structured.get("audit_run_id")
        job_id = structured.get("canonical_job_id")
        requested_run_id = arguments.get("audit_run_id")
        if requested_run_id is not None and requested_run_id != run_id:
            return None
        if store.start_run(
            client,
            provider,
            source_mode,
            session_fp,
            run_id,
            job_id,
            client_version,
        ):
            return run_id
    elif tool_name == "set_job_audit_phase":
        run_id = structured.get("audit_run_id")
        bucket = structured.get("bucket")
        if (
            arguments.get("audit_run_id") != run_id
            or arguments.get("bucket") != bucket
        ):
            return None
        requested_sequence = arguments.get("marker_sequence")
        returned_sequence = structured.get("marker_sequence")
        if (
            requested_sequence is not None
            and returned_sequence is not None
            and returned_sequence != requested_sequence
        ):
            return None
        canonical_sequence = (
            requested_sequence
            if requested_sequence is not None
            else returned_sequence
        )
        if (
            canonical_sequence is not None
            and (
                _non_negative_int(canonical_sequence) is None
                or int(canonical_sequence) < 1
            )
        ):
            return None
        if store.set_bucket(
            run_id,
            bucket,
            canonical_sequence,
            marker_identity=marker_identity,
            client=client,
            session_fp=session_fp,
            job_id=structured.get("canonical_job_id"),
        ):
            return run_id
    elif tool_name == "end_job_audit":
        # The collector's own finalization never travels through this path.
        if "finalization" in arguments:
            return None
        run_id = structured.get("audit_run_id")
        handoff = structured.get("handoff_type")
        if (
            arguments.get("audit_run_id") != run_id
            or arguments.get("handoff_type") != handoff
        ):
            return None
        if store.request_end(
            run_id,
            handoff,
            client=client,
            session_fp=session_fp,
            job_id=structured.get("canonical_job_id"),
            marker_identity=marker_identity,
        ):
            return run_id
    return None


def _partial_reason(reason):
    text = str(reason or "").lower()
    if "descendant" in text or "subagent" in text:
        return "incomplete_descendant_coverage"
    if "unsupported" in text or "version" in text or "schema" in text:
        return "unsupported_client_version"
    if any(word in text for word in ("disconnect", "reconnect", "interrupt", "stopfailure")):
        return "session_interrupted"
    if "telemetry" in text or "export" in text:
        return "telemetry_unavailable"
    if text:
        return "collector_failure"
    return "unknown"


def _process_start_token(pid):
    """Return a Linux PID-reuse token, or ``None`` where TTL is the guard."""
    if not sys.platform.startswith("linux"):
        return None
    try:
        with open(
            "/proc/{}/stat".format(int(pid)), "r", encoding="ascii"
        ) as source:
            value = source.read(4096)
    except (OSError, UnicodeError, ValueError):
        return None
    close_paren = value.rfind(")")
    if close_paren < 0:
        return None
    fields = value[close_paren + 1:].split()
    # proc(5): the first post-command field is state (#3), and starttime is
    # field #22. Its kernel clock-tick value is stable for the process life.
    if len(fields) <= 19 or fields[0] in {"Z", "X", "x"}:
        return None
    return fields[19]


def _process_is_alive(pid):
    if not isinstance(pid, int) or isinstance(pid, bool) or pid <= 1:
        return False
    try:
        os.kill(pid, 0)
    except (OSError, ValueError):
        return False
    if sys.platform.startswith("linux"):
        return _process_start_token(pid) is not None
    return True


def codex_collector_ready(path, owner, now=None):
    """Validate one launch-scoped bridge collector lease fail-closed."""
    if not isinstance(path, str) or not path:
        return False
    if not isinstance(owner, str) or not owner:
        return False
    current = time.time() if now is None else float(now)
    try:
        metadata = os.lstat(path)
        if not stat.S_ISREG(metadata.st_mode) or metadata.st_mode & 0o077:
            return False
        if hasattr(os, "geteuid") and metadata.st_uid != os.geteuid():
            return False
        if (
            metadata.st_mtime > current + 5
            or current - metadata.st_mtime > CODEX_COLLECTOR_READY_TTL_SECONDS
        ):
            return False
        flags = os.O_RDONLY
        if hasattr(os, "O_NOFOLLOW"):
            flags |= os.O_NOFOLLOW
        descriptor = os.open(path, flags)
        try:
            raw = os.read(descriptor, 4097)
        finally:
            os.close(descriptor)
        if len(raw) > 4096:
            return False
        payload = json.loads(raw.decode("utf-8"))
    except (OSError, UnicodeError, ValueError, TypeError):
        return False
    if (
        not isinstance(payload, dict)
        or payload.get("schema_version") != 1
        or payload.get("owner") != owner
    ):
        return False
    pid = payload.get("pid")
    refreshed_at = payload.get("refreshed_at")
    if (
        not isinstance(refreshed_at, (int, float))
        or isinstance(refreshed_at, bool)
        or refreshed_at > current + 5
        or current - float(refreshed_at) > CODEX_COLLECTOR_READY_TTL_SECONDS
        or not _process_is_alive(pid)
    ):
        return False
    actual_start = _process_start_token(pid)
    recorded_start = payload.get("process_start_token")
    if sys.platform.startswith("linux"):
        return (
            isinstance(recorded_start, str)
            and actual_start is not None
            and secrets.compare_digest(recorded_start, actual_start)
        )
    return recorded_start is None


class CodexCollectorLease:
    """Private, launch-scoped proof that the Codex observer is alive."""

    def __init__(self, path=None, owner=None):
        self.path = path
        self.owner = owner
        self.pid = os.getpid()
        self.process_start_token = _process_start_token(self.pid)
        self.last_refresh = None

    @property
    def configured(self):
        return (
            isinstance(self.path, str) and bool(self.path)
            and isinstance(self.owner, str) and bool(self.owner)
        )

    def publish(self, force=False):
        if not self.configured:
            return False
        monotonic_now = time.monotonic()
        if (
            not force
            and self.last_refresh is not None
            and monotonic_now - self.last_refresh
            < CODEX_COLLECTOR_READY_TTL_SECONDS / 3
        ):
            return True
        directory = os.path.dirname(self.path) or "."
        descriptor, temporary_path = tempfile.mkstemp(
            prefix=".token-audit-ready-", dir=directory
        )
        payload = _canonical_json({
            "schema_version": 1,
            "owner": self.owner,
            "pid": self.pid,
            "process_start_token": self.process_start_token,
            "refreshed_at": time.time(),
        }).encode("utf-8") + b"\n"
        try:
            os.chmod(temporary_path, 0o600)
            with os.fdopen(descriptor, "wb") as destination:
                destination.write(payload)
                destination.flush()
                os.fsync(destination.fileno())
            os.replace(temporary_path, self.path)
            try:
                os.chmod(self.path, 0o600)
            except OSError:
                pass
        finally:
            try:
                os.unlink(temporary_path)
            except FileNotFoundError:
                pass
        self.last_refresh = monotonic_now
        return True

    def close(self):
        if not self.configured:
            return
        try:
            os.unlink(self.path)
        except FileNotFoundError:
            pass
        self.last_refresh = None


class CodexTokenAudit:
    """Fast, thread-safe observer used by the private Codex bridge."""

    def __init__(
        self,
        environment,
        workspace_id,
        client_version=None,
        ready_file=None,
        ready_owner=None,
    ):
        self.store = AuditStore(environment, workspace_id)
        self.client = "codex"
        self.provider = "openai"
        self.client_version = _safe_label(client_version)
        self.primary_thread_id = None
        self.primary_session_fp = None
        self.model = None
        self.effort = None
        self._descendants = queue.Queue()
        self._raw_usage_signatures = set()
        self._live_turns = set()
        self._thread_metadata = {}
        self._lock = threading.RLock()
        self._ready_lease = CodexCollectorLease(ready_file, ready_owner)

    def mark_ready(self):
        return self._ready_lease.publish(force=True)

    def refresh_ready(self):
        return self._ready_lease.publish()

    def revoke_ready(self):
        self._ready_lease.close()

    def set_primary_thread(self, thread):
        if not isinstance(thread, dict):
            return
        thread_id = thread.get("id") or thread.get("threadId")
        if not isinstance(thread_id, str) or not thread_id:
            return
        session_fp = self.store.fingerprint("codex-thread", thread_id)
        active_turn_id = thread.get("activeTurnId")
        with self._lock:
            previous_session_fp = self.primary_session_fp
            self.primary_thread_id = thread_id
            self.primary_session_fp = session_fp
            self.client_version = _safe_label(
                thread.get("cliVersion")
                or thread.get("clientVersion")
                or thread.get("version")
            ) or self.client_version
            self.model = _safe_label(thread.get("model")) or self.model
            self.effort = _safe_label(
                thread.get("reasoningEffort") or thread.get("effort")
            ) or self.effort
            self._thread_metadata[thread_id] = (self.model, self.effort)
        # An authoritative resume/fork/start can move the TUI's active lane to
        # another Codex thread while the same job audit is still open. Carry
        # that run to the new primary so subsequent usage and marker calls do
        # not become orphaned. Never overwrite a different active run already
        # bound to the destination thread; in that ambiguous case the old run
        # remains resumable and is explicitly partial.
        previous_run = (
            self.store.session_run(self.client, previous_session_fp)
            if previous_session_fp is not None
            and previous_session_fp != session_fp
            else None
        )
        destination_run = self.store.session_run(self.client, session_fp)
        resumed_open_run = (
            previous_session_fp is None
            and destination_run is not None
            and destination_run.get("state") in {"active", "closing"}
        )
        carried_run_id = None
        if (
            previous_run is not None
            and previous_run.get("state") in {"active", "closing"}
        ):
            if (
                destination_run is None
                or destination_run.get("audit_run_id")
                == previous_run.get("audit_run_id")
            ):
                carried_run_id = previous_run.get("audit_run_id")
            else:
                self.store.mark_partial(
                    self.client,
                    previous_session_fp,
                    "session_interrupted",
                )
                if previous_run.get("state") == "active":
                    self.store.request_end(
                        previous_run.get("audit_run_id"),
                        "interrupted",
                        client=self.client,
                        session_fp=previous_session_fp,
                    )
                # The destination already belongs to another run, so A cannot
                # be carried forward. Finalize its existing/interrupt handoff
                # now instead of leaving an unreachable active run forever.
                self.store.signal_complete(
                    self.client, previous_session_fp, failed=True
                )
        self.store.bind_session(
            self.client,
            session_fp,
            audit_run_id=carried_run_id,
            is_root=True,
            client_version=self.client_version,
        )
        if isinstance(active_turn_id, str) and active_turn_id:
            with self._lock:
                self._live_turns.add((thread_id, active_turn_id))
            if carried_run_id is not None or resumed_open_run:
                # The observer attached after this turn's start event. Standard
                # snapshots remain useful, but raw-response continuity across
                # the handoff cannot be proven.
                self.store.mark_partial(
                    self.client, session_fp, "session_interrupted"
                )
        if resumed_open_run:
            # This observer did not witness the prior bridge interval. Codex
            # resume/fork does not restore experimental raw-response events for
            # an already-live turn, so continuity cannot be proven even though
            # the durable run can continue.
            self.store.mark_partial(
                self.client, session_fp, "session_interrupted"
            )

    def _thread(self, params):
        thread_id = params.get("threadId") if isinstance(params, dict) else None
        if not isinstance(thread_id, str) or not thread_id:
            with self._lock:
                thread_id = self.primary_thread_id
        session_fp = self.store.fingerprint("codex-thread", thread_id)
        return thread_id, session_fp

    @staticmethod
    def _item_identity(item, params):
        item_id = item.get("id") if isinstance(item, dict) else None
        if isinstance(item_id, str) and item_id:
            return item_id
        allowlisted = {
            "thread": params.get("threadId"),
            "turn": params.get("turnId"),
            "type": item.get("type") if isinstance(item, dict) else None,
            "tool": item.get("tool") if isinstance(item, dict) else None,
        }
        return hashlib.sha256(_canonical_json(allowlisted).encode()).hexdigest()

    @staticmethod
    def _usage_signature(thread_id, turn_id, counts):
        return (
            thread_id,
            turn_id,
            counts["input_tokens"],
            counts["cached_input_tokens"],
            counts["cache_write_tokens"],
            counts["output_tokens"],
            counts["reasoning_output_tokens"],
            counts["provider_total_tokens"],
            counts["normalized_total_tokens"],
        )

    def _observe_descendants(self, item, parent_fp):
        if not isinstance(item, dict) or item.get("type") != "collabAgentToolCall":
            return
        receiver_ids = item.get("receiverThreadIds")
        if not isinstance(receiver_ids, list):
            return
        for thread_id in receiver_ids:
            if not isinstance(thread_id, str) or not thread_id:
                continue
            with self._lock:
                if thread_id == self.primary_thread_id:
                    continue
                self._thread_metadata[thread_id] = (
                    _safe_label(item.get("model")) or self.model,
                    _safe_label(
                        item.get("reasoningEffort") or item.get("effort")
                    ) or self.effort,
                )
            child_fp = self.store.fingerprint("codex-thread", thread_id)
            self.store.discover_descendant(
                self.client, parent_fp, child_fp
            )
            # receiverThreadIds are delivered after child creation, while the
            # auxiliary app-server subscription is asynchronous. A child can
            # issue a request before that subscription is acknowledged; later
            # captured usage cannot prove the earlier interval was complete.
            self.store.mark_partial(
                self.client,
                child_fp,
                "incomplete_descendant_coverage",
            )
            self._descendants.put(thread_id)

    def observe_notification(self, message):
        if not isinstance(message, dict):
            return
        method = message.get("method")
        params = message.get("params")
        if not isinstance(params, dict):
            return
        thread_id, session_fp = self._thread(params)
        if session_fp is not None:
            with self._lock:
                is_root = thread_id == self.primary_thread_id
            self.store.bind_session(
                self.client,
                session_fp,
                is_root=is_root,
                client_version=self.client_version,
            )

        if method == "turn/started":
            turn_id = params.get("turn", {}).get("id") if isinstance(
                params.get("turn"), dict
            ) else params.get("turnId")
            if isinstance(turn_id, str) and turn_id:
                with self._lock:
                    self._live_turns.add((thread_id, turn_id))
            return

        if method == "rawResponse/completed":
            usage = params.get("usage")
            response_id = params.get("responseId")
            if not isinstance(usage, dict) or not isinstance(response_id, str):
                self.store.mark_partial(
                    self.client, session_fp, "collector_failure"
                )
                return
            if not _valid_openai_usage(usage):
                self.store.mark_partial(
                    self.client,
                    session_fp,
                    "unsupported_client_version",
                )
                return
            turn_id = params.get("turnId")
            turn_fp = self.store.fingerprint("codex-turn", turn_id)
            with self._lock:
                thread_model, thread_effort = self._thread_metadata.get(
                    thread_id, (self.model, self.effort)
                )
            model = _safe_label(params.get("model")) or thread_model
            effort = _safe_label(
                params.get("reasoningEffort") or params.get("effort")
            ) or thread_effort
            counts = _openai_counts(usage)
            with self._lock:
                self._raw_usage_signatures.add(
                    self._usage_signature(thread_id, turn_id, counts)
                )
                if len(self._raw_usage_signatures) > 2048:
                    self._raw_usage_signatures.clear()
            self.store.record_usage(
                self.client,
                session_fp,
                str(thread_id) + "\0" + response_id,
                counts,
                "native",
                turn_fp=turn_fp,
                model=model,
                effort=effort,
            )
            return

        if method == "thread/tokenUsage/updated":
            token_usage = params.get("tokenUsage")
            last = token_usage.get("last") if isinstance(token_usage, dict) else None
            total = token_usage.get("total") if isinstance(token_usage, dict) else None
            if not isinstance(last, dict) or not isinstance(total, dict):
                return
            if not _valid_openai_usage(last) or not _valid_openai_usage(total):
                self.store.mark_partial(
                    self.client,
                    session_fp,
                    "unsupported_client_version",
                )
                return
            turn_id = params.get("turnId")
            with self._lock:
                if (thread_id, turn_id) not in self._live_turns:
                    # thread/resume replays the previous persisted cumulative
                    # snapshot. It is a baseline, not usage by this job.
                    return
            counts = _openai_counts(last)
            signature = self._usage_signature(thread_id, turn_id, counts)
            with self._lock:
                if signature in self._raw_usage_signatures:
                    self._raw_usage_signatures.discard(signature)
                    return
            # Resume/fork cannot request experimental raw events in Codex
            # 0.146. The standard last-request snapshot preserves useful
            # totals, while the explicit partial status avoids claiming raw
            # response-level completeness.
            identity = _canonical_json({
                "thread": thread_id,
                "turn": turn_id,
                "last": counts,
                "cumulative": _openai_counts(total),
            })
            turn_fp = self.store.fingerprint(
                "codex-turn", params.get("turnId")
            )
            with self._lock:
                thread_model, thread_effort = self._thread_metadata.get(
                    thread_id, (self.model, self.effort)
                )
            self.store.record_usage(
                self.client,
                session_fp,
                "snapshot\0" + identity,
                counts,
                "native",
                turn_fp=turn_fp,
                model=thread_model,
                effort=thread_effort,
            )
            self.store.mark_partial(
                self.client, session_fp, "telemetry_unavailable"
            )
            return

        if method in ("item/started", "item/completed"):
            item = params.get("item")
            if not isinstance(item, dict):
                return
            self._observe_descendants(item, session_fp)
            if method != "item/completed":
                return
            item_type = item.get("type")
            identity = self._item_identity(item, params)
            status = str(item.get("status") or "completed").lower()
            failed = status in {"failed", "error", "cancelled"}
            is_test = False
            if item_type == "commandExecution":
                command = item.get("command")
                if isinstance(command, str):
                    is_test = bool(TEST_COMMAND.search(command))
            if item_type in {
                "mcpToolCall", "commandExecution", "webSearch", "fileChange",
                "collabAgentToolCall", "dynamicToolCall",
            }:
                marker = None
                if item_type == "mcpToolCall" and item.get("server") == "Uclusion":
                    marker = _tool_basename(item.get("tool"))
                    if marker and not failed:
                        _apply_marker(
                            self.store,
                            self.client,
                            self.provider,
                            "native",
                            session_fp,
                            marker,
                            item.get("arguments"),
                            item.get("result"),
                            self.client_version,
                            marker_identity=identity,
                        )
                self.store.record_activity(
                    self.client,
                    session_fp,
                    identity,
                    failed=failed,
                    is_test=is_test,
                )
            return

        if method == "turn/completed":
            turn = params.get("turn")
            turn_id = (
                turn.get("id")
                if isinstance(turn, dict)
                else params.get("turnId")
            )
            status = str((
                turn.get("status")
                if isinstance(turn, dict)
                else params.get("status")
            ) or "completed").lower()
            with self._lock:
                is_primary = thread_id == self.primary_thread_id
            if is_primary:
                self.store.signal_complete(
                    self.client,
                    session_fp,
                    failed=status in {"failed", "cancelled", "interrupted"},
                )
            with self._lock:
                self._live_turns.discard((thread_id, turn_id))

    def drain_descendant_thread_ids(self):
        result = []
        while True:
            try:
                result.append(self._descendants.get_nowait())
            except queue.Empty:
                return tuple(result)

    def mark_partial(self, reason):
        with self._lock:
            session_fp = self.primary_session_fp
        self.store.mark_partial(
            self.client, session_fp, _partial_reason(reason)
        )

    def close(self):
        # Persisting each event synchronously makes shutdown intentionally
        # boring. A closing run without turn/completed is finalized as partial;
        # an active run remains resumable in a later bridge process.
        with self._lock:
            session_fp = self.primary_session_fp
        try:
            run = self.store.session_run(self.client, session_fp)
            if run is not None and run.get("state") == "closing":
                self.store.mark_partial(
                    self.client, session_fp, "session_interrupted"
                )
                self.store.signal_complete(self.client, session_fp, failed=True)
        finally:
            self._ready_lease.close()


def _transcript_position(store, session_fp, path_fp):
    with closing(store.connect()) as connection:
        row = connection.execute(
            """
            SELECT byte_offset FROM token_audit_transcripts
            WHERE environment=? AND workspace_id=? AND session_fp=? AND path_fp=?
            """,
            (store.environment, store.workspace_id, session_fp, path_fp),
        ).fetchone()
    return int(row["byte_offset"]) if row is not None else 0


def _save_transcript_position(store, session_fp, path_fp, offset, schema_state):
    with closing(store.connect()) as connection, connection:
        connection.execute(
            """
            INSERT INTO token_audit_transcripts (
                environment, workspace_id, session_fp, path_fp, byte_offset,
                schema_state, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(environment, workspace_id, session_fp, path_fp)
            DO UPDATE SET byte_offset=excluded.byte_offset,
                schema_state=excluded.schema_state,
                updated_at=excluded.updated_at
            """,
            (
                store.environment,
                store.workspace_id,
                session_fp,
                path_fp,
                int(offset),
                schema_state,
                time.time(),
            ),
        )


def _event_timestamp(value):
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        timestamp = float(value)
    elif isinstance(value, str):
        try:
            timestamp = datetime.fromisoformat(
                value.strip().replace("Z", "+00:00")
            ).timestamp()
        except (TypeError, ValueError, OverflowError):
            return None
    else:
        return None
    if not 946684800 <= timestamp <= time.time() + 24 * 60 * 60:
        return None
    return timestamp


def scan_claude_transcript(store, session_fp, transcript_path):
    """Incrementally consume only known Claude JSONL record shapes."""
    if session_fp is None or not isinstance(transcript_path, str):
        return
    run_before_scan = store.session_run("claude", session_fp)
    scan_boundary = (
        float(run_before_scan["completed_at"])
        if run_before_scan is not None
        and run_before_scan.get("completed_at") is not None
        else None
    )
    path = os.path.abspath(os.path.expanduser(transcript_path))
    try:
        file_stat = os.stat(path)
    except OSError:
        store.mark_partial(
            "claude", session_fp, "telemetry_unavailable",
            event_time=scan_boundary,
        )
        return
    if not stat.S_ISREG(file_stat.st_mode):
        store.mark_partial(
            "claude", session_fp, "telemetry_unavailable",
            event_time=scan_boundary,
        )
        return
    path_fp = store.fingerprint("claude-transcript-path", path)
    offset = _transcript_position(store, session_fp, path_fp)
    if offset > file_stat.st_size:
        offset = 0
        store.mark_partial(
            "claude", session_fp, "session_interrupted",
            event_time=scan_boundary,
        )
    if file_stat.st_size - offset <= 0:
        return
    schema_state = "known"
    consumed = offset
    run_active_before_scan = run_before_scan is not None
    run_started_at = (
        float(run_before_scan["started_at"])
        if run_before_scan is not None else None
    )
    deferred_activity = {}
    deferred_order = []
    target_size = file_stat.st_size
    with open(path, "rb") as source:
        source.seek(consumed)
        pending = b""
        while source.tell() < target_size:
            data = source.read(min(
                TRANSCRIPT_SCAN_CHUNK, target_size - source.tell()
            ))
            if not data:
                break
            pending += data
            last_newline = pending.rfind(b"\n")
            if last_newline < 0:
                if len(pending) >= MAX_TRANSCRIPT_READ:
                    # A single record beyond the bounded reader cannot be
                    # interpreted safely. Advance past this snapshot and make
                    # the undercount explicit instead of looping forever.
                    consumed += len(pending)
                    pending = b""
                    schema_state = "unsupported"
                    store.mark_partial(
                        "claude", session_fp, "unsupported_client_version",
                        event_time=scan_boundary,
                    )
                    _save_transcript_position(
                        store, session_fp, path_fp, consumed, schema_state
                    )
                continue
            complete = pending[:last_newline + 1]
            pending = pending[last_newline + 1:]
            consumed += len(complete)
            for raw_line in complete.splitlines():
                if not raw_line.strip():
                    continue
                try:
                    record = json.loads(raw_line.decode("utf-8"))
                except (UnicodeDecodeError, ValueError):
                    schema_state = "unsupported"
                    continue
                if not isinstance(record, dict):
                    continue
                record_type = record.get("type")
                message = record.get("message")
                record_time = _event_timestamp(record.get("timestamp"))
                if record_type == "assistant" and not isinstance(message, dict):
                    schema_state = "unsupported"
                    continue
                if record_type == "assistant":
                    version = record.get("version")
                    if not (
                        isinstance(version, str)
                        and SUPPORTED_CLAUDE_TRANSCRIPT_VERSION.fullmatch(version)
                    ):
                        schema_state = "unsupported"
                    else:
                        store.bind_session(
                            "claude", session_fp, client_version=version
                        )
                    identity = (
                        record.get("requestId")
                        or record.get("request_id")
                        or message.get("id")
                        or record.get("uuid")
                    )
                    if not isinstance(identity, str) or not identity:
                        # Retain best-effort totals, but raw-line hashing cannot
                        # prove that two identical requests are distinct.
                        identity = hashlib.sha256(raw_line).hexdigest()
                        schema_state = "unsupported"
                    usage = message.get("usage")
                    if usage is not None:
                        if not isinstance(usage, dict) or any(
                            _non_negative_int(usage.get(name)) is None
                            for name in ("input_tokens", "output_tokens")
                        ):
                            schema_state = "unsupported"
                        else:
                            if record_time is None:
                                store.mark_partial(
                                    "claude", session_fp, "collector_failure",
                                    event_time=scan_boundary,
                                )
                            if any(
                                _non_negative_int(usage.get(name)) is None
                                for name in (
                                    "cache_read_input_tokens",
                                    "cache_creation_input_tokens",
                                )
                            ):
                                schema_state = "unsupported"
                            counts = _anthropic_counts(usage)
                            if _non_negative_int(
                                counts.get("normalized_total_tokens")
                            ) is None:
                                schema_state = "unsupported"
                            else:
                                store.record_usage(
                                    "claude",
                                    session_fp,
                                    identity,
                                    counts,
                                    "transcript_fallback",
                                    model=message.get("model"),
                                    created_at=record_time,
                                )
                    content = message.get("content")
                    if isinstance(content, list):
                        for item in content:
                            if (
                                not isinstance(item, dict)
                                or item.get("type") != "tool_use"
                            ):
                                continue
                            tool_id = item.get("id")
                            if not isinstance(tool_id, str) or not tool_id:
                                continue
                            is_test = False
                            if item.get("name") in {
                                "Bash", "bash", "shell", "Shell"
                            }:
                                tool_input = item.get("input")
                                command = (
                                    tool_input.get("command")
                                    if isinstance(tool_input, dict)
                                    else None
                                )
                                if isinstance(command, str):
                                    is_test = bool(TEST_COMMAND.search(command))
                            record_in_run = (
                                run_active_before_scan
                                and (
                                    record_time is None
                                    or record_time >= run_started_at
                                )
                            )
                            if record_in_run:
                                store.record_activity(
                                    "claude",
                                    session_fp,
                                    tool_id,
                                    is_test=is_test,
                                    created_at=record_time,
                                )
                            elif (
                                run_started_at is not None
                                and record_time is not None
                                and record_time
                                >= run_started_at - START_REQUEST_BACKFILL_SECONDS
                            ):
                                deferred_activity.setdefault(identity, {})[
                                    tool_id
                                ] = {
                                    "failed": False,
                                    "is_test": is_test,
                                    "created_at": record_time,
                                }
                                if identity not in deferred_order:
                                    deferred_order.append(identity)
                elif record_type == "user" and isinstance(message, dict):
                    content = message.get("content")
                    if not isinstance(content, list):
                        continue
                    for item in content:
                        if (
                            not isinstance(item, dict)
                            or item.get("type") != "tool_result"
                        ):
                            continue
                        tool_id = item.get("tool_use_id")
                        if (
                            isinstance(tool_id, str)
                            and item.get("is_error") is True
                        ):
                            record_in_run = (
                                run_active_before_scan
                                and (
                                    record_time is None
                                    or record_time >= run_started_at
                                )
                            )
                            if record_in_run:
                                store.record_activity(
                                    "claude",
                                    session_fp,
                                    tool_id,
                                    failed=True,
                                    created_at=record_time,
                                )
                            elif deferred_order:
                                group = deferred_activity.setdefault(
                                    deferred_order[-1], {}
                                )
                                values = group.setdefault(
                                    tool_id,
                                    {
                                        "failed": False,
                                        "is_test": False,
                                        "created_at": record_time,
                                    },
                                )
                                values["failed"] = True
            # Checkpoint every bounded chunk rather than only after the full
            # snapshot. A hook killed at its deadline resumes from the last
            # complete JSONL record instead of restarting a large transcript.
            store.backfill_start_request("claude", session_fp)
            # Pre-start tool activity is deliberately held until we know which
            # request invoked start. Do not checkpoint past that in-memory
            # evidence: if the bounded hook is killed, the next scan must
            # replay it rather than permanently undercount activity.
            if not deferred_order:
                _save_transcript_position(
                    store, session_fp, path_fp, consumed, schema_state
                )
            if schema_state != "known":
                store.mark_partial(
                    "claude", session_fp, "unsupported_client_version",
                    event_time=scan_boundary,
                )
    if deferred_order:
        for tool_id, values in deferred_activity.get(
            deferred_order[-1], {}
        ).items():
            store.record_activity(
                "claude",
                session_fp,
                tool_id,
                failed=values["failed"],
                is_test=values["is_test"],
                created_at=max(
                    values.get("created_at") or run_started_at,
                    run_started_at,
                ),
            )
    store.backfill_start_request("claude", session_fp)
    _save_transcript_position(
        store, session_fp, path_fp, consumed, schema_state
    )
    if schema_state != "known":
        store.mark_partial(
            "claude", session_fp, "unsupported_client_version",
            event_time=scan_boundary,
        )


def _claude_session_fingerprint(store, payload):
    session_id = payload.get("session_id") or payload.get("sessionId")
    if not isinstance(session_id, str) or not session_id:
        return None, None
    root_fp = store.fingerprint("claude-session", session_id)
    agent_id = payload.get("agent_id") or payload.get("agentId")
    if isinstance(agent_id, str) and agent_id:
        return root_fp, store.fingerprint(
            "claude-subagent", session_id + "\0" + agent_id
        )
    return root_fp, root_fp


def process_claude_hook(environment, workspace_id, source_mode, payload):
    store = AuditStore(environment, workspace_id)
    root_fp, session_fp = _claude_session_fingerprint(store, payload)
    event = payload.get("hook_event_name") or payload.get("hookEventName")
    client_version = _safe_label(
        payload.get("client_version")
        or payload.get("clientVersion")
        or payload.get("version")
    )
    if session_fp is not None:
        store.bind_session(
            "claude",
            session_fp,
            parent_session_fp=(root_fp if session_fp != root_fp else None),
            is_root=session_fp == root_fp,
            client_version=client_version,
        )
    if event == "SubagentStart" and session_fp != root_fp:
        store.discover_descendant("claude", root_fp, session_fp)

    transcript_path = (
        payload.get("agent_transcript_path")
        or payload.get("transcript_path")
        or payload.get("transcriptPath")
    )
    source_value = (
        "transcript_fallback" if source_mode == "transcript" else "otel"
    )
    if event == "PostToolUse":
        tool_name = _tool_basename(
            payload.get("tool_name") or payload.get("toolName")
        )
        if tool_name:
            arguments = payload.get("tool_input") or payload.get("toolInput")
            result = payload.get("tool_response") or payload.get("toolResponse")
            identity = payload.get("tool_use_id") or payload.get("toolUseId")
            if not isinstance(identity, str) or not identity:
                identity = _canonical_json({
                    "event": event,
                    "tool": tool_name,
                    "run": (
                        arguments.get("audit_run_id")
                        if isinstance(arguments, dict) else None
                    ),
                    "time": payload.get("timestamp"),
                })
            _apply_marker(
                store,
                "claude",
                "anthropic",
                source_value,
                session_fp,
                tool_name,
                arguments,
                result,
                client_version,
                marker_identity=identity,
            )
            store.record_activity("claude", session_fp, identity)

    if event == "UserPromptSubmit" and session_fp == root_fp:
        prior_run = store.session_run("claude", session_fp)
        if prior_run is not None and prior_run.get("state") == "closing":
            # Claude does not emit Stop when the user interrupts. The next
            # prompt is therefore the first durable proof that the prior final
            # response ended without its lifecycle hook. Close it as partial
            # before any usage from this new turn can be assigned to it.
            store.mark_partial(
                "claude", session_fp, "session_interrupted"
            )
            store.signal_complete(
                "claude",
                session_fp,
                failed=True,
                grace=(
                    CLAUDE_EXPORT_GRACE_SECONDS
                    if source_mode == "otel"
                    else CLAUDE_TRANSCRIPT_GRACE_SECONDS
                ),
            )

    if source_mode == "transcript" and event in {
        "Stop", "SessionEnd", "StopFailure"
    }:
        # Arm the durable completion boundary before scanning. Transcript
        # hooks are capped at 60 seconds by the installer; if a first scan is
        # killed, checkpoints remain resumable and the publisher still has a
        # conservative window before it finalizes the partial measurement.
        store.mark_partial(
            "claude", session_fp,
            (
                "session_interrupted"
                if event == "StopFailure"
                else "telemetry_unavailable"
            ),
        )
        store.signal_complete(
            "claude",
            session_fp,
            failed=event == "StopFailure",
            grace=CLAUDE_TRANSCRIPT_HOOK_DEADLINE_GRACE_SECONDS,
        )

    if source_mode == "transcript" and event in {
        "PostToolUse", "SubagentStop", "Stop", "StopFailure", "SessionEnd"
    }:
        # Marker state is durable before a potentially large first transcript
        # scan. If Claude reaches the hook timeout, a later hook can resume the
        # scan without losing the accepted start/bucket/end operation.
        scan_claude_transcript(store, session_fp, transcript_path)

    if event in {"Stop", "SessionEnd"}:
        # Only the root lifecycle completes the job handoff. A child can stop
        # after the root has issued end_job_audit but before the root's final
        # response is finished; treating that SubagentStop as completion would
        # publish too early and omit the rest of the root turn.
        if source_mode == "transcript":
            # JSONL writes are asynchronous and another Stop hook can continue
            # the turn. Keep useful counters, but never label this recovery
            # source exact, and leave a quiet window for later hook scans.
            store.mark_partial(
                "claude", session_fp, "telemetry_unavailable"
            )
            grace = CLAUDE_TRANSCRIPT_GRACE_SECONDS
        else:
            grace = CLAUDE_EXPORT_GRACE_SECONDS
        store.signal_complete("claude", session_fp, grace=grace)
    elif event == "SubagentStop" and source_mode == "transcript":
        # The scan above can recover the child's counters, but transcript
        # collection remains partial. Do not arm finalization here; the root
        # Stop/SessionEnd owns that boundary.
        store.mark_partial(
            "claude", session_fp, "telemetry_unavailable"
        )
    elif event == "StopFailure":
        store.signal_complete(
            "claude", session_fp, failed=True,
            grace=(
                CLAUDE_EXPORT_GRACE_SECONDS
                if source_mode == "otel"
                else CLAUDE_TRANSCRIPT_GRACE_SECONDS
            ),
        )


def _otel_value(value):
    if not isinstance(value, dict):
        return None
    for key in (
        "stringValue", "intValue", "doubleValue", "boolValue",
        "string_value", "int_value", "double_value", "bool_value",
    ):
        if key in value:
            return value[key]
    return None


def _otel_attributes(items):
    result = {}
    if not isinstance(items, list):
        return result
    for item in items:
        if not isinstance(item, dict) or not isinstance(item.get("key"), str):
            continue
        result[item["key"]] = _otel_value(item.get("value"))
    return result


def _first_value(mapping, *names):
    for name in names:
        value = mapping.get(name)
        if value is not None:
            return value
    return None


def _otel_timestamp(value):
    if isinstance(value, bool):
        return None
    if isinstance(value, str):
        stripped = value.strip()
        if not stripped.isdigit() or len(stripped) > 20:
            return None
        value = stripped
    try:
        nanoseconds = int(value)
    except (TypeError, ValueError, OverflowError):
        return None
    earliest = 946684800 * 1_000_000_000
    latest = int((time.time() + 24 * 60 * 60) * 1_000_000_000)
    if not earliest <= nanoseconds <= latest:
        return None
    seconds = nanoseconds / 1_000_000_000
    return seconds


def ingest_otlp_json(store, payload):
    """Consume OTLP/HTTP JSON logs while retaining only an allowlist."""
    if not isinstance(payload, dict):
        return 0
    accepted = 0
    sessions_seen = set()
    resource_logs = payload.get("resourceLogs") or payload.get("resource_logs")
    if not isinstance(resource_logs, list):
        return 0
    for resource_log in resource_logs:
        if not isinstance(resource_log, dict):
            continue
        resource = resource_log.get("resource")
        resource_attrs = _otel_attributes(
            resource.get("attributes") if isinstance(resource, dict) else None
        )
        scope_logs = resource_log.get("scopeLogs") or resource_log.get("scope_logs")
        if not isinstance(scope_logs, list):
            continue
        for scope_log in scope_logs:
            if not isinstance(scope_log, dict):
                continue
            records = scope_log.get("logRecords") or scope_log.get("log_records")
            if not isinstance(records, list):
                continue
            for record in records:
                if not isinstance(record, dict):
                    continue
                attrs = dict(resource_attrs)
                attrs.update(_otel_attributes(record.get("attributes")))
                body = _otel_value(record.get("body"))
                event_name = _first_value(
                    attrs, "event.name", "event_name", "name"
                )
                if not isinstance(event_name, str) and isinstance(body, str):
                    event_name = body
                session_id = _first_value(
                    attrs, "session.id", "session_id", "sessionId"
                )
                if not isinstance(session_id, str) or not session_id:
                    continue
                session_fp = store.fingerprint("claude-session", session_id)
                sessions_seen.add(session_fp)
                store.bind_session("claude", session_fp, is_root=True)
                timestamp_raw = _first_value(
                    record, "timeUnixNano", "time_unix_nano"
                )
                timestamp = _otel_timestamp(timestamp_raw)
                if event_name in {"api_request", "claude_code.api_request"}:
                    usage = {
                        "input_tokens": _first_value(
                            attrs, "input_tokens", "input.tokens"
                        ),
                        "output_tokens": _first_value(
                            attrs, "output_tokens", "output.tokens"
                        ),
                        "cache_read_input_tokens": _first_value(
                            attrs, "cache_read_tokens", "cache_read_input_tokens"
                        ),
                        "cache_creation_input_tokens": _first_value(
                            attrs,
                            "cache_creation_tokens",
                            "cache_creation_input_tokens",
                        ),
                    }
                    if any(
                        _non_negative_int(usage.get(name)) is None
                        for name in ("input_tokens", "output_tokens")
                    ) or any(
                        usage.get(name) is not None
                        and _non_negative_int(usage.get(name)) is None
                        for name in (
                            "cache_read_input_tokens",
                            "cache_creation_input_tokens",
                        )
                    ):
                        store.mark_partial(
                            "claude", session_fp, "unsupported_client_version",
                            event_time=timestamp,
                            ambiguous_timestamp=timestamp is None,
                        )
                        continue
                    counts = _anthropic_counts(usage)
                    if _non_negative_int(
                        counts.get("normalized_total_tokens")
                    ) is None:
                        store.mark_partial(
                            "claude", session_fp, "unsupported_client_version",
                            event_time=timestamp,
                            ambiguous_timestamp=timestamp is None,
                        )
                        continue
                    if timestamp is None:
                        # Total usage remains useful, but without the provider
                        # event time an asynchronously exported request cannot
                        # be placed reliably on the pre/post marker boundary.
                        store.mark_partial(
                            "claude", session_fp, "collector_failure",
                            event_time=timestamp,
                            ambiguous_timestamp=True,
                        )
                    request_id = _first_value(
                        attrs,
                        "request.id", "request_id", "requestId",
                        "client_request_id", "event.sequence",
                    )
                    if isinstance(request_id, int) and not isinstance(request_id, bool):
                        request_id = str(request_id)
                    if not isinstance(request_id, str) or not request_id:
                        store.mark_partial(
                            "claude", session_fp, "collector_failure",
                            event_time=timestamp,
                            ambiguous_timestamp=timestamp is None,
                        )
                        request_id = _canonical_json({
                            "time": timestamp,
                            "input": usage["input_tokens"],
                            "output": usage["output_tokens"],
                            "cache_read": usage["cache_read_input_tokens"],
                            "cache_creation": usage["cache_creation_input_tokens"],
                        })
                    if store.record_usage(
                        "claude",
                        session_fp,
                        session_id + "\0" + request_id,
                        counts,
                        "otel",
                        model=_first_value(attrs, "model", "model_name"),
                        effort=_first_value(attrs, "effort", "reasoning_effort"),
                        created_at=timestamp,
                    ):
                        accepted += 1
                elif event_name in {
                    "tool_result", "claude_code.tool_result",
                }:
                    # A decision and its result describe one execution. With
                    # content/detail logging disabled Claude may expose no
                    # stable tool id, so counting both would inflate activity.
                    # Results are the execution record and also carry failure.
                    tool_id = _first_value(
                        attrs, "tool.id", "tool_id", "tool_use_id"
                    )
                    if not isinstance(tool_id, str):
                        tool_id = _canonical_json({
                            "time": timestamp,
                            "name": _first_value(attrs, "tool.name", "tool_name"),
                        })
                    success = _first_value(attrs, "success", "tool.success")
                    store.record_activity(
                        "claude",
                        session_fp,
                        tool_id,
                        failed=success is False or str(success).lower() == "false",
                        created_at=timestamp,
                    )
    for session_fp in sessions_seen:
        store.backfill_start_request("claude", session_fp)
    return accepted


class _AuditHTTPServer(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True


class _OtlpHandler(BaseHTTPRequestHandler):
    server_version = "UclusionTokenAudit/1"
    protocol_version = "HTTP/1.1"

    def log_message(self, _format, *_args):
        # The default handler logs request metadata. The loopback receiver has
        # no useful request details to expose, so it stays silent.
        return

    def _write_json(self, status, payload):
        body = _canonical_json(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Uclusion-Token-Audit", "1")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path != "/uclusion-token-audit/health":
            self._write_json(404, {"error": "not_found"})
            return
        self._write_json(200, {
            "schema_version": 1,
            "scope": self.server.scope_token,
        })

    def do_POST(self):
        if self.path.rstrip("/") != "/v1/logs":
            self._write_json(404, {"error": "not_found"})
            return
        length = _non_negative_int(self.headers.get("Content-Length"))
        if length is None or length > MAX_HTTP_BODY:
            self._write_json(413, {"error": "payload_too_large"})
            return
        content_type = self.headers.get("Content-Type", "").split(";", 1)[0]
        if content_type not in {"application/json", "application/x-json"}:
            self._write_json(415, {"error": "json_required"})
            return
        body = self.rfile.read(length)
        try:
            payload = json.loads(body.decode("utf-8"))
        except (UnicodeDecodeError, ValueError):
            self._write_json(400, {"error": "invalid_json"})
            return
        try:
            ingest_otlp_json(self.server.audit_store, payload)
        except Exception:
            # Never echo telemetry or exception strings to the exporter.
            self._write_json(500, {"error": "collector_failure"})
            return
        self._write_json(200, {"partialSuccess": {}})


class LocalOtlpReceiver:
    def __init__(self, store, port):
        self.store = store
        self.port = int(port)
        self.scope_token = store.fingerprint(
            "otlp-scope", store.environment + "\0" + store.workspace_id
        )
        self.server = None
        self.thread = None
        self.external_owner = False

    def _owned_by_peer(self):
        connection = http.client.HTTPConnection(
            "127.0.0.1", self.port, timeout=0.75
        )
        try:
            connection.request("GET", "/uclusion-token-audit/health")
            response = connection.getresponse()
            body = response.read(MAX_HTTP_BODY)
            if response.status != 200:
                return False
            payload = json.loads(body.decode("utf-8"))
            return payload.get("scope") == self.scope_token
        except (OSError, ValueError, http.client.HTTPException):
            return False
        finally:
            connection.close()

    def ensure_available(self):
        """Return ``(available, ownership_gap_detected)``.

        The loopback port is the cross-process lease: exactly one proxy can
        bind it, while peers verify the scope-authenticated health endpoint.
        A peer disappearance or dead local server is a coverage gap even when
        this process immediately wins the replacement bind.
        """
        gap_detected = False
        if self.server is not None:
            if self.thread is not None and self.thread.is_alive():
                return True, False
            try:
                self.server.server_close()
            except OSError:
                pass
            self.server = None
            self.thread = None
            gap_detected = True
        if self.external_owner:
            if self._owned_by_peer():
                return True, False
            self.external_owner = False
            gap_detected = True
        elif self._owned_by_peer():
            self.external_owner = True
            return True, gap_detected
        try:
            server = _AuditHTTPServer(
                ("127.0.0.1", self.port), _OtlpHandler
            )
        except OSError as error:
            if error.errno in (errno.EADDRINUSE, 10048) and self._owned_by_peer():
                self.external_owner = True
                return True, gap_detected
            return False, True
        server.audit_store = self.store
        server.scope_token = self.scope_token
        thread = threading.Thread(
            target=server.serve_forever,
            kwargs={"poll_interval": 0.25},
            name="uclusion-token-audit-otlp",
            daemon=True,
        )
        thread.start()
        self.server = server
        self.thread = thread
        return True, gap_detected

    def start(self):
        available, _gap_detected = self.ensure_available()
        return available

    def close(self):
        server = self.server
        thread = self.thread
        self.server = None
        self.thread = None
        self.external_owner = False
        if server is not None:
            server.shutdown()
            server.server_close()
        if thread is not None:
            thread.join(timeout=1)


class TokenAuditProxy:
    """Own the optional OTLP endpoint and publish the durable audit outbox."""

    def __init__(
        self,
        environment,
        workspace_id,
        source,
        client,
        port,
        publish,
        ready_file=None,
        ready_owner=None,
    ):
        self.store = AuditStore(environment, workspace_id)
        self.source = source
        self.client = client
        self.port = int(port)
        self.publish = publish
        self.ready_file = ready_file
        self.ready_owner = ready_owner
        self.receiver = None
        self._receiver_available = None
        self.stop_event = threading.Event()
        self.thread = None
        if source == "otel":
            receiver = LocalOtlpReceiver(self.store, self.port)
            try:
                available, gap_detected = receiver.ensure_available()
                startup_gap = gap_detected or (
                    receiver.server is not None
                    and self.store.has_open_runs(client, source)
                )
                if startup_gap:
                    self.store.set_source_available(
                        client, source, False, mark_gap=True
                    )
                self.store.set_source_available(client, source, available)
                self._receiver_available = available
            except Exception:
                available = False
                try:
                    self.store.set_source_available(
                        client, source, False, mark_gap=True
                    )
                except Exception:
                    pass
                self._receiver_available = False
            self.receiver = receiver
            if not available:
                # A non-Uclusion listener on the configured port must not make
                # the MCP connection unusable. Source health makes every run
                # overlapping the gap partial/unavailable rather than exact.
                sys.stderr.write(
                    "Uclusion token audit: configured OTLP port is unavailable; "
                    "usage will be reported as unavailable.\n"
                )
        try:
            self.store.prune_retained()
        except Exception:
            pass
        self.thread = threading.Thread(
            target=self._publish_loop,
            name="uclusion-token-audit-publisher",
            daemon=True,
        )
        self.thread.start()

    def tools_ready(self):
        """Whether marker tools can currently produce an accountable run."""
        if self.source != "codex":
            return True
        return codex_collector_ready(self.ready_file, self.ready_owner)

    def _maintain_receiver(self):
        if self.source != "otel" or self.receiver is None:
            return
        available, gap_detected = self.receiver.ensure_available()
        if gap_detected and self._receiver_available is not False:
            self.store.set_source_available(
                self.client, self.source, False, mark_gap=True
            )
            self._receiver_available = False
        if available != self._receiver_available:
            self.store.set_source_available(
                self.client, self.source, available
            )
            self._receiver_available = available

    def _publish_once(self, maintain_receiver=True):
        try:
            if maintain_receiver:
                self._maintain_receiver()
            row = self.store.claim_outbox()
        except Exception:
            return False
        if row is None:
            return False
        try:
            self.publish(row)
        except Exception as error:
            try:
                self.store.retry_outbox(
                    row["audit_run_id"],
                    row["lease_token"],
                    "publish_" + error.__class__.__name__.lower(),
                )
            except Exception:
                # Leave the row publishing; its lease expiry is the recovery
                # mechanism when even the retry write fails.
                pass
        else:
            try:
                self.store.complete_outbox(
                    row["audit_run_id"], row["lease_token"]
                )
                self.store.prune_retained()
            except Exception:
                # A successful remote idempotent write can safely be sent
                # again after this publishing lease expires.
                pass
        return True

    def _publish_loop(self):
        while not self.stop_event.is_set():
            if not self._publish_once():
                self.stop_event.wait(OUTBOX_POLL_SECONDS)
        # End markers can land immediately before the MCP stdio connection
        # closes. Make one last due-row attempt; close remains bounded by its
        # join timeout and the durable row survives any slow/network failure.
        self._publish_once(maintain_receiver=False)

    def close(self):
        self.stop_event.set()
        if self.thread is not None:
            self.thread.join(timeout=2)
        if self.receiver is not None:
            self.receiver.close()


def _valid_port(value):
    try:
        port = int(value)
    except (TypeError, ValueError):
        raise argparse.ArgumentTypeError("port must be an integer")
    if not 1024 <= port <= 65535:
        raise argparse.ArgumentTypeError("port must be between 1024 and 65535")
    return port


def build_parser():
    parser = argparse.ArgumentParser(
        description="Collect privacy-minimized Uclusion job token usage."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)
    hook = subparsers.add_parser(
        "hook", help="Process one Claude Code hook payload from stdin."
    )
    hook.add_argument(
        "--environment", choices=("dev", "stage", "production"), required=True
    )
    hook.add_argument("--workspace-id", required=True)
    hook.add_argument("--source", choices=("otel", "transcript"), required=True)
    hook.add_argument("--port", type=_valid_port, required=True)
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    if args.command == "hook":
        body = sys.stdin.buffer.read(MAX_HOOK_BODY + 1)
        if len(body) > MAX_HOOK_BODY:
            sys.stderr.write(
                "Uclusion token audit hook payload exceeded the safe limit.\n"
            )
            return 0
        try:
            payload = json.loads(body.decode("utf-8")) if body.strip() else {}
        except (UnicodeDecodeError, ValueError):
            sys.stderr.write("Uclusion token audit hook received invalid JSON.\n")
            return 0
        if not isinstance(payload, dict):
            return 0
        try:
            process_claude_hook(
                args.environment, args.workspace_id, args.source, payload
            )
        except Exception as error:
            # Hook failures must never block Claude. Avoid the exception text,
            # which might contain a user-controlled path or provider value.
            sys.stderr.write(
                "Uclusion token audit hook degraded ({}).\n".format(
                    error.__class__.__name__
                )
            )
        return 0
    return 2


if __name__ == "__main__":
    sys.exit(main())
