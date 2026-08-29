#!/usr/bin/env python3
"""Relay a Codex TUI and deliver durable Uclusion Pokes to its root.

A launcher starts one private app-server. This process exposes a second Unix
WebSocket to the TUI, proxies every TUI connection to the private server, and
uses the first initialized ``codex-tui`` connection as the sole primary-root
authority. A separate app-server connection drives Pokes under the same
serialized authority.

Inbox delivery is reserve/ack rather than destructive:

* the bridge peeks past its dedicated consumer cursor;
* it records a ``sending`` row before asking Codex to start or steer a turn;
* start and steer responses record only provisional admission targets;
* either path advances the cursor only after Codex commits the exact user
  message; and
* after an ambiguous transport failure it searches persisted thread turns for
  the exact ``clientUserMessageId`` before deciding whether to retry.

Only Python's standard library is used so the installed script has no runtime
dependency beyond Codex itself.
"""

from __future__ import annotations

import argparse
import base64
import collections
import dataclasses
import hashlib
import importlib
import json
import os
import queue
import select
import selectors
import signal
import socket
import sqlite3
import stat
import struct
import subprocess
import sys
import threading
import time
from contextlib import closing, contextmanager
from typing import (
    Any,
    Callable,
    Dict,
    Iterable,
    Iterator,
    Optional,
    Sequence,
    Tuple,
)


INBOX_FILE = "poke_inbox.sqlite3"
BRIDGE_CONSUMER = "codex-bridge"
POLL_INTERVAL_SECONDS = 0.25
REQUEST_TIMEOUT_SECONDS = 10.0
PRIMARY_STALE_SECONDS = 30.0
UPDATE_CHECK_INTERVAL_SECONDS = 15 * 60
WEBSOCKET_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
MAX_WEBSOCKET_MESSAGE_BYTES = 16 * 1024 * 1024
MAX_WEBSOCKET_HEADERS_BYTES = 64 * 1024
RECENT_USER_MESSAGE_IDS = 1024
TURN_HISTORY_PAGE_SIZE = 100
HTTP_TOKEN_CHARACTERS = frozenset(
    "!#$%&'*+-.^_`|~"
    "0123456789"
    "abcdefghijklmnopqrstuvwxyz"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
)
MIN_JSON_RPC_INTEGER_ID = -(1 << 63)
MAX_JSON_RPC_INTEGER_ID = (1 << 63) - 1
TUI_CLIENT_NAME = "codex-tui"
# Relay frontend connections use positive ids. The long-lived companion
# driver uses non-positive ids so its app-server subscription can serve as a
# continuous root witness across picker unsubscribe/close.
INITIAL_DRIVER_CONNECTION_ID = 0
ROOT_SWITCH_METHODS = frozenset(
    ("thread/start", "thread/resume", "thread/fork")
)
ROOT_INVALIDATION_METHODS = frozenset(
    ("thread/unsubscribe", "thread/archive", "thread/delete")
)
ROOT_INVALIDATION_NOTIFICATIONS = frozenset(
    ("thread/closed", "thread/archived", "thread/deleted")
)
HUMAN_ADMISSION_METHODS = frozenset(
    (
        "turn/start",
        "review/start",
        "thread/compact/start",
        "thread/shellCommand",
    )
)
PRIMARY_CONTROL_BYPASS_METHODS = frozenset(
    ("turn/interrupt", "turn/steer")
)

EXIT_OK = 0
EXIT_CONFIG = 2
EXIT_PRIMARY_HELD = 3
EXIT_RELAY_FAILED = 5

_ANY_BINDING = object()


class BridgeError(Exception):
    """Base class for expected bridge failures."""


class ConfigurationError(BridgeError):
    """The launcher or hook did not provide the required identity."""


class AppServerTransportError(BridgeError):
    """The app-server connection closed or returned invalid framing."""


class AppServerTimeout(AppServerTransportError):
    """The outcome of the current request is not known."""


class AppServerRequestError(BridgeError):
    """The app-server returned a JSON-RPC error response."""

    def __init__(self, message: str, code: Any = None, data: Any = None):
        super().__init__(message)
        self.code = code
        self.data = data


class RelayProtocolError(BridgeError):
    """A TUI/backend protocol violation that makes root authority unsafe."""


@dataclasses.dataclass(frozen=True)
class BridgeConfig:
    environment: str
    workspace_id: str
    instance: str
    cwd: str
    app_server_socket: Optional[str] = None
    inbox_path: Optional[str] = None
    ready_file: Optional[str] = None
    receiver_pid_file: Optional[str] = None
    frontend_socket: Optional[str] = None
    token_audit: bool = False
    token_audit_ready_file: Optional[str] = None

    def resolved_inbox_path(self) -> str:
        if self.inbox_path:
            return os.path.abspath(os.path.expanduser(self.inbox_path))
        return os.path.join(os.path.expanduser("~"), ".uclusion", INBOX_FILE)


@dataclasses.dataclass(frozen=True)
class Binding:
    thread_id: str
    cwd: str
    promoted_at: Optional[float]
    updated_at: float
    hook_confirmed: bool


@dataclasses.dataclass(frozen=True)
class Poke:
    sequence: int
    message_id: str
    message: str


@dataclasses.dataclass(frozen=True)
class Delivery:
    sequence: int
    message_id: str
    message: str
    thread_id: str
    state: str
    turn_id: Optional[str]
    admission_method: Optional[str]
    attempt_instance: Optional[str]
    attempt_count: int


@dataclasses.dataclass(frozen=True)
class UpdateNotice:
    notice_id: str
    message: str
    thread_id: str
    state: str
    turn_id: Optional[str]
    attempt_instance: Optional[str]
    attempt_count: int


@dataclasses.dataclass(frozen=True)
class StepResult:
    action: str
    sequence: Optional[int] = None
    turn_id: Optional[str] = None
    reconnect: bool = False
    error: Optional[str] = None


@dataclasses.dataclass(frozen=True)
class RootSnapshot:
    """A relay-proven primary root held stable by a delivery lease."""

    thread_id: str
    generation: int
    connection_id: int
    active_turn_id: Optional[str] = None
    admission_pending: bool = False


@dataclasses.dataclass(frozen=True)
class DeliveryLeaseResult:
    """A stable root snapshot or the current reason delivery is blocked."""

    snapshot: Optional[RootSnapshot]
    blocked_by: Optional[str]


@dataclasses.dataclass(frozen=True)
class RelayGate:
    token: int
    connection_id: int
    method: str
    kind: str
    previous_thread_id: Optional[str]
    previous_generation: int
    target_thread_id: Optional[str] = None
    previous_turn_event_serial: int = 0


@dataclasses.dataclass
class _McpLifecycleTombstone:
    emitted_at_ms: Optional[int]
    connection_sequences: Dict[int, int]


@dataclasses.dataclass
class _RelayPending:
    method: str
    params: Dict[str, Any]
    gate: Optional[RelayGate] = None
    initialize_client_name: Optional[str] = None


def _now() -> float:
    return time.time()


def _pid_is_alive(pid: int) -> bool:
    if pid <= 0:
        return False
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    return True


def _receiver_pid_is_alive(pid: int) -> bool:
    """Detect exited-but-unreaped receivers, not merely allocated PIDs."""
    if pid <= 1:
        return False
    if sys.platform.startswith("linux"):
        pidfd_open = getattr(os, "pidfd_open", None)
        if pidfd_open is not None:
            try:
                descriptor = pidfd_open(pid, 0)
            except (OSError, ValueError):
                descriptor = None
            if descriptor is not None:
                try:
                    poller = select.poll()
                    poller.register(descriptor, select.POLLIN)
                    return not bool(poller.poll(0))
                finally:
                    os.close(descriptor)
        # Older Linux Python/kernel combinations still expose zombie state in
        # procfs. Fail closed when it cannot be inspected.
        try:
            with open(
                "/proc/{}/stat".format(pid), "r", encoding="ascii"
            ) as stat_file:
                stat = stat_file.read(4096)
        except (OSError, UnicodeError):
            return False
        close_paren = stat.rfind(")")
        if close_paren < 0:
            return False
        fields = stat[close_paren + 1 :].split()
        return bool(fields) and fields[0] not in ("Z", "X", "x")
    if (
        sys.platform == "darwin"
        and hasattr(select, "kqueue")
        and hasattr(select, "KQ_FILTER_PROC")
        and hasattr(select, "KQ_NOTE_EXIT")
    ):
        kqueue = select.kqueue()
        try:
            event = select.kevent(
                pid,
                filter=select.KQ_FILTER_PROC,
                flags=select.KQ_EV_ADD
                | select.KQ_EV_ENABLE
                | select.KQ_EV_ONESHOT,
                fflags=select.KQ_NOTE_EXIT,
            )
            return not bool(kqueue.control([event], 1, 0))
        except (OSError, ValueError):
            return False
        finally:
            kqueue.close()
    # kill(pid, 0) treats a zombie as alive. Unsupported platforms therefore
    # cannot safely deliver and must fail closed.
    return False


def _write_private_marker(path: str, value: str) -> None:
    """Create one launcher-runtime marker without following an old file."""
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    try:
        descriptor = os.open(path, flags, 0o600)
    except OSError as exc:
        raise ConfigurationError(
            "could not create runtime marker {!r}: {}".format(path, exc)
        ) from exc
    payload = (value + "\n").encode("utf-8")
    try:
        offset = 0
        while offset < len(payload):
            written = os.write(descriptor, payload[offset:])
            if written <= 0:
                raise OSError("runtime marker write made no progress")
            offset += written
        os.fsync(descriptor)
    except Exception:
        try:
            os.unlink(path)
        except OSError:
            pass
        raise
    finally:
        os.close(descriptor)


def receiver_is_alive(
    path: Optional[str],
    instance: str,
    pid_is_alive: Callable[[int], bool] = _receiver_pid_is_alive,
) -> bool:
    """Fail closed unless the launcher registered this run's live TUI pid."""
    if not path:
        return False
    try:
        with open(path, "r", encoding="utf-8") as marker:
            value = marker.read(256)
    except (OSError, UnicodeError):
        return False
    parts = value.split()
    if len(parts) != 2 or parts[0] != instance:
        return False
    try:
        pid = int(parts[1])
    except ValueError:
        return False
    return pid > 1 and pid_is_alive(pid)


