import base64
import hashlib
import json
import os
import queue
import socket
import struct
import sys
import tempfile
import threading
import time
import unittest
from pathlib import Path


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS_DIR))

import uclusionCodexBridge as bridge


def root_result(thread_id, cwd="/workspace/project"):
    return {
        "thread": {
            "id": thread_id,
            "sessionId": thread_id,
            "parentThreadId": None,
            "cwd": cwd,
        },
        "cwd": cwd,
    }


def wait_for(predicate, message, timeout=2.0):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        value = predicate()
        if value:
            return value
        time.sleep(0.005)
    raise AssertionError(message)


class RootAuthorityTests(unittest.TestCase):
    def setUp(self):
        self.authority = bridge.RootAuthority("/workspace/project")
        self.assertTrue(self.authority.claim_primary(1))

    def establish(self, thread_id="root-a"):
        gate = self.authority.begin_tui_request(
            1, "thread/start", {"cwd": "/workspace/project"}
        )
        self.authority.finish_tui_request(
            gate, {"id": 1, "result": root_result(thread_id)}
        )
        return self.authority.current_snapshot()

    def test_driver_lease_linearizes_before_root_switch(self):
        original = self.establish()
        acquired = threading.Event()
        holder = {}

        with self.authority.delivery_lease(lambda: True) as leased:
            self.assertEqual(original, leased)

            def switch():
                holder["gate"] = self.authority.begin_tui_request(
                    1, "thread/start", {"cwd": "/workspace/project"}
                )
                acquired.set()

            worker = threading.Thread(target=switch)
            worker.start()
            with self.authority.condition:
                wait_for(
                    lambda: self.authority.tui_waiters == 1,
                    "root switch did not wait behind driver",
                )
            self.assertFalse(acquired.is_set())

        self.assertTrue(acquired.wait(1))
        self.authority.finish_tui_request(
            holder["gate"], {"id": 2, "result": root_result("root-b")}
        )
        worker.join(1)
        switched = self.authority.current_snapshot()
        self.assertEqual("root-b", switched.thread_id)
        self.assertEqual(original.generation + 1, switched.generation)

    def test_root_request_wins_before_driver_peek(self):
        self.establish()
        gate = self.authority.begin_tui_request(
            1, "thread/resume", {"threadId": "root-b"}
        )
        with self.authority.delivery_lease(lambda: True) as snapshot:
            self.assertIsNone(snapshot)
        self.authority.finish_tui_request(
            gate, {"id": "resume", "result": root_result("root-b")}
        )
        with self.authority.delivery_lease(lambda: True) as snapshot:
            self.assertEqual("root-b", snapshot.thread_id)

    def test_reserved_fifo_work_blocks_driver_before_worker_admission(self):
        self.establish()
        self.authority.reserve_primary_work(1)
        with self.authority.delivery_lease(lambda: True) as snapshot:
            self.assertIsNone(snapshot)
        self.authority.release_primary_work(1)
        with self.authority.delivery_lease(lambda: True) as snapshot:
            self.assertEqual("root-a", snapshot.thread_id)

    def test_primary_turn_notifications_track_active_turn(self):
        self.establish()

        self.authority.observe_notification(
            1,
            {
                "method": "turn/started",
                "params": {
                    "threadId": "root-a",
                    "turn": {"id": "turn-a", "status": "inProgress"},
                },
            },
        )

        self.assertEqual(
            "turn-a", self.authority.current_snapshot().active_turn_id
        )
        self.authority.observe_notification(
            1,
            {
                "method": "turn/completed",
                "params": {
                    "threadId": "root-a",
                    "turn": {"id": "turn-other", "status": "completed"},
                },
            },
        )
        self.assertEqual(
            "turn-a", self.authority.current_snapshot().active_turn_id
        )
        self.authority.observe_notification(
            1,
            {
                "method": "turn/completed",
                "params": {
                    "threadId": "root-a",
                    "turn": {"id": "turn-a", "status": "completed"},
                },
            },
        )
        self.assertIsNone(
            self.authority.current_snapshot().active_turn_id
        )

    def test_auxiliary_thread_notifications_do_not_retarget_active_turn(self):
        self.establish()

        self.authority.observe_notification(
            1,
            {
                "method": "turn/started",
                "params": {
                    "threadId": "side-agent",
                    "turn": {
                        "id": "turn-side",
                        "status": "inProgress",
                    },
                },
            },
        )

        snapshot = self.authority.current_snapshot()
        self.assertEqual("root-a", snapshot.thread_id)
        self.assertIsNone(snapshot.active_turn_id)

    def test_completed_user_message_records_durable_correlation(self):
        self.establish()

        # Starting the item is not the TUI's commit/retirement boundary.
        self.authority.observe_notification(
            1,
            {
                "method": "item/started",
                "params": {
                    "threadId": "root-a",
                    "turnId": "turn-a",
                    "startedAtMs": 1,
                    "item": {
                        "type": "userMessage",
                        "id": "item-a",
                        "clientId": "poke-message-1",
                        "content": [
                            {
                                "type": "text",
                                "text": "Start T-all-2420",
                            }
                        ],
                    },
                },
            },
        )
        self.assertIsNone(
            self.authority.observed_user_message_turn(
                "root-a", "poke-message-1"
            )
        )

        self.authority.observe_notification(
            1,
            {
                "method": "item/completed",
                "params": {
                    "threadId": "root-a",
                    "turnId": "turn-a",
                    "item": {
                        "type": "userMessage",
                        "id": "item-a",
                        "clientId": "poke-message-1",
                        "content": [
                            {
                                "type": "text",
                                "text": "Start T-all-2420",
                            }
                        ],
                    },
                },
            },
        )
        self.assertEqual(
            "turn-a",
            self.authority.observed_user_message_turn(
                "root-a", "poke-message-1"
            ),
        )
        self.assertIsNone(
            self.authority.observed_user_message_turn(
                "root-other", "poke-message-1"
            )
        )

    def test_resume_and_human_admission_seed_active_turn_before_release(self):
        self.establish()
        resume = self.authority.begin_tui_request(
            1, "thread/resume", {"threadId": "root-b"}
        )
        resumed = root_result("root-b")
        resumed["thread"]["turns"] = [
            {
                "id": "turn-resumed",
                "status": "inProgress",
                "items": [],
            }
        ]
        self.authority.finish_tui_request(
            resume, {"id": 2, "result": resumed}
        )
        self.assertEqual(
            "turn-resumed",
            self.authority.current_snapshot().active_turn_id,
        )

        self.authority.observe_notification(
            1,
            {
                "method": "turn/completed",
                "params": {
                    "threadId": "root-b",
                    "turn": {
                        "id": "turn-resumed",
                        "status": "completed",
                    },
                },
            },
        )
        admission = self.authority.begin_tui_request(
            1, "turn/start", {"threadId": "root-b", "input": []}
        )
        self.authority.finish_tui_request(
            admission,
            {
                "id": 3,
                "result": {
                    "turn": {
                        "id": "turn-human",
                        "status": "inProgress",
                        "items": [],
                    }
                },
            },
        )
        self.assertEqual(
            "turn-human",
            self.authority.current_snapshot().active_turn_id,
        )
        self.assertTrue(
            self.authority.current_snapshot().admission_pending
        )

        self.authority.observe_notification(
            1,
            {
                "method": "turn/started",
                "params": {
                    "threadId": "root-b",
                    "turn": {
                        "id": "turn-human",
                        "status": "inProgress",
                    },
                },
            },
        )
        self.assertFalse(
            self.authority.current_snapshot().admission_pending
        )

    def test_review_and_compact_response_preserve_admission_gap(self):
        self.establish()
        review = self.authority.begin_tui_request(
            1, "review/start", {"threadId": "root-a"}
        )
        self.authority.finish_tui_request(
            review,
            {
                "id": 2,
                "result": {
                    "reviewThreadId": "root-a",
                    "turn": {
                        "id": "turn-review",
                        "status": "inProgress",
                        "items": [],
                    },
                },
            },
        )
        snapshot = self.authority.current_snapshot()
        self.assertEqual("turn-review", snapshot.active_turn_id)
        self.assertTrue(snapshot.admission_pending)

        self.authority.observe_notification(
            1,
            {
                "method": "turn/started",
                "params": {
                    "threadId": "root-a",
                    "turn": {
                        "id": "turn-review",
                        "status": "inProgress",
                    },
                },
            },
        )
        self.assertFalse(
            self.authority.current_snapshot().admission_pending
        )
        self.authority.observe_notification(
            1,
            {
                "method": "turn/completed",
                "params": {
                    "threadId": "root-a",
                    "turn": {
                        "id": "turn-review",
                        "status": "completed",
                    },
                },
            },
        )

        compact = self.authority.begin_tui_request(
            1, "thread/compact/start", {"threadId": "root-a"}
        )
        self.authority.finish_tui_request(
            compact, {"id": 3, "result": {}}
        )
        snapshot = self.authority.current_snapshot()
        self.assertIsNone(snapshot.active_turn_id)
        self.assertTrue(snapshot.admission_pending)
        with self.authority.delivery_lease(lambda: True) as leased:
            self.assertTrue(leased.admission_pending)

        self.authority.observe_notification(
            1,
            {
                "method": "turn/started",
                "params": {
                    "threadId": "root-a",
                    "turn": {
                        "id": "turn-compact",
                        "status": "inProgress",
                    },
                },
            },
        )
        snapshot = self.authority.current_snapshot()
        self.assertEqual("turn-compact", snapshot.active_turn_id)
        self.assertFalse(snapshot.admission_pending)

    def test_active_shell_command_does_not_leave_provisional_barrier(self):
        self.establish()
        self.authority.observe_notification(
            1,
            {
                "method": "turn/started",
                "params": {
                    "threadId": "root-a",
                    "turn": {
                        "id": "turn-regular",
                        "status": "inProgress",
                    },
                },
            },
        )
        shell = self.authority.begin_tui_request(
            1,
            "thread/shellCommand",
            {"threadId": "root-a", "command": "pwd"},
        )
        self.authority.finish_tui_request(
            shell, {"id": 4, "result": {}}
        )
        snapshot = self.authority.current_snapshot()
        self.assertEqual("turn-regular", snapshot.active_turn_id)
        self.assertFalse(snapshot.admission_pending)

        self.authority.observe_notification(
            1,
            {
                "method": "turn/completed",
                "params": {
                    "threadId": "root-a",
                    "turn": {
                        "id": "turn-regular",
                        "status": "completed",
                    },
                },
            },
        )
        snapshot = self.authority.current_snapshot()
        self.assertIsNone(snapshot.active_turn_id)
        self.assertFalse(snapshot.admission_pending)

    def test_shell_response_does_not_restore_stale_compact_barrier(self):
        self.establish()
        compact = self.authority.begin_tui_request(
            1, "thread/compact/start", {"threadId": "root-a"}
        )
        self.authority.finish_tui_request(
            compact, {"id": 3, "result": {}}
        )
        self.assertTrue(
            self.authority.current_snapshot().admission_pending
        )

        shell = self.authority.begin_tui_request(
            1,
            "thread/shellCommand",
            {"threadId": "root-a", "command": "pwd"},
        )
        self.authority.observe_notification(
            1,
            {
                "method": "turn/started",
                "params": {
                    "threadId": "root-a",
                    "turn": {
                        "id": "turn-compact",
                        "status": "inProgress",
                    },
                },
            },
        )
        self.authority.finish_tui_request(
            shell, {"id": 4, "result": {}}
        )

        snapshot = self.authority.current_snapshot()
        self.assertEqual("turn-compact", snapshot.active_turn_id)
        self.assertFalse(snapshot.admission_pending)

    def test_admission_response_cannot_resurrect_completed_turn(self):
        self.establish()
        admission = self.authority.begin_tui_request(
            1, "turn/start", {"threadId": "root-a", "input": []}
        )
        self.authority.observe_notification(
            1,
            {
                "method": "turn/started",
                "params": {
                    "threadId": "root-a",
                    "turn": {"id": "turn-fast", "status": "inProgress"},
                },
            },
        )
        self.authority.observe_notification(
            1,
            {
                "method": "turn/completed",
                "params": {
                    "threadId": "root-a",
                    "turn": {"id": "turn-fast", "status": "completed"},
                },
            },
        )

        self.authority.finish_tui_request(
            admission,
            {
                "id": 2,
                "result": {
                    "turn": {
                        "id": "turn-fast",
                        "status": "inProgress",
                        "items": [],
                    }
                },
            },
        )

        self.assertIsNone(
            self.authority.current_snapshot().active_turn_id
        )
        self.assertFalse(
            self.authority.current_snapshot().admission_pending
        )

    def test_detached_review_does_not_replace_primary_active_turn(self):
        self.establish()
        self.authority.observe_notification(
            1,
            {
                "method": "turn/started",
                "params": {
                    "threadId": "root-a",
                    "turn": {
                        "id": "turn-primary",
                        "status": "inProgress",
                    },
                },
            },
        )
        review = self.authority.begin_tui_request(
            1,
            "review/start",
            {
                "threadId": "root-a",
                "delivery": "detached",
                "target": {"type": "uncommittedChanges"},
            },
        )
        self.authority.observe_notification(
            1,
            {
                "method": "turn/started",
                "params": {
                    "threadId": "review-thread",
                    "turn": {
                        "id": "turn-review",
                        "status": "inProgress",
                    },
                },
            },
        )
        self.authority.finish_tui_request(
            review,
            {
                "id": 3,
                "result": {
                    "reviewThreadId": "review-thread",
                    "turn": {
                        "id": "turn-review",
                        "status": "inProgress",
                        "items": [],
                    },
                },
            },
        )

        snapshot = self.authority.current_snapshot()
        self.assertEqual("root-a", snapshot.thread_id)
        self.assertEqual("turn-primary", snapshot.active_turn_id)

    def test_root_response_replays_target_turn_events_seen_in_flight(self):
        self.establish()
        resume = self.authority.begin_tui_request(
            1, "thread/resume", {"threadId": "root-b"}
        )
        self.authority.observe_notification(
            1,
            {
                "method": "turn/started",
                "params": {
                    "threadId": "root-b",
                    "turn": {"id": "turn-b", "status": "inProgress"},
                },
            },
        )
        self.authority.finish_tui_request(
            resume, {"id": 2, "result": root_result("root-b")}
        )
        self.assertEqual(
            "turn-b", self.authority.current_snapshot().active_turn_id
        )

        same_root_resume = self.authority.begin_tui_request(
            1, "thread/resume", {"threadId": "root-b"}
        )
        self.authority.observe_notification(
            1,
            {
                "method": "turn/completed",
                "params": {
                    "threadId": "root-b",
                    "turn": {"id": "turn-b", "status": "completed"},
                },
            },
        )
        stale_result = root_result("root-b")
        stale_result["thread"]["turns"] = [
            {
                "id": "turn-b",
                "status": "inProgress",
                "items": [],
            }
        ]
        self.authority.finish_tui_request(
            same_root_resume, {"id": 3, "result": stale_result}
        )
        self.assertIsNone(
            self.authority.current_snapshot().active_turn_id
        )

    def test_conflicting_root_response_and_started_event_is_untracked(self):
        self.establish()
        resume = self.authority.begin_tui_request(
            1, "thread/resume", {"threadId": "root-b"}
        )
        self.authority.observe_notification(
            1,
            {
                "method": "turn/started",
                "params": {
                    "threadId": "root-b",
                    "turn": {
                        "id": "turn-live",
                        "status": "inProgress",
                    },
                },
            },
        )
        stale_result = root_result("root-b")
        stale_result["thread"]["turns"] = [
            {
                "id": "turn-from-response",
                "status": "inProgress",
                "items": [],
            }
        ]

        self.authority.finish_tui_request(
            resume, {"id": 2, "result": stale_result}
        )

        snapshot = self.authority.current_snapshot()
        self.assertEqual("root-b", snapshot.thread_id)
        self.assertIsNone(snapshot.active_turn_id)

    def test_rejected_invalidation_restores_notification_updated_turn(self):
        self.establish()
        self.authority.observe_notification(
            1,
            {
                "method": "turn/started",
                "params": {
                    "threadId": "root-a",
                    "turn": {"id": "turn-a", "status": "inProgress"},
                },
            },
        )
        archive = self.authority.begin_tui_request(
            1, "thread/archive", {"threadId": "root-a"}
        )
        self.authority.observe_notification(
            1,
            {
                "method": "turn/completed",
                "params": {
                    "threadId": "root-a",
                    "turn": {"id": "turn-a", "status": "completed"},
                },
            },
        )
        self.authority.finish_tui_request(
            archive,
            {"id": 4, "error": {"code": -1, "message": "busy"}},
        )

        restored = self.authority.current_snapshot()
        self.assertEqual("root-a", restored.thread_id)
        self.assertIsNone(restored.active_turn_id)

    def test_non_root_resume_and_side_fork_do_not_replace_primary(self):
        original = self.establish()
        side_gate = self.authority.begin_tui_request(
            1,
            "thread/fork",
            {
                "threadId": "root-a",
                "ephemeral": True,
                "excludeTurns": True,
            },
        )
        self.assertIsNone(side_gate)

        resume_gate = self.authority.begin_tui_request(
            1, "thread/resume", {"threadId": "agent-a"}
        )
        self.authority.finish_tui_request(
            resume_gate,
            {
                "id": 2,
                "result": {
                    "thread": {
                        "id": "agent-a",
                        "sessionId": "root-a",
                        "parentThreadId": "root-a",
                        "cwd": "/workspace/project",
                    },
                    "cwd": "/workspace/project",
                },
            },
        )
        self.assertEqual(original, self.authority.current_snapshot())

    def test_invalidation_success_error_and_ambiguity(self):
        original = self.establish()

        archive = self.authority.begin_tui_request(
            1, "thread/archive", {"threadId": "root-a"}
        )
        self.assertIsNone(self.authority.current_snapshot())
        self.authority.finish_tui_request(
            archive, {"id": 2, "error": {"code": -1, "message": "no"}}
        )
        self.assertEqual(original, self.authority.current_snapshot())

        delete = self.authority.begin_tui_request(
            1, "thread/delete", {"threadId": "root-a"}
        )
        self.authority.finish_tui_request(
            delete, {"id": 3, "result": {}}
        )
        self.assertIsNone(self.authority.current_snapshot())

        restarted = self.establish("root-c")
        unsubscribe = self.authority.begin_tui_request(
            1, "thread/unsubscribe", {"threadId": "root-c"}
        )
        self.authority.finish_tui_request(
            unsubscribe,
            {"id": 4, "error": {"code": -1, "message": "rejected"}},
        )
        # Codex 0.145 aborts the local listener even after unsubscribe Err.
        self.assertIsNone(self.authority.current_snapshot())

        self.establish("root-d")
        ambiguous = self.authority.begin_tui_request(
            1, "thread/archive", {"threadId": "root-d"}
        )
        self.authority.abort_tui_request(
            ambiguous, "archive transport outcome is ambiguous"
        )
        self.assertIsNone(self.authority.current_snapshot())
        self.assertIn("ambiguous", self.authority.fatal_error)
        self.assertIsNotNone(restarted)

    def test_invalid_root_cwd_fails_closed(self):
        self.establish()
        gate = self.authority.begin_tui_request(
            1, "thread/fork", {"threadId": "root-a"}
        )
        with self.assertRaises(bridge.RelayProtocolError):
            self.authority.finish_tui_request(
                gate,
                {
                    "id": 2,
                    "result": root_result("root-other", "/other"),
                },
            )
        self.assertIsNone(self.authority.current_snapshot())
        self.assertIsNotNone(self.authority.fatal_error)

    def test_malformed_error_object_fails_closed(self):
        self.establish()
        gate = self.authority.begin_tui_request(
            1, "thread/archive", {"threadId": "root-a"}
        )
        with self.assertRaises(bridge.RelayProtocolError):
            self.authority.finish_tui_request(
                gate, {"id": 2, "error": None}
            )
        self.assertIsNone(self.authority.current_snapshot())
        self.assertIn("not an object", self.authority.fatal_error)

    def test_snapshot_revoked_by_primary_lifecycle_notification(self):
        snapshot = self.establish()
        self.assertTrue(self.authority.snapshot_is_current(snapshot))
        self.authority.observe_notification(
            1,
            {
                "method": "thread/closed",
                "params": {"threadId": "root-a"},
            },
        )
        self.assertFalse(self.authority.snapshot_is_current(snapshot))
        self.assertIsNone(self.authority.current_snapshot())

    def test_lifecycle_notification_prevents_error_restoring_stale_root(self):
        self.establish()
        resume = self.authority.begin_tui_request(
            1, "thread/resume", {"threadId": "root-b"}
        )
        self.authority.observe_notification(
            1,
            {
                "method": "thread/closed",
                "params": {"threadId": "root-a"},
            },
        )
        self.authority.finish_tui_request(
            resume,
            {"id": 2, "error": {"code": -1, "message": "rejected"}},
        )
        self.assertIsNone(self.authority.current_snapshot())

        self.establish("root-c")
        archive = self.authority.begin_tui_request(
            1, "thread/archive", {"threadId": "root-c"}
        )
        self.authority.observe_notification(
            1,
            {
                "method": "thread/archived",
                "params": {"threadId": "root-c"},
            },
        )
        self.authority.finish_tui_request(
            archive,
            {"id": 3, "error": {"code": -1, "message": "late error"}},
        )
        self.assertIsNone(self.authority.current_snapshot())


