"""Durable workspace-wide update notices, separate from Poke consumers."""
import dataclasses
import hashlib
import os
import sqlite3
import time
from contextlib import closing
from typing import Any, Optional


class UpdateNoticeError(Exception):
    pass


@dataclasses.dataclass(frozen=True)
class UpdateNotice:
    notice_id: str
    message: str
    thread_id: str
    state: str
    turn_id: Optional[str]
    attempt_instance: Optional[str]
    attempt_count: int


class UpdateNoticeStore:
    def __init__(self, connect):
        self._connect = connect
        self.clock = time.time
        self.pid_is_alive = self._pid_is_alive
        with closing(self.connect()) as connection:
            connection.execute('BEGIN IMMEDIATE')
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

    def connect(self):
        connection = self._connect()
        connection.row_factory = sqlite3.Row
        return connection

    @staticmethod
    def _pid_is_alive(pid):
        if pid <= 0:
            return False
        try:
            os.kill(pid, 0)
        except ProcessLookupError:
            return False
        except PermissionError:
            return True
        return True

    def enqueue_update_notice(
        self, config: Any, message: str
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
        self, config: Any, state: str
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
        self, config: Any
    ) -> Optional[UpdateNotice]:
        return self._get_update_notice(config, "sending")

    def get_pending_update_notice(
        self, config: Any
    ) -> Optional[UpdateNotice]:
        return self._get_update_notice(config, "pending")

    def begin_update_notice(
        self,
        config: Any,
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
            raise UpdateNoticeError("update notice disappeared before delivery")
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
        config: Any,
        notice_id: str,
        turn_id: Optional[str],
    ) -> None:
        """Persist a provisional turn/start target without accepting it."""
        if turn_id is not None and (
            not isinstance(turn_id, str) or not turn_id
        ):
            raise UpdateNoticeError("invalid update notice turn id")
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
                raise UpdateNoticeError(
                    "cannot record a non-sending update notice attempt"
                )
            connection.commit()

    def mark_update_notice_pending(
        self, config: Any, notice_id: str, error: str
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
        self, config: Any, notice_id: str, turn_id: Optional[str]
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
        self, config: Any, notice_id: str
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

    def acquire_update_notice_leader(
        self, config: Any, pid: int
    ) -> bool:
        """Elect one live bridge to handle workspace-global notices."""
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
                # live process. A blocked old leader could wake after a
                # time-based takeover and race the replacement into duplicate
                # update-notice turn/start calls. POSIX pid liveness is the
                # fail-closed boundary; normal exits remove their own row.
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

    def refresh_update_notice_leader(
        self, config: Any, pid: int
    ) -> bool:
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

    def release_update_notice_leader(
        self, config: Any, pid: int
    ) -> None:
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