class InboxStore:
    """SQLite persistence shared with the existing Uclusion Poke inbox."""

    def __init__(
        self,
        path: str,
        clock: Callable[[], float] = _now,
        pid_is_alive: Callable[[int], bool] = _pid_is_alive,
    ):
        self.path = os.path.abspath(os.path.expanduser(path))
        self.clock = clock
        self.pid_is_alive = pid_is_alive
        parent = os.path.dirname(self.path)
        if parent:
            os.makedirs(parent, mode=0o700, exist_ok=True)
        with closing(self.connect()) as connection:
            self.ensure_schema(connection)
        try:
            os.chmod(self.path, 0o600)
        except OSError:
            pass

    def connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=5)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA busy_timeout = 5000")
        return connection

    @staticmethod
    def ensure_schema(connection: sqlite3.Connection) -> None:
        """Create bridge tables and tolerate a pre-age-out inbox."""
        connection.execute("BEGIN IMMEDIATE")
        try:
            columns = [
                row[1]
                for row in connection.execute("PRAGMA table_info(poke_messages)")
            ]
            needs_migration = bool(columns) and "sequence" not in columns
            if needs_migration:
                connection.execute(
                    "ALTER TABLE poke_messages RENAME TO poke_messages_v1"
                )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS poke_messages (
                    sequence INTEGER PRIMARY KEY AUTOINCREMENT,
                    message_id TEXT NOT NULL,
                    environment TEXT NOT NULL,
                    workspace_id TEXT NOT NULL,
                    message TEXT NOT NULL,
                    received_at REAL NOT NULL,
                    consumed_at REAL,
                    UNIQUE (environment, workspace_id, message_id)
                )
                """
            )
            if needs_migration:
                connection.execute(
                    """
                    INSERT INTO poke_messages
                        (message_id, environment, workspace_id, message,
                         received_at, consumed_at)
                    SELECT message_id, environment, workspace_id, message,
                           received_at, consumed_at
                    FROM poke_messages_v1
                    ORDER BY received_at, rowid
                    """
                )
                connection.execute("DROP TABLE poke_messages_v1")
            connection.execute(
                """
                CREATE INDEX IF NOT EXISTS poke_messages_pending
                ON poke_messages(
                    environment, workspace_id, consumed_at, received_at
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS poke_consumers (
                    environment TEXT NOT NULL,
                    workspace_id TEXT NOT NULL,
                    consumer TEXT NOT NULL,
                    last_sequence INTEGER NOT NULL,
                    updated_at REAL NOT NULL,
                    PRIMARY KEY (environment, workspace_id, consumer)
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS codex_bridge_bindings (
                    environment TEXT NOT NULL,
                    workspace_id TEXT NOT NULL,
                    instance TEXT NOT NULL,
                    thread_id TEXT NOT NULL,
                    cwd TEXT NOT NULL,
                    registered_at REAL NOT NULL,
                    promoted_at REAL,
                    updated_at REAL NOT NULL,
                    hook_confirmed INTEGER NOT NULL DEFAULT 0,
                    PRIMARY KEY (environment, workspace_id, instance)
                )
                """
            )
            binding_columns = [
                row[1]
                for row in connection.execute(
                    "PRAGMA table_info(codex_bridge_bindings)"
                )
            ]
            if "hook_confirmed" not in binding_columns:
                # Any row created by the pre-bootstrap bridge came from a
                # lifecycle hook, so preserve it as confirmed on migration.
                connection.execute(
                    """
                    ALTER TABLE codex_bridge_bindings
                    ADD COLUMN hook_confirmed INTEGER NOT NULL DEFAULT 1
                    """
                )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS codex_bridge_deliveries (
                    environment TEXT NOT NULL,
                    workspace_id TEXT NOT NULL,
                    consumer TEXT NOT NULL,
                    sequence INTEGER NOT NULL,
                    message_id TEXT NOT NULL,
                    message TEXT NOT NULL,
                    thread_id TEXT NOT NULL,
                    state TEXT NOT NULL,
                    turn_id TEXT,
                    admission_method TEXT,
                    attempt_instance TEXT,
                    attempt_count INTEGER NOT NULL,
                    last_error TEXT,
                    created_at REAL NOT NULL,
                    updated_at REAL NOT NULL,
                    PRIMARY KEY (
                        environment, workspace_id, consumer, sequence
                    )
                )
                """
            )
            delivery_columns = {
                row[1]
                for row in connection.execute(
                    "PRAGMA table_info(codex_bridge_deliveries)"
                )
            }
            if "admission_method" not in delivery_columns:
                connection.execute(
                    """
                    ALTER TABLE codex_bridge_deliveries
                    ADD COLUMN admission_method TEXT
                    """
                )
            if "attempt_instance" not in delivery_columns:
                connection.execute(
                    """
                    ALTER TABLE codex_bridge_deliveries
                    ADD COLUMN attempt_instance TEXT
                    """
                )
            connection.execute(
                """
                CREATE INDEX IF NOT EXISTS codex_bridge_delivery_state
                ON codex_bridge_deliveries(
                    environment, workspace_id, consumer, state, sequence
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS codex_bridge_update_notices (
                    environment TEXT NOT NULL,
                    workspace_id TEXT NOT NULL,
                    notice_id TEXT NOT NULL,
                    message TEXT NOT NULL,
                    thread_id TEXT NOT NULL,
                    state TEXT NOT NULL,
                    turn_id TEXT,
                    attempt_instance TEXT,
                    attempt_count INTEGER NOT NULL,
                    last_error TEXT,
                    created_at REAL NOT NULL,
                    updated_at REAL NOT NULL,
                    PRIMARY KEY (environment, workspace_id, notice_id)
                )
                """
            )
            notice_columns = {
                row[1]
                for row in connection.execute(
                    "PRAGMA table_info(codex_bridge_update_notices)"
                )
            }
            if "attempt_instance" not in notice_columns:
                connection.execute(
                    """
                    ALTER TABLE codex_bridge_update_notices
                    ADD COLUMN attempt_instance TEXT
                    """
                )
            connection.execute(
                """
                CREATE INDEX IF NOT EXISTS codex_bridge_notice_state
                ON codex_bridge_update_notices(
                    environment, workspace_id, state, created_at
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS codex_bridge_primaries (
                    environment TEXT NOT NULL,
                    workspace_id TEXT NOT NULL,
                    instance TEXT NOT NULL,
                    pid INTEGER NOT NULL,
                    acquired_at REAL NOT NULL,
                    heartbeat_at REAL NOT NULL,
                    PRIMARY KEY (environment, workspace_id)
                )
                """
            )
            connection.commit()
        except Exception:
            connection.rollback()
            raise

    def bind(
        self,
        config: BridgeConfig,
        thread_id: str,
        hook_cwd: str,
        promoted: bool,
        allow_replace: bool = False,
        hook_confirmed: bool = True,
        allow_replace_confirmed: bool = True,
        expected_binding: Any = _ANY_BINDING,
    ) -> Binding:
        now = self.clock()
        cwd = os.path.realpath(hook_cwd or config.cwd)
        with closing(self.connect()) as connection:
            connection.execute("BEGIN IMMEDIATE")
            current = connection.execute(
                """
                SELECT thread_id, cwd, promoted_at, updated_at, hook_confirmed
                FROM codex_bridge_bindings
                WHERE environment = ? AND workspace_id = ? AND instance = ?
                """,
                (
                    config.environment,
                    config.workspace_id,
                    config.instance,
                ),
            ).fetchone()
            if expected_binding is not _ANY_BINDING:
                unchanged = (
                    current is None
                    if expected_binding is None
                    else (
                        current is not None
                        and current["thread_id"]
                        == expected_binding.thread_id
                        and current["cwd"] == expected_binding.cwd
                        and current["promoted_at"]
                        == expected_binding.promoted_at
                        and float(current["updated_at"])
                        == expected_binding.updated_at
                        and bool(current["hook_confirmed"])
                        == expected_binding.hook_confirmed
                    )
                )
                if not unchanged:
                    connection.commit()
                    if current is None:
                        raise BridgeError(
                            "binding disappeared before conditional write"
                        )
                    return Binding(
                        thread_id=current["thread_id"],
                        cwd=current["cwd"],
                        promoted_at=current["promoted_at"],
                        updated_at=float(current["updated_at"]),
                        hook_confirmed=bool(current["hook_confirmed"]),
                    )
            if (
                current is not None
                and current["thread_id"] != thread_id
                and (
                    not allow_replace
                    or (
                        not allow_replace_confirmed
                        and bool(current["hook_confirmed"])
                    )
                )
            ):
                connection.commit()
                existing = self.get_binding(config)
                if existing is None:
                    raise BridgeError("binding disappeared while retained")
                return existing
            connection.execute(
                """
                INSERT INTO codex_bridge_bindings
                    (environment, workspace_id, instance, thread_id, cwd,
                     registered_at, promoted_at, updated_at, hook_confirmed)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (environment, workspace_id, instance)
                DO UPDATE SET
                    thread_id = excluded.thread_id,
                    cwd = excluded.cwd,
                    registered_at =
                        CASE
                            WHEN codex_bridge_bindings.thread_id =
                                 excluded.thread_id
                            THEN codex_bridge_bindings.registered_at
                            ELSE excluded.registered_at
                        END,
                    promoted_at =
                        CASE
                            WHEN excluded.promoted_at IS NOT NULL
                            THEN excluded.promoted_at
                            WHEN codex_bridge_bindings.thread_id =
                                 excluded.thread_id
                            THEN codex_bridge_bindings.promoted_at
                            ELSE NULL
                        END,
                    updated_at = excluded.updated_at,
                    hook_confirmed =
                        CASE
                            WHEN codex_bridge_bindings.thread_id =
                                 excluded.thread_id
                            THEN MAX(
                                codex_bridge_bindings.hook_confirmed,
                                excluded.hook_confirmed
                            )
                            ELSE excluded.hook_confirmed
                        END
                """,
                (
                    config.environment,
                    config.workspace_id,
                    config.instance,
                    thread_id,
                    cwd,
                    now,
                    now if promoted else None,
                    now,
                    1 if hook_confirmed else 0,
                ),
            )
            connection.commit()
        binding = self.get_binding(config)
        if binding is None:
            raise BridgeError("binding disappeared after write")
        return binding

    def unregister(self, config: BridgeConfig, thread_id: str) -> bool:
        with closing(self.connect()) as connection:
            connection.execute("BEGIN IMMEDIATE")
            cursor = connection.execute(
                """
                DELETE FROM codex_bridge_bindings
                WHERE environment = ? AND workspace_id = ? AND instance = ?
                  AND thread_id = ?
                """,
                (
                    config.environment,
                    config.workspace_id,
                    config.instance,
                    thread_id,
                ),
            )
            connection.commit()
            return cursor.rowcount == 1

    def get_binding(self, config: BridgeConfig) -> Optional[Binding]:
        with closing(self.connect()) as connection:
            row = connection.execute(
                """
                SELECT thread_id, cwd, promoted_at, updated_at, hook_confirmed
                FROM codex_bridge_bindings
                WHERE environment = ? AND workspace_id = ? AND instance = ?
                """,
                (
                    config.environment,
                    config.workspace_id,
                    config.instance,
                ),
            ).fetchone()
        if row is None:
            return None
        return Binding(
            thread_id=row["thread_id"],
            cwd=row["cwd"],
            promoted_at=row["promoted_at"],
            updated_at=row["updated_at"],
            hook_confirmed=bool(row["hook_confirmed"]),
        )

    def initialize_consumer(
        self,
        config: BridgeConfig,
        consumer: str = BRIDGE_CONSUMER,
    ) -> int:
        """Initialize this independent consumer at the retained backlog."""
        now = self.clock()
        with closing(self.connect()) as connection:
            connection.execute("BEGIN IMMEDIATE")
            connection.execute(
                """
                INSERT OR IGNORE INTO poke_consumers
                    (environment, workspace_id, consumer, last_sequence,
                     updated_at)
                VALUES (?, ?, ?, 0, ?)
                """,
                (
                    config.environment,
                    config.workspace_id,
                    consumer,
                    now,
                ),
            )
            row = connection.execute(
                """
                SELECT last_sequence
                FROM poke_consumers
                WHERE environment = ? AND workspace_id = ? AND consumer = ?
                """,
                (config.environment, config.workspace_id, consumer),
            ).fetchone()
            connection.commit()
        return int(row["last_sequence"])

    def ignore_existing_pokes(
        self,
        config: BridgeConfig,
        consumer: str = BRIDGE_CONSUMER,
    ) -> int:
        """Atomically place one consumer after every currently durable Poke.

        The immediate transaction is the launch cutoff: inbox writers that
        commit before it are included, while writers serialized after it get
        a larger sequence and remain deliverable.  Delivery rows participate
        in the high-water mark because an ambiguous send can outlive its
        retained inbox row.  Such pre-cutoff work is terminalized so it
        cannot block later Pokes through ``get_sending``.
        """
        now = self.clock()
        with closing(self.connect()) as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                """
                SELECT COALESCE(MAX(sequence), 0) AS last_sequence
                FROM (
                    SELECT sequence
                    FROM poke_messages
                    WHERE environment = ? AND workspace_id = ?
                    UNION ALL
                    SELECT sequence
                    FROM codex_bridge_deliveries
                    WHERE environment = ? AND workspace_id = ?
                      AND consumer = ?
                )
                """,
                (
                    config.environment,
                    config.workspace_id,
                    config.environment,
                    config.workspace_id,
                    consumer,
                ),
            ).fetchone()
            cursor_row = connection.execute(
                """
                SELECT last_sequence
                FROM poke_consumers
                WHERE environment = ? AND workspace_id = ? AND consumer = ?
                """,
                (config.environment, config.workspace_id, consumer),
            ).fetchone()
            high_water = max(
                int(row["last_sequence"]),
                0 if cursor_row is None else int(cursor_row["last_sequence"]),
            )
            connection.execute(
                """
                UPDATE codex_bridge_deliveries
                SET state = 'skipped',
                    last_error =
                        'skipped by the Codex bridge launch cutoff',
                    updated_at = ?
                WHERE environment = ? AND workspace_id = ? AND consumer = ?
                  AND sequence <= ?
                  AND state IN ('pending', 'sending')
                """,
                (
                    now,
                    config.environment,
                    config.workspace_id,
                    consumer,
                    high_water,
                ),
            )
            connection.execute(
                """
                INSERT INTO poke_consumers
                    (environment, workspace_id, consumer, last_sequence,
                     updated_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT (environment, workspace_id, consumer)
                DO UPDATE SET
                    last_sequence =
                        CASE
                            WHEN excluded.last_sequence >
                                 poke_consumers.last_sequence
                            THEN excluded.last_sequence
                            ELSE poke_consumers.last_sequence
                        END,
                    updated_at = excluded.updated_at
                """,
                (
                    config.environment,
                    config.workspace_id,
                    consumer,
                    high_water,
                    now,
                ),
            )
            connection.commit()
        return high_water

    def consumer_cursor(
        self,
        config: BridgeConfig,
        consumer: str = BRIDGE_CONSUMER,
    ) -> Optional[int]:
        with closing(self.connect()) as connection:
            row = connection.execute(
                """
                SELECT last_sequence
                FROM poke_consumers
                WHERE environment = ? AND workspace_id = ? AND consumer = ?
                """,
                (config.environment, config.workspace_id, consumer),
            ).fetchone()
        return None if row is None else int(row["last_sequence"])

    def has_pending_poke(
        self,
        config: BridgeConfig,
        consumer: str = BRIDGE_CONSUMER,
    ) -> bool:
        """Read-only preflight that does not initialize the consumer."""
        with closing(self.connect()) as connection:
            row = connection.execute(
                """
                SELECT 1
                FROM poke_messages
                WHERE environment = ? AND workspace_id = ?
                  AND consumed_at IS NULL
                  AND sequence > COALESCE(
                      (
                          SELECT last_sequence
                          FROM poke_consumers
                          WHERE environment = ? AND workspace_id = ?
                            AND consumer = ?
                      ),
                      0
                  )
                LIMIT 1
                """,
                (
                    config.environment,
                    config.workspace_id,
                    config.environment,
                    config.workspace_id,
                    consumer,
                ),
            ).fetchone()
        return row is not None

    def peek_next(
        self,
        config: BridgeConfig,
        consumer: str = BRIDGE_CONSUMER,
    ) -> Optional[Poke]:
        self.initialize_consumer(config, consumer)
        with closing(self.connect()) as connection:
            row = connection.execute(
                """
                SELECT sequence, message_id, message
                FROM poke_messages
                WHERE environment = ? AND workspace_id = ?
                  AND consumed_at IS NULL
                  AND sequence > (
                      SELECT last_sequence
                      FROM poke_consumers
                      WHERE environment = ? AND workspace_id = ?
                        AND consumer = ?
                  )
                ORDER BY sequence
                LIMIT 1
                """,
                (
                    config.environment,
                    config.workspace_id,
                    config.environment,
                    config.workspace_id,
                    consumer,
                ),
            ).fetchone()
        if row is None:
            return None
        return Poke(
            sequence=int(row["sequence"]),
            message_id=row["message_id"],
            message=row["message"],
        )

    def begin_delivery(
        self,
        config: BridgeConfig,
        poke: Poke,
        thread_id: str,
        consumer: str = BRIDGE_CONSUMER,
    ) -> Delivery:
        now = self.clock()
        with closing(self.connect()) as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                """
                SELECT state, turn_id, admission_method, attempt_instance,
                       attempt_count
                FROM codex_bridge_deliveries
                WHERE environment = ? AND workspace_id = ? AND consumer = ?
                  AND sequence = ?
                """,
                (
                    config.environment,
                    config.workspace_id,
                    consumer,
                    poke.sequence,
                ),
            ).fetchone()
            if row is None:
                attempt_count = 1
                connection.execute(
                    """
                    INSERT INTO codex_bridge_deliveries
                        (environment, workspace_id, consumer, sequence,
                         message_id, message, thread_id, state, turn_id,
                         admission_method, attempt_instance, attempt_count,
                         last_error, created_at, updated_at)
                    VALUES (
                        ?, ?, ?, ?, ?, ?, ?, 'sending', NULL, NULL, NULL,
                        ?, NULL, ?, ?
                    )
                    """,
                    (
                        config.environment,
                        config.workspace_id,
                        consumer,
                        poke.sequence,
                        poke.message_id,
                        poke.message,
                        thread_id,
                        attempt_count,
                        now,
                        now,
                    ),
                )
                state = "sending"
                turn_id = None
                admission_method = None
                attempt_instance = None
            elif row["state"] == "pending":
                attempt_count = int(row["attempt_count"]) + 1
                connection.execute(
                    """
                    UPDATE codex_bridge_deliveries
                    SET state = 'sending', thread_id = ?, attempt_count = ?,
                        turn_id = NULL, admission_method = NULL,
                        attempt_instance = NULL, last_error = NULL,
                        updated_at = ?
                    WHERE environment = ? AND workspace_id = ?
                      AND consumer = ? AND sequence = ?
                    """,
                    (
                        thread_id,
                        attempt_count,
                        now,
                        config.environment,
                        config.workspace_id,
                        consumer,
                        poke.sequence,
                    ),
                )
                state = "sending"
                turn_id = None
                admission_method = None
                attempt_instance = None
            else:
                attempt_count = int(row["attempt_count"])
                state = row["state"]
                turn_id = row["turn_id"]
                admission_method = row["admission_method"]
                attempt_instance = row["attempt_instance"]
            connection.commit()
        return Delivery(
            sequence=poke.sequence,
            message_id=poke.message_id,
            message=poke.message,
            thread_id=thread_id,
            state=state,
            turn_id=turn_id,
            admission_method=admission_method,
            attempt_instance=attempt_instance,
            attempt_count=attempt_count,
        )

    def get_sending(
        self,
        config: BridgeConfig,
        consumer: str = BRIDGE_CONSUMER,
    ) -> Optional[Delivery]:
        with closing(self.connect()) as connection:
            row = connection.execute(
                """
                SELECT sequence, message_id, message, thread_id, state,
                       turn_id, admission_method, attempt_instance,
                       attempt_count
                FROM codex_bridge_deliveries
                WHERE environment = ? AND workspace_id = ? AND consumer = ?
                  AND state = 'sending'
                ORDER BY sequence
                LIMIT 1
                """,
                (config.environment, config.workspace_id, consumer),
            ).fetchone()
        if row is None:
            return None
        return Delivery(
            sequence=int(row["sequence"]),
            message_id=row["message_id"],
            message=row["message"],
            thread_id=row["thread_id"],
            state=row["state"],
            turn_id=row["turn_id"],
            admission_method=row["admission_method"],
            attempt_instance=row["attempt_instance"],
            attempt_count=int(row["attempt_count"]),
        )

    def record_sending_attempt(
        self,
        config: BridgeConfig,
        sequence: int,
        thread_id: str,
        message_id: str,
        admission_method: str,
        turn_id: Optional[str],
        consumer: str = BRIDGE_CONSUMER,
    ) -> None:
        """Persist how and where the current process attempted admission.

        This is recovery evidence, not an acknowledgement. The cursor remains
        unchanged until the exact client message is observed as committed.
        """
        if admission_method not in ("turn/start", "turn/steer"):
            raise BridgeError("invalid Codex admission method")
        if turn_id is not None and (
            not isinstance(turn_id, str) or not turn_id
        ):
            raise BridgeError("invalid Codex admission turn id")
        now = self.clock()
        with closing(self.connect()) as connection:
            connection.execute("BEGIN IMMEDIATE")
            cursor = connection.execute(
                """
                UPDATE codex_bridge_deliveries
                SET turn_id = ?, admission_method = ?,
                    attempt_instance = ?, updated_at = ?
                WHERE environment = ? AND workspace_id = ? AND consumer = ?
                  AND sequence = ? AND thread_id = ? AND message_id = ?
                  AND state = 'sending'
                """,
                (
                    turn_id,
                    admission_method,
                    config.instance,
                    now,
                    config.environment,
                    config.workspace_id,
                    consumer,
                    sequence,
                    thread_id,
                    message_id,
                ),
            )
            if cursor.rowcount != 1:
                connection.rollback()
                raise BridgeError(
                    "cannot record a turn for a non-sending delivery"
                )
            connection.commit()

    def record_sending_turn(
        self,
        config: BridgeConfig,
        sequence: int,
        thread_id: str,
        message_id: str,
        turn_id: str,
        consumer: str = BRIDGE_CONSUMER,
    ) -> None:
        """Compatibility helper for tests and persisted steer targets."""
        self.record_sending_attempt(
            config,
            sequence,
            thread_id,
            message_id,
            "turn/steer",
            turn_id,
            consumer,
        )

    def mark_pending(
        self,
        config: BridgeConfig,
        sequence: int,
        error: str,
        consumer: str = BRIDGE_CONSUMER,
    ) -> None:
        now = self.clock()
        with closing(self.connect()) as connection:
            connection.execute("BEGIN IMMEDIATE")
            connection.execute(
                """
                UPDATE codex_bridge_deliveries
                SET state = 'pending', last_error = ?, updated_at = ?
                WHERE environment = ? AND workspace_id = ? AND consumer = ?
                  AND sequence = ? AND state = 'sending'
                """,
                (
                    error,
                    now,
                    config.environment,
                    config.workspace_id,
                    consumer,
                    sequence,
                ),
            )
            connection.commit()

    def acknowledge(
        self,
        config: BridgeConfig,
        sequence: int,
        turn_id: str,
        consumer: str = BRIDGE_CONSUMER,
    ) -> None:
        """Atomically persist acceptance and advance the dedicated cursor."""
        now = self.clock()
        with closing(self.connect()) as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                """
                SELECT state
                FROM codex_bridge_deliveries
                WHERE environment = ? AND workspace_id = ? AND consumer = ?
                  AND sequence = ?
                """,
                (
                    config.environment,
                    config.workspace_id,
                    consumer,
                    sequence,
                ),
            ).fetchone()
            if row is None:
                connection.rollback()
                raise BridgeError("cannot acknowledge an unknown delivery")
            connection.execute(
                """
                UPDATE codex_bridge_deliveries
                SET state = 'accepted', turn_id = ?, last_error = NULL,
                    updated_at = ?
                WHERE environment = ? AND workspace_id = ? AND consumer = ?
                  AND sequence = ?
                """,
                (
                    turn_id,
                    now,
                    config.environment,
                    config.workspace_id,
                    consumer,
                    sequence,
                ),
            )
            connection.execute(
                """
                INSERT INTO poke_consumers
                    (environment, workspace_id, consumer, last_sequence,
                     updated_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT (environment, workspace_id, consumer)
                DO UPDATE SET
                    last_sequence =
                        CASE
                            WHEN excluded.last_sequence >
                                 poke_consumers.last_sequence
                            THEN excluded.last_sequence
                            ELSE poke_consumers.last_sequence
                        END,
                    updated_at = excluded.updated_at
                """,
                (
                    config.environment,
                    config.workspace_id,
                    consumer,
                    sequence,
                    now,
                ),
            )
            connection.commit()

    def delivery_state(
        self,
        config: BridgeConfig,
        sequence: int,
        consumer: str = BRIDGE_CONSUMER,
    ) -> Optional[str]:
        with closing(self.connect()) as connection:
            row = connection.execute(
                """
                SELECT state
                FROM codex_bridge_deliveries
                WHERE environment = ? AND workspace_id = ? AND consumer = ?
                  AND sequence = ?
                """,
                (
                    config.environment,
                    config.workspace_id,
                    consumer,
                    sequence,
                ),
            ).fetchone()
        return None if row is None else row["state"]

    def enqueue_update_notice(
        self, config: BridgeConfig, message: str
    ) -> str:
        """Persist an update notice without reading or changing a Poke cursor."""
        digest = hashlib.sha256(message.encode("utf-8")).hexdigest()
        notice_id = "uclusion-update-notice:{}".format(digest)
        now = self.clock()
        with closing(self.connect()) as connection:
            connection.execute("BEGIN IMMEDIATE")
            connection.execute(
                """
                INSERT OR IGNORE INTO codex_bridge_update_notices
                    (environment, workspace_id, notice_id, message, thread_id,
                     state, turn_id, attempt_instance, attempt_count,
                     last_error, created_at, updated_at)
                VALUES (
                    ?, ?, ?, ?, '', 'pending', NULL, NULL, 0, NULL, ?, ?
                )
                """,
                (
                    config.environment,
                    config.workspace_id,
                    notice_id,
                    message,
                    now,
                    now,
                ),
            )
            connection.commit()
        return notice_id

    def _get_update_notice(
        self, config: BridgeConfig, state: str
    ) -> Optional[UpdateNotice]:
        with closing(self.connect()) as connection:
            row = connection.execute(
                """
                SELECT notice_id, message, thread_id, state, turn_id,
                       attempt_instance, attempt_count
                FROM codex_bridge_update_notices
                WHERE environment = ? AND workspace_id = ? AND state = ?
                ORDER BY created_at, notice_id
                LIMIT 1
                """,
                (config.environment, config.workspace_id, state),
            ).fetchone()
        if row is None:
            return None
        return UpdateNotice(
            notice_id=row["notice_id"],
            message=row["message"],
            thread_id=row["thread_id"],
            state=row["state"],
            turn_id=row["turn_id"],
            attempt_instance=row["attempt_instance"],
            attempt_count=int(row["attempt_count"]),
        )

    def get_sending_update_notice(
        self, config: BridgeConfig
    ) -> Optional[UpdateNotice]:
        return self._get_update_notice(config, "sending")

    def get_pending_update_notice(
        self, config: BridgeConfig
    ) -> Optional[UpdateNotice]:
        return self._get_update_notice(config, "pending")

    def begin_update_notice(
        self,
        config: BridgeConfig,
        notice_id: str,
        thread_id: str,
    ) -> UpdateNotice:
        now = self.clock()
        with closing(self.connect()) as connection:
            connection.execute("BEGIN IMMEDIATE")
            connection.execute(
                """
                UPDATE codex_bridge_update_notices
                SET state = 'sending', thread_id = ?,
                    attempt_count = attempt_count + 1,
                    turn_id = NULL, attempt_instance = NULL,
                    last_error = NULL, updated_at = ?
                WHERE environment = ? AND workspace_id = ?
                  AND notice_id = ? AND state = 'pending'
                """,
                (
                    thread_id,
                    now,
                    config.environment,
                    config.workspace_id,
                    notice_id,
                ),
            )
            row = connection.execute(
                """
                SELECT notice_id, message, thread_id, state, turn_id,
                       attempt_instance, attempt_count
                FROM codex_bridge_update_notices
                WHERE environment = ? AND workspace_id = ? AND notice_id = ?
                """,
                (
                    config.environment,
                    config.workspace_id,
                    notice_id,
                ),
            ).fetchone()
            connection.commit()
        if row is None:
            raise BridgeError("update notice disappeared before delivery")
        return UpdateNotice(
            notice_id=row["notice_id"],
            message=row["message"],
            thread_id=row["thread_id"],
            state=row["state"],
            turn_id=row["turn_id"],
            attempt_instance=row["attempt_instance"],
            attempt_count=int(row["attempt_count"]),
        )

    def record_update_notice_attempt(
        self,
        config: BridgeConfig,
        notice_id: str,
        turn_id: Optional[str],
    ) -> None:
        """Persist a provisional turn/start target without accepting it."""
        if turn_id is not None and (
            not isinstance(turn_id, str) or not turn_id
        ):
            raise BridgeError("invalid update notice turn id")
        now = self.clock()
        with closing(self.connect()) as connection:
            connection.execute("BEGIN IMMEDIATE")
            cursor = connection.execute(
                """
                UPDATE codex_bridge_update_notices
                SET turn_id = ?, attempt_instance = ?, updated_at = ?
                WHERE environment = ? AND workspace_id = ?
                  AND notice_id = ? AND state = 'sending'
                """,
                (
                    turn_id,
                    config.instance,
                    now,
                    config.environment,
                    config.workspace_id,
                    notice_id,
                ),
            )
            if cursor.rowcount != 1:
                connection.rollback()
                raise BridgeError(
                    "cannot record a non-sending update notice attempt"
                )
            connection.commit()

    def mark_update_notice_pending(
        self, config: BridgeConfig, notice_id: str, error: str
    ) -> None:
        now = self.clock()
        with closing(self.connect()) as connection:
            connection.execute("BEGIN IMMEDIATE")
            connection.execute(
                """
                UPDATE codex_bridge_update_notices
                SET state = 'pending', last_error = ?, updated_at = ?
                WHERE environment = ? AND workspace_id = ?
                  AND notice_id = ? AND state = 'sending'
                """,
                (
                    error,
                    now,
                    config.environment,
                    config.workspace_id,
                    notice_id,
                ),
            )
            connection.commit()

    def acknowledge_update_notice(
        self, config: BridgeConfig, notice_id: str, turn_id: str
    ) -> None:
        now = self.clock()
        with closing(self.connect()) as connection:
            connection.execute("BEGIN IMMEDIATE")
            connection.execute(
                """
                UPDATE codex_bridge_update_notices
                SET state = 'accepted', turn_id = ?, last_error = NULL,
                    updated_at = ?
                WHERE environment = ? AND workspace_id = ? AND notice_id = ?
                """,
                (
                    turn_id,
                    now,
                    config.environment,
                    config.workspace_id,
                    notice_id,
                ),
            )
            connection.commit()

    def update_notice_state(
        self, config: BridgeConfig, notice_id: str
    ) -> Optional[str]:
        with closing(self.connect()) as connection:
            row = connection.execute(
                """
                SELECT state
                FROM codex_bridge_update_notices
                WHERE environment = ? AND workspace_id = ? AND notice_id = ?
                """,
                (
                    config.environment,
                    config.workspace_id,
                    notice_id,
                ),
            ).fetchone()
        return None if row is None else row["state"]

    def acquire_primary(
        self,
        config: BridgeConfig,
        pid: int,
        stale_after: float = PRIMARY_STALE_SECONDS,
    ) -> bool:
        now = self.clock()
        with closing(self.connect()) as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                """
                SELECT instance, pid, heartbeat_at
                FROM codex_bridge_primaries
                WHERE environment = ? AND workspace_id = ?
                """,
                (config.environment, config.workspace_id),
            ).fetchone()
            if row is not None:
                same_owner = (
                    row["instance"] == config.instance
                    and int(row["pid"]) == int(pid)
                )
                # Heartbeat age is diagnostic, not permission to steal from a
                # live process.  A blocked old bridge could wake after a
                # time-based takeover and race the new primary into duplicate
                # turn/start calls.  POSIX pid liveness is the fail-closed
                # ownership boundary; normal exits remove their own row.
                if not same_owner and self.pid_is_alive(int(row["pid"])):
                    connection.rollback()
                    return False
            connection.execute(
                """
                INSERT INTO codex_bridge_primaries
                    (environment, workspace_id, instance, pid, acquired_at,
                     heartbeat_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT (environment, workspace_id)
                DO UPDATE SET
                    instance = excluded.instance,
                    pid = excluded.pid,
                    acquired_at = excluded.acquired_at,
                    heartbeat_at = excluded.heartbeat_at
                """,
                (
                    config.environment,
                    config.workspace_id,
                    config.instance,
                    int(pid),
                    now,
                    now,
                ),
            )
            connection.commit()
            return True

    def refresh_primary(self, config: BridgeConfig, pid: int) -> bool:
        now = self.clock()
        with closing(self.connect()) as connection:
            connection.execute("BEGIN IMMEDIATE")
            cursor = connection.execute(
                """
                UPDATE codex_bridge_primaries
                SET heartbeat_at = ?
                WHERE environment = ? AND workspace_id = ?
                  AND instance = ? AND pid = ?
                """,
                (
                    now,
                    config.environment,
                    config.workspace_id,
                    config.instance,
                    int(pid),
                ),
            )
            connection.commit()
            return cursor.rowcount == 1

    def release_primary(self, config: BridgeConfig, pid: int) -> None:
        with closing(self.connect()) as connection:
            connection.execute("BEGIN IMMEDIATE")
            connection.execute(
                """
                DELETE FROM codex_bridge_primaries
                WHERE environment = ? AND workspace_id = ?
                  AND instance = ? AND pid = ?
                """,
                (
                    config.environment,
                    config.workspace_id,
                    config.instance,
                    int(pid),
                ),
            )
            connection.commit()


def thread_status_type(thread: Dict[str, Any]) -> Optional[str]:
    status = thread.get("status")
    if isinstance(status, dict):
        value = status.get("type")
        return value if isinstance(value, str) else None
    return status if isinstance(status, str) else None


def in_progress_turn_id(thread: Dict[str, Any]) -> Optional[str]:
    """Return the sole in-progress turn id from a populated thread history."""
    turns = thread.get("turns")
    if turns is None:
        return None
    if not isinstance(turns, list):
        raise RelayProtocolError("thread turns is not a list")
    active_turn_id: Optional[str] = None
    for index, turn in enumerate(turns):
        if not isinstance(turn, dict):
            raise RelayProtocolError(
                "thread turn {} is not an object".format(index)
            )
        turn_id = turn.get("id")
        status = turn.get("status")
        if not isinstance(turn_id, str) or not turn_id:
            raise RelayProtocolError(
                "thread turn {} has no valid id".format(index)
            )
        if not isinstance(status, str) or not status:
            raise RelayProtocolError(
                "thread turn {} has no valid status".format(index)
            )
        if status != "inProgress":
            continue
        if active_turn_id is not None:
            raise RelayProtocolError(
                "thread history has multiple in-progress turns"
            )
        active_turn_id = turn_id
    return active_turn_id


def correlated_turn_id(thread: Dict[str, Any], message_id: str) -> Optional[str]:
    """Find an exact client id, or fail if absence cannot be proven safely."""
    turns = thread.get("turns")
    if not isinstance(turns, list):
        raise RelayProtocolError(
            "thread/read reconciliation response has no turns list"
        )
    matched_turn_id: Optional[str] = None
    for turn_index, turn in enumerate(turns):
        if not isinstance(turn, dict):
            raise RelayProtocolError(
                "thread/read reconciliation turn {} is not an object".format(
                    turn_index
                )
            )
        turn_id = turn.get("id")
        if not isinstance(turn_id, str) or not turn_id:
            raise RelayProtocolError(
                "thread/read reconciliation turn {} has no valid id".format(
                    turn_index
                )
            )
        items = turn.get("items")
        if not isinstance(items, list):
            raise RelayProtocolError(
                "thread/read reconciliation turn {} has no items list".format(
                    turn_index
                )
            )
        for item_index, item in enumerate(items):
            if not isinstance(item, dict):
                raise RelayProtocolError(
                    "thread/read reconciliation item {}:{} is not an object"
                    .format(turn_index, item_index)
                )
            item_type = item.get("type")
            if not isinstance(item_type, str) or not item_type:
                raise RelayProtocolError(
                    "thread/read reconciliation item {}:{} has no valid type"
                    .format(turn_index, item_index)
                )
            client_id = item.get("clientId")
            if (
                "clientId" in item
                and client_id is not None
                and not isinstance(client_id, str)
            ):
                raise RelayProtocolError(
                    "thread/read reconciliation item {}:{} has an invalid "
                    "clientId".format(turn_index, item_index)
                )
            if (
                item_type == "userMessage"
                and client_id == message_id
            ):
                if matched_turn_id is not None:
                    raise RelayProtocolError(
                        "thread history contains duplicate user messages "
                        "for one client id"
                    )
                matched_turn_id = turn_id
    return matched_turn_id


def terminal_turn_in_history(
    thread: Dict[str, Any], expected_turn_id: str
) -> bool:
    """Return whether one exact persisted turn is terminal, validating IDs."""
    turns = thread.get("turns")
    if not isinstance(turns, list):
        raise RelayProtocolError(
            "thread/read reconciliation response has no turns list"
        )
    matched_status: Optional[str] = None
    for index, turn in enumerate(turns):
        if not isinstance(turn, dict):
            raise RelayProtocolError(
                "thread/read reconciliation turn {} is not an object".format(
                    index
                )
            )
        turn_id = turn.get("id")
        status = turn.get("status")
        if not isinstance(turn_id, str) or not turn_id:
            raise RelayProtocolError(
                "thread/read reconciliation turn {} has no valid id".format(
                    index
                )
            )
        if not isinstance(status, str) or not status:
            raise RelayProtocolError(
                "thread/read reconciliation turn {} has no valid status"
                .format(index)
            )
        if status not in (
            "inProgress",
            "completed",
            "interrupted",
            "failed",
        ):
            raise RelayProtocolError(
                "thread/read reconciliation turn {} has an unknown status"
                .format(index)
            )
        if turn_id != expected_turn_id:
            continue
        if matched_status is not None:
            raise RelayProtocolError(
                "thread history contains a duplicate turn id"
            )
        matched_status = status
    return (
        matched_status is not None
        and matched_status != "inProgress"
    )


def rpc_id_key(value: Any) -> Tuple[str, Any]:
    """Return a type-sensitive key for a supported JSON-RPC id."""
    if isinstance(value, int) and not isinstance(value, bool):
        if not MIN_JSON_RPC_INTEGER_ID <= value <= MAX_JSON_RPC_INTEGER_ID:
            raise RelayProtocolError(
                "JSON-RPC integer id is outside signed 64-bit range"
            )
        return ("int", value)
    if isinstance(value, str):
        return ("str", value)
    raise RelayProtocolError(
        "JSON-RPC id must be a string or signed 64-bit integer"
    )


def _message_request_id(message: Dict[str, Any]) -> Tuple[str, Any]:
    if "id" not in message:
        raise RelayProtocolError(
            "authority-changing JSON-RPC request has no id"
        )
    return rpc_id_key(message["id"])


def _strict_json_object(payload: bytes, peer: str) -> Dict[str, Any]:
    def reject_duplicate_members(
        pairs: Sequence[Tuple[str, Any]],
    ) -> Dict[str, Any]:
        result: Dict[str, Any] = {}
        for name, value in pairs:
            if name in result:
                raise ValueError(
                    "duplicate JSON member {}".format(name)
                )
            result[name] = value
        return result

    def finite_float(value: str) -> float:
        result = float(value)
        if result != result or result in (float("inf"), float("-inf")):
            raise ValueError("non-finite JSON number")
        return result

    try:
        decoded = payload.decode("utf-8")
        message = json.loads(
            decoded,
            object_pairs_hook=reject_duplicate_members,
            parse_float=finite_float,
            parse_constant=lambda value: (_ for _ in ()).throw(
                ValueError("invalid JSON constant {}".format(value))
            ),
        )
    except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
        raise RelayProtocolError(
            "{} sent invalid JSON".format(peer)
        ) from exc
    if not isinstance(message, dict):
        raise RelayProtocolError(
            "{} JSON-RPC message is not an object".format(peer)
        )
    if "id" in message:
        rpc_id_key(message["id"])
    return message


def _validate_response_envelope(
    message: Dict[str, Any], peer: str
) -> Tuple[str, Any]:
    if "method" in message:
        raise RelayProtocolError(
            "{} JSON-RPC response unexpectedly contains method".format(peer)
        )
    if "id" not in message:
        raise RelayProtocolError(
            "{} JSON-RPC response has no id".format(peer)
        )
    key = rpc_id_key(message["id"])
    has_result = "result" in message
    has_error = "error" in message
    if has_result == has_error:
        raise RelayProtocolError(
            "{} JSON-RPC response must contain exactly one of result/error"
            .format(peer)
        )
    if has_error and not isinstance(message.get("error"), dict):
        raise RelayProtocolError(
            "{} JSON-RPC response error is not an object".format(peer)
        )
    return key


_VALID_WEBSOCKET_CLOSE_CODES = frozenset(
    (
        1000,
        1001,
        1002,
        1003,
        1007,
        1008,
        1009,
        1010,
        1011,
        1012,
        1013,
        1014,
    )
)


def _validate_websocket_close_payload(
    payload: bytes,
    peer: str,
    error_type: Callable[[str], Exception],
) -> Optional[int]:
    if len(payload) == 1:
        raise error_type(
            "{} sent a one-byte WebSocket Close payload".format(peer)
        )
    if not payload:
        return None
    code = struct.unpack("!H", payload[:2])[0]
    if (
        code not in _VALID_WEBSOCKET_CLOSE_CODES
        and not 3000 <= code <= 4999
    ):
        raise error_type(
            "{} sent invalid WebSocket Close code {}".format(peer, code)
        )
    try:
        payload[2:].decode("utf-8")
    except UnicodeDecodeError as exc:
        raise error_type(
            "{} sent a non-UTF-8 WebSocket Close reason".format(peer)
        ) from exc
    return code


def _thread_id_param(params: Dict[str, Any]) -> Optional[str]:
    value = params.get("threadId")
    return value if isinstance(value, str) and value else None


def _side_fork(params: Dict[str, Any]) -> bool:
    return params.get("ephemeral") is True and params.get(
        "excludeTurns"
    ) is True


def _non_root_thread(thread: Dict[str, Any]) -> bool:
    thread_id = thread.get("id")
    session_id = thread.get("sessionId")
    return (
        thread.get("parentThreadId") is not None
        or (
            isinstance(thread_id, str)
            and isinstance(session_id, str)
            and session_id != thread_id
        )
    )


def _needs_fresh_primary_witness(method: str) -> bool:
    """Whether Codex can return before its new rollout file exists."""
    return method == "thread/start"


