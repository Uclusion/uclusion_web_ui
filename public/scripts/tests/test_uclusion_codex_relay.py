import base64
import hashlib
import io
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
from unittest import mock


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS_DIR))

import uclusionCodexBridge as bridge
import uclusionMCPProxy as proxy


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

    def use_root_handoff(self):
        self.authority = bridge.RootAuthority(
            "/workspace/project", enforce_root_handoff=True
        )
        self.authority.driver_connected(
            bridge.INITIAL_DRIVER_CONNECTION_ID
        )
        self.assertTrue(self.authority.claim_primary(1))

    def establish(self, thread_id="root-a"):
        gate = self.authority.begin_tui_request(
            1, "thread/start", {"cwd": "/workspace/project"}
        )
        if self.authority.enforce_root_handoff:
            self.authority.connection_root_subscribed(
                1, thread_id, primary_witness_only=True
            )
        self.authority.finish_tui_request(
            gate, {"id": 1, "result": root_result(thread_id)}
        )
        return self.authority.current_snapshot()

    def complete_root_handoff(self, gate, connection_id, thread_id):
        lifecycle_epoch = self.authority.connection_root_subscribed(
            connection_id, thread_id
        )
        if not self.authority.driver_thread_is_pinned(thread_id):
            self.authority.driver_thread_pinned(
                thread_id, lifecycle_epoch
            )
        self.authority.record_root_handoff_complete(
            gate, thread_id, lifecycle_epoch
        )
        return lifecycle_epoch

    def test_driver_disconnect_fails_established_session_closed(self):
        self.use_root_handoff()
        self.establish()

        self.authority.driver_disconnected(
            bridge.INITIAL_DRIVER_CONNECTION_ID
        )

        self.assertIn("root/audit witness", self.authority.fatal_error)
        with self.authority.delivery_lease(lambda: True) as lease:
            self.assertIsNone(lease.snapshot)
            self.assertEqual("relay is in a fatal state", lease.blocked_by)

    def test_lifecycle_order_uses_stream_sequence_when_clock_regresses(self):
        self.use_root_handoff()
        first = {
            "method": "thread/closed",
            "params": {"threadId": "root-b"},
            "emittedAtMs": 300,
        }
        self.authority.observe_notification(2, first)
        lifecycle_epoch = self.authority.driver_thread_pin_epoch("root-b")
        self.authority.driver_thread_pinned("root-b", lifecycle_epoch)

        self.authority.observe_notification(
            3,
            {
                "method": "thread/closed",
                "params": {"threadId": "root-b"},
                "emittedAtMs": 200,
            },
        )
        self.assertEqual(
            lifecycle_epoch,
            self.authority.driver_thread_pin_epoch("root-b"),
        )
        self.assertTrue(
            self.authority.driver_thread_is_pinned("root-b")
        )

        self.authority.observe_notification(
            2,
            {
                "method": "thread/closed",
                "params": {"threadId": "root-b"},
                "emittedAtMs": 200,
            },
        )
        self.assertGreater(
            self.authority.driver_thread_pin_epoch("root-b"),
            lifecycle_epoch,
        )
        self.assertFalse(
            self.authority.driver_thread_is_pinned("root-b")
        )

    def test_equal_driver_lifecycle_after_ack_clears_pin(self):
        self.use_root_handoff()
        self.establish()
        closed = {
            "method": "thread/closed",
            "params": {"threadId": "root-a"},
            "emittedAtMs": 10,
        }
        self.authority.observe_notification(1, closed)
        self.authority.driver_thread_pinned("root-a")
        self.assertTrue(
            self.authority.driver_thread_is_pinned("root-a")
        )

        self.authority.observe_notification(
            bridge.INITIAL_DRIVER_CONNECTION_ID, closed
        )

        self.assertFalse(
            self.authority.driver_thread_is_pinned("root-a")
        )

    def test_auxiliary_retirement_preserves_independent_driver_pin(self):
        self.use_root_handoff()
        self.authority.driver_thread_pinned("root-picker")

        self.authority.connection_invalidation_succeeded(
            2, "thread/unsubscribe", "root-picker"
        )
        self.authority.connection_closed(2)

        self.assertTrue(
            self.authority.driver_thread_is_pinned("root-picker")
        )

    def test_lifecycle_during_driver_subscribe_rejects_ack(self):
        self.use_root_handoff()
        self.establish()
        lifecycle_epoch = self.authority.driver_thread_pin_epoch(
            "root-a"
        )
        self.authority.observe_notification(
            1,
            {
                "method": "thread/closed",
                "params": {"threadId": "root-a"},
                "emittedAtMs": 10,
            },
        )

        with self.assertRaisesRegex(
            bridge.RelayProtocolError,
            "invalidated while the companion driver subscribed",
        ):
            self.authority.driver_thread_pinned(
                "root-a", lifecycle_epoch
            )

        self.assertFalse(
            self.authority.driver_thread_is_pinned("root-a")
        )

    def test_lifecycle_between_pin_check_and_root_commit_fails_closed(self):
        self.use_root_handoff()
        self.establish()
        resume = self.authority.begin_tui_request(
            1, "thread/resume", {"threadId": "root-b"}
        )
        self.complete_root_handoff(resume, 1, "root-b")
        self.authority.observe_notification(
            bridge.INITIAL_DRIVER_CONNECTION_ID,
            {
                "method": "thread/closed",
                "params": {"threadId": "root-b"},
                "emittedAtMs": 10,
            },
        )
        with self.assertRaisesRegex(
            bridge.RelayProtocolError,
            "invalidated before primary commit",
        ):
            self.authority.finish_tui_request(
                resume,
                {"id": 2, "result": root_result("root-b")},
            )

        self.assertIsNone(self.authority.current_snapshot())
        self.assertIn(
            "invalidated before primary commit",
            self.authority.fatal_error,
        )

    def test_aux_first_driver_lifecycle_revokes_established_root(self):
        self.use_root_handoff()
        self.establish()
        self.assertIsNotNone(self.authority.current_snapshot())

        closed = {
            "method": "thread/closed",
            "params": {"threadId": "root-a"},
            "emittedAtMs": 10,
        }
        self.authority.observe_notification(2, closed)
        self.assertIsNotNone(self.authority.current_snapshot())
        with self.authority.delivery_lease(lambda: True) as lease:
            self.assertIsNone(lease.snapshot)
            self.assertEqual(
                "fresh primary root witness is stale",
                lease.blocked_by,
            )

        self.authority.driver_thread_pinned(
            "root-a",
            self.authority.driver_thread_pin_epoch("root-a"),
        )
        with self.authority.delivery_lease(lambda: True) as lease:
            self.assertIsNone(lease.snapshot)
            self.assertEqual(
                "fresh primary root witness is stale",
                lease.blocked_by,
            )

        self.authority.observe_notification(
            bridge.INITIAL_DRIVER_CONNECTION_ID, closed
        )
        self.assertIsNone(self.authority.current_snapshot())

        with self.authority.delivery_lease(lambda: True) as lease:
            self.assertIsNone(lease.snapshot)

    def test_auxiliary_repin_cannot_reopen_stale_resumed_root(self):
        self.use_root_handoff()
        resume = self.authority.begin_tui_request(
            1, "thread/resume", {"threadId": "root-a"}
        )
        self.complete_root_handoff(resume, 1, "root-a")
        self.authority.finish_tui_request(
            resume, {"id": 1, "result": root_result("root-a")}
        )

        closed = {
            "method": "thread/closed",
            "params": {"threadId": "root-a"},
            "emittedAtMs": 10,
        }
        self.authority.observe_notification(2, closed)
        lifecycle_epoch = self.authority.connection_root_subscribed(
            2, "root-a"
        )
        self.authority.driver_thread_pinned(
            "root-a", lifecycle_epoch
        )

        with self.authority.delivery_lease(lambda: True) as lease:
            self.assertIsNone(lease.snapshot)
            self.assertEqual(
                "primary root lifecycle witness is stale",
                lease.blocked_by,
            )

        primary_resume = self.authority.begin_tui_request(
            1, "thread/resume", {"threadId": "root-a"}
        )
        self.complete_root_handoff(primary_resume, 1, "root-a")
        self.authority.finish_tui_request(
            primary_resume,
            {"id": 2, "result": root_result("root-a")},
        )
        with self.authority.delivery_lease(lambda: True) as lease:
            self.assertIsNotNone(lease.snapshot)
            self.assertIsNone(lease.blocked_by)

    def test_invalid_driver_lifecycle_event_fails_closed(self):
        self.use_root_handoff()
        self.establish()

        self.authority.observe_notification(
            bridge.INITIAL_DRIVER_CONNECTION_ID,
            {
                "method": "thread/closed",
                "params": {"threadId": 42},
            },
        )

        self.assertIn(
            "has no threadId", self.authority.fatal_error
        )

    def test_driver_lease_linearizes_before_root_switch(self):
        original = self.establish()
        acquired = threading.Event()
        holder = {}

        with self.authority.delivery_lease(lambda: True) as lease:
            self.assertEqual(original, lease.snapshot)

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
        with self.authority.delivery_lease(lambda: True) as lease:
            self.assertIsNone(lease.snapshot)
        self.authority.finish_tui_request(
            gate, {"id": "resume", "result": root_result("root-b")}
        )
        with self.authority.delivery_lease(lambda: True) as lease:
            self.assertEqual("root-b", lease.snapshot.thread_id)

    def test_reserved_fifo_work_blocks_driver_before_worker_admission(self):
        self.establish()
        self.authority.reserve_primary_work(1)
        with self.authority.delivery_lease(lambda: True) as lease:
            self.assertIsNone(lease.snapshot)
        self.authority.release_primary_work(1)
        with self.authority.delivery_lease(lambda: True) as lease:
            self.assertEqual("root-a", lease.snapshot.thread_id)

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
        with self.authority.delivery_lease(lambda: True) as lease:
            self.assertTrue(lease.snapshot.admission_pending)

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
        self.internal_sent = queue.Queue()
        self.before_internal_response = []
        self.before_internal_response_batches = []
        self.internal_send_release = None
        self.internal_response_release = None
        self.incoming = queue.Queue()
        self.closed = threading.Event()

    def start_raw(self):
        return None

    def send_json_message(self, message):
        if self.closed.is_set():
            raise bridge.AppServerTransportError("fake upstream closed")
        if (
            message.get("method") == "thread/read"
            and isinstance(message.get("id"), str)
            and message["id"].startswith(
                "uclusion-codex-pin-fence:"
            )
        ):
            self.internal_sent.put(message)
            if self.internal_send_release is not None:
                while not self.internal_send_release.wait(0.01):
                    if self.closed.is_set():
                        raise bridge.AppServerTransportError(
                            "fake upstream closed during internal send"
                        )
            if self.internal_response_release is not None:
                self.internal_response_release.wait(1)
            queued_messages = self.before_internal_response
            if self.before_internal_response_batches:
                queued_messages = (
                    self.before_internal_response_batches.pop(0)
                )
            for queued_message in queued_messages:
                self.incoming.put(queued_message)
            self.before_internal_response = []
            self.incoming.put(
                {
                    "id": message["id"],
                    "result": {
                        "thread": {
                            "id": message["params"]["threadId"]
                        }
                    },
                }
            )
            return
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


