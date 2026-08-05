import base64
import copy
import hashlib
import io
import json
import os
import socket
import struct
import sys
import tempfile
import threading
import time
import types
import unittest
from pathlib import Path
from unittest import mock


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS_DIR))

import uclusionCodexBridge as bridge


class FakeClock:
    def __init__(self, value=1000.0):
        self.value = value

    def __call__(self):
        return self.value

    def advance(self, seconds):
        self.value += seconds


class FakeAppServer:
    def __init__(self, thread_id="thread-root", status="idle"):
        self.thread_id = thread_id
        turns = []
        if status == "active":
            turns.append(
                {
                    "id": "turn-active",
                    "status": "inProgress",
                    "items": [],
                }
            )
        self.thread = {
            "id": thread_id,
            "sessionId": thread_id,
            "parentThreadId": None,
            "cwd": "/workspace/project",
            "status": {"type": status},
            "turns": turns,
        }
        self.read_calls = []
        self.turn_list_calls = []
        self.start_calls = []
        self.steer_calls = []
        self.outcomes = []
        self.steer_outcomes = []
        self.committed_starts = {}
        self.commit_start_responses = True

    def thread_read(self, thread_id, include_turns):
        self.read_calls.append((thread_id, include_turns))
        result = copy.deepcopy(self.thread)
        result["id"] = thread_id
        if not include_turns:
            result.pop("turns", None)
        return result

    def thread_turns_list(
        self,
        thread_id,
        cursor,
        limit,
        sort_direction,
        items_view,
    ):
        self.turn_list_calls.append(
            (
                thread_id,
                cursor,
                limit,
                sort_direction,
                items_view,
            )
        )
        self.assert_thread_id(thread_id)
        if sort_direction != "desc" or items_view != "full":
            raise AssertionError("unexpected thread turns list view")
        start = 0 if cursor is None else int(cursor)
        turns = list(reversed(self.thread.get("turns", [])))
        data = copy.deepcopy(turns[start:start + limit])
        next_index = start + len(data)
        return {
            "data": data,
            "nextCursor": (
                str(next_index) if next_index < len(turns) else None
            ),
            "backwardsCursor": None,
        }

    def assert_thread_id(self, thread_id):
        if not isinstance(thread_id, str) or not thread_id:
            raise AssertionError("invalid thread id")

    def turn_start(self, thread_id, text, message_id):
        self.start_calls.append((thread_id, text, message_id))
        if self.outcomes:
            outcome = self.outcomes.pop(0)
            if isinstance(outcome, Exception):
                raise outcome
            result = copy.deepcopy(outcome)
        else:
            result = {
                "turn": {
                    "id": "turn-{}".format(len(self.start_calls)),
                    "status": "inProgress",
                    "items": [],
                }
            }
        turn = result.get("turn") if isinstance(result, dict) else None
        turn_id = turn.get("id") if isinstance(turn, dict) else None
        if (
            self.commit_start_responses
            and isinstance(turn_id, str)
            and turn_id
        ):
            self.committed_starts[(thread_id, message_id)] = turn_id
        return result

    def turn_steer(
        self, thread_id, expected_turn_id, text, message_id
    ):
        self.steer_calls.append(
            (thread_id, expected_turn_id, text, message_id)
        )
        if self.steer_outcomes:
            outcome = self.steer_outcomes.pop(0)
            if isinstance(outcome, Exception):
                raise outcome
            return copy.deepcopy(outcome)
        return {"turnId": expected_turn_id}