class RootAuthority:
    """Serialize TUI root/admission requests with Poke admission.

    The relay is the sole writer of this state. Broadcast notifications may
    invalidate the current root, but they can never establish or replace it.
    """

    def __init__(self, cwd: str, enforce_root_handoff: bool = False):
        self.cwd = os.path.realpath(cwd)
        self.enforce_root_handoff = enforce_root_handoff
        self.condition = threading.Condition()
        self.primary_connection_id: Optional[int] = None
        self.primary_live = False
        self.thread_id: Optional[str] = None
        self.root_lifecycle_epoch: Optional[int] = None
        self.active_turn_id: Optional[str] = None
        self.admission_pending = False
        self.mcp_notification_sequence_by_connection: Dict[int, int] = {}
        self.mcp_retired_connection_ids = set()
        self.mcp_lifecycle_tombstones: Dict[
            str, _McpLifecycleTombstone
        ] = {}
        self.mcp_lifecycle_epoch_by_thread: Dict[str, int] = {}
        self.mcp_driver_connection_id: Optional[int] = None
        self.mcp_driver_pinned_threads = set()
        # Codex does not create a rollout for a fresh thread until its first
        # turn. The primary thread/start stream is therefore the audit and
        # lifecycle witness until that thread can be resumed normally.
        self.mcp_primary_witness_thread_id: Optional[str] = None
        self.mcp_primary_witness_lifecycle_epoch: Optional[int] = None
        # A fresh root initially has no resumable rollout, so token-audit
        # notifications come from the primary stream.  When that same root is
        # later pinned on the driver, keep the primary as the ordered prefix
        # through the origin fence and queue driver copies until both streams
        # have been fenced.  Otherwise the subscribe acknowledgment can make
        # the primary ineligible while an origin-only notification is still
        # waiting behind the root response.
        self.mcp_audit_handoff_source_connection_id: Optional[int] = None
        self.mcp_audit_handoff_thread_id: Optional[str] = None
        self.mcp_audit_handoff_lifecycle_epoch: Optional[int] = None
        self.mcp_audit_handoff_driver_notifications = collections.deque()
        self.turn_event_serial = 0
        self.generation = 0
        self.driver_active = False
        self.tui_gate: Optional[RelayGate] = None
        self.tui_gate_external_invalidation = False
        self.tui_gate_root_thread_id: Optional[str] = None
        self.tui_gate_root_lifecycle_epoch: Optional[int] = None
        self.tui_gate_root_handoff_complete = False
        self.tui_gate_root_primary_witness_only = False
        self.tui_gate_previous_active_turn_id: Optional[str] = None
        self.tui_gate_previous_admission_pending = False
        self.tui_gate_turn_events = []
        self.recent_user_messages = collections.OrderedDict()
        self.tui_waiters = 0
        self.next_token = 1
        self.fatal_error: Optional[str] = None

    def claim_primary(self, connection_id: int) -> bool:
        """Claim the first successfully initialized codex-tui connection."""
        with self.condition:
            self._raise_if_fatal()
            if self.primary_connection_id is None:
                self.primary_connection_id = connection_id
                self.primary_live = True
                self.condition.notify_all()
                return True
            return self.primary_connection_id == connection_id

    def is_primary(self, connection_id: int) -> bool:
        with self.condition:
            return (
                self.primary_live
                and self.primary_connection_id == connection_id
            )

    def handoffs_abandoned_after_primary_close(self) -> bool:
        """Return whether normal primary exit made every handoff irrelevant."""
        with self.condition:
            return (
                self.fatal_error is None
                and self.primary_connection_id is not None
                and not self.primary_live
            )

    def fail(self, message: str) -> None:
        with self.condition:
            if self.fatal_error is None:
                self.fatal_error = message
            self.primary_live = False
            self.thread_id = None
            self.root_lifecycle_epoch = None
            self.active_turn_id = None
            self.admission_pending = False
            self.mcp_notification_sequence_by_connection = {}
            self.mcp_retired_connection_ids = set()
            self.mcp_lifecycle_tombstones = {}
            self.mcp_lifecycle_epoch_by_thread = {}
            self.mcp_driver_connection_id = None
            self.mcp_driver_pinned_threads = set()
            self.mcp_primary_witness_thread_id = None
            self.mcp_primary_witness_lifecycle_epoch = None
            self.tui_gate_root_thread_id = None
            self.tui_gate_root_lifecycle_epoch = None
            self.tui_gate_root_handoff_complete = False
            self.tui_gate_root_primary_witness_only = False
            self.generation += 1
            self.condition.notify_all()

    def primary_disconnected(self, connection_id: int, reason: str) -> None:
        with self.condition:
            if self.primary_connection_id == connection_id:
                self.fail(reason)

    def primary_closed_cleanly(self, connection_id: int) -> None:
        """Revoke a quitting TUI without making normal exit a failure."""
        with self.condition:
            if self.primary_connection_id != connection_id:
                return
            self.primary_live = False
            self.thread_id = None
            self.root_lifecycle_epoch = None
            self.active_turn_id = None
            self.admission_pending = False
            self.mcp_notification_sequence_by_connection = {}
            self.mcp_retired_connection_ids = set()
            self.mcp_lifecycle_tombstones = {}
            self.mcp_lifecycle_epoch_by_thread = {}
            self.mcp_driver_pinned_threads = set()
            self.mcp_primary_witness_thread_id = None
            self.mcp_primary_witness_lifecycle_epoch = None
            self.tui_gate_root_thread_id = None
            self.tui_gate_root_lifecycle_epoch = None
            self.tui_gate_root_handoff_complete = False
            self.tui_gate_root_primary_witness_only = False
            self.generation += 1
            self.condition.notify_all()

    def driver_connected(self, connection_id: int) -> None:
        """Install the long-lived app-server connection used for root pins."""
        with self.condition:
            self._raise_if_fatal()
            self.mcp_driver_connection_id = connection_id
            self.mcp_retired_connection_ids.discard(connection_id)
            self.condition.notify_all()

    def driver_thread_is_pinned(self, thread_id: str) -> bool:
        with self.condition:
            return (
                self.mcp_driver_connection_id is not None
                and thread_id in self.mcp_driver_pinned_threads
            )

    def primary_notification_is_audit_witness(
        self, connection_id: int, message: Dict[str, Any]
    ) -> bool:
        """Whether this primary-stream event is the sole audit copy.

        A fresh ``thread/start`` has no rollout that the companion driver can
        resume, so its authoritative primary relay stream owns token-audit
        observation until a later root handoff pins the driver. Resumed roots
        are observed on that driver instead; rejecting their primary fan-out
        copy here prevents duplicate marker, activity, and usage ingestion.
        """
        params = message.get("params")
        if not isinstance(params, dict):
            return False
        event_thread_id = params.get("threadId")
        if event_thread_id is not None and (
            not isinstance(event_thread_id, str) or not event_thread_id
        ):
            return False
        with self.condition:
            witness_thread_id = self.mcp_primary_witness_thread_id
            audit_handoff_active = (
                self.mcp_audit_handoff_source_connection_id
                == connection_id
                and self.mcp_audit_handoff_thread_id
                == witness_thread_id
                and self.mcp_audit_handoff_lifecycle_epoch
                == self.mcp_primary_witness_lifecycle_epoch
            )
            return (
                self.primary_live
                and self.primary_connection_id == connection_id
                and self.thread_id == witness_thread_id
                and witness_thread_id is not None
                and (
                    event_thread_id is None
                    or event_thread_id == witness_thread_id
                )
                and (
                    witness_thread_id
                    not in self.mcp_driver_pinned_threads
                    or audit_handoff_active
                )
                and self.mcp_primary_witness_lifecycle_epoch
                == self.mcp_lifecycle_epoch_by_thread.get(
                    witness_thread_id, 0
                )
            )

    def begin_primary_audit_handoff(
        self,
        source_connection_id: int,
        thread_id: str,
        expected_lifecycle_epoch: int,
    ) -> bool:
        """Hold driver audit copies while a fresh primary is fenced.

        Returns false when the origin is not the current fresh-primary audit
        witness.  Resumed roots already owned by the driver need no audit
        cutover; their ordinary driver subscription/fence remains unchanged.
        """
        with self.condition:
            self._raise_if_fatal()
            if self.mcp_audit_handoff_thread_id is not None:
                raise RelayProtocolError(
                    "another token-audit handoff is already active"
                )
            if not (
                self.primary_live
                and self.primary_connection_id == source_connection_id
                and self.thread_id == thread_id
                and self.mcp_primary_witness_thread_id == thread_id
                and self.mcp_primary_witness_lifecycle_epoch
                == expected_lifecycle_epoch
                and self.mcp_lifecycle_epoch_by_thread.get(thread_id, 0)
                == expected_lifecycle_epoch
            ):
                return False
            self.mcp_audit_handoff_source_connection_id = (
                source_connection_id
            )
            self.mcp_audit_handoff_thread_id = thread_id
            self.mcp_audit_handoff_lifecycle_epoch = (
                expected_lifecycle_epoch
            )
            self.mcp_audit_handoff_driver_notifications.clear()
            return True

    def buffer_driver_audit_notification(
        self, connection_id: int, message: Dict[str, Any]
    ) -> bool:
        """Queue a target-root driver copy during audit handoff."""
        params = message.get("params")
        if not isinstance(params, dict):
            return False
        event_thread_id = params.get("threadId")
        if event_thread_id is not None and (
            not isinstance(event_thread_id, str) or not event_thread_id
        ):
            return False
        with self.condition:
            handoff_thread_id = self.mcp_audit_handoff_thread_id
            if not (
                handoff_thread_id is not None
                and connection_id == self.mcp_driver_connection_id
                and (
                    event_thread_id is None
                    or event_thread_id == handoff_thread_id
                )
            ):
                return False
            self.mcp_audit_handoff_driver_notifications.append(message)
            return True

    def take_primary_audit_handoff_batch(
        self, source_connection_id: int, thread_id: str
    ) -> Tuple[Tuple[Dict[str, Any], ...], bool]:
        """Take the next driver batch, atomically releasing on empty.

        While a non-empty batch is observed the handoff stays active, so new
        driver notifications remain queued while the caller invokes the audit
        observer.  An empty queue and ownership release happen under the same
        lock, preventing a live driver callback from overtaking a buffered
        batch.
        """
        with self.condition:
            if (
                self.mcp_audit_handoff_source_connection_id
                != source_connection_id
                or self.mcp_audit_handoff_thread_id != thread_id
            ):
                return (), True
            if self.mcp_audit_handoff_driver_notifications:
                batch = tuple(
                    self.mcp_audit_handoff_driver_notifications
                )
                self.mcp_audit_handoff_driver_notifications.clear()
                return batch, False
            self.mcp_audit_handoff_source_connection_id = None
            self.mcp_audit_handoff_thread_id = None
            self.mcp_audit_handoff_lifecycle_epoch = None
            return (), True

    def driver_thread_pin_epoch(self, thread_id: str) -> int:
        with self.condition:
            self._raise_if_fatal()
            if self.mcp_driver_connection_id is None:
                raise RelayProtocolError(
                    "companion driver is not connected"
                )
            return self.mcp_lifecycle_epoch_by_thread.get(thread_id, 0)

    def driver_thread_pinned(
        self,
        thread_id: str,
        expected_lifecycle_epoch: Optional[int] = None,
    ) -> None:
        with self.condition:
            self._raise_if_fatal()
            if (
                self.primary_connection_id is not None
                and not self.primary_live
            ):
                # A late subscribe response after a normal TUI Close runs on
                # the driver's reader thread. Treat it as abandoned here so
                # its callback cannot poison that continuous connection before
                # the relay-side handoff unwinds.
                return
            if self.mcp_driver_connection_id is None:
                raise RelayProtocolError(
                    "companion driver is not connected"
                )
            if (
                expected_lifecycle_epoch is not None
                and self.mcp_lifecycle_epoch_by_thread.get(thread_id, 0)
                != expected_lifecycle_epoch
            ):
                raise RelayProtocolError(
                    "{} was invalidated while the companion driver "
                    "subscribed".format(thread_id)
                )
            driver_connection_id = self.mcp_driver_connection_id
            tombstone = self.mcp_lifecycle_tombstones.get(thread_id)
            if tombstone is not None:
                # The ordered resume acknowledgment is a fresh subscription
                # cut. Events later on this same driver stream are post-
                # lifecycle even if no lifecycle copy was ever routed here.
                tombstone.connection_sequences[driver_connection_id] = (
                    self.mcp_notification_sequence_by_connection.get(
                        driver_connection_id, 0
                    )
                )
            self.mcp_driver_pinned_threads.add(thread_id)
            self.condition.notify_all()

    def connection_root_subscribed(
        self,
        connection_id: int,
        thread_id: str,
        primary_witness_only: bool = False,
    ) -> int:
        """Record a root-response cut and return its lifecycle epoch."""
        with self.condition:
            self._raise_if_fatal()
            if connection_id in self.mcp_retired_connection_ids:
                raise RelayProtocolError(
                    "retired connection completed a root subscription"
                )
            if primary_witness_only and (
                self.primary_connection_id != connection_id
                or self.tui_gate is None
                or self.tui_gate.kind != "root"
                or self.tui_gate.method != "thread/start"
                or self.tui_gate.connection_id != connection_id
            ):
                raise RelayProtocolError(
                    "fresh primary witness did not match a held thread/start "
                    "root gate"
                )
            tombstone = self.mcp_lifecycle_tombstones.get(thread_id)
            if tombstone is not None:
                tombstone.connection_sequences[connection_id] = (
                    self.mcp_notification_sequence_by_connection.get(
                        connection_id, 0
                    )
                )
            lifecycle_epoch = self.mcp_lifecycle_epoch_by_thread.get(
                thread_id, 0
            )
            if (
                self.tui_gate is not None
                and self.tui_gate.kind == "root"
                and self.tui_gate.connection_id == connection_id
            ):
                if self.tui_gate_root_thread_id is not None:
                    raise RelayProtocolError(
                        "primary root gate received more than one root "
                        "subscription response"
                    )
                self.tui_gate_root_thread_id = thread_id
                self.tui_gate_root_lifecycle_epoch = lifecycle_epoch
                self.tui_gate_root_handoff_complete = False
                self.tui_gate_root_primary_witness_only = (
                    primary_witness_only
                )
            self.condition.notify_all()
            return lifecycle_epoch

    def driver_disconnected(self, connection_id: int) -> None:
        """Fail the session closed when its root/audit witness is lost.

        A replacement initialized connection is not retroactively subscribed
        to already-loaded threads, so reconnecting cannot safely inherit
        the current root lifecycle.
        """
        with self.condition:
            if self.mcp_driver_connection_id != connection_id:
                return
            self.fail(
                "companion app-server driver lost its continuous "
                "root/audit witness"
            )

    def _raise_if_fatal(self) -> None:
        if self.fatal_error is not None:
            raise RelayProtocolError(self.fatal_error)

    def _root_witness_blocker(self) -> Optional[str]:
        """Return why the current root lacks a live lifecycle witness."""
        if not self.enforce_root_handoff:
            return None
        if self.thread_id is None:
            return "primary root is not established"
        if self.thread_id == self.mcp_primary_witness_thread_id:
            if (
                not self.primary_live
                or self.primary_connection_id is None
                or self.mcp_primary_witness_lifecycle_epoch
                != self.mcp_lifecycle_epoch_by_thread.get(self.thread_id, 0)
            ):
                return "fresh primary root witness is stale"
            return None
        if self.root_lifecycle_epoch != self.mcp_lifecycle_epoch_by_thread.get(
            self.thread_id, 0
        ):
            return "primary root lifecycle witness is stale"
        if self.mcp_driver_connection_id is None:
            return "companion driver is not connected"
        if self.thread_id not in self.mcp_driver_pinned_threads:
            return "primary root is not pinned on the companion driver"
        return None

    def _next_mcp_notification_sequence(self, connection_id: int) -> int:
        sequence = (
            self.mcp_notification_sequence_by_connection.get(
                connection_id, 0
            )
            + 1
        )
        self.mcp_notification_sequence_by_connection[
            connection_id
        ] = sequence
        return sequence

    def connection_closed(self, connection_id: int) -> None:
        """Retire a relay stream from lifecycle ordering."""
        with self.condition:
            self.mcp_retired_connection_ids.add(connection_id)
            self.mcp_notification_sequence_by_connection.pop(
                connection_id, None
            )
            for tombstone in self.mcp_lifecycle_tombstones.values():
                tombstone.connection_sequences.pop(connection_id, None)
            self.condition.notify_all()

    def connection_invalidation_succeeded(
        self, connection_id: int, method: str, thread_id: str
    ) -> None:
        """Advance lifecycle state after a successful invalidation RPC."""
        with self.condition:
            if method != "thread/unsubscribe":
                self.mcp_driver_pinned_threads.discard(thread_id)
                self.mcp_lifecycle_epoch_by_thread[thread_id] = (
                    self.mcp_lifecycle_epoch_by_thread.get(thread_id, 0)
                    + 1
                )
                self.mcp_lifecycle_tombstones[
                    thread_id
                ] = _McpLifecycleTombstone(
                    emitted_at_ms=None,
                    connection_sequences={
                        connection_id: (
                            self.mcp_notification_sequence_by_connection.get(
                                connection_id, 0
                            )
                        ),
                    },
                )
            if self.mcp_primary_witness_thread_id == thread_id:
                self.mcp_primary_witness_thread_id = None
                self.mcp_primary_witness_lifecycle_epoch = None
            # Unsubscribe removes only this frontend subscription. It does
            # not invalidate the independently subscribed driver pin.
            self.condition.notify_all()

    def record_root_handoff_complete(
        self,
        gate: RelayGate,
        thread_id: str,
        expected_lifecycle_epoch: int,
    ) -> None:
        """Bind a completed driver handoff to its held primary root gate."""
        with self.condition:
            self._raise_if_fatal()
            if not self.primary_live:
                # A clean frontend Close abandons the held result; finish
                # handles it without restoring authority.
                return
            if self.tui_gate != gate or gate.kind != "root":
                raise RelayProtocolError(
                    "driver handoff lost its primary root gate"
                )
            if (
                self.tui_gate_root_thread_id != thread_id
                or self.tui_gate_root_lifecycle_epoch
                != expected_lifecycle_epoch
            ):
                raise RelayProtocolError(
                    "driver handoff did not match the primary root response"
                )
            if (
                self.mcp_lifecycle_epoch_by_thread.get(thread_id, 0)
                != expected_lifecycle_epoch
            ):
                raise RelayProtocolError(
                    "{} was invalidated during origin handoff".format(
                        thread_id
                    )
                )
            self.tui_gate_root_handoff_complete = True
            self.condition.notify_all()

    def current_snapshot(self) -> Optional[RootSnapshot]:
        with self.condition:
            if (
                self.fatal_error is not None
                or not self.primary_live
                or self.thread_id is None
            ):
                return None
            return RootSnapshot(
                self.thread_id,
                self.generation,
                self.primary_connection_id,
                self.active_turn_id,
                self.admission_pending,
            )

    def snapshot_is_current(self, snapshot: RootSnapshot) -> bool:
        with self.condition:
            return (
                self.fatal_error is None
                and self.primary_live
                and self._root_witness_blocker() is None
                and self.thread_id == snapshot.thread_id
                and self.generation == snapshot.generation
                and self.primary_connection_id
                == snapshot.connection_id
            )

    def observed_user_message_turn(
        self, thread_id: str, message_id: str
    ) -> Optional[str]:
        with self.condition:
            turn_id = self.recent_user_messages.get(
                (thread_id, message_id)
            )
            return turn_id if isinstance(turn_id, str) else None

    def commit_if_current(
        self,
        snapshot: RootSnapshot,
        receiver_live: Callable[[], bool],
        commit: Callable[[], None],
    ) -> bool:
        """Linearize a durable acknowledgement with authority revocation."""
        with self.condition:
            if (
                self.fatal_error is not None
                or not self.primary_live
                or not self.driver_active
                or self.tui_gate is not None
                or self._root_witness_blocker() is not None
                or self.thread_id != snapshot.thread_id
                or self.generation != snapshot.generation
                or self.primary_connection_id != snapshot.connection_id
                or not receiver_live()
            ):
                return False
            commit()
            return True

    def reserve_primary_work(self, connection_id: int) -> None:
        """Block a Poke lease as soon as primary traffic enters the FIFO."""
        with self.condition:
            if self.primary_connection_id != connection_id:
                raise RelayProtocolError(
                    "only the primary TUI can reserve serialized work"
                )
            self._raise_if_fatal()
            self.tui_waiters += 1
            self.condition.notify_all()

    def release_primary_work(self, connection_id: int) -> None:
        with self.condition:
            if self.primary_connection_id != connection_id:
                return
            if self.tui_waiters <= 0:
                self.fail("primary TUI FIFO reservation underflow")
                return
            self.tui_waiters -= 1
            self.condition.notify_all()

    def validate_auxiliary_request(
        self,
        connection_id: int,
        method: str,
        params: Dict[str, Any],
    ) -> None:
        """Permit picker lifecycle traffic but protect the primary root."""
        with self.condition:
            if self.primary_connection_id == connection_id:
                return
            if method in HUMAN_ADMISSION_METHODS:
                raise RelayProtocolError(
                    "auxiliary TUI attempted {}".format(method)
                )
            if (
                method in ROOT_INVALIDATION_METHODS
                or method in PRIMARY_CONTROL_BYPASS_METHODS
            ):
                requested = _thread_id_param(params)
                if requested is None:
                    raise RelayProtocolError(
                        "{} request has no threadId".format(method)
                    )
                if requested == self.thread_id:
                    raise RelayProtocolError(
                        "auxiliary TUI attempted {} on the primary root"
                        .format(method)
                    )

    def begin_tui_request(
        self,
        connection_id: int,
        method: str,
        params: Dict[str, Any],
        waiter_reserved: bool = False,
    ) -> Optional[RelayGate]:
        """Wait for the driver transaction, then reserve TUI admission.

        A None result means the request is safe to proxy without holding the
        authority gate (for example a non-current unsubscribe).
        """
        if method == "thread/fork" and _side_fork(params):
            return None
        is_root = method in ROOT_SWITCH_METHODS
        is_invalidation = method in ROOT_INVALIDATION_METHODS
        is_admission = method in HUMAN_ADMISSION_METHODS
        if not (is_root or is_invalidation or is_admission):
            return None

        with self.condition:
            if self.primary_connection_id != connection_id:
                raise RelayProtocolError(
                    "auxiliary TUI attempted authority-changing {}".format(
                        method
                    )
                )
            self._raise_if_fatal()
            if not waiter_reserved:
                self.tui_waiters += 1
            try:
                while self.driver_active or self.tui_gate is not None:
                    self.condition.wait()
                    self._raise_if_fatal()
                kind = "admission"
                if is_root:
                    kind = "root"
                elif is_invalidation:
                    requested = _thread_id_param(params)
                    if requested is None:
                        raise RelayProtocolError(
                            "{} request has no threadId".format(method)
                        )
                    if requested != self.thread_id:
                        return None
                    kind = "invalidation"
                token = RelayGate(
                    token=self.next_token,
                    connection_id=connection_id,
                    method=method,
                    kind=kind,
                    previous_thread_id=self.thread_id,
                    previous_generation=self.generation,
                    target_thread_id=_thread_id_param(params),
                    previous_turn_event_serial=self.turn_event_serial,
                )
                self.next_token += 1
                self.tui_gate = token
                self.tui_gate_external_invalidation = False
                self.tui_gate_root_thread_id = None
                self.tui_gate_root_lifecycle_epoch = None
                self.tui_gate_root_handoff_complete = False
                self.tui_gate_root_primary_witness_only = False
                self.tui_gate_previous_active_turn_id = self.active_turn_id
                self.tui_gate_previous_admission_pending = (
                    self.admission_pending
                )
                self.tui_gate_turn_events = []
                if kind == "invalidation":
                    # Unsubscribe tears down the TUI listener even when its
                    # RPC fails. Archive/delete are also deliberately
                    # fail-closed once requested.
                    self.thread_id = None
                    self.active_turn_id = None
                    self.admission_pending = False
                    self.generation += 1
                return token
            finally:
                if not waiter_reserved:
                    self.tui_waiters -= 1
                    self.condition.notify_all()

    def _validated_root(
        self, method: str, result: Any
    ) -> Optional[str]:
        if not isinstance(result, dict):
            raise RelayProtocolError(
                "{} response has no result object".format(method)
            )
        thread = result.get("thread")
        if not isinstance(thread, dict):
            raise RelayProtocolError(
                "{} response has no thread".format(method)
            )
        thread_id = thread.get("id")
        if not isinstance(thread_id, str) or not thread_id:
            raise RelayProtocolError(
                "{} response has no thread.id".format(method)
            )
        if method == "thread/resume" and _non_root_thread(thread):
            return None
        if _non_root_thread(thread):
            raise RelayProtocolError(
                "{} unexpectedly returned a non-root thread".format(method)
            )
        if thread.get("sessionId") != thread_id:
            raise RelayProtocolError(
                "{} root sessionId does not equal thread.id".format(method)
            )
        thread_cwd = thread.get("cwd")
        if (
            not isinstance(thread_cwd, str)
            or not os.path.isabs(thread_cwd)
            or os.path.realpath(thread_cwd) != self.cwd
        ):
            raise RelayProtocolError(
                "{} returned a root outside the launcher cwd".format(method)
            )
        response_cwd = result.get("cwd")
        if (
            response_cwd is not None
            and (
                not isinstance(response_cwd, str)
                or not os.path.isabs(response_cwd)
                or os.path.realpath(response_cwd) != self.cwd
            )
        ):
            raise RelayProtocolError(
                "{} response cwd does not match the launcher cwd".format(
                    method
                )
            )
        return thread_id

    def finish_tui_request(
        self,
        gate: RelayGate,
        response: Dict[str, Any],
        before_release: Optional[
            Callable[[Optional[str], Optional[str]], None]
        ] = None,
    ) -> None:
        """Commit/restore authority before the response reaches the TUI."""
        with self.condition:
            self._raise_if_fatal()
            if self.tui_gate != gate:
                self.fail("TUI response did not match the authority gate")
                self._raise_if_fatal()
            try:
                has_result = "result" in response
                has_error = "error" in response
                if has_result == has_error:
                    raise RelayProtocolError(
                        "{} response must contain exactly one of result/error"
                        .format(gate.method)
                    )
                if has_error and not isinstance(
                    response.get("error"), dict
                ):
                    raise RelayProtocolError(
                        "{} response error is not an object".format(
                            gate.method
                        )
                    )
                if has_result and not isinstance(
                    response.get("result"), dict
                ):
                    raise RelayProtocolError(
                        "{} response result is not an object".format(
                            gate.method
                        )
                    )
                if gate.kind == "root":
                    if not self.primary_live:
                        # A normal frontend Close can arrive while the root
                        # response is held behind its driver/origin handoff.
                        # The Close already revoked authority; abandon this
                        # late result without turning `/quit` into a fatal
                        # protocol failure or restoring the old root.
                        self.thread_id = None
                        self.active_turn_id = None
                        self.admission_pending = False
                    elif has_error:
                        if not self.tui_gate_external_invalidation:
                            self.thread_id = gate.previous_thread_id
                            self.generation = gate.previous_generation
                    else:
                        new_root = self._validated_root(
                            gate.method, response.get("result")
                        )
                        if new_root is None:
                            # A live subagent attached for the client-local
                            # /agent picker does not replace the input-owning
                            # primary root.
                            if not self.tui_gate_external_invalidation:
                                self.thread_id = gate.previous_thread_id
                                self.generation = gate.previous_generation
                        else:
                            fresh_primary_witness = (
                                self.enforce_root_handoff
                                and self.tui_gate_root_primary_witness_only
                            )
                            root_handoff_proven = (
                                fresh_primary_witness
                                or self.tui_gate_root_handoff_complete
                            )
                            if (
                                self.enforce_root_handoff
                                and (
                                    self.tui_gate_root_thread_id != new_root
                                    or self.tui_gate_root_lifecycle_epoch
                                    is None
                                    or not root_handoff_proven
                                )
                            ):
                                raise RelayProtocolError(
                                    "driver handoff proof for {} was missing "
                                    "before primary commit".format(new_root)
                                )
                            if (
                                self.enforce_root_handoff
                                and self.mcp_lifecycle_epoch_by_thread.get(
                                    new_root, 0
                                )
                                != self.tui_gate_root_lifecycle_epoch
                            ):
                                raise RelayProtocolError(
                                    "{} was invalidated before primary "
                                    "commit".format(new_root)
                                )
                            if (
                                self.enforce_root_handoff
                                and not fresh_primary_witness
                                and new_root
                                not in self.mcp_driver_pinned_threads
                            ):
                                raise RelayProtocolError(
                                    "driver pin for {} was invalidated "
                                    "before primary commit".format(
                                        new_root
                                    )
                                )
                            self.thread_id = new_root
                            self.root_lifecycle_epoch = (
                                self.tui_gate_root_lifecycle_epoch
                            )
                            self.mcp_primary_witness_thread_id = (
                                new_root
                                if fresh_primary_witness
                                else None
                            )
                            self.mcp_primary_witness_lifecycle_epoch = (
                                self.tui_gate_root_lifecycle_epoch
                                if fresh_primary_witness
                                else None
                            )
                            self.admission_pending = False
                            tombstone = (
                                self.mcp_lifecycle_tombstones.get(
                                    new_root
                                )
                            )
                            if tombstone is not None:
                                # The successful response establishes a new
                                # subscription point on this ordered socket.
                                # Legacy notifications without emittedAtMs
                                # received after it are therefore fresh.
                                tombstone.connection_sequences[
                                    gate.connection_id
                                ] = (
                                    self.mcp_notification_sequence_by_connection.get(
                                        gate.connection_id, 0
                                    )
                                )
                            result = response.get("result")
                            assert isinstance(result, dict)
                            result_thread = result.get("thread")
                            assert isinstance(result_thread, dict)
                            active_turn_id = in_progress_turn_id(
                                result_thread
                            )
                            for (
                                event_method,
                                event_thread_id,
                                event_turn_id,
                            ) in self.tui_gate_turn_events:
                                if event_thread_id != new_root:
                                    continue
                                if event_method == "turn/started":
                                    if active_turn_id in (
                                        None,
                                        event_turn_id,
                                    ):
                                        active_turn_id = event_turn_id
                                    else:
                                        # The response and a racing live
                                        # event name different active turns.
                                        # Their cross-connection order is
                                        # unknowable, so expose no steer
                                        # target until later state resolves
                                        # the conflict.
                                        active_turn_id = None
                                elif active_turn_id == event_turn_id:
                                    active_turn_id = None
                            self.active_turn_id = active_turn_id
                            self.generation = (
                                max(
                                    self.generation,
                                    gate.previous_generation,
                                )
                                + 1
                            )
                elif (
                    gate.kind == "invalidation"
                    and has_error
                    and gate.method != "thread/unsubscribe"
                    and not self.tui_gate_external_invalidation
                ):
                    # Archive/delete leave the primary intact when the server
                    # definitively rejects them. Codex 0.145's TUI is
                    # different for unsubscribe: it unconditionally aborts
                    # its local listener after awaiting the RPC, even on Err,
                    # so restoring that root would be unsafe.
                    self.thread_id = gate.previous_thread_id
                    self.active_turn_id = (
                        self.tui_gate_previous_active_turn_id
                    )
                    self.admission_pending = (
                        self.tui_gate_previous_admission_pending
                    )
                    self.generation = gate.previous_generation
                elif (
                    gate.kind == "admission"
                    and has_result
                ):
                    result = response.get("result")
                    assert isinstance(result, dict)
                    result_thread_id = gate.target_thread_id
                    if gate.method == "review/start":
                        result_thread_id = result.get("reviewThreadId")
                        if (
                            not isinstance(result_thread_id, str)
                            or not result_thread_id
                        ):
                            raise RelayProtocolError(
                                "review/start response has no valid "
                                "reviewThreadId"
                            )
                    if result_thread_id == self.thread_id:
                        if gate.method == "thread/shellCommand":
                            # While active, this is an auxiliary command with
                            # no new lifecycle. While idle, it creates a
                            # regular turn, so a queued turn/start can safely
                            # join it just like ordinary typed input.
                            continue_admission = False
                        else:
                            continue_admission = True
                        turn_id: Optional[str] = None
                        if (
                            continue_admission
                            and gate.method
                            in ("turn/start", "review/start")
                        ):
                            turn = result.get("turn")
                            if not isinstance(turn, dict):
                                raise RelayProtocolError(
                                    "{} response has no turn object".format(
                                        gate.method
                                    )
                                )
                            turn_id = turn.get("id")
                            if (
                                not isinstance(turn_id, str)
                                or not turn_id
                            ):
                                raise RelayProtocolError(
                                    "{} response has no valid turn.id".format(
                                        gate.method
                                    )
                                )
                        target_events = [
                            (event_method, event_turn_id)
                            for (
                                event_method,
                                event_thread_id,
                                event_turn_id,
                            ) in self.tui_gate_turn_events
                            if event_thread_id == result_thread_id
                        ]
                        if not continue_admission:
                            started = False
                            completed = False
                        elif turn_id is None:
                            started = any(
                                event_method == "turn/started"
                                for event_method, _event_turn_id
                                in target_events
                            )
                            self.admission_pending = not started
                        else:
                            started = (
                                ("turn/started", turn_id)
                                in target_events
                            )
                            completed = (
                                ("turn/completed", turn_id)
                                in target_events
                            )
                            self.admission_pending = not (
                                started or completed
                            )
                        if (
                            turn_id is not None
                            and not started
                            and not completed
                        ):
                            # Admission RPCs return after enqueueing a core
                            # submission, before turn/started is guaranteed.
                            # Preserve that gap so the delivery worker cannot
                            # enqueue its own turn/start behind a review or
                            # compact submission while thread/read says idle.
                            self.active_turn_id = turn_id
                if gate.kind == "invalidation" and self.thread_id is None:
                    self.root_lifecycle_epoch = None
                    if (
                        self.mcp_primary_witness_thread_id
                        == gate.previous_thread_id
                    ):
                        self.mcp_primary_witness_thread_id = None
                        self.mcp_primary_witness_lifecycle_epoch = None
                # Successful invalidation and ambiguous transport remain
                # NoRoot. Admission changes no root state.
                if before_release is not None:
                    try:
                        before_release(self.thread_id, self.active_turn_id)
                    except Exception:
                        # Optional telemetry must not revoke authority, but it
                        # must run while the gate still blocks driver events.
                        pass
            except RelayProtocolError as exc:
                self.fail(str(exc))
                raise
            finally:
                self.tui_gate = None
                self.tui_gate_external_invalidation = False
                self.tui_gate_root_thread_id = None
                self.tui_gate_root_lifecycle_epoch = None
                self.tui_gate_root_handoff_complete = False
                self.tui_gate_root_primary_witness_only = False
                self.tui_gate_previous_active_turn_id = None
                self.tui_gate_previous_admission_pending = False
                self.tui_gate_turn_events = []
                self.condition.notify_all()

    def abort_tui_request(self, gate: RelayGate, reason: str) -> None:
        with self.condition:
            if self.tui_gate == gate:
                self.tui_gate = None
                self.tui_gate_root_thread_id = None
                self.tui_gate_root_lifecycle_epoch = None
                self.tui_gate_root_handoff_complete = False
                self.tui_gate_root_primary_witness_only = False
                self.tui_gate_previous_active_turn_id = None
                self.tui_gate_previous_admission_pending = False
                self.tui_gate_turn_events = []
            self.fail(reason)

    def observe_notification(
        self, connection_id: int, message: Dict[str, Any]
    ) -> None:
        with self.condition:
            if connection_id in self.mcp_retired_connection_ids:
                return
        method = message.get("method")
        is_root_invalidation = method in ROOT_INVALIDATION_NOTIFICATIONS
        is_turn_event = method in ("turn/started", "turn/completed")
        is_item_completed = method == "item/completed"
        if not (
            is_root_invalidation
            or is_turn_event
            or is_item_completed
        ):
            return
        params = message.get("params")
        if not isinstance(params, dict):
            with self.condition:
                is_primary = (
                    self.primary_connection_id == connection_id
                )
                is_driver_witness = (
                    self.mcp_driver_connection_id == connection_id
                )
            if is_primary or is_driver_witness:
                self.fail(
                    "{} notification has invalid params".format(method)
                )
            return
        with self.condition:
            is_primary = self.primary_connection_id == connection_id
            is_driver_witness = (
                self.mcp_driver_connection_id == connection_id
            )
        fail_invalid_witness_event = is_primary or is_driver_witness
        emitted_at_ms = message.get("emittedAtMs")
        if (
            is_root_invalidation
            and emitted_at_ms is not None
            and (
                isinstance(emitted_at_ms, bool)
                or not isinstance(emitted_at_ms, int)
                or not 0 <= emitted_at_ms <= MAX_JSON_RPC_INTEGER_ID
            )
        ):
            if fail_invalid_witness_event:
                self.fail(
                    "{} notification has an invalid emittedAtMs".format(
                        method
                    )
                )
            return
        if is_root_invalidation:
            thread_id = _thread_id_param(params)
            if thread_id is None:
                if fail_invalid_witness_event:
                    self.fail(
                        "{} notification has no threadId".format(method)
                    )
                return
            with self.condition:
                if connection_id in self.mcp_retired_connection_ids:
                    return
                # Ignore a lifecycle copy older than the newest tombstone.
                # Per-stream cuts distinguish a newer event when wall time
                # regresses or another subscriber observed the fan-out first.
                sequence = self._next_mcp_notification_sequence(
                    connection_id
                )
                tombstone = self.mcp_lifecycle_tombstones.get(thread_id)
                stream_cutoff = (
                    tombstone.connection_sequences.get(connection_id)
                    if tombstone is not None
                    else None
                )
                follows_same_stream_epoch = (
                    stream_cutoff is not None
                    and sequence > stream_cutoff
                )
                new_lifecycle_epoch = True
                if (
                    tombstone is not None
                    and tombstone.emitted_at_ms is not None
                    and emitted_at_ms is not None
                    and emitted_at_ms < tombstone.emitted_at_ms
                    and not follows_same_stream_epoch
                ):
                    return
                self.mcp_lifecycle_epoch_by_thread[thread_id] = (
                    self.mcp_lifecycle_epoch_by_thread.get(thread_id, 0)
                    + 1
                )
                if (
                    tombstone is not None
                    and tombstone.emitted_at_ms == emitted_at_ms
                    and not follows_same_stream_epoch
                ):
                    new_lifecycle_epoch = False
                    tombstone.connection_sequences[
                        connection_id
                    ] = sequence
                else:
                    retained_emitted_at_ms = emitted_at_ms
                    if (
                        follows_same_stream_epoch
                        and tombstone is not None
                        and tombstone.emitted_at_ms is not None
                        and (
                            retained_emitted_at_ms is None
                            or retained_emitted_at_ms
                            < tombstone.emitted_at_ms
                        )
                    ):
                        # Same-socket order proves this lifecycle is newer
                        # even if the wall clock moved backwards. Retain the
                        # greater timestamp as a conservative cross-socket
                        # stale-event barrier.
                        retained_emitted_at_ms = (
                            tombstone.emitted_at_ms
                        )
                    tombstone = _McpLifecycleTombstone(
                        emitted_at_ms=retained_emitted_at_ms,
                        connection_sequences={
                            connection_id: sequence,
                        },
                    )
                    self.mcp_lifecycle_tombstones[
                        thread_id
                    ] = tombstone
                if new_lifecycle_epoch or is_driver_witness:
                    # A lifecycle event ordered after the subscription ACK
                    # on the driver stream definitively retires that pin,
                    # even when another socket already installed the same
                    # emittedAtMs tombstone.
                    self.mcp_driver_pinned_threads.discard(thread_id)
                # The driver is the continuously authoritative lifecycle
                # witness. Its fan-out copy can arrive after an auxiliary
                # already installed the same tombstone, so even a deduplicated
                # accepted driver lifecycle must revoke a matching root.
                lifecycle_revokes_authority = (
                    is_primary or is_driver_witness
                )
                if not lifecycle_revokes_authority:
                    # Keep a fresh-primary witness associated with its old
                    # epoch. A later auxiliary driver pin must not make that
                    # stale primary look like a valid resumed root.
                    self.condition.notify_all()
                    return
                if self.mcp_primary_witness_thread_id == thread_id:
                    self.mcp_primary_witness_thread_id = None
                    self.mcp_primary_witness_lifecycle_epoch = None
                if (
                    self.tui_gate is not None
                    and thread_id == self.tui_gate.previous_thread_id
                ):
                    self.tui_gate_external_invalidation = True
                    self.tui_gate_previous_active_turn_id = None
                    if self.thread_id is not None:
                        self.thread_id = None
                        self.root_lifecycle_epoch = None
                        self.active_turn_id = None
                        self.admission_pending = False
                        self.generation += 1
                    self.condition.notify_all()
                elif thread_id == self.thread_id:
                    self.thread_id = None
                    self.root_lifecycle_epoch = None
                    self.active_turn_id = None
                    self.admission_pending = False
                    self.generation += 1
                    self.condition.notify_all()
            return
        if not is_primary:
            return
        thread_id = _thread_id_param(params)
        if thread_id is None:
            self.fail("{} notification has no threadId".format(method))
            return
        if is_item_completed:
            turn_id = params.get("turnId")
            item = params.get("item")
            if not isinstance(turn_id, str) or not turn_id:
                self.fail(
                    "item/completed notification has no valid turnId"
                )
                return
            if not isinstance(item, dict):
                self.fail("item/completed notification has no item object")
                return
            if item.get("type") != "userMessage":
                return
            client_id = item.get("clientId")
            if client_id is None:
                return
            if not isinstance(client_id, str) or not client_id:
                self.fail(
                    "item/completed userMessage has an invalid clientId"
                )
                return
            with self.condition:
                key = (thread_id, client_id)
                self.recent_user_messages[key] = turn_id
                self.recent_user_messages.move_to_end(key)
                while (
                    len(self.recent_user_messages)
                    > RECENT_USER_MESSAGE_IDS
                ):
                    self.recent_user_messages.popitem(last=False)
                self.condition.notify_all()
            return
        if is_turn_event:
            turn = params.get("turn")
            if not isinstance(turn, dict):
                self.fail(
                    "{} notification has no turn object".format(method)
                )
                return
            turn_id = turn.get("id")
            if not isinstance(turn_id, str) or not turn_id:
                self.fail(
                    "{} notification has no valid turn.id".format(method)
                )
                return
            with self.condition:
                if self.tui_gate is not None:
                    self.tui_gate_turn_events.append(
                        (method, thread_id, turn_id)
                    )
                if thread_id == self.thread_id:
                    if method == "turn/started":
                        self.admission_pending = False
                        self.active_turn_id = turn_id
                    elif self.active_turn_id == turn_id:
                        self.active_turn_id = None
                    self.turn_event_serial += 1
                    self.condition.notify_all()
                elif (
                    self.tui_gate is not None
                    and self.tui_gate.kind == "invalidation"
                    and thread_id == self.tui_gate.previous_thread_id
                ):
                    if method == "turn/started":
                        self.tui_gate_previous_active_turn_id = turn_id
                    elif (
                        self.tui_gate_previous_active_turn_id == turn_id
                    ):
                        self.tui_gate_previous_active_turn_id = None
                    self.condition.notify_all()
            return

    @contextmanager
    def driver_subscription_lease(
        self, held_gate: Optional[RelayGate] = None
    ) -> Iterator[None]:
        """Serialize an internal driver subscribe with root/Poke traffic."""
        owns_driver_slot = False
        with self.condition:
            self._raise_if_fatal()
            if held_gate is not None:
                if self.tui_gate != held_gate:
                    raise RelayProtocolError(
                        "driver subscription lost its TUI authority gate"
                    )
            else:
                while (
                    self.driver_active
                    or self.tui_gate is not None
                    or self.tui_waiters > 0
                ):
                    self.condition.wait()
                    self._raise_if_fatal()
                self.driver_active = True
                owns_driver_slot = True
        try:
            yield
        finally:
            if owns_driver_slot:
                with self.condition:
                    self.driver_active = False
                    self.condition.notify_all()

    @contextmanager
    def delivery_lease(
        self, receiver_live: Callable[[], bool]
    ) -> Iterator[DeliveryLeaseResult]:
        """Yield a stable root or its current blocker without waiting."""
        snapshot: Optional[RootSnapshot] = None
        with self.condition:
            blocked_by = self._delivery_blocker(receiver_live)
            if blocked_by is None:
                assert self.thread_id is not None
                self.driver_active = True
                snapshot = RootSnapshot(
                    self.thread_id,
                    self.generation,
                    self.primary_connection_id,
                    self.active_turn_id,
                    self.admission_pending,
                )
        try:
            yield DeliveryLeaseResult(snapshot, blocked_by)
        finally:
            if snapshot is not None:
                with self.condition:
                    self.driver_active = False
                    self.condition.notify_all()

    def _delivery_blocker(
        self, receiver_live: Callable[[], bool]
    ) -> Optional[str]:
        """Return the first failed delivery condition while locked."""
        if self.fatal_error is not None:
            return "relay is in a fatal state"
        if not self.primary_live:
            return "primary TUI is not live"
        if self.thread_id is None:
            return "primary root is not established"
        root_blocker = self._root_witness_blocker()
        if root_blocker is not None:
            return root_blocker
        if self.driver_active:
            return "companion driver transaction is active"
        if self.tui_gate is not None:
            return "primary TUI {} is in flight".format(
                self.tui_gate.method
            )
        if self.tui_waiters > 0:
            return "primary TUI work is queued"
        if not receiver_live():
            return "delivery receiver is not live"
        return None