def read_server_frame(stream):
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
    return opcode, payload


def read_server_json(stream):
    opcode, payload = read_server_frame(stream)
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


class RunBridgeRelayIntegrationTests(unittest.TestCase):
    def test_resumed_primary_delivers_poke_without_mcp_startup_status(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        inbox_path = os.path.join(
            temporary.name, ".uclusion", proxy.INBOX_FILE
        )
        config = bridge.BridgeConfig(
            environment="stage",
            workspace_id="workspace-test",
            instance="instance-test",
            cwd="/workspace/project",
            app_server_socket=os.path.join(
                temporary.name, "backend.sock"
            ),
            inbox_path=inbox_path,
            ready_file=os.path.join(temporary.name, "bridge.ready"),
            receiver_pid_file=os.path.join(
                temporary.name, "receiver.pid"
            ),
            frontend_socket=os.path.join(temporary.name, "tui.sock"),
        )
        Path(config.receiver_pid_file).write_text(
            "{} {}\n".format(config.instance, os.getpid()),
            encoding="utf-8",
        )
        store = bridge.InboxStore(inbox_path)
        upstreams = FakeUpstreamFactory()
        stopping = threading.Event()
        start_calls = []
        turn_started = queue.Queue()

        class DriverClient:
            def __init__(self):
                self.response_lock = threading.Lock()
                self.reader_failure = None
                self.notification_handler = None
                self.disconnect_handler = None
                self.subscribe_calls = []
                self.fence_calls = []

            def start(self):
                pass

            def subscribe_thread(self, thread_id, on_subscribed):
                self.subscribe_calls.append(thread_id)
                on_subscribed()

            def fence_thread(self, thread_id):
                self.fence_calls.append(thread_id)

            def close(self):
                pass

        class ControlClient:
            def start(self):
                pass

            def thread_read(self, thread_id, include_turns):
                thread = {
                    "id": thread_id,
                    "sessionId": thread_id,
                    "parentThreadId": None,
                    "cwd": config.cwd,
                    "status": {"type": "idle"},
                }
                if include_turns:
                    thread["turns"] = []
                return thread

            def turn_start(self, thread_id, text, message_id):
                call = (thread_id, text, message_id)
                start_calls.append(call)
                turn_started.put(call)
                return {
                    "turn": {
                        "id": "turn-poke",
                        "status": "inProgress",
                        "items": [],
                    }
                }

            def turn_steer(self, *_args):
                raise AssertionError("idle root must use turn/start")

            def close(self):
                pass

        driver = DriverClient()
        control = ControlClient()
        relay_holder = {}

        def relay_factory(frontend, backend, authority):
            relay = bridge.UnixWebSocketRelay(
                frontend,
                backend,
                authority,
                upstream_factory=upstreams,
                request_timeout=1,
            )
            relay_holder["relay"] = relay
            return relay

        result = []
        failures = []

        def run():
            try:
                result.append(
                    bridge.run_bridge(
                        config,
                        poll_interval=0.005,
                        stop_event=stopping,
                        client_factory=lambda _path: driver,
                        control_client_factory=lambda _path: control,
                        relay_factory=relay_factory,
                        update_notice_source=lambda _environment: None,
                    )
                )
            except BaseException as exc:
                failures.append(exc)

        worker = threading.Thread(target=run, daemon=True)
        stderr = io.StringIO()
        frontend = None
        with mock.patch.object(bridge.sys, "stderr", stderr):
            worker.start()
            try:
                wait_for(
                    lambda: (
                        os.path.exists(config.ready_file)
                        and os.path.exists(config.frontend_socket)
                    ),
                    "bridge did not publish its real relay",
                )
                frontend = connect_frontend(config.frontend_socket)
                frontend.settimeout(2)
                primary_upstream = upstreams.get(0)
                send_client_json(
                    frontend,
                    {
                        "id": "initialize",
                        "method": "initialize",
                        "params": {
                            "clientInfo": {
                                "name": "codex-tui",
                                "version": "test",
                            },
                            "capabilities": {"experimentalApi": True},
                        },
                    },
                )
                initialize = primary_upstream.sent.get(timeout=1)
                self.assertEqual("initialize", initialize["method"])
                primary_upstream.respond(
                    {
                        "id": "initialize",
                        "result": {"userAgent": "test"},
                    }
                )
                self.assertEqual(
                    "initialize", read_server_json(frontend)["id"]
                )

                send_client_json(
                    frontend,
                    {
                        "id": "resume",
                        "method": "thread/resume",
                        "params": {"threadId": "root-resumed"},
                    },
                )
                resume = primary_upstream.sent.get(timeout=1)
                self.assertEqual("thread/resume", resume["method"])
                primary_upstream.respond(
                    {
                        "id": "resume",
                        "result": root_result(
                            "root-resumed", config.cwd
                        ),
                    }
                )
                self.assertEqual("resume", read_server_json(frontend)["id"])

                message_id = "poke-regression-1"
                message = "Start regression-target"
                with mock.patch.object(
                    proxy, "get_inbox_path", return_value=inbox_path
                ):
                    self.assertTrue(
                        proxy.enqueue_prompt(
                            config.environment,
                            config.workspace_id,
                            {
                                "message_id": message_id,
                                "message": message,
                            },
                        )
                    )
                with store.connect() as connection:
                    row = connection.execute(
                        """
                        SELECT sequence
                        FROM poke_messages
                        WHERE environment = ? AND workspace_id = ?
                          AND message_id = ?
                        """,
                        (
                            config.environment,
                            config.workspace_id,
                            message_id,
                        ),
                    ).fetchone()
                self.assertIsNotNone(row)
                sequence = int(row["sequence"])

                expected_call = (
                    "root-resumed",
                    message,
                    message_id,
                )
                try:
                    actual_call = turn_started.get(timeout=2)
                except queue.Empty:
                    self.fail(
                        "bridge did not call turn/start; delivery_state={!r}, "
                        "cursor={!r}, sequence={!r}".format(
                            store.delivery_state(config, sequence),
                            store.consumer_cursor(config),
                            sequence,
                        )
                    )
                self.assertEqual(expected_call, actual_call)
                committed = {
                    "method": "item/completed",
                    "params": {
                        "threadId": "root-resumed",
                        "turnId": "turn-poke",
                        "item": {
                            "id": "item-poke",
                            "type": "userMessage",
                            "clientId": message_id,
                            "content": [
                                {"type": "text", "text": message}
                            ],
                        },
                    },
                }
                primary_upstream.respond(committed)
                self.assertEqual(committed, read_server_json(frontend))
                wait_for(
                    lambda: store.consumer_cursor(config) == sequence,
                    "bridge did not advance the Poke cursor",
                )
                self.assertEqual(
                    "accepted", store.delivery_state(config, sequence)
                )
                with store.connect() as connection:
                    deliveries = connection.execute(
                        """
                        SELECT message_id, thread_id, state, attempt_count
                        FROM codex_bridge_deliveries
                        WHERE environment = ? AND workspace_id = ?
                          AND consumer = ? AND sequence = ?
                        """,
                        (
                            config.environment,
                            config.workspace_id,
                            bridge.BRIDGE_CONSUMER,
                            sequence,
                        ),
                    ).fetchall()
                self.assertEqual(1, len(deliveries))
                self.assertEqual(message_id, deliveries[0]["message_id"])
                self.assertEqual("root-resumed", deliveries[0]["thread_id"])
                self.assertEqual("accepted", deliveries[0]["state"])
                self.assertEqual(1, deliveries[0]["attempt_count"])
                self.assertIsNone(store.peek_next(config))
                self.assertEqual([expected_call], start_calls)
                self.assertEqual(["root-resumed"], driver.subscribe_calls)
                self.assertEqual(["root-resumed"], driver.fence_calls)
                self.assertFalse(relay_holder["relay"].fatal_event.is_set())
            finally:
                stopping.set()
                worker.join(3)
                if frontend is not None:
                    frontend.close()

        self.assertFalse(worker.is_alive())
        self.assertEqual([], failures)
        self.assertEqual([bridge.EXIT_OK], result)
        self.assertEqual("", stderr.getvalue())


class FrontendWebSocketTests(unittest.TestCase):
    def test_close_receipt_revokes_authority_behind_blocked_data_write(self):
        data_send_started = threading.Event()
        release_data_send = threading.Event()
        send_count = [0]

        class BlockingCloseSocket:
            def sendall(self, _payload):
                send_count[0] += 1
                if send_count[0] == 1:
                    data_send_started.set()
                    release_data_send.wait(1)

        authority = bridge.RootAuthority("/workspace/project")
        authority.claim_primary(1)
        gate = authority.begin_tui_request(
            1, "thread/start", {"cwd": "/workspace/project"}
        )
        authority.finish_tui_request(
            gate, {"id": 1, "result": root_result("root-primary")}
        )
        frontend = bridge.FrontendWebSocket(BlockingCloseSocket())
        payload = struct.pack("!H", 1000)
        data_writer = threading.Thread(
            target=lambda: frontend.send_json_message(
                {"method": "thread/status/changed", "params": {}}
            ),
            daemon=True,
        )
        close_reader = threading.Thread(
            target=lambda: frontend._begin_close_handshake(
                payload,
                1000,
                lambda _code: authority.primary_closed_cleanly(1),
            ),
            daemon=True,
        )
        try:
            data_writer.start()
            self.assertTrue(data_send_started.wait(1))
            close_reader.start()
            wait_for(
                lambda: frontend.received_close,
                "Close receipt did not linearize behind blocked data write",
            )
            self.assertIsNone(authority.current_snapshot())
            with authority.delivery_lease(lambda: True) as lease:
                self.assertIsNone(lease.snapshot)
            self.assertTrue(close_reader.is_alive())
        finally:
            release_data_send.set()
            data_writer.join(1)
            close_reader.join(1)
        self.assertFalse(data_writer.is_alive())
        self.assertFalse(close_reader.is_alive())
        self.assertEqual(2, send_count[0])

    def test_close_response_suppresses_racing_json_frame(self):
        server_stream, client_stream = socket.socketpair()
        frontend = bridge.FrontendWebSocket(server_stream)
        try:
            close_payload = struct.pack("!H", 1000)
            client_stream.sendall(
                masked_frame(close_payload, opcode=8)
            )

            self.assertIsNone(frontend.read_json_message())
            frontend.send_json_message(
                {"method": "thread/status/changed", "params": {}}
            )

            self.assertEqual(
                (8, close_payload), read_server_frame(client_stream)
            )
            client_stream.settimeout(0.05)
            with self.assertRaises(socket.timeout):
                client_stream.recv(1)
        finally:
            frontend.close()
            client_stream.close()

    def test_normal_close_survives_peer_disappearing_before_echo(self):
        callbacks = []

        class PeerGoneSocket:
            def sendall(self, _payload):
                raise BrokenPipeError("peer already closed")

        frontend = bridge.FrontendWebSocket(PeerGoneSocket())
        close_payload = struct.pack("!H", 1000)

        frontend._begin_close_handshake(
            close_payload, 1000, callbacks.append
        )

        self.assertTrue(frontend.received_close)
        self.assertEqual(1000, frontend.received_close_code)
        self.assertEqual([1000], callbacks)

    def test_normal_close_frame_then_peer_shutdown_remains_clean(self):
        server_stream, client_stream = socket.socketpair()
        frontend = bridge.FrontendWebSocket(server_stream)
        callbacks = []
        try:
            close_payload = struct.pack("!H", 1000)
            client_stream.sendall(
                masked_frame(close_payload, opcode=8)
            )
            client_stream.shutdown(socket.SHUT_RDWR)

            self.assertIsNone(
                frontend.read_json_message(callbacks.append)
            )
            self.assertTrue(frontend.received_close)
            self.assertEqual(1000, frontend.received_close_code)
            self.assertEqual([1000], callbacks)
        finally:
            frontend.close()
            client_stream.close()

    def test_fatal_close_uses_nonblocking_best_effort_write(self):
        calls = []

        class WouldBlockSocket:
            def send(self, payload, flags):
                calls.append((payload, flags))
                raise BlockingIOError("socket buffer is full")

            def shutdown(self, _how):
                pass

            def close(self):
                pass

        frontend = bridge.FrontendWebSocket(WouldBlockSocket())

        frontend.close_with_error()

        self.assertTrue(frontend.closed)
        self.assertEqual(1, len(calls))
        self.assertEqual(socket.MSG_DONTWAIT, calls[0][1])
        self.assertEqual(8, calls[0][0][0] & 0x0F)
        self.assertEqual(1011, struct.unpack("!H", calls[0][0][2:])[0])

    def test_fatal_close_does_not_wait_for_existing_writer(self):
        server_stream, client_stream = socket.socketpair()
        frontend = bridge.FrontendWebSocket(server_stream)
        frontend.write_lock.acquire()
        worker = threading.Thread(
            target=frontend.close_with_error, daemon=True
        )
        try:
            worker.start()
            worker.join(0.5)
            self.assertFalse(worker.is_alive())
            self.assertTrue(frontend.closed)
        finally:
            frontend.write_lock.release()
            worker.join(1)
            client_stream.close()


class RelayIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.frontend_path = os.path.join(
            self.temporary.name, "tui.sock"
        )
        self.authority = bridge.RootAuthority("/workspace/project")
        self.authority.driver_connected(
            bridge.INITIAL_DRIVER_CONNECTION_ID
        )
        self.driver_pins = []
        self.driver_fence_notifications = []
        self.factory = FakeUpstreamFactory()
        self.relay = bridge.UnixWebSocketRelay(
            self.frontend_path,
            os.path.join(self.temporary.name, "backend.sock"),
            self.authority,
            upstream_factory=self.factory,
        )
        def pin_driver_thread(thread_id, lifecycle_epoch):
            self.driver_pins.append(thread_id)
            self.authority.driver_thread_pinned(
                thread_id, lifecycle_epoch
            )

        self.relay.driver_thread_pinner = pin_driver_thread
        def fence_driver_thread(_thread_id):
            notifications = self.driver_fence_notifications
            self.driver_fence_notifications = []
            for notification in notifications:
                self.authority.observe_notification(
                    bridge.INITIAL_DRIVER_CONNECTION_ID,
                    notification,
                )

        self.relay.driver_thread_fencer = fence_driver_thread
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

    def test_token_audit_augments_only_enabled_primary_tui_protocol(self):
        self.relay.token_audit_enabled = True
        primary = connect_frontend(self.frontend_path)
        self.clients.append(primary)
        upstream = self.factory.get(0)
        send_client_json(
            primary,
            {
                "id": "init-audit",
                "method": "initialize",
                "params": {
                    "clientInfo": {
                        "name": "codex-tui",
                        "version": "0.146.0",
                    },
                    "capabilities": {"existing": True},
                },
            },
        )
        initialize = upstream.sent.get(timeout=1)
        self.assertEqual(
            {"existing": True, "experimentalApi": True},
            initialize["params"]["capabilities"],
        )
        upstream.respond(
            {"id": "init-audit", "result": {"userAgent": "test"}}
        )
        self.assertEqual("init-audit", read_server_json(primary)["id"])

        send_client_json(
            primary,
            {
                "id": "start-audit",
                "method": "thread/start",
                "params": {"cwd": "/workspace/project"},
            },
        )
        started = upstream.sent.get(timeout=1)
        self.assertEqual(True, started["params"]["experimentalRawEvents"])
        upstream.respond(
            {"id": "start-audit", "result": root_result("root-audit")}
        )
        self.assertEqual("start-audit", read_server_json(primary)["id"])

    def test_disabled_token_audit_preserves_tui_requests_exactly(self):
        primary = connect_frontend(self.frontend_path)
        self.clients.append(primary)
        upstream = self.factory.get(0)
        initialize_request = {
            "id": "init-plain",
            "method": "initialize",
            "params": {
                "clientInfo": {
                    "name": "codex-tui",
                    "version": "0.146.0",
                },
                "capabilities": {"existing": True},
            },
        }
        send_client_json(primary, initialize_request)
        self.assertEqual(initialize_request, upstream.sent.get(timeout=1))
        upstream.respond(
            {"id": "init-plain", "result": {"userAgent": "test"}}
        )
        read_server_json(primary)

        start_request = {
            "id": "start-plain",
            "method": "thread/start",
            "params": {"cwd": "/workspace/project"},
        }
        send_client_json(primary, start_request)
        self.assertEqual(start_request, upstream.sent.get(timeout=1))
        upstream.respond(
            {"id": "start-plain", "result": root_result("root-plain")}
        )
        read_server_json(primary)

    def test_primary_thread_observer_failure_does_not_break_relay(self):
        observed = []

        def observer(thread):
            observed.append(thread)
            raise RuntimeError("telemetry failed")

        self.relay.primary_thread_observer = observer
        primary, upstream = self.initialized_connection()
        send_client_json(
            primary,
            {
                "id": 1,
                "method": "thread/start",
                "params": {"cwd": "/workspace/project"},
            },
        )
        upstream.sent.get(timeout=1)
        result = root_result("root-primary")
        result.update({"model": "gpt-5.6-sol", "reasoningEffort": "high"})
        upstream.respond({"id": 1, "result": result})

        self.assertEqual(1, read_server_json(primary)["id"])
        self.assertEqual("root-primary", observed[0]["id"])
        self.assertEqual("gpt-5.6-sol", observed[0]["model"])
        self.assertEqual("high", observed[0]["reasoningEffort"])
        self.assertEqual("0.145.0", observed[0]["clientVersion"])
        self.assertEqual(
            "root-primary", self.authority.current_snapshot().thread_id
        )
        self.assertFalse(self.relay.fatal_event.is_set())

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
            with self.authority.delivery_lease(lambda: True) as lease:
                leased.append(lease.snapshot)
            checked.set()
            original_close()

        connection.close = checking_close
        primary.shutdown(socket.SHUT_RDWR)
        primary.close()

        self.assertTrue(checked.wait(1))
        self.assertTrue(leased)
        self.assertTrue(all(snapshot is None for snapshot in leased))
        self.assertIsNone(self.authority.current_snapshot())

    def test_valid_primary_close_revokes_authority_without_failing_relay(self):
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

        close_payload = struct.pack("!H", 1000)
        primary.sendall(masked_frame(close_payload, opcode=8))
        self.assertEqual((8, close_payload), read_server_frame(primary))

        def primary_connection_closed():
            with self.relay.connections_lock:
                return not self.relay.connections

        wait_for(
            primary_connection_closed,
            "relay did not close the primary WebSocket",
        )
        self.assertTrue(upstream.closed.wait(1))
        self.assertIsNone(self.authority.current_snapshot())
        self.assertIsNone(self.authority.fatal_error)
        self.assertFalse(self.relay.fatal_event.is_set())
        self.assertIsNone(self.relay.fatal_error)

    def test_error_primary_close_is_echoed_and_fails_relay(self):
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

        close_payload = struct.pack("!H", 1011)
        primary.sendall(masked_frame(close_payload, opcode=8))
        self.assertEqual((8, close_payload), read_server_frame(primary))

        self.assertTrue(self.relay.fatal_event.wait(1))
        self.assertIsNotNone(self.authority.fatal_error)
        self.assertIn("non-normal code 1011", self.relay.fatal_error)
        self.assertTrue(upstream.closed.wait(1))

    def test_fatal_relay_failure_sends_close_1011_before_teardown(self):
        primary, upstream = self.initialized_connection()
        send_client_json(
            primary,
            {
                "id": 1,
                "method": "thread/start",
                "params": {"cwd": "/workspace/project"},
            },
        )
        upstream.sent.get(timeout=1)
        upstream.respond(
            {"id": 1, "result": root_result("root-primary")}
        )
        self.assertEqual(1, read_server_json(primary)["id"])

        self.relay.fail("forced relay failure")

        opcode, payload = read_server_frame(primary)
        self.assertEqual(8, opcode)
        self.assertEqual(1011, struct.unpack("!H", payload)[0])
        self.assertTrue(self.relay.fatal_event.is_set())
        self.assertEqual("forced relay failure", self.relay.fatal_error)
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

    def test_nested_origin_fences_preserve_buffered_wire_order(self):
        _primary, _primary_upstream = self.initialized_connection()
        auxiliary, upstream = self.initialized_connection()
        for request_id, thread_id in ((1, "root-a"), (2, "root-b")):
            send_client_json(
                auxiliary,
                {
                    "id": request_id,
                    "method": "thread/resume",
                    "params": {"threadId": thread_id},
                },
            )
            upstream.sent.get(timeout=1)

        first_notification = {
            "method": "rawResponse/completed",
            "params": {"threadId": "root-b", "name": "First"},
        }
        second_notification = {
            "method": "rawResponse/completed",
            "params": {"threadId": "root-b", "name": "Second"},
        }
        upstream.before_internal_response_batches = [
            [
                {"id": 2, "result": root_result("root-b")},
                first_notification,
            ],
            [second_notification],
        ]
        upstream.respond(
            {"id": 1, "result": root_result("root-a")}
        )

        observed = [read_server_json(auxiliary) for _ in range(4)]
        self.assertEqual(
            [1, 2, "First", "Second"],
            [
                message["id"]
                if "id" in message
                else message["params"]["name"]
                for message in observed
            ],
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
            ) as lease:
                self.assertIsNone(lease.snapshot)
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
            ) as lease:
                self.assertIsNotNone(lease.snapshot)
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