class BridgeTestCase(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.inbox_path = os.path.join(
            self.temporary.name, "poke_inbox.sqlite3"
        )
        self.clock = FakeClock()
        self.store = bridge.InboxStore(self.inbox_path, clock=self.clock)
        self.config = bridge.BridgeConfig(
            environment="stage",
            workspace_id="workspace-1",
            instance="instance-1",
            cwd="/workspace/project",
            app_server_socket="/tmp/codex.sock",
            inbox_path=self.inbox_path,
            ready_file=os.path.join(self.temporary.name, "bridge.ready"),
            receiver_pid_file=os.path.join(
                self.temporary.name, "receiver.pid"
            ),
        )
        Path(self.config.receiver_pid_file).write_text(
            "{} {}\n".format(self.config.instance, os.getpid()),
            encoding="utf-8",
        )

    def tearDown(self):
        self.temporary.cleanup()

    def add_poke(self, message_id, message):
        with self.store.connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO poke_messages
                    (message_id, environment, workspace_id, message,
                     received_at, consumed_at)
                VALUES (?, ?, ?, ?, ?, NULL)
                """,
                (
                    message_id,
                    self.config.environment,
                    self.config.workspace_id,
                    message,
                    self.clock(),
                ),
            )
            return int(cursor.lastrowid)

    def bind(self, thread_id="thread-root"):
        return self.store.bind(
            self.config,
            thread_id,
            self.config.cwd,
            promoted=False,
        )

    def delivery_attempts(self, sequence):
        with self.store.connect() as connection:
            row = connection.execute(
                """
                SELECT attempt_count
                FROM codex_bridge_deliveries
                WHERE environment = ? AND workspace_id = ?
                  AND consumer = ? AND sequence = ?
                """,
                (
                    self.config.environment,
                    self.config.workspace_id,
                    bridge.BRIDGE_CONSUMER,
                    sequence,
                ),
            ).fetchone()
        return None if row is None else int(row["attempt_count"])

    def committed_start_engine(self, app_server, **kwargs):
        """Build an engine whose fake start response also emits a commit."""
        kwargs.setdefault(
            "observed_turn_id",
            lambda thread_id, message_id: app_server.committed_starts.get(
                (thread_id, message_id)
            ),
        )
        return bridge.BridgeEngine(
            self.store, app_server, self.config, **kwargs
        )


class CompatibilityTests(unittest.TestCase):
    def test_cli_exposes_only_run_but_stale_hook_commands_noop(self):
        parser = bridge.build_parser()
        subparser_action = next(
            action
            for action in parser._actions
            if isinstance(action, bridge.argparse._SubParsersAction)
        )
        self.assertEqual({"run"}, set(subparser_action.choices))
        for command in ("register", "promote", "unregister"):
            self.assertEqual(
                bridge.EXIT_OK,
                bridge.main([command, "--ignored", "legacy"]),
            )

    def test_run_forwards_deliver_existing_pokes(self):
        config = object()
        with mock.patch.object(
            bridge, "config_from_args", return_value=config
        ), mock.patch.object(
            bridge, "run_bridge", return_value=17
        ) as run_bridge:
            result = bridge.main(
                [
                    "run",
                    "--deliver-existing-pokes",
                    "--poll-interval",
                    "0.25",
                ]
            )

        self.assertEqual(17, result)
        run_bridge.assert_called_once_with(
            config,
            poll_interval=0.25,
            deliver_existing_pokes=True,
        )

    def test_run_accepts_legacy_ignore_flag_as_default_cutoff(self):
        config = object()
        with mock.patch.object(
            bridge, "config_from_args", return_value=config
        ), mock.patch.object(
            bridge, "run_bridge", return_value=17
        ) as run_bridge:
            result = bridge.main(
                [
                    "run",
                    "--ignore-existing-pokes",
                    "--poll-interval",
                    "0.25",
                ]
            )

        self.assertEqual(17, result)
        run_bridge.assert_called_once_with(
            config,
            poll_interval=0.25,
            deliver_existing_pokes=False,
        )


class RunBridgeTests(BridgeTestCase):
    def test_default_startup_applies_atomic_backlog_cutoff(self):
        stopping = threading.Event()
        stopping.set()
        relay = mock.Mock()
        config = dataclass_replace(
            self.config,
            frontend_socket=os.path.join(
                self.temporary.name, "frontend.sock"
            ),
        )
        with mock.patch.object(
            bridge.InboxStore,
            "ignore_existing_pokes",
            autospec=True,
        ) as cutoff:
            result = bridge.run_bridge(
                config,
                stop_event=stopping,
                relay_factory=lambda *_args: relay,
                update_notice_source=lambda _environment: None,
            )

        self.assertEqual(bridge.EXIT_OK, result)
        cutoff.assert_called_once()
        self.assertEqual(config, cutoff.call_args.args[1])
        self.assertEqual("codex-bridge", bridge.BRIDGE_CONSUMER)
        relay.close.assert_called_once_with()

    def test_deliver_existing_opt_in_disables_startup_cutoff(self):
        stopping = threading.Event()
        stopping.set()
        relay = mock.Mock()
        config = dataclass_replace(
            self.config,
            frontend_socket=os.path.join(
                self.temporary.name, "frontend.sock"
            ),
        )
        with mock.patch.object(
            bridge.InboxStore,
            "ignore_existing_pokes",
            autospec=True,
        ) as cutoff:
            result = bridge.run_bridge(
                config,
                stop_event=stopping,
                relay_factory=lambda *_args: relay,
                update_notice_source=lambda _environment: None,
                deliver_existing_pokes=True,
            )

        self.assertEqual(bridge.EXIT_OK, result)
        cutoff.assert_not_called()
        relay.close.assert_called_once_with()

    def test_legacy_false_ignore_keyword_preserves_backlog_delivery(self):
        stopping = threading.Event()
        stopping.set()
        relay = mock.Mock()
        config = dataclass_replace(
            self.config,
            frontend_socket=os.path.join(
                self.temporary.name, "frontend.sock"
            ),
        )
        with mock.patch.object(
            bridge.InboxStore,
            "ignore_existing_pokes",
            autospec=True,
        ) as cutoff:
            result = bridge.run_bridge(
                config,
                stop_event=stopping,
                relay_factory=lambda *_args: relay,
                update_notice_source=lambda _environment: None,
                ignore_existing_pokes=False,
            )

        self.assertEqual(bridge.EXIT_OK, result)
        cutoff.assert_not_called()
        relay.close.assert_called_once_with()

    def test_driver_eof_before_registration_retries_without_fatal_state(self):
        stopping = threading.Event()
        clients = []
        relay_holder = {}

        class StartupClient:
            def __init__(self, fail_before_registration):
                self.fail_before_registration = fail_before_registration
                self.response_lock = threading.Lock()
                self.reader_failure = None
                self.notification_handler = None
                self.disconnect_handler = None
                self.closed = False

            def start(self):
                if self.fail_before_registration:
                    self.reader_failure = bridge.AppServerTransportError(
                        "driver EOF before registration"
                    )
                else:
                    stopping.set()

            def subscribe_thread(self, _thread_id, _on_subscribed):
                raise AssertionError("no TUI root should be pinned")

            def fence_thread(self, _thread_id):
                raise AssertionError("no TUI root should be fenced")

            def close(self):
                self.closed = True

        class StartupRelay:
            def __init__(self, _frontend, _backend, authority):
                self.authority = authority
                self.fatal_event = threading.Event()
                self.fatal_error = None
                self.listener = None
                self.driver_thread_pinner = None
                self.closed = False

            def start(self):
                self.listener = object()

            def close(self):
                self.closed = True

        def client_factory(_socket_path):
            client = StartupClient(fail_before_registration=not clients)
            clients.append(client)
            return client

        def relay_factory(frontend, backend, authority):
            relay = StartupRelay(frontend, backend, authority)
            relay_holder["relay"] = relay
            return relay

        config = dataclass_replace(
            self.config,
            frontend_socket=os.path.join(
                self.temporary.name, "frontend.sock"
            ),
        )
        result = bridge.run_bridge(
            config,
            poll_interval=0.001,
            stop_event=stopping,
            client_factory=client_factory,
            relay_factory=relay_factory,
            update_notice_source=lambda _environment: None,
        )

        self.assertEqual(bridge.EXIT_OK, result)
        self.assertEqual(2, len(clients))
        self.assertTrue(clients[0].closed)
        self.assertIsNone(relay_holder["relay"].authority.fatal_error)
        self.assertTrue(relay_holder["relay"].closed)


class DeliveryTests(BridgeTestCase):
    @unittest.skipUnless(
        sys.platform.startswith("linux")
        and hasattr(os, "fork")
        and hasattr(os, "waitid")
        and hasattr(os, "WNOWAIT"),
        "requires Linux waitid zombie semantics",
    )
    def test_unreaped_receiver_zombie_is_not_alive(self):
        child_pid = os.fork()
        if child_pid == 0:
            os._exit(0)
        try:
            os.waitid(
                os.P_PID,
                child_pid,
                os.WEXITED | os.WNOWAIT,
            )
            Path(self.config.receiver_pid_file).write_text(
                "{} {}\n".format(self.config.instance, child_pid),
                encoding="utf-8",
            )
            self.assertFalse(
                bridge.receiver_is_alive(
                    self.config.receiver_pid_file,
                    self.config.instance,
                )
            )
        finally:
            os.waitpid(child_pid, 0)

    def test_no_binding_does_not_create_or_advance_consumer(self):
        self.add_poke("message-1", "Start J-all-369")
        app_server = FakeAppServer()
        result = self.committed_start_engine(app_server).step()
        self.assertEqual("no_binding", result.action)
        self.assertIsNone(self.store.consumer_cursor(self.config))
        self.assertEqual([], app_server.read_calls)
        self.assertEqual([], app_server.start_calls)

    def test_unloaded_binding_does_not_peek_or_claim(self):
        self.bind()
        self.add_poke("message-1", "Start J-all-369")
        app_server = FakeAppServer(status="notLoaded")
        result = bridge.BridgeEngine(
            self.store, app_server, self.config
        ).step()
        self.assertEqual("unhealthy", result.action)
        self.assertIsNone(self.store.consumer_cursor(self.config))
        self.assertEqual([], app_server.start_calls)

    def test_active_thread_poke_steers_and_acknowledges(self):
        self.bind()
        sequence = self.add_poke("message-1", "Start J-all-369")
        app_server = FakeAppServer(status="active")
        result = bridge.BridgeEngine(
            self.store, app_server, self.config
        ).step()

        self.assertEqual("steer_queued", result.action)
        self.assertEqual("turn-active", result.turn_id)
        self.assertEqual(0, self.store.consumer_cursor(self.config))
        self.assertEqual(
            "sending", self.store.delivery_state(self.config, sequence)
        )
        self.assertEqual(
            [
                (
                    "thread-root",
                    "turn-active",
                    "Start J-all-369",
                    "message-1",
                )
            ],
            app_server.steer_calls,
        )
        self.assertEqual([], app_server.start_calls)

        app_server.thread["turns"][0]["items"].append(
            {
                "type": "userMessage",
                "id": "item-steered",
                "clientId": "message-1",
                "content": [
                    {"type": "text", "text": "Start J-all-369"}
                ],
            }
        )
        reconciled = bridge.BridgeEngine(
            self.store, app_server, self.config
        ).step()

        self.assertEqual("reconciled", reconciled.action)
        self.assertEqual(sequence, self.store.consumer_cursor(self.config))
        self.assertEqual(1, len(app_server.steer_calls))

    def test_relay_snapshot_uses_tracked_active_turn_without_history_read(self):
        sequence = self.add_poke("message-1", "Start T-all-2420")
        app_server = FakeAppServer(
            thread_id="root-live", status="active"
        )

        result = bridge.BridgeEngine(
            self.store,
            app_server,
            self.config,
            observed_turn_id=lambda _thread_id, _message_id: (
                "turn-active"
            ),
        ).step(
            bridge.RootSnapshot(
                "root-live", 2, 1, active_turn_id="turn-active"
            )
        )

        self.assertEqual("steered", result.action)
        self.assertEqual(sequence, self.store.consumer_cursor(self.config))
        self.assertEqual([("root-live", False)], app_server.read_calls)
        self.assertEqual(
            [
                (
                    "root-live",
                    "turn-active",
                    "Start T-all-2420",
                    "message-1",
                )
            ],
            app_server.steer_calls,
        )

    def test_relay_snapshot_resolves_untracked_active_turn_from_history(self):
        sequence = self.add_poke("message-1", "Start T-all-2420")
        app_server = FakeAppServer(
            thread_id="root-live", status="active"
        )
        result = bridge.BridgeEngine(
            self.store,
            app_server,
            self.config,
            observed_turn_id=lambda _thread_id, _message_id: (
                "turn-active"
            ),
        ).step(
            bridge.RootSnapshot(
                "root-live", 2, 1, active_turn_id=None
            )
        )

        self.assertEqual("steered", result.action)
        self.assertEqual(sequence, self.store.consumer_cursor(self.config))
        self.assertEqual(
            [("root-live", False), ("root-live", True)],
            app_server.read_calls,
        )
        self.assertEqual("turn-active", app_server.steer_calls[0][1])

    def test_queued_steer_acknowledges_on_exact_live_commit(self):
        sequence = self.add_poke("message-1", "Start T-all-2420")
        app_server = FakeAppServer(
            thread_id="root-live", status="active"
        )
        observed = {}
        engine = bridge.BridgeEngine(
            self.store,
            app_server,
            self.config,
            observed_turn_id=lambda thread_id, message_id: observed.get(
                (thread_id, message_id)
            ),
        )
        snapshot = bridge.RootSnapshot(
            "root-live", 2, 1, active_turn_id="turn-active"
        )

        queued = engine.step(snapshot)

        self.assertEqual("steer_queued", queued.action)
        sending = self.store.get_sending(self.config)
        self.assertEqual("turn-active", sending.turn_id)
        observed[("root-live", "message-1")] = "turn-active"

        committed = engine.step(snapshot)

        self.assertEqual("reconciled", committed.action)
        self.assertEqual(sequence, self.store.consumer_cursor(self.config))
        self.assertEqual([("root-live", False)], app_server.read_calls)
        self.assertEqual(1, len(app_server.steer_calls))

    def test_live_commit_on_old_root_reconciles_after_primary_switch(self):
        sequence = self.add_poke("message-1", "Start T-all-2420")
        poke = self.store.peek_next(self.config)
        self.store.begin_delivery(
            self.config, poke, "root-old", bridge.BRIDGE_CONSUMER
        )
        self.store.record_sending_turn(
            self.config,
            sequence,
            "root-old",
            "message-1",
            "turn-old",
        )
        app_server = FakeAppServer(thread_id="root-new")
        engine = bridge.BridgeEngine(
            self.store,
            app_server,
            self.config,
            observed_turn_id=lambda thread_id, message_id: (
                "turn-old"
                if (thread_id, message_id)
                == ("root-old", "message-1")
                else None
            ),
        )

        result = engine.step(bridge.RootSnapshot("root-new", 4, 1))

        self.assertEqual("reconciled", result.action)
        self.assertEqual(sequence, self.store.consumer_cursor(self.config))
        self.assertEqual([], app_server.read_calls)

    def test_live_commit_must_match_persisted_steer_turn(self):
        sequence = self.add_poke("message-1", "Start T-all-2420")
        poke = self.store.peek_next(self.config)
        self.store.begin_delivery(
            self.config, poke, "root-live", bridge.BRIDGE_CONSUMER
        )
        self.store.record_sending_turn(
            self.config,
            sequence,
            "root-live",
            "message-1",
            "turn-expected",
        )
        result = bridge.BridgeEngine(
            self.store,
            FakeAppServer(thread_id="root-live"),
            self.config,
            observed_turn_id=lambda _thread_id, _message_id: "turn-wrong",
        ).step(bridge.RootSnapshot("root-live", 2, 1))

        self.assertEqual("unhealthy", result.action)
        self.assertEqual(0, self.store.consumer_cursor(self.config))
        self.assertEqual(
            "sending", self.store.delivery_state(self.config, sequence)
        )

    def test_active_turn_backlog_steers_in_inbox_order(self):
        self.bind()
        sequences = [
            self.add_poke("message-{}".format(index), prompt)
            for index, prompt in enumerate(
                (
                    "Start J-all-1",
                    "Responded Q-all-2",
                    "Start B-all-3",
                ),
                start=1,
            )
        ]
        app_server = FakeAppServer(status="active")
        engine = bridge.BridgeEngine(
            self.store,
            app_server,
            self.config,
            observed_turn_id=lambda _thread_id, _message_id: (
                "turn-active"
            ),
        )

        results = [engine.step(), engine.step(), engine.step()]

        self.assertEqual(["steered"] * 3, [item.action for item in results])
        self.assertEqual(
            ["message-1", "message-2", "message-3"],
            [call[3] for call in app_server.steer_calls],
        )
        self.assertEqual(
            ["Start J-all-1", "Responded Q-all-2", "Start B-all-3"],
            [call[2] for call in app_server.steer_calls],
        )
        self.assertEqual(
            sequences[-1], self.store.consumer_cursor(self.config)
        )
        self.assertEqual([], app_server.start_calls)

    def test_active_thread_without_poke_does_not_send_update_notice(self):
        self.bind()
        notice_id = self.store.enqueue_update_notice(
            self.config, "Update available"
        )
        app_server = FakeAppServer(status="active")

        result = bridge.BridgeEngine(
            self.store, app_server, self.config
        ).step()

        self.assertEqual("busy", result.action)
        self.assertEqual(
            "pending",
            self.store.update_notice_state(self.config, notice_id),
        )
        self.assertEqual([], app_server.start_calls)
        self.assertEqual([], app_server.steer_calls)

    def test_session_start_switch_during_idle_read_defers_before_peek(self):
        self.bind("root-b")
        self.add_poke("message-1", "Start J-all-369")
        test_case = self

        class SwitchingAppServer(FakeAppServer):
            def __init__(self):
                super().__init__(thread_id="root-b")

            def thread_read(self, thread_id, include_turns):
                result = super().thread_read(thread_id, include_turns)
                test_case.store.bind(
                    test_case.config,
                    "root-c",
                    test_case.config.cwd,
                    promoted=False,
                    allow_replace=True,
                )
                return result

        app_server = SwitchingAppServer()
        result = bridge.BridgeEngine(
            self.store, app_server, self.config
        ).step()

        self.assertEqual("binding_changed", result.action)
        self.assertEqual(
            "root-c", self.store.get_binding(self.config).thread_id
        )
        self.assertIsNone(self.store.consumer_cursor(self.config))
        self.assertEqual([], app_server.start_calls)

    def test_switch_after_reservation_returns_delivery_to_pending(self):
        self.bind("root-b")
        sequence = self.add_poke("message-1", "Start J-all-369")
        app_server = FakeAppServer(thread_id="root-b")
        original_begin = self.store.begin_delivery

        def begin_then_switch(*args, **kwargs):
            delivery = original_begin(*args, **kwargs)
            self.store.bind(
                self.config,
                "root-c",
                self.config.cwd,
                promoted=False,
                allow_replace=True,
            )
            return delivery

        with mock.patch.object(
            self.store,
            "begin_delivery",
            side_effect=begin_then_switch,
        ):
            result = bridge.BridgeEngine(
                self.store, app_server, self.config
            ).step()

        self.assertEqual("binding_changed", result.action)
        self.assertEqual(0, self.store.consumer_cursor(self.config))
        self.assertEqual(
            "pending", self.store.delivery_state(self.config, sequence)
        )
        self.assertEqual([], app_server.start_calls)

    def test_switch_after_update_reservation_returns_notice_to_pending(self):
        self.bind("root-b")
        notice_id = self.store.enqueue_update_notice(
            self.config, "Update available"
        )
        app_server = FakeAppServer(thread_id="root-b")
        original_begin = self.store.begin_update_notice

        def begin_then_switch(*args, **kwargs):
            notice = original_begin(*args, **kwargs)
            self.store.bind(
                self.config,
                "root-c",
                self.config.cwd,
                promoted=False,
                allow_replace=True,
            )
            return notice

        with mock.patch.object(
            self.store,
            "begin_update_notice",
            side_effect=begin_then_switch,
        ):
            result = bridge.BridgeEngine(
                self.store, app_server, self.config
            ).step()

        self.assertEqual("binding_changed", result.action)
        self.assertEqual(
            "pending",
            self.store.update_notice_state(self.config, notice_id),
        )
        self.assertEqual([], app_server.start_calls)

    def test_success_acknowledges_once_and_preserves_exact_prompt(self):
        self.bind()
        sequence = self.add_poke(
            "message-1", "Responded J-all-369"
        )
        app_server = FakeAppServer()
        engine = self.committed_start_engine(app_server)

        result = engine.step()

        self.assertEqual("accepted", result.action)
        self.assertEqual("turn-1", result.turn_id)
        self.assertEqual(sequence, self.store.consumer_cursor(self.config))
        self.assertEqual(
            [(app_server.thread_id, "Responded J-all-369", "message-1")],
            app_server.start_calls,
        )
        self.assertEqual(
            "accepted", self.store.delivery_state(self.config, sequence)
        )

        # A repeated acknowledgement is idempotent and cannot move backwards.
        self.store.acknowledge(self.config, sequence, "turn-1")
        self.assertEqual(sequence, self.store.consumer_cursor(self.config))
        self.assertEqual("empty", engine.step().action)
        self.assertEqual(1, len(app_server.start_calls))

    def test_start_response_waits_for_exact_commit_without_idle_retry(self):
        self.bind()
        sequence = self.add_poke("message-1", "Start J-all-369")
        app_server = FakeAppServer()
        app_server.commit_start_responses = False
        engine = bridge.BridgeEngine(
            self.store, app_server, self.config
        )

        queued = engine.step()

        self.assertEqual("start_queued", queued.action)
        self.assertEqual("turn-1", queued.turn_id)
        sending = self.store.get_sending(self.config)
        self.assertEqual("turn/start", sending.admission_method)
        self.assertEqual(self.config.instance, sending.attempt_instance)
        self.assertEqual("turn-1", sending.turn_id)
        self.assertEqual(0, self.store.consumer_cursor(self.config))

        # turn/start returns after enqueueing a submission. Remaining idle is
        # not evidence that the session loop dropped it, so polling must not
        # submit the same client id again.
        waiting = engine.step()

        self.assertEqual("awaiting_commit", waiting.action)
        self.assertEqual(1, len(app_server.start_calls))
        self.assertEqual(0, self.store.consumer_cursor(self.config))

        app_server.thread["turns"] = [
            {
                "id": "turn-1",
                "status": "completed",
                "items": [
                    {
                        "type": "userMessage",
                        "clientId": "message-1",
                    }
                ],
            }
        ]
        committed = engine.step()

        self.assertEqual("reconciled", committed.action)
        self.assertEqual("turn-1", committed.turn_id)
        self.assertEqual(sequence, self.store.consumer_cursor(self.config))
        self.assertEqual(1, len(app_server.start_calls))

    def test_interrupted_unprocessed_start_retries_once(self):
        self.bind()
        sequence = self.add_poke("message-1", "Start J-all-369")
        app_server = FakeAppServer()
        app_server.commit_start_responses = False
        engine = self.committed_start_engine(app_server)

        queued = engine.step()

        self.assertEqual("start_queued", queued.action)
        app_server.thread["turns"] = [
            {
                "id": "turn-1",
                "status": "interrupted",
                "items": [],
            }
        ]
        absent = engine.step()

        self.assertEqual("retry_pending", absent.action)
        self.assertEqual(
            "pending", self.store.delivery_state(self.config, sequence)
        )

        app_server.commit_start_responses = True
        retried = engine.step()

        self.assertEqual("accepted", retried.action)
        self.assertEqual("turn-2", retried.turn_id)
        self.assertEqual(sequence, self.store.consumer_cursor(self.config))
        self.assertEqual(2, len(app_server.start_calls))
        self.assertEqual(2, self.delivery_attempts(sequence))

    def test_queued_start_may_commit_into_a_racing_active_turn(self):
        self.bind()
        sequence = self.add_poke("message-1", "Start J-all-369")
        app_server = FakeAppServer()
        app_server.commit_start_responses = False
        result = bridge.BridgeEngine(
            self.store,
            app_server,
            self.config,
            observed_turn_id=lambda _thread_id, _message_id: (
                "turn-that-became-active"
            ),
        ).step()

        self.assertEqual("accepted", result.action)
        self.assertEqual("turn-that-became-active", result.turn_id)
        self.assertEqual(sequence, self.store.consumer_cursor(self.config))
        self.assertEqual(1, len(app_server.start_calls))

    def test_start_commit_event_can_precede_rpc_response(self):
        self.bind()
        sequence = self.add_poke("message-1", "Start J-all-369")
        observed = {}

        class EventBeforeResponseAppServer(FakeAppServer):
            def turn_start(self, thread_id, text, message_id):
                result = super().turn_start(
                    thread_id, text, message_id
                )
                observed[(thread_id, message_id)] = "turn-1"
                return result

        app_server = EventBeforeResponseAppServer()
        result = bridge.BridgeEngine(
            self.store,
            app_server,
            self.config,
            observed_turn_id=lambda thread_id, message_id: observed.get(
                (thread_id, message_id)
            ),
        ).step()

        self.assertEqual("accepted", result.action)
        self.assertEqual("turn-1", result.turn_id)
        self.assertEqual(sequence, self.store.consumer_cursor(self.config))

    def test_rejected_turn_is_pending_and_cursor_does_not_advance(self):
        self.bind()
        sequence = self.add_poke("message-1", "Start J-all-369")
        app_server = FakeAppServer()
        app_server.outcomes.append(
            bridge.AppServerRequestError("thread became busy", -32001)
        )

        result = bridge.BridgeEngine(
            self.store, app_server, self.config
        ).step()

        self.assertEqual("rejected", result.action)
        self.assertEqual(0, self.store.consumer_cursor(self.config))
        self.assertEqual(
            "pending", self.store.delivery_state(self.config, sequence)
        )
        self.assertEqual(
            sequence, self.store.peek_next(self.config).sequence
        )

    def test_ambiguous_send_reconciles_client_id_without_resending(self):
        self.bind()
        sequence = self.add_poke("message-1", "Start J-all-369")
        app_server = FakeAppServer()
        app_server.outcomes.append(
            bridge.AppServerTransportError("connection reset after write")
        )
        engine = bridge.BridgeEngine(self.store, app_server, self.config)

        first = engine.step()
        self.assertEqual("ambiguous", first.action)
        self.assertTrue(first.reconnect)
        self.assertEqual(0, self.store.consumer_cursor(self.config))
        self.assertEqual(
            "sending", self.store.delivery_state(self.config, sequence)
        )

        app_server.thread["turns"] = [
            {
                "id": "accepted-before-reset",
                "status": "inProgress",
                "items": [
                    {
                        "type": "userMessage",
                        "id": "item-1",
                        "clientId": "message-1",
                        "content": [
                            {
                                "type": "text",
                                "text": "Start J-all-369",
                            }
                        ],
                    }
                ],
            }
        ]
        second = engine.step()

        self.assertEqual("reconciled", second.action)
        self.assertEqual("accepted-before-reset", second.turn_id)
        self.assertEqual(sequence, self.store.consumer_cursor(self.config))
        self.assertEqual(1, len(app_server.start_calls))

    def test_ambiguous_steer_reconciles_client_id_without_resending(self):
        self.bind()
        sequence = self.add_poke("message-1", "Start T-all-2420")
        app_server = FakeAppServer(status="active")
        app_server.steer_outcomes.append(
            bridge.AppServerTransportError(
                "connection reset after steer write"
            )
        )
        engine = self.committed_start_engine(app_server)

        first = engine.step()

        self.assertEqual("ambiguous", first.action)
        self.assertTrue(first.reconnect)
        self.assertEqual(
            "sending", self.store.delivery_state(self.config, sequence)
        )
        self.assertEqual(0, self.store.consumer_cursor(self.config))

        app_server.thread["turns"][0]["items"] = [
            {
                "type": "userMessage",
                "id": "item-steered",
                "clientId": "message-1",
                "content": [
                    {"type": "text", "text": "Start T-all-2420"}
                ],
            }
        ]
        second = engine.step()

        self.assertEqual("reconciled", second.action)
        self.assertEqual("turn-active", second.turn_id)
        self.assertEqual(sequence, self.store.consumer_cursor(self.config))
        self.assertEqual(1, len(app_server.steer_calls))
        self.assertEqual([], app_server.start_calls)

    def test_paginated_history_reconciles_persisted_steer_after_restart(self):
        self.bind()
        sequence = self.add_poke("message-1", "Start T-all-2420")
        poke = self.store.peek_next(self.config)
        self.store.begin_delivery(
            self.config, poke, "thread-root", bridge.BRIDGE_CONSUMER
        )
        self.store.record_sending_turn(
            self.config,
            sequence,
            "thread-root",
            "message-1",
            "turn-steered",
        )

        class PaginatedAppServer(FakeAppServer):
            def __init__(self):
                super().__init__(status="idle")

            def thread_read(self, thread_id, include_turns):
                if include_turns:
                    self.read_calls.append((thread_id, include_turns))
                    raise bridge.AppServerRequestError(
                        "paginated threads do not support "
                        "thread/read(includeTurns=true)",
                        -32600,
                    )
                result = super().thread_read(thread_id, include_turns)
                result["historyMode"] = "paginated"
                return result

            def thread_turns_list(
                self,
                thread_id,
                cursor,
                limit,
                sort_direction,
                items_view,
            ):
                self.turn_list_calls.append(
                    (
                        thread_id,
                        cursor,
                        limit,
                        sort_direction,
                        items_view,
                    )
                )
                if cursor is None:
                    return {
                        "data": [
                            {
                                "id": "turn-newer",
                                "status": "completed",
                                "itemsView": "full",
                                "items": [],
                            }
                        ],
                        "nextCursor": "older-page",
                        "backwardsCursor": None,
                    }
                self.assertEqual_for_test("older-page", cursor)
                return {
                    "data": [
                        {
                            "id": "turn-steered",
                            "status": "completed",
                            "itemsView": "full",
                            "items": [
                                {
                                    "type": "userMessage",
                                    "clientId": "message-1",
                                }
                            ],
                        }
                    ],
                    "nextCursor": None,
                    "backwardsCursor": None,
                }

            @staticmethod
            def assertEqual_for_test(expected, actual):
                if expected != actual:
                    raise AssertionError(
                        "{} != {}".format(expected, actual)
                    )

        app_server = PaginatedAppServer()
        result = bridge.BridgeEngine(
            self.store, app_server, self.config
        ).step()

        self.assertEqual("reconciled", result.action)
        self.assertEqual("turn-steered", result.turn_id)
        self.assertEqual(sequence, self.store.consumer_cursor(self.config))
        self.assertEqual(
            [
                (
                    "thread-root",
                    None,
                    bridge.TURN_HISTORY_PAGE_SIZE,
                    "desc",
                    "full",
                ),
                (
                    "thread-root",
                    "older-page",
                    bridge.TURN_HISTORY_PAGE_SIZE,
                    "desc",
                    "full",
                ),
            ],
            app_server.turn_list_calls,
        )
        self.assertEqual([], app_server.start_calls)
        self.assertEqual([], app_server.steer_calls)

    def test_paginated_history_detects_duplicate_client_id_after_target(self):
        self.bind()
        sequence = self.add_poke("message-1", "Start T-all-2420")
        poke = self.store.peek_next(self.config)
        self.store.begin_delivery(
            self.config, poke, "thread-root", bridge.BRIDGE_CONSUMER
        )
        self.store.record_sending_turn(
            self.config,
            sequence,
            "thread-root",
            "message-1",
            "turn-steered",
        )

        class DuplicatePaginatedAppServer(FakeAppServer):
            def thread_read(self, thread_id, include_turns):
                if include_turns:
                    raise bridge.AppServerRequestError(
                        "thread history is paginated", -32600
                    )
                return super().thread_read(thread_id, include_turns)

            def thread_turns_list(
                self,
                thread_id,
                cursor,
                limit,
                sort_direction,
                items_view,
            ):
                self.turn_list_calls.append(cursor)
                if cursor is None:
                    return {
                        "data": [
                            {
                                "id": "turn-steered",
                                "status": "completed",
                                "itemsView": "full",
                                "items": [
                                    {
                                        "type": "userMessage",
                                        "clientId": "message-1",
                                    }
                                ],
                            }
                        ],
                        "nextCursor": "older",
                    }
                return {
                    "data": [
                        {
                            "id": "turn-older-retry",
                            "status": "completed",
                            "itemsView": "full",
                            "items": [
                                {
                                    "type": "userMessage",
                                    "clientId": "message-1",
                                }
                            ],
                        }
                    ],
                    "nextCursor": None,
                }

        app_server = DuplicatePaginatedAppServer(status="idle")
        result = bridge.BridgeEngine(
            self.store, app_server, self.config
        ).step()

        self.assertEqual("unhealthy", result.action)
        self.assertIn("duplicate user messages", result.error)
        self.assertEqual([None, "older"], app_server.turn_list_calls)
        self.assertEqual(0, self.store.consumer_cursor(self.config))

    def test_paginated_history_requires_full_items_and_next_cursor(self):
        class PaginatedAppServer(FakeAppServer):
            page = {}

            def thread_read(self, thread_id, include_turns):
                if include_turns:
                    raise bridge.AppServerRequestError(
                        "paginated threads do not support "
                        "thread/read(includeTurns=true)",
                        -32600,
                    )
                return super().thread_read(thread_id, include_turns)

            def thread_turns_list(
                self,
                thread_id,
                cursor,
                limit,
                sort_direction,
                items_view,
            ):
                return copy.deepcopy(self.page)

        malformed_pages = (
            {
                "data": [
                    {
                        "id": "turn-summary",
                        "status": "completed",
                        "itemsView": "summary",
                        "items": [],
                    }
                ],
                "nextCursor": None,
            },
            {"data": []},
        )
        for page in malformed_pages:
            with self.subTest(page=page):
                app_server = PaginatedAppServer(status="idle")
                app_server.page = page
                thread, failure = bridge.BridgeEngine(
                    self.store, app_server, self.config
                )._read_thread("thread-root", include_turns=True)

                self.assertIsNone(thread)
                self.assertEqual("unhealthy", failure.action)

    def test_definitive_steer_rejection_retries_as_start_when_idle(self):
        self.bind()
        sequence = self.add_poke("message-1", "Start T-all-2420")
        app_server = FakeAppServer(status="active")
        app_server.steer_outcomes.append(
            bridge.AppServerRequestError(
                "no active turn to steer", -32600
            )
        )
        engine = self.committed_start_engine(app_server)

        first = engine.step()

        self.assertEqual("steer_rejected", first.action)
        self.assertEqual(
            "pending", self.store.delivery_state(self.config, sequence)
        )
        self.assertEqual(0, self.store.consumer_cursor(self.config))
        app_server.thread["status"] = {"type": "idle"}
        app_server.thread["turns"][0]["status"] = "completed"

        second = engine.step()

        self.assertEqual("accepted", second.action)
        self.assertEqual(sequence, self.store.consumer_cursor(self.config))
        self.assertEqual(1, len(app_server.steer_calls))
        self.assertEqual(
            [("thread-root", "Start T-all-2420", "message-1")],
            app_server.start_calls,
        )

    def test_stale_expected_turn_retries_once_like_codex_tui(self):
        sequence = self.add_poke("message-1", "Start T-all-2420")
        app_server = FakeAppServer(
            thread_id="root-live", status="active"
        )
        app_server.steer_outcomes.append(
            bridge.AppServerRequestError(
                "expected active turn id `turn-stale` but found "
                "`turn-live`",
                -32600,
            )
        )
        result = bridge.BridgeEngine(
            self.store,
            app_server,
            self.config,
            observed_turn_id=lambda _thread_id, _message_id: "turn-live",
        ).step(
            bridge.RootSnapshot(
                "root-live", 2, 1, active_turn_id="turn-stale"
            )
        )

        self.assertEqual("steered", result.action)
        self.assertEqual("turn-live", result.turn_id)
        self.assertEqual(sequence, self.store.consumer_cursor(self.config))
        self.assertEqual(
            ["turn-stale", "turn-live"],
            [call[1] for call in app_server.steer_calls],
        )

    def test_interrupted_unprocessed_steer_retries_as_new_turn(self):
        self.bind()
        sequence = self.add_poke("message-1", "Start T-all-2420")
        app_server = FakeAppServer(status="active")
        engine = self.committed_start_engine(app_server)

        queued = engine.step()

        self.assertEqual("steer_queued", queued.action)
        self.assertEqual(0, self.store.consumer_cursor(self.config))
        self.assertEqual(
            "sending", self.store.delivery_state(self.config, sequence)
        )

        # Codex accepted the steer into its pending-input queue, but a human
        # interrupt cleared that queue before a userMessage item was emitted.
        app_server.thread["status"] = {"type": "idle"}
        app_server.thread["turns"][0]["status"] = "interrupted"
        absent = engine.step()

        self.assertEqual("retry_pending", absent.action)
        self.assertEqual(
            "pending", self.store.delivery_state(self.config, sequence)
        )

        retried = engine.step()

        self.assertEqual("accepted", retried.action)
        self.assertEqual(sequence, self.store.consumer_cursor(self.config))
        self.assertEqual(1, len(app_server.steer_calls))
        self.assertEqual(
            [("thread-root", "Start T-all-2420", "message-1")],
            app_server.start_calls,
        )

    def test_live_commit_during_absence_confirmation_prevents_retry(self):
        self.bind()
        sequence = self.add_poke("message-1", "Start T-all-2420")
        poke = self.store.peek_next(self.config)
        self.store.begin_delivery(
            self.config, poke, "thread-root", bridge.BRIDGE_CONSUMER
        )
        self.store.record_sending_turn(
            self.config,
            sequence,
            "thread-root",
            "message-1",
            "turn-steered",
        )
        observed = {}

        class RacingCommitAppServer(FakeAppServer):
            def __init__(self):
                super().__init__(status="idle")
                self.history_reads = 0

            def thread_read(self, thread_id, include_turns):
                result = super().thread_read(thread_id, include_turns)
                if include_turns:
                    self.history_reads += 1
                    if self.history_reads == 1:
                        observed[
                            ("thread-root", "message-1")
                        ] = "turn-steered"
                return result

        app_server = RacingCommitAppServer()
        result = bridge.BridgeEngine(
            self.store,
            app_server,
            self.config,
            observed_turn_id=lambda thread_id, message_id: observed.get(
                (thread_id, message_id)
            ),
        ).step()

        self.assertEqual("reconciled", result.action)
        self.assertEqual(1, app_server.history_reads)
        self.assertEqual(sequence, self.store.consumer_cursor(self.config))
        self.assertEqual([], app_server.start_calls)
        self.assertEqual([], app_server.steer_calls)

    def test_nonsteerable_turn_defers_without_hot_loop_then_starts(self):
        self.bind()
        sequence = self.add_poke("message-1", "Start T-all-2420")
        app_server = FakeAppServer(status="active")
        app_server.steer_outcomes.append(
            bridge.AppServerRequestError(
                "cannot steer a review turn",
                -32600,
                {
                    "message": "cannot steer a review turn",
                    "codexErrorInfo": {
                        "activeTurnNotSteerable": {
                            "turnKind": "review"
                        }
                    },
                    "additionalDetails": None,
                },
            )
        )
        first_engine = bridge.BridgeEngine(
            self.store, app_server, self.config
        )

        first = first_engine.step()

        self.assertEqual("nonsteerable", first.action)
        self.assertEqual("turn-active", first.turn_id)
        self.assertEqual(
            "pending", self.store.delivery_state(self.config, sequence)
        )

        deferred_engine = self.committed_start_engine(
            app_server,
            deferred_steer_turn_id=first.turn_id,
        )
        second = deferred_engine.step()

        self.assertEqual("busy_nonsteerable", second.action)
        self.assertEqual(1, len(app_server.steer_calls))
        self.assertEqual(0, self.store.consumer_cursor(self.config))

        app_server.thread["status"] = {"type": "idle"}
        app_server.thread["turns"][0]["status"] = "completed"
        third = deferred_engine.step()

        self.assertEqual("accepted", third.action)
        self.assertEqual(sequence, self.store.consumer_cursor(self.config))
        self.assertEqual(1, len(app_server.steer_calls))
        self.assertEqual(1, len(app_server.start_calls))

    def test_mismatched_steer_response_remains_sending(self):
        self.bind()
        sequence = self.add_poke("message-1", "Start T-all-2420")
        app_server = FakeAppServer(status="active")
        app_server.steer_outcomes.append({"turnId": "turn-other"})

        result = bridge.BridgeEngine(
            self.store, app_server, self.config
        ).step()

        self.assertEqual("ambiguous", result.action)
        self.assertIn("expectedTurnId", result.error)
        self.assertEqual(
            "sending", self.store.delivery_state(self.config, sequence)
        )
        self.assertEqual(0, self.store.consumer_cursor(self.config))
        self.assertEqual(1, len(app_server.steer_calls))

    def test_malformed_active_turn_history_fails_closed(self):
        self.bind()
        sequence = self.add_poke("message-1", "Start T-all-2420")
        malformed_histories = (
            [],
            [
                {
                    "id": "turn-complete",
                    "status": "completed",
                    "items": [],
                }
            ],
            [
                {
                    "id": "turn-a",
                    "status": "inProgress",
                    "items": [],
                },
                {
                    "id": "turn-b",
                    "status": "inProgress",
                    "items": [],
                },
            ],
        )

        for turns in malformed_histories:
            with self.subTest(turns=turns):
                app_server = FakeAppServer(status="active")
                app_server.thread["turns"] = copy.deepcopy(turns)
                result = bridge.BridgeEngine(
                    self.store, app_server, self.config
                ).step()
                self.assertIn(
                    result.action, ("busy_untracked", "unhealthy")
                )
                self.assertEqual(
                    0, self.store.consumer_cursor(self.config)
                )
                self.assertIsNone(
                    self.store.delivery_state(self.config, sequence)
                )
                self.assertEqual([], app_server.steer_calls)
                self.assertEqual([], app_server.start_calls)

    def test_malformed_ambiguous_history_never_proves_absence(self):
        self.bind()
        sequence = self.add_poke("message-1", "Start J-all-369")
        poke = self.store.peek_next(self.config)
        self.store.begin_delivery(
            self.config, poke, "thread-root", bridge.BRIDGE_CONSUMER
        )

        malformed_histories = (
            None,
            [{"id": "turn-1"}],
            [{"id": "turn-1", "items": [None]}],
            [{"id": None, "items": []}],
            [{"id": "turn-1", "items": [{}]}],
            [
                {
                    "id": "turn-1",
                    "items": [
                        {
                            "type": "userMessage",
                            "clientId": True,
                        }
                    ],
                }
            ],
            [
                {
                    "id": None,
                    "items": [
                        {
                            "type": "userMessage",
                            "clientId": "message-1",
                        }
                    ],
                }
            ],
        )
        for history in malformed_histories:
            with self.subTest(history=history):
                app_server = FakeAppServer()
                if history is None:
                    app_server.thread.pop("turns")
                else:
                    app_server.thread["turns"] = history
                result = bridge.BridgeEngine(
                    self.store, app_server, self.config
                ).step()
                self.assertEqual("unhealthy", result.action)
                self.assertEqual(
                    "sending",
                    self.store.delivery_state(self.config, sequence),
                )
                self.assertEqual(0, self.store.consumer_cursor(self.config))
                self.assertEqual([], app_server.start_calls)

    def test_reconciliation_requires_exact_root_identity_cwd_and_status(self):
        self.bind()
        sequence = self.add_poke("message-1", "Start J-all-369")
        poke = self.store.peek_next(self.config)
        self.store.begin_delivery(
            self.config, poke, "thread-root", bridge.BRIDGE_CONSUMER
        )

        mutations = (
            lambda thread: thread.__setitem__("sessionId", "other"),
            lambda thread: thread.__setitem__("parentThreadId", "parent"),
            lambda thread: thread.__setitem__("cwd", "/other"),
            lambda thread: thread.__setitem__("status", "idle"),
        )
        for mutate in mutations:
            with self.subTest(mutate=mutate):
                app_server = FakeAppServer()
                mutate(app_server.thread)
                result = bridge.BridgeEngine(
                    self.store, app_server, self.config
                ).step()
                self.assertEqual("unhealthy", result.action)
                self.assertEqual(
                    "sending",
                    self.store.delivery_state(self.config, sequence),
                )
                self.assertEqual(0, self.store.consumer_cursor(self.config))
                self.assertEqual([], app_server.start_calls)

    def test_relay_snapshot_reconciles_recorded_old_root_after_switch(self):
        sequence = self.add_poke("message-1", "Start J-all-369")
        poke = self.store.peek_next(self.config)
        self.store.begin_delivery(
            self.config, poke, "root-old", bridge.BRIDGE_CONSUMER
        )
        app_server = FakeAppServer(thread_id="root-old")
        app_server.thread["turns"] = [
            {
                "id": "accepted-on-old-root",
                "items": [
                    {
                        "type": "userMessage",
                        "clientId": "message-1",
                    }
                ],
            }
        ]

        result = bridge.BridgeEngine(
            self.store, app_server, self.config
        ).step(bridge.RootSnapshot("root-new", 4, 1))

        self.assertEqual("reconciled", result.action)
        self.assertEqual("accepted-on-old-root", result.turn_id)
        self.assertEqual(sequence, self.store.consumer_cursor(self.config))
        self.assertEqual([("root-old", True)], app_server.read_calls)
        self.assertEqual([], app_server.start_calls)

    def test_relay_snapshot_delivers_without_persisted_binding(self):
        sequence = self.add_poke("message-1", "Start J-all-369")
        app_server = FakeAppServer(thread_id="root-live")

        result = self.committed_start_engine(app_server).step(
            bridge.RootSnapshot("root-live", 2, 1)
        )

        self.assertEqual("accepted", result.action)
        self.assertEqual(sequence, self.store.consumer_cursor(self.config))
        self.assertEqual(
            [("root-live", "Start J-all-369", "message-1")],
            app_server.start_calls,
        )

    def test_idle_read_defers_provisional_primary_admission(self):
        sequence = self.add_poke("message-1", "Start J-all-369")
        app_server = FakeAppServer(thread_id="root-live")
        engine = bridge.BridgeEngine(
            self.store, app_server, self.config
        )

        review_gap = engine.step(
            bridge.RootSnapshot(
                "root-live",
                2,
                1,
                active_turn_id="turn-review",
                admission_pending=True,
            )
        )

        self.assertEqual("busy_provisional", review_gap.action)
        self.assertEqual("turn-review", review_gap.turn_id)
        self.assertIsNone(self.store.consumer_cursor(self.config))
        self.assertIsNone(
            self.store.delivery_state(self.config, sequence)
        )
        self.assertEqual([], app_server.start_calls)
        self.assertEqual([], app_server.steer_calls)

        compact_gap = engine.step(
            bridge.RootSnapshot(
                "root-live",
                2,
                1,
                active_turn_id=None,
                admission_pending=True,
            )
        )

        self.assertEqual("busy_provisional", compact_gap.action)
        self.assertEqual([], app_server.start_calls)

    def test_binding_switch_during_ambiguous_read_defers_cursor_ack(self):
        self.bind("root-b")
        sequence = self.add_poke("message-1", "Start J-all-369")
        poke = self.store.peek_next(self.config)
        self.store.begin_delivery(
            self.config, poke, "root-b", bridge.BRIDGE_CONSUMER
        )
        test_case = self

        class SwitchingAppServer(FakeAppServer):
            def __init__(self):
                super().__init__(thread_id="root-b")
                self.thread["turns"] = [
                    {
                        "id": "accepted-before-switch",
                        "items": [
                            {
                                "type": "userMessage",
                                "clientId": "message-1",
                            }
                        ],
                    }
                ]

            def thread_read(self, thread_id, include_turns):
                result = super().thread_read(thread_id, include_turns)
                test_case.store.bind(
                    test_case.config,
                    "root-c",
                    test_case.config.cwd,
                    promoted=False,
                    allow_replace=True,
                )
                return result

        result = bridge.BridgeEngine(
            self.store, SwitchingAppServer(), self.config
        ).step()

        self.assertEqual("binding_changed", result.action)
        self.assertEqual(0, self.store.consumer_cursor(self.config))
        self.assertEqual(
            "sending", self.store.delivery_state(self.config, sequence)
        )

    def test_legacy_inflight_attempt_retries_after_absence(self):
        self.bind()
        sequence = self.add_poke("message-1", "Start J-all-369")
        poke = self.store.peek_next(self.config)
        self.store.begin_delivery(
            self.config, poke, "thread-root"
        )
        app_server = FakeAppServer(status="active")
        engine = self.committed_start_engine(app_server)

        self.assertEqual("retry_pending", engine.step().action)
        self.assertEqual(0, self.store.consumer_cursor(self.config))
        self.assertEqual([], app_server.start_calls)

        app_server.thread["status"] = {"type": "idle"}
        result = engine.step()
        self.assertEqual("accepted", result.action)
        self.assertEqual(sequence, self.store.consumer_cursor(self.config))
        self.assertEqual(2, self.delivery_attempts(sequence))
        self.assertEqual(1, len(app_server.start_calls))

    def test_retained_backlog_is_delivered_once_without_startup_cutoff(self):
        self.bind()
        sequences = [
            self.add_poke("message-{}".format(index), prompt)
            for index, prompt in enumerate(
                (
                    "Start J-all-1",
                    "Responded Q-all-2",
                    "Start B-all-3",
                ),
                start=1,
            )
        ]
        app_server = FakeAppServer()
        engine = self.committed_start_engine(app_server)

        results = [engine.step(), engine.step(), engine.step()]

        self.assertEqual(["accepted"] * 3, [item.action for item in results])
        self.assertEqual(
            ["message-1", "message-2", "message-3"],
            [call[2] for call in app_server.start_calls],
        )
        self.assertEqual(
            ["Start J-all-1", "Responded Q-all-2", "Start B-all-3"],
            [call[1] for call in app_server.start_calls],
        )
        self.assertEqual(sequences[-1], self.store.consumer_cursor(self.config))
        self.assertEqual("empty", engine.step().action)
        self.assertEqual(3, len(app_server.start_calls))

    def test_startup_cutoff_skips_backlog_but_delivers_later_poke(self):
        self.bind()
        first = self.add_poke("old-1", "Start J-old-1")
        second = self.add_poke("old-2", "Start J-old-2")
        self.store.initialize_consumer(self.config, "default")

        cutoff = self.store.ignore_existing_pokes(self.config)

        self.assertEqual(second, cutoff)
        self.assertEqual(second, self.store.consumer_cursor(self.config))
        self.assertEqual(0, self.store.consumer_cursor(
            self.config, "default"
        ))
        with self.store.connect() as connection:
            retained = connection.execute(
                """
                SELECT sequence, message_id
                FROM poke_messages
                WHERE environment = ? AND workspace_id = ?
                ORDER BY sequence
                """,
                (
                    self.config.environment,
                    self.config.workspace_id,
                ),
            ).fetchall()
        self.assertEqual(
            [(first, "old-1"), (second, "old-2")],
            [(row["sequence"], row["message_id"]) for row in retained],
        )
        app_server = FakeAppServer()
        engine = self.committed_start_engine(app_server)
        self.assertEqual("empty", engine.step().action)
        self.assertEqual([], app_server.start_calls)

        third = self.add_poke("new-3", "Start J-new-3")
        result = engine.step()

        self.assertEqual("accepted", result.action)
        self.assertEqual(third, self.store.consumer_cursor(self.config))
        self.assertEqual(
            [("thread-root", "Start J-new-3", "new-3")],
            app_server.start_calls,
        )
        self.assertEqual(
            first,
            self.store.peek_next(self.config, "default").sequence,
        )

    def test_ignore_existing_pokes_terminalizes_stale_deliveries(self):
        self.bind()
        first = self.add_poke("old-1", "Start J-old-1")
        second = self.add_poke("old-2", "Start J-old-2")
        first_poke = self.store.peek_next(self.config)
        self.store.begin_delivery(
            self.config, first_poke, "thread-old"
        )
        self.store.mark_pending(
            self.config, first, "old delivery was not accepted"
        )
        self.store.begin_delivery(
            self.config,
            bridge.Poke(second, "old-2", "Start J-old-2"),
            "thread-old",
        )
        notice_id = self.store.enqueue_update_notice(
            self.config, "Update available"
        )
        # Ambiguous delivery records can outlive their retained inbox rows.
        with self.store.connect() as connection:
            connection.execute(
                """
                DELETE FROM poke_messages
                WHERE environment = ? AND workspace_id = ?
                """,
                (
                    self.config.environment,
                    self.config.workspace_id,
                ),
            )

        cutoff = self.store.ignore_existing_pokes(self.config)

        self.assertEqual(second, cutoff)
        self.assertEqual(
            "skipped", self.store.delivery_state(self.config, first)
        )
        self.assertEqual(
            "skipped", self.store.delivery_state(self.config, second)
        )
        self.assertEqual(
            "pending", self.store.update_notice_state(self.config, notice_id)
        )
        third = self.add_poke("new-3", "Start J-new-3")
        app_server = FakeAppServer()
        result = self.committed_start_engine(app_server).step()
        self.assertEqual("accepted", result.action)
        self.assertEqual(third, self.store.consumer_cursor(self.config))
        self.assertEqual(
            [("thread-root", "Start J-new-3", "new-3")],
            app_server.start_calls,
        )
        self.assertEqual(
            "pending", self.store.update_notice_state(self.config, notice_id)
        )

    def test_first_bridge_cursor_ignores_independent_default_cursor(self):
        first = self.add_poke("old-1", "Start J-old-1")
        second = self.add_poke("old-2", "Start J-old-2")
        third = self.add_poke("new-3", "Start J-new-3")
        with self.store.connect() as connection:
            connection.execute(
                """
                INSERT INTO poke_consumers
                    (environment, workspace_id, consumer, last_sequence,
                     updated_at)
                VALUES (?, ?, 'default', ?, ?)
                """,
                (
                    self.config.environment,
                    self.config.workspace_id,
                    second,
                    self.clock(),
                ),
            )

        poke = self.store.peek_next(self.config)

        self.assertEqual(first, poke.sequence)
        self.assertEqual(0, self.store.consumer_cursor(self.config))
        self.assertNotEqual(third, poke.sequence)

    def test_first_bridge_cursor_is_zero_without_default_consumer(self):
        first = self.add_poke("pending-1", "Start J-pending-1")
        poke = self.store.peek_next(self.config)
        self.assertEqual(first, poke.sequence)
        self.assertEqual(0, self.store.consumer_cursor(self.config))

    def test_bridge_ack_does_not_advance_independent_default_cursor(self):
        self.bind()
        first = self.add_poke("default-seen", "Start J-old")
        second = self.add_poke("bridge-next", "Start J-bridge")
        with self.store.connect() as connection:
            connection.execute(
                """
                INSERT INTO poke_consumers
                    (environment, workspace_id, consumer, last_sequence,
                     updated_at)
                VALUES (?, ?, 'default', ?, ?)
                """,
                (
                    self.config.environment,
                    self.config.workspace_id,
                    first,
                    self.clock(),
                ),
            )
        app_server = FakeAppServer()
        engine = self.committed_start_engine(app_server)
        results = (engine.step(), engine.step())
        with self.store.connect() as connection:
            default_cursor = connection.execute(
                """
                SELECT last_sequence
                FROM poke_consumers
                WHERE environment = ? AND workspace_id = ?
                  AND consumer = 'default'
                """,
                (
                    self.config.environment,
                    self.config.workspace_id,
                ),
            ).fetchone()["last_sequence"]
        self.assertEqual(["accepted", "accepted"], [
            result.action for result in results
        ])
        self.assertEqual(second, self.store.consumer_cursor(self.config))
        self.assertEqual(first, default_cursor)
        self.assertEqual(2, len(app_server.start_calls))

    def test_receiver_absence_and_death_do_not_claim_or_send(self):
        self.bind()
        sequence = self.add_poke("message-1", "Start J-all-369")
        app_server = FakeAppServer()

        before_peek = bridge.BridgeEngine(
            self.store,
            app_server,
            self.config,
            may_deliver=lambda: False,
        ).step()
        self.assertEqual("orphaned", before_peek.action)
        self.assertIsNone(self.store.consumer_cursor(self.config))
        self.assertEqual([], app_server.start_calls)

        checks = iter((True, False))
        before_send = bridge.BridgeEngine(
            self.store,
            app_server,
            self.config,
            may_deliver=lambda: next(checks),
        ).step()
        self.assertEqual("orphaned", before_send.action)
        self.assertIsNone(self.store.consumer_cursor(self.config))
        self.assertIsNone(
            self.store.delivery_state(self.config, sequence)
        )
        self.assertEqual([], app_server.start_calls)

        # If the receiver dies after the peek but just before turn/start, the
        # reservation is released to pending and the cursor still does not
        # advance.
        checks = iter((True, True, True, False))
        at_send = bridge.BridgeEngine(
            self.store,
            app_server,
            self.config,
            may_deliver=lambda: next(checks),
        ).step()
        self.assertEqual("orphaned", at_send.action)
        self.assertEqual(0, self.store.consumer_cursor(self.config))
        self.assertEqual(
            "pending", self.store.delivery_state(self.config, sequence)
        )
        self.assertEqual([], app_server.start_calls)

    def test_receiver_death_after_accept_keeps_sending_for_reconciliation(self):
        sequence = self.add_poke("message-1", "Start J-all-369")
        receiver_live = [True]

        class DiesAfterAccept(FakeAppServer):
            def turn_start(self, thread_id, text, message_id):
                result = super().turn_start(thread_id, text, message_id)
                receiver_live[0] = False
                return result

        app_server = DiesAfterAccept(thread_id="root-live")
        engine = self.committed_start_engine(
            app_server,
            may_deliver=lambda: receiver_live[0],
        )
        first = engine.step(bridge.RootSnapshot("root-live", 1, 1))

        self.assertEqual("orphaned_after_accept", first.action)
        self.assertEqual("turn-1", first.turn_id)
        self.assertEqual(0, self.store.consumer_cursor(self.config))
        self.assertEqual(
            "sending", self.store.delivery_state(self.config, sequence)
        )

        receiver_live[0] = True
        app_server.thread["turns"] = [
            {
                "id": "turn-1",
                "items": [
                    {
                        "type": "userMessage",
                        "clientId": "message-1",
                    }
                ],
            }
        ]
        reconciled = engine.step(
            bridge.RootSnapshot("root-next", 2, 1)
        )
        self.assertEqual("reconciled", reconciled.action)
        self.assertEqual(sequence, self.store.consumer_cursor(self.config))
        self.assertEqual(1, len(app_server.start_calls))

    def test_poke_waits_for_primary_uclusion_startup_before_delivery(self):
        sequence = self.add_poke("message-1", "Start J-all-373")
        authority = bridge.RootAuthority(
            self.config.cwd, gate_mcp_startup=True
        )
        authority.driver_connected(
            bridge.INITIAL_DRIVER_CONNECTION_ID
        )
        self.assertTrue(authority.claim_primary(1))
        gate = authority.begin_tui_request(
            1, "thread/start", {"cwd": self.config.cwd}
        )
        lifecycle_epoch = authority.connection_root_subscribed(
            1, "root-live"
        )
        authority.driver_thread_pinned(
            "root-live", lifecycle_epoch
        )
        driver_sequence_cut = authority.driver_handoff_cut("root-live")
        authority.handoff_origin_startup_to_driver(
            1,
            "root-live",
            driver_sequence_cut,
            lifecycle_epoch,
        )
        authority.record_root_handoff_complete(
            gate, "root-live", lifecycle_epoch
        )
        authority.finish_tui_request(
            gate,
            {
                "id": "root",
                "result": {
                    "thread": {
                        "id": "root-live",
                        "sessionId": "root-live",
                        "parentThreadId": None,
                        "cwd": self.config.cwd,
                    },
                    "cwd": self.config.cwd,
                },
            },
        )
        app_server = FakeAppServer(thread_id="root-live")
        engine = self.committed_start_engine(app_server)

        def assert_waiting_for_startup():
            with authority.delivery_lease(lambda: True) as snapshot:
                self.assertIsNone(snapshot)
            self.assertIsNone(self.store.consumer_cursor(self.config))
            self.assertIsNone(
                self.store.delivery_state(self.config, sequence)
            )
            self.assertEqual([], app_server.start_calls)

        assert_waiting_for_startup()

        authority.observe_notification(
            1,
            {
                "method": "mcpServer/startupStatus/updated",
                "params": {
                    "threadId": "root-live",
                    "name": "codex_apps",
                    "status": "ready",
                    "error": None,
                    "failureReason": None,
                },
            },
        )
        assert_waiting_for_startup()

        authority.observe_notification(
            1,
            {
                "method": "mcpServer/startupStatus/updated",
                "params": {
                    "threadId": "root-live",
                    "name": "Uclusion",
                    "status": "ready",
                    "error": None,
                    "failureReason": None,
                },
            },
        )

        with authority.delivery_lease(lambda: True) as snapshot:
            self.assertIsNotNone(snapshot)
            result = engine.step(snapshot)

        self.assertEqual("accepted", result.action)
        self.assertEqual(sequence, self.store.consumer_cursor(self.config))
        self.assertEqual(
            [("root-live", "Start J-all-373", "message-1")],
            app_server.start_calls,
        )
        with authority.delivery_lease(lambda: True) as snapshot:
            self.assertIsNotNone(snapshot)
            duplicate = engine.step(snapshot)
        self.assertEqual("empty", duplicate.action)
        self.assertEqual(1, len(app_server.start_calls))

    def test_authority_commit_serializes_ack_with_root_invalidation(self):
        authority = bridge.RootAuthority(self.config.cwd)
        self.assertTrue(authority.claim_primary(1))
        gate = authority.begin_tui_request(
            1, "thread/start", {"cwd": self.config.cwd}
        )
        authority.finish_tui_request(
            gate,
            {
                "id": "root",
                "result": {
                    "thread": {
                        "id": "root-live",
                        "sessionId": "root-live",
                        "parentThreadId": None,
                        "cwd": self.config.cwd,
                    },
                    "cwd": self.config.cwd,
                },
            },
        )

        commit_entered = threading.Event()
        release_commit = threading.Event()
        invalidated = threading.Event()
        committed = []

        def commit():
            commit_entered.set()
            release_commit.wait(1)
            committed.append(True)

        with authority.delivery_lease(lambda: True) as snapshot:
            self.assertIsNotNone(snapshot)
            result = {}

            def run_commit():
                result["value"] = authority.commit_if_current(
                    snapshot, lambda: True, commit
                )

            commit_thread = threading.Thread(target=run_commit)
            commit_thread.start()
            self.assertTrue(commit_entered.wait(1))

            def invalidate():
                authority.observe_notification(
                    1,
                    {
                        "method": "thread/closed",
                        "params": {"threadId": "root-live"},
                    },
                )
                invalidated.set()

            invalidator = threading.Thread(target=invalidate)
            invalidator.start()
            self.assertFalse(invalidated.wait(0.05))
            release_commit.set()
            commit_thread.join(1)
            invalidator.join(1)

        self.assertTrue(result["value"])
        self.assertEqual([True], committed)
        self.assertTrue(invalidated.is_set())
        self.assertIsNone(authority.current_snapshot())

    def test_authority_revocation_before_commit_leaves_callback_unrun(self):
        authority = bridge.RootAuthority(self.config.cwd)
        self.assertTrue(authority.claim_primary(1))
        gate = authority.begin_tui_request(
            1, "thread/start", {"cwd": self.config.cwd}
        )
        authority.finish_tui_request(
            gate,
            {
                "id": "root",
                "result": {
                    "thread": {
                        "id": "root-live",
                        "sessionId": "root-live",
                        "parentThreadId": None,
                        "cwd": self.config.cwd,
                    },
                    "cwd": self.config.cwd,
                },
            },
        )
        committed = []
        with authority.delivery_lease(lambda: True) as snapshot:
            authority.observe_notification(
                1,
                {
                    "method": "thread/closed",
                    "params": {"threadId": "root-live"},
                },
            )
            self.assertFalse(
                authority.commit_if_current(
                    snapshot, lambda: True, lambda: committed.append(True)
                )
            )
        self.assertEqual([], committed)

    def test_update_notice_is_distinct_and_does_not_advance_poke_cursor(self):
        self.bind()
        with self.store.connect() as connection:
            connection.execute(
                """
                INSERT INTO poke_consumers
                    (environment, workspace_id, consumer, last_sequence,
                     updated_at)
                VALUES (?, ?, 'default', 42, ?)
                """,
                (
                    self.config.environment,
                    self.config.workspace_id,
                    self.clock(),
                ),
            )
        self.store.initialize_consumer(self.config)
        before = self.store.consumer_cursor(self.config)
        notice_text = (
            "[Uclusion update notice — from the local update check, not "
            "workspace data] A newer release is available."
        )
        notice_id = self.store.enqueue_update_notice(
            self.config, notice_text
        )
        app_server = FakeAppServer()

        result = self.committed_start_engine(app_server).step()

        self.assertEqual("accepted_update_notice", result.action)
        self.assertEqual(before, self.store.consumer_cursor(self.config))
        self.assertEqual(
            "accepted",
            self.store.update_notice_state(self.config, notice_id),
        )
        self.assertEqual(
            [("thread-root", notice_text, notice_id)],
            app_server.start_calls,
        )
        self.assertTrue(notice_id.startswith("uclusion-update-notice:"))

    def test_update_notice_waits_for_commit_without_idle_retry(self):
        self.bind()
        self.store.initialize_consumer(self.config)
        notice_id = self.store.enqueue_update_notice(
            self.config, "[Uclusion update notice] restart required"
        )
        app_server = FakeAppServer()
        app_server.commit_start_responses = False
        engine = bridge.BridgeEngine(
            self.store, app_server, self.config
        )

        queued = engine.step()
        waiting = engine.step()

        self.assertEqual("update_notice_queued", queued.action)
        self.assertEqual("awaiting_update_notice_commit", waiting.action)
        self.assertEqual(1, len(app_server.start_calls))
        sending = self.store.get_sending_update_notice(self.config)
        self.assertEqual("turn-1", sending.turn_id)
        self.assertEqual(self.config.instance, sending.attempt_instance)
        self.assertEqual(
            "sending",
            self.store.update_notice_state(self.config, notice_id),
        )

        app_server.thread["turns"] = [
            {
                "id": "turn-1",
                "status": "completed",
                "items": [
                    {
                        "type": "userMessage",
                        "clientId": notice_id,
                    }
                ],
            }
        ]
        committed = engine.step()

        self.assertEqual(
            "reconciled_update_notice", committed.action
        )
        self.assertEqual(
            "accepted",
            self.store.update_notice_state(self.config, notice_id),
        )
        self.assertEqual(1, len(app_server.start_calls))

    def test_ambiguous_update_notice_reconciles_without_poke_ack(self):
        self.bind()
        self.store.initialize_consumer(self.config)
        notice_text = "[Uclusion update notice] restart required"
        notice_id = self.store.enqueue_update_notice(
            self.config, notice_text
        )
        app_server = FakeAppServer()
        app_server.outcomes.append(
            bridge.AppServerTransportError("reset after notice write")
        )
        engine = bridge.BridgeEngine(self.store, app_server, self.config)

        first = engine.step()
        self.assertEqual("ambiguous_update_notice", first.action)
        self.assertEqual(
            "sending",
            self.store.update_notice_state(self.config, notice_id),
        )
        self.assertEqual(0, self.store.consumer_cursor(self.config))

        app_server.thread["turns"] = [
            {
                "id": "notice-turn",
                "items": [
                    {
                        "type": "userMessage",
                        "clientId": notice_id,
                        "content": [
                            {"type": "text", "text": notice_text}
                        ],
                    }
                ],
            }
        ]
        second = engine.step()
        self.assertEqual("reconciled_update_notice", second.action)
        self.assertEqual("notice-turn", second.turn_id)
        self.assertEqual(
            "accepted",
            self.store.update_notice_state(self.config, notice_id),
        )
        self.assertEqual(0, self.store.consumer_cursor(self.config))
        self.assertEqual(1, len(app_server.start_calls))


class PrimaryLockTests(BridgeTestCase):
    def test_one_fresh_primary_per_environment_and_workspace(self):
        first = dataclass_replace(self.config, instance="first")
        second = dataclass_replace(self.config, instance="second")
        self.store.pid_is_alive = lambda _pid: True

        self.assertTrue(self.store.acquire_primary(first, pid=101))
        self.assertFalse(self.store.acquire_primary(second, pid=202))
        self.store.release_primary(first, pid=101)
        self.assertTrue(self.store.acquire_primary(second, pid=202))

    def test_stale_live_primary_is_not_stolen_but_dead_pid_recovers(self):
        first = dataclass_replace(self.config, instance="first")
        second = dataclass_replace(self.config, instance="second")
        self.store.pid_is_alive = lambda _pid: True
        self.assertTrue(self.store.acquire_primary(first, pid=101))
        self.clock.advance(bridge.PRIMARY_STALE_SECONDS + 1)
        self.assertFalse(self.store.acquire_primary(second, pid=202))
        self.store.pid_is_alive = lambda _pid: False
        self.assertTrue(self.store.acquire_primary(second, pid=202))


class UpdateNoticeWorkerGateTests(unittest.TestCase):
    def test_revocation_stops_new_checks_and_sinks_inflight_result(self):
        source_started = threading.Event()
        release_source = threading.Event()
        sink_called = threading.Event()
        calls = []
        notices = []

        def source(environment):
            calls.append(environment)
            source_started.set()
            release_source.wait(1)
            return "update-notice"

        def sink(notice):
            notices.append(notice)
            sink_called.set()

        worker = bridge.UpdateNoticeWorker(
            "stage", source, interval=0.01, result_sink=sink
        )
        worker.set_enabled(True)
        worker.start()
        try:
            self.assertTrue(source_started.wait(1))
            worker.set_enabled(False)
            release_source.set()
            self.assertTrue(sink_called.wait(1))
            time.sleep(0.05)
        finally:
            release_source.set()
            worker.close()

        self.assertEqual(["stage"], calls)
        self.assertEqual(["update-notice"], notices)


def dataclass_replace(config, **changes):
    values = {
        field.name: getattr(config, field.name)
        for field in bridge.dataclasses.fields(config)
    }
    values.update(changes)
    return bridge.BridgeConfig(**values)


def read_exact(sock, size):
    data = bytearray()
    while len(data) < size:
        chunk = sock.recv(size - len(data))
        if not chunk:
            raise EOFError("socket closed")
        data.extend(chunk)
    return bytes(data)


def read_client_frame(sock):
    first, second = read_exact(sock, 2)
    opcode = first & 0x0F
    length = second & 0x7F
    if length == 126:
        length = struct.unpack("!H", read_exact(sock, 2))[0]
    elif length == 127:
        length = struct.unpack("!Q", read_exact(sock, 8))[0]
    if not second & 0x80:
        raise AssertionError("client WebSocket frames must be masked")
    mask = read_exact(sock, 4)
    payload = read_exact(sock, length)
    payload = bytes(
        byte ^ mask[index % 4] for index, byte in enumerate(payload)
    )
    return opcode, payload


def server_text_frame(message):
    payload = json.dumps(message, separators=(",", ":")).encode("utf-8")
    if len(payload) < 126:
        return bytes((0x81, len(payload))) + payload
    if len(payload) <= 0xFFFF:
        return bytes((0x81, 126)) + struct.pack("!H", len(payload)) + payload
    return bytes((0x81, 127)) + struct.pack("!Q", len(payload)) + payload


class FakeProxyProcess:
    def __init__(self, command, calls, extra_response_headers=""):
        self.command = command
        self.calls = calls
        self.extra_response_headers = extra_response_headers
        self.client_socket, self.server_socket = socket.socketpair()
        self.stdin = self.client_socket.makefile("wb", buffering=0)
        self.stdout = self.client_socket.makefile("rb", buffering=0)
        self.returncode = None
        self.messages = []
        self.thread = threading.Thread(target=self._serve, daemon=True)
        self.thread.start()

    def _serve(self):
        try:
            request = bytearray()
            while b"\r\n\r\n" not in request:
                request.extend(self.server_socket.recv(4096))
            headers = request.decode("ascii").split("\r\n")
            key = None
            for line in headers:
                if line.lower().startswith("sec-websocket-key:"):
                    key = line.split(":", 1)[1].strip()
            if key is None:
                raise AssertionError("missing WebSocket key")
            accept = base64.b64encode(
                hashlib.sha1(
                    (key + bridge.WEBSOCKET_GUID).encode("ascii")
                ).digest()
            ).decode("ascii")
            self.server_socket.sendall(
                (
                    "HTTP/1.1 101 Switching Protocols\r\n"
                    "Upgrade: websocket\r\n"
                    "Connection: Upgrade\r\n"
                    "Sec-WebSocket-Accept: {}\r\n"
                    "{}"
                    "\r\n"
                ).format(
                    accept, self.extra_response_headers
                ).encode("ascii")
            )
            while True:
                opcode, payload = read_client_frame(self.server_socket)
                if opcode == 0x8:
                    return
                if opcode == 0xA:
                    continue
                message = json.loads(payload.decode("utf-8"))
                self.messages.append(message)
                method = message.get("method")
                if method == "initialize":
                    self.server_socket.sendall(
                        server_text_frame(
                            {
                                "method": "thread/started",
                                "params": {
                                    "thread": {
                                        "id": "broadcast-root",
                                        "sessionId": "broadcast-root",
                                        "cwd": "/workspace/project",
                                    }
                                },
                            }
                        )
                    )
                    response = {
                        "id": message["id"],
                        "result": {
                            "userAgent": "fake",
                            "platformFamily": "unix",
                            "platformOs": "linux",
                        },
                    }
                elif method == "thread/read":
                    response = {
                        "id": message["id"],
                        "result": {
                            "thread": {
                                "id": message["params"]["threadId"],
                                "sessionId": message["params"]["threadId"],
                                "parentThreadId": None,
                                "cwd": "/workspace/project",
                                "status": {"type": "idle"},
                                "turns": [],
                            }
                        },
                    }
                elif method == "thread/resume":
                    response = {
                        "id": message["id"],
                        "result": {
                            "thread": {
                                "id": message["params"]["threadId"],
                                "sessionId": message["params"]["threadId"],
                                "parentThreadId": None,
                                "cwd": "/workspace/project",
                                "status": {"type": "idle"},
                                "turns": [],
                            }
                        },
                    }
                elif method == "thread/turns/list":
                    response = {
                        "id": message["id"],
                        "result": {
                            "data": [],
                            "nextCursor": None,
                            "backwardsCursor": None,
                        },
                    }
                elif method == "turn/start":
                    response = {
                        "id": message["id"],
                        "result": {
                            "turn": {
                                "id": "turn-live",
                                "status": "inProgress",
                                "items": [],
                            }
                        },
                    }
                elif method == "turn/steer":
                    response = {
                        "id": message["id"],
                        "result": {
                            "turnId": message["params"]["expectedTurnId"]
                        },
                    }
                else:
                    continue
                self.server_socket.sendall(server_text_frame(response))
        except (EOFError, OSError):
            return

    def terminate(self):
        self.returncode = 0
        try:
            self.client_socket.shutdown(socket.SHUT_RDWR)
        except OSError:
            pass

    def kill(self):
        self.terminate()

    def wait(self, timeout=None):
        self.thread.join(timeout)
        try:
            self.server_socket.close()
        except OSError:
            pass
        try:
            self.client_socket.close()
        except OSError:
            pass
        return 0


class AppServerTransportTests(unittest.TestCase):
    def test_driver_forwards_notifications_and_reports_stream_loss(self):
        notification = {
            "method": "mcpServer/startupStatus/updated",
            "params": {
                "threadId": "root",
                "name": "Uclusion",
                "status": "ready",
            },
        }
        client = bridge.AppServerClient("/tmp/not-used")
        client.process = types.SimpleNamespace(
            stdout=io.BytesIO(server_text_frame(notification))
        )
        observed = []
        disconnected = []
        client.notification_handler = observed.append
        client.disconnect_handler = lambda: disconnected.append(True)

        client._reader_loop()

        self.assertEqual([notification], observed)
        self.assertEqual([True], disconnected)
        self.assertIsNotNone(client.reader_failure)

    def test_driver_subscription_ack_precedes_later_lifecycle_event(self):
        authority = bridge.RootAuthority("/workspace/project")
        authority.driver_connected(
            bridge.INITIAL_DRIVER_CONNECTION_ID
        )
        response = {
            "id": 1,
            "result": {
                "thread": {
                    "id": "root",
                    "sessionId": "root",
                    "parentThreadId": None,
                    "cwd": "/workspace/project",
                }
            },
        }
        closed = {
            "method": "thread/closed",
            "params": {"threadId": "root"},
            "emittedAtMs": 10,
        }
        client = bridge.AppServerClient("/tmp/not-used")
        client.process = types.SimpleNamespace(
            stdout=io.BytesIO(
                server_text_frame(response)
                + server_text_frame(closed)
            )
        )
        client.notification_handler = lambda message: (
            authority.observe_notification(
                bridge.INITIAL_DRIVER_CONNECTION_ID, message
            )
        )
        reader = threading.Thread(target=client._reader_loop)
        client._send_json = lambda _message: reader.start()

        client.subscribe_thread(
            "root", lambda: authority.driver_thread_pinned("root")
        )
        reader.join(1)

        self.assertFalse(authority.driver_thread_is_pinned("root"))

    def test_clean_close_abandons_real_driver_subscription_callback(self):
        authority = bridge.RootAuthority("/workspace/project")
        authority.driver_connected(
            bridge.INITIAL_DRIVER_CONNECTION_ID
        )
        self.assertTrue(authority.claim_primary(1))
        authority.observe_notification(
            2,
            {
                "method": "thread/closed",
                "params": {"threadId": "root"},
                "emittedAtMs": 10,
            },
        )
        gate = authority.begin_tui_request(
            1, "thread/start", {"cwd": "/workspace/project"}
        )
        lifecycle_epoch = authority.connection_root_subscribed(
            1, "root"
        )
        self.assertGreater(lifecycle_epoch, 0)
        authority.primary_closed_cleanly(1)

        response = {
            "id": 1,
            "result": {
                "thread": {
                    "id": "root",
                    "sessionId": "root",
                    "parentThreadId": None,
                    "cwd": "/workspace/project",
                }
            },
        }

        class BlockingStream:
            def __init__(self, payload):
                self.payload = bytearray(payload)
                self.release = threading.Event()

            def read(self, size):
                if self.payload:
                    chunk = bytes(self.payload[:size])
                    del self.payload[:size]
                    return chunk
                self.release.wait(2)
                return b""

        stream = BlockingStream(server_text_frame(response))
        client = bridge.AppServerClient("/tmp/not-used")
        client.process = types.SimpleNamespace(stdout=stream)
        client.disconnect_handler = lambda: authority.driver_disconnected(
            bridge.INITIAL_DRIVER_CONNECTION_ID
        )
        reader = threading.Thread(target=client._reader_loop)
        client._send_json = lambda _message: reader.start()

        try:
            client.subscribe_thread(
                "root",
                lambda: authority.driver_thread_pinned(
                    "root", lifecycle_epoch
                ),
            )
            self.assertTrue(reader.is_alive())
            self.assertIsNone(client.reader_failure)
            self.assertIsNone(authority.fatal_error)
            self.assertFalse(authority.driver_thread_is_pinned("root"))
            authority.finish_tui_request(
                gate, {"id": 2, "result": response["result"]}
            )
            self.assertIsNone(authority.current_snapshot())
        finally:
            client.disconnect_handler = None
            client.closed = True
            stream.release.set()
            reader.join(1)

    def test_driver_thread_fence_drains_prior_listener_notifications(self):
        ready = {
            "method": "mcpServer/startupStatus/updated",
            "params": {
                "threadId": "root",
                "name": "Uclusion",
                "status": "ready",
            },
        }
        starting = {
            "method": "mcpServer/startupStatus/updated",
            "params": {
                "threadId": "root",
                "name": "Uclusion",
                "status": "starting",
            },
        }
        response = {
            "id": 1,
            "result": {"thread": {"id": "root"}},
        }
        client = bridge.AppServerClient("/tmp/not-used")
        client.process = types.SimpleNamespace(
            stdout=io.BytesIO(
                server_text_frame(ready)
                + server_text_frame(starting)
                + server_text_frame(response)
            )
        )
        observed = []
        sent = []
        client.notification_handler = observed.append
        reader = threading.Thread(target=client._reader_loop)

        def send_and_read(message):
            sent.append(message)
            reader.start()

        client._send_json = send_and_read
        client.fence_thread("root")
        reader.join(1)

        self.assertEqual([ready, starting], observed)
        self.assertEqual("thread/resume", sent[0]["method"])
        self.assertEqual(
            {"threadId": "root", "excludeTurns": True},
            sent[0]["params"],
        )

    def test_driver_leaves_duplicate_server_request_for_tui_to_answer(self):
        client = bridge.AppServerClient("/tmp/not-used")
        client.process = types.SimpleNamespace(
            stdout=io.BytesIO(
                server_text_frame(
                    {
                        "id": 99,
                        "method": (
                            "item/commandExecution/requestApproval"
                        ),
                        "params": {"threadId": "root"},
                    }
                )
                + server_text_frame(
                    {"id": 1, "result": {"thread": {"id": "root"}}}
                )
            )
        )
        sent = []
        reader = threading.Thread(target=client._reader_loop)

        def send_and_read(message):
            sent.append(message)
            reader.start()

        client._send_json = send_and_read
        result = client.request("thread/read", {}, timeout=1)
        reader.join(1)

        self.assertEqual({"thread": {"id": "root"}}, result)
        self.assertEqual(1, sent[0]["id"])

    def test_driver_rejects_unsolicited_matching_id_before_request(self):
        client = bridge.AppServerClient("/tmp/not-used")
        client.process = types.SimpleNamespace(
            stdout=io.BytesIO(
                server_text_frame({"id": 1, "result": {"preplayed": True}})
            )
        )
        client._reader_loop()
        sent = []
        client._send_json = sent.append

        with self.assertRaisesRegex(
            bridge.AppServerTransportError, "unsolicited JSON-RPC response"
        ):
            client.request("thread/read", {}, timeout=1)
        self.assertEqual([], sent)

    def test_driver_rejects_future_response_without_caching_for_preplay(self):
        client = bridge.AppServerClient("/tmp/not-used")
        client.process = types.SimpleNamespace(
            stdout=io.BytesIO(
                server_text_frame({"id": 2, "result": {"future": True}})
            )
        )
        sent = []
        reader = threading.Thread(target=client._reader_loop)

        def send_and_read(message):
            sent.append(message)
            reader.start()

        client._send_json = send_and_read

        with self.assertRaisesRegex(
            bridge.AppServerTransportError,
            "unexpected JSON-RPC response id",
        ):
            client.request("thread/read", {}, timeout=1)
        reader.join(1)

        with self.assertRaisesRegex(
            bridge.AppServerTransportError,
            "unexpected JSON-RPC response id",
        ):
            client.request("thread/read", {}, timeout=1)
        self.assertEqual([1], [message["id"] for message in sent])

    def test_json_rpc_ids_are_only_strings_or_signed_int64(self):
        for value in ("", "request", -(1 << 63), (1 << 63) - 1):
            with self.subTest(valid=value):
                bridge.rpc_id_key(value)

        invalid = (True, False, None, 1.0, -(1 << 63) - 1, 1 << 63)
        for value in invalid:
            with self.subTest(invalid=value):
                with self.assertRaises(bridge.RelayProtocolError):
                    bridge.rpc_id_key(value)

        client = bridge.AppServerClient("/tmp/not-used")
        client._send_json = lambda _message: None
        client.incoming.put({"id": True, "result": {}})
        with self.assertRaisesRegex(
            bridge.AppServerTransportError,
            "string or signed 64-bit integer",
        ):
            client.request("thread/read", {}, timeout=1)

    def test_driver_response_requires_exactly_one_result_or_object_error(self):
        invalid_responses = (
            {"id": 1},
            {"id": 1, "result": {}, "error": {}},
            {"id": 1, "error": None},
        )
        for response in invalid_responses:
            with self.subTest(response=response):
                client = bridge.AppServerClient("/tmp/not-used")
                client._send_json = lambda _message: None
                client.incoming.put(response)
                with self.assertRaises(bridge.AppServerTransportError):
                    client.request("thread/read", {}, timeout=1)

        client = bridge.AppServerClient("/tmp/not-used")
        client._send_json = lambda _message: None
        client.incoming.put(
            {"id": 1, "error": {"code": -1, "message": "rejected"}}
        )
        with self.assertRaisesRegex(
            bridge.AppServerRequestError, "rejected"
        ):
            client.request("thread/read", {}, timeout=1)

    def test_non_finite_json_is_rejected_on_ingress_and_serialization(self):
        invalid_payloads = (
            b'{"value":1e999}',
            b'{"value":NaN}',
            b'{"nested":[-1e999]}',
        )
        for payload in invalid_payloads:
            with self.subTest(payload=payload):
                with self.assertRaisesRegex(
                    bridge.RelayProtocolError, "invalid JSON"
                ):
                    bridge._strict_json_object(payload, "peer")

        client = bridge.AppServerClient("/tmp/not-used")
        with self.assertRaisesRegex(
            bridge.AppServerTransportError, "invalid JSON"
        ):
            client._send_json({"value": float("nan")})

        left, right = socket.socketpair()
        frontend = bridge.FrontendWebSocket(left)
        try:
            with self.assertRaisesRegex(
                bridge.RelayProtocolError, "invalid JSON"
            ):
                frontend.send_json_message({"value": float("inf")})
            right.settimeout(0.05)
            with self.assertRaises(socket.timeout):
                right.recv(1)
        finally:
            frontend.close()
            right.close()

    def test_close_frames_require_valid_length_code_and_utf8_reason(self):
        invalid_payloads = (
            (b"\x03", "one-byte"),
            (struct.pack("!H", 1005), "code 1005"),
            (struct.pack("!H", 1000) + b"\xff", "non-UTF-8"),
        )
        for payload, expected in invalid_payloads:
            with self.subTest(upstream=expected):
                client = bridge.AppServerClient("/tmp/not-used")
                frame = bridge.FrontendWebSocket._unmasked_frame(
                    0x8, payload
                )
                client.process = types.SimpleNamespace(
                    stdout=io.BytesIO(frame)
                )
                with self.assertRaisesRegex(
                    bridge.AppServerTransportError, expected
                ):
                    client.read_json_message()

            with self.subTest(frontend=expected):
                left, right = socket.socketpair()
                frontend = bridge.FrontendWebSocket(left)
                try:
                    right.sendall(
                        bridge.AppServerClient._masked_frame(0x8, payload)
                    )
                    with self.assertRaisesRegex(
                        bridge.RelayProtocolError, expected
                    ):
                        frontend.read_json_message()
                finally:
                    frontend.close()
                    right.close()

        valid_payload = struct.pack("!H", 1000) + b"normal"
        client = bridge.AppServerClient("/tmp/not-used")
        client.process = types.SimpleNamespace(
            stdout=io.BytesIO(
                bridge.FrontendWebSocket._unmasked_frame(
                    0x8, valid_payload
                )
            )
        )
        self.assertIsNone(client.read_json_message())

    def test_app_server_close_does_not_wait_for_pipe_write_lock(self):
        process = mock.Mock()
        process.wait.return_value = 0
        client = bridge.AppServerClient("/tmp/not-used")
        client.process = process
        client.write_lock.acquire()
        worker = threading.Thread(target=client.close, daemon=True)
        try:
            worker.start()
            worker.join(0.5)
            self.assertFalse(worker.is_alive())
            self.assertTrue(client.closed)
            process.terminate.assert_called_once_with()
        finally:
            client.write_lock.release()
            worker.join(1)

    def test_frontend_close_does_not_wait_for_socket_write_lock(self):
        left, right = socket.socketpair()
        frontend = bridge.FrontendWebSocket(left)
        frontend.write_lock.acquire()
        worker = threading.Thread(target=frontend.close, daemon=True)
        try:
            worker.start()
            worker.join(0.5)
            self.assertFalse(worker.is_alive())
            self.assertTrue(frontend.closed)
        finally:
            frontend.write_lock.release()
            worker.join(1)
            right.close()

    def test_proxy_websocket_handshake_initialize_and_requests(self):
        calls = []
        holder = {}

        def factory(command, **kwargs):
            calls.append((command, kwargs))
            process = FakeProxyProcess(command, calls)
            holder["process"] = process
            return process

        client = bridge.AppServerClient(
            "/tmp/private-app-server.sock",
            process_factory=factory,
            request_timeout=1,
        )
        subscribed = []
        try:
            client.start()
            thread = client.thread_read("root-thread", include_turns=True)
            client.subscribe_thread(
                "root-thread", lambda: subscribed.append("root-thread")
            )
            turns_page = client.thread_turns_list(
                "root-thread",
                cursor=None,
                limit=100,
                sort_direction="desc",
                items_view="full",
            )
            result = client.turn_start(
                "root-thread", "Responded J-all-369", "message-99"
            )
            steer_result = client.turn_steer(
                "root-thread",
                "turn-live",
                "Start T-all-2420",
                "message-100",
            )
        finally:
            client.close()

        self.assertEqual(
            [
                "codex",
                "app-server",
                "proxy",
                "--sock",
                "/tmp/private-app-server.sock",
            ],
            calls[0][0],
        )
        messages = holder["process"].messages
        self.assertEqual("initialize", messages[0]["method"])
        self.assertEqual(
            {"experimentalApi": True},
            messages[0]["params"]["capabilities"],
        )
        self.assertEqual("initialized", messages[1]["method"])
        # FakeProxyProcess emits a thread/started broadcast here. The
        # noninteractive driver must discard it without confusing response
        # correlation or retaining an unbounded notification backlog.
        self.assertEqual("thread/read", messages[2]["method"])
        self.assertTrue(messages[2]["params"]["includeTurns"])
        self.assertEqual("idle", thread["status"]["type"])
        self.assertEqual("thread/resume", messages[3]["method"])
        self.assertEqual(
            {"threadId": "root-thread", "excludeTurns": True},
            messages[3]["params"],
        )
        self.assertEqual(["root-thread"], subscribed)
        self.assertEqual("thread/turns/list", messages[4]["method"])
        self.assertEqual(
            {
                "threadId": "root-thread",
                "limit": 100,
                "sortDirection": "desc",
                "itemsView": "full",
            },
            messages[4]["params"],
        )
        self.assertEqual([], turns_page["data"])
        self.assertEqual("turn/start", messages[5]["method"])
        self.assertEqual(
            "Responded J-all-369",
            messages[5]["params"]["input"][0]["text"],
        )
        self.assertEqual(
            "message-99",
            messages[5]["params"]["clientUserMessageId"],
        )
        self.assertEqual("turn-live", result["turn"]["id"])
        self.assertEqual("turn/steer", messages[6]["method"])
        self.assertEqual(
            {
                "threadId": "root-thread",
                "input": [{"type": "text", "text": "Start T-all-2420"}],
                "clientUserMessageId": "message-100",
                "expectedTurnId": "turn-live",
            },
            messages[6]["params"],
        )
        self.assertEqual("turn-live", steer_result["turnId"])

    def test_upstream_extension_negotiation_fails_closed(self):
        holder = {}

        def factory(command, **_kwargs):
            process = FakeProxyProcess(
                command,
                [],
                extra_response_headers=(
                    "Sec-WebSocket-Extensions: permessage-deflate\r\n"
                ),
            )
            holder["process"] = process
            return process

        client = bridge.AppServerClient(
            "/tmp/private-app-server.sock",
            process_factory=factory,
            request_timeout=1,
        )
        with self.assertRaisesRegex(
            bridge.AppServerTransportError,
            "unsupported WebSocket extensions",
        ):
            client.start()
        client.close()

    def test_client_frames_are_masked_for_short_and_large_payloads(self):
        for size in (0, 125, 126, 65536):
            payload = b"x" * size
            frame = bridge.AppServerClient._masked_frame(0x1, payload)
            left, right = socket.socketpair()
            try:
                right.sendall(frame)
                opcode, decoded = read_client_frame(left)
            finally:
                left.close()
                right.close()
            self.assertEqual(0x1, opcode)
            self.assertEqual(payload, decoded)

    def test_update_watcher_prefers_installed_uclusion_module_name(self):
        installed = types.ModuleType("uclusion")
        calls = []

        def check(environment):
            calls.append(environment)
            return "[Uclusion update notice] installed path"

        installed.check_wait_update_notice = check
        with mock.patch.dict(sys.modules, {"uclusion": installed}):
            notice = bridge.default_update_notice_source("stage")
        self.assertEqual(
            "[Uclusion update notice] installed path", notice
        )
        self.assertEqual(["stage"], calls)


if __name__ == "__main__":
    unittest.main()