class BridgeEngine:
    """One deterministic bridge iteration, independently unit-testable."""

    def __init__(
        self,
        store: InboxStore,
        app_server: Any,
        config: BridgeConfig,
        consumer: str = BRIDGE_CONSUMER,
        may_deliver: Callable[[], bool] = lambda: True,
        commit_if_deliverable: Optional[
            Callable[[Callable[[], None]], bool]
        ] = None,
        deferred_steer_turn_id: Optional[str] = None,
        observed_turn_id: Callable[
            [str, str], Optional[str]
        ] = lambda _thread_id, _message_id: None,
    ):
        self.store = store
        self.app_server = app_server
        self.config = config
        self.consumer = consumer
        self.may_deliver = may_deliver
        self.commit_if_deliverable = commit_if_deliverable
        self.deferred_steer_turn_id = deferred_steer_turn_id
        self.observed_turn_id = observed_turn_id

    def _commit_durable(self, commit: Callable[[], None]) -> bool:
        if self.commit_if_deliverable is not None:
            return self.commit_if_deliverable(commit)
        if not self.may_deliver():
            return False
        commit()
        return True

    def _read_thread(
        self,
        thread_id: str,
        include_turns: bool,
        expected_turn_id: Optional[str] = None,
    ) -> Tuple[Optional[Dict[str, Any]], Optional[StepResult]]:
        try:
            thread = self.app_server.thread_read(thread_id, include_turns)
        except AppServerTransportError as exc:
            return None, StepResult(
                "transport_error", reconnect=True, error=str(exc)
            )
        except AppServerRequestError as exc:
            if include_turns:
                return self._read_paginated_thread(
                    thread_id, expected_turn_id, exc
                )
            return None, StepResult("unhealthy", error=str(exc))
        if not isinstance(thread, dict) or thread.get("id") != thread_id:
            return None, StepResult(
                "unhealthy", error="thread/read did not return the bound thread"
            )
        if (
            thread.get("sessionId") != thread_id
            or thread.get("parentThreadId") is not None
        ):
            return None, StepResult(
                "unhealthy",
                error="thread/read did not return a root thread",
            )
        thread_cwd = thread.get("cwd")
        if (
            not isinstance(thread_cwd, str)
            or not os.path.isabs(thread_cwd)
            or os.path.realpath(thread_cwd)
            != os.path.realpath(self.config.cwd)
        ):
            return None, StepResult(
                "unhealthy",
                error="thread/read root cwd does not match the launcher cwd",
            )
        status = thread.get("status")
        if (
            not isinstance(status, dict)
            or not isinstance(status.get("type"), str)
        ):
            return None, StepResult(
                "unhealthy",
                error="thread/read root has an invalid status object",
            )
        if include_turns and not isinstance(thread.get("turns"), list):
            return None, StepResult(
                "unhealthy",
                error="thread/read reconciliation response has no turns list",
            )
        return thread, None

    def _read_paginated_thread(
        self,
        thread_id: str,
        _expected_turn_id: Optional[str],
        read_error: AppServerRequestError,
    ) -> Tuple[Optional[Dict[str, Any]], Optional[StepResult]]:
        """Recover full history when ``thread/read`` cannot populate turns.

        Paginated Codex threads reject ``thread/read(includeTurns=true)``.
        The auxiliary client opts into the experimental API, so page newest
        first with full items through EOF. Reconciliation deliberately scans
        the complete root so a duplicated client id from an earlier retry is
        detected rather than silently accepting one of its copies.
        """
        thread, failure = self._read_thread(thread_id, include_turns=False)
        if failure is not None:
            return None, failure
        assert thread is not None

        turns = []
        cursor: Optional[str] = None
        seen_cursors = set()
        while True:
            try:
                page = self.app_server.thread_turns_list(
                    thread_id,
                    cursor=cursor,
                    limit=TURN_HISTORY_PAGE_SIZE,
                    sort_direction="desc",
                    items_view="full",
                )
            except AppServerTransportError as exc:
                return None, StepResult(
                    "transport_error", reconnect=True, error=str(exc)
                )
            except AppServerRequestError as exc:
                return None, StepResult(
                    "unhealthy",
                    error=(
                        "thread history is unavailable via thread/read "
                        "({}) and thread/turns/list ({})"
                    ).format(read_error, exc),
                )
            if not isinstance(page, dict):
                return None, StepResult(
                    "unhealthy",
                    error="thread/turns/list response is not an object",
                )
            data = page.get("data")
            if not isinstance(data, list):
                return None, StepResult(
                    "unhealthy",
                    error="thread/turns/list response has no data list",
                )
            for index, turn in enumerate(data):
                if not isinstance(turn, dict):
                    return None, StepResult(
                        "unhealthy",
                        error=(
                            "thread/turns/list turn {} is not an object"
                        ).format(index),
                    )
                if turn.get("itemsView") != "full":
                    return None, StepResult(
                        "unhealthy",
                        error=(
                            "thread/turns/list turn {} is not a full item "
                            "view"
                        ).format(index),
                    )
                if not isinstance(turn.get("items"), list):
                    return None, StepResult(
                        "unhealthy",
                        error=(
                            "thread/turns/list turn {} has no items list"
                        ).format(index),
                    )
                turns.append(turn)
            if "nextCursor" not in page:
                return None, StepResult(
                    "unhealthy",
                    error=(
                        "thread/turns/list response has no nextCursor"
                    ),
                )
            next_cursor = page["nextCursor"]
            if next_cursor is None:
                break
            if not isinstance(next_cursor, str) or not next_cursor:
                return None, StepResult(
                    "unhealthy",
                    error=(
                        "thread/turns/list returned an invalid nextCursor"
                    ),
                )
            if next_cursor in seen_cursors:
                return None, StepResult(
                    "unhealthy",
                    error="thread/turns/list repeated a pagination cursor",
                )
            seen_cursors.add(next_cursor)
            cursor = next_cursor

        populated = dict(thread)
        populated["turns"] = turns
        return populated, None

    def _binding_is_current(self, expected: Binding) -> bool:
        return self.store.get_binding(self.config) == expected

    @staticmethod
    def _turn_id(result: Any) -> Optional[str]:
        if not isinstance(result, dict):
            return None
        turn = result.get("turn")
        if not isinstance(turn, dict):
            return None
        candidate = turn.get("id")
        return candidate if isinstance(candidate, str) and candidate else None

    @staticmethod
    def _steer_turn_id(result: Any) -> Optional[str]:
        if not isinstance(result, dict):
            return None
        candidate = result.get("turnId")
        return candidate if isinstance(candidate, str) and candidate else None

    @staticmethod
    def _active_turn_not_steerable(
        error: AppServerRequestError,
    ) -> bool:
        data = error.data
        if not isinstance(data, dict):
            return False
        info = data.get("codexErrorInfo")
        if not isinstance(info, dict):
            return False
        detail = info.get("activeTurnNotSteerable")
        if not isinstance(detail, dict):
            return False
        return detail.get("turnKind") in ("review", "compact")

    @staticmethod
    def _mismatched_active_turn_id(
        error: AppServerRequestError, expected_turn_id: str
    ) -> Optional[str]:
        """Parse Codex 0.145's narrowly specified mismatch error."""
        if error.code != -32600 or error.data is not None:
            return None
        prefix = "expected active turn id `{}` but found `".format(
            expected_turn_id
        )
        message = str(error)
        if not message.startswith(prefix) or not message.endswith("`"):
            return None
        actual = message[len(prefix):-1]
        if (
            not actual
            or len(actual) > 256
            or "`" in actual
            or actual == expected_turn_id
        ):
            return None
        return actual

    def _delivery_commit_candidate(
        self,
        delivery: Delivery,
        thread: Optional[Dict[str, Any]] = None,
    ) -> Tuple[Optional[str], Optional[StepResult]]:
        """Find and validate exact live or persisted commit evidence."""
        candidate = self.observed_turn_id(
            delivery.thread_id, delivery.message_id
        )
        if candidate is not None and (
            not isinstance(candidate, str) or not candidate
        ):
            return None, StepResult(
                "unhealthy",
                sequence=delivery.sequence,
                error="observed user message has no valid turn id",
            )
        if candidate is None and thread is not None:
            try:
                candidate = correlated_turn_id(
                    thread, delivery.message_id
                )
            except RelayProtocolError as exc:
                return None, StepResult(
                    "unhealthy",
                    sequence=delivery.sequence,
                    error=str(exc),
                )
        if (
            candidate is not None
            and delivery.admission_method == "turn/steer"
            and delivery.turn_id is not None
            and candidate != delivery.turn_id
        ):
            return None, StepResult(
                "unhealthy",
                sequence=delivery.sequence,
                error=(
                    "committed user message turn does not match the "
                    "persisted turn/steer response"
                ),
            )
        return candidate, None

    def _delivery_absence_is_final(
        self,
        delivery: Delivery,
        thread: Dict[str, Any],
    ) -> Tuple[bool, Optional[StepResult]]:
        """Prove a queued admission can no longer commit later.

        An idle status alone is insufficient: turn/start can sit in Codex's
        submission channel before the session loop marks the thread active.
        A terminal persisted target turn is causal proof within one process.
        A different launcher instance proves the old private app-server (and
        its in-memory submission queue) no longer exists.
        """
        if delivery.attempt_instance != self.config.instance:
            return True, None
        if delivery.turn_id is None:
            return False, None
        try:
            return terminal_turn_in_history(thread, delivery.turn_id), None
        except RelayProtocolError as exc:
            return False, StepResult(
                "unhealthy",
                sequence=delivery.sequence,
                error=str(exc),
            )

    def _acknowledge_reconciled_delivery(
        self,
        delivery: Delivery,
        turn_id: str,
        binding: Optional[Binding],
    ) -> StepResult:
        if binding is not None and not self._binding_is_current(binding):
            return StepResult(
                "binding_changed", sequence=delivery.sequence
            )
        if not self._commit_durable(
            lambda: self.store.acknowledge(
                self.config,
                delivery.sequence,
                turn_id,
                self.consumer,
            )
        ):
            return StepResult("orphaned", sequence=delivery.sequence)
        return StepResult(
            "reconciled",
            sequence=delivery.sequence,
            turn_id=turn_id,
        )

    def _notice_commit_candidate(
        self,
        notice: UpdateNotice,
        thread: Optional[Dict[str, Any]] = None,
    ) -> Tuple[Optional[str], Optional[StepResult]]:
        candidate = self.observed_turn_id(
            notice.thread_id, notice.notice_id
        )
        if candidate is not None and (
            not isinstance(candidate, str) or not candidate
        ):
            return None, StepResult(
                "unhealthy",
                error="observed update notice has no valid turn id",
            )
        if candidate is None and thread is not None:
            try:
                candidate = correlated_turn_id(thread, notice.notice_id)
            except RelayProtocolError as exc:
                return None, StepResult("unhealthy", error=str(exc))
        return candidate, None

    def _notice_absence_is_final(
        self,
        notice: UpdateNotice,
        thread: Dict[str, Any],
    ) -> Tuple[bool, Optional[StepResult]]:
        """Prove that one queued update notice can no longer commit."""
        if notice.attempt_instance != self.config.instance:
            return True, None
        if notice.turn_id is None:
            return False, None
        try:
            return terminal_turn_in_history(thread, notice.turn_id), None
        except RelayProtocolError as exc:
            return False, StepResult("unhealthy", error=str(exc))

    def _acknowledge_reconciled_notice(
        self,
        notice: UpdateNotice,
        turn_id: str,
        binding: Optional[Binding],
    ) -> StepResult:
        if binding is not None and not self._binding_is_current(binding):
            return StepResult("binding_changed")
        if not self._commit_durable(
            lambda: self.store.acknowledge_update_notice(
                self.config, notice.notice_id, turn_id
            )
        ):
            return StepResult("orphaned")
        return StepResult(
            "reconciled_update_notice", turn_id=turn_id
        )

    def _deliver_update_notice(
        self,
        notice: UpdateNotice,
        thread_id: str,
        expected_binding: Optional[Binding],
    ) -> StepResult:
        if not self.may_deliver():
            return StepResult("orphaned")
        if (
            expected_binding is not None
            and not self._binding_is_current(expected_binding)
        ):
            return StepResult("binding_changed")
        sending = self.store.begin_update_notice(
            self.config, notice.notice_id, thread_id
        )
        if sending.state != "sending":
            return StepResult(
                "unhealthy",
                error="update notice could not enter sending state",
            )
        if not self.may_deliver():
            self.store.mark_update_notice_pending(
                self.config,
                sending.notice_id,
                "visible Codex receiver is unavailable",
            )
            return StepResult("orphaned")
        if (
            expected_binding is not None
            and not self._binding_is_current(expected_binding)
        ):
            self.store.mark_update_notice_pending(
                self.config,
                sending.notice_id,
                "root binding changed before turn/start",
            )
            return StepResult("binding_changed")
        self.store.record_update_notice_attempt(
            self.config, sending.notice_id, None
        )
        try:
            result = self.app_server.turn_start(
                thread_id, sending.message, sending.notice_id
            )
        except AppServerTransportError as exc:
            return StepResult(
                "ambiguous_update_notice",
                reconnect=True,
                error=str(exc),
            )
        except AppServerRequestError as exc:
            self.store.mark_update_notice_pending(
                self.config, sending.notice_id, str(exc)
            )
            return StepResult("rejected_update_notice", error=str(exc))
        turn_id = self._turn_id(result)
        if turn_id is None:
            return StepResult(
                "ambiguous_update_notice",
                error="turn/start response did not contain turn.id",
            )
        self.store.record_update_notice_attempt(
            self.config, sending.notice_id, turn_id
        )
        observed_turn_id = self.observed_turn_id(
            thread_id, sending.notice_id
        )
        if observed_turn_id is None:
            return StepResult(
                "update_notice_queued", turn_id=turn_id
            )
        if (
            not isinstance(observed_turn_id, str)
            or not observed_turn_id
        ):
            return StepResult(
                "ambiguous_update_notice",
                error="observed update notice has no valid turn id",
            )
        if not self._commit_durable(
            lambda: self.store.acknowledge_update_notice(
                self.config, sending.notice_id, observed_turn_id
            )
        ):
            # The item committed, but authority or its visible receiver was
            # revoked before the durable acceptance linearization point.
            return StepResult(
                "orphaned_after_accept_update_notice",
                turn_id=observed_turn_id,
            )
        return StepResult(
            "accepted_update_notice", turn_id=observed_turn_id
        )

    def step(
        self, snapshot: Optional[RootSnapshot] = None
    ) -> StepResult:
        """Run one delivery transaction against a lease-stable root.

        ``snapshot`` is mandatory on the relay-owned run path.  The fallback
        binding lookup remains only for direct legacy unit callers.
        """
        binding: Optional[Binding]
        if snapshot is None:
            binding = self.store.get_binding(self.config)
            if binding is None:
                return StepResult("no_binding")
            target_thread_id = binding.thread_id
        else:
            binding = None
            target_thread_id = snapshot.thread_id
        # Receiver presence gates reconciliation as well as new delivery:
        # acknowledging an ambiguous prior send advances the durable cursor.
        if not self.may_deliver():
            return StepResult("orphaned")

        sending = self.store.get_sending(self.config, self.consumer)
        if sending is not None:
            accepted_turn_id, failure = self._delivery_commit_candidate(
                sending
            )
            if failure is not None:
                return failure
            if (
                accepted_turn_id is None
                and sending.turn_id is not None
                and snapshot is not None
                and sending.thread_id == snapshot.thread_id
                and snapshot.active_turn_id == sending.turn_id
            ):
                # A successful admission response only queued the input.
                # While its exact target remains active, rely on the primary's
                # item/completed event instead of rebuilding full history on
                # every 250 ms poll. History is the fallback once the target
                # changes or ends.
                return StepResult(
                    "busy",
                    sequence=sending.sequence,
                    turn_id=sending.turn_id,
                )
            previous_thread: Optional[Dict[str, Any]] = None
            if accepted_turn_id is None:
                previous_thread, failure = self._read_thread(
                    sending.thread_id,
                    include_turns=True,
                    expected_turn_id=sending.turn_id,
                )
                if failure is not None:
                    return failure
                assert previous_thread is not None
                # The primary notification can race the history request, so
                # consult it again before treating that history as absent.
                accepted_turn_id, failure = (
                    self._delivery_commit_candidate(
                        sending, previous_thread
                    )
                )
                if failure is not None:
                    return failure
            if accepted_turn_id:
                return self._acknowledge_reconciled_delivery(
                    sending, accepted_turn_id, binding
                )
            assert previous_thread is not None
            previous_status = thread_status_type(previous_thread)
            if previous_status not in ("active", "idle", "notLoaded"):
                return StepResult(
                    "unhealthy",
                    sequence=sending.sequence,
                    error="ambiguous delivery thread is not safely retryable",
                )
            absence_is_final, failure = self._delivery_absence_is_final(
                sending, previous_thread
            )
            if failure is not None:
                return failure
            if not absence_is_final:
                return StepResult(
                    (
                        "busy"
                        if previous_status == "active"
                        else "awaiting_commit"
                    ),
                    sequence=sending.sequence,
                    turn_id=sending.turn_id,
                )

            # Recheck the live primary cache immediately before transitioning
            # to pending. The terminal target/new-process proof above means
            # the old admission cannot newly commit after this point.
            accepted_turn_id, failure = self._delivery_commit_candidate(
                sending
            )
            if failure is not None:
                return failure
            if accepted_turn_id:
                return self._acknowledge_reconciled_delivery(
                    sending, accepted_turn_id, binding
                )
            if (
                binding is not None
                and not self._binding_is_current(binding)
            ):
                return StepResult(
                    "binding_changed", sequence=sending.sequence
                )
            self.store.mark_pending(
                self.config,
                sending.sequence,
                "no correlated user message in persisted thread",
                self.consumer,
            )
            return StepResult(
                "retry_pending", sequence=sending.sequence
            )

        sending_notice = self.store.get_sending_update_notice(self.config)
        if sending_notice is not None:
            accepted_turn_id, failure = self._notice_commit_candidate(
                sending_notice
            )
            if failure is not None:
                return failure
            if (
                accepted_turn_id is None
                and sending_notice.turn_id is not None
                and snapshot is not None
                and sending_notice.thread_id == snapshot.thread_id
                and snapshot.active_turn_id == sending_notice.turn_id
            ):
                return StepResult(
                    "busy", turn_id=sending_notice.turn_id
                )
            previous_thread: Optional[Dict[str, Any]] = None
            if accepted_turn_id is None:
                previous_thread, failure = self._read_thread(
                    sending_notice.thread_id,
                    include_turns=True,
                    expected_turn_id=sending_notice.turn_id,
                )
                if failure is not None:
                    return failure
                assert previous_thread is not None
                accepted_turn_id, failure = (
                    self._notice_commit_candidate(
                        sending_notice, previous_thread
                    )
                )
                if failure is not None:
                    return failure
            if accepted_turn_id:
                return self._acknowledge_reconciled_notice(
                    sending_notice, accepted_turn_id, binding
                )
            assert previous_thread is not None
            previous_status = thread_status_type(previous_thread)
            if previous_status not in ("active", "idle", "notLoaded"):
                return StepResult(
                    "unhealthy",
                    error="ambiguous update notice is not safely retryable",
                )
            absence_is_final, failure = self._notice_absence_is_final(
                sending_notice, previous_thread
            )
            if failure is not None:
                return failure
            if not absence_is_final:
                return StepResult(
                    (
                        "busy"
                        if previous_status == "active"
                        else "awaiting_update_notice_commit"
                    ),
                    turn_id=sending_notice.turn_id,
                )

            accepted_turn_id, failure = self._notice_commit_candidate(
                sending_notice
            )
            if failure is not None:
                return failure
            if accepted_turn_id:
                return self._acknowledge_reconciled_notice(
                    sending_notice, accepted_turn_id, binding
                )
            if (
                binding is not None
                and not self._binding_is_current(binding)
            ):
                return StepResult("binding_changed")
            self.store.mark_update_notice_pending(
                self.config,
                sending_notice.notice_id,
                "no correlated user message in persisted thread",
            )
            return StepResult("retry_pending_update_notice")

        pending_notice: Optional[UpdateNotice] = None
        if snapshot is not None:
            # Do not poll Codex merely to rediscover that there is no
            # delivery work. Apart from creating unnecessary app-server
            # pressure, a slow metadata read used to be mistaken for loss of
            # the continuous root witness and could sacrifice an otherwise
            # healthy TUI. Legacy binding callers retain their preflight read
            # so they can reject stale or unloaded persisted roots first.
            if not self.may_deliver():
                return StepResult("orphaned")
            has_pending_poke = self.store.has_pending_poke(
                self.config, self.consumer
            )
            pending_notice = self.store.get_pending_update_notice(
                self.config
            )
            if not has_pending_poke and pending_notice is None:
                return StepResult("empty")

        thread, failure = self._read_thread(
            target_thread_id, include_turns=False
        )
        if failure is not None:
            return failure
        assert thread is not None
        status = thread_status_type(thread)
        if status not in ("active", "idle"):
            return StepResult(
                "unhealthy",
                error="bound thread status is neither active nor idle",
            )
        if (
            status == "idle"
            and snapshot is not None
            and (
                snapshot.active_turn_id is not None
                or snapshot.admission_pending
            )
        ):
            # A primary turn/review/compact admission response can precede
            # both thread/started and the thread status transition. Typed
            # input is already queued in that gap, so do not enqueue a
            # competing turn/start from an apparently idle read.
            return StepResult(
                "busy_provisional",
                turn_id=snapshot.active_turn_id,
            )
        if (
            binding is not None
            and not self._binding_is_current(binding)
        ):
            return StepResult("binding_changed")

        # A launcher-owned bridge must never outlive its receiver.  Check
        # immediately before both the inbox peek and the app-server send; an
        # orphan can therefore neither create a consumer cursor nor inject a
        # turn after its visible TUI has gone away.
        if not self.may_deliver():
            return StepResult("orphaned")
        poke = self.store.peek_next(self.config, self.consumer)
        if pending_notice is None:
            pending_notice = self.store.get_pending_update_notice(
                self.config
            )
        if poke is None:
            # Update notices are operational messages, not user Pokes. Keep
            # them out of an active turn and deliver them once it is idle.
            if status == "active":
                return StepResult("busy")
            if pending_notice is None:
                return StepResult("empty")
            return self._deliver_update_notice(
                pending_notice, target_thread_id, binding
            )
        expected_turn_id: Optional[str] = None
        if status == "active":
            if snapshot is not None:
                expected_turn_id = snapshot.active_turn_id
            if expected_turn_id is None:
                # A response/event ordering conflict can deliberately leave
                # relay state untracked. Resolve the actual in-progress turn
                # from full history only after proving a Poke is waiting;
                # expectedTurnId still makes a later race fail definitively.
                active_thread, failure = self._read_thread(
                    target_thread_id, include_turns=True
                )
                if failure is not None:
                    return failure
                assert active_thread is not None
                status = thread_status_type(active_thread)
                if status == "active":
                    try:
                        expected_turn_id = in_progress_turn_id(active_thread)
                    except RelayProtocolError as exc:
                        return StepResult(
                            "unhealthy",
                            sequence=poke.sequence,
                            error=str(exc),
                        )
                    if expected_turn_id is None:
                        return StepResult(
                            "busy_untracked", sequence=poke.sequence
                        )
                elif status != "idle":
                    return StepResult(
                        "unhealthy",
                        sequence=poke.sequence,
                        error=(
                            "bound thread changed to neither active nor idle"
                        ),
                    )
            if (
                expected_turn_id is not None
                and expected_turn_id == self.deferred_steer_turn_id
            ):
                return StepResult(
                    "busy_nonsteerable",
                    sequence=poke.sequence,
                    turn_id=expected_turn_id,
                )
        if not self.may_deliver():
            return StepResult("orphaned", sequence=poke.sequence)
        if (
            binding is not None
            and not self._binding_is_current(binding)
        ):
            return StepResult(
                "binding_changed", sequence=poke.sequence
            )
        delivery = self.store.begin_delivery(
            self.config, poke, target_thread_id, self.consumer
        )
        if delivery.state == "accepted":
            return StepResult(
                "already_accepted",
                sequence=delivery.sequence,
                turn_id=delivery.turn_id,
            )
        if delivery.state != "sending":
            return StepResult(
                "unhealthy",
                sequence=delivery.sequence,
                error="delivery could not enter sending state",
            )

        if not self.may_deliver():
            self.store.mark_pending(
                self.config,
                delivery.sequence,
                "visible Codex receiver is unavailable",
                self.consumer,
            )
            return StepResult("orphaned", sequence=delivery.sequence)
        if (
            binding is not None
            and not self._binding_is_current(binding)
        ):
            self.store.mark_pending(
                self.config,
                delivery.sequence,
                "root binding changed before Poke admission",
                self.consumer,
            )
            return StepResult(
                "binding_changed", sequence=delivery.sequence
            )
        admission_method = (
            "turn/start"
            if expected_turn_id is None
            else "turn/steer"
        )
        # Persist the process and attempted target before the request. A
        # turn/start without a response has no target id, so it cannot be
        # retried during this app-server lifetime merely because the thread
        # still looks idle.
        self.store.record_sending_attempt(
            self.config,
            delivery.sequence,
            target_thread_id,
            delivery.message_id,
            admission_method,
            expected_turn_id,
            self.consumer,
        )

        result: Optional[Dict[str, Any]] = None
        request_error: Optional[AppServerRequestError] = None
        try:
            if expected_turn_id is None:
                result = self.app_server.turn_start(
                    target_thread_id,
                    delivery.message,
                    delivery.message_id,
                )
            else:
                result = self.app_server.turn_steer(
                    target_thread_id,
                    expected_turn_id,
                    delivery.message,
                    delivery.message_id,
                )
        except AppServerTransportError as exc:
            # Keep ``sending``: the server may have accepted before transport
            # failure, so the next connection must reconcile thread history.
            return StepResult(
                "ambiguous",
                sequence=delivery.sequence,
                reconnect=True,
                error=str(exc),
            )
        except AppServerRequestError as exc:
            request_error = exc

        if request_error is not None and expected_turn_id is not None:
            actual_turn_id = self._mismatched_active_turn_id(
                request_error, expected_turn_id
            )
            if actual_turn_id is not None:
                # Codex's own TUI retries this exact race once. Mirror it so a
                # Poke typed during a turn swap has the same Enter semantics.
                expected_turn_id = actual_turn_id
                self.store.record_sending_attempt(
                    self.config,
                    delivery.sequence,
                    target_thread_id,
                    delivery.message_id,
                    "turn/steer",
                    expected_turn_id,
                    self.consumer,
                )
                try:
                    result = self.app_server.turn_steer(
                        target_thread_id,
                        expected_turn_id,
                        delivery.message,
                        delivery.message_id,
                    )
                    request_error = None
                except AppServerTransportError as exc:
                    return StepResult(
                        "ambiguous",
                        sequence=delivery.sequence,
                        reconnect=True,
                        error=str(exc),
                    )
                except AppServerRequestError as exc:
                    request_error = exc

        if request_error is not None:
            self.store.mark_pending(
                self.config,
                delivery.sequence,
                str(request_error),
                self.consumer,
            )
            if (
                expected_turn_id is not None
                and self._active_turn_not_steerable(request_error)
            ):
                # Codex's TUI queues typed Enter input for review/compact
                # turns. Keep the durable Poke pending until that turn ends.
                return StepResult(
                    "nonsteerable",
                    sequence=delivery.sequence,
                    turn_id=expected_turn_id,
                )
            return StepResult(
                (
                    "steer_rejected"
                    if expected_turn_id is not None
                    else "rejected"
                ),
                sequence=delivery.sequence,
                error=str(request_error),
            )

        assert result is not None
        turn_id = (
            self._turn_id(result)
            if expected_turn_id is None
            else self._steer_turn_id(result)
        )
        if turn_id is None:
            # A response without turn.id is not enough to acknowledge, but it
            # is also not safe to retry until history reconciliation proves
            # the request was absent.
            return StepResult(
                "ambiguous",
                sequence=delivery.sequence,
                error=(
                    "turn/start response did not contain turn.id"
                    if expected_turn_id is None
                    else "turn/steer response did not contain turnId"
                ),
            )
        if expected_turn_id is not None and turn_id != expected_turn_id:
            return StepResult(
                "ambiguous",
                sequence=delivery.sequence,
                error=(
                    "turn/steer response turnId did not match "
                    "expectedTurnId"
                ),
            )

        # Both RPCs enqueue a submission before their response is returned.
        # Persist the provisional target, but do not retire the Poke until the
        # corresponding userMessage item has completed. For turn/start Codex
        # may internally steer the queued submission into a turn that became
        # active first, so the exact client id (rather than the response turn)
        # is the authoritative committed target.
        self.store.record_sending_attempt(
            self.config,
            delivery.sequence,
            target_thread_id,
            delivery.message_id,
            admission_method,
            turn_id,
            self.consumer,
        )
        observed_turn_id = self.observed_turn_id(
            target_thread_id, delivery.message_id
        )
        if observed_turn_id is None:
            return StepResult(
                (
                    "start_queued"
                    if expected_turn_id is None
                    else "steer_queued"
                ),
                sequence=delivery.sequence,
                turn_id=turn_id,
            )
        if (
            not isinstance(observed_turn_id, str)
            or not observed_turn_id
        ):
            return StepResult(
                "ambiguous",
                sequence=delivery.sequence,
                error="observed committed user message has no valid turn id",
            )
        if (
            expected_turn_id is not None
            and observed_turn_id != turn_id
        ):
            return StepResult(
                "ambiguous",
                sequence=delivery.sequence,
                error=(
                    "observed steered user message did not match "
                    "turn/steer response"
                ),
            )

        if not self._commit_durable(
            lambda: self.store.acknowledge(
                self.config,
                delivery.sequence,
                observed_turn_id,
                self.consumer,
            )
        ):
            # A committed server item is not enough to consume the Poke after
            # authority was revoked. Leave the row in ``sending`` for exact
            # old-thread reconciliation.
            return StepResult(
                (
                    "orphaned_after_accept"
                    if expected_turn_id is None
                    else "orphaned_after_steer"
                ),
                sequence=delivery.sequence,
                turn_id=observed_turn_id,
            )
        return StepResult(
            "accepted" if expected_turn_id is None else "steered",
            sequence=delivery.sequence,
            turn_id=observed_turn_id,
        )


