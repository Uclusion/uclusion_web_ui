#!/usr/bin/env python3
"""Privacy-minimized token accounting for Uclusion job handoffs.

The module has three deliberately small public surfaces:

* :class:`CodexTokenAudit`, fed by ``uclusionCodexNative.py``;
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
MAX_PUBLICATION_ATTEMPTS = 5
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


class AuditPublicationRejected(RuntimeError):
    """A permanent rejection; retain the payload without automatic retries."""


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


def _source_settle_grace(source_mode):
    if source_mode == "transcript_fallback":
        return CLAUDE_TRANSCRIPT_GRACE_SECONDS
    if source_mode in {"otel", "mixed"}:
        return CLAUDE_EXPORT_GRACE_SECONDS
    return 0.0


def _tool_basename(name):
    if not isinstance(name, str):
        return None
    name = _uclusion_tool_basename(name) or name
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
        self._backfill_missing_checkpoints()

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
                partial_reason_at REAL,
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
                partial_reason_at REAL,
                client_version TEXT,
                discovered_at REAL,
                root_at REAL,
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

            -- This is deliberately additive instead of widening/rekeying the
            -- one-row-per-run terminal outbox. Immediately previous bridge,
            -- hook, and proxy processes can continue using that table while
            -- an updated publisher drains both durable queues.
            CREATE TABLE IF NOT EXISTS token_audit_checkpoints (
                audit_run_id TEXT NOT NULL,
                marker_sequence INTEGER NOT NULL,
                environment TEXT NOT NULL,
                workspace_id TEXT NOT NULL,
                job_id TEXT NOT NULL,
                bucket TEXT NOT NULL,
                cutoff_at REAL NOT NULL,
                finalization_json TEXT NOT NULL,
                state TEXT NOT NULL,
                attempts INTEGER NOT NULL DEFAULT 0,
                next_attempt_at REAL NOT NULL,
                lease_until REAL,
                lease_token TEXT,
                last_error_code TEXT,
                created_at REAL NOT NULL,
                updated_at REAL NOT NULL,
                PRIMARY KEY (audit_run_id, marker_sequence)
            );
            CREATE INDEX IF NOT EXISTS token_audit_checkpoints_due
                ON token_audit_checkpoints(
                    environment, workspace_id, state, next_attempt_at,
                    lease_until
                );

            -- Marker receipts outlive independently-pruned sent checkpoint
            -- bodies. They are compact identity tombstones: a rolling-upgrade
            -- backfill may create a missing checkpoint exactly once, but can
            -- never resurrect it after the body has aged out.
            CREATE TABLE IF NOT EXISTS token_audit_checkpoint_receipts (
                audit_run_id TEXT NOT NULL,
                marker_sequence INTEGER NOT NULL,
                created_at REAL NOT NULL,
                PRIMARY KEY (audit_run_id, marker_sequence)
            );

            -- Current run/session rows retain their legacy summary fields for
            -- terminal snapshots. Closed-prefix checkpoints instead read this
            -- append-only evidence so a later, higher-priority gap cannot
            -- rewrite the reason that was true at an earlier marker boundary.
            CREATE TABLE IF NOT EXISTS token_audit_partial_events (
                audit_run_id TEXT NOT NULL,
                session_fp TEXT NOT NULL,
                reason_code TEXT NOT NULL,
                effective_at REAL NOT NULL,
                created_at REAL NOT NULL,
                PRIMARY KEY (
                    audit_run_id, session_fp, reason_code, effective_at
                )
            );
            CREATE INDEX IF NOT EXISTS token_audit_partial_events_run_time
                ON token_audit_partial_events(audit_run_id, effective_at);

            CREATE TABLE IF NOT EXISTS token_audit_source_health (
                environment TEXT NOT NULL,
                workspace_id TEXT NOT NULL,
                client TEXT NOT NULL,
                source_mode TEXT NOT NULL,
                available INTEGER NOT NULL,
                updated_at REAL NOT NULL,
                PRIMARY KEY (environment, workspace_id, client, source_mode)
            );

            -- Where a root session's own saved log lives, so finalization
            -- can derive the Uclusion breakdown for exactly the run's
            -- requests. The path stays in this private local store; only
            -- line names and numbers are ever published.
            CREATE TABLE IF NOT EXISTS token_audit_session_logs (
                environment TEXT NOT NULL,
                workspace_id TEXT NOT NULL,
                client TEXT NOT NULL,
                session_fp TEXT NOT NULL,
                log_path TEXT NOT NULL,
                updated_at REAL NOT NULL,
                PRIMARY KEY (environment, workspace_id, client, session_fp)
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
            if "partial_reason_at" not in run_columns:
                connection.execute(
                    "ALTER TABLE token_audit_runs "
                    "ADD COLUMN partial_reason_at REAL"
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
            run_session_columns = {
                row[1] for row in connection.execute(
                    "PRAGMA table_info(token_audit_run_sessions)"
                ).fetchall()
            }
            if "partial_reason_at" not in run_session_columns:
                connection.execute(
                    "ALTER TABLE token_audit_run_sessions "
                    "ADD COLUMN partial_reason_at REAL"
                )
            if "discovered_at" not in run_session_columns:
                connection.execute(
                    "ALTER TABLE token_audit_run_sessions "
                    "ADD COLUMN discovered_at REAL"
                )
            if "root_at" not in run_session_columns:
                connection.execute(
                    "ALTER TABLE token_audit_run_sessions "
                    "ADD COLUMN root_at REAL"
                )
            # Preserve membership for runs created by an immediately previous
            # release before the immutable per-run table existed.
            connection.execute(
                """
                INSERT OR IGNORE INTO token_audit_run_sessions (
                    audit_run_id, session_fp, parent_session_fp, is_root,
                    usage_seen, partial_reason, partial_reason_at,
                    client_version, discovered_at, root_at, updated_at
                )
                SELECT audit_run_id, session_fp, parent_session_fp, is_root,
                    usage_seen, partial_reason, partial_reason_at,
                    client_version, NULL, NULL, updated_at
                FROM token_audit_sessions WHERE audit_run_id IS NOT NULL
                """
            )
            # Existing rows predate immutable membership timestamps. Their
            # mutable updated_at may have advanced past an earlier marker, so
            # use run start as the conservative bound: false-partial is safer
            # than claiming exact coverage from history the legacy schema did
            # not retain.
            connection.execute(
                """
                UPDATE token_audit_run_sessions AS rs
                SET discovered_at=COALESCE(
                    (SELECT r.started_at FROM token_audit_runs r
                     WHERE r.audit_run_id=rs.audit_run_id),
                    rs.updated_at
                )
                WHERE rs.discovered_at IS NULL
                """
            )
            connection.execute(
                """
                UPDATE token_audit_run_sessions AS rs
                SET root_at=CASE
                    WHEN rs.session_fp=(
                        SELECT r.root_session_fp FROM token_audit_runs r
                        WHERE r.audit_run_id=rs.audit_run_id
                    ) THEN COALESCE(
                        (SELECT r.started_at FROM token_audit_runs r
                         WHERE r.audit_run_id=rs.audit_run_id),
                        rs.discovered_at,
                        rs.updated_at
                    )
                    ELSE rs.updated_at
                END
                WHERE rs.is_root!=0 AND rs.root_at IS NULL
                """
            )
            connection.execute(
                "UPDATE token_audit_runs SET partial_reason_at=started_at "
                "WHERE partial_reason IS NOT NULL "
                "AND partial_reason_at IS NULL"
            )
            connection.execute(
                """
                UPDATE token_audit_run_sessions AS rs
                SET partial_reason_at=COALESCE(
                    (SELECT s.partial_reason_at
                     FROM token_audit_sessions s
                     WHERE s.audit_run_id=rs.audit_run_id
                       AND s.session_fp=rs.session_fp
                       AND s.partial_reason=rs.partial_reason),
                    rs.discovered_at,
                    (SELECT r.started_at FROM token_audit_runs r
                     WHERE r.audit_run_id=rs.audit_run_id),
                    rs.updated_at
                )
                WHERE rs.partial_reason IS NOT NULL
                  AND rs.partial_reason_at IS NULL
                """
            )
            connection.execute(
                """
                INSERT OR IGNORE INTO token_audit_partial_events (
                    audit_run_id, session_fp, reason_code,
                    effective_at, created_at
                )
                SELECT audit_run_id, '', partial_reason,
                    partial_reason_at, updated_at
                FROM token_audit_runs
                WHERE partial_reason IS NOT NULL
                  AND partial_reason_at IS NOT NULL
                """
            )
            connection.execute(
                """
                INSERT OR IGNORE INTO token_audit_partial_events (
                    audit_run_id, session_fp, reason_code,
                    effective_at, created_at
                )
                SELECT audit_run_id, session_fp, partial_reason,
                    partial_reason_at, updated_at
                FROM token_audit_run_sessions
                WHERE partial_reason IS NOT NULL
                  AND partial_reason_at IS NOT NULL
                """
            )
            # Triggers preserve temporal evidence when an immediately older
            # bridge/hook process writes the legacy summary columns during a
            # mixed-version overlap.
            connection.execute(
                """
                CREATE TRIGGER IF NOT EXISTS token_audit_run_session_discovery
                AFTER INSERT ON token_audit_run_sessions
                WHEN NEW.discovered_at IS NULL
                BEGIN
                    UPDATE token_audit_run_sessions
                    SET discovered_at=NEW.updated_at
                    WHERE audit_run_id=NEW.audit_run_id
                      AND session_fp=NEW.session_fp
                      AND discovered_at IS NULL;
                END
                """
            )
            connection.execute(
                """
                CREATE TRIGGER IF NOT EXISTS token_audit_run_partial_evidence
                AFTER UPDATE OF partial_reason ON token_audit_runs
                WHEN NEW.partial_reason IS NOT NULL
                  AND OLD.partial_reason IS NOT NEW.partial_reason
                BEGIN
                    INSERT OR IGNORE INTO token_audit_partial_events (
                        audit_run_id, session_fp, reason_code,
                        effective_at, created_at
                    ) VALUES (
                        NEW.audit_run_id, '', NEW.partial_reason,
                        CASE
                            WHEN NEW.partial_reason_at IS NOT NULL
                              AND NEW.partial_reason_at
                                  IS NOT OLD.partial_reason_at
                            THEN NEW.partial_reason_at
                            ELSE NEW.updated_at
                        END,
                        NEW.updated_at
                    );
                END
                """
            )
            connection.execute(
                """
                CREATE TRIGGER IF NOT EXISTS token_audit_run_session_root_insert
                AFTER INSERT ON token_audit_run_sessions
                WHEN NEW.is_root!=0 AND NEW.root_at IS NULL
                BEGIN
                    UPDATE token_audit_run_sessions
                    SET root_at=NEW.updated_at
                    WHERE audit_run_id=NEW.audit_run_id
                      AND session_fp=NEW.session_fp
                      AND root_at IS NULL;
                END
                """
            )
            connection.execute(
                """
                CREATE TRIGGER IF NOT EXISTS token_audit_run_session_root_update
                AFTER UPDATE OF is_root ON token_audit_run_sessions
                WHEN NEW.is_root!=0 AND NEW.root_at IS NULL
                BEGIN
                    UPDATE token_audit_run_sessions
                    SET root_at=NEW.updated_at
                    WHERE audit_run_id=NEW.audit_run_id
                      AND session_fp=NEW.session_fp
                      AND root_at IS NULL;
                END
                """
            )
            connection.execute(
                """
                CREATE TRIGGER IF NOT EXISTS token_audit_session_partial_evidence
                AFTER UPDATE OF partial_reason
                ON token_audit_run_sessions
                WHEN NEW.partial_reason IS NOT NULL
                  AND OLD.partial_reason IS NOT NEW.partial_reason
                BEGIN
                    INSERT OR IGNORE INTO token_audit_partial_events (
                        audit_run_id, session_fp, reason_code,
                        effective_at, created_at
                    ) VALUES (
                        NEW.audit_run_id, NEW.session_fp, NEW.partial_reason,
                        CASE
                            WHEN NEW.partial_reason_at IS NOT NULL
                              AND NEW.partial_reason_at
                                  IS NOT OLD.partial_reason_at
                            THEN NEW.partial_reason_at
                            ELSE NEW.updated_at
                        END,
                        NEW.updated_at
                    );
                END
                """
            )
            connection.execute(
                """
                CREATE TRIGGER IF NOT EXISTS token_audit_current_session_partial_evidence
                AFTER UPDATE OF partial_reason, partial_reason_at
                ON token_audit_sessions
                WHEN NEW.audit_run_id IS NOT NULL
                  AND NEW.partial_reason IS NOT NULL
                  AND (
                    OLD.partial_reason IS NOT NEW.partial_reason
                    OR OLD.partial_reason_at IS NOT NEW.partial_reason_at
                  )
                BEGIN
                    INSERT OR IGNORE INTO token_audit_partial_events (
                        audit_run_id, session_fp, reason_code,
                        effective_at, created_at
                    ) VALUES (
                        NEW.audit_run_id, NEW.session_fp, NEW.partial_reason,
                        COALESCE(NEW.partial_reason_at, NEW.updated_at),
                        NEW.updated_at
                    );
                END
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
        root_at=None,
    ):
        if audit_run_id is None or session_fp is None:
            return
        timestamp = time.time() if updated_at is None else float(updated_at)
        connection.execute(
            """
            INSERT INTO token_audit_run_sessions (
                audit_run_id, session_fp, parent_session_fp, is_root,
                client_version, discovered_at, root_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
                discovered_at=COALESCE(
                    MIN(
                        token_audit_run_sessions.discovered_at,
                        excluded.discovered_at
                    ),
                    token_audit_run_sessions.discovered_at,
                    excluded.discovered_at
                ),
                root_at=CASE
                    WHEN excluded.root_at IS NOT NULL THEN COALESCE(
                        MIN(
                            token_audit_run_sessions.root_at,
                            excluded.root_at
                        ),
                        token_audit_run_sessions.root_at,
                        excluded.root_at
                    )
                    ELSE token_audit_run_sessions.root_at
                END,
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
                None if root_at is None else float(root_at),
                timestamp,
            ),
        )

    @staticmethod
    def _record_partial_event(
        connection,
        audit_run_id,
        reason_code,
        effective_at,
        session_fp=None,
        created_at=None,
    ):
        if audit_run_id is None or reason_code is None:
            return
        timestamp = float(effective_at)
        recorded_at = (
            time.time() if created_at is None else float(created_at)
        )
        connection.execute(
            """
            INSERT OR IGNORE INTO token_audit_partial_events (
                audit_run_id, session_fp, reason_code,
                effective_at, created_at
            ) VALUES (?, ?, ?, ?, ?)
            """,
            (
                audit_run_id,
                session_fp or "",
                reason_code,
                timestamp,
                recorded_at,
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
                    parent_session_fp=CASE
                        WHEN excluded.audit_run_id IS NOT NULL
                          AND token_audit_sessions.audit_run_id
                              IS NOT excluded.audit_run_id
                        THEN excluded.parent_session_fp
                        ELSE COALESCE(excluded.parent_session_fp,
                            token_audit_sessions.parent_session_fp)
                    END,
                    is_root=CASE
                        WHEN excluded.audit_run_id IS NOT NULL
                          AND token_audit_sessions.audit_run_id
                              IS NOT excluded.audit_run_id
                        THEN excluded.is_root
                        ELSE MAX(token_audit_sessions.is_root,
                            excluded.is_root)
                    END,
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
                    is_root=bool(is_root),
                    client_version=current["client_version"],
                    updated_at=now,
                    root_at=(now if is_root else None),
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

    def register_session_log(self, client, session_fp, log_path):
        """Remember where a root session's own saved log lives."""
        if session_fp is None or not isinstance(log_path, str) or not log_path:
            return
        log_path = os.path.abspath(os.path.expanduser(log_path))
        with closing(self.connect()) as connection, connection:
            connection.execute(
                """
                INSERT INTO token_audit_session_logs (
                    environment, workspace_id, client, session_fp, log_path,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(environment, workspace_id, client, session_fp)
                DO UPDATE SET log_path=excluded.log_path,
                    updated_at=excluded.updated_at
                """,
                (
                    self.environment, self.workspace_id, client, session_fp,
                    log_path, time.time(),
                ),
            )

    def _session_log(self, connection, client, session_fp):
        row = connection.execute(
            "SELECT log_path FROM token_audit_session_logs "
            "WHERE environment=? AND workspace_id=? AND client=? "
            "AND session_fp=?",
            (self.environment, self.workspace_id, client, session_fp),
        ).fetchone()
        return row["log_path"] if row is not None else None

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
        self._refresh_unattempted_checkpoints(
            connection, audit_run_id, event_time=float(candidate["created_at"])
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
                        "SELECT partial_reason, partial_reason_at "
                        "FROM token_audit_run_sessions "
                        "WHERE audit_run_id=? AND session_fp=?",
                        (prior_session["audit_run_id"], session_fp),
                    ).fetchone()
                    prior_reason = (
                        prior_membership["partial_reason"]
                        if prior_membership is not None else None
                    )
                    interrupted_reason = _preferred_partial_reason(
                        prior_reason, "session_interrupted"
                    )
                    interrupted_reason_at = (
                        now
                        if interrupted_reason != prior_reason
                        else (
                            prior_membership["partial_reason_at"]
                            if prior_membership is not None else now
                        )
                    )
                    connection.execute(
                        "UPDATE token_audit_run_sessions SET partial_reason=?, "
                        "partial_reason_at=?, updated_at=? "
                        "WHERE audit_run_id=? AND session_fp=?",
                        (
                            interrupted_reason,
                            interrupted_reason_at,
                            now,
                            prior_session["audit_run_id"],
                            session_fp,
                        ),
                    )
                    self._record_partial_event(
                        connection,
                        prior_session["audit_run_id"],
                        "session_interrupted",
                        now,
                        session_fp=session_fp,
                        created_at=now,
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
                        "partial_reason_at=COALESCE(partial_reason_at, ?), "
                        "updated_at=? WHERE audit_run_id=?",
                        (
                            "telemetry_unavailable", now, now, audit_run_id,
                        ),
                    )
                    self._record_partial_event(
                        connection,
                        audit_run_id,
                        "telemetry_unavailable",
                        now,
                        created_at=now,
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
                        parent_session_fp=NULL, is_root=1,
                        updated_at=excluded.updated_at
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
                    root_at=now,
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
                        "partial_reason_at=?, updated_at=? "
                        "WHERE audit_run_id=? AND session_fp=?",
                        (
                            prior_session_reason,
                            now,
                            now,
                            audit_run_id,
                            session_fp,
                        ),
                    )
                    self._record_partial_event(
                        connection,
                        audit_run_id,
                        prior_session_reason,
                        now,
                        session_fp=session_fp,
                        created_at=now,
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

    def _enqueue_checkpoint(
        self, connection, run, marker_sequence, bucket, cutoff_at
    ):
        """Persist one immutable-identity, cumulative bucket checkpoint.

        The payload remains replaceable only until its first publish attempt.
        Delayed provider events use ``cutoff_at`` to refresh that pending body
        without changing the checkpoint's run/marker idempotency key.
        """
        receipt = connection.execute(
            "SELECT 1 FROM token_audit_checkpoint_receipts "
            "WHERE audit_run_id=? AND marker_sequence=?",
            (run["audit_run_id"], marker_sequence),
        ).fetchone()
        if receipt is not None:
            return False
        grace = _source_settle_grace(run["source_mode"])
        finalization = self._build_finalization(
            connection, run, cutoff_at, inclusive_end=False
        )
        cursor = connection.execute(
            """
            INSERT OR IGNORE INTO token_audit_checkpoints (
                audit_run_id, marker_sequence, environment, workspace_id,
                job_id, bucket, cutoff_at, finalization_json, state,
                next_attempt_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
            """,
            (
                run["audit_run_id"],
                marker_sequence,
                self.environment,
                self.workspace_id,
                run["job_id"],
                bucket,
                cutoff_at,
                _canonical_json(finalization),
                cutoff_at + grace,
                cutoff_at,
                cutoff_at,
            ),
        )
        connection.execute(
            "INSERT OR IGNORE INTO token_audit_checkpoint_receipts "
            "(audit_run_id, marker_sequence, created_at) VALUES (?, ?, ?)",
            (run["audit_run_id"], marker_sequence, time.time()),
        )
        return cursor.rowcount == 1

    def _backfill_missing_checkpoints(self):
        """Recover marker boundaries accepted by an older local process.

        The receipt and payload are committed atomically under the same writer
        lock. A retained receipt suppresses recreation after the independently
        prunable payload has been published and removed.
        """
        created = 0
        with closing(self.connect()) as connection, connection:
            connection.execute("BEGIN IMMEDIATE")
            rows = connection.execute(
                """
                SELECT r.*,
                    m.marker_sequence AS checkpoint_sequence,
                    m.phase AS checkpoint_bucket,
                    m.effective_at AS checkpoint_cutoff
                FROM token_audit_phase_markers m
                JOIN token_audit_runs r
                  ON r.audit_run_id=m.audit_run_id
                LEFT JOIN token_audit_checkpoint_receipts receipt
                  ON receipt.audit_run_id=m.audit_run_id
                 AND receipt.marker_sequence=m.marker_sequence
                WHERE r.environment=? AND r.workspace_id=?
                  AND receipt.audit_run_id IS NULL
                ORDER BY m.effective_at, m.audit_run_id, m.marker_sequence
                """,
                (self.environment, self.workspace_id),
            ).fetchall()
            for run in rows:
                if self._enqueue_checkpoint(
                    connection,
                    run,
                    int(run["checkpoint_sequence"]),
                    run["checkpoint_bucket"],
                    float(run["checkpoint_cutoff"]),
                ):
                    created += 1
        return created

    def _ensure_checkpoint_for_marker(
        self, connection, run, marker_sequence, bucket
    ):
        marker = connection.execute(
            "SELECT phase, effective_at FROM token_audit_phase_markers "
            "WHERE audit_run_id=? AND marker_sequence=?",
            (run["audit_run_id"], marker_sequence),
        ).fetchone()
        if marker is None or marker["phase"] != bucket:
            return False
        self._enqueue_checkpoint(
            connection,
            run,
            int(marker_sequence),
            bucket,
            float(marker["effective_at"]),
        )
        return True

    def _refresh_unattempted_checkpoints(
        self,
        connection,
        audit_run_id,
        event_time=None,
        settle_until=None,
    ):
        """Refresh cumulative snapshots that provably include new evidence."""
        run = connection.execute(
            "SELECT * FROM token_audit_runs WHERE audit_run_id=?",
            (audit_run_id,),
        ).fetchone()
        if run is None:
            return 0
        parameters = [audit_run_id]
        time_clause = ""
        if event_time is not None:
            # A marker is effective for a request at the exact marker time, so
            # its closed-prefix checkpoint is intentionally exclusive.
            time_clause = " AND cutoff_at>?"
            parameters.append(float(event_time))
        checkpoints = connection.execute(
            "SELECT marker_sequence, cutoff_at, next_attempt_at "
            "FROM token_audit_checkpoints WHERE audit_run_id=? "
            "AND state='pending' AND attempts=0" + time_clause,
            tuple(parameters),
        ).fetchall()
        now = time.time()
        for checkpoint in checkpoints:
            finalization = self._build_finalization(
                connection,
                run,
                float(checkpoint["cutoff_at"]),
                inclusive_end=False,
            )
            next_attempt_at = float(checkpoint["next_attempt_at"])
            if settle_until is not None:
                next_attempt_at = max(next_attempt_at, float(settle_until))
            connection.execute(
                "UPDATE token_audit_checkpoints SET finalization_json=?, "
                "next_attempt_at=?, updated_at=? WHERE audit_run_id=? "
                "AND marker_sequence=? AND state='pending' AND attempts=0",
                (
                    _canonical_json(finalization),
                    next_attempt_at,
                    now,
                    audit_run_id,
                    checkpoint["marker_sequence"],
                ),
            )
        return len(checkpoints)

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
                "SELECT * FROM token_audit_runs WHERE audit_run_id=?",
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
                    matches = (
                        existing_event["phase"] == bucket
                        and (
                            marker_sequence is None
                            or supplied_sequence
                            == int(existing_event["marker_sequence"])
                        )
                    )
                    if matches:
                        self._ensure_checkpoint_for_marker(
                            connection,
                            row,
                            int(existing_event["marker_sequence"]),
                            bucket,
                        )
                    return matches
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
                self._ensure_checkpoint_for_marker(
                    connection, row, sequence, bucket
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
            self._enqueue_checkpoint(
                connection, row, sequence, bucket, now
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
                        "SELECT partial_reason, partial_reason_at "
                        "FROM token_audit_run_sessions "
                        "WHERE audit_run_id=? AND session_fp=?",
                        (run_id, session_fp),
                    ).fetchone()
                    existing_run_reason = (
                        run_session["partial_reason"]
                        if run_session is not None else None
                    )
                    run_reason = _preferred_partial_reason(
                        existing_run_reason, reason_code
                    )
                    run_reason_at = (
                        effective_at
                        if run_reason != existing_run_reason
                        else (
                            run_session["partial_reason_at"]
                            if run_session is not None
                            and run_session["partial_reason_at"] is not None
                            else effective_at
                        )
                    )
                    connection.execute(
                        "UPDATE token_audit_run_sessions SET "
                        "partial_reason=?, partial_reason_at=?, updated_at=? "
                        "WHERE audit_run_id=? AND session_fp=?",
                        (
                            run_reason,
                            run_reason_at,
                            now,
                            run_id,
                            session_fp,
                        ),
                    )
                    self._record_partial_event(
                        connection,
                        run_id,
                        reason_code,
                        effective_at,
                        session_fp=session_fp,
                        created_at=now,
                    )
                    connection.execute(
                        "UPDATE token_audit_runs SET updated_at=? "
                        "WHERE audit_run_id=? "
                        "AND state IN ('active','closing','queued')",
                        (now, run_id),
                    )
                    self._refresh_unattempted_checkpoints(
                        connection, run_id, event_time=effective_at
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
                            o.attempts, rs.partial_reason,
                            rs.partial_reason_at
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
                        candidate_reason_at = (
                            effective_at
                            if candidate_reason != candidate["partial_reason"]
                            else (
                                candidate["partial_reason_at"]
                                if candidate["partial_reason_at"] is not None
                                else effective_at
                            )
                        )
                        connection.execute(
                            "UPDATE token_audit_run_sessions SET "
                            "partial_reason=?, partial_reason_at=?, "
                            "updated_at=? "
                            "WHERE audit_run_id=? AND session_fp=?",
                            (
                                candidate_reason,
                                candidate_reason_at,
                                now,
                                candidate_run_id,
                                session_fp,
                            ),
                        )
                        self._record_partial_event(
                            connection,
                            candidate_run_id,
                            reason_code,
                            effective_at,
                            session_fp=session_fp,
                            created_at=now,
                        )
                        self._refresh_unattempted_checkpoints(
                            connection,
                            candidate_run_id,
                            event_time=effective_at,
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
                    parent_session_fp=CASE
                        WHEN excluded.audit_run_id IS NOT NULL
                          AND token_audit_sessions.audit_run_id
                              IS NOT excluded.audit_run_id
                        THEN excluded.parent_session_fp
                        ELSE COALESCE(excluded.parent_session_fp,
                            token_audit_sessions.parent_session_fp)
                    END,
                    is_root=CASE
                        WHEN excluded.audit_run_id IS NOT NULL
                          AND token_audit_sessions.audit_run_id
                              IS NOT excluded.audit_run_id
                        THEN excluded.is_root
                        ELSE token_audit_sessions.is_root
                    END,
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
            SELECT r.audit_run_id, r.state, rs.root_at,
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
                bool(
                    row["root_at"] is not None
                    and float(row["root_at"]) <= float(timestamp)
                ),
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
        settle_grace = _source_settle_grace(source_mode)
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
                self._refresh_unattempted_checkpoints(
                    connection,
                    run_id,
                    event_time=timestamp,
                    settle_until=received_at + settle_grace,
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
                self._refresh_unattempted_checkpoints(
                    connection, run_id, event_time=timestamp
                )
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
                    "partial_reason, partial_reason_at "
                    "FROM token_audit_sessions "
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
                    reason_at = (
                        now
                        if reason != session["partial_reason"]
                        else (
                            session["partial_reason_at"]
                            if session["partial_reason_at"] is not None
                            else now
                        )
                    )
                    connection.execute(
                        "UPDATE token_audit_sessions SET partial_reason=?, "
                        "partial_reason_at=?, updated_at=? WHERE environment=? "
                        "AND workspace_id=? AND client=? AND session_fp=? "
                        "AND audit_run_id=?",
                        (
                            reason,
                            reason_at,
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
                        "SELECT partial_reason, partial_reason_at "
                        "FROM token_audit_run_sessions "
                        "WHERE audit_run_id=? AND session_fp=?",
                        (run_id, session_fp),
                    ).fetchone()
                    membership_reason = _preferred_partial_reason(
                        membership["partial_reason"]
                        if membership is not None else None,
                        "session_interrupted",
                    )
                    membership_reason_at = (
                        now
                        if membership is None
                        or membership_reason != membership["partial_reason"]
                        else (
                            membership["partial_reason_at"]
                            if membership["partial_reason_at"] is not None
                            else now
                        )
                    )
                    connection.execute(
                        "UPDATE token_audit_run_sessions SET partial_reason=?, "
                        "partial_reason_at=?, updated_at=? "
                        "WHERE audit_run_id=? AND session_fp=?",
                        (
                            membership_reason,
                            membership_reason_at,
                            now,
                            run_id,
                            session_fp,
                        ),
                    )
                    self._record_partial_event(
                        connection,
                        run_id,
                        "session_interrupted",
                        now,
                        session_fp=session_fp,
                        created_at=now,
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

    def _build_finalization(
        self, connection, run, ended_at, inclusive_end=None
    ):
        if inclusive_end is None:
            usage = connection.execute(
                "SELECT * FROM token_audit_usage WHERE audit_run_id=? "
                "ORDER BY created_at, event_key",
                (run["audit_run_id"],),
            ).fetchall()
            activity = connection.execute(
                "SELECT * FROM token_audit_activity WHERE audit_run_id=?",
                (run["audit_run_id"],),
            ).fetchall()
        else:
            usage_boundary = "<=" if inclusive_end else "<"
            usage = connection.execute(
                f"SELECT * FROM token_audit_usage WHERE audit_run_id=? "
                f"AND created_at{usage_boundary}? ORDER BY created_at, event_key",
                (run["audit_run_id"], ended_at),
            ).fetchall()
            activity = connection.execute(
                f"SELECT * FROM token_audit_activity WHERE audit_run_id=? "
                f"AND created_at{usage_boundary}?",
                (run["audit_run_id"], ended_at),
            ).fetchall()
        all_sessions = connection.execute(
            "SELECT * FROM token_audit_run_sessions "
            "WHERE audit_run_id=?",
            (run["audit_run_id"],),
        ).fetchall()
        if inclusive_end is None:
            sessions = all_sessions
            partial_events = None
        else:
            boundary = "<=" if inclusive_end else "<"
            partial_events = connection.execute(
                f"SELECT session_fp, reason_code "
                f"FROM token_audit_partial_events "
                f"WHERE audit_run_id=? AND effective_at{boundary}?",
                (run["audit_run_id"], ended_at),
            ).fetchall()
            historically_evidenced_fps = {
                item["session_fp"] for item in usage if item["session_fp"]
            }
            historically_evidenced_fps.update(
                item["session_fp"]
                for item in activity if item["session_fp"]
            )
            historically_evidenced_fps.update(
                item["session_fp"]
                for item in partial_events if item["session_fp"]
            )
            sessions = [
                item for item in all_sessions
                if (
                    item["discovered_at"] is not None
                    and (
                        float(item["discovered_at"]) <= ended_at
                        if inclusive_end
                        else float(item["discovered_at"]) < ended_at
                    )
                )
                or item["session_fp"] in historically_evidenced_fps
            ]
            known_session_fps = {
                item["session_fp"] for item in sessions
            }
            # A legacy writer can persist timestamped usage, activity, or
            # partial evidence without knowing the additive discovered_at
            # column. Any retained event proves that session existed inside
            # this prefix, even if its membership summary is missing or still
            # carries a later receipt timestamp.
            for session_fp in historically_evidenced_fps - known_session_fps:
                sessions.append({
                    "session_fp": session_fp,
                    "is_root": int(session_fp == run["root_session_fp"]),
                    "root_at": (
                        float(run["started_at"])
                        if session_fp == run["root_session_fp"] else None
                    ),
                    "partial_reason": None,
                    "client_version": None,
                })

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

        seen_session_fps = {
            item["session_fp"] for item in usage if item["session_fp"]
        }
        if inclusive_end is None:
            is_main_session = lambda item: bool(item["is_root"])
        else:
            # Authoritative Codex fork/resume can legitimately carry an open
            # run to another root session. root_at timestamps that promotion,
            # preventing a later bind from rewriting an earlier prefix while
            # allowing every root active by this boundary to count as main.
            is_main_session = lambda item: (
                item["session_fp"] == run["root_session_fp"]
                or (
                    item["root_at"] is not None
                    and (
                        float(item["root_at"]) <= ended_at
                        if inclusive_end
                        else float(item["root_at"]) < ended_at
                    )
                )
            )
        descendants = [item for item in sessions if not is_main_session(item)]
        descendants_included = sum(
            1 for item in descendants
            if item["session_fp"] in seen_session_fps
        )
        main_sessions = [item for item in sessions if is_main_session(item)]
        main_seen = any(
            item["session_fp"] in seen_session_fps for item in main_sessions
        )
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
        if partial_events is None:
            run_reason = run["partial_reason"]
            root_reasons = [
                item["partial_reason"] for item in main_sessions
                if item["partial_reason"]
            ]
            descendant_reasons = [
                item["partial_reason"] for item in descendants
                if item["partial_reason"]
            ]
            reasons = [
                value for value in (
                    run_reason,
                    *(item["partial_reason"] for item in sessions),
                ) if value
            ]
        else:
            included_session_fps = {
                item["session_fp"] for item in sessions
            }
            run_reasons = [
                item["reason_code"] for item in partial_events
                if not item["session_fp"]
            ]
            session_reasons = {}
            for item in partial_events:
                session_fp = item["session_fp"]
                if session_fp and session_fp in included_session_fps:
                    session_reasons.setdefault(session_fp, []).append(
                        item["reason_code"]
                    )
            run_reason = min(
                run_reasons,
                key=lambda value: PARTIAL_REASON_PRIORITY.get(value, 99),
                default=None,
            )
            root_reasons = [
                reason
                for item in main_sessions
                for reason in session_reasons.get(item["session_fp"], ())
            ]
            descendant_reasons = [
                reason
                for item in descendants
                for reason in session_reasons.get(item["session_fp"], ())
            ]
            reasons = run_reasons + root_reasons + descendant_reasons
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
        metadata_fallback_model = (
            run["model"] if inclusive_end is None else None
        )
        metadata_fallback_effort = (
            run["effort"] if inclusive_end is None else None
        )
        model = next(iter(models)) if len(models) == 1 else (
            "multiple" if len(models) > 1 else metadata_fallback_model
        )
        effort = next(iter(efforts)) if len(efforts) == 1 else (
            "multiple" if len(efforts) > 1 else metadata_fallback_effort
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
        finalization = {
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
        if usage:
            finalization["uclusion"] = self._run_breakdown(
                connection, run, usage
            )
        return finalization

    def _run_breakdown(self, connection, run, usage):
        """The run's Uclusion lines, over the same requests as its totals."""
        log_path = self._session_log(
            connection, run["client"], run["root_session_fp"]
        )
        if not log_path:
            return finalization_breakdown(unavailable_breakdown("log_missing"))
        times = [float(event["created_at"]) for event in usage]
        window = (
            min(times) - BREAKDOWN_WINDOW_SLACK_SECONDS,
            max(times) + BREAKDOWN_WINDOW_SLACK_SECONDS,
        )
        try:
            result = breakdown_session_log(log_path, window=window)
        except Exception:
            # The breakdown is additive evidence; its failure must never
            # cost the run its totals.
            result = unavailable_breakdown("collector_failure")
        return finalization_breakdown(result)

    def prepare_due_outbox(self, now=None):
        current = time.time() if now is None else float(now)
        prepared = 0
        with closing(self.connect()) as connection, connection:
            # Acquire the writer lock before selecting due runs so a late
            # event cannot extend a window after we have snapshotted it.
            connection.execute("BEGIN IMMEDIATE")
            rows = connection.execute(
                """
                SELECT r.* FROM token_audit_runs r
                WHERE r.environment=? AND r.workspace_id=?
                  AND r.state='closing' AND r.handoff_type IS NOT NULL
                  AND r.finalize_after IS NOT NULL AND r.finalize_after<=?
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

    def _block_exhausted_publications(self, connection, table, current):
        connection.execute(
            f"""
            UPDATE {table} SET state='blocked', lease_until=NULL,
                lease_token=NULL, last_error_code='retry_limit', updated_at=?
            WHERE environment=? AND workspace_id=? AND attempts>=?
              AND (state IN ('pending', 'retry_pending') OR
                   (state='publishing' AND lease_until<?))
            """,
            (current, self.environment, self.workspace_id,
             MAX_PUBLICATION_ATTEMPTS, current),
        )

    def retry_blocked_publications(self):
        """Explicitly grant another bounded attempt budget after a repair.

        retry_pending preserves the immutable payload: resetting the budget
        must not make an attempted row look like a fresh, rebuildable one.
        """
        current = time.time()
        changed = 0
        with closing(self.connect()) as connection, connection:
            connection.execute("BEGIN IMMEDIATE")
            for table in ('token_audit_checkpoints', 'token_audit_outbox'):
                changed += connection.execute(
                    f"""
                    UPDATE {table} SET state='retry_pending', attempts=0,
                        next_attempt_at=?, last_error_code=NULL, updated_at=?
                    WHERE environment=? AND workspace_id=? AND state='blocked'
                    """,
                    (current, current, self.environment, self.workspace_id),
                ).rowcount
        return changed

    def claim_checkpoint(self, now=None):
        current = time.time() if now is None else float(now)
        # An immediately older hook/bridge may have accepted a marker after
        # this process initialized. Sweep its durable marker log before every
        # claim; compact receipts make the scan idempotent after publication.
        self._backfill_missing_checkpoints()
        with closing(self.connect()) as connection:
            connection.execute("BEGIN IMMEDIATE")
            try:
                self._block_exhausted_publications(
                    connection, 'token_audit_checkpoints', current
                )
                row = connection.execute(
                    """
                    SELECT c.* FROM token_audit_checkpoints c
                    WHERE c.environment=? AND c.workspace_id=?
                      AND c.next_attempt_at<=?
                      AND (c.state IN ('pending', 'retry_pending') OR
                        (c.state='publishing' AND c.lease_until<?))
                    ORDER BY c.created_at, c.audit_run_id, c.marker_sequence
                    LIMIT 1
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
                row = dict(row)
                if row["state"] == "pending" and int(row["attempts"]) == 0:
                    run = connection.execute(
                        "SELECT * FROM token_audit_runs "
                        "WHERE audit_run_id=?",
                        (row["audit_run_id"],),
                    ).fetchone()
                    if run is not None:
                        # This writer lock is the publication fence for
                        # immediately older collectors. Rebuild from every
                        # committed pre-cutoff fact before the first attempt,
                        # then atomically transition that exact body to its
                        # immutable publishing state. Retried/expired claims
                        # never enter this branch.
                        finalization_json = _canonical_json(
                            self._build_finalization(
                                connection,
                                run,
                                float(row["cutoff_at"]),
                                inclusive_end=False,
                            )
                        )
                        body_changed = (
                            finalization_json != row["finalization_json"]
                        )
                        settle_grace = _source_settle_grace(
                            run["source_mode"]
                        )
                        if body_changed and settle_grace > 0:
                            # Legacy OTLP/transcript writers cannot extend the
                            # additive checkpoint queue. A changed body proves
                            # that pre-cutoff evidence arrived since its last
                            # snapshot; wait one fresh source grace so a
                            # multi-row export batch can quiesce. Another
                            # changed rebuild repeats this bounded fence.
                            settle_until = current + settle_grace
                            refreshed = connection.execute(
                                "UPDATE token_audit_checkpoints SET "
                                "finalization_json=?, next_attempt_at=?, "
                                "updated_at=? WHERE audit_run_id=? "
                                "AND marker_sequence=? AND state='pending' "
                                "AND attempts=0",
                                (
                                    finalization_json,
                                    settle_until,
                                    current,
                                    row["audit_run_id"],
                                    row["marker_sequence"],
                                ),
                            )
                            if refreshed.rowcount != 1:
                                connection.rollback()
                                return None
                            connection.commit()
                            return None
                        refreshed = connection.execute(
                            "UPDATE token_audit_checkpoints "
                            "SET finalization_json=?, updated_at=? "
                            "WHERE audit_run_id=? AND marker_sequence=? "
                            "AND state='pending' AND attempts=0",
                            (
                                finalization_json,
                                current,
                                row["audit_run_id"],
                                row["marker_sequence"],
                            ),
                        )
                        if refreshed.rowcount != 1:
                            connection.rollback()
                            return None
                        row["finalization_json"] = finalization_json
                lease_token = uuid.uuid4().hex
                cursor = connection.execute(
                    """
                    UPDATE token_audit_checkpoints SET state='publishing',
                        attempts=attempts+1, lease_until=?, lease_token=?, updated_at=?
                    WHERE audit_run_id=? AND marker_sequence=?
                      AND (state IN ('pending', 'retry_pending') OR
                        (state='publishing' AND lease_until<?))
                    """,
                    (
                        current + OUTBOX_LEASE_SECONDS,
                        lease_token,
                        current,
                        row["audit_run_id"],
                        row["marker_sequence"],
                        current,
                    ),
                )
                if cursor.rowcount != 1:
                    connection.rollback()
                    return None
                connection.commit()
            except Exception:
                connection.rollback()
                raise
        result = row
        result['attempts'] += 1
        result["lease_token"] = lease_token
        result["finalization"] = json.loads(result.pop("finalization_json"))
        result["publication_kind"] = "checkpoint"
        return result

    def complete_checkpoint(
        self, audit_run_id, marker_sequence, lease_token
    ):
        if not isinstance(lease_token, str) or not lease_token:
            return False
        now = time.time()
        with closing(self.connect()) as connection, connection:
            cursor = connection.execute(
                """
                UPDATE token_audit_checkpoints SET state='sent',
                    lease_until=NULL, lease_token=NULL, last_error_code=NULL,
                    updated_at=?
                WHERE audit_run_id=? AND marker_sequence=?
                  AND state='publishing' AND lease_token=?
                """,
                (
                    now,
                    audit_run_id,
                    marker_sequence,
                    lease_token,
                ),
            )
        if cursor.rowcount == 1:
            # If the terminal boundary became due while this checkpoint was
            # publishing, make it visible promptly. A failed checkpoint never
            # blocks the more complete terminal snapshot.
            self.prepare_due_outbox(now)
            return True
        return False

    def retry_checkpoint(
        self,
        audit_run_id,
        marker_sequence,
        lease_token,
        error_code="publish_failed",
        retryable=True,
    ):
        if not isinstance(lease_token, str) or not lease_token:
            return False
        now = time.time()
        with closing(self.connect()) as connection, connection:
            row = connection.execute(
                "SELECT attempts FROM token_audit_checkpoints "
                "WHERE audit_run_id=? AND marker_sequence=? "
                "AND state='publishing' AND lease_token=?",
                (audit_run_id, marker_sequence, lease_token),
            ).fetchone()
            if row is None:
                return False
            attempts = int(row["attempts"])
            state = (
                'pending' if retryable and attempts < MAX_PUBLICATION_ATTEMPTS
                else 'blocked'
            )
            delay = min(300, 2 ** min(attempts, 8))
            cursor = connection.execute(
                """
                UPDATE token_audit_checkpoints SET state=?,
                    next_attempt_at=?, lease_until=NULL,
                    lease_token=NULL, last_error_code=?, updated_at=?
                WHERE audit_run_id=? AND marker_sequence=?
                  AND state='publishing' AND lease_token=?
                """,
                (
                    state,
                    now + delay,
                    _safe_label(error_code) or "publish_failed",
                    now,
                    audit_run_id,
                    marker_sequence,
                    lease_token,
                ),
            )
        return cursor.rowcount == 1

    def claim_outbox(self, now=None):
        current = time.time() if now is None else float(now)
        self.prepare_due_outbox(current)
        with closing(self.connect()) as connection:
            connection.execute("BEGIN IMMEDIATE")
            try:
                self._block_exhausted_publications(
                    connection, 'token_audit_outbox', current
                )
                row = connection.execute(
                    """
                    SELECT o.* FROM token_audit_outbox o
                    WHERE o.environment=? AND o.workspace_id=?
                      AND o.next_attempt_at<=?
                      AND (o.state IN ('pending', 'retry_pending') OR
                        (o.state='publishing' AND o.lease_until<?))
                    ORDER BY o.created_at LIMIT 1
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
                        attempts=attempts+1, lease_until=?, lease_token=?, updated_at=?
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
        result['attempts'] += 1
        result["lease_token"] = lease_token
        result["finalization"] = json.loads(result.pop("finalization_json"))
        result["publication_kind"] = "final"
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
        self, audit_run_id, lease_token, error_code="publish_failed", retryable=True
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
            attempts = int(row["attempts"])
            state = (
                'pending' if retryable and attempts < MAX_PUBLICATION_ATTEMPTS
                else 'blocked'
            )
            delay = min(300, 2 ** min(attempts, 8))
            cursor = connection.execute(
                """
                UPDATE token_audit_outbox SET state=?,
                    next_attempt_at=?, lease_until=NULL, lease_token=NULL,
                    last_error_code=?, updated_at=?
                WHERE audit_run_id=? AND state='publishing'
                  AND lease_token=?
                """,
                (
                    state,
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
            # Published prefixes are independently recoverable from Uclusion.
            # Prune them without ending a still-active local run; unpublished
            # checkpoints retain the longer run-level recovery window below.
            connection.execute(
                "DELETE FROM token_audit_checkpoints "
                "WHERE environment=? AND workspace_id=? AND state='sent' "
                "AND updated_at<?",
                (
                    self.environment,
                    self.workspace_id,
                    finalized_cutoff,
                ),
            )
            sent_rows = connection.execute(
                """
                SELECT r.audit_run_id FROM token_audit_runs r
                JOIN token_audit_outbox o
                  ON o.audit_run_id=r.audit_run_id
                WHERE r.environment=? AND r.workspace_id=?
                  AND r.state='finalized' AND o.state='sent'
                  AND r.updated_at<? AND o.updated_at<?
                  AND NOT EXISTS (
                    SELECT 1 FROM token_audit_checkpoints c
                    WHERE c.audit_run_id=r.audit_run_id AND c.state!='sent'
                  )
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
                       OR o.state!='sent' OR EXISTS (
                         SELECT 1 FROM token_audit_checkpoints c
                         WHERE c.audit_run_id=r.audit_run_id AND c.state!='sent'
                       ))
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
                    "DELETE FROM token_audit_checkpoint_receipts "
                    "WHERE audit_run_id=?",
                    (run_id,),
                )
                connection.execute(
                    "DELETE FROM token_audit_partial_events "
                    "WHERE audit_run_id=?",
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
                    "DELETE FROM token_audit_checkpoints WHERE audit_run_id=?",
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
                        "partial_reason_at=COALESCE(partial_reason_at, ?), "
                        "updated_at=? WHERE audit_run_id=?",
                        ("telemetry_unavailable", now, now, run_id),
                    )
                    self._record_partial_event(
                        connection,
                        run_id,
                        "telemetry_unavailable",
                        now,
                        created_at=now,
                    )
                    self._refresh_unattempted_checkpoints(
                        connection, run_id
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

    def observe_descendant(self, thread):
        if not isinstance(thread, dict):
            return False
        thread_id = thread.get('id')
        parent_id = thread.get('parentThreadId')
        if not isinstance(thread_id, str) or not isinstance(parent_id, str):
            return False
        with self._lock:
            if parent_id not in self._thread_metadata:
                return False
            known = thread_id in self._thread_metadata
            model, effort = self._thread_metadata.get(
                thread_id, self._thread_metadata[parent_id])
            self._thread_metadata[thread_id] = (
                _safe_label(thread.get('model')) or model,
                _safe_label(thread.get('reasoningEffort')) or effort,
            )
            if known:
                return True
        parent_fp = self.store.fingerprint('codex-thread', parent_id)
        child_fp = self.store.fingerprint('codex-thread', thread_id)
        self.store.discover_descendant(self.client, parent_fp, child_fp)
        self.store.mark_partial(self.client, child_fp, 'incomplete_descendant_coverage')
        self._descendants.put(thread_id)
        return True

    def _observe_descendants(self, item, parent_thread_id):
        if not isinstance(item, dict) or item.get("type") != "collabAgentToolCall":
            return
        receiver_ids = item.get("receiverThreadIds")
        if not isinstance(receiver_ids, list):
            return
        for thread_id in receiver_ids:
            if not isinstance(thread_id, str) or not thread_id:
                continue
            # receiverThreadIds are delivered after child creation, while the
            # auxiliary app-server subscription is asynchronous. A child can
            # issue a request before that subscription is acknowledged; later
            # captured usage cannot prove the earlier interval was complete.
            self.observe_descendant({
                'id': thread_id, 'parentThreadId': parent_thread_id,
                'model': item.get('model'),
                'reasoningEffort': item.get('reasoningEffort') or item.get('effort'),
            })

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
            self._observe_descendants(item, thread_id)
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
                if item_type == "mcpToolCall" and item.get("server") in ("uclusion", "Uclusion"):
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
                diagnostic = marker or (
                    item_type == "dynamicToolCall"
                    and _audit_only_call(item.get("tool") or item.get("name"),
                                         item.get("arguments") or item.get("input"))
                )
                if not diagnostic:
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
                # Codex writes the rollout during the turn, so it exists now.
                self.store.register_session_log(
                    self.client, session_fp, find_codex_rollout(thread_id)
                )
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

    def owns_thread(self, thread_id):
        with self._lock:
            return thread_id in self._thread_metadata

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
                            if _tool_basename(item.get("name")):
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
                            deferred = next((
                                group[tool_id]
                                for group in deferred_activity.values()
                                if tool_id in group
                            ), None)
                            if deferred is not None:
                                deferred["failed"] = True
                            elif record_in_run:
                                # Results lack a tool name. Only update a
                                # useful execution already recorded by its
                                # tool_use event, including across checkpoints.
                                event_key = store.fingerprint(
                                    "activity-event", "claude\0" + tool_id
                                )
                                with closing(store.connect()) as connection:
                                    known = connection.execute(
                                        "SELECT 1 FROM token_audit_activity "
                                        "WHERE environment=? AND workspace_id=? "
                                        "AND client='claude' AND event_key=? "
                                        "AND session_fp=?",
                                        (store.environment, store.workspace_id,
                                         event_key, session_fp),
                                    ).fetchone()
                                if known:
                                    store.record_activity(
                                        "claude", session_fp, tool_id,
                                        failed=True, created_at=record_time,
                                    )
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
    if session_fp is not None and session_fp == root_fp:
        # Subagent transcripts live beside the root's and are read with it.
        store.register_session_log(
            "claude",
            session_fp,
            payload.get("transcript_path") or payload.get("transcriptPath"),
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
                    if _tool_basename(_first_value(
                        attrs, "tool.name", "tool_name"
                    )):
                        continue
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
        collector_ready=None,
    ):
        self.store = AuditStore(environment, workspace_id)
        self.source = source
        self.client = client
        self.port = int(port)
        self.publish = publish
        self.ready_file = ready_file
        self.ready_owner = ready_owner
        self.collector_ready = collector_ready
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
        if self.collector_ready is not None:
            return bool(self.collector_ready())
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
            row = self.store.claim_checkpoint()
            if row is None:
                row = self.store.claim_outbox()
        except Exception:
            return False
        if row is None:
            return False
        try:
            self.publish(row)
        except Exception as error:
            try:
                error_code = "publish_" + error.__class__.__name__.lower()
                retryable = not isinstance(error, AuditPublicationRejected)
                if row.get("publication_kind") == "checkpoint":
                    self.store.retry_checkpoint(
                        row["audit_run_id"],
                        row["marker_sequence"],
                        row["lease_token"],
                        error_code,
                        retryable,
                    )
                else:
                    self.store.retry_outbox(
                        row["audit_run_id"],
                        row["lease_token"],
                        error_code,
                        retryable,
                    )
            except Exception:
                # Leave the row publishing; its lease expiry is the recovery
                # mechanism when even the retry write fails.
                pass
        else:
            try:
                if row.get("publication_kind") == "checkpoint":
                    self.store.complete_checkpoint(
                        row["audit_run_id"],
                        row["marker_sequence"],
                        row["lease_token"],
                    )
                else:
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


# ---------------------------------------------------------------------------
# Uclusion token breakdown
#
# The breakdown says how many tokens a session spent on Uclusion compared with
# doing the same work without it. It reads a client's saved session log
# (Claude Code's transcript or Codex's rollout), sorts what Uclusion added to
# the context into fixed lines, and charges each line once when it arrives and
# again for every later request that re-sends it. Only line names and numbers
# ever leave this function; the log's content is read, never kept.
# ---------------------------------------------------------------------------

BREAKDOWN_METHOD = "uclusion_overhead_v1"
BREAKDOWN_LINES = (
    ("skills", "Skill and reference reads"),
    ("bootstrap", "Bootstrap block"),
    ("tool_definitions", "MCP tool definitions"),
    ("pokes", "Poke events"),
    ("export", "Export command"),
    ("export_search", "Export searches"),
    ("workflow", "Workflow steps"),
    ("repeat_reads", "Repeat reads"),
    ("uclusion_turns", "Uclusion-only turns"),
    ("mcp_framing", "MCP framing"),
)
BREAKDOWN_LINE_KEYS = tuple(key for key, _ in BREAKDOWN_LINES)
TOKEN_MANIFEST_NAME = "token-manifest.json"
TOKEN_FAMILIES = ("claude", "openai")
# Used only when a manifest is missing or names no ratio for the family.
FALLBACK_BYTES_PER_TOKEN = {"claude": 2.6, "openai": 3.6}
UCLUSION_TOOL_PREFIXES = (
    "mcp__uclusion__", "mcp_uclusion_", "uclusion/",
    "mcp__Uclusion__", "mcp_Uclusion_", "Uclusion/",
)
UCLUSION_BOOTSTRAP_MARKER = "<!-- uclusion-workflow:v1 -->"
UCLUSION_BOOTSTRAP_END_MARKER = "<!-- /uclusion-workflow:v1 -->"
UCLUSION_BOOTSTRAP_HEADING = re.compile(r"(?m)^# Uclusion bootstrap for ")
# Claude Code drops comments that start a line; one inside a code span stays.
HTML_COMMENT = re.compile(r"^<!--.*?-->[ \t]*(?:\n|$)", re.M | re.S)
FRONTMATTER = re.compile(r"\A---\n.*?\n---\n", re.S)
UCLUSION_SKILL_PATH = re.compile(r"skills/uclusion(?:-design)?/")
UCLUSION_SKILL_MARKERS = (
    "<!-- uclusion-skill:v1 -->",
    "<!-- uclusion-skill-reference:v1 -->",
    "<!-- uclusion-design-skill:v1 -->",
    "<!-- uclusion-design-reference:v1 -->",
)
UCLUSION_EXPORT_COMMAND = re.compile(
    r"(?:^|[\s;&|(])uclusion(?:\.py)?\s+(?:-e\s+\S+\s+)?export\b"
)
UCLUSION_EXPORT_PATH = re.compile(r"\.uclusion/(?:[a-z]+_)?export\b")
UCLUSION_LISTEN_COMMAND = re.compile(
    r"(?:^|[\s;&|(])uclusion(?:\.py)?\s+(?:-e\s+\S+\s+)?(?:listen|wait)\b"
)
POKE_LINE = re.compile(
    r"^(?:Start|Added|Updated|Responded)\b.*$|^Responded\.$"
)
POKE_NOTIFICATION = re.compile(r"Monitor event: \"Uclusion Poke stream")
POKE_EXPIRY = re.compile(r"\[Monitor expired after")
COMPLETION_PACKAGE_REPLY = re.compile(r"Reply `all`")
# Rendered Uclusion structure, as distinct from the job's own words.
FRAMING_LINE = re.compile(
    r"^(?:#{1,6} (?:From |Job |Note |Report |Reports|Question |Option |"
    r"Suggestion |Task |Bug |Blocker |Reply |Resolved|Current intent|"
    r"Agent token usage|Vote )|> #{1,6} |This (?:job|option) is in stage |"
    r"Stage: |Standing notes: |Capsules \(|Label - |Note version: |"
    r"Current capsule version: |Reply version: |Option version: |"
    r"No reason given\.$)"
)
ANCHOR = re.compile(r"<a name=\"[^\"]*\"></a>")
LINK_TARGET = re.compile(r"\]\((?:https?://|#)[^)\s]*\)")
STAGE_ONLY_KEYS = {"job", "stage", "open_questions", "open_suggestions"}
# Tool arguments that carry the job's own words rather than Uclusion fields.
SUBSTANCE_ARGUMENTS = {
    "question", "info", "suggestion", "description", "name", "task", "bug",
    "blocker", "report", "options", "note", "job_description",
}


def default_token_manifest_path():
    """Where the installer put this release's artifact token counts."""
    root = os.environ.get("UCLUSION_HOME")
    if root:
        return os.path.join(
            os.path.abspath(os.path.expanduser(root)), ".uclusion",
            TOKEN_MANIFEST_NAME,
        )
    return os.path.join(
        os.path.expanduser("~"), ".uclusion", TOKEN_MANIFEST_NAME
    )


def load_token_manifest(path=None):
    """Return the shipped artifact token counts, or None when unavailable."""
    path = path or default_token_manifest_path()
    try:
        with open(path, encoding="utf-8") as handle:
            manifest = json.load(handle)
    except (OSError, ValueError):
        return None
    if not isinstance(manifest, dict) or manifest.get("schema_version") != 1:
        return None
    return manifest


def _sha256_text(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def tool_definition_key(name, description, input_schema):
    """Identify one tool definition exactly as a client presents it."""
    return _sha256_text(_canonical_json({
        "name": _uclusion_tool_basename(name) or name,
        "description": description or "",
        "input_schema": input_schema or {},
    }))


def _uclusion_tool_basename(name):
    if not isinstance(name, str):
        return None
    for prefix in UCLUSION_TOOL_PREFIXES:
        if name.startswith(prefix):
            return name[len(prefix):]
    return None


class TokenCounter:
    """Turn text into tokens: shipped counts when exact, else a ratio."""

    def __init__(self, manifest, family):
        self.family = family if family in TOKEN_FAMILIES else "claude"
        manifest = manifest if isinstance(manifest, dict) else {}
        self.artifacts = manifest.get("artifacts") or {}
        self.tools = manifest.get("tools") or {}
        ratio = (manifest.get("bytes_per_token") or {}).get(self.family)
        if not isinstance(ratio, (int, float)) or ratio <= 0:
            ratio = FALLBACK_BYTES_PER_TOKEN[self.family]
        self.bytes_per_token = float(ratio)
        self.has_manifest = bool(manifest)

    def estimate(self, text):
        size = len(text.encode("utf-8")) if isinstance(text, str) else 0
        return int(round(size / self.bytes_per_token)) if size else 0

    def _shipped(self, table, key):
        entry = table.get(key)
        tokens = (
            (entry.get("tokens") or {}).get(self.family)
            if isinstance(entry, dict) else None
        )
        return tokens if isinstance(tokens, int) and tokens >= 0 else None

    def artifact(self, text):
        """Return (tokens, estimated_tokens) for shipped artifact text."""
        exact = self._shipped(self.artifacts, _sha256_text(text))
        if exact is not None:
            return exact, 0
        estimate = self.estimate(text)
        return estimate, estimate

    def tool(self, name, description, input_schema):
        key = tool_definition_key(name, description, input_schema)
        exact = self._shipped(self.tools, key)
        if exact is not None:
            return exact, 0
        estimate = self.estimate(_canonical_json({
            "name": name, "description": description,
            "input_schema": input_schema,
        }))
        return estimate, estimate

    def shipped_tool_total(self, include):
        """Sum shipped tool counts whose names ``include`` accepts."""
        total = 0
        for entry in self.tools.values():
            if not isinstance(entry, dict) or not include(entry.get("name")):
                continue
            tokens = (entry.get("tokens") or {}).get(self.family)
            if isinstance(tokens, int) and tokens >= 0:
                total += tokens
        return total


class BreakdownAccumulator:
    """Charge Uclusion content once on arrival and on every re-send."""

    def __init__(self, counter):
        self.counter = counter
        self.arrival = dict.fromkeys(BREAKDOWN_LINE_KEYS, 0)
        self.total = dict.fromkeys(BREAKDOWN_LINE_KEYS, 0)
        self.estimated = dict.fromkeys(BREAKDOWN_LINE_KEYS, 0)
        self.held = dict.fromkeys(BREAKDOWN_LINE_KEYS, 0)
        self.held_estimated = dict.fromkeys(BREAKDOWN_LINE_KEYS, 0)
        # Re-sent on every request even across compaction: the client sends
        # its instructions and tool definitions afresh each time.
        self.persistent = {"bootstrap", "tool_definitions"}
        self.in_context = set()
        self.uclusion_only_wake = False
        self.requests = 0
        self.provider_total = 0
        self.diagnostic_held = 0
        self.diagnostic_persistent = 0
        self.diagnostic_output = 0
        self.diagnostic_copies = set()
        # False while reading records outside the requested time window:
        # content still enters the context, but nothing is charged.
        self.charging = True

    def add(self, line, tokens, estimated=0, key=None):
        if not tokens:
            return
        if key is not None and line not in self.persistent:
            if key in self.in_context:
                line = "repeat_reads"
            else:
                self.in_context.add(key)
        if self.charging:
            self.arrival[line] += tokens
        self.held[line] += tokens
        self.held_estimated[line] += estimated

    def add_text(self, line, text, key=None):
        text = self.work_text(text, persistent=line in self.persistent)
        tokens = self.counter.estimate(text)
        self.add(line, tokens, tokens, key=key)

    def add_artifact(self, line, text, key=None):
        text = self.work_text(text, persistent=line in self.persistent)
        tokens, estimated = self.counter.artifact(text)
        self.add(line, tokens, estimated, key=key)

    def exclude(self, tokens, persistent=False, output=False):
        self.diagnostic_held += tokens
        if persistent:
            self.diagnostic_persistent += tokens
        if output:
            self.diagnostic_output += tokens

    def exclude_text(self, text, output=False, remember=False):
        self.exclude(self.counter.estimate(text), output=output)
        if remember and isinstance(text, str) and text:
            self.diagnostic_copies.add(text)

    def work_text(self, text, persistent=False, output=False):
        useful = text
        if isinstance(useful, str):
            for diagnostic in self.diagnostic_copies:
                useful = useful.replace("\n" + diagnostic, "").replace(diagnostic, "")
        useful = without_audit_diagnostics(useful)
        if useful != text:
            self.exclude(max(0, self.counter.estimate(text)
                             - self.counter.estimate(useful)),
                         persistent=persistent, output=output)
        return useful

    def wake(self, uclusion_only):
        self.uclusion_only_wake = bool(uclusion_only)

    def compact(self):
        for line in BREAKDOWN_LINE_KEYS:
            if line not in self.persistent:
                self.held[line] = 0
                self.held_estimated[line] = 0
        self.in_context.clear()
        self.diagnostic_held = self.diagnostic_persistent
        self.diagnostic_output = 0

    def request(self, total_tokens, output_tokens):
        """Charge one model request, then hold what it wrote."""
        total_tokens = max(0, int(total_tokens or 0))
        output_tokens = max(0, int(output_tokens or 0))
        charge = dict.fromkeys(BREAKDOWN_LINE_KEYS, 0)
        charge_estimated = dict.fromkeys(BREAKDOWN_LINE_KEYS, 0)
        if self.uclusion_only_wake:
            # A request that exists only because of Uclusion counts in full,
            # including whatever else it re-sent, and what it wrote stays
            # Uclusion's for every later request that re-sends it.
            charge["uclusion_turns"] = max(
                0, total_tokens - self.diagnostic_held
            )
            if self.diagnostic_held:
                charge_estimated["uclusion_turns"] = charge["uclusion_turns"]
            useful_output = max(0, output_tokens - self.diagnostic_output)
            if self.charging:
                self.arrival["uclusion_turns"] += useful_output
            self.held["uclusion_turns"] += useful_output
            if self.diagnostic_output:
                self.held_estimated["uclusion_turns"] += useful_output
        else:
            for line in BREAKDOWN_LINE_KEYS:
                held = min(self.held[line], total_tokens)
                charge[line] = held
                charge_estimated[line] = min(self.held_estimated[line], held)
            overflow = sum(charge.values()) - total_tokens
            if overflow > 0:
                # Estimates can exceed what the provider reports for a small
                # request; never charge Uclusion more than the request used.
                for line in reversed(BREAKDOWN_LINE_KEYS):
                    cut = min(overflow, charge[line])
                    charge[line] -= cut
                    charge_estimated[line] = min(
                        charge_estimated[line], charge[line]
                    )
                    overflow -= cut
        self.diagnostic_output = 0
        if not self.charging:
            return
        for line in BREAKDOWN_LINE_KEYS:
            self.total[line] += charge[line]
            self.estimated[line] += charge_estimated[line]
        self.requests += 1
        self.provider_total += total_tokens

    def result(self, status="available", reason=None):
        return breakdown_result(
            [
                {
                    "line": line,
                    "arrival_tokens": self.arrival[line],
                    "total_tokens": self.total[line],
                    "estimated_tokens": self.estimated[line],
                }
                for line in BREAKDOWN_LINE_KEYS
            ],
            self.provider_total,
            self.requests,
            status=status,
            reason=reason,
        )


def breakdown_result(items, provider_total, requests, status="available",
                     reason=None):
    uclusion_total = sum(item["total_tokens"] for item in items)
    result = {
        "method": BREAKDOWN_METHOD,
        "status": status,
        "items": items,
        "uclusion_total_tokens": uclusion_total,
        "provider_total_tokens": provider_total,
        "model_requests": requests,
        "reasoning": "excluded outside Uclusion-only turns",
    }
    if reason:
        result["reason"] = reason
    return result


BREAKDOWN_REASONS = (
    "log_missing", "unsupported_client_version", "no_model_requests",
    "collector_failure",
)
BREAKDOWN_WINDOW_SLACK_SECONDS = 2.0


def finalization_breakdown(result):
    """The allowlisted, numbers-only form published with an audit."""
    def clamp(value):
        value = _non_negative_int(value) or 0
        return min(value, MAX_SAFE_INTEGER)

    items = []
    for item in result.get("items") or []:
        if item.get("line") not in BREAKDOWN_LINE_KEYS:
            continue
        total = clamp(item.get("total_tokens"))
        items.append({
            "line": item["line"],
            "arrival_tokens": clamp(item.get("arrival_tokens")),
            "total_tokens": total,
            "estimated_tokens": min(clamp(item.get("estimated_tokens")), total),
        })
    status = result.get("status")
    if status not in ("available", "partial", "unavailable"):
        status = "unavailable"
    block = {
        "method": BREAKDOWN_METHOD,
        "status": status,
        "items": items,
        "uclusion_total_tokens": min(
            sum(item["total_tokens"] for item in items), MAX_SAFE_INTEGER
        ),
        "provider_total_tokens": clamp(result.get("provider_total_tokens")),
        "model_requests": clamp(result.get("model_requests")),
    }
    if block["uclusion_total_tokens"] > block["provider_total_tokens"]:
        block["uclusion_total_tokens"] = block["provider_total_tokens"]
        block["status"] = "partial"
    reason = result.get("reason")
    if reason in BREAKDOWN_REASONS:
        block["reason"] = reason
    elif status != "available":
        block["reason"] = "collector_failure"
    return block


def find_codex_rollout(thread_id, codex_home=None):
    """Return the rollout Codex saved for ``thread_id``, or None."""
    if not isinstance(thread_id, str) or not re.fullmatch(
        r"[A-Za-z0-9-]{8,64}", thread_id
    ):
        return None
    codex_home = codex_home or os.environ.get("CODEX_HOME") or os.path.join(
        os.path.expanduser("~"), ".codex"
    )
    newest = None
    for directory, _, names in os.walk(os.path.join(codex_home, "sessions")):
        for name in names:
            if name.startswith("rollout-") and name.endswith(
                "-" + thread_id + ".jsonl"
            ):
                path = os.path.join(directory, name)
                try:
                    modified = os.path.getmtime(path)
                except OSError:
                    continue
                if newest is None or modified > newest[0]:
                    newest = (modified, path)
    return newest[1] if newest else None


def unavailable_breakdown(reason):
    return breakdown_result(
        [
            {"line": line, "arrival_tokens": 0, "total_tokens": 0,
             "estimated_tokens": 0}
            for line in BREAKDOWN_LINE_KEYS
        ],
        0, 0, status="unavailable", reason=reason,
    )


def _set_charging(acc, window, created_at):
    """Charge only records inside the window; keep the state otherwise."""
    if window is None:
        acc.charging = True
    elif created_at is not None:
        acc.charging = window[0] <= created_at <= window[1]


def _text_of(content):
    """Join the text parts of a message or tool-result content value."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict):
                if isinstance(item.get("text"), str):
                    parts.append(item["text"])
                elif isinstance(item.get("content"), (str, list)):
                    parts.append(_text_of(item["content"]))
            elif isinstance(item, str):
                parts.append(item)
        return "\n".join(parts)
    if isinstance(content, dict):
        return _text_of(content.get("content") or content.get("text"))
    return ""


def without_html_comments(text):
    """The text Claude Code presents for a memory file: comments removed."""
    return HTML_COMMENT.sub("", text).strip()


def without_frontmatter(text):
    """A skill body as Claude Code's Skill tool presents it."""
    return FRONTMATTER.sub("", text, count=1)


def bootstrap_block(text):
    """Return the resident Uclusion bootstrap block inside ``text``.

    Codex shows AGENTS.md as written, markers included. Claude Code removes
    HTML comments from CLAUDE.md before sending it, so there the block is
    found by its heading and runs to the next top-level heading.
    """
    if not isinstance(text, str):
        return None
    start = text.find(UCLUSION_BOOTSTRAP_MARKER)
    end = text.find(UCLUSION_BOOTSTRAP_END_MARKER)
    if start >= 0 and end > start:
        return text[start:end + len(UCLUSION_BOOTSTRAP_END_MARKER)]
    heading = UCLUSION_BOOTSTRAP_HEADING.search(text)
    if heading is None:
        return None
    following = re.search(r"\n# ", text[heading.end():])
    stop = heading.end() + following.start() if following else len(text)
    return text[heading.start():stop].strip()


def completion_package(text):
    """Return the completion package an agent wrote, if any."""
    if not isinstance(text, str):
        return None
    match = None
    for match in COMPLETION_PACKAGE_REPLY.finditer(text):
        pass
    if match is None:
        return None
    end = text.find("\n", match.end())
    end = len(text) if end < 0 else end
    head = text.rfind("\n1. ", 0, match.start())
    if head < 0:
        return text[max(0, match.start() - 400):end]
    intro = text.rfind("\n\n", 0, head)
    return text[(intro + 2 if intro >= 0 else head):end]


def split_mcp_framing(text):
    """Split a Uclusion read into (framing, substance) text."""
    stripped = text.strip()
    if stripped.startswith("{") or stripped.startswith("["):
        return text, ""
    framing, substance = [], []
    for line in text.splitlines(keepends=True):
        if FRAMING_LINE.match(line.lstrip()):
            framing.append(line)
            continue
        anchors = "".join(ANCHOR.findall(line))
        targets = "".join(LINK_TARGET.findall(line))
        framing.append(anchors + targets)
        substance.append(LINK_TARGET.sub("]", ANCHOR.sub("", line)))
    return "".join(framing), "".join(substance)


def _argument_framing(arguments):
    """The Uclusion-required part of a write: everything but its words."""
    if not isinstance(arguments, dict):
        return "", ""
    framing, words = {}, []
    for key, value in arguments.items():
        if key in SUBSTANCE_ARGUMENTS and isinstance(value, str):
            words.append(value)
        elif key == "options" and isinstance(value, list):
            words.append(_canonical_json(value))
        elif key in {"capsule"} and isinstance(value, str):
            continue
        else:
            framing[key] = value
    return _canonical_json(framing) if framing else "", "\n".join(words)


AUDIT_DIAGNOSTIC_BLOCK = re.compile(
    r"\n?<!-- uclusion-audit:v\d+ -->.*?<!-- /uclusion-audit:v\d+ -->", re.S
)
AUDIT_REFERENCE_BLOCK = re.compile(
    r"\n?<!-- uclusion-skill-reference:v\d+ -->\s*"
    r"(?:<!--.*?-->\s*)?# Token usage audit\b.*?"
    r"<!-- /uclusion-skill-reference:v\d+ -->", re.S
)
AUDIT_HEADING = re.compile(r"^(#{1,6}) Token usage audit\s*$", re.M)
AUDIT_ROUTING = re.compile(
    r"^(- )?When the session lists `start_job_audit`,.*?"
    r"before substantive planning(?: or execution)?\.", re.M | re.S
)


def without_audit_diagnostics(text):
    """Remove dedicated audit instructions, preserving mixed work text.

    Explicit blocks cover current assets. Recognizable sections and routing
    paragraphs also cover saved logs from before those markers existed.
    Tool-name mentions alone are never an exclusion signal.
    """
    if not isinstance(text, str):
        return text
    numbered = _without_read_numbering(text)
    if numbered is not None and numbered != text:
        useful = without_audit_diagnostics(numbered)
        if useful != numbered:
            return useful
    original = text
    text = AUDIT_DIAGNOSTIC_BLOCK.sub("", text)
    text = AUDIT_REFERENCE_BLOCK.sub("", text)
    while True:
        heading = AUDIT_HEADING.search(text)
        if heading is None:
            break
        following = re.search(
            r"^#{1," + str(len(heading.group(1))) + r"} ",
            text[heading.end():], re.M,
        )
        stop = heading.end() + following.start() if following else len(text)
        text = text[:heading.start()] + text[stop:]
    text = AUDIT_ROUTING.sub(lambda match: match.group(1) or "", text)
    if text != original:
        text = re.sub(r"^- \s*(?:\n|$)", "", text, flags=re.M)
    return text


class _UclusionClassifier:
    """Sort one client's tool calls and results into breakdown lines."""

    def __init__(self, acc):
        self.acc = acc

    def uclusion_call(self, tool, arguments):
        """Charge what the agent wrote to make a Uclusion call."""
        if tool in MARKER_TOOLS:
            self.acc.exclude_text(_canonical_json({
                "name": tool, "arguments": arguments,
            }), output=True, remember=True)
            return
        framing, words = _argument_framing(arguments)
        if framing:
            self.acc.add_text("mcp_framing", framing)
        if tool == "set_design_capsule" and isinstance(
            (arguments or {}).get("capsule"), str
        ):
            self.acc.add_text("workflow", arguments["capsule"])
        if tool == "ask_for_review":
            package = completion_package(words)
            if package:
                self.acc.add_text("workflow", package)

    def uclusion_result(self, tool, arguments, text):
        if not text:
            return
        if tool in MARKER_TOOLS:
            self.acc.exclude_text(text, remember="audit_run_id" in text)
            return
        text = self.acc.work_text(text)
        arguments = arguments if isinstance(arguments, dict) else {}
        stripped = text.strip()
        if tool == "get_job" and arguments.get("stage_only"):
            self.acc.add_text("workflow", text)
            return
        if stripped.startswith("{"):
            try:
                parsed = json.loads(stripped)
            except ValueError:
                parsed = None
            if isinstance(parsed, dict) and STAGE_ONLY_KEYS <= set(parsed):
                self.acc.add_text("workflow", text)
                return
        framing, substance = split_mcp_framing(text)
        if tool == "get_job" and substance.strip():
            key = "mcp:" + _sha256_text(substance)
            if key in self.acc.in_context:
                self.acc.add_text("repeat_reads", text)
                return
            self.acc.in_context.add(key)
        self.acc.add_text("mcp_framing", framing)

    def shell_result(self, command, text):
        """Charge a shell, Read or search result if Uclusion caused it."""
        if not isinstance(command, str) or not text:
            return
        text = self.acc.work_text(text)
        if UCLUSION_LISTEN_COMMAND.search(command):
            self.acc.add_text("pokes", text)
        elif UCLUSION_EXPORT_COMMAND.search(command):
            self.acc.add_text("export", text)
        elif UCLUSION_SKILL_PATH.search(command):
            self.skill_text(text, command)
        elif UCLUSION_EXPORT_PATH.search(command):
            self.acc.add_text("export_search", text)

    def skill_text(self, text, command=None):
        """Charge skill text: shipped files exactly, anything around them
        (a Read tool's line numbers, a skill header) by size."""
        counter = self.acc.counter
        text = self.acc.work_text(text)
        if not text.strip():
            return
        remaining = text
        tokens = estimated = 0
        numbered = _without_read_numbering(remaining)
        if numbered is not None and _complete_skill_spans(numbered):
            size = len(remaining.encode("utf-8")) - len(numbered.encode("utf-8"))
            estimated = int(round(size / counter.bytes_per_token))
            tokens = estimated
            remaining = numbered
        # Delivered envelopes identify each historical body independently of
        # its path, today's installed copy, or how JavaScript batched the read.
        for start, end in reversed(_complete_skill_spans(remaining)):
            exact, guess = counter.artifact(remaining[start:end])
            tokens += exact
            estimated += guess
            remaining = remaining[:start] + remaining[end:]
        for path in _skill_files_named(command or ""):
            content = _read_installed_text(path)
            content = without_audit_diagnostics(content)
            if content and content in remaining:
                exact, guess = counter.artifact(content)
                tokens += exact
                estimated += guess
                remaining = remaining.replace(content, "", 1)
        if remaining.startswith("Base directory for this skill:"):
            header, _, body = remaining.partition("\n\n")
            exact, guess = counter.artifact(body)
            if body and not guess:
                tokens += exact
                remaining = header
        numbered = _without_read_numbering(remaining)
        if numbered is not None:
            exact, guess = counter.artifact(numbered)
            if not guess:
                tokens += exact
                size = len(remaining.encode("utf-8")) - len(
                    numbered.encode("utf-8")
                )
                rest = int(round(size / counter.bytes_per_token))
                tokens += rest
                estimated += rest
                remaining = ""
        # A saved read may predate the file currently installed at its path.
        # Its delivered body, rather than today's disk copy, keys the count.
        exact, guess = counter.artifact(remaining)
        self.acc.add(
            "skills", tokens + exact, estimated + guess,
            key="skill:" + _sha256_text(text),
        )


UCLUSION_SKILL_FILE = re.compile(
    r"((?:~|/)[^\s'\"`;|&]*skills/uclusion(?:-design)?/[^\s'\"`;|&]+\.md)"
)
READ_NUMBERING = re.compile(r"^ *\d+\t", re.M)


UCLUSION_SKILL_DIR = re.compile(
    r"((?:~|/)[^\s'\"`;|&]*skills/uclusion(?:-design)?(?:/references)?)/?(?=[\s'\"`;|&]|$)"
)
BARE_MARKDOWN = re.compile(r"(?<![/\w.-])([A-Za-z0-9_-]+\.md)\b")


def _complete_skill_spans(text):
    """Locate complete delivered file envelopes, including skill frontmatter."""
    openings = list(re.finditer(
        r"^(?:" + "|".join(re.escape(marker) for marker in UCLUSION_SKILL_MARKERS)
        + r")[ \t]*(?:\r?\n|$)", text, re.M,
    ))
    spans = []
    for index, opening in enumerate(openings):
        marker = opening.group().rstrip()
        closing = re.search(
            r"^" + re.escape(marker.replace("<!-- ", "<!-- /", 1))
            + r"(?:\r?\n|$)", text[opening.end():], re.M,
        )
        if closing is None:
            continue
        end = opening.end() + closing.end()
        if index + 1 < len(openings) and end > openings[index + 1].start():
            continue
        start = opening.start()
        frontmatter = re.search(
            r"^---\n(?:(?!^---$).)*\n---\n\Z", text[:start], re.M | re.S,
        )
        if frontmatter and re.search(
            r"^name: uclusion(?:-design)?$", frontmatter.group(), re.M,
        ):
            start = frontmatter.start()
        spans.append((start, end))
    return spans


def _has_complete_skill_body(text):
    numbered = _without_read_numbering(text)
    return bool(_complete_skill_spans(text if numbered is None else numbered))


def _skill_files_named(command):
    """Skill files a command reads, by full path or by name after a cd."""
    paths = list(UCLUSION_SKILL_FILE.findall(command))
    directories = UCLUSION_SKILL_DIR.findall(command)
    for name in BARE_MARKDOWN.findall(command):
        for directory in directories:
            for candidate in (
                os.path.join(directory, name),
                os.path.join(directory, "references", name),
            ):
                if candidate not in paths and os.path.isfile(
                    os.path.expanduser(candidate)
                ):
                    paths.append(candidate)
    return paths


def _read_installed_text(path):
    try:
        with open(os.path.expanduser(path), encoding="utf-8") as handle:
            return handle.read(1024 * 1024)
    except (OSError, UnicodeDecodeError):
        return None


def _without_read_numbering(text):
    """Undo the line numbers a Read tool adds, or None if it has none."""
    lines = text.splitlines(keepends=True)
    if not lines or not all(
        READ_NUMBERING.match(line) or not line.strip() for line in lines
    ):
        return None
    return READ_NUMBERING.sub("", text)


def _claude_usage_total(usage):
    if not isinstance(usage, dict):
        return None, 0
    total = 0
    for name in (
        "input_tokens", "cache_read_input_tokens",
        "cache_creation_input_tokens", "output_tokens",
    ):
        value = _non_negative_int(usage.get(name))
        if value is None and name in ("input_tokens", "output_tokens"):
            return None, 0
        total += value or 0
    return total, _non_negative_int(usage.get("output_tokens")) or 0


def breakdown_claude_transcript(path, counter, window=None):
    """Account one Claude Code transcript (and its subagents)."""
    acc = BreakdownAccumulator(counter)
    classifier = _UclusionClassifier(acc)
    calls = {}
    pending = None
    unknown_shapes = 0

    def flush():
        nonlocal pending
        if pending is not None:
            _set_charging(acc, window, pending["created_at"])
            acc.request(pending["total"], pending["output"])
            pending = None

    with open(path, "rb") as source:
        for raw_line in source:
            try:
                record = json.loads(raw_line.decode("utf-8"))
            except (UnicodeDecodeError, ValueError):
                unknown_shapes += 1
                continue
            if not isinstance(record, dict):
                continue
            kind = record.get("type")
            message = record.get("message")
            if kind == "assistant" and isinstance(message, dict):
                identity = (
                    record.get("requestId") or message.get("id")
                    or record.get("uuid")
                )
                total, output = _claude_usage_total(message.get("usage"))
                if pending is not None and pending["key"] != identity:
                    flush()
                if pending is None and total is not None:
                    pending = {
                        "key": identity, "total": total, "output": output,
                        "created_at": _event_timestamp(record.get("timestamp")),
                    }
                elif pending is not None and total is not None:
                    pending["total"] = max(pending["total"], total)
                    pending["output"] = max(pending["output"], output)
                for item in message.get("content") or []:
                    if not isinstance(item, dict):
                        continue
                    if item.get("type") == "tool_use":
                        calls[item.get("id")] = (
                            item.get("name"), item.get("input") or {}
                        )
                        tool = _uclusion_tool_basename(item.get("name"))
                        if tool:
                            classifier.uclusion_call(tool, item.get("input"))
                    elif item.get("type") == "text":
                        text = acc.work_text(item.get("text"), output=True)
                        package = completion_package(text)
                        if package:
                            acc.add_text("workflow", package)
                continue
            flush()
            _set_charging(
                acc, window, _event_timestamp(record.get("timestamp"))
            )
            if kind == "system" and record.get("subtype") == "compact_boundary":
                acc.compact()
                continue
            if kind == "attachment":
                attachment = record.get("attachment") or {}
                attachment_type = attachment.get("type")
                if attachment_type == "instructions":
                    for item in attachment.get("files") or []:
                        block = bootstrap_block(
                            (item or {}).get("content")
                        )
                        if block:
                            acc.add_artifact(
                                "bootstrap", block,
                                key="bootstrap:" + _sha256_text(block),
                            )
                elif attachment_type == "deferred_tools_record":
                    for entry in attachment.get("entries") or []:
                        if not isinstance(entry, dict):
                            continue
                        name = entry.get("name")
                        if not _uclusion_tool_basename(name):
                            continue
                        tokens, estimated = counter.tool(
                            name, entry.get("description"),
                            entry.get("input_schema"),
                        )
                        if _tool_basename(name):
                            acc.exclude(tokens, persistent=True)
                            continue
                        acc.add(
                            "tool_definitions", tokens, estimated,
                            key="tool:" + str(name),
                        )
                elif attachment_type == "skill_listing":
                    listing = attachment.get("content")
                    if isinstance(listing, str):
                        lines = [
                            line for line in listing.splitlines()
                            if re.match(r"^- uclusion(?:-design)?:", line)
                        ]
                        if lines:
                            acc.add_text(
                                "skills", "\n".join(lines),
                                key="skill-listing",
                            )
                continue
            if kind != "user" or not isinstance(message, dict):
                continue
            content = message.get("content")
            text = content if isinstance(content, str) else None
            if isinstance(content, list):
                tool_results = [
                    item for item in content
                    if isinstance(item, dict)
                    and item.get("type") == "tool_result"
                ]
                for item in tool_results:
                    name, arguments = calls.get(
                        item.get("tool_use_id"), (None, {})
                    )
                    result_text = _text_of(item.get("content"))
                    tool = _uclusion_tool_basename(name)
                    if tool:
                        classifier.uclusion_result(tool, arguments, result_text)
                    elif name in ("Bash", "Read", "Grep", "Glob", "Monitor"):
                        command = (
                            arguments.get("command")
                            or arguments.get("file_path")
                            or arguments.get("path")
                            or ""
                        )
                        if name == "Grep":
                            command = " ".join(
                                str(arguments.get(field) or "")
                                for field in ("path", "glob", "pattern")
                            )
                        classifier.shell_result(command, result_text)
                if not tool_results:
                    text = _text_of(content)
            if not isinstance(text, str) or not text.strip():
                continue
            text = acc.work_text(text)
            if record.get("isCompactSummary"):
                acc.compact()
                continue
            if record.get("isMeta") and any(
                marker in text for marker in UCLUSION_SKILL_MARKERS
            ):
                classifier.skill_text(text)
                continue
            if POKE_NOTIFICATION.search(text):
                acc.add_text("pokes", text)
                acc.wake(bool(POKE_EXPIRY.search(text)))
                continue
            if not record.get("isMeta"):
                acc.wake(False)
    flush()
    reason = "unsupported_client_version" if unknown_shapes else None
    return acc, reason


def _codex_usage(payload):
    usage = payload.get("usage") if isinstance(payload, dict) else None
    if not isinstance(usage, dict):
        info = payload.get("info") if isinstance(payload, dict) else None
        usage = (info or {}).get("last_token_usage") if isinstance(
            info, dict
        ) else None
    if not isinstance(usage, dict):
        return None
    input_tokens = _non_negative_int(usage.get("input_tokens"))
    output_tokens = _non_negative_int(usage.get("output_tokens"))
    if input_tokens is None or output_tokens is None:
        return None
    return input_tokens + output_tokens, output_tokens


CODEX_TOOL_CALL = re.compile(r"tools\.([A-Za-z0-9_]+)\(")
CODEX_JS_LITERAL = re.compile(
    r'"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|`(?:\\.|[^`\\])*`'
    r'|//[^\n]*|/\*.*?\*/', re.S,
)


def _audit_only_call(name, arguments):
    if _tool_basename(name):
        return True
    if name not in ("exec", "functions.exec") or not isinstance(arguments, str):
        return False
    code = CODEX_JS_LITERAL.sub(lambda match: " " * len(match.group()), arguments)
    calls = list(CODEX_TOOL_CALL.finditer(code))
    if not calls or any(not _tool_basename(call.group(1)) for call in calls):
        return False
    # Recognize only marker calls and simple result-forwarding wrappers.
    # Other JavaScript may compute or print useful work, even when the only
    # tools.* invocations are markers. Keep that mixed execution as activity.
    residual = code
    for call in reversed(calls):
        depth, end = 1, call.end()
        while end < len(code) and depth:
            depth += (code[end] == "(") - (code[end] == ")")
            end += 1
        if depth or "(" in code[call.end():end - 1]:
            return False
        residual = residual[:call.start()] + "\x00AUDIT_CALL\x00" + residual[end:]
    assigned = []

    def assignment(match):
        assigned.append(match.group(1))
        return ""

    residual = re.sub(
        r"\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*"
        r"(?:await\s+)?\x00AUDIT_CALL\x00\s*;?", assignment, residual,
    )
    residual = re.sub(
        r"\btext\(\s*(?:await\s+)?\x00AUDIT_CALL\x00\s*\)\s*;?", "", residual,
    )
    for variable in assigned:
        value = re.escape(variable) + r"(?:\.[A-Za-z_]\w*|\[\d+\])*"
        residual = re.sub(
            r"\btext\(\s*(?:" + value + r"|JSON\.stringify\(\s*"
            + value + r"\s*\))\s*\)\s*;?", "", residual,
        )
        residual = re.sub(
            r"\bfor\s*\(const\s+([A-Za-z_$][\w$]*)\s+of\s+"
            + re.escape(variable) + r"\.content\s*(?:\?\?\s*\[\])?\s*\)\s*"
            r"(\{)?\s*"
            r"(?:if\s*\(\1\.type\s*===\s+\)\s*)?"
            r"text\(\1\.text\)\s*;?(?(2)\s*\})", "", residual,
        )
    residual = re.sub(r"(?:\bawait\s+)?\x00AUDIT_CALL\x00\s*;?", "", residual)
    return not residual.strip(" \t\r\n;")


def _codex_records(path):
    records = []
    unknown = 0
    with open(path, "rb") as source:
        for raw_line in source:
            try:
                record = json.loads(raw_line.decode("utf-8"))
            except (UnicodeDecodeError, ValueError):
                unknown += 1
                continue
            if isinstance(record, dict):
                records.append(record)
            else:
                unknown += 1
    return records, unknown


def _codex_parent(metadata):
    if metadata.get("parent_thread_id"):
        return metadata["parent_thread_id"]
    source = metadata.get("source")
    subagent = source.get("subagent") if isinstance(source, dict) else None
    spawn = subagent.get("thread_spawn") if isinstance(subagent, dict) else None
    return spawn.get("parent_thread_id") if isinstance(spawn, dict) else None


def breakdown_codex_rollout(path, counter, window=None, records=None):
    """Account one Codex rollout."""
    acc = BreakdownAccumulator(counter)
    classifier = _UclusionClassifier(acc)
    calls = {}
    seen_responses = set()
    used_record_usage = False
    claims_used = False

    def include_tool(name):
        if name in MARKER_TOOLS:
            return False
        if name == "claim_work" and not claims_used:
            return False
        return isinstance(name, str)

    records, unknown_shapes = records if records is not None else _codex_records(path)
    metadata = next((r.get("payload", {}) for r in records
                     if r.get("type") == "session_meta"), {})
    if not isinstance(metadata, dict):
        metadata = {}
        unknown_shapes += 1
    inherited_before = (
        _event_timestamp(metadata.get("timestamp"))
        if _codex_parent(metadata) else None
    )
    for record in records:
        blob = _canonical_json(record)
        if "claim_work" in blob:
            claims_used = True
    for record in records:
        if record.get("type") == "token_usage_record":
            used_record_usage = True
            break

    definitions_sent = False
    for record in records:
        kind = record.get("type")
        payload = record.get("payload") if isinstance(
            record.get("payload"), dict
        ) else {}
        payload_type = payload.get("type")
        created_at = _event_timestamp(record.get("timestamp"))
        _set_charging(acc, window, created_at)
        if inherited_before is not None and created_at is not None:
            if created_at < inherited_before:
                acc.charging = False
        if not definitions_sent:
            # Codex sends every MCP tool definition with every request; the
            # rollout does not record them, so the shipped counts stand in
            # for content this session cannot show, marked as estimated.
            definitions_sent = True
            definitions = counter.shipped_tool_total(include_tool)
            acc.add("tool_definitions", definitions, definitions)
            acc.exclude(counter.shipped_tool_total(
                lambda name: name in MARKER_TOOLS
            ), persistent=True)
        usage = None
        if kind == "token_usage_record":
            response_id = payload.get("response_id")
            if response_id in seen_responses:
                continue
            seen_responses.add(response_id)
            usage = _codex_usage(payload)
        elif (
            kind == "event_msg" and payload_type == "token_count"
            and not used_record_usage
        ):
            usage = _codex_usage(payload)
        if usage is not None:
            acc.request(*usage)
            continue
        if kind == "compacted":
            acc.compact()
            continue
        if kind != "response_item":
            continue
        if payload_type == "message":
            text = acc.work_text(
                _text_of(payload.get("content")),
                output=payload.get("role") == "assistant",
            )
            if payload.get("role") not in ("user", "developer"):
                package = completion_package(text)
                if package:
                    acc.add_text("workflow", package)
                continue
            block = bootstrap_block(text)
            if block:
                acc.add_artifact(
                    "bootstrap", block, key="bootstrap:" + _sha256_text(block)
                )
                continue
            if any(marker in text for marker in UCLUSION_SKILL_MARKERS):
                classifier.skill_text(text)
                continue
            lines = [line for line in text.strip().splitlines() if line.strip()]
            if lines and all(POKE_LINE.match(line.strip()) for line in lines):
                acc.add_text("pokes", text)
                acc.wake(False)
                continue
            if payload.get("role") == "user":
                acc.wake(False)
            continue
        if payload_type in ("function_call", "custom_tool_call"):
            name = payload.get("name")
            namespace = payload.get("namespace")
            arguments = payload.get("arguments") or payload.get("input")
            if isinstance(arguments, str) and payload_type == "function_call":
                try:
                    arguments = json.loads(arguments)
                except ValueError:
                    arguments = {}
            if isinstance(namespace, str) and "uclusion" in namespace.lower():
                name = "mcp__uclusion__" + str(name)
            calls[payload.get("call_id")] = (name, arguments)
            tool = _uclusion_tool_basename(name)
            if tool:
                classifier.uclusion_call(tool, arguments)
            continue
        if payload_type in ("function_call_output", "custom_tool_call_output"):
            name, arguments = calls.get(payload.get("call_id"), (None, {}))
            output = payload.get("output")
            if name == "exec" and isinstance(arguments, str):
                if _codex_exec_output(classifier, arguments, output):
                    unknown_shapes += 1
                continue
            text = _text_of(output) if not isinstance(output, str) else output
            tool = _uclusion_tool_basename(name)
            if tool:
                classifier.uclusion_result(tool, arguments, _mcp_text(text))
            elif name in ("exec_command", "shell", "local_shell"):
                command = arguments.get("cmd") if isinstance(
                    arguments, dict
                ) else None
                if isinstance(command, list):
                    command = " ".join(str(part) for part in command)
                classifier.shell_result(command, _shell_output(text))
    reason = "unsupported_client_version" if unknown_shapes else None
    return acc, reason


def _mcp_text(text):
    """The text an MCP result showed the model, from its JSON envelope."""
    if not isinstance(text, str):
        return ""
    stripped = text.strip()
    if stripped.startswith("{"):
        try:
            parsed = json.loads(stripped)
        except ValueError:
            return text
        if isinstance(parsed, dict) and isinstance(parsed.get("content"), list):
            return _text_of(parsed["content"])
    return text


def _shell_output(text):
    if not isinstance(text, str):
        return ""
    stripped = text.strip()
    if stripped.startswith("{"):
        try:
            parsed = json.loads(stripped)
        except ValueError:
            return text
        if isinstance(parsed, dict) and isinstance(parsed.get("output"), str):
            return parsed["output"]
    return text


def _codex_exec_output(classifier, script, output):
    """Decode delivered batches without shifting a result onto another call.

    Return whether result coverage is incomplete. Indexed batch envelopes
    identify their invocation even when another member failed or was omitted.
    Unindexed results retain the client's ordered, per-tool result convention.
    """
    code = CODEX_JS_LITERAL.sub(lambda match: " " * len(match.group()), script)
    calls = list(CODEX_TOOL_CALL.finditer(code))
    invoked = [call.group(1) for call in calls]
    uclusion_calls = []
    for call in calls:
        name = call.group(1)
        if _uclusion_tool_basename(name):
            arguments = re.match(
                r"tools\." + re.escape(name) + r"\(\s*(\{.*?\})\s*\)",
                script[call.start():], flags=re.S,
            )
            if arguments:
                uclusion_calls.append((name, arguments))
    audit_only = _audit_only_call("exec", script)
    if audit_only:
        classifier.acc.diagnostic_copies.update(
            call.group() for _, call in uclusion_calls
        )
        classifier.acc.exclude_text(script, output=True)
        classifier.acc.exclude_text(_text_of(output))
    shell_commands = {}
    for index, call in enumerate(calls):
        if call.group(1) != "exec_command":
            continue
        match = re.match(
            r"\s*\{[^}]*?cmd\s*:\s*(\"(?:[^\"\\]|\\.)*\"|"
            r"'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)",
            script[call.end():], flags=re.S,
        )
        if match:
            literal = match.group(1)
            try:
                if literal.startswith('"'):
                    shell_commands[index] = json.loads(literal)
                elif "\\" not in literal and "${" not in literal:
                    shell_commands[index] = literal[1:-1]
            except ValueError:
                # Unsupported JavaScript escapes cannot safely identify a read.
                pass
    batches = []
    for batch in re.finditer(r"Promise\.(?:allSettled|all)\(\s*\[", code):
        depth = 1
        end = batch.end()
        while end < len(code) and depth:
            depth += (code[end] == "[") - (code[end] == "]")
            end += 1
        if not depth:
            batches.append([
                i for i, call in enumerate(calls)
                if batch.end() <= call.start() < end
            ])
    seen = set()
    incomplete = False
    ordered_results_trustworthy = True

    def classify(value, index=None):
        nonlocal incomplete, ordered_results_trustworthy
        if isinstance(value, list):
            for member in value:
                classify(member)
            return
        if not isinstance(value, dict):
            incomplete = True
            ordered_results_trustworthy = False
            return
        if "i" in value:
            local_index = value["i"]
            # Local indexes alone cannot distinguish separate batches when a
            # member was omitted. Only the single-batch form is unambiguous.
            if (len(batches) != 1 or type(local_index) is not int
                    or not 0 <= local_index < len(batches[0])):
                incomplete = True
                ordered_results_trustworthy = False
                index = None
            else:
                index = batches[0][local_index]
        if "result" in value:
            classify(value["result"], index)
            return
        if value.get("status") == "fulfilled" and "value" in value:
            classify(value["value"], index)
            return
        if value.get("status") == "rejected":
            incomplete = True
            if index is not None:
                seen.add(index)
            else:
                ordered_results_trustworthy = False
            return
        # Tool metadata printed by the script is not a called-tool result.
        if "name" in value and "description" in value:
            return
        shell = isinstance(value.get("output"), str)
        mcp = isinstance(value.get("content"), list)
        if not shell and not mcp:
            incomplete = True
            if index is not None:
                seen.add(index)
            else:
                ordered_results_trustworthy = False
            return
        if shell and _has_complete_skill_body(value["output"]):
            # A map/loop can deliver several reads from one lexical call. Each
            # complete body is countable even when call association is unknown.
            eligible = [
                i for i, name in enumerate(invoked)
                if name == "exec_command" and i not in seen
            ]
            if index is None and ordered_results_trustworthy and eligible:
                index = eligible[0]
            if index is not None and invoked[index] == "exec_command":
                seen.add(index)
            else:
                incomplete = True
            classifier.skill_text(value["output"])
            return
        if index is None:
            if not ordered_results_trustworthy:
                incomplete = True
                return
            eligible = [
                i for i, name in enumerate(invoked) if i not in seen
                and (name == "exec_command" if shell
                     else bool(_uclusion_tool_basename(name)))
            ]
            if not eligible:
                incomplete = True
                return
            index = eligible[0]
        seen.add(index)
        name = invoked[index]
        if shell and name == "exec_command" and index in shell_commands:
            classifier.shell_result(shell_commands[index], value["output"])
        elif mcp and _uclusion_tool_basename(name):
            text = _text_of(value["content"])
            if audit_only:
                # The whole delivery is already excluded. Decode only to
                # recognize identifiable replies when later reads copy them.
                if "audit_run_id" in text:
                    classifier.acc.diagnostic_copies.add(text)
            else:
                classifier.uclusion_result(_uclusion_tool_basename(name), {}, text)
        else:
            incomplete = True

    def result_envelope(value):
        if isinstance(value, list):
            return any(result_envelope(member) for member in value)
        if not isinstance(value, dict):
            return False
        if "result" in value:
            return result_envelope(value["result"])
        if value.get("status") == "fulfilled" and "value" in value:
            return result_envelope(value["value"])
        return (value.get("status") == "rejected"
                or isinstance(value.get("output"), str)
                or isinstance(value.get("content"), list)
                or "name" in value and "description" in value)

    def classify_plain_output(text):
        nonlocal incomplete, ordered_results_trustworthy
        if (len(invoked) == 1 and invoked[0] == "exec_command"
                and 0 in shell_commands and 0 not in seen
                and ordered_results_trustworthy):
            classify({"output": text})
        else:
            if _has_complete_skill_body(text):
                classifier.skill_text(text)
            incomplete = True
            ordered_results_trustworthy = False

    decoder = json.JSONDecoder()
    segments = output if isinstance(output, list) else [output]
    for segment in segments:
        if isinstance(segment, dict) and not isinstance(segment.get("text"), str):
            classify(segment)
            continue
        text = _text_of(segment) if not isinstance(segment, str) else segment
        if re.search(r"truncated output|\d+ tokens truncated", text or ""):
            incomplete = True
        stripped = (text or "").lstrip()
        fallback_text = text or ""
        if stripped.startswith("Warning: truncated output"):
            _, _, stripped = stripped.partition("\n\n")
            stripped = stripped.lstrip()
            fallback_text = stripped
        if stripped.startswith("Script "):
            _, separator, stripped = stripped.partition("Output:")
            if not separator:
                continue
            if stripped.startswith("\r\n"):
                stripped = stripped[2:]
            elif stripped.startswith(("\r", "\n")):
                stripped = stripped[1:]
            fallback_text = stripped
        values = []
        remaining = stripped
        while remaining:
            try:
                value, end = decoder.raw_decode(remaining)
            except ValueError:
                # Raw shell output can start with a valid JSON scalar (for
                # example a search line number). Do not consume that prefix
                # unless it is a recognizable tool envelope. Complete result
                # envelopes remain usable before a truncated trailing result.
                if any(result_envelope(value) for value in values):
                    for value in values:
                        classify(value)
                    stripped = remaining
                    fallback_text = remaining
                    incomplete = True
                    ordered_results_trustworthy = False
                classify_plain_output(fallback_text)
                break
            values.append(value)
            remaining = remaining[end:].lstrip()
        else:
            if any(result_envelope(value) for value in values):
                for value in values:
                    classify(value)
            elif values:
                classify_plain_output(fallback_text)
    if audit_only:
        return False
    if any(i not in seen for i, name in enumerate(invoked)
           if name == "exec_command" or _uclusion_tool_basename(name)):
        incomplete = True
    for name, call in uclusion_calls:
        if _tool_basename(name):
            classifier.acc.exclude_text(
                call.group(), output=True, remember=True
            )
        else:
            classifier.acc.add_text("mcp_framing", re.sub(
                r"(\"(?:[^\"\\]|\\.){200,}\"|`[^`]{200,}`)", "\"\"", call.group(1)
            ))
    return incomplete


def detect_session_log(path):
    """Return ``"claude"`` or ``"codex"`` for a session log, else None."""
    try:
        with open(path, "rb") as source:
            for _ in range(20):
                raw_line = source.readline()
                if not raw_line:
                    break
                try:
                    record = json.loads(raw_line.decode("utf-8"))
                except (UnicodeDecodeError, ValueError):
                    continue
                if not isinstance(record, dict):
                    continue
                if record.get("type") in ("session_meta", "response_item",
                                          "turn_context", "event_msg"):
                    return "codex"
                if "sessionId" in record or record.get("type") in (
                    "user", "assistant", "attachment", "summary",
                    "permission-mode", "mode", "last-prompt",
                ):
                    return "claude"
    except OSError:
        return None
    return None


def claude_subagent_logs(path):
    """Subagent transcripts Claude Code keeps beside a session transcript."""
    base = os.path.splitext(path)[0]
    directory = os.path.join(base, "subagents")
    try:
        names = sorted(os.listdir(directory))
    except OSError:
        return []
    return [
        os.path.join(directory, name) for name in names
        if name.endswith(".jsonl")
    ]


def codex_descendant_logs(path, window=None):
    """Follow explicit native parent metadata, not filenames or task guesses."""
    path = os.path.realpath(path)
    directory = os.path.dirname(path)
    ancestor = directory
    while os.path.dirname(ancestor) != ancestor:
        if os.path.basename(ancestor) in ("sessions", "archived_sessions"):
            directory = os.path.dirname(ancestor)
            break
        ancestor = os.path.dirname(ancestor)
    by_id = {}
    for parent, _, names in os.walk(directory):
        for name in names:
            if not name.endswith(".jsonl"):
                continue
            candidate = os.path.realpath(os.path.join(parent, name))
            try:
                with open(candidate, encoding="utf-8") as source:
                    record = json.loads(source.readline())
                if record.get("type") != "session_meta":
                    continue
                meta = record.get("payload") or {}
                thread = meta.get("id")
                modified = os.path.getmtime(candidate)
            except (OSError, ValueError, UnicodeDecodeError, AttributeError):
                continue
            if not isinstance(thread, str):
                continue
            old = by_id.get(thread)
            if old is None or candidate == path or (
                old[0] != path and modified > old[2]
            ):
                by_id[thread] = (candidate, meta, modified)
    root = next((thread for thread, entry in by_id.items() if entry[0] == path), None)
    if root is None:
        return [(path, {})]
    selected = [(path, by_id[root][1])]
    seen = {root}
    for _, parent_meta in selected:
        for thread, (candidate, meta, _) in sorted(by_id.items()):
            parent_id = _codex_parent(meta)
            born = _event_timestamp(meta.get("timestamp"))
            if window is not None and born is not None and born > window[1]:
                continue
            if thread not in seen and parent_id == parent_meta.get("id"):
                selected.append((candidate, meta))
                seen.add(thread)
    return selected


def _codex_spawned_agents(records, window=None):
    calls = {}
    spawned = []
    metadata = next((r.get("payload") for r in records
                     if r.get("type") == "session_meta"), {})
    metadata = metadata if isinstance(metadata, dict) else {}
    born = _event_timestamp(metadata.get("timestamp")) if _codex_parent(metadata) else None
    for record in records:
        created = _event_timestamp(record.get("timestamp"))
        if born is not None and created is not None and created < born:
            continue
        if window is not None and created is not None and created > window[1]:
            continue
        payload = record.get("payload")
        payload = payload if isinstance(payload, dict) else {}
        if payload.get("type") == "function_call" and payload.get("name") == "spawn_agent":
            arguments = _json_object(payload.get("arguments")) or {}
            calls[payload.get("call_id")] = arguments
        elif payload.get("type") == "function_call_output" and payload.get("call_id") in calls:
            result = _json_object(_text_of(payload.get("output"))) or {}
            identity = result.get("agent_id") or result.get("task_name")
            if isinstance(identity, str):
                spawned.append((identity, calls[payload["call_id"]].get("fork_turns")))
    return spawned


def breakdown_session_log(path, manifest=None, window=None):
    """Compute the Uclusion breakdown for one saved session log."""
    client = detect_session_log(path)
    if client is None:
        if not os.path.exists(path):
            return unavailable_breakdown("log_missing")
        return unavailable_breakdown("unsupported_client_version")
    if manifest is None:
        manifest = load_token_manifest()
    family = "claude" if client == "claude" else "openai"
    counter = TokenCounter(manifest, family)
    coverage = None
    try:
        if client == "claude":
            accumulators = []
            reasons = []
            for log in [path] + claude_subagent_logs(path):
                acc, reason = breakdown_claude_transcript(log, counter, window)
                accumulators.append(acc)
                if reason:
                    reasons.append(reason)
        else:
            logs = codex_descendant_logs(path, window)
            accumulators, reasons = [], []
            spawned = []
            included = set()
            for log, metadata in logs:
                try:
                    records = _codex_records(log)
                    acc, reason = breakdown_codex_rollout(
                        log, counter, window, records=records
                    )
                except OSError:
                    reasons.append("log_missing")
                    continue
                accumulators.append(acc)
                included.add(metadata.get("id"))
                spawned.extend(
                    (metadata.get("id"), identity, fork)
                    for identity, fork in _codex_spawned_agents(records[0], window)
                )
                if reason:
                    reasons.append(reason)
            missing = 0
            known_forks = {}
            for parent, identity, fork in spawned:
                child = next((meta for _, meta in logs[1:]
                              if _codex_parent(meta) == parent and identity in
                              (meta.get("id"), meta.get("agent_path"))), None)
                if child is None or child.get("id") not in included:
                    missing += 1
                else:
                    known_forks[child.get("id")] = fork
            inherited_unknown = bool(_codex_parent(logs[0][1])) or any(
                known_forks.get(meta.get("id")) != "none" for _, meta in logs[1:]
            )
            if missing or inherited_unknown:
                reasons.append("unsupported_client_version")
            coverage = {
                "descendants_discovered": len(logs) - 1,
                "descendants_included": sum(meta.get("id") in included for _, meta in logs[1:]),
                "missing_descendant_logs": missing,
                "inherited_context": "partial" if inherited_unknown else "complete",
            }
    except OSError:
        return unavailable_breakdown("log_missing")
    items = []
    for line in BREAKDOWN_LINE_KEYS:
        items.append({
            "line": line,
            "arrival_tokens": sum(a.arrival[line] for a in accumulators),
            "total_tokens": sum(a.total[line] for a in accumulators),
            "estimated_tokens": sum(a.estimated[line] for a in accumulators),
        })
    result = breakdown_result(
        items,
        sum(a.provider_total for a in accumulators),
        sum(a.requests for a in accumulators),
        status="partial" if reasons else "available",
        reason=reasons[0] if reasons else None,
    )
    result["client"] = client
    if coverage is not None:
        result["coverage"] = coverage
    if not counter.has_manifest:
        result["counts"] = "estimated_without_manifest"
    if not result["model_requests"]:
        return unavailable_breakdown("no_model_requests")
    return result


def format_breakdown(result, title="Uclusion token usage"):
    """Render a breakdown as Markdown with only line names and numbers."""
    labels = dict(BREAKDOWN_LINES)
    lines = [f"### {title}", ""]
    if result.get("status") == "unavailable":
        lines.append(
            "- Uclusion lines unavailable (`{}`).".format(
                result.get("reason") or "unknown"
            )
        )
        return "\n".join(lines) + "\n"
    total = result.get("provider_total_tokens") or 0
    uclusion = result.get("uclusion_total_tokens") or 0
    share = (uclusion / total) if total else 0.0
    lines.append(
        f"- Uclusion: **{uclusion:,} of {total:,} tokens ({share:.1%})** "
        f"across {result.get('model_requests', 0):,} model requests"
    )
    for item in result.get("items") or []:
        if not (item["arrival_tokens"] or item["total_tokens"]):
            continue
        estimated = item.get("estimated_tokens") or 0
        note = f"; {estimated:,} estimated" if estimated else ""
        lines.append(
            f"- {labels.get(item['line'], item['line'])}: "
            f"{item['arrival_tokens']:,} on arrival, "
            f"{item['total_tokens']:,} with re-sends{note}"
        )
    lines.append(
        "- Work attribution is an estimate. Optional audit definitions, "
        "recording calls and replies, and identifiable dedicated instructions "
        "are excluded, including retained copies. Raw provider totals are "
        "a separate reference."
    )
    lines.append(
        "- Mixed requests retain useful work. Saved logs do not expose exact "
        "diagnostic token boundaries or all retained reasoning, so separation "
        "uses content estimates. Reasoning tokens are excluded outside "
        "Uclusion-only turns."
    )
    if result.get("counts") == "estimated_without_manifest":
        lines.append(
            "- No artifact token manifest was found, so every count is "
            "estimated from size."
        )
    if result.get("status") == "partial":
        lines.append(
            "- Partial: `{}`.".format(result.get("reason") or "unknown")
        )
    coverage = result.get("coverage") or {}
    if coverage.get("descendants_discovered") or coverage.get("missing_descendant_logs"):
        lines.append(
            "- Native descendants: {} included; {} declared logs unavailable.".format(
                coverage.get("descendants_included", 0),
                coverage.get("missing_descendant_logs", 0),
            )
        )
    if coverage.get("inherited_context") == "partial":
        lines.append("- Inherited Uclusion context is only partially recoverable from saved logs.")
    return "\n".join(lines) + "\n"


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
    breakdown = subparsers.add_parser(
        "breakdown",
        help="Print the Uclusion token breakdown of one saved session log.",
    )
    breakdown.add_argument("--log", required=True, help="Session log path.")
    breakdown.add_argument(
        "--json", action="store_true", help="Print the result as JSON."
    )
    retry = subparsers.add_parser(
        "retry-blocked",
        help="Retry saved audit uploads after repairing their rejection or outage.",
    )
    retry.add_argument(
        "--environment", choices=("dev", "stage", "production"), required=True
    )
    retry.add_argument("--workspace-id", required=True)
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    if args.command == "retry-blocked":
        count = AuditStore(
            args.environment, args.workspace_id
        ).retry_blocked_publications()
        print(f"Requeued {count} saved audit uploads with bounded retries.")
        return 0
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
    if args.command == "breakdown":
        result = breakdown_session_log(args.log)
        if args.json:
            print(json.dumps(result, indent=2, sort_keys=True))
        else:
            sys.stdout.write(format_breakdown(result))
        return 0 if result.get("status") != "unavailable" else 1
    return 2


if __name__ == "__main__":
    sys.exit(main())