class FakeRawUpstream:
    def __init__(self):
        self.sent = queue.Queue()
        self.incoming = queue.Queue()
        self.closed = threading.Event()

    def start_raw(self):
        return None

    def send_json_message(self, message):
        if self.closed.is_set():
            raise bridge.AppServerTransportError("fake upstream closed")
        self.sent.put(message)

    def read_json_message(self):
        message = self.incoming.get()
        return message

    def respond(self, message):
        self.incoming.put(message)

    def close(self):
        if not self.closed.is_set():
            self.closed.set()
            self.incoming.put(None)


class FakeUpstreamFactory:
    def __init__(self):
        self.created = []
        self.condition = threading.Condition()

    def __call__(self, _socket_path):
        upstream = FakeRawUpstream()
        with self.condition:
            self.created.append(upstream)
            self.condition.notify_all()
        return upstream

    def get(self, index):
        def available():
            with self.condition:
                return (
                    self.created[index]
                    if len(self.created) > index
                    else None
                )

        return wait_for(available, "relay did not create upstream")


def masked_frame(payload, opcode=1, fin=True, rsv=0):
    first = (0x80 if fin else 0) | rsv | opcode
    size = len(payload)
    if size < 126:
        header = bytes((first, 0x80 | size))
    elif size <= 0xFFFF:
        header = bytes((first, 0x80 | 126)) + struct.pack("!H", size)
    else:
        header = bytes((first, 0x80 | 127)) + struct.pack("!Q", size)
    mask = b"\x11\x22\x33\x44"
    encoded = bytes(
        value ^ mask[index % 4] for index, value in enumerate(payload)
    )
    return header + mask + encoded