class _StreamClosed:
    pass


class _StreamFailure:
    def __init__(self, error: Exception):
        self.error = error


class AppServerClient:
    """JSON-RPC over WebSocket bytes forwarded by ``app-server proxy``."""

    def __init__(
        self,
        socket_path: str,
        process_factory: Callable[..., Any] = subprocess.Popen,
        request_timeout: float = REQUEST_TIMEOUT_SECONDS,
    ):
        self.socket_path = os.path.abspath(os.path.expanduser(socket_path))
        self.process_factory = process_factory
        self.request_timeout = request_timeout
        self.process: Any = None
        self.reader_thread: Optional[threading.Thread] = None
        self.incoming: "queue.Queue[Any]" = queue.Queue()
        self.write_lock = threading.Lock()
        self.request_lock = threading.Lock()
        self.response_lock = threading.Lock()
        self.expected_response_key: Optional[Tuple[str, Any]] = None
        self.expected_response_observer: Optional[
            Callable[[Dict[str, Any]], None]
        ] = None
        self.reader_failure: Optional[AppServerTransportError] = None
        self.next_id = 1
        self.receive_buffer = bytearray()
        self.closed = False
        self.notification_handler: Optional[
            Callable[[Dict[str, Any]], None]
        ] = None
        self.disconnect_handler: Optional[Callable[[], None]] = None

    def start_raw(self) -> None:
        """Start a masked client WebSocket without app-server initialize."""
        if self.process is not None:
            return
        command = [
            "codex",
            "app-server",
            "proxy",
            "--sock",
            self.socket_path,
        ]
        try:
            self.process = self.process_factory(
                command,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                bufsize=0,
            )
        except OSError as exc:
            raise AppServerTransportError(
                "could not start codex app-server proxy: {}".format(exc)
            ) from exc
        if self.process.stdin is None or self.process.stdout is None:
            self.close()
            raise AppServerTransportError("app-server proxy has no stdio pipes")
        try:
            self._websocket_upgrade()
        except Exception:
            self.close()
            raise

    def start(self) -> None:
        if self.reader_thread is not None:
            return
        self.start_raw()
        self.reader_thread = threading.Thread(
            target=self._reader_loop,
            name="uclusion-codex-app-server-reader",
            daemon=True,
        )
        self.reader_thread.start()
        try:
            self.request(
                "initialize",
                {
                    "clientInfo": {
                        "name": "uclusion_codex_bridge",
                        "title": "Uclusion Codex Bridge",
                        "version": "1",
                    },
                    "capabilities": {"experimentalApi": True},
                },
            )
            self.notify("initialized", {})
        except Exception:
            self.close()
            raise

    def _websocket_upgrade(self) -> None:
        key = base64.b64encode(os.urandom(16)).decode("ascii")
        request = (
            "GET / HTTP/1.1\r\n"
            "Host: localhost\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            "Sec-WebSocket-Key: {}\r\n"
            "Sec-WebSocket-Version: 13\r\n"
            "\r\n"
        ).format(key).encode("ascii")
        try:
            self._write_raw(request)
        except (BrokenPipeError, OSError) as exc:
            raise AppServerTransportError(
                "app-server proxy closed during WebSocket upgrade"
            ) from exc
        header_bytes = self._read_http_headers(self.request_timeout)
        header, separator, remainder = header_bytes.partition(b"\r\n\r\n")
        if not separator:
            raise AppServerTransportError("incomplete WebSocket upgrade")
        lines = header.decode("iso-8859-1").split("\r\n")
        if not lines or lines[0] != "HTTP/1.1 101 Switching Protocols":
            raise AppServerTransportError(
                "app-server rejected WebSocket upgrade: {}".format(
                    lines[0] if lines else "empty response"
                )
            )
        headers: Dict[str, str] = {}
        for line in lines[1:]:
            name, separator, value = line.partition(":")
            if not separator:
                raise AppServerTransportError(
                    "invalid app-server WebSocket response header"
                )
            if (
                not name
                or name != name.strip()
                or any(
                    character not in HTTP_TOKEN_CHARACTERS
                    for character in name
                )
            ):
                raise AppServerTransportError(
                    "invalid app-server WebSocket response header name"
                )
            normalized = name.lower()
            if normalized in headers:
                raise AppServerTransportError(
                    "duplicate app-server WebSocket response header"
                )
            headers[normalized] = value.strip()
        expected = base64.b64encode(
            hashlib.sha1((key + WEBSOCKET_GUID).encode("ascii")).digest()
        ).decode("ascii")
        if headers.get("sec-websocket-accept") != expected:
            raise AppServerTransportError(
                "invalid Sec-WebSocket-Accept response"
            )
        if headers.get("upgrade", "").casefold() != "websocket":
            raise AppServerTransportError(
                "app-server WebSocket response lacks Upgrade"
            )
        connection_tokens = {
            token.strip().casefold()
            for token in headers.get("connection", "").split(",")
        }
        if "upgrade" not in connection_tokens:
            raise AppServerTransportError(
                "app-server WebSocket response lacks Connection: Upgrade"
            )
        if "sec-websocket-extensions" in headers:
            raise AppServerTransportError(
                "app-server negotiated unsupported WebSocket extensions"
            )
        if "sec-websocket-protocol" in headers:
            raise AppServerTransportError(
                "app-server negotiated an unsupported WebSocket subprotocol"
            )
        self.receive_buffer.extend(remainder)

    def _write_raw(self, payload: bytes) -> None:
        view = memoryview(payload)
        while view:
            written = self.process.stdin.write(view)
            if not written:
                raise BrokenPipeError("app-server proxy accepted no bytes")
            view = view[written:]
        self.process.stdin.flush()

    def _read_http_headers(self, timeout: float) -> bytes:
        selector = selectors.DefaultSelector()
        buffer = bytearray()
        try:
            selector.register(self.process.stdout, selectors.EVENT_READ)
            deadline = time.monotonic() + timeout
            while b"\r\n\r\n" not in buffer:
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    raise AppServerTimeout("WebSocket upgrade timed out")
                events = selector.select(remaining)
                if not events:
                    raise AppServerTimeout("WebSocket upgrade timed out")
                chunk = os.read(self.process.stdout.fileno(), 4096)
                if not chunk:
                    raise AppServerTransportError(
                        "app-server proxy closed during WebSocket upgrade"
                    )
                buffer.extend(chunk)
                if len(buffer) > 64 * 1024:
                    raise AppServerTransportError(
                        "WebSocket upgrade headers are too large"
                    )
            return bytes(buffer)
        finally:
            selector.close()

    @staticmethod
    def _masked_frame(opcode: int, payload: bytes, fin: bool = True) -> bytes:
        first = (0x80 if fin else 0) | (opcode & 0x0F)
        length = len(payload)
        if length < 126:
            header = bytes((first, 0x80 | length))
        elif length <= 0xFFFF:
            header = bytes((first, 0x80 | 126)) + struct.pack("!H", length)
        else:
            header = bytes((first, 0x80 | 127)) + struct.pack("!Q", length)
        mask = os.urandom(4)
        masked = bytes(
            byte ^ mask[index % 4] for index, byte in enumerate(payload)
        )
        return header + mask + masked

    def _write_frame(self, opcode: int, payload: bytes = b"") -> None:
        if self.process is None or self.closed:
            raise AppServerTransportError("app-server connection is closed")
        frame = self._masked_frame(opcode, payload)
        with self.write_lock:
            try:
                self._write_raw(frame)
            except (BrokenPipeError, OSError) as exc:
                raise AppServerTransportError(
                    "app-server proxy closed while writing"
                ) from exc

    def _read_exact(self, size: int) -> bytes:
        while len(self.receive_buffer) < size:
            chunk = self.process.stdout.read(size - len(self.receive_buffer))
            if not chunk:
                raise AppServerTransportError("app-server proxy closed")
            self.receive_buffer.extend(chunk)
        result = bytes(self.receive_buffer[:size])
        del self.receive_buffer[:size]
        return result

    def _read_frame(self) -> Tuple[bool, int, bytes]:
        first, second = self._read_exact(2)
        fin = bool(first & 0x80)
        rsv = first & 0x70
        opcode = first & 0x0F
        if rsv:
            raise AppServerTransportError(
                "unsupported WebSocket extension bits"
            )
        masked = bool(second & 0x80)
        if masked:
            raise AppServerTransportError(
                "app-server sent a masked server WebSocket frame"
            )
        length = second & 0x7F
        if length == 126:
            length = struct.unpack("!H", self._read_exact(2))[0]
            if length < 126:
                raise AppServerTransportError(
                    "app-server sent a non-canonical WebSocket length"
                )
        elif length == 127:
            length = struct.unpack("!Q", self._read_exact(8))[0]
            if length < 65536 or length & (1 << 63):
                raise AppServerTransportError(
                    "app-server sent an invalid WebSocket length"
                )
        if length > MAX_WEBSOCKET_MESSAGE_BYTES:
            raise AppServerTransportError("WebSocket message is too large")
        payload = self._read_exact(length)
        if opcode >= 0x8 and (not fin or length > 125):
            raise AppServerTransportError(
                "app-server sent an invalid WebSocket control frame"
            )
        return fin, opcode, payload

    def read_json_message(self) -> Optional[Dict[str, Any]]:
        """Read one complete upstream JSON object, handling control frames."""
        fragments = bytearray()
        fragment_opcode: Optional[int] = None
        while not self.closed:
            fin, opcode, payload = self._read_frame()
            if opcode == 0x8:
                _validate_websocket_close_payload(
                    payload, "app-server", AppServerTransportError
                )
                return None
            if opcode == 0x9:
                self._write_frame(0xA, payload)
                continue
            if opcode == 0xA:
                continue
            if opcode in (0x1, 0x2):
                if fragment_opcode is not None:
                    raise AppServerTransportError(
                        "overlapping fragmented WebSocket messages"
                    )
                if fin:
                    complete = payload
                    complete_opcode = opcode
                else:
                    fragments.extend(payload)
                    fragment_opcode = opcode
                    continue
            elif opcode == 0x0:
                if fragment_opcode is None:
                    raise AppServerTransportError(
                        "unexpected WebSocket continuation"
                    )
                fragments.extend(payload)
                if len(fragments) > MAX_WEBSOCKET_MESSAGE_BYTES:
                    raise AppServerTransportError(
                        "fragmented WebSocket message is too large"
                    )
                if not fin:
                    continue
                complete = bytes(fragments)
                complete_opcode = fragment_opcode
                fragments.clear()
                fragment_opcode = None
            else:
                raise AppServerTransportError(
                    "unsupported WebSocket opcode {}".format(opcode)
                )
            if complete_opcode != 0x1:
                raise AppServerTransportError(
                    "app-server sent a non-text JSON-RPC message"
                )
            return _strict_json_object(complete, "app-server")
        return None

    def _record_reader_failure(
        self, error: AppServerTransportError
    ) -> None:
        first_failure = False
        with self.response_lock:
            if self.reader_failure is None:
                self.reader_failure = error
                first_failure = True
        if first_failure and self.disconnect_handler is not None:
            self.disconnect_handler()
        self.incoming.put(_StreamFailure(error))

    def _reader_loop(self) -> None:
        try:
            while not self.closed:
                message = self.read_json_message()
                if message is None:
                    error = AppServerTransportError(
                        "app-server closed the WebSocket"
                    )
                    self._record_reader_failure(error)
                    return
                if "method" in message and "id" not in message:
                    # The driver is noninteractive, but its continuously
                    # subscribed stream is the stable witness for
                    # thread lifecycle and token-audit state. The handler
                    # filters unrelated broadcasts in place.
                    if self.notification_handler is not None:
                        self.notification_handler(message)
                    continue
                if "method" in message and "id" in message:
                    # Thread-scoped interactive requests are duplicated to
                    # every subscriber. The relayed TUI owns the response;
                    # answering from this noninteractive witness could reject
                    # the request before the human sees it.
                    continue
                try:
                    response_key = _validate_response_envelope(
                        message, "app-server"
                    )
                except RelayProtocolError as exc:
                    raise AppServerTransportError(str(exc)) from exc
                with self.response_lock:
                    expected_key = self.expected_response_key
                    response_observer = (
                        self.expected_response_observer
                    )
                if expected_key is None:
                    error = AppServerTransportError(
                        "app-server sent an unsolicited JSON-RPC response"
                    )
                    self._record_reader_failure(error)
                    return
                if response_key != expected_key:
                    error = AppServerTransportError(
                        "app-server returned an unexpected JSON-RPC "
                        "response id"
                    )
                    self._record_reader_failure(error)
                    return
                if response_observer is not None:
                    response_observer(message)
                self.incoming.put(message)
        except Exception as exc:
            if not self.closed:
                error = (
                    exc
                    if isinstance(exc, AppServerTransportError)
                    else AppServerTransportError(str(exc))
                )
                self._record_reader_failure(error)

    def _send_json(self, message: Dict[str, Any]) -> None:
        try:
            encoded = json.dumps(
                message,
                separators=(",", ":"),
                ensure_ascii=False,
                allow_nan=False,
            ).encode("utf-8")
        except (TypeError, ValueError, UnicodeEncodeError) as exc:
            raise AppServerTransportError(
                "bridge attempted to send invalid JSON to app-server"
            ) from exc
        self._write_frame(0x1, encoded)

    def send_json_message(self, message: Dict[str, Any]) -> None:
        self._send_json(message)

    def notify(self, method: str, params: Dict[str, Any]) -> None:
        self._send_json({"method": method, "params": params})

    def request(
        self,
        method: str,
        params: Dict[str, Any],
        timeout: Optional[float] = None,
        response_observer: Optional[
            Callable[[Dict[str, Any]], None]
        ] = None,
    ) -> Dict[str, Any]:
        effective_timeout = self.request_timeout if timeout is None else timeout
        with self.request_lock:
            request_id = self.next_id
            self.next_id += 1
            try:
                request_key = rpc_id_key(request_id)
            except RelayProtocolError as exc:
                raise AppServerTransportError(str(exc)) from exc
            with self.response_lock:
                if self.reader_failure is not None:
                    raise self.reader_failure
                if self.expected_response_key is not None:
                    raise AppServerTransportError(
                        "another app-server response is already pending"
                    )
                self.expected_response_key = request_key
                self.expected_response_observer = response_observer
            try:
                self._send_json(
                    {"method": method, "id": request_id, "params": params}
                )
                deadline = time.monotonic() + effective_timeout
                while True:
                    remaining = deadline - time.monotonic()
                    if remaining <= 0:
                        raise AppServerTimeout(
                            "{} request timed out".format(method)
                        )
                    try:
                        message = self.incoming.get(timeout=remaining)
                    except queue.Empty as exc:
                        raise AppServerTimeout(
                            "{} request timed out".format(method)
                        ) from exc
                    if isinstance(message, _StreamClosed):
                        raise AppServerTransportError(
                            "app-server closed the WebSocket"
                        )
                    if isinstance(message, _StreamFailure):
                        error = message.error
                        if isinstance(error, AppServerTransportError):
                            raise error
                        raise AppServerTransportError(str(error)) from error
                    if not isinstance(message, dict):
                        raise AppServerTransportError(
                            "invalid app-server response"
                        )
                    if "method" in message and "id" in message:
                        raise AppServerTransportError(
                            "app-server sent a server request on the "
                            "driver connection"
                        )
                    if "id" not in message:
                        raise AppServerTransportError(
                            "app-server response has no id"
                        )
                    try:
                        response_key = rpc_id_key(message["id"])
                    except RelayProtocolError as exc:
                        raise AppServerTransportError(str(exc)) from exc
                    if response_key != request_key:
                        raise AppServerTransportError(
                            "app-server returned an unexpected JSON-RPC "
                            "response id"
                        )
                    has_result = "result" in message
                    has_error = "error" in message
                    if has_result == has_error:
                        raise AppServerTransportError(
                            "{} response must contain exactly one of "
                            "result/error".format(method)
                        )
                    if has_error:
                        error = message.get("error")
                        if not isinstance(error, dict):
                            raise AppServerTransportError(
                                "{} response error is not an object".format(
                                    method
                                )
                            )
                        raise AppServerRequestError(
                            str(
                                error.get(
                                    "message", "app-server request failed"
                                )
                            ),
                            error.get("code"),
                            error.get("data"),
                        )
                    result = message.get("result")
                    if not isinstance(result, dict):
                        raise AppServerTransportError(
                            "{} response has no result object".format(method)
                        )
                    return result
            finally:
                with self.response_lock:
                    if self.expected_response_key == request_key:
                        self.expected_response_key = None
                        self.expected_response_observer = None

    def thread_read(
        self, thread_id: str, include_turns: bool
    ) -> Dict[str, Any]:
        result = self.request(
            "thread/read",
            {"threadId": thread_id, "includeTurns": include_turns},
        )
        thread = result.get("thread")
        if not isinstance(thread, dict):
            raise AppServerTransportError(
                "thread/read response has no thread"
            )
        return thread

    def fence_thread(self, thread_id: str) -> None:
        """Drain fan-out through a post-origin listener command."""
        self.subscribe_thread(thread_id, lambda: None)

    def subscribe_thread(
        self,
        thread_id: str,
        on_subscribed: Callable[[], None],
    ) -> None:
        """Synchronously subscribe this connection to a loaded thread."""

        def observe_response(message: Dict[str, Any]) -> None:
            result = message.get("result")
            if result is None and "error" in message:
                return
            thread = (
                result.get("thread")
                if isinstance(result, dict)
                else None
            )
            if (
                not isinstance(thread, dict)
                or thread.get("id") != thread_id
            ):
                raise AppServerTransportError(
                    "driver thread/resume response did not confirm {}"
                    .format(thread_id)
                )
            # This callback runs on the ordered driver reader before it can
            # process a later lifecycle notification for the same thread.
            on_subscribed()

        result = self.request(
            "thread/resume",
            {"threadId": thread_id, "excludeTurns": True},
            response_observer=observe_response,
        )
        thread = result.get("thread")
        if (
            not isinstance(thread, dict)
            or thread.get("id") != thread_id
        ):
            raise AppServerTransportError(
                "driver thread/resume response did not confirm {}".format(
                    thread_id
                )
            )

    def thread_turns_list(
        self,
        thread_id: str,
        cursor: Optional[str],
        limit: int,
        sort_direction: str,
        items_view: str,
    ) -> Dict[str, Any]:
        params: Dict[str, Any] = {
            "threadId": thread_id,
            "limit": limit,
            "sortDirection": sort_direction,
            "itemsView": items_view,
        }
        if cursor is not None:
            params["cursor"] = cursor
        return self.request("thread/turns/list", params)

    def turn_start(
        self, thread_id: str, text: str, message_id: str
    ) -> Dict[str, Any]:
        return self.request(
            "turn/start",
            {
                "threadId": thread_id,
                "input": [{"type": "text", "text": text}],
                "clientUserMessageId": message_id,
            },
        )

    def turn_steer(
        self,
        thread_id: str,
        expected_turn_id: str,
        text: str,
        message_id: str,
    ) -> Dict[str, Any]:
        return self.request(
            "turn/steer",
            {
                "threadId": thread_id,
                "input": [{"type": "text", "text": text}],
                "clientUserMessageId": message_id,
                "expectedTurnId": expected_turn_id,
            },
        )

    def close(self) -> None:
        process = self.process
        if process is None:
            return
        # Do not wait for write_lock here. A writer may hold it while blocked
        # on the proxy pipe; terminating the proxy is what releases that
        # writer.
        self.closed = True
        try:
            process.terminate()
        except OSError:
            pass
        try:
            process.wait(timeout=2)
        except (subprocess.TimeoutExpired, AttributeError):
            try:
                process.kill()
            except OSError:
                pass
            try:
                process.wait(timeout=2)
            except Exception:
                pass
        for stream_name in ("stdin", "stdout"):
            stream = getattr(process, stream_name, None)
            if stream is not None:
                try:
                    stream.close()
                except OSError:
                    pass
        self.process = None

    def __enter__(self) -> "AppServerClient":
        self.start()
        return self

    def __exit__(self, exc_type: Any, exc: Any, traceback: Any) -> None:
        self.close()


class FrontendWebSocket:
    """Unextended server-side WebSocket for one Unix-socket TUI client."""

    def __init__(self, connection: socket.socket):
        self.connection = connection
        self.receive_buffer = bytearray()
        self.write_lock = threading.Lock()
        self.state_lock = threading.Lock()
        self.closed = False
        self.closing = False
        self.received_close = False
        self.received_close_code: Optional[int] = None

    @classmethod
    def accept(
        cls, connection: socket.socket, timeout: float
    ) -> "FrontendWebSocket":
        endpoint = cls(connection)
        connection.settimeout(timeout)
        try:
            header_bytes = endpoint._read_http_headers()
            header, separator, remainder = header_bytes.partition(
                b"\r\n\r\n"
            )
            if not separator:
                raise RelayProtocolError(
                    "incomplete TUI WebSocket upgrade"
                )
            try:
                lines = header.decode("iso-8859-1").split("\r\n")
            except UnicodeDecodeError as exc:
                raise RelayProtocolError(
                    "invalid TUI WebSocket upgrade headers"
                ) from exc
            request_parts = lines[0].split() if lines else []
            if (
                len(request_parts) != 3
                or request_parts[0] != "GET"
                or request_parts[2] != "HTTP/1.1"
            ):
                raise RelayProtocolError(
                    "invalid TUI WebSocket request line"
                )
            headers: Dict[str, str] = {}
            for line in lines[1:]:
                name, colon, value = line.partition(":")
                if not colon:
                    raise RelayProtocolError(
                        "invalid TUI WebSocket header"
                    )
                if (
                    not name
                    or name != name.strip()
                    or any(
                        character not in HTTP_TOKEN_CHARACTERS
                        for character in name
                    )
                ):
                    raise RelayProtocolError(
                        "invalid TUI WebSocket header name"
                    )
                normalized = name.lower()
                if normalized in headers:
                    raise RelayProtocolError(
                        "duplicate TUI WebSocket header {}".format(
                            normalized
                        )
                    )
                headers[normalized] = value.strip()
            if not headers.get("host"):
                raise RelayProtocolError(
                    "TUI WebSocket upgrade has no Host header"
                )
            if headers.get("upgrade", "").casefold() != "websocket":
                raise RelayProtocolError(
                    "TUI did not request a WebSocket upgrade"
                )
            connection_tokens = {
                token.strip().casefold()
                for token in headers.get("connection", "").split(",")
            }
            if "upgrade" not in connection_tokens:
                raise RelayProtocolError(
                    "TUI WebSocket Connection header lacks Upgrade"
                )
            if headers.get("sec-websocket-version") != "13":
                raise RelayProtocolError(
                    "TUI requested an unsupported WebSocket version"
                )
            key = headers.get("sec-websocket-key")
            if not key:
                raise RelayProtocolError(
                    "TUI WebSocket upgrade has no key"
                )
            try:
                decoded_key = base64.b64decode(key, validate=True)
            except (ValueError, TypeError) as exc:
                raise RelayProtocolError(
                    "TUI WebSocket key is invalid"
                ) from exc
            if len(decoded_key) != 16:
                raise RelayProtocolError(
                    "TUI WebSocket key has an invalid length"
                )
            accept = base64.b64encode(
                hashlib.sha1(
                    (key + WEBSOCKET_GUID).encode("ascii")
                ).digest()
            ).decode("ascii")
            # We intentionally negotiate neither extensions nor subprotocols.
            response = (
                "HTTP/1.1 101 Switching Protocols\r\n"
                "Upgrade: websocket\r\n"
                "Connection: Upgrade\r\n"
                "Sec-WebSocket-Accept: {}\r\n"
                "\r\n"
            ).format(accept).encode("ascii")
            connection.sendall(response)
            endpoint.receive_buffer.extend(remainder)
            connection.settimeout(None)
            return endpoint
        except Exception:
            endpoint.close()
            raise

    def _read_http_headers(self) -> bytes:
        while b"\r\n\r\n" not in self.receive_buffer:
            chunk = self.connection.recv(4096)
            if not chunk:
                raise AppServerTransportError(
                    "TUI closed during WebSocket upgrade"
                )
            self.receive_buffer.extend(chunk)
            if len(self.receive_buffer) > MAX_WEBSOCKET_HEADERS_BYTES:
                raise RelayProtocolError(
                    "TUI WebSocket upgrade headers are too large"
                )
        result = bytes(self.receive_buffer)
        self.receive_buffer.clear()
        return result

    def _read_exact(self, size: int) -> bytes:
        while len(self.receive_buffer) < size:
            chunk = self.connection.recv(
                max(4096, size - len(self.receive_buffer))
            )
            if not chunk:
                raise AppServerTransportError("TUI WebSocket closed")
            self.receive_buffer.extend(chunk)
        result = bytes(self.receive_buffer[:size])
        del self.receive_buffer[:size]
        return result

    def _read_frame(self) -> Tuple[bool, int, bytes]:
        first, second = self._read_exact(2)
        fin = bool(first & 0x80)
        if first & 0x70:
            raise RelayProtocolError(
                "TUI used unsupported WebSocket extension bits"
            )
        opcode = first & 0x0F
        if not second & 0x80:
            raise RelayProtocolError(
                "TUI sent an unmasked client WebSocket frame"
            )
        length = second & 0x7F
        if length == 126:
            length = struct.unpack("!H", self._read_exact(2))[0]
            if length < 126:
                raise RelayProtocolError(
                    "TUI sent a non-canonical WebSocket length"
                )
        elif length == 127:
            length = struct.unpack("!Q", self._read_exact(8))[0]
            if length < 65536 or length & (1 << 63):
                raise RelayProtocolError(
                    "TUI sent an invalid WebSocket length"
                )
        if length > MAX_WEBSOCKET_MESSAGE_BYTES:
            raise RelayProtocolError("TUI WebSocket message is too large")
        if opcode >= 0x8 and (not fin or length > 125):
            raise RelayProtocolError(
                "TUI sent an invalid WebSocket control frame"
            )
        mask = self._read_exact(4)
        payload = self._read_exact(length)
        return fin, opcode, bytes(
            byte ^ mask[index % 4]
            for index, byte in enumerate(payload)
        )

    @staticmethod
    def _unmasked_frame(
        opcode: int, payload: bytes = b"", fin: bool = True
    ) -> bytes:
        first = (0x80 if fin else 0) | (opcode & 0x0F)
        length = len(payload)
        if length < 126:
            return bytes((first, length)) + payload
        if length <= 0xFFFF:
            return (
                bytes((first, 126))
                + struct.pack("!H", length)
                + payload
            )
        return (
            bytes((first, 127))
            + struct.pack("!Q", length)
            + payload
        )

    def _write_frame(self, opcode: int, payload: bytes = b"") -> None:
        frame = self._unmasked_frame(opcode, payload)
        with self.write_lock:
            with self.state_lock:
                if self.closed:
                    raise AppServerTransportError(
                        "TUI WebSocket is closed"
                    )
                if self.closing:
                    # The Close response is emitted only by
                    # _begin_close_handshake. Suppress racing JSON/control
                    # output once that method has linearized closing.
                    return
            try:
                self.connection.sendall(frame)
            except OSError as exc:
                raise AppServerTransportError(
                    "TUI WebSocket closed while writing"
                ) from exc

    def _begin_close_handshake(
        self,
        payload: bytes,
        close_code: Optional[int],
        on_closing: Optional[Callable[[Optional[int]], None]] = None,
    ) -> None:
        frame = self._unmasked_frame(0x8, payload)
        with self.state_lock:
            if self.closed:
                raise AppServerTransportError(
                    "TUI WebSocket is closed"
                )
            if self.closing:
                return
            self.closing = True
            self.received_close = True
            self.received_close_code = close_code
            if on_closing is not None:
                # Revoke admission while Close receipt is linearized, before
                # either a prior data write or this Close echo can block.
                on_closing(close_code)
        with self.write_lock:
            with self.state_lock:
                if self.closed:
                    return
            try:
                self.connection.sendall(frame)
            except OSError:
                # Receipt and validation of the peer's Close frame already
                # established the shutdown classification and revoked any
                # primary authority. Codex may close immediately after
                # sending /quit's normal Close rather than wait for the echo;
                # a failed best-effort echo must not rewrite that clean exit
                # into a fatal relay failure. Non-normal codes are still
                # classified and failed by the caller below.
                return

    def read_json_message(
        self,
        on_closing: Optional[Callable[[Optional[int]], None]] = None,
    ) -> Optional[Dict[str, Any]]:
        fragments = bytearray()
        fragment_opcode: Optional[int] = None
        while not self.closed:
            fin, opcode, payload = self._read_frame()
            if opcode == 0x8:
                close_code = _validate_websocket_close_payload(
                    payload, "TUI", RelayProtocolError
                )
                # Complete the server half of the WebSocket closing
                # handshake before the relay tears down its transport.
                self._begin_close_handshake(
                    payload, close_code, on_closing
                )
                return None
            if opcode == 0x9:
                self._write_frame(0xA, payload)
                continue
            if opcode == 0xA:
                continue
            if opcode in (0x1, 0x2):
                if fragment_opcode is not None:
                    raise RelayProtocolError(
                        "TUI sent overlapping fragmented messages"
                    )
                if fin:
                    complete = payload
                    complete_opcode = opcode
                else:
                    fragments.extend(payload)
                    fragment_opcode = opcode
                    continue
            elif opcode == 0x0:
                if fragment_opcode is None:
                    raise RelayProtocolError(
                        "TUI sent an unexpected WebSocket continuation"
                    )
                fragments.extend(payload)
                if len(fragments) > MAX_WEBSOCKET_MESSAGE_BYTES:
                    raise RelayProtocolError(
                        "TUI fragmented WebSocket message is too large"
                    )
                if not fin:
                    continue
                complete = bytes(fragments)
                complete_opcode = fragment_opcode
                fragments.clear()
                fragment_opcode = None
            else:
                raise RelayProtocolError(
                    "TUI sent unsupported WebSocket opcode {}".format(
                        opcode
                    )
                )
            if complete_opcode != 0x1:
                raise RelayProtocolError(
                    "TUI sent a non-text JSON-RPC message"
                )
            return _strict_json_object(complete, "TUI")
        return None

    def send_json_message(self, message: Dict[str, Any]) -> None:
        try:
            payload = json.dumps(
                message,
                separators=(",", ":"),
                ensure_ascii=False,
                allow_nan=False,
            ).encode("utf-8")
        except (TypeError, ValueError, UnicodeEncodeError) as exc:
            raise RelayProtocolError(
                "relay attempted to send invalid JSON to TUI"
            ) from exc
        self._write_frame(0x1, payload)

    def close_with_error(self) -> None:
        """Best-effort WebSocket 1011 before bounded fatal teardown."""
        frame = self._unmasked_frame(0x8, struct.pack("!H", 1011))
        with self.state_lock:
            should_write = not self.closed and not self.closing
            if should_write:
                self.closing = True
        if should_write and self.write_lock.acquire(blocking=False):
            try:
                with self.state_lock:
                    writable = not self.closed
                if writable:
                    try:
                        # Fatal teardown must never wait for a peer that has
                        # stopped reading. A single nonblocking write is
                        # sufficient for this best-effort diagnostic frame;
                        # partial delivery falls back to the raw close below.
                        self.connection.send(frame, socket.MSG_DONTWAIT)
                    except OSError:
                        pass
            finally:
                self.write_lock.release()
        self.close()

    def close(self) -> None:
        with self.state_lock:
            if self.closed:
                return
            # Socket shutdown must not wait behind a writer blocked in
            # sendall.
            self.closed = True
        try:
            self.connection.shutdown(socket.SHUT_RDWR)
        except OSError:
            pass
        try:
            self.connection.close()
        except OSError:
            pass