def read_exact(stream, size):
    result = bytearray()
    while len(result) < size:
        chunk = stream.recv(size - len(result))
        if not chunk:
            raise EOFError("WebSocket closed")
        result.extend(chunk)
    return bytes(result)


def read_server_json(stream):
    first, second = read_exact(stream, 2)
    if second & 0x80:
        raise AssertionError("relay server frame must be unmasked")
    opcode = first & 0x0F
    size = second & 0x7F
    if size == 126:
        size = struct.unpack("!H", read_exact(stream, 2))[0]
    elif size == 127:
        size = struct.unpack("!Q", read_exact(stream, 8))[0]
    payload = read_exact(stream, size)
    if opcode == 8:
        raise EOFError("relay closed WebSocket")
    return json.loads(payload.decode("utf-8"))


def send_client_json(stream, message):
    payload = json.dumps(message, separators=(",", ":")).encode("utf-8")
    stream.sendall(masked_frame(payload))


def connect_frontend(path):
    stream = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    stream.connect(path)
    key = base64.b64encode(b"0123456789abcdef").decode("ascii")
    stream.sendall(
        (
            "GET / HTTP/1.1\r\n"
            "Host: localhost\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            "Sec-WebSocket-Key: {}\r\n"
            "Sec-WebSocket-Version: 13\r\n"
            "\r\n"
        ).format(key).encode("ascii")
    )
    response = bytearray()
    while b"\r\n\r\n" not in response:
        response.extend(stream.recv(4096))
    expected = base64.b64encode(
        hashlib.sha1(
            (key + bridge.WEBSOCKET_GUID).encode("ascii")
        ).digest()
    ).decode("ascii")
    text = response.decode("ascii")
    if "101 Switching Protocols" not in text:
        raise AssertionError(text)
    if "Sec-WebSocket-Accept: {}".format(expected) not in text:
        raise AssertionError(text)
    if "Sec-WebSocket-Extensions" in text:
        raise AssertionError("relay negotiated extensions")
    return stream


class RelayIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.frontend_path = os.path.join(
            self.temporary.name, "tui.sock"
        )
        self.authority = bridge.RootAuthority("/workspace/project")
        self.factory = FakeUpstreamFactory()
        self.relay = bridge.UnixWebSocketRelay(
            self.frontend_path,
            os.path.join(self.temporary.name, "backend.sock"),
            self.authority,
            upstream_factory=self.factory,
        )
        self.relay.start()
        self.clients = []

    def tearDown(self):
        for client in self.clients:
            try:
                client.close()
            except OSError:
                pass
        self.relay.close()
        self.temporary.cleanup()

    def initialized_connection(self):
        client = connect_frontend(self.frontend_path)
        self.clients.append(client)
        upstream = self.factory.get(len(self.clients) - 1)
        request_id = "init-{}".format(len(self.clients))
        send_client_json(
            client,
            {
                "id": request_id,
                "method": "initialize",
                "params": {
                    "clientInfo": {
                        "name": "codex-tui",
                        "version": "0.145.0",
                    },
                    "capabilities": {"experimentalApi": True},
                },
            },
        )
        initialize = upstream.sent.get(timeout=1)
        self.assertEqual("initialize", initialize["method"])
        upstream.respond({"id": request_id, "result": {"userAgent": "test"}})
        self.assertEqual(request_id, read_server_json(client)["id"])
        return client, upstream

    def test_primary_disconnect_revokes_authority_before_socket_cleanup(self):
        primary, upstream = self.initialized_connection()
        send_client_json(
            primary,
            {
                "id": 1,
                "method": "thread/start",
                "params": {"cwd": "/workspace/project"},
            },
        )
        self.assertEqual(
            "thread/start", upstream.sent.get(timeout=1)["method"]
        )
        upstream.respond(
            {"id": 1, "result": root_result("root-primary")}
        )
        self.assertEqual(1, read_server_json(primary)["id"])

        with self.relay.connections_lock:
            connection = next(iter(self.relay.connections.values()))
        original_close = connection.close
        checked = threading.Event()
        leased = []

        def checking_close():
            with self.authority.delivery_lease(lambda: True) as snapshot:
                leased.append(snapshot)
            checked.set()
            original_close()

        connection.close = checking_close
        primary.shutdown(socket.SHUT_RDWR)
        primary.close()

        self.assertTrue(checked.wait(1))
        self.assertTrue(leased)
        self.assertTrue(all(snapshot is None for snapshot in leased))
        self.assertIsNone(self.authority.current_snapshot())

    def test_frontend_upgrade_requires_host_header(self):
        stream = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self.clients.append(stream)
        stream.connect(self.frontend_path)
        stream.settimeout(1)
        key = base64.b64encode(b"0123456789abcdef").decode("ascii")
        stream.sendall(
            (
                "GET / HTTP/1.1\r\n"
                "Upgrade: websocket\r\n"
                "Connection: Upgrade\r\n"
                "Sec-WebSocket-Key: {}\r\n"
                "Sec-WebSocket-Version: 13\r\n"
                "\r\n"
            ).format(key).encode("ascii")
        )
        self.assertEqual(b"", stream.recv(4096))
        self.assertFalse(self.relay.fatal_event.is_set())

    def test_existing_frontend_socket_is_never_unlinked(self):
        protected_path = os.path.join(
            self.temporary.name, "protected.sock"
        )
        protected = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        protected.bind(protected_path)
        before = os.lstat(protected_path)
        second = bridge.UnixWebSocketRelay(
            protected_path,
            os.path.join(self.temporary.name, "other-backend.sock"),
            bridge.RootAuthority("/workspace/project"),
            upstream_factory=self.factory,
        )
        try:
            with self.assertRaises(bridge.ConfigurationError):
                second.start()
            after = os.lstat(protected_path)
            self.assertEqual(
                (before.st_dev, before.st_ino),
                (after.st_dev, after.st_ino),
            )
        finally:
            second.close()
            protected.close()

    def test_pipelined_request_before_initialize_response_is_rejected(self):
        client = connect_frontend(self.frontend_path)
        self.clients.append(client)
        upstream = self.factory.get(0)
        send_client_json(
            client,
            {
                "id": "init",
                "method": "initialize",
                "params": {
                    "clientInfo": {
                        "name": "codex-tui",
                        "version": "0.145.0",
                    }
                },
            },
        )
        self.assertEqual("initialize", upstream.sent.get(timeout=1)["method"])
        send_client_json(
            client,
            {
                "id": "too-soon",
                "method": "thread/start",
                "params": {"cwd": "/workspace/project"},
            },
        )
        self.assertTrue(upstream.closed.wait(1))
        with self.assertRaises(queue.Empty):
            upstream.sent.get(timeout=0.05)
        self.assertIsNone(self.authority.current_snapshot())
        self.assertIsNone(self.authority.primary_connection_id)
        self.assertFalse(self.relay.fatal_event.is_set())

    def test_auxiliary_resume_start_and_fork_never_change_primary(self):
        primary, primary_upstream = self.initialized_connection()
        send_client_json(
            primary,
            {
                "id": 1,
                "method": "thread/start",
                "params": {"cwd": "/workspace/project"},
            },
        )
        self.assertEqual(
            "thread/start", primary_upstream.sent.get(timeout=1)["method"]
        )
        primary_upstream.respond(
            {"id": 1, "result": root_result("root-a")}
        )
        read_server_json(primary)
        self.assertEqual(
            "root-a", self.authority.current_snapshot().thread_id
        )

        auxiliary, auxiliary_upstream = self.initialized_connection()
        for index, method in enumerate(
            ("thread/resume", "thread/start", "thread/fork"), start=10
        ):
            send_client_json(
                auxiliary,
                {
                    "id": index,
                    "method": method,
                    "params": {
                        "threadId": "aux-source",
                        "cwd": "/workspace/project",
                    },
                },
            )
            forwarded = auxiliary_upstream.sent.get(timeout=1)
            self.assertEqual(method, forwarded["method"])
            auxiliary_upstream.respond(
                {
                    "id": index,
                    "result": root_result("aux-{}".format(index)),
                }
            )
            self.assertEqual(index, read_server_json(auxiliary)["id"])
            self.assertEqual(
                "root-a", self.authority.current_snapshot().thread_id
            )
        self.assertFalse(self.relay.fatal_event.is_set())

    def test_auxiliary_cannot_admit_control_or_invalidate_primary_root(self):
        primary, primary_upstream = self.initialized_connection()
        send_client_json(
            primary,
            {
                "id": 1,
                "method": "thread/start",
                "params": {"cwd": "/workspace/project"},
            },
        )
        primary_upstream.sent.get(timeout=1)
        primary_upstream.respond(
            {"id": 1, "result": root_result("root-a")}
        )
        read_server_json(primary)

        for index, request in enumerate(
            (
                {
                    "id": "aux-turn",
                    "method": "turn/start",
                    "params": {"threadId": "root-a", "input": []},
                },
                {
                    "id": "aux-archive",
                    "method": "thread/archive",
                    "params": {"threadId": "root-a"},
                },
                {
                    "id": "aux-interrupt",
                    "method": "turn/interrupt",
                    "params": {
                        "threadId": "root-a",
                        "turnId": "turn-primary",
                    },
                },
                {
                    "id": "aux-steer",
                    "method": "turn/steer",
                    "params": {
                        "threadId": "root-a",
                        "expectedTurnId": "turn-primary",
                        "input": [{"type": "text", "text": "wrong root"}],
                    },
                },
            ),
            start=1,
        ):
            auxiliary, auxiliary_upstream = self.initialized_connection()
            send_client_json(auxiliary, request)
            self.assertTrue(auxiliary_upstream.closed.wait(1))
            with self.assertRaises(queue.Empty):
                auxiliary_upstream.sent.get(timeout=0.05)
            self.assertEqual(
                "root-a", self.authority.current_snapshot().thread_id
            )
            self.assertFalse(
                self.relay.fatal_event.is_set(),
                "auxiliary violation {} killed the primary".format(index),
            )

        picker, picker_upstream = self.initialized_connection()
        send_client_json(
            picker,
            {
                "id": "other-archive",
                "method": "thread/archive",
                "params": {"threadId": "root-other"},
            },
        )
        self.assertEqual(
            "thread/archive",
            picker_upstream.sent.get(timeout=1)["method"],
        )
        picker_upstream.respond(
            {"id": "other-archive", "result": {}}
        )
        self.assertEqual(
            "other-archive", read_server_json(picker)["id"]
        )

        send_client_json(
            picker,
            {
                "id": "other-interrupt",
                "method": "turn/interrupt",
                "params": {
                    "threadId": "root-other",
                    "turnId": "turn-other",
                },
            },
        )
        self.assertEqual(
            "turn/interrupt",
            picker_upstream.sent.get(timeout=1)["method"],
        )
        self.assertEqual(
            "root-a", self.authority.current_snapshot().thread_id
        )

        for method in ("turn/interrupt", "turn/steer"):
            auxiliary, auxiliary_upstream = self.initialized_connection()
            send_client_json(
                auxiliary,
                {
                    "method": method,
                    "params": {"threadId": "root-a"},
                },
            )
            self.assertTrue(auxiliary_upstream.closed.wait(1))
            with self.assertRaises(queue.Empty):
                auxiliary_upstream.sent.get(timeout=0.05)
            self.assertEqual(
                "root-a", self.authority.current_snapshot().thread_id
            )
            self.assertFalse(self.relay.fatal_event.is_set())

    def test_fifo_reservation_exists_before_gate_worker_runs(self):
        client, upstream = self.initialized_connection()
        send_client_json(
            client,
            {
                "id": "root",
                "method": "thread/start",
                "params": {"cwd": "/workspace/project"},
            },
        )
        upstream.sent.get(timeout=1)
        upstream.respond(
            {"id": "root", "result": root_result("root-a")}
        )
        read_server_json(client)

        original_begin = self.authority.begin_tui_request
        worker_entered = threading.Event()
        release_worker = threading.Event()

        def paused_begin(*args, **kwargs):
            worker_entered.set()
            release_worker.wait(1)
            return original_begin(*args, **kwargs)

        self.authority.begin_tui_request = paused_begin
        try:
            send_client_json(
                client,
                {
                    "id": "human",
                    "method": "turn/start",
                    "params": {"threadId": "root-a", "input": []},
                },
            )
            self.assertTrue(worker_entered.wait(1))
            with self.authority.delivery_lease(
                lambda: True
            ) as snapshot:
                self.assertIsNone(snapshot)
        finally:
            release_worker.set()
            self.authority.begin_tui_request = original_begin

        self.assertEqual(
            "turn/start", upstream.sent.get(timeout=1)["method"]
        )
        upstream.respond(
            {"id": "human", "result": {"turn": {"id": "turn-human"}}}
        )
        self.assertEqual("human", read_server_json(client)["id"])

    def test_fifo_gates_with_interleaved_control_bypass(self):
        client, upstream = self.initialized_connection()
        send_client_json(
            client,
            {
                "id": "root",
                "method": "thread/start",
                "params": {"cwd": "/workspace/project"},
            },
        )
        upstream.sent.get(timeout=1)
        upstream.respond(
            {"id": "root", "result": root_result("root-a")}
        )
        read_server_json(client)

        lease_entered = threading.Event()
        release_lease = threading.Event()

        def hold_driver():
            with self.authority.delivery_lease(
                lambda: True
            ) as snapshot:
                self.assertIsNotNone(snapshot)
                lease_entered.set()
                release_lease.wait(2)

        driver = threading.Thread(target=hold_driver)
        driver.start()
        self.assertTrue(lease_entered.wait(1))

        send_client_json(
            client,
            {
                "id": 1,
                "method": "turn/start",
                "params": {"threadId": "root-a", "input": []},
            },
        )
        send_client_json(
            client,
            {
                "id": 2,
                "method": "review/start",
                "params": {"threadId": "root-a"},
            },
        )
        send_client_json(
            client,
            {
                "id": 3,
                "method": "model/list",
                "params": {},
            },
        )
        send_client_json(
            client,
            {
                "id": "interrupt",
                "method": "turn/interrupt",
                "params": {"threadId": "root-a", "turnId": "turn-x"},
            },
        )
        send_client_json(
            client,
            {
                "id": "steer",
                "method": "turn/steer",
                "params": {
                    "threadId": "root-a",
                    "expectedTurnId": "turn-x",
                    "input": [],
                },
            },
        )

        bypass = [
            upstream.sent.get(timeout=1),
            upstream.sent.get(timeout=1),
        ]
        self.assertEqual(
            ["turn/interrupt", "turn/steer"],
            [message["method"] for message in bypass],
        )
        with self.assertRaises(queue.Empty):
            upstream.sent.get(timeout=0.05)

        release_lease.set()
        first = upstream.sent.get(timeout=1)
        self.assertEqual("turn/start", first["method"])
        with self.assertRaises(queue.Empty):
            upstream.sent.get(timeout=0.05)
        upstream.respond(
            {"id": 1, "result": {"turn": {"id": "human-turn"}}}
        )
        self.assertEqual(1, read_server_json(client)["id"])

        second = upstream.sent.get(timeout=1)
        self.assertEqual("review/start", second["method"])
        upstream.respond(
            {"id": 2, "error": {"code": -1, "message": "rejected"}}
        )
        self.assertEqual(2, read_server_json(client)["id"])

        ordinary = upstream.sent.get(timeout=1)
        self.assertEqual("model/list", ordinary["method"])
        upstream.respond({"id": 3, "result": {"data": []}})
        self.assertEqual(3, read_server_json(client)["id"])
        driver.join(1)

    def test_type_sensitive_ids_and_fragmented_masked_input(self):
        client, upstream = self.initialized_connection()
        first = json.dumps(
            {"id": 1, "method": "model/list", "params": {}},
            separators=(",", ":"),
        ).encode("utf-8")
        split = len(first) // 2
        client.sendall(masked_frame(first[:split], fin=False))
        client.sendall(masked_frame(first[split:], opcode=0, fin=True))
        send_client_json(
            client, {"id": "1", "method": "skills/list", "params": {}}
        )
        self.assertEqual(1, upstream.sent.get(timeout=1)["id"])
        self.assertEqual("1", upstream.sent.get(timeout=1)["id"])
        upstream.respond({"id": "1", "result": {"data": ["string"]}})
        upstream.respond({"id": 1, "result": {"data": ["number"]}})
        self.assertEqual("1", read_server_json(client)["id"])
        self.assertEqual(1, read_server_json(client)["id"])

    def test_backend_request_response_round_trip_is_correlated(self):
        client, upstream = self.initialized_connection()
        upstream.respond(
            {
                "id": "approval-1",
                "method": "item/commandExecution/requestApproval",
                "params": {
                    "threadId": "root-a",
                    "turnId": "turn-a",
                    "itemId": "item-a",
                },
            }
        )
        request = read_server_json(client)
        self.assertEqual("approval-1", request["id"])
        send_client_json(
            client,
            {"id": "approval-1", "result": {"decision": "decline"}},
        )
        response = upstream.sent.get(timeout=1)
        self.assertEqual(
            {"id": "approval-1", "result": {"decision": "decline"}},
            response,
        )

    def test_unknown_backend_request_response_fails_closed(self):
        client, _upstream = self.initialized_connection()
        send_client_json(
            client, {"id": "never-requested", "result": {}}
        )
        self.assertTrue(self.relay.fatal_event.wait(1))
        self.assertIn(
            "unknown backend-request response id",
            self.relay.fatal_error,
        )

    def test_malformed_backend_response_fails_closed(self):
        client, upstream = self.initialized_connection()
        send_client_json(
            client,
            {
                "id": "models",
                "method": "model/list",
                "params": {},
            },
        )
        self.assertEqual(
            "model/list", upstream.sent.get(timeout=1)["method"]
        )
        upstream.respond(
            {
                "id": "models",
                "result": {"data": []},
                "error": {"code": -1, "message": "also error"},
            }
        )
        self.assertTrue(self.relay.fatal_event.wait(1))
        self.assertIn("exactly one", self.relay.fatal_error)

    def test_primary_rsv_frame_fails_closed(self):
        client, _upstream = self.initialized_connection()
        payload = json.dumps(
            {"method": "initialized", "params": {}}
        ).encode("utf-8")
        client.sendall(masked_frame(payload, rsv=0x40))
        self.assertTrue(self.relay.fatal_event.wait(1))
        self.assertIn(
            "extension bits", self.relay.fatal_error
        )

    def test_primary_duplicate_json_member_fails_closed(self):
        client, _upstream = self.initialized_connection()
        client.sendall(
            masked_frame(
                b'{"id":1,"id":"other","method":"model/list","params":{}}'
            )
        )
        self.assertTrue(self.relay.fatal_event.wait(1))
        self.assertIn("invalid JSON", self.relay.fatal_error)


if __name__ == "__main__":
    unittest.main()