class _RelayConnection:
    def __init__(
        self,
        relay: "UnixWebSocketRelay",
        connection_id: int,
        raw_socket: socket.socket,
    ):
        self.relay = relay
        self.connection_id = connection_id
        self.raw_socket = raw_socket
        self.frontend: Optional[FrontendWebSocket] = None
        self.upstream: Optional[AppServerClient] = None
        self.role = "pending"
        self.initialize_seen = False
        self.client_version: Optional[str] = None
        self.pending: Dict[Tuple[str, Any], _RelayPending] = {}
        self.pending_lock = threading.Lock()
        self.backend_pending: Dict[Tuple[str, Any], bool] = {}
        self.backend_pending_lock = threading.Lock()
        self.closed = threading.Event()
        self.upstream_handoff_lock = threading.RLock()
        self.upstream_stream_retired = False
        self.upstream_replay_queue = collections.deque()
        self.replaying_upstream = False
        self.upstream_reader: Optional[threading.Thread] = None
        self.gated_queue: "queue.Queue[Any]" = queue.Queue()
        self.gated_worker: Optional[threading.Thread] = None

    def _is_authoritative(self) -> bool:
        return self.role == "primary" or self.relay.authority.is_primary(
            self.connection_id
        )

    def _fatal_or_close(self, reason: str) -> None:
        if self._is_authoritative():
            self.relay.fail(reason)
        else:
            self._retire_upstream_stream()
            self.close()

    def _retire_upstream_stream(self) -> None:
        """Order stream retirement after any root-pin origin fence."""
        with self.upstream_handoff_lock:
            if self.upstream_stream_retired:
                return
            self.upstream_stream_retired = True
            self.relay.authority.connection_closed(self.connection_id)

    def _driver_pin_origin_fence(
        self, thread_id: str
    ) -> list:
        """Drain pre-driver notifications from the originating stream.

        An event processed before the driver subscription is routed to
        this connection before the driver resume response. This post-ACK
        thread/read response is therefore a FIFO fence: every such event must
        be read before the fence response, while later events include the
        newly subscribed driver.
        """
        assert self.upstream is not None
        while True:
            marker_id = "uclusion-codex-pin-fence:{}".format(
                os.urandom(16).hex()
            )
            marker_key = rpc_id_key(marker_id)
            with self.pending_lock:
                collides_with_tui = marker_key in self.pending
            with self.backend_pending_lock:
                collides_with_backend = marker_key in self.backend_pending
            if not collides_with_tui and not collides_with_backend:
                break

        buffered = []
        timeout_fired = threading.Event()

        def expire_fence() -> None:
            timeout_fired.set()
            self.relay.fail(
                "origin stream fence timed out after driver subscribed "
                "to {}".format(thread_id)
            )

        timer = threading.Timer(
            self.relay.request_timeout, expire_fence
        )
        timer.daemon = True
        try:
            # Include a blocked proxy write in the fence deadline. relay.fail
            # closes the upstream transport, which breaks a wedged send.
            timer.start()
            self.upstream.send_json_message(
                {
                    "id": marker_id,
                    "method": "thread/read",
                    "params": {
                        "threadId": thread_id,
                        "includeTurns": False,
                    },
                }
            )
            while True:
                message = self.upstream.read_json_message()
                if message is None:
                    raise AppServerTransportError(
                        "app-server closed during origin stream fence"
                    )
                if not isinstance(message.get("method"), str):
                    response_key = _validate_response_envelope(
                        message, "app-server"
                    )
                    if response_key == marker_key:
                        if "error" in message:
                            error = message.get("error")
                            assert isinstance(error, dict)
                            raise RelayProtocolError(
                                "origin stream fence failed: {}".format(
                                    error.get(
                                        "message",
                                        "thread/read was rejected",
                                    )
                                )
                            )
                        result = message.get("result")
                        thread = (
                            result.get("thread")
                            if isinstance(result, dict)
                            else None
                        )
                        if (
                            not isinstance(thread, dict)
                            or thread.get("id") != thread_id
                        ):
                            raise RelayProtocolError(
                                "origin stream fence did not confirm {}"
                                .format(thread_id)
                            )
                        return buffered
                buffered.append(message)
        except Exception as exc:
            if not timeout_fired.is_set():
                self.relay.fail(
                    "origin stream fence failed for {}: {}".format(
                        thread_id, exc
                    )
                )
            raise
        finally:
            timer.cancel()

    def _observe_upstream_notification(
        self, message: Dict[str, Any]
    ) -> None:
        self.relay.authority.observe_notification(
            self.connection_id, message
        )
        if self.relay.authority.fatal_error is not None:
            raise RelayProtocolError(
                self.relay.authority.fatal_error
            )
        if (
            self.relay.primary_notification_observer is not None
            and self.relay.authority.primary_notification_is_audit_witness(
                self.connection_id, message
            )
        ):
            self.relay.primary_notification_observer(message)

    def _queue_buffered_upstream(
        self,
        buffered_messages: list,
        preobserved_notifications: set,
    ) -> None:
        for index, buffered_message in enumerate(buffered_messages):
            self.upstream_replay_queue.append(
                (
                    buffered_message,
                    index in preobserved_notifications,
                )
            )
        if self.replaying_upstream:
            return
        self.replaying_upstream = True
        try:
            while self.upstream_replay_queue:
                buffered_message, notification_observed = (
                    self.upstream_replay_queue.popleft()
                )
                self._handle_upstream_message(
                    buffered_message,
                    notification_observed=notification_observed,
                )
        finally:
            self.replaying_upstream = False

    def _reserve_request(
        self,
        message: Dict[str, Any],
        method: str,
        params: Dict[str, Any],
        initialize_client_name: Optional[str] = None,
    ) -> Tuple[Tuple[str, Any], _RelayPending]:
        key = _message_request_id(message)
        pending = _RelayPending(
            method=method,
            params=params,
            initialize_client_name=initialize_client_name,
        )
        with self.pending_lock:
            if key in self.pending:
                raise RelayProtocolError(
                    "duplicate in-flight JSON-RPC request id"
                )
            self.pending[key] = pending
        return key, pending

    def _discard_pending(self, key: Tuple[str, Any]) -> None:
        with self.pending_lock:
            self.pending.pop(key, None)

    def _forward_serialized(
        self,
        key: Optional[Tuple[str, Any]],
        pending: Optional[_RelayPending],
        message: Dict[str, Any],
    ) -> None:
        gate: Optional[RelayGate] = None
        try:
            if pending is not None:
                gate = self.relay.authority.begin_tui_request(
                    self.connection_id,
                    pending.method,
                    pending.params,
                    waiter_reserved=True,
                )
                pending.gate = gate
            if self.closed.is_set():
                if gate is not None:
                    self.relay.authority.abort_tui_request(
                        gate,
                        "primary TUI disconnected before forwarding "
                        + pending.method,
                    )
                return
            assert self.upstream is not None
            self.upstream.send_json_message(message)
        except Exception as exc:
            if key is not None:
                self._discard_pending(key)
            if gate is not None:
                assert pending is not None
                self.relay.authority.abort_tui_request(
                    gate, "{} forwarding failed: {}".format(
                        pending.method, exc
                    )
                )
            label = (
                pending.method
                if pending is not None
                else str(message.get("method", "notification"))
            )
            self._fatal_or_close(
                "{} forwarding failed: {}".format(label, exc)
            )
        finally:
            self.relay.authority.release_primary_work(
                self.connection_id
            )

    def _run_gated_queue(self) -> None:
        while True:
            item = self.gated_queue.get()
            if item is None:
                return
            key, pending, message = item
            self._forward_serialized(key, pending, message)

    def _handle_frontend_message(self, message: Dict[str, Any]) -> None:
        method = message.get("method")
        if not isinstance(method, str):
            if self.role == "pending":
                raise RelayProtocolError(
                    "TUI sent a response before initialize completed"
                )
            # This is a response to a backend-initiated server request.
            key = _validate_response_envelope(message, "TUI")
            with self.backend_pending_lock:
                expected = self.backend_pending.pop(key, None)
            if expected is None:
                raise RelayProtocolError(
                    "TUI returned an unknown backend-request response id"
                )
            assert self.upstream is not None
            self.upstream.send_json_message(message)
            return
        if "result" in message or "error" in message:
            raise RelayProtocolError(
                "TUI JSON-RPC request contains a response envelope"
            )
        if self.role == "pending":
            if not self.initialize_seen:
                if method != "initialize" or "id" not in message:
                    raise RelayProtocolError(
                        "initialize must be the first TUI request"
                    )
            else:
                raise RelayProtocolError(
                    "TUI sent traffic before initialize completed"
                )
        params = message.get("params", {})
        if not isinstance(params, dict):
            raise RelayProtocolError(
                "{} request params are not an object".format(method)
            )

        initialize_name: Optional[str] = None
        if method == "initialize":
            if self.initialize_seen:
                raise RelayProtocolError(
                    "TUI sent initialize more than once"
                )
            self.initialize_seen = True
            client_info = params.get("clientInfo")
            if isinstance(client_info, dict):
                candidate = client_info.get("name")
                if isinstance(candidate, str):
                    initialize_name = candidate
                version = client_info.get("version")
                if isinstance(version, str) and version:
                    self.client_version = version

        if self.relay.token_audit_enabled:
            audit_params: Optional[Dict[str, Any]] = None
            if (
                method == "initialize"
                and initialize_name == TUI_CLIENT_NAME
            ):
                capabilities = params.get("capabilities")
                if capabilities is None or isinstance(capabilities, dict):
                    audit_params = dict(params)
                    audit_capabilities = (
                        dict(capabilities)
                        if isinstance(capabilities, dict)
                        else {}
                    )
                    audit_capabilities["experimentalApi"] = True
                    audit_params["capabilities"] = audit_capabilities
            elif method == "thread/start" and self.role == "primary":
                audit_params = dict(params)
                audit_params["experimentalRawEvents"] = True
            if audit_params is not None:
                # Keep the caller-owned JSON object pristine. Pending request
                # bookkeeping must use the exact parameters sent upstream so
                # authority checks and forwarding cannot disagree.
                message = dict(message)
                message["params"] = audit_params
                params = audit_params

        is_request = "id" in message
        if not is_request:
            if (
                method in ROOT_SWITCH_METHODS
                or method in ROOT_INVALIDATION_METHODS
                or method in HUMAN_ADMISSION_METHODS
                or method in PRIMARY_CONTROL_BYPASS_METHODS
            ):
                raise RelayProtocolError(
                    "{} must be a JSON-RPC request".format(method)
                )
            if (
                self.role == "primary"
                and method not in PRIMARY_CONTROL_BYPASS_METHODS
            ):
                self.relay.authority.reserve_primary_work(
                    self.connection_id
                )
                self.gated_queue.put((None, None, message))
                return
            assert self.upstream is not None
            self.upstream.send_json_message(message)
            return

        if self.role == "auxiliary":
            self.relay.authority.validate_auxiliary_request(
                self.connection_id, method, params
            )
        key, pending = self._reserve_request(
            message, method, params, initialize_name
        )
        if (
            self.role == "primary"
            and method not in PRIMARY_CONTROL_BYPASS_METHODS
        ):
            try:
                self.relay.authority.reserve_primary_work(
                    self.connection_id
                )
            except Exception:
                self._discard_pending(key)
                raise
            self.gated_queue.put((key, pending, message))
            return
        try:
            assert self.upstream is not None
            self.upstream.send_json_message(message)
        except Exception:
            self._discard_pending(key)
            raise

    def _claim_initialize_role(
        self, pending: _RelayPending, response: Dict[str, Any]
    ) -> None:
        if "error" in response:
            self.role = "auxiliary"
            return
        if not isinstance(response.get("result"), dict):
            raise RelayProtocolError(
                "initialize response has no result object"
            )
        if pending.initialize_client_name == TUI_CLIENT_NAME:
            if self.relay.authority.claim_primary(self.connection_id):
                self.role = "primary"
            else:
                self.role = "auxiliary"
        else:
            self.role = "auxiliary"

    def _handle_upstream_message(
        self,
        message: Dict[str, Any],
        notification_observed: bool = False,
    ) -> None:
        method = message.get("method")
        if isinstance(method, str):
            if "result" in message or "error" in message:
                raise RelayProtocolError(
                    "app-server JSON-RPC request contains a response envelope"
                )
            if "id" in message:
                key = _message_request_id(message)
                with self.backend_pending_lock:
                    if key in self.backend_pending:
                        raise RelayProtocolError(
                            "app-server repeated an in-flight backend "
                            "request id"
                        )
                    self.backend_pending[key] = True
            if "id" not in message:
                if not notification_observed:
                    self._observe_upstream_notification(message)
            assert self.frontend is not None
            if not self.frontend.received_close:
                self.frontend.send_json_message(message)
            return
        key = _validate_response_envelope(message, "app-server")
        with self.pending_lock:
            pending = self.pending.pop(key, None)
        if pending is None:
            raise RelayProtocolError(
                "app-server returned an unknown JSON-RPC response id"
            )
        if pending.method == "initialize":
            self._claim_initialize_role(pending, message)
        buffered_after_root = []
        preobserved_notifications = set()
        candidate_primary_thread: Optional[Dict[str, Any]] = None
        if (
            pending.method in ROOT_SWITCH_METHODS
            and "result" in message
        ):
            result = message.get("result")
            result_thread = (
                result.get("thread")
                if isinstance(result, dict)
                else None
            )
            result_thread_id = (
                result_thread.get("id")
                if isinstance(result_thread, dict)
                else None
            )
            if (
                isinstance(result_thread_id, str)
                and result_thread_id
                and result_thread.get("sessionId") == result_thread_id
                and result_thread.get("parentThreadId") is None
            ):
                candidate_primary_thread = dict(result_thread)
                if isinstance(result, dict):
                    for key in ("model", "reasoningEffort"):
                        value = result.get(key)
                        if value is not None:
                            candidate_primary_thread[key] = value
                if self.client_version is not None:
                    candidate_primary_thread["clientVersion"] = (
                        self.client_version
                    )
                fresh_thread_start = _needs_fresh_primary_witness(
                    pending.method
                )
                primary_witness_only = (
                    fresh_thread_start and pending.gate is not None
                )
                # The successful response is ordered before the internal
                # origin fence. Mark that subscription cut now so a later
                # lifecycle event can be ordered against the response.
                root_lifecycle_epoch = (
                    self.relay.authority.connection_root_subscribed(
                        self.connection_id,
                        result_thread_id,
                        primary_witness_only=primary_witness_only,
                    )
                )
                if not fresh_thread_start:
                    # Keep the originating subscription alive while the
                    # companion synchronously subscribes its driver. This
                    # preserves the origin's lifecycle and audit prefix even
                    # when Codex's best-effort auto-attach missed fast events.
                    # A fresh thread has no resumable rollout until its first
                    # turn, so thread/start keeps the live primary stream as
                    # its witness instead.
                    def complete_origin_handoff():
                        # Fence every resumed root response. A lifecycle or
                        # audit event could have reached only the origin just
                        # before the driver attached.
                        buffered = self._driver_pin_origin_fence(
                            result_thread_id
                        )
                        observed = set()
                        for index, buffered_message in enumerate(buffered):
                            if (
                                isinstance(
                                    buffered_message.get("method"), str
                                )
                                and "id" not in buffered_message
                            ):
                                self._observe_upstream_notification(
                                    buffered_message
                                )
                                observed.add(index)
                        return buffered, observed

                    (
                        buffered_after_root,
                        preobserved_notifications,
                    ) = self.relay.pin_driver_thread(
                        result_thread_id,
                        self.connection_id,
                        root_lifecycle_epoch,
                        held_gate=pending.gate,
                        complete_origin_handoff=complete_origin_handoff,
                    )
        if pending.gate is not None:
            def observe_primary_before_release(
                committed_thread_id: Optional[str],
                active_turn_id: Optional[str],
            ) -> None:
                if (
                    candidate_primary_thread is None
                    or committed_thread_id
                    != candidate_primary_thread.get("id")
                    or self.relay.primary_thread_observer is None
                ):
                    return
                observed = dict(candidate_primary_thread)
                if isinstance(active_turn_id, str) and active_turn_id:
                    observed["activeTurnId"] = active_turn_id
                self.relay.primary_thread_observer(observed)

            self.relay.authority.finish_tui_request(
                pending.gate,
                message,
                before_release=observe_primary_before_release,
            )
        if (
            pending.method in ROOT_INVALIDATION_METHODS
            and "result" in message
        ):
            invalidated_thread_id = _thread_id_param(pending.params)
            if invalidated_thread_id is not None:
                self.relay.authority.connection_invalidation_succeeded(
                    self.connection_id,
                    pending.method,
                    invalidated_thread_id,
                )
        assert self.frontend is not None
        if not self.frontend.received_close:
            self.frontend.send_json_message(message)
        self._queue_buffered_upstream(
            buffered_after_root, preobserved_notifications
        )

    def _read_upstream(self) -> None:
        try:
            assert self.upstream is not None
            while not self.closed.is_set():
                message = self.upstream.read_json_message()
                if message is None:
                    raise AppServerTransportError(
                        "app-server closed the relayed WebSocket"
                    )
                with self.upstream_handoff_lock:
                    if self.upstream_stream_retired:
                        return
                    self._handle_upstream_message(message)
        except Exception as exc:
            if not self.closed.is_set():
                self._fatal_or_close(
                    "relayed app-server connection failed: {}".format(exc)
                )

    def run(self) -> None:
        frontend_closed_cleanly = False
        frontend_close_revoked_authority = False

        def frontend_closing(close_code: Optional[int]) -> None:
            nonlocal frontend_close_revoked_authority
            if not self._is_authoritative():
                return
            if close_code in (None, 1000, 1001):
                self.relay.authority.primary_closed_cleanly(
                    self.connection_id
                )
            else:
                self.relay.authority.primary_disconnected(
                    self.connection_id,
                    "primary TUI WebSocket closed with non-normal code {}"
                    .format(close_code),
                )
            frontend_close_revoked_authority = True

        try:
            self.frontend = FrontendWebSocket.accept(
                self.raw_socket, self.relay.request_timeout
            )
            self.upstream = self.relay.upstream_factory(
                self.relay.backend_socket
            )
            self.upstream.start_raw()
            self.gated_worker = threading.Thread(
                target=self._run_gated_queue,
                name="uclusion-codex-relay-gates-{}".format(
                    self.connection_id
                ),
                daemon=True,
            )
            self.gated_worker.start()
            self.upstream_reader = threading.Thread(
                target=self._read_upstream,
                name="uclusion-codex-relay-upstream-{}".format(
                    self.connection_id
                ),
                daemon=True,
            )
            self.upstream_reader.start()
            while not self.closed.is_set():
                message = self.frontend.read_json_message(frontend_closing)
                if message is None:
                    if (
                        not self.frontend.received_close
                        or self.frontend.received_close_code
                        not in (None, 1000, 1001)
                    ):
                        raise RelayProtocolError(
                            "TUI WebSocket closed with non-normal code {}"
                            .format(self.frontend.received_close_code)
                        )
                    frontend_closed_cleanly = True
                    break
                self._handle_frontend_message(message)
        except Exception as exc:
            if not self.closed.is_set():
                self._fatal_or_close(
                    "TUI relay connection failed: {}".format(exc)
                )
        finally:
            was_primary = self._is_authoritative()
            if was_primary:
                # Revoke delivery authority before closing sockets or
                # unregistering this connection. Otherwise the driver can
                # acquire a short-lived lease after the visible TUI is gone
                # and inject input that no live frontend can display.
                if frontend_closed_cleanly:
                    if not frontend_close_revoked_authority:
                        self.relay.authority.primary_closed_cleanly(
                            self.connection_id
                        )
                else:
                    self.relay.authority.primary_disconnected(
                        self.connection_id,
                        "primary TUI WebSocket disconnected",
                    )
            # Retire this notification stream. The companion driver's
            # independent app-server subscription keeps a resumable root
            # pinned across an auxiliary picker unsubscribe/close.
            self._retire_upstream_stream()
            self.close()
            self.relay.connection_closed(self.connection_id)
            if (
                was_primary
                and not frontend_closed_cleanly
                and not self.relay.stop_event.is_set()
                and self.relay.fatal_error is None
            ):
                self.relay.fail("primary TUI WebSocket disconnected")

    def fail(self) -> None:
        if self.closed.is_set():
            return
        if self.frontend is not None:
            self.frontend.close_with_error()
        self.close()

    def close(self) -> None:
        if self.closed.is_set():
            return
        self.closed.set()
        self.gated_queue.put(None)
        if self.frontend is not None:
            self.frontend.close()
        else:
            try:
                self.raw_socket.close()
            except OSError:
                pass
        if self.upstream is not None:
            self.upstream.close()


class UnixWebSocketRelay:
    """Protocol-aware frontend for a private app-server Unix socket."""

    def __init__(
        self,
        frontend_socket: str,
        backend_socket: str,
        authority: RootAuthority,
        upstream_factory: Callable[[str], AppServerClient] = AppServerClient,
        request_timeout: float = REQUEST_TIMEOUT_SECONDS,
    ):
        self.frontend_socket = os.path.abspath(
            os.path.expanduser(frontend_socket)
        )
        self.backend_socket = os.path.abspath(
            os.path.expanduser(backend_socket)
        )
        self.authority = authority
        self.upstream_factory = upstream_factory
        self.request_timeout = request_timeout
        self.listener: Optional[socket.socket] = None
        self.listener_identity: Optional[Tuple[int, int]] = None
        self.accept_thread: Optional[threading.Thread] = None
        self.stop_event = threading.Event()
        self.fatal_event = threading.Event()
        self.fatal_error: Optional[str] = None
        self.connections: Dict[int, _RelayConnection] = {}
        self.connections_lock = threading.Lock()
        self.next_connection_id = 1
        self.driver_thread_pinner: Optional[
            Callable[[str, int], None]
        ] = None
        self.driver_thread_fencer: Optional[Callable[[str], None]] = None
        self.token_audit_enabled = False
        self.primary_thread_observer: Optional[
            Callable[[Dict[str, Any]], None]
        ] = None
        self.primary_notification_observer: Optional[
            Callable[[Dict[str, Any]], None]
        ] = None

    def _drain_primary_audit_handoff(
        self,
        source_connection_id: int,
        thread_id: str,
        observer: Callable[[Dict[str, Any]], None],
    ) -> None:
        while True:
            batch, released = (
                self.authority.take_primary_audit_handoff_batch(
                    source_connection_id, thread_id
                )
            )
            for message in batch:
                observer(message)
            if released:
                return

    def pin_driver_thread(
        self,
        thread_id: str,
        source_connection_id: int,
        root_lifecycle_epoch: int,
        held_gate: Optional[RelayGate] = None,
        complete_origin_handoff: Optional[Callable[[], Any]] = None,
    ) -> Any:
        def abandoned_result() -> Any:
            if complete_origin_handoff is not None:
                return ([], set())
            return None

        def handoff_abandoned() -> bool:
            return self.authority.handoffs_abandoned_after_primary_close()

        audit_observer = self.primary_notification_observer
        audit_handoff_started = False
        try:
            try:
                with self.authority.driver_subscription_lease(held_gate):
                    if handoff_abandoned():
                        return abandoned_result()
                    if audit_observer is not None:
                        audit_handoff_started = (
                            self.authority.begin_primary_audit_handoff(
                                source_connection_id,
                                thread_id,
                                root_lifecycle_epoch,
                            )
                        )
                    if not self.authority.driver_thread_is_pinned(
                        thread_id
                    ):
                        if self.driver_thread_pinner is None:
                            raise RelayProtocolError(
                                "companion driver thread pinner is "
                                "unavailable"
                            )
                        self.driver_thread_pinner(
                            thread_id, root_lifecycle_epoch
                        )
                        if not self.authority.driver_thread_is_pinned(
                            thread_id
                        ):
                            raise RelayProtocolError(
                                "driver subscription was invalidated before "
                                "confirmation"
                            )
                    if handoff_abandoned():
                        return abandoned_result()
                    result = (
                        complete_origin_handoff()
                        if complete_origin_handoff is not None
                        else None
                    )
                    if handoff_abandoned():
                        return abandoned_result()
                    if self.driver_thread_fencer is None:
                        raise RelayProtocolError(
                            "companion driver thread fencer is unavailable"
                        )
                    self.driver_thread_fencer(thread_id)
                    if handoff_abandoned():
                        return abandoned_result()
                    if held_gate is not None:
                        self.authority.record_root_handoff_complete(
                            held_gate,
                            thread_id,
                            root_lifecycle_epoch,
                        )
                    if (
                        held_gate is None
                        and not self.authority.driver_thread_is_pinned(
                            thread_id
                        )
                    ):
                        raise RelayProtocolError(
                            "driver subscription was invalidated during "
                            "origin handoff"
                        )
                    return result
            finally:
                if audit_handoff_started and audit_observer is not None:
                    self._drain_primary_audit_handoff(
                        source_connection_id,
                        thread_id,
                        audit_observer,
                    )
        except Exception as exc:
            if handoff_abandoned():
                return abandoned_result()
            self.fail(
                "companion driver handoff failed for {}: {}".format(
                    thread_id, exc
                )
            )
            raise

    def start(self) -> None:
        if self.listener is not None:
            return
        try:
            existing = os.lstat(self.frontend_socket)
        except FileNotFoundError:
            existing = None
        if existing is not None:
            raise ConfigurationError(
                "frontend socket path already exists; refusing to replace it"
            )
        listener = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        try:
            listener.bind(self.frontend_socket)
            os.chmod(self.frontend_socket, 0o600)
            listener.listen(8)
            listener.settimeout(0.25)
        except Exception:
            listener.close()
            raise
        socket_stat = os.lstat(self.frontend_socket)
        self.listener_identity = (socket_stat.st_dev, socket_stat.st_ino)
        self.listener = listener
        self.accept_thread = threading.Thread(
            target=self._accept_loop,
            name="uclusion-codex-relay-accept",
            daemon=True,
        )
        self.accept_thread.start()

    def _accept_loop(self) -> None:
        try:
            while not self.stop_event.is_set():
                try:
                    raw_socket, _address = self.listener.accept()
                except socket.timeout:
                    continue
                except OSError:
                    if self.stop_event.is_set():
                        return
                    raise
                with self.connections_lock:
                    connection_id = self.next_connection_id
                    self.next_connection_id += 1
                    connection = _RelayConnection(
                        self, connection_id, raw_socket
                    )
                    self.connections[connection_id] = connection
                threading.Thread(
                    target=connection.run,
                    name="uclusion-codex-relay-tui-{}".format(
                        connection_id
                    ),
                    daemon=True,
                ).start()
        except Exception as exc:
            if not self.stop_event.is_set():
                self.fail("relay accept loop failed: {}".format(exc))

    def connection_closed(self, connection_id: int) -> None:
        with self.connections_lock:
            self.connections.pop(connection_id, None)

    def fail(self, reason: str) -> None:
        if self.fatal_error is None:
            self.fatal_error = reason
        self.authority.fail(reason)
        self.fatal_event.set()
        self.stop_event.set()
        listener = self.listener
        if listener is not None:
            try:
                listener.close()
            except OSError:
                pass
        with self.connections_lock:
            connections = list(self.connections.values())
        for connection in connections:
            connection.fail()

    def close(self) -> None:
        self.stop_event.set()
        listener = self.listener
        self.listener = None
        if listener is not None:
            try:
                listener.close()
            except OSError:
                pass
        with self.connections_lock:
            connections = list(self.connections.values())
        for connection in connections:
            connection.close()
        if (
            self.accept_thread is not None
            and self.accept_thread is not threading.current_thread()
        ):
            self.accept_thread.join(timeout=1)
        try:
            current = os.lstat(self.frontend_socket)
        except FileNotFoundError:
            current = None
        if (
            current is not None
            and stat.S_ISSOCK(current.st_mode)
            and self.listener_identity
            == (current.st_dev, current.st_ino)
        ):
            os.unlink(self.frontend_socket)


def _required_text(
    value: Optional[str], name: str, allow_path: bool = False
) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ConfigurationError("{} is required".format(name))
    result = value.strip()
    return (
        os.path.abspath(os.path.expanduser(result))
        if allow_path
        else result
    )


def config_from_args(
    args: argparse.Namespace, require_socket: bool
) -> BridgeConfig:
    environment = _required_text(
        args.environment or os.environ.get("UCLUSION_CODEX_BRIDGE_ENV"),
        "--environment / UCLUSION_CODEX_BRIDGE_ENV",
    )
    workspace_id = _required_text(
        args.workspace_id
        or os.environ.get("UCLUSION_CODEX_BRIDGE_WORKSPACE"),
        "--workspace-id / UCLUSION_CODEX_BRIDGE_WORKSPACE",
    )
    instance = _required_text(
        args.instance or os.environ.get("UCLUSION_CODEX_BRIDGE_INSTANCE"),
        "--instance / UCLUSION_CODEX_BRIDGE_INSTANCE",
    )
    cwd = _required_text(
        args.cwd
        or os.environ.get("UCLUSION_CODEX_BRIDGE_CWD")
        or os.getcwd(),
        "--cwd",
        allow_path=True,
    )
    socket_value = args.app_server_socket or os.environ.get(
        "UCLUSION_CODEX_APP_SERVER_SOCKET"
    )
    app_server_socket = None
    if socket_value:
        app_server_socket = _required_text(
            socket_value, "--app-server-socket", allow_path=True
        )
    elif require_socket:
        raise ConfigurationError("--app-server-socket is required for run")
    inbox_path = args.inbox_path or os.environ.get(
        "UCLUSION_CODEX_BRIDGE_INBOX"
    )
    ready_value = getattr(args, "ready_file", None) or os.environ.get(
        "UCLUSION_CODEX_BRIDGE_READY_FILE"
    )
    receiver_value = getattr(
        args, "receiver_pid_file", None
    ) or os.environ.get("UCLUSION_CODEX_RECEIVER_PID_FILE")
    frontend_value = getattr(
        args, "frontend_socket", None
    ) or os.environ.get("UCLUSION_CODEX_FRONTEND_SOCKET")
    token_audit_ready_value = getattr(
        args, "token_audit_ready_file", None
    ) or os.environ.get("UCLUSION_CODEX_TOKEN_AUDIT_READY_FILE")
    ready_file = None
    receiver_pid_file = None
    frontend_socket = None
    token_audit_ready_file = None
    if ready_value:
        ready_file = _required_text(
            ready_value, "--ready-file", allow_path=True
        )
    elif require_socket:
        raise ConfigurationError("--ready-file is required for run")
    if receiver_value:
        receiver_pid_file = _required_text(
            receiver_value, "--receiver-pid-file", allow_path=True
        )
    elif require_socket:
        raise ConfigurationError("--receiver-pid-file is required for run")
    if frontend_value:
        frontend_socket = _required_text(
            frontend_value, "--frontend-socket", allow_path=True
        )
    elif require_socket:
        raise ConfigurationError("--frontend-socket is required for run")
    token_audit_enabled = bool(getattr(args, "token_audit", False))
    if token_audit_ready_value:
        token_audit_ready_file = _required_text(
            token_audit_ready_value,
            "--token-audit-ready-file",
            allow_path=True,
        )
    elif token_audit_enabled and require_socket:
        raise ConfigurationError(
            "--token-audit-ready-file is required with --token-audit"
        )
    return BridgeConfig(
        environment=environment,
        workspace_id=workspace_id,
        instance=instance,
        cwd=cwd,
        app_server_socket=app_server_socket,
        inbox_path=inbox_path,
        ready_file=ready_file,
        receiver_pid_file=receiver_pid_file,
        frontend_socket=frontend_socket,
        token_audit=token_audit_enabled,
        token_audit_ready_file=token_audit_ready_file,
    )


def _install_signal_handlers(stop_event: threading.Event) -> Dict[int, Any]:
    previous: Dict[int, Any] = {}

    def stop(_signum: int, _frame: Any) -> None:
        stop_event.set()

    if threading.current_thread() is threading.main_thread():
        for signum in (signal.SIGINT, signal.SIGTERM):
            previous[signum] = signal.getsignal(signum)
            signal.signal(signum, stop)
    return previous


def _restore_signal_handlers(previous: Dict[int, Any]) -> None:
    for signum, handler in previous.items():
        signal.signal(signum, handler)


def default_update_notice_source(environment: str) -> Optional[str]:
    """Reuse the CLI's rate-limited update watcher when installed beside us."""
    for module_name in ("uclusion", "uclusionCLI"):
        try:
            module = importlib.import_module(module_name)
            checker = getattr(module, "check_wait_update_notice")
            notice = checker(environment)
            return notice if isinstance(notice, str) and notice else None
        except (ImportError, AttributeError):
            continue
        except Exception:
            # Update checks are advisory and must never break Poke delivery.
            return None
    return None


class UpdateNoticeWorker:
    """Run the advisory network update check off the delivery heartbeat."""

    def __init__(
        self,
        environment: str,
        source: Callable[[str], Optional[str]],
        interval: float = UPDATE_CHECK_INTERVAL_SECONDS,
        result_sink: Optional[Callable[[str], None]] = None,
    ):
        self.environment = environment
        self.source = source
        self.interval = interval
        self.result_sink = result_sink
        self.results: "queue.Queue[str]" = queue.Queue()
        self.stop_event = threading.Event()
        self.enabled_event = threading.Event()
        self.thread = threading.Thread(
            target=self._run,
            name="uclusion-update-notice-check",
            daemon=True,
        )

    def start(self) -> None:
        self.thread.start()

    def set_enabled(self, enabled: bool) -> None:
        if enabled:
            self.enabled_event.set()
        else:
            self.enabled_event.clear()

    def _run(self) -> None:
        next_check_at = 0.0
        while not self.stop_event.is_set():
            if not self.enabled_event.is_set():
                if self.stop_event.wait(POLL_INTERVAL_SECONDS):
                    return
                continue
            remaining = next_check_at - time.monotonic()
            if remaining > 0:
                if self.stop_event.wait(
                    min(POLL_INTERVAL_SECONDS, remaining)
                ):
                    return
                continue
            # Recheck immediately before the side-effectful source: the CLI
            # records a release as notified before returning its message.
            if not self.enabled_event.is_set():
                continue
            try:
                notice = self.source(self.environment)
            except Exception:
                notice = None
            if isinstance(notice, str) and notice:
                if self.result_sink is None:
                    self.results.put(notice)
                else:
                    try:
                        # Persist on the worker before a later trust
                        # revocation can strand a side-effectfully claimed
                        # notice in this process's memory.
                        self.result_sink(notice)
                    except Exception:
                        self.results.put(notice)
            next_check_at = time.monotonic() + self.interval

    def drain(self) -> Iterable[str]:
        while True:
            try:
                yield self.results.get_nowait()
            except queue.Empty:
                return

    def close(self) -> None:
        self.stop_event.set()
        # A legacy urlopen can remain blocked indefinitely.  This thread is
        # intentionally daemonized, so clean bridge shutdown never waits on
        # the advisory checker.
        self.thread.join(timeout=0.1)


class _CodexTokenAuditIntegration:
    """Failure-isolated adapter for the optional token audit module."""

    def __init__(self, observer: Any):
        self.observer = observer
        self.reported_errors = set()
        self.usable = True

    def _report(self, operation: str, error: Exception) -> None:
        message = "{}: {}".format(operation, error)
        if message in self.reported_errors:
            return
        self.reported_errors.add(message)
        print(
            "Uclusion Codex token audit degraded: {}".format(message),
            file=sys.stderr,
            flush=True,
        )

    def mark_partial(self, reason: str) -> bool:
        try:
            self.observer.mark_partial(reason)
            return True
        except Exception as exc:
            self._report("mark_partial failed", exc)
            self.usable = False
            self.revoke_ready()
            return False

    def mark_ready(self) -> bool:
        if not self.usable:
            return False
        try:
            return bool(self.observer.mark_ready())
        except Exception as exc:
            self._report("collector readiness failed", exc)
            self.revoke_ready()
            return False

    def refresh_ready(self) -> bool:
        if not self.usable:
            return False
        try:
            return bool(self.observer.refresh_ready())
        except Exception as exc:
            self._report("collector heartbeat failed", exc)
            self.revoke_ready()
            return False

    def revoke_ready(self) -> None:
        try:
            self.observer.revoke_ready()
        except Exception as exc:
            self._report("collector readiness revoke failed", exc)

    def observe_notification(self, message: Dict[str, Any]) -> None:
        try:
            self.observer.observe_notification(message)
        except Exception as exc:
            self._report("observe_notification failed", exc)
            self.mark_partial(
                "Codex driver notification could not be audited: {}"
                .format(exc)
            )

    def set_primary_thread(self, thread: Dict[str, Any]) -> None:
        try:
            self.observer.set_primary_thread(thread)
        except Exception as exc:
            self._report("set_primary_thread failed", exc)
            self.mark_partial(
                "Codex primary thread could not be recorded: {}".format(
                    exc
                )
            )

    def drain_descendant_thread_ids(self) -> Tuple[str, ...]:
        try:
            thread_ids = self.observer.drain_descendant_thread_ids()
            if thread_ids is None:
                return ()
            if isinstance(thread_ids, str):
                raise TypeError("descendant thread ids must be an iterable")
            result = tuple(thread_ids)
            if any(
                not isinstance(thread_id, str) or not thread_id
                for thread_id in result
            ):
                raise TypeError(
                    "descendant thread ids must be non-empty strings"
                )
            return result
        except Exception as exc:
            self._report("drain_descendant_thread_ids failed", exc)
            self.mark_partial(
                "Codex descendant subscriptions could not be audited: {}"
                .format(exc)
            )
            return ()

    def close(self) -> None:
        try:
            self.observer.close()
        except Exception as exc:
            self._report("close failed", exc)
        finally:
            self.revoke_ready()


def _load_codex_token_audit(
    config: BridgeConfig,
) -> Optional[_CodexTokenAuditIntegration]:
    if not config.token_audit:
        return None
    try:
        module = importlib.import_module("uclusionTokenAudit")
        audit_type = getattr(module, "CodexTokenAudit")
        observer = audit_type(
            config.environment,
            config.workspace_id,
            client_version=None,
            ready_file=config.token_audit_ready_file,
            ready_owner=config.instance,
        )
        return _CodexTokenAuditIntegration(observer)
    except Exception as exc:
        print(
            "Uclusion Codex token audit is unavailable: {}".format(exc),
            file=sys.stderr,
            flush=True,
        )
        return None


def run_bridge(
    config: BridgeConfig,
    poll_interval: float = POLL_INTERVAL_SECONDS,
    stop_event: Optional[threading.Event] = None,
    client_factory: Callable[[str], AppServerClient] = AppServerClient,
    relay_factory: Callable[
        [str, str, RootAuthority], UnixWebSocketRelay
    ] = UnixWebSocketRelay,
    update_notice_source: Callable[[str], Optional[str]] = (
        default_update_notice_source
    ),
    update_check_interval: float = UPDATE_CHECK_INTERVAL_SECONDS,
    deliver_existing_pokes: bool = False,
    control_client_factory: Optional[
        Callable[[str], AppServerClient]
    ] = None,
    **_legacy_options: Any,
) -> int:
    """Run the relay-owned bridge.

    Root authority comes only from the correlated primary TUI connection.
    Hooks, broadcasts, loaded-thread lists, and persisted bindings are never
    consulted by this path. Each launch atomically skips Pokes that predate
    its startup cutoff unless the human explicitly requested backlog delivery.
    """
    # Compatibility for callers of the former internal boolean. The public
    # launcher also accepts its old flag as a hidden no-op, while the new
    # positive option is the only documented surface.
    if "ignore_existing_pokes" in _legacy_options:
        legacy_ignore = bool(_legacy_options["ignore_existing_pokes"])
        if deliver_existing_pokes and legacy_ignore:
            raise ConfigurationError(
                "cannot both deliver and ignore existing Pokes"
            )
        deliver_existing_pokes = not legacy_ignore

    if not config.app_server_socket:
        raise ConfigurationError("run requires an app-server socket")
    if not config.frontend_socket:
        raise ConfigurationError("run requires a frontend socket")
    if not config.ready_file:
        raise ConfigurationError("run requires a ready file")
    if not config.receiver_pid_file:
        raise ConfigurationError("run requires a receiver pid file")

    store = InboxStore(config.resolved_inbox_path())
    pid = os.getpid()
    parent_pid = os.getppid()
    if parent_pid <= 1:
        return EXIT_OK
    if not store.acquire_primary(config, pid):
        return EXIT_PRIMARY_HELD

    stopping = stop_event or threading.Event()
    previous_handlers = _install_signal_handlers(stopping)
    token_audit = _load_codex_token_audit(config)
    if token_audit is not None:
        # Publish before app-server/MCP initialization can cache tools/list.
        # The launcher still withholds the TUI until the driver and relay are
        # ready, while a failed observer leaves this marker absent.
        token_audit.mark_ready()
    authority = RootAuthority(config.cwd, enforce_root_handoff=True)
    relay = relay_factory(
        config.frontend_socket,
        config.app_server_socket,
        authority,
    )
    # Only request experimental raw events when the observer actually loaded.
    # Configuration alone is not enough: an import/schema failure must degrade
    # the feature without changing the TUI/app-server protocol.
    relay.token_audit_enabled = token_audit is not None
    relay.primary_thread_observer = (
        token_audit.set_primary_thread
        if token_audit is not None
        else None
    )
    relay.primary_notification_observer = (
        token_audit.observe_notification
        if token_audit is not None
        else None
    )
    # The driver is the continuous lifecycle and token-audit witness for
    # resumable roots. Delivery/control RPCs use a separate disposable
    # connection so a slow or failed request can be retried without
    # pretending that the witness itself disconnected.
    driver_client: Optional[AppServerClient] = None
    control_client: Optional[AppServerClient] = None
    control_factory = control_client_factory or client_factory
    update_worker: Optional[UpdateNoticeWorker] = None
    ready_published = False
    last_error: Optional[str] = None
    pending_poke_wait_prefix = (
        "Uclusion Codex bridge waiting to deliver a pending Poke: "
    )
    deferred_steer_turn_id: Optional[str] = None
    next_driver_connection_id = INITIAL_DRIVER_CONNECTION_ID
    audit_subscribed_thread_ids = set()

    def receiver_live() -> bool:
        return (
            os.getppid() == parent_pid
            and receiver_is_alive(
                config.receiver_pid_file, config.instance
            )
        )

    try:
        if not deliver_existing_pokes:
            store.ignore_existing_pokes(config)
        while not stopping.is_set():
            if os.getppid() != parent_pid:
                return EXIT_OK
            if relay.fatal_event.is_set() or authority.fatal_error is not None:
                reason = relay.fatal_error or authority.fatal_error
                if reason:
                    print(
                        "Uclusion Codex relay failed closed: {}".format(
                            reason
                        ),
                        file=sys.stderr,
                        flush=True,
                    )
                return EXIT_RELAY_FAILED
            try:
                owns_primary = store.refresh_primary(config, pid)
            except sqlite3.Error as exc:
                message = "Uclusion Codex bridge database retry: {}".format(
                    exc
                )
                if message != last_error:
                    print(message, file=sys.stderr, flush=True)
                    last_error = message
                stopping.wait(max(1.0, poll_interval))
                continue
            if not owns_primary:
                return EXIT_PRIMARY_HELD
            if token_audit is not None:
                token_audit.refresh_ready()

            if driver_client is None:
                try:
                    driver_connection_id = next_driver_connection_id
                    next_driver_connection_id -= 1
                    driver_client = client_factory(
                        config.app_server_socket
                    )

                    def observe_driver_notification(
                        message: Dict[str, Any],
                        connection_id: int = driver_connection_id,
                    ) -> None:
                        authority.observe_notification(
                            connection_id, message
                        )
                        if (
                            token_audit is not None
                            and not authority.buffer_driver_audit_notification(
                                connection_id, message
                            )
                        ):
                            token_audit.observe_notification(message)

                    def driver_disconnected(
                        connection_id: int = driver_connection_id,
                    ) -> None:
                        authority.driver_disconnected(connection_id)
                        if token_audit is not None:
                            token_audit.mark_partial(
                                "Codex audit driver disconnected"
                            )

                    driver_client.notification_handler = (
                        observe_driver_notification
                    )
                    driver_client.disconnect_handler = driver_disconnected
                    driver_client.start()
                    # Register the witness atomically with the reader-failure
                    # check. An EOF before this point is a retryable
                    # pre-frontend initialization failure; an EOF after
                    # registration invokes driver_disconnected and fails the
                    # live bridge closed.
                    with driver_client.response_lock:
                        if driver_client.reader_failure is not None:
                            raise driver_client.reader_failure
                        authority.driver_connected(driver_connection_id)
                    registered_driver = driver_client

                    def pin_driver_thread(
                        thread_id: str, lifecycle_epoch: int
                    ) -> None:
                        registered_driver.subscribe_thread(
                            thread_id,
                            lambda: authority.driver_thread_pinned(
                                thread_id, lifecycle_epoch
                            ),
                        )

                    relay.driver_thread_pinner = pin_driver_thread
                    relay.driver_thread_fencer = (
                        registered_driver.fence_thread
                    )
                    audit_subscribed_thread_ids.clear()
                    last_error = None
                except (BridgeError, OSError) as exc:
                    message = "Uclusion Codex bridge: {}".format(exc)
                    if message != last_error:
                        print(message, file=sys.stderr, flush=True)
                        last_error = message
                    if driver_client is not None:
                        driver_client.close()
                        driver_client = None
                    relay.driver_thread_pinner = None
                    relay.driver_thread_fencer = None
                    # Failure before the frontend is bound is retryable.
                    if relay.listener is not None:
                        relay.fail(
                            "driver initialization failed after relay ready: "
                            + str(exc)
                        )
                    stopping.wait(max(1.0, poll_interval))
                    continue

            if stopping.is_set():
                continue

            if control_client is None:
                try:
                    control_client = control_factory(
                        config.app_server_socket
                    )
                    control_client.start()
                    last_error = None
                except (BridgeError, OSError) as exc:
                    message = (
                        "Uclusion Codex bridge control retry: {}"
                        .format(exc)
                    )
                    if message != last_error:
                        print(message, file=sys.stderr, flush=True)
                        last_error = message
                    if control_client is not None:
                        control_client.close()
                        control_client = None
                    stopping.wait(max(1.0, poll_interval))
                    continue

            # The witness reader remains live while the disposable control
            # connection initializes. Do not publish a frontend if that
            # continuous witness failed during the initialization window.
            if authority.fatal_error is not None:
                continue

            try:
                if relay.listener is None:
                    relay.start()
                if not ready_published:
                    _write_private_marker(
                        config.ready_file, config.instance
                    )
                    ready_published = True
                if update_worker is None:
                    update_worker = UpdateNoticeWorker(
                        config.environment,
                        update_notice_source,
                        interval=update_check_interval,
                        result_sink=lambda notice: (
                            store.enqueue_update_notice(config, notice)
                        ),
                    )
                    update_worker.set_enabled(True)
                    update_worker.start()
            except (BridgeError, OSError) as exc:
                relay.fail("bridge startup failed: {}".format(exc))
                continue

            if token_audit is not None:
                assert driver_client is not None
                for thread_id in (
                    token_audit.drain_descendant_thread_ids()
                ):
                    if thread_id in audit_subscribed_thread_ids:
                        continue
                    try:
                        driver_client.subscribe_thread(
                            thread_id, lambda: None
                        )
                    except Exception as exc:
                        token_audit.mark_partial(
                            "Codex descendant {} could not be subscribed: {}"
                            .format(thread_id, exc)
                        )
                        continue
                    audit_subscribed_thread_ids.add(thread_id)

            if update_worker is not None:
                for notice in update_worker.drain():
                    try:
                        store.enqueue_update_notice(config, notice)
                    except Exception as exc:
                        update_worker.results.put(notice)
                        message = (
                            "Uclusion Codex bridge update retry: {}".format(
                                exc
                            )
                        )
                        if message != last_error:
                            print(message, file=sys.stderr, flush=True)
                            last_error = message
                        break

            assert control_client is not None
            with authority.delivery_lease(receiver_live) as lease:
                if lease.snapshot is None:
                    assert lease.blocked_by is not None
                    try:
                        pending_poke = store.has_pending_poke(config)
                    except sqlite3.Error as exc:
                        message = (
                            "Uclusion Codex bridge database retry: {}"
                            .format(exc)
                        )
                        if message != last_error:
                            print(message, file=sys.stderr, flush=True)
                            last_error = message
                    else:
                        if pending_poke:
                            message = (
                                pending_poke_wait_prefix + lease.blocked_by
                            )
                            if message != last_error:
                                print(
                                    message, file=sys.stderr, flush=True
                                )
                                last_error = message
                        elif (
                            last_error is not None
                            and last_error.startswith(
                                pending_poke_wait_prefix
                            )
                        ):
                            last_error = None
                    stopping.wait(poll_interval)
                    continue
                snapshot = lease.snapshot
                engine = BridgeEngine(
                    store,
                    control_client,
                    config,
                    may_deliver=lambda: (
                        receiver_live()
                        and authority.snapshot_is_current(snapshot)
                    ),
                    commit_if_deliverable=lambda commit: (
                        authority.commit_if_current(
                            snapshot, receiver_live, commit
                        )
                    ),
                    deferred_steer_turn_id=deferred_steer_turn_id,
                    observed_turn_id=(
                        authority.observed_user_message_turn
                    ),
                )
                try:
                    result = engine.step(snapshot)
                except (sqlite3.Error, BridgeError) as exc:
                    result = StepResult(
                        "retry", error=str(exc)
                    )
            if result.action == "nonsteerable":
                deferred_steer_turn_id = result.turn_id
            if result.reconnect:
                control_client.close()
                control_client = None
            if result.error:
                message = "Uclusion Codex bridge: {}".format(result.error)
                if message != last_error:
                    print(message, file=sys.stderr, flush=True)
                    last_error = message
            elif result.action not in ("transport_error", "unhealthy"):
                last_error = None
            stopping.wait(poll_interval)
        return EXIT_OK
    finally:
        relay.close()
        if update_worker is not None:
            update_worker.close()
        if control_client is not None:
            control_client.close()
        if driver_client is not None:
            driver_client.close()
        if token_audit is not None:
            token_audit.close()
        try:
            store.release_primary(config, pid)
        except sqlite3.Error as exc:
            print(
                "Uclusion Codex bridge could not release its primary "
                "record: {}".format(exc),
                file=sys.stderr,
                flush=True,
            )
        _restore_signal_handlers(previous_handlers)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Bridge Uclusion Pokes into the input-owning Codex thread."
        )
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    def add_identity_options(subparser: argparse.ArgumentParser) -> None:
        subparser.add_argument("--environment")
        subparser.add_argument("--workspace-id")
        subparser.add_argument("--instance")
        subparser.add_argument("--cwd")
        subparser.add_argument("--app-server-socket")
        subparser.add_argument("--frontend-socket")
        subparser.add_argument("--inbox-path", help=argparse.SUPPRESS)

    run_parser = subparsers.add_parser("run")
    add_identity_options(run_parser)
    run_parser.add_argument("--ready-file")
    run_parser.add_argument("--receiver-pid-file")
    run_parser.add_argument(
        "--token-audit",
        action="store_true",
        help=argparse.SUPPRESS,
    )
    run_parser.add_argument(
        "--token-audit-ready-file",
        help=argparse.SUPPRESS,
    )
    backlog_group = run_parser.add_mutually_exclusive_group()
    backlog_group.add_argument(
        "--deliver-existing-pokes",
        action="store_true",
        help=argparse.SUPPRESS,
    )
    backlog_group.add_argument(
        "--ignore-existing-pokes",
        action="store_true",
        help=argparse.SUPPRESS,
    )
    run_parser.add_argument(
        "--poll-interval",
        type=float,
        default=POLL_INTERVAL_SECONDS,
        help=argparse.SUPPRESS,
    )
    return parser


def main(argv: Optional[Sequence[str]] = None) -> int:
    effective_argv = list(sys.argv[1:] if argv is None else argv)
    if (
        effective_argv
        and effective_argv[0] in ("register", "promote", "unregister")
    ):
        # Compatibility for stale globally installed Codex hooks. Relay
        # sessions never consume hook payloads or let hooks write authority.
        return EXIT_OK
    parser = build_parser()
    args = parser.parse_args(effective_argv)
    try:
        config = config_from_args(args, require_socket=True)
        if args.poll_interval <= 0:
            raise ConfigurationError("--poll-interval must be positive")
        return run_bridge(
            config,
            poll_interval=args.poll_interval,
            deliver_existing_pokes=args.deliver_existing_pokes,
        )
    except (ConfigurationError, sqlite3.Error) as exc:
        print(
            "Uclusion Codex bridge: {}".format(exc),
            file=sys.stderr,
            flush=True,
        )
        return EXIT_CONFIG


if __name__ == "__main__":
    raise SystemExit(main())
