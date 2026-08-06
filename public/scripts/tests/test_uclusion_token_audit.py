import io
import json
import os
import socket
import sqlite3
import sys
import tempfile
import threading
import time
import unittest
import urllib.request
import uuid
from contextlib import closing
from pathlib import Path
from unittest import mock


SCRIPT_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import uclusionMCPProxy as proxy
import uclusionTokenAudit as audit


def usage(total, input_tokens=None, output_tokens=None, cached=0, reasoning=0):
    if input_tokens is None:
        input_tokens = total - (output_tokens or 0)
    if output_tokens is None:
        output_tokens = total - input_tokens
    return {
        "totalTokens": total,
        "inputTokens": input_tokens,
        "cachedInputTokens": cached,
        "cacheWriteInputTokens": 0,
        "outputTokens": output_tokens,
        "reasoningOutputTokens": reasoning,
    }


def raw_response(thread_id, turn_id, response_id, token_usage):
    return {
        "method": "rawResponse/completed",
        "params": {
            "threadId": thread_id,
            "turnId": turn_id,
            "responseId": response_id,
            "usage": token_usage,
        },
    }


def mcp_item(thread_id, turn_id, item_id, tool, arguments, result):
    return {
        "method": "item/completed",
        "params": {
            "threadId": thread_id,
            "turnId": turn_id,
            "item": {
                "id": item_id,
                "type": "mcpToolCall",
                "server": "Uclusion",
                "tool": tool,
                "status": "completed",
                "arguments": arguments,
                "result": {"structuredContent": result},
            },
        },
    }


class TokenAuditTestCase(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.db_path = os.path.join(self.temporary.name, "audit.sqlite3")
        self.environment = mock.patch.dict(os.environ, {
            "UCLUSION_TOKEN_AUDIT_DB": self.db_path,
            "UCLUSION_TOKEN_AUDIT_SALT": os.path.join(
                self.temporary.name, "audit.salt"
            ),
        })
        self.environment.start()
        self.addCleanup(self.environment.stop)

    def store(self):
        store = audit.AuditStore("stage", "workspace-1")
        if store.source_available("claude", "otel") is None:
            store.set_source_available("claude", "otel", True)
        return store


class StorageConcurrencyTests(TokenAuditTestCase):
    def test_existing_override_parent_permissions_are_preserved(self):
        shared = os.path.join(self.temporary.name, "shared")
        os.mkdir(shared, 0o750)
        os.chmod(shared, 0o750)
        override_db = os.path.join(shared, "audit.sqlite3")
        override_salt = os.path.join(shared, "audit.salt")
        with mock.patch.dict(os.environ, {
            "UCLUSION_TOKEN_AUDIT_DB": override_db,
            "UCLUSION_TOKEN_AUDIT_SALT": override_salt,
        }):
            audit.AuditStore("stage", "workspace-1")
        self.assertEqual(0o750, os.stat(shared).st_mode & 0o777)

    def test_parallel_first_init_selects_one_complete_salt(self):
        barrier = threading.Barrier(8)
        lock = threading.Lock()
        salts = []
        errors = []

        def initialize():
            try:
                barrier.wait()
                value = self.store()._salt
                with lock:
                    salts.append(value)
            except Exception as error:  # pragma: no cover - asserted below
                with lock:
                    errors.append(error)

        threads = [threading.Thread(target=initialize) for _ in range(8)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join(10)

        self.assertFalse(errors, errors)
        self.assertEqual(8, len(salts))
        self.assertEqual(1, len(set(salts)))
        self.assertEqual(32, len(salts[0]))

    def test_parallel_old_schema_migration_is_serialized(self):
        self.store()
        with closing(sqlite3.connect(self.db_path)) as connection, connection:
            connection.execute(
                "ALTER TABLE token_audit_runs DROP COLUMN completed_at"
            )
            connection.execute(
                "ALTER TABLE token_audit_outbox DROP COLUMN lease_token"
            )

        barrier = threading.Barrier(6)
        lock = threading.Lock()
        errors = []

        def migrate():
            try:
                barrier.wait()
                self.store()
            except Exception as error:  # pragma: no cover - asserted below
                with lock:
                    errors.append(error)

        threads = [threading.Thread(target=migrate) for _ in range(6)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join(10)

        self.assertFalse(errors, errors)
        with closing(sqlite3.connect(self.db_path)) as connection:
            run_columns = {
                row[1] for row in connection.execute(
                    "PRAGMA table_info(token_audit_runs)"
                )
            }
            outbox_columns = {
                row[1] for row in connection.execute(
                    "PRAGMA table_info(token_audit_outbox)"
                )
            }
        self.assertIn("completed_at", run_columns)
        self.assertIn("lease_token", outbox_columns)

    def test_concurrent_starts_interrupt_the_first_run_atomically(self):
        store = self.store()
        session = store.fingerprint("codex-thread", "parallel-start")
        store.bind_session("codex", session, is_root=True)
        first_run = str(uuid.uuid4())
        second_run = str(uuid.uuid4())
        entered = threading.Event()
        release = threading.Event()
        second_done = threading.Event()
        errors = []
        real_ensure = store._ensure_run_session

        def gated_ensure(connection, run_id, *args, **kwargs):
            if run_id == first_run and not entered.is_set():
                entered.set()
                if not release.wait(5):
                    raise TimeoutError("start race barrier timed out")
            return real_ensure(connection, run_id, *args, **kwargs)

        def start_first():
            try:
                store.start_run(
                    "codex", "openai", "native", session,
                    first_run, "J-all-501",
                )
            except Exception as error:  # pragma: no cover - asserted below
                errors.append(error)

        def start_second():
            try:
                store.start_run(
                    "codex", "openai", "native", session,
                    second_run, "J-all-502",
                )
            except Exception as error:  # pragma: no cover - asserted below
                errors.append(error)
            finally:
                second_done.set()

        with mock.patch.object(
            store, "_ensure_run_session", side_effect=gated_ensure
        ):
            first = threading.Thread(target=start_first)
            second = threading.Thread(target=start_second)
            first.start()
            self.assertTrue(entered.wait(5))
            second.start()
            self.assertFalse(second_done.wait(0.1))
            release.set()
            first.join(5)
            second.join(5)
        self.assertFalse(errors, errors)
        with closing(store.connect()) as connection:
            first_state = connection.execute(
                "SELECT state, handoff_type, completed_at "
                "FROM token_audit_runs WHERE audit_run_id=?", (first_run,),
            ).fetchone()
            second_state = connection.execute(
                "SELECT state FROM token_audit_runs WHERE audit_run_id=?",
                (second_run,),
            ).fetchone()
        self.assertIn(first_state["state"], {"closing", "queued"})
        self.assertEqual("interrupted", first_state["handoff_type"])
        self.assertIsNotNone(first_state["completed_at"])
        self.assertEqual("active", second_state["state"])
        self.assertEqual(
            second_run,
            store.session_run("codex", session)["audit_run_id"],
        )

    def test_usage_ingestion_and_outbox_claim_share_one_writer_order(self):
        store = self.store()
        session = store.fingerprint("claude-session", "atomic-usage")
        store.bind_session("claude", session, is_root=True)
        run_id = str(uuid.uuid4())
        store.start_run(
            "claude", "anthropic", "otel", session, run_id, "J-all-503"
        )
        store.record_usage(
            "claude", session, "initial",
            audit._anthropic_counts({
                "input_tokens": 2, "output_tokens": 1,
                "cache_read_input_tokens": 0,
                "cache_creation_input_tokens": 0,
            }), "otel",
        )
        store.request_end(run_id, "progress")
        store.signal_complete("claude", session)
        completed_at = float(store.session_run(
            "claude", session
        )["completed_at"])
        entered = threading.Event()
        release = threading.Event()
        claim_done = threading.Event()
        results = {}
        real_assign = store._assignment_for_timestamp

        def gated_assignment(*args, **kwargs):
            result = real_assign(*args, **kwargs)
            entered.set()
            if not release.wait(5):
                raise TimeoutError("usage race barrier timed out")
            return result

        def ingest():
            results["accepted"] = store.record_usage(
                "claude", session, "late",
                audit._anthropic_counts({
                    "input_tokens": 4, "output_tokens": 1,
                    "cache_read_input_tokens": 0,
                    "cache_creation_input_tokens": 0,
                }), "otel", created_at=completed_at,
            )

        def claim():
            results["claimed"] = store.claim_outbox(time.time() + 10)
            claim_done.set()

        with mock.patch.object(
            store, "_assignment_for_timestamp", side_effect=gated_assignment
        ):
            ingestion = threading.Thread(target=ingest)
            publisher = threading.Thread(target=claim)
            ingestion.start()
            self.assertTrue(entered.wait(5))
            publisher.start()
            self.assertFalse(claim_done.wait(0.1))
            release.set()
            ingestion.join(5)
            publisher.join(5)
        self.assertTrue(results["accepted"])
        self.assertEqual(
            8,
            results["claimed"]["finalization"]["measurement"][
                "normalized_total_tokens"
            ],
        )

    def test_failed_completion_cannot_rebind_and_complete_a_new_run(self):
        store = self.store()
        session = store.fingerprint("codex-thread", "completion-rebind")
        store.bind_session("codex", session, is_root=True)
        first_run = str(uuid.uuid4())
        store.start_run(
            "codex", "openai", "native", session,
            first_run, "J-all-547",
        )
        store.record_usage(
            "codex", session, "completion-first",
            audit._openai_counts({"totalTokens": 2}), "native",
        )
        store.request_end(first_run, "progress")
        second_run = str(uuid.uuid4())
        entered = threading.Event()
        release = threading.Event()
        second_done = threading.Event()
        real_active = store._active_assignment

        def gated_active(*args, **kwargs):
            result = real_active(*args, **kwargs)
            entered.set()
            if not release.wait(5):
                raise TimeoutError("completion race barrier timed out")
            return result

        completion = threading.Thread(target=lambda: store.signal_complete(
            "codex", session, failed=True
        ))

        def start_second():
            store.start_run(
                "codex", "openai", "native", session,
                second_run, "J-all-548",
            )
            second_done.set()

        with mock.patch.object(
            store, "_active_assignment", side_effect=gated_active
        ):
            completion.start()
            self.assertTrue(entered.wait(5))
            starter = threading.Thread(target=start_second)
            starter.start()
            self.assertFalse(second_done.wait(0.1))
            release.set()
            completion.join(5)
            starter.join(5)

        first = store.claim_outbox()
        self.assertEqual(first_run, first["audit_run_id"])
        self.assertEqual(
            "session_interrupted",
            first["finalization"]["measurement"]["reason_code"],
        )
        self.assertEqual(
            second_run, store.session_run("codex", session)["audit_run_id"]
        )

    def test_phase_sequence_cannot_regress_under_concurrent_markers(self):
        store = self.store()
        session = store.fingerprint("codex-thread", "phase-race")
        store.bind_session("codex", session, is_root=True)
        run_id = str(uuid.uuid4())
        store.start_run(
            "codex", "openai", "native", session, run_id, "J-all-549"
        )
        entered = threading.Event()
        release = threading.Event()
        older_done = threading.Event()
        results = {}
        real_matches = store._marker_run_matches

        def gated_matches(*args, **kwargs):
            result = real_matches(*args, **kwargs)
            if threading.current_thread().name == "newer-marker":
                entered.set()
                if not release.wait(5):
                    raise TimeoutError("phase race barrier timed out")
            return result

        def newer():
            results["newer"] = store.set_phase(
                run_id, "testing", 2, client="codex",
                session_fp=session, job_id="J-all-549",
            )

        def older():
            results["older"] = store.set_phase(
                run_id, "implementation", 1, client="codex",
                session_fp=session, job_id="J-all-549",
            )
            older_done.set()

        with mock.patch.object(
            store, "_marker_run_matches", side_effect=gated_matches
        ):
            newest = threading.Thread(target=newer, name="newer-marker")
            stale = threading.Thread(target=older, name="older-marker")
            newest.start()
            self.assertTrue(entered.wait(5))
            stale.start()
            self.assertFalse(older_done.wait(0.1))
            release.set()
            newest.join(5)
            stale.join(5)
        self.assertTrue(results["newer"])
        self.assertFalse(results["older"])
        current = store.session_run("codex", session)
        self.assertEqual(2, current["marker_sequence"])
        self.assertEqual("testing", current["current_phase"])


class CodexAuditTests(TokenAuditTestCase):
    def test_unknown_or_invalid_raw_usage_is_never_exact_zero(self):
        for index, invalid in enumerate(({}, {"totalTokens": "bad"})):
            with self.subTest(invalid=invalid):
                observer = audit.CodexTokenAudit("stage", "workspace-1")
                thread_id = f"invalid-usage-{index}"
                observer.set_primary_thread({"id": thread_id})
                run_id = str(uuid.uuid4())
                observer.observe_notification(mcp_item(
                    thread_id, "turn-1", "start", "start_job_audit",
                    {"job_id": f"J-all-34{index}"},
                    {"schema_version": 1, "state": "active",
                     "audit_run_id": run_id,
                     "canonical_job_id": f"J-all-34{index}"},
                ))
                observer.observe_notification(raw_response(
                    thread_id, "turn-1", "invalid", invalid
                ))
                observer.observe_notification(raw_response(
                    thread_id, "turn-1", "valid", {"totalTokens": 5}
                ))
                observer.observe_notification(mcp_item(
                    thread_id, "turn-1", "end", "end_job_audit",
                    {"job_id": f"J-all-34{index}",
                     "audit_run_id": run_id, "handoff_type": "progress"},
                    {"schema_version": 1,
                     "state": "pending_finalization",
                     "audit_run_id": run_id,
                     "canonical_job_id": f"J-all-34{index}",
                     "handoff_type": "progress"},
                ))
                observer.observe_notification({
                    "method": "turn/completed",
                    "params": {"threadId": thread_id,
                               "turn": {"id": "turn-1",
                                        "status": "completed"}},
                })
                finalization = self.store().claim_outbox()["finalization"]
                self.assertEqual("partial", finalization["measurement"]["status"])
                self.assertEqual(
                    "unsupported_client_version",
                    finalization["measurement"]["reason_code"],
                )
                self.assertEqual(
                    5, finalization["measurement"]["normalized_total_tokens"]
                )

    def test_contradictory_or_overflowing_component_usage_is_partial(self):
        invalid_values = (
            {"totalTokens": 1, "inputTokens": 100, "outputTokens": 100},
            {"totalTokens": 100, "outputTokens": 20},
            {
                "inputTokens": audit.MAX_SAFE_INTEGER,
                "outputTokens": 1,
            },
        )
        for index, invalid in enumerate(invalid_values):
            with self.subTest(invalid=invalid):
                observer = audit.CodexTokenAudit("stage", "workspace-1")
                thread_id = f"contradictory-{index}"
                observer.set_primary_thread({"id": thread_id})
                run_id = str(uuid.uuid4())
                observer.observe_notification(mcp_item(
                    thread_id, "turn-1", "start", "start_job_audit",
                    {"job_id": f"J-all-51{index}"},
                    {"schema_version": 1, "state": "active",
                     "audit_run_id": run_id,
                     "canonical_job_id": f"J-all-51{index}"},
                ))
                observer.observe_notification(raw_response(
                    thread_id, "turn-1", "invalid", invalid
                ))
                observer.observe_notification(raw_response(
                    thread_id, "turn-1", "valid", {"totalTokens": 4}
                ))
                observer.observe_notification(mcp_item(
                    thread_id, "turn-1", "end", "end_job_audit",
                    {"job_id": f"J-all-51{index}",
                     "audit_run_id": run_id, "handoff_type": "progress"},
                    {"schema_version": 1,
                     "state": "pending_finalization",
                     "audit_run_id": run_id,
                     "canonical_job_id": f"J-all-51{index}",
                     "handoff_type": "progress"},
                ))
                observer.observe_notification({
                    "method": "turn/completed",
                    "params": {"threadId": thread_id,
                               "turn": {"id": "turn-1",
                                        "status": "completed"}},
                })
                measurement = self.store().claim_outbox()["finalization"][
                    "measurement"
                ]
                self.assertEqual("partial", measurement["status"])
                self.assertEqual(4, measurement["normalized_total_tokens"])

    def test_switch_to_thread_with_another_run_finalizes_previous_lane(self):
        observer = audit.CodexTokenAudit("stage", "workspace-1")
        observer.set_primary_thread({"id": "lane-a"})
        first_run = str(uuid.uuid4())
        observer.store.start_run(
            "codex", "openai", "native", observer.primary_session_fp,
            first_run, "J-all-520",
        )
        observer.store.record_usage(
            "codex", observer.primary_session_fp, "lane-a-usage",
            audit._openai_counts({"totalTokens": 3}), "native",
        )
        second_session = observer.store.fingerprint(
            "codex-thread", "lane-b"
        )
        observer.store.bind_session("codex", second_session, is_root=True)
        second_run = str(uuid.uuid4())
        observer.store.start_run(
            "codex", "openai", "native", second_session,
            second_run, "J-all-521",
        )

        observer.set_primary_thread({"id": "lane-b"})

        first = observer.store.claim_outbox()
        self.assertEqual(first_run, first["audit_run_id"])
        self.assertEqual("interrupted", first["handoff_type"])
        self.assertEqual(
            "partial", first["finalization"]["measurement"]["status"]
        )
        self.assertEqual(
            second_run,
            observer.store.session_run("codex", second_session)[
                "audit_run_id"
            ],
        )

    def test_provider_scalar_is_labeled_without_inventing_raw_fields(self):
        store = self.store()
        session_fp = store.fingerprint("codex-thread", "scalar-root")
        store.bind_session("codex", session_fp, is_root=True)
        run_id = str(uuid.uuid4())
        store.start_run(
            "codex", "openai", "native", session_fp, run_id, "J-all-14"
        )
        store.record_usage(
            "codex", session_fp, "scalar-response",
            audit._openai_counts({"totalTokens": 17}), "native",
        )
        store.request_end(run_id, "progress")
        store.signal_complete("codex", session_fp)
        measurement = store.claim_outbox()["finalization"]["measurement"]
        self.assertEqual("exact", measurement["status"])
        self.assertEqual(17, measurement["normalized_total_tokens"])
        self.assertEqual(
            "provider_reported_total_v1", measurement["normalization"]
        )
        self.assertEqual(
            [{
                "field": "provider_total_tokens", "value": 17,
                "semantics": "provider_reported_total",
            }],
            measurement["raw_counts"],
        )

    def test_exact_marker_boundaries_descendants_and_deduplication(self):
        observer = audit.CodexTokenAudit("stage", "workspace-1")
        observer.set_primary_thread({
            "id": "root-thread",
            "cliVersion": "0.146.0",
            "model": "gpt-5.6-sol",
            "reasoningEffort": "high",
        })
        run_id = str(uuid.uuid4())

        # The response that decides to start the audit is backfilled as the
        # current request, rather than losing the first planning request.
        first = raw_response(
            "root-thread", "turn-1", "response-1", usage(10, 8, 2, 3, 1)
        )
        observer.observe_notification(first)
        observer.observe_notification(first)
        observer.observe_notification({
            "method": "thread/tokenUsage/updated",
            "params": {
                "threadId": "root-thread",
                "turnId": "turn-1",
                "tokenUsage": {
                    "last": usage(10, 8, 2, 3, 1),
                    "total": usage(10, 8, 2, 3, 1),
                },
            },
        })
        observer.observe_notification(mcp_item(
            "root-thread", "turn-1", "item-start", "start_job_audit",
            {"job_id": "J-all-387"},
            {
                "schema_version": 1,
                "state": "active",
                "audit_run_id": run_id,
                "canonical_job_id": "J-all-387",
            },
        ))
        observer.observe_notification(raw_response(
            "root-thread", "turn-1", "response-2", usage(20, 15, 5)
        ))

        # The marker is seen after response-2, so response-2 remains planning
        # and only the next provider request becomes implementation.
        observer.observe_notification(mcp_item(
            "root-thread", "turn-1", "item-phase", "set_job_audit_phase",
            {
                "job_id": "J-all-387",
                "audit_run_id": run_id,
                "phase": "implementation",
                "marker_sequence": 1,
            },
            {
                "schema_version": 1,
                "state": "marked",
                "audit_run_id": run_id,
                "canonical_job_id": "J-all-387",
                "phase": "implementation",
            },
        ))
        observer.observe_notification(raw_response(
            "root-thread", "turn-1", "response-3", usage(30, 22, 8)
        ))

        observer.observe_notification({
            "method": "item/started",
            "params": {
                "threadId": "root-thread",
                "turnId": "turn-1",
                "item": {
                    "id": "spawn",
                    "type": "collabAgentToolCall",
                    "receiverThreadIds": ["child-thread"],
                },
            },
        })
        self.assertEqual(("child-thread",), observer.drain_descendant_thread_ids())
        observer.observe_notification(raw_response(
            "child-thread", "child-turn", "child-response", usage(40, 30, 10)
        ))

        observer.observe_notification(mcp_item(
            "root-thread", "turn-1", "item-end", "end_job_audit",
            {
                "job_id": "J-all-387",
                "audit_run_id": run_id,
                "handoff_type": "review_requested",
            },
            {
                "schema_version": 1,
                "state": "pending_finalization",
                "audit_run_id": run_id,
                "canonical_job_id": "J-all-387",
                "handoff_type": "review_requested",
            },
        ))
        observer.observe_notification(raw_response(
            "root-thread", "turn-1", "response-final", usage(5, 3, 2)
        ))
        observer.observe_notification({
            "method": "turn/completed",
            "params": {
                "threadId": "root-thread",
                "turn": {"id": "turn-1", "status": "completed"},
            },
        })

        row = self.store().claim_outbox()
        self.assertIsNotNone(row)
        finalization = row["finalization"]
        self.assertEqual("partial", finalization["measurement"]["status"])
        self.assertEqual(
            "incomplete_descendant_coverage",
            finalization["measurement"]["reason_code"],
        )
        self.assertEqual(
            105, finalization["measurement"]["normalized_total_tokens"]
        )
        self.assertEqual(30, finalization["phases"]["planning"])
        self.assertEqual(75, finalization["phases"]["implementation"])
        self.assertEqual(1, finalization["coverage"]["descendants_discovered"])
        self.assertEqual(1, finalization["coverage"]["descendants_included"])
        self.assertEqual(3, finalization["activity"]["tool_calls"])
        self.assertEqual("gpt-5.6-sol", finalization["source"]["model"])
        self.assertEqual("openai_input_includes_cache_v1",
                         finalization["measurement"]["normalization"])

    def test_authoritative_thread_switch_carries_open_run(self):
        observer = audit.CodexTokenAudit("stage", "workspace-1")
        observer.set_primary_thread({"id": "root-thread"})
        run_id = str(uuid.uuid4())
        observer.observe_notification(raw_response(
            "root-thread", "turn-1", "response-start", usage(10, 8, 2)
        ))
        observer.observe_notification(mcp_item(
            "root-thread", "turn-1", "start", "start_job_audit",
            {"job_id": "J-all-20"},
            {"state": "active", "schema_version": 1,
             "audit_run_id": run_id, "canonical_job_id": "J-all-20"},
        ))

        # A successful authoritative fork/resume/start response can make a
        # different thread the primary while the same job lane remains open.
        observer.set_primary_thread({"id": "forked-thread"})
        observer.observe_notification(raw_response(
            "forked-thread", "turn-2", "response-fork", usage(15, 11, 4)
        ))
        observer.observe_notification(mcp_item(
            "forked-thread", "turn-2", "phase", "set_job_audit_phase",
            {"job_id": "J-all-20", "audit_run_id": run_id,
             "phase": "testing", "marker_sequence": 1},
            {"state": "marked", "schema_version": 1,
             "audit_run_id": run_id, "canonical_job_id": "J-all-20",
             "phase": "testing"},
        ))
        observer.observe_notification(raw_response(
            "forked-thread", "turn-2", "response-test", usage(20, 15, 5)
        ))
        observer.observe_notification(mcp_item(
            "forked-thread", "turn-2", "end", "end_job_audit",
            {"job_id": "J-all-20", "audit_run_id": run_id,
             "handoff_type": "review_requested"},
            {"state": "pending_finalization", "schema_version": 1,
             "audit_run_id": run_id, "canonical_job_id": "J-all-20",
             "handoff_type": "review_requested"},
        ))
        observer.observe_notification({
            "method": "turn/completed",
            "params": {"threadId": "forked-thread",
                       "turn": {"id": "turn-2", "status": "completed"}},
        })

        finalization = self.store().claim_outbox()["finalization"]
        self.assertEqual("exact", finalization["measurement"]["status"])
        self.assertEqual(45, finalization["measurement"]["normalized_total_tokens"])
        self.assertEqual(25, finalization["phases"]["planning"])
        self.assertEqual(20, finalization["phases"]["testing"])

    def test_primary_switch_to_in_progress_turn_is_measured_partial(self):
        observer = audit.CodexTokenAudit("stage", "workspace-1")
        observer.set_primary_thread({"id": "switch-root"})
        run_id = str(uuid.uuid4())
        observer.observe_notification(mcp_item(
            "switch-root", "turn-1", "start", "start_job_audit",
            {"job_id": "J-all-342"},
            {"schema_version": 1, "state": "active",
             "audit_run_id": run_id, "canonical_job_id": "J-all-342"},
        ))
        observer.set_primary_thread({
            "id": "switch-resumed", "activeTurnId": "already-running",
        })
        observer.observe_notification({
            "method": "thread/tokenUsage/updated",
            "params": {
                "threadId": "switch-resumed",
                "turnId": "already-running",
                "tokenUsage": {
                    "last": usage(7, 5, 2),
                    "total": usage(70, 50, 20),
                },
            },
        })
        observer.observe_notification(mcp_item(
            "switch-resumed", "already-running", "end", "end_job_audit",
            {"job_id": "J-all-342", "audit_run_id": run_id,
             "handoff_type": "progress"},
            {"schema_version": 1, "state": "pending_finalization",
             "audit_run_id": run_id, "canonical_job_id": "J-all-342",
             "handoff_type": "progress"},
        ))
        observer.observe_notification({
            "method": "turn/completed",
            "params": {"threadId": "switch-resumed",
                       "turn": {"id": "already-running",
                                "status": "completed"}},
        })
        finalization = self.store().claim_outbox()["finalization"]
        self.assertEqual("partial", finalization["measurement"]["status"])
        self.assertEqual(
            "session_interrupted", finalization["measurement"]["reason_code"]
        )
        self.assertEqual(7, finalization["measurement"]["normalized_total_tokens"])

    def test_descendant_model_override_is_reported_as_multiple(self):
        observer = audit.CodexTokenAudit("stage", "workspace-1")
        observer.set_primary_thread({
            "id": "model-root", "model": "gpt-root",
            "reasoningEffort": "high",
        })
        run_id = str(uuid.uuid4())
        observer.observe_notification(mcp_item(
            "model-root", "turn-1", "start", "start_job_audit",
            {"job_id": "J-all-343"},
            {"schema_version": 1, "state": "active",
             "audit_run_id": run_id, "canonical_job_id": "J-all-343"},
        ))
        observer.observe_notification({
            "method": "item/started",
            "params": {
                "threadId": "model-root", "turnId": "turn-1",
                "item": {
                    "id": "spawn-model", "type": "collabAgentToolCall",
                    "receiverThreadIds": ["model-child"],
                    "model": "gpt-child", "reasoningEffort": "medium",
                },
            },
        })
        observer.observe_notification(raw_response(
            "model-root", "turn-1", "root-response", usage(5, 4, 1)
        ))
        observer.observe_notification(raw_response(
            "model-child", "child-turn", "child-response", usage(6, 4, 2)
        ))
        observer.observe_notification(mcp_item(
            "model-root", "turn-1", "end", "end_job_audit",
            {"job_id": "J-all-343", "audit_run_id": run_id,
             "handoff_type": "progress"},
            {"schema_version": 1, "state": "pending_finalization",
             "audit_run_id": run_id, "canonical_job_id": "J-all-343",
             "handoff_type": "progress"},
        ))
        observer.observe_notification({
            "method": "turn/completed",
            "params": {"threadId": "model-root",
                       "turn": {"id": "turn-1", "status": "completed"}},
        })
        source = self.store().claim_outbox()["finalization"]["source"]
        self.assertEqual("multiple", source["model"])
        self.assertEqual("multiple", source["effort"])

    def test_resumed_thread_uses_standard_snapshot_as_partial_fallback(self):
        observer = audit.CodexTokenAudit("stage", "workspace-1")
        observer.set_primary_thread({"id": "resumed-thread"})
        run_id = str(uuid.uuid4())
        # Resume replays the prior persisted snapshot before a live turn. It
        # establishes UI state but must not be backfilled into this job.
        observer.observe_notification({
            "method": "thread/tokenUsage/updated",
            "params": {
                "threadId": "resumed-thread",
                "turnId": "prior-turn",
                "tokenUsage": {
                    "last": usage(100, 80, 20),
                    "total": usage(120, 90, 30),
                },
            },
        })
        observer.observe_notification({
            "method": "turn/started",
            "params": {
                "threadId": "resumed-thread",
                "turn": {"id": "turn-resumed"},
            },
        })
        observer.observe_notification({
            "method": "thread/tokenUsage/updated",
            "params": {
                "threadId": "resumed-thread",
                "turnId": "turn-resumed",
                "tokenUsage": {
                    "last": usage(12, 9, 3),
                    "total": usage(132, 99, 33),
                },
            },
        })
        observer.observe_notification(mcp_item(
            "resumed-thread", "turn-resumed", "start", "start_job_audit",
            {"job_id": "J-all-2"},
            {"state": "active", "schema_version": 1,
             "audit_run_id": run_id, "canonical_job_id": "J-all-2"},
        ))
        observer.observe_notification(mcp_item(
            "resumed-thread", "turn-resumed", "end", "end_job_audit",
            {"job_id": "J-all-2", "audit_run_id": run_id,
             "handoff_type": "progress"},
            {"state": "pending_finalization", "schema_version": 1,
             "audit_run_id": run_id, "canonical_job_id": "J-all-2",
             "handoff_type": "progress"},
        ))
        observer.observe_notification({
            "method": "turn/completed",
            "params": {"threadId": "resumed-thread",
                       "turn": {"id": "turn-resumed", "status": "completed"}},
        })
        # A reconnect snapshot after completion is no longer a live turn.
        observer.observe_notification({
            "method": "thread/tokenUsage/updated",
            "params": {
                "threadId": "resumed-thread",
                "turnId": "turn-resumed",
                "tokenUsage": {
                    "last": usage(50, 40, 10),
                    "total": usage(182, 139, 43),
                },
            },
        })
        measurement = self.store().claim_outbox()["finalization"]["measurement"]
        self.assertEqual("partial", measurement["status"])
        self.assertEqual(12, measurement["normalized_total_tokens"])
        self.assertEqual("telemetry_unavailable", measurement["reason_code"])

    def test_disconnect_is_partial_without_losing_measured_tokens(self):
        observer = audit.CodexTokenAudit("stage", "workspace-1")
        observer.set_primary_thread({"id": "root-thread"})
        run_id = str(uuid.uuid4())
        observer.observe_notification(raw_response(
            "root-thread", "turn-1", "response-1", usage(10, 8, 2)
        ))
        observer.observe_notification(mcp_item(
            "root-thread", "turn-1", "start", "start_job_audit",
            {"job_id": "J-all-1"},
            {"state": "active", "schema_version": 1,
             "audit_run_id": run_id, "canonical_job_id": "J-all-1"},
        ))
        observer.mark_partial("Codex audit driver disconnected")
        observer.observe_notification(mcp_item(
            "root-thread", "turn-1", "end", "end_job_audit",
            {"job_id": "J-all-1", "audit_run_id": run_id,
             "handoff_type": "interrupted"},
            {"state": "pending_finalization", "schema_version": 1,
             "audit_run_id": run_id, "canonical_job_id": "J-all-1",
             "handoff_type": "interrupted"},
        ))
        observer.close()
        finalization = self.store().claim_outbox()["finalization"]
        self.assertEqual("partial", finalization["measurement"]["status"])
        self.assertEqual(10, finalization["measurement"]["normalized_total_tokens"])
        self.assertEqual(
            "session_interrupted", finalization["measurement"]["reason_code"]
        )


class ClaudeAuditTests(TokenAuditTestCase):
    def append_record(self, path, record):
        with open(path, "a", encoding="utf-8") as destination:
            destination.write(json.dumps(record, separators=(",", ":")) + "\n")

    def assistant(self, message_id, input_tokens, output_tokens, cache_read=0,
                  cache_creation=0, content=None):
        return {
            "type": "assistant",
            "uuid": "entry-" + message_id,
            "version": "2.1.222",
            "timestamp": audit._utc_iso(),
            "message": {
                "id": message_id,
                "model": "claude-opus-4-1",
                "usage": {
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "cache_read_input_tokens": cache_read,
                    "cache_creation_input_tokens": cache_creation,
                },
                "content": content or [],
            },
        }

    def hook(self, event, transcript, **extra):
        payload = {
            "hook_event_name": event,
            "session_id": "claude-session",
            "transcript_path": transcript,
            **extra,
        }
        audit.process_claude_hook(
            "stage", "workspace-1", "transcript", payload
        )

    def test_subagent_stop_does_not_finalize_root_handoff(self):
        store = self.store()
        root_fp = store.fingerprint("claude-session", "claude-session")
        child_fp = store.fingerprint(
            "claude-subagent", "claude-session\0child-1"
        )
        store.bind_session("claude", root_fp, is_root=True)
        run_id = str(uuid.uuid4())
        store.start_run(
            "claude", "anthropic", "otel", root_fp, run_id, "J-all-21"
        )
        store.discover_descendant("claude", root_fp, child_fp)
        store.record_usage(
            "claude", root_fp, "root-response",
            audit._anthropic_counts({
                "input_tokens": 5, "output_tokens": 2,
                "cache_read_input_tokens": 0,
                "cache_creation_input_tokens": 0,
            }),
            "otel",
        )
        store.record_usage(
            "claude", child_fp, "child-response",
            audit._anthropic_counts({
                "input_tokens": 3, "output_tokens": 1,
                "cache_read_input_tokens": 0,
                "cache_creation_input_tokens": 0,
            }),
            "otel",
        )
        store.request_end(
            run_id, "review_requested", client="claude",
            session_fp=root_fp, job_id="J-all-21",
        )

        audit.process_claude_hook(
            "stage", "workspace-1", "otel", {
                "hook_event_name": "SubagentStop",
                "session_id": "claude-session",
                "agent_id": "child-1",
            },
        )
        self.assertIsNone(store.claim_outbox(
            time.time() + audit.CLAUDE_EXPORT_GRACE_SECONDS + 1
        ))

        audit.process_claude_hook(
            "stage", "workspace-1", "otel", {
                "hook_event_name": "Stop",
                "session_id": "claude-session",
            },
        )
        row = store.claim_outbox(
            time.time() + audit.CLAUDE_EXPORT_GRACE_SECONDS + 1
        )
        self.assertIsNotNone(row)
        self.assertEqual(
            11, row["finalization"]["measurement"]["normalized_total_tokens"]
        )

    def test_transcript_fallback_dedupes_and_follows_next_request_markers(self):
        transcript = os.path.join(self.temporary.name, "session.jsonl")
        Path(transcript).touch()
        run_id = str(uuid.uuid4())
        self.append_record(transcript, self.assistant(
            "message-1", 5, 2, 3, 1,
            content=[{
                "type": "tool_use", "id": "bash-1", "name": "Bash",
                "input": {"command": "pytest -q"},
            }],
        ))
        # Duplicate transcript record for the same API request is common.
        self.append_record(transcript, self.assistant("message-1", 5, 2, 3, 1))
        self.hook(
            "PostToolUse", transcript,
            tool_name="mcp__Uclusion__start_job_audit",
            tool_input={"job_id": "J-all-387"},
            tool_response={"structuredContent": {
                "schema_version": 1,
                "state": "active",
                "audit_run_id": run_id,
                "canonical_job_id": "J-all-387",
            }},
            tool_use_id="marker-start",
        )

        self.append_record(transcript, self.assistant("message-2", 10, 4))
        self.hook(
            "PostToolUse", transcript,
            tool_name="mcp__Uclusion__set_job_audit_phase",
            tool_input={
                "job_id": "J-all-387", "audit_run_id": run_id,
                "phase": "testing", "marker_sequence": 1,
            },
            tool_response={"structuredContent": {
                "schema_version": 1, "state": "marked",
                "audit_run_id": run_id, "canonical_job_id": "J-all-387",
                "phase": "testing",
            }},
            tool_use_id="marker-phase",
        )
        self.append_record(transcript, self.assistant("message-3", 7, 3))
        self.hook(
            "PostToolUse", transcript,
            tool_name="mcp__Uclusion__end_job_audit",
            tool_input={
                "job_id": "J-all-387", "audit_run_id": run_id,
                "handoff_type": "review_requested",
            },
            tool_response={"structuredContent": {
                "schema_version": 1, "state": "pending_finalization",
                "audit_run_id": run_id, "canonical_job_id": "J-all-387",
                "handoff_type": "review_requested",
            }},
            tool_use_id="marker-end",
        )
        self.append_record(transcript, self.assistant("message-4", 4, 1))
        self.hook("Stop", transcript)

        row = self.store().claim_outbox(
            time.time() + audit.CLAUDE_TRANSCRIPT_GRACE_SECONDS + 1
        )
        finalization = row["finalization"]
        # 11 + 14 + 10 + 5. The duplicated message-1 counts once.
        self.assertEqual(40, finalization["measurement"]["normalized_total_tokens"])
        self.assertEqual(25, finalization["phases"]["planning"])
        self.assertEqual(15, finalization["phases"]["testing"])
        self.assertEqual("partial", finalization["measurement"]["status"])
        self.assertEqual(
            "telemetry_unavailable",
            finalization["measurement"]["reason_code"],
        )
        self.assertEqual("transcript_fallback",
                         finalization["source"]["source_mode"])
        self.assertEqual(1, finalization["activity"]["test_commands"])

    def test_unknown_transcript_usage_schema_is_explicitly_partial(self):
        transcript = os.path.join(self.temporary.name, "session.jsonl")
        Path(transcript).touch()
        run_id = str(uuid.uuid4())
        self.append_record(transcript, self.assistant("message-1", 5, 2))
        self.hook(
            "PostToolUse", transcript,
            tool_name="mcp__Uclusion__start_job_audit",
            tool_input={"job_id": "J-all-1"},
            tool_response={"structuredContent": {
                "schema_version": 1, "state": "active",
                "audit_run_id": run_id, "canonical_job_id": "J-all-1",
            }},
        )
        self.append_record(transcript, {
            "type": "assistant",
            "message": {"id": "future", "usage": {"new_tokens": 99}},
        })
        self.hook(
            "PostToolUse", transcript,
            tool_name="mcp__Uclusion__end_job_audit",
            tool_input={"job_id": "J-all-1", "audit_run_id": run_id,
                        "handoff_type": "progress"},
            tool_response={"structuredContent": {
                "schema_version": 1, "state": "pending_finalization",
                "audit_run_id": run_id, "canonical_job_id": "J-all-1",
                "handoff_type": "progress",
            }},
        )
        self.hook("Stop", transcript)
        measurement = self.store().claim_outbox(
            time.time() + audit.CLAUDE_TRANSCRIPT_GRACE_SECONDS + 1
        )["finalization"]["measurement"]
        self.assertEqual("partial", measurement["status"])
        self.assertEqual("unsupported_client_version", measurement["reason_code"])

    def test_transcript_without_supported_version_or_stable_id_is_partial(self):
        transcript = os.path.join(self.temporary.name, "unstable.jsonl")
        record = self.assistant("unstable", 5, 2)
        record.pop("version")
        record.pop("uuid")
        record["message"].pop("id")
        self.append_record(transcript, record)
        run_id = str(uuid.uuid4())
        self.hook(
            "PostToolUse", transcript,
            tool_name="mcp__Uclusion__start_job_audit",
            tool_input={"job_id": "J-all-3"},
            tool_response={"structuredContent": {
                "schema_version": 1, "state": "active",
                "audit_run_id": run_id, "canonical_job_id": "J-all-3",
            }},
        )
        self.hook(
            "PostToolUse", transcript,
            tool_name="mcp__Uclusion__end_job_audit",
            tool_input={"job_id": "J-all-3", "audit_run_id": run_id,
                        "handoff_type": "progress"},
            tool_response={"structuredContent": {
                "schema_version": 1, "state": "pending_finalization",
                "audit_run_id": run_id, "canonical_job_id": "J-all-3",
                "handoff_type": "progress",
            }},
        )
        self.hook("Stop", transcript)
        finalization = self.store().claim_outbox(
            time.time() + audit.CLAUDE_TRANSCRIPT_GRACE_SECONDS + 1
        )["finalization"]
        self.assertEqual(7, finalization["measurement"]["normalized_total_tokens"])
        self.assertEqual("partial", finalization["measurement"]["status"])
        self.assertEqual(
            "unsupported_client_version",
            finalization["measurement"]["reason_code"],
        )

    def test_transcript_scans_every_bounded_chunk(self):
        transcript = os.path.join(self.temporary.name, "chunked.jsonl")
        Path(transcript).touch()
        store = self.store()
        session_fp = store.fingerprint("claude-session", "claude-session")
        store.bind_session("claude", session_fp, is_root=True)
        run_id = str(uuid.uuid4())
        store.start_run(
            "claude", "anthropic", "transcript_fallback", session_fp,
            run_id, "J-all-4",
        )
        for index in range(12):
            self.append_record(
                transcript, self.assistant(f"chunk-{index}", 1, 1)
            )
        with mock.patch.object(audit, "MAX_TRANSCRIPT_READ", 1024):
            audit.scan_claude_transcript(store, session_fp, transcript)
        store.request_end(run_id, "progress")
        store.signal_complete("claude", session_fp)
        measurement = store.claim_outbox()["finalization"]["measurement"]
        self.assertEqual(24, measurement["normalized_total_tokens"])

    def test_markers_cannot_mutate_a_run_from_an_unbound_session(self):
        store = self.store()
        root = store.fingerprint("claude-session", "root")
        other = store.fingerprint("claude-session", "other")
        store.bind_session("claude", root, is_root=True)
        store.bind_session("claude", other, is_root=True)
        run_id = str(uuid.uuid4())
        store.start_run(
            "claude", "anthropic", "otel", root, run_id, "J-all-5"
        )
        self.assertFalse(store.start_run(
            "claude", "anthropic", "otel", other, run_id, "J-all-5"
        ))
        self.assertFalse(store.set_phase(
            run_id, "testing", 1, client="claude", session_fp=other,
            job_id="J-all-5",
        ))
        self.assertFalse(store.request_end(
            run_id, "progress", client="claude", session_fp=other,
            job_id="J-all-5",
        ))
        self.assertEqual("planning", store.session_run("claude", root)["current_phase"])
        self.assertEqual("active", store.session_run("claude", root)["state"])


class HardeningRegressionTests(TokenAuditTestCase):
    def test_fingerprints_are_scoped_to_environment_and_workspace(self):
        stage_one = self.store()
        stage_two = audit.AuditStore("stage", "workspace-2")
        production_one = audit.AuditStore("production", "workspace-1")
        fingerprints = {
            stage_one.fingerprint("claude-session", "provider-session"),
            stage_two.fingerprint("claude-session", "provider-session"),
            production_one.fingerprint("claude-session", "provider-session"),
        }
        self.assertEqual(3, len(fingerprints))

    def test_marker_requires_accepted_result_and_replay_cannot_revert_phase(self):
        store = self.store()
        session_fp = store.fingerprint("codex-thread", "marker-root")
        store.bind_session("codex", session_fp, is_root=True)
        run_id = str(uuid.uuid4())
        self.assertIsNone(audit._apply_marker(
            store, "codex", "openai", "native", session_fp,
            "start_job_audit", {"job_id": "J-all-30"},
            {"error": {"code": 500}}, marker_identity="failed-start",
        ))
        self.assertIsNone(store.session_run("codex", session_fp))
        self.assertEqual(run_id, audit._apply_marker(
            store, "codex", "openai", "native", session_fp,
            "start_job_audit", {"job_id": "J-all-30"},
            {"structuredContent": {
                "schema_version": 1, "state": "active",
                "audit_run_id": run_id, "canonical_job_id": "J-all-30",
            }}, marker_identity="accepted-start",
        ))
        self.assertIsNone(audit._apply_marker(
            store, "codex", "openai", "native", session_fp,
            "set_job_audit_phase",
            {"job_id": "J-all-30", "audit_run_id": run_id,
             "phase": "implementation"},
            {"structuredContent": {"schema_version": 1, "state": "error"}},
            marker_identity="failed-phase",
        ))
        phase_result = {
            "structuredContent": {
                "schema_version": 1, "state": "marked",
                "audit_run_id": run_id, "canonical_job_id": "J-all-30",
                "phase": "implementation",
            }
        }
        for _ in range(2):
            self.assertEqual(run_id, audit._apply_marker(
                store, "codex", "openai", "native", session_fp,
                "set_job_audit_phase",
                {"job_id": "J-all-30", "audit_run_id": run_id,
                 "phase": "implementation"},
                phase_result, marker_identity="phase-item-1",
            ))
        self.assertEqual(run_id, audit._apply_marker(
            store, "codex", "openai", "native", session_fp,
            "set_job_audit_phase",
            {"job_id": "J-all-30", "audit_run_id": run_id,
             "phase": "testing"},
            {"structuredContent": {
                "schema_version": 1, "state": "marked",
                "audit_run_id": run_id, "canonical_job_id": "J-all-30",
                "phase": "testing",
            }}, marker_identity="phase-item-2",
        ))
        # Replaying the older tool item is idempotent, not a new transition.
        self.assertEqual(run_id, audit._apply_marker(
            store, "codex", "openai", "native", session_fp,
            "set_job_audit_phase",
            {"job_id": "J-all-30", "audit_run_id": run_id,
             "phase": "implementation"},
            phase_result, marker_identity="phase-item-1",
        ))
        self.assertEqual("testing", store.session_run(
            "codex", session_fp
        )["current_phase"])
        self.assertIsNone(audit._apply_marker(
            store, "codex", "openai", "native", session_fp,
            "end_job_audit",
            {"job_id": "J-all-30", "audit_run_id": run_id,
             "handoff_type": "review_requested"},
            {"structuredContent": {
                "schema_version": 1, "state": "pending_finalization",
                "audit_run_id": "wrong-run", "canonical_job_id": "J-all-30",
                "handoff_type": "review_requested",
            }}, marker_identity="bad-end",
        ))
        self.assertEqual("active", store.session_run(
            "codex", session_fp
        )["state"])

    def test_returned_phase_sequence_and_end_identity_prevent_old_replays(self):
        store = self.store()
        session = store.fingerprint("codex-thread", "ordered-markers")
        store.bind_session("codex", session, is_root=True)
        run_id = str(uuid.uuid4())
        store.start_run(
            "codex", "openai", "native", session, run_id, "J-all-533"
        )

        def phase(name, sequence, identity):
            return audit._apply_marker(
                store, "codex", "openai", "native", session,
                "set_job_audit_phase",
                {"job_id": "J-all-533", "audit_run_id": run_id,
                 "phase": name},
                {"structuredContent": {
                    "schema_version": 1, "state": "marked",
                    "audit_run_id": run_id,
                    "canonical_job_id": "J-all-533",
                    "phase": name, "marker_sequence": sequence,
                }},
                marker_identity=identity,
            )

        self.assertEqual(run_id, phase("testing", 2, "phase-new"))
        self.assertIsNone(phase("implementation", 1, "phase-old"))
        self.assertEqual(
            "testing", store.session_run("codex", session)["current_phase"]
        )

        def end(handoff, identity):
            return audit._apply_marker(
                store, "codex", "openai", "native", session,
                "end_job_audit",
                {"job_id": "J-all-533", "audit_run_id": run_id,
                 "handoff_type": handoff},
                {"structuredContent": {
                    "schema_version": 1,
                    "state": "pending_finalization",
                    "audit_run_id": run_id,
                    "canonical_job_id": "J-all-533",
                    "handoff_type": handoff,
                }},
                marker_identity=identity,
            )

        self.assertEqual(run_id, end("progress", "end-old"))
        self.assertEqual(run_id, end("completed", "end-new"))
        self.assertEqual(run_id, end("progress", "end-old"))
        store.record_usage(
            "codex", session, "ordered-usage",
            audit._openai_counts({"totalTokens": 3}), "native",
        )
        store.signal_complete("codex", session)
        self.assertEqual("completed", store.claim_outbox()["handoff_type"])

    def test_session_run_state_does_not_leak_to_sequential_audits(self):
        store = self.store()
        root = store.fingerprint("codex-thread", "sequential-root")
        store.bind_session("codex", root, is_root=True)
        first_run = str(uuid.uuid4())
        store.start_run("codex", "openai", "native", root,
                        first_run, "J-all-31")
        store.record_usage("codex", root, "first-usage",
                           audit._openai_counts({"totalTokens": 9}), "native")
        store.mark_partial("codex", root, "collector_failure")
        store.request_end(first_run, "progress")
        store.signal_complete("codex", root)
        first_outbox = store.claim_outbox()
        self.assertEqual("partial", first_outbox["finalization"]["measurement"]["status"])
        store.complete_outbox(first_run, first_outbox["lease_token"])
        # Normal observer notifications re-bind the provider session between
        # runs; that timestamp must not make A's consumed reason look new.
        store.bind_session("codex", root, is_root=True)

        second_run = str(uuid.uuid4())
        store.start_run("codex", "openai", "native", root,
                        second_run, "J-all-32")
        store.record_usage("codex", root, "second-usage",
                           audit._openai_counts({"totalTokens": 7}), "native")
        store.request_end(second_run, "progress")
        store.signal_complete("codex", root)
        second = store.claim_outbox()["finalization"]
        self.assertEqual("exact", second["measurement"]["status"])
        self.assertNotIn("reason_code", second["measurement"])

    def test_gap_detected_after_finalization_carries_to_next_audit(self):
        store = self.store()
        root = store.fingerprint("codex-thread", "post-final-gap")
        store.bind_session("codex", root, is_root=True)
        first_run = str(uuid.uuid4())
        store.start_run(
            "codex", "openai", "native", root, first_run, "J-all-320"
        )
        store.record_usage(
            "codex", root, "first-exact",
            audit._openai_counts({"totalTokens": 5}), "native",
        )
        store.request_end(first_run, "progress")
        store.signal_complete("codex", root)
        first = store.claim_outbox()
        self.assertEqual("exact", first["finalization"]["measurement"]["status"])
        store.complete_outbox(first_run, first["lease_token"])

        # A restarted observer can detect a collection gap before the next
        # marker arrives. The old finalized run is immutable, so this evidence
        # lives on the session until start_run can attach it to the new run.
        time.sleep(0.002)
        store.mark_partial("codex", root, "session_interrupted")
        second_run = str(uuid.uuid4())
        store.start_run(
            "codex", "openai", "native", root, second_run, "J-all-321"
        )
        store.record_usage(
            "codex", root, "second-measured",
            audit._openai_counts({"totalTokens": 7}), "native",
        )
        store.request_end(second_run, "progress")
        store.signal_complete("codex", root)
        second = store.claim_outbox()["finalization"]
        self.assertEqual("partial", second["measurement"]["status"])
        self.assertEqual(
            "session_interrupted", second["measurement"]["reason_code"]
        )

    def test_same_post_completion_reason_is_carried_with_new_timestamp(self):
        store = self.store()
        root = store.fingerprint("codex-thread", "same-post-gap")
        store.bind_session("codex", root, is_root=True)
        first_run = str(uuid.uuid4())
        store.start_run(
            "codex", "openai", "native", root, first_run, "J-all-534"
        )
        store.record_usage(
            "codex", root, "first-same-gap",
            audit._openai_counts({"totalTokens": 2}), "native",
        )
        store.mark_partial("codex", root, "telemetry_unavailable")
        store.request_end(first_run, "progress")
        store.signal_complete("codex", root)
        first = store.claim_outbox()
        store.complete_outbox(first_run, first["lease_token"])

        time.sleep(0.002)
        store.mark_partial("codex", root, "telemetry_unavailable")
        second_run = str(uuid.uuid4())
        store.start_run(
            "codex", "openai", "native", root, second_run, "J-all-535"
        )
        store.record_usage(
            "codex", root, "second-same-gap",
            audit._openai_counts({"totalTokens": 4}), "native",
        )
        store.request_end(second_run, "progress")
        store.signal_complete("codex", root)
        second = store.claim_outbox()["finalization"]["measurement"]
        self.assertEqual("partial", second["status"])
        self.assertEqual("telemetry_unavailable", second["reason_code"])

    def test_aggregate_overflow_degrades_to_api_safe_partial(self):
        store = self.store()
        session = store.fingerprint("codex-thread", "aggregate-overflow")
        store.bind_session("codex", session, is_root=True)
        run_id = str(uuid.uuid4())
        store.start_run(
            "codex", "openai", "native", session, run_id, "J-all-536"
        )
        self.assertTrue(store.record_usage(
            "codex", session, "huge-one",
            audit._openai_counts({"totalTokens": audit.MAX_SAFE_INTEGER}),
            "native",
        ))
        self.assertTrue(store.record_usage(
            "codex", session, "huge-two",
            audit._openai_counts({"totalTokens": 1}), "native",
        ))
        store.request_end(run_id, "progress")
        store.signal_complete("codex", session)
        finalization = store.claim_outbox()["finalization"]
        self.assertEqual("partial", finalization["measurement"]["status"])
        self.assertEqual(
            audit.MAX_SAFE_INTEGER,
            finalization["measurement"]["normalized_total_tokens"],
        )
        self.assertLessEqual(
            sum(finalization["phases"][phase] for phase in audit.PHASES),
            audit.MAX_SAFE_INTEGER,
        )

    def test_closing_run_keeps_coverage_and_receives_delayed_usage_after_rebind(self):
        store = self.store()
        root = store.fingerprint("claude-session", "overlap-session")
        store.bind_session("claude", root, is_root=True)
        first_run = str(uuid.uuid4())
        store.start_run(
            "claude", "anthropic", "otel", root, first_run, "J-all-331"
        )
        store.record_usage(
            "claude", root, "first-on-time",
            audit._anthropic_counts({
                "input_tokens": 3, "output_tokens": 2,
                "cache_read_input_tokens": 0,
                "cache_creation_input_tokens": 0,
            }),
            "otel",
        )
        store.request_end(first_run, "progress")
        store.signal_complete("claude", root, grace=10)
        with closing(store.connect()) as connection:
            first_window = connection.execute(
                "SELECT started_at, completed_at FROM token_audit_runs "
                "WHERE audit_run_id=?", (first_run,),
            ).fetchone()

        second_run = str(uuid.uuid4())
        store.start_run(
            "claude", "anthropic", "otel", root, second_run, "J-all-332"
        )
        delayed_at = (
            float(first_window["started_at"])
            + float(first_window["completed_at"])
        ) / 2
        store.record_usage(
            "claude", root, "first-delayed",
            audit._anthropic_counts({
                "input_tokens": 2, "output_tokens": 2,
                "cache_read_input_tokens": 0,
                "cache_creation_input_tokens": 0,
            }),
            "otel",
            created_at=delayed_at,
        )
        first = store.claim_outbox(time.time() + 20)
        self.assertEqual(first_run, first["audit_run_id"])
        self.assertEqual("exact", first["finalization"]["measurement"]["status"])
        self.assertEqual(
            9, first["finalization"]["measurement"]["normalized_total_tokens"]
        )
        self.assertEqual(
            "complete", first["finalization"]["coverage"]["main_session"]
        )
        store.complete_outbox(first_run, first["lease_token"])

        store.record_usage(
            "claude", root, "second-current",
            audit._anthropic_counts({
                "input_tokens": 4, "output_tokens": 2,
                "cache_read_input_tokens": 0,
                "cache_creation_input_tokens": 0,
            }),
            "otel",
        )
        store.request_end(second_run, "progress")
        store.signal_complete("claude", root)
        second = store.claim_outbox(
            time.time() + audit.CLAUDE_EXPORT_GRACE_SECONDS + 1
        )
        self.assertEqual(second_run, second["audit_run_id"])
        self.assertEqual("exact", second["finalization"]["measurement"]["status"])
        self.assertEqual(
            6, second["finalization"]["measurement"]["normalized_total_tokens"]
        )

    def test_delayed_pre_boundary_gap_marks_only_its_historical_run(self):
        store = self.store()
        root = store.fingerprint("claude-session", "historical-gap")
        store.bind_session("claude", root, is_root=True)
        first_run = str(uuid.uuid4())
        store.start_run(
            "claude", "anthropic", "otel", root, first_run, "J-all-333"
        )
        store.record_usage(
            "claude", root, "historical-first",
            audit._anthropic_counts({
                "input_tokens": 3, "output_tokens": 1,
                "cache_read_input_tokens": 0,
                "cache_creation_input_tokens": 0,
            }),
            "otel",
        )
        store.request_end(first_run, "progress")
        store.signal_complete("claude", root, grace=10)
        with closing(store.connect()) as connection:
            window = connection.execute(
                "SELECT started_at, completed_at FROM token_audit_runs "
                "WHERE audit_run_id=?", (first_run,),
            ).fetchone()

        second_run = str(uuid.uuid4())
        store.start_run(
            "claude", "anthropic", "otel", root, second_run, "J-all-334"
        )
        store.mark_partial(
            "claude",
            root,
            "unsupported_client_version",
            event_time=(
                float(window["started_at"])
                + float(window["completed_at"])
            ) / 2,
        )
        store.record_usage(
            "claude", root, "historical-second",
            audit._anthropic_counts({
                "input_tokens": 5, "output_tokens": 1,
                "cache_read_input_tokens": 0,
                "cache_creation_input_tokens": 0,
            }),
            "otel",
        )
        store.request_end(second_run, "progress")
        store.signal_complete("claude", root)
        claimed = {}
        for _ in range(2):
            row = store.claim_outbox(time.time() + 20)
            claimed[row["audit_run_id"]] = row
            store.complete_outbox(row["audit_run_id"], row["lease_token"])
        self.assertEqual(
            "partial",
            claimed[first_run]["finalization"]["measurement"]["status"],
        )
        self.assertEqual(
            "exact",
            claimed[second_run]["finalization"]["measurement"]["status"],
        )

    def test_new_start_interrupts_live_run_and_old_start_replay_is_inert(self):
        store = self.store()
        root = store.fingerprint("codex-thread", "overlapping-starts")
        store.bind_session("codex", root, is_root=True)
        first_run = str(uuid.uuid4())
        store.start_run(
            "codex", "openai", "native", root, first_run, "J-all-335"
        )
        store.record_usage(
            "codex", root, "abandoned-usage",
            audit._openai_counts({"totalTokens": 5}), "native",
        )
        second_run = str(uuid.uuid4())
        self.assertTrue(store.start_run(
            "codex", "openai", "native", root, second_run, "J-all-336"
        ))
        self.assertEqual(
            second_run, store.session_run("codex", root)["audit_run_id"]
        )
        self.assertTrue(store.start_run(
            "codex", "openai", "native", root, first_run, "J-all-335"
        ))
        self.assertEqual(
            second_run, store.session_run("codex", root)["audit_run_id"]
        )
        interrupted = store.claim_outbox()
        self.assertEqual("interrupted", interrupted["handoff_type"])
        finalization = interrupted["finalization"]
        self.assertEqual("partial", finalization["measurement"]["status"])
        self.assertEqual(
            "session_interrupted", finalization["measurement"]["reason_code"]
        )

    def test_root_and_descendant_coverage_are_independent(self):
        store = self.store()

        def start(job, suffix):
            root = store.fingerprint("codex-thread", "coverage-root-" + suffix)
            child = store.fingerprint("codex-thread", "coverage-child-" + suffix)
            store.bind_session("codex", root, is_root=True)
            run_id = str(uuid.uuid4())
            store.start_run("codex", "openai", "native", root, run_id, job)
            store.discover_descendant("codex", root, child)
            return root, child, run_id

        root, _child, run_id = start("J-all-322", "missing-child")
        store.record_usage(
            "codex", root, "root-only",
            audit._openai_counts({"totalTokens": 4}), "native",
        )
        store.request_end(run_id, "progress")
        store.signal_complete("codex", root)
        missing = store.claim_outbox()["finalization"]
        self.assertEqual("complete", missing["coverage"]["main_session"])
        self.assertEqual("unavailable", missing["coverage"]["descendants"])
        self.assertEqual("partial", missing["measurement"]["status"])

        root, child, run_id = start("J-all-323", "partial-child")
        store.record_usage(
            "codex", root, "root-complete",
            audit._openai_counts({"totalTokens": 5}), "native",
        )
        store.mark_partial("codex", child, "collector_failure")
        store.record_usage(
            "codex", child, "child-partial",
            audit._openai_counts({"totalTokens": 6}), "native",
        )
        store.request_end(run_id, "progress")
        store.signal_complete("codex", root)
        partial_child = store.claim_outbox()["finalization"]
        self.assertEqual(
            "complete", partial_child["coverage"]["main_session"]
        )
        self.assertEqual("partial", partial_child["coverage"]["descendants"])
        self.assertEqual("partial", partial_child["measurement"]["status"])

        root, child, run_id = start("J-all-323a", "partial-root")
        store.mark_partial("codex", root, "collector_failure")
        store.record_usage(
            "codex", root, "partial-root-usage",
            audit._openai_counts({"totalTokens": 5}), "native",
        )
        store.record_usage(
            "codex", child, "complete-child-usage",
            audit._openai_counts({"totalTokens": 6}), "native",
        )
        store.request_end(run_id, "progress")
        store.signal_complete("codex", root)
        partial_root = store.claim_outbox()["finalization"]
        self.assertEqual("partial", partial_root["coverage"]["main_session"])
        self.assertEqual("complete", partial_root["coverage"]["descendants"])

        root, child, run_id = start("J-all-324", "descendant-only")
        store.record_usage(
            "codex", child, "child-only",
            audit._openai_counts({"totalTokens": 8}), "native",
        )
        store.request_end(run_id, "progress")
        store.signal_complete("codex", root)
        no_root = store.claim_outbox()["finalization"]
        self.assertEqual("unavailable", no_root["coverage"]["main_session"])
        self.assertEqual("complete", no_root["coverage"]["descendants"])
        self.assertEqual("partial", no_root["measurement"]["status"])

    def test_partial_reason_priority_is_stable_in_both_event_orders(self):
        store = self.store()
        for index, reasons in enumerate((
            ("telemetry_unavailable", "session_interrupted"),
            ("session_interrupted", "telemetry_unavailable"),
        )):
            root = store.fingerprint("codex-thread", f"reason-order-{index}")
            store.bind_session("codex", root, is_root=True)
            run_id = str(uuid.uuid4())
            store.start_run(
                "codex", "openai", "native", root, run_id,
                f"J-all-346{index}",
            )
            for reason in reasons:
                store.mark_partial("codex", root, reason)
            store.record_usage(
                "codex", root, f"priority-usage-{index}",
                audit._openai_counts({"totalTokens": 3}), "native",
            )
            store.request_end(run_id, "progress")
            store.signal_complete("codex", root)
            row = store.claim_outbox()
            self.assertEqual(
                "session_interrupted",
                row["finalization"]["measurement"]["reason_code"],
            )
            store.complete_outbox(run_id, row["lease_token"])

    def test_descendant_usage_seen_is_reset_for_next_run(self):
        store = self.store()
        root = store.fingerprint("codex-thread", "desc-root")
        child = store.fingerprint("codex-thread", "desc-child")
        store.bind_session("codex", root, is_root=True)
        first_run = str(uuid.uuid4())
        store.start_run("codex", "openai", "native", root,
                        first_run, "J-all-33")
        store.discover_descendant("codex", root, child)
        for session, key in ((root, "root-a"), (child, "child-a")):
            store.record_usage("codex", session, key,
                               audit._openai_counts({"totalTokens": 5}), "native")
        store.request_end(first_run, "progress")
        store.signal_complete("codex", root)
        claimed = store.claim_outbox()
        store.complete_outbox(first_run, claimed["lease_token"])

        second_run = str(uuid.uuid4())
        store.start_run("codex", "openai", "native", root,
                        second_run, "J-all-34")
        store.discover_descendant("codex", root, child)
        store.record_usage("codex", root, "root-b",
                           audit._openai_counts({"totalTokens": 6}), "native")
        store.request_end(second_run, "progress")
        store.signal_complete("codex", root)
        finalization = store.claim_outbox()["finalization"]
        self.assertEqual("partial", finalization["measurement"]["status"])
        self.assertEqual(
            "incomplete_descendant_coverage",
            finalization["measurement"]["reason_code"],
        )
        self.assertEqual(0, finalization["coverage"]["descendants_included"])

    def test_restart_reattaching_open_codex_run_is_partial(self):
        first = audit.CodexTokenAudit("stage", "workspace-1")
        first.set_primary_thread({"id": "restart-thread"})
        run_id = str(uuid.uuid4())
        first.observe_notification(raw_response(
            "restart-thread", "turn-1", "response-1", usage(10, 8, 2)
        ))
        first.observe_notification(mcp_item(
            "restart-thread", "turn-1", "start", "start_job_audit",
            {"job_id": "J-all-35"},
            {"schema_version": 1, "state": "active",
             "audit_run_id": run_id, "canonical_job_id": "J-all-35"},
        ))
        first.observe_notification(mcp_item(
            "restart-thread", "turn-1", "end", "end_job_audit",
            {"job_id": "J-all-35", "audit_run_id": run_id,
             "handoff_type": "progress"},
            {"schema_version": 1, "state": "pending_finalization",
             "audit_run_id": run_id, "canonical_job_id": "J-all-35",
             "handoff_type": "progress"},
        ))

        restarted = audit.CodexTokenAudit("stage", "workspace-1")
        restarted.set_primary_thread({"id": "restart-thread"})
        restarted.observe_notification({
            "method": "turn/completed",
            "params": {"threadId": "restart-thread",
                       "turn": {"id": "turn-1", "status": "completed"}},
        })
        finalization = self.store().claim_outbox()["finalization"]
        self.assertEqual("partial", finalization["measurement"]["status"])
        self.assertEqual(
            "session_interrupted", finalization["measurement"]["reason_code"]
        )

    def test_partial_before_first_claim_rebuilds_but_attempted_payload_is_immutable(self):
        store = self.store()
        session = store.fingerprint("codex-thread", "outbox-root")
        store.bind_session("codex", session, is_root=True)

        def queued_run(job, event):
            run_id = str(uuid.uuid4())
            store.start_run("codex", "openai", "native", session, run_id, job)
            store.record_usage("codex", session, event,
                               audit._openai_counts({"totalTokens": 8}), "native")
            store.request_end(run_id, "progress")
            store.signal_complete("codex", session)
            return run_id

        rebuild_run = queued_run("J-all-36", "rebuild-usage")
        with closing(store.connect()) as connection:
            rebuild_boundary = connection.execute(
                "SELECT completed_at FROM token_audit_runs "
                "WHERE audit_run_id=?", (rebuild_run,),
            ).fetchone()[0]
        store.mark_partial(
            "codex", session, "collector_failure",
            event_time=rebuild_boundary,
        )
        rebuilt = store.claim_outbox()
        self.assertEqual(rebuild_run, rebuilt["audit_run_id"])
        self.assertEqual("partial", rebuilt["finalization"]["measurement"]["status"])
        store.complete_outbox(rebuild_run, rebuilt["lease_token"])

        immutable_run = queued_run("J-all-37", "immutable-usage")
        first_claim = store.claim_outbox()
        self.assertEqual("exact", first_claim["finalization"]["measurement"]["status"])
        with closing(store.connect()) as connection:
            immutable_boundary = connection.execute(
                "SELECT completed_at FROM token_audit_runs "
                "WHERE audit_run_id=?", (immutable_run,),
            ).fetchone()[0]
        store.mark_partial(
            "codex", session, "collector_failure",
            event_time=immutable_boundary,
        )
        store.retry_outbox(
            immutable_run, first_claim["lease_token"], "test_retry"
        )
        retried = store.claim_outbox(time.time() + 10)
        self.assertEqual("exact", retried["finalization"]["measurement"]["status"])

    def test_finalized_retention_prunes_only_safe_rows_and_old_orphans(self):
        store = self.store()
        finalized_session = store.fingerprint("codex-thread", "retained-final")
        store.bind_session("codex", finalized_session, is_root=True)
        finalized_run = str(uuid.uuid4())
        store.start_run("codex", "openai", "native", finalized_session,
                        finalized_run, "J-all-38")
        store.record_usage("codex", finalized_session, "final-usage",
                           audit._openai_counts({"totalTokens": 4}), "native")
        store.request_end(finalized_run, "completed")
        store.signal_complete("codex", finalized_session)
        sent = store.claim_outbox()
        store.complete_outbox(finalized_run, sent["lease_token"])

        active_session = store.fingerprint("codex-thread", "retained-active")
        store.bind_session("codex", active_session, is_root=True)
        active_run = str(uuid.uuid4())
        store.start_run("codex", "openai", "native", active_session,
                        active_run, "J-all-39")
        pending_session = store.fingerprint("codex-thread", "retained-pending")
        store.bind_session("codex", pending_session, is_root=True)
        pending_run = str(uuid.uuid4())
        store.start_run("codex", "openai", "native", pending_session,
                        pending_run, "J-all-40")
        store.record_usage("codex", pending_session, "pending-usage",
                           audit._openai_counts({"totalTokens": 3}), "native")
        store.request_end(pending_run, "progress")
        store.signal_complete("codex", pending_session)

        orphan_session = store.fingerprint("codex-thread", "old-orphan")
        store.bind_session("codex", orphan_session, is_root=True)
        store.record_usage("codex", orphan_session, "orphan-usage",
                           audit._openai_counts({"totalTokens": 2}), "native")
        store.record_activity("codex", orphan_session, "orphan-tool")
        with closing(store.connect()) as connection, connection:
            old = time.time() - audit.ORPHAN_RETENTION_SECONDS - 10
            connection.execute(
                "UPDATE token_audit_usage SET created_at=? "
                "WHERE audit_run_id IS NULL", (old,)
            )
            connection.execute(
                "UPDATE token_audit_activity SET created_at=? "
                "WHERE audit_run_id IS NULL", (old,)
            )
            connection.execute(
                "UPDATE token_audit_sessions SET updated_at=? "
                "WHERE audit_run_id IS NULL", (old,)
            )

        future = time.time() + audit.FINALIZED_RETENTION_SECONDS + 1
        self.assertEqual(1, store.prune_retained(future))
        with closing(store.connect()) as connection:
            remaining_runs = {
                row[0] for row in connection.execute(
                    "SELECT audit_run_id FROM token_audit_runs"
                )
            }
            orphan_usage = connection.execute(
                "SELECT COUNT(*) FROM token_audit_usage "
                "WHERE audit_run_id IS NULL"
            ).fetchone()[0]
            orphan_activity = connection.execute(
                "SELECT COUNT(*) FROM token_audit_activity "
                "WHERE audit_run_id IS NULL"
            ).fetchone()[0]
        self.assertNotIn(finalized_run, remaining_runs)
        self.assertIn(active_run, remaining_runs)
        self.assertIn(pending_run, remaining_runs)
        self.assertEqual(0, orphan_usage)
        self.assertEqual(0, orphan_activity)

    def test_opted_out_proxy_launch_prunes_unpublished_rows_after_30_days(self):
        store = self.store()
        active_session = store.fingerprint("codex-thread", "expired-active")
        store.bind_session("codex", active_session, is_root=True)
        active_run = str(uuid.uuid4())
        store.start_run(
            "codex", "openai", "native", active_session,
            active_run, "J-all-530",
        )

        pending_session = store.fingerprint("codex-thread", "expired-pending")
        store.bind_session("codex", pending_session, is_root=True)
        pending_run = str(uuid.uuid4())
        store.start_run(
            "codex", "openai", "native", pending_session,
            pending_run, "J-all-531",
        )
        store.record_usage(
            "codex", pending_session, "expired-usage",
            audit._openai_counts({"totalTokens": 3}), "native",
        )
        store.request_end(pending_run, "progress")
        store.signal_complete("codex", pending_session)

        other = audit.AuditStore("stage", "workspace-2")
        other_session = other.fingerprint("codex-thread", "other-workspace")
        other.bind_session("codex", other_session, is_root=True)
        other_run = str(uuid.uuid4())
        other.start_run(
            "codex", "openai", "native", other_session,
            other_run, "J-all-532",
        )

        expired = time.time() - audit.UNPUBLISHED_RETENTION_SECONDS - 1
        with closing(store.connect()) as connection, connection:
            connection.execute(
                "UPDATE token_audit_runs SET started_at=? "
                "WHERE audit_run_id IN (?, ?, ?)",
                (expired, active_run, pending_run, other_run),
            )

        # This is the same cleanup path the ordinary MCP proxy invokes even
        # when --token-audit is absent after the user opts out.
        self.assertEqual(
            2, proxy.prune_token_audit_storage("stage", "workspace-1")
        )
        with closing(store.connect()) as connection:
            remaining = {
                row[0] for row in connection.execute(
                    "SELECT audit_run_id FROM token_audit_runs"
                )
            }
            pending_outbox = connection.execute(
                "SELECT COUNT(*) FROM token_audit_outbox "
                "WHERE audit_run_id=?", (pending_run,),
            ).fetchone()[0]
        self.assertNotIn(active_run, remaining)
        self.assertNotIn(pending_run, remaining)
        self.assertIn(other_run, remaining)
        self.assertEqual(0, pending_outbox)

    def test_transcript_checkpoint_resumes_after_forced_interruption(self):
        store = self.store()
        session = store.fingerprint("claude-session", "checkpoint-session")
        store.bind_session("claude", session, is_root=True)
        run_id = str(uuid.uuid4())
        store.start_run("claude", "anthropic", "transcript_fallback",
                        session, run_id, "J-all-41")
        transcript = os.path.join(self.temporary.name, "checkpoint.jsonl")
        with open(transcript, "w", encoding="utf-8") as destination:
            for index in range(20):
                destination.write(json.dumps({
                    "type": "assistant",
                    "uuid": f"entry-{index}",
                    "version": "2.1.222",
                    "timestamp": audit._utc_iso(),
                    "message": {
                        "id": f"message-{index}",
                        "model": "claude-opus-4-1",
                        "usage": {
                            "input_tokens": 1, "output_tokens": 1,
                            "cache_read_input_tokens": 0,
                            "cache_creation_input_tokens": 0,
                        },
                        "content": [],
                    },
                }, separators=(",", ":")) + "\n")
        real_save = audit._save_transcript_position
        checkpoints = []

        def interrupt_after_checkpoint(*args):
            real_save(*args)
            checkpoints.append(args[3])
            raise TimeoutError("simulated hook deadline")

        with mock.patch.object(audit, "TRANSCRIPT_SCAN_CHUNK", 512), \
                mock.patch.object(
                    audit, "_save_transcript_position",
                    side_effect=interrupt_after_checkpoint,
                ):
            with self.assertRaises(TimeoutError):
                audit.scan_claude_transcript(store, session, transcript)
        self.assertGreater(checkpoints[0], 0)
        self.assertLess(checkpoints[0], os.path.getsize(transcript))
        with mock.patch.object(audit, "TRANSCRIPT_SCAN_CHUNK", 512):
            audit.scan_claude_transcript(store, session, transcript)
        store.request_end(run_id, "progress")
        store.signal_complete("claude", session)
        finalization = store.claim_outbox()["finalization"]
        self.assertEqual(40, finalization["measurement"]["normalized_total_tokens"])

    def test_transcript_checkpoint_never_skips_deferred_prestart_tool(self):
        store = self.store()
        session = store.fingerprint("claude-session", "deferred-tool")
        store.bind_session("claude", session, is_root=True)
        run_id = str(uuid.uuid4())
        store.start_run(
            "claude", "anthropic", "transcript_fallback",
            session, run_id, "J-all-545",
        )
        started = float(store.session_run(
            "claude", session
        )["started_at"])
        transcript = os.path.join(self.temporary.name, "deferred-tool.jsonl")
        Path(transcript).write_text(json.dumps({
            "type": "assistant",
            "uuid": "deferred-request",
            "version": "2.1.222",
            "timestamp": audit._utc_iso(started - 1),
            "message": {
                "id": "deferred-message",
                "model": "claude-opus-4-1",
                "usage": {
                    "input_tokens": 2, "output_tokens": 1,
                    "cache_read_input_tokens": 0,
                    "cache_creation_input_tokens": 0,
                },
                "content": [{
                    "type": "tool_use", "id": "deferred-test-tool",
                    "name": "Bash", "input": {"command": "pytest -q"},
                }],
            },
        }, separators=(",", ":")) + "\n", encoding="utf-8")
        real_backfill = store.backfill_start_request
        interrupted = False

        def stop_after_chunk(*args, **kwargs):
            nonlocal interrupted
            result = real_backfill(*args, **kwargs)
            if not interrupted:
                interrupted = True
                raise TimeoutError("simulated hook termination")
            return result

        with mock.patch.object(
            store, "backfill_start_request", side_effect=stop_after_chunk
        ), self.assertRaises(TimeoutError):
            audit.scan_claude_transcript(store, session, transcript)
        self.assertEqual(
            0,
            audit._transcript_position(
                store,
                session,
                store.fingerprint("claude-transcript-path", transcript),
            ),
        )

        audit.scan_claude_transcript(store, session, transcript)
        store.request_end(run_id, "progress")
        store.signal_complete("claude", session)
        finalization = store.claim_outbox(
            time.time() + audit.CLAUDE_TRANSCRIPT_GRACE_SECONDS + 1
        )["finalization"]
        self.assertEqual(1, finalization["activity"]["tool_calls"])
        self.assertEqual(1, finalization["activity"]["test_commands"])

    def test_transcript_marker_and_stop_survive_scan_timeout(self):
        store = self.store()
        session = store.fingerprint("claude-session", "timeout-session")
        run_id = str(uuid.uuid4())
        start_payload = {
            "hook_event_name": "PostToolUse",
            "session_id": "timeout-session",
            "transcript_path": os.path.join(self.temporary.name, "large.jsonl"),
            "tool_name": "mcp__Uclusion__start_job_audit",
            "tool_input": {"job_id": "J-all-42"},
            "tool_response": {"structuredContent": {
                "schema_version": 1, "state": "active",
                "audit_run_id": run_id, "canonical_job_id": "J-all-42",
            }},
            "tool_use_id": "start-timeout",
        }
        with mock.patch.object(
            audit, "scan_claude_transcript", side_effect=TimeoutError
        ):
            with self.assertRaises(TimeoutError):
                audit.process_claude_hook(
                    "stage", "workspace-1", "transcript", start_payload
                )
        self.assertEqual(run_id, store.session_run(
            "claude", session
        )["audit_run_id"])
        store.request_end(
            run_id, "progress", client="claude", session_fp=session,
            job_id="J-all-42",
        )
        with mock.patch.object(
            audit, "scan_claude_transcript", side_effect=TimeoutError
        ):
            with self.assertRaises(TimeoutError):
                audit.process_claude_hook(
                    "stage", "workspace-1", "transcript", {
                        "hook_event_name": "Stop",
                        "session_id": "timeout-session",
                        "transcript_path": start_payload["transcript_path"],
                    }
                )
        row = store.claim_outbox(
            time.time()
            + audit.CLAUDE_TRANSCRIPT_HOOK_DEADLINE_GRACE_SECONDS + 1
        )
        self.assertIsNotNone(row)
        self.assertEqual("unavailable", row["finalization"]["measurement"]["status"])

    def test_next_prompt_closes_interrupted_turn_before_new_usage(self):
        store = self.store()
        session = store.fingerprint("claude-session", "interrupted-session")
        store.bind_session("claude", session, is_root=True)
        run_id = str(uuid.uuid4())
        store.start_run(
            "claude", "anthropic", "otel", session, run_id, "J-all-325"
        )
        store.record_usage(
            "claude", session, "old-turn",
            audit._anthropic_counts({
                "input_tokens": 6,
                "output_tokens": 3,
                "cache_read_input_tokens": 0,
                "cache_creation_input_tokens": 0,
            }),
            "otel",
        )
        store.request_end(run_id, "progress")

        # Claude emits no Stop when the user interrupts the final response.
        audit.process_claude_hook(
            "stage", "workspace-1", "otel", {
                "hook_event_name": "UserPromptSubmit",
                "session_id": "interrupted-session",
            },
        )
        with closing(store.connect()) as connection:
            completed_at = connection.execute(
                "SELECT completed_at FROM token_audit_runs "
                "WHERE audit_run_id=?", (run_id,),
            ).fetchone()[0]
        audit.process_claude_hook(
            "stage", "workspace-1", "otel", {
                "hook_event_name": "Stop",
                "session_id": "interrupted-session",
            },
        )
        with closing(store.connect()) as connection:
            repeated_boundary = connection.execute(
                "SELECT completed_at FROM token_audit_runs "
                "WHERE audit_run_id=?", (run_id,),
            ).fetchone()[0]
        self.assertEqual(completed_at, repeated_boundary)
        def attr(key, value):
            value_key = "intValue" if isinstance(value, int) else "stringValue"
            return {"key": key, "value": {value_key: value}}

        payload = {"resourceLogs": [{"scopeLogs": [{"logRecords": [{
            "timeUnixNano": str(int((completed_at + 0.1) * 1_000_000_000)),
            "body": {"stringValue": "claude_code.api_request"},
            "attributes": [
                attr("event.name", "api_request"),
                attr("session.id", "interrupted-session"),
                attr("request_id", "next-turn"),
                attr("input_tokens", 10),
                attr("output_tokens", 5),
                attr("cache_read_tokens", 3),
                attr("cache_creation_tokens", 2),
            ],
        }]}]}]}
        self.assertEqual(1, audit.ingest_otlp_json(store, payload))
        finalization = store.claim_outbox(
            time.time() + audit.CLAUDE_EXPORT_GRACE_SECONDS + 1
        )["finalization"]
        self.assertEqual(9, finalization["measurement"]["normalized_total_tokens"])
        self.assertEqual("partial", finalization["measurement"]["status"])
        self.assertEqual(
            "session_interrupted", finalization["measurement"]["reason_code"]
        )
        with closing(store.connect()) as connection:
            orphaned = connection.execute(
                "SELECT audit_run_id FROM token_audit_usage "
                "WHERE event_key=?",
                (store.fingerprint(
                    "usage-event", "claude\0interrupted-session\0next-turn"
                ),),
            ).fetchone()
        self.assertIsNotNone(orphaned)
        self.assertIsNone(orphaned[0])


class OtlpAndOutboxTests(TokenAuditTestCase):
    @staticmethod
    def attr(key, value):
        value_key = "intValue" if isinstance(value, int) else "stringValue"
        return {"key": key, "value": {value_key: value}}

    def otlp_payload(self, session="otel-session", request="request-1",
                     secret=None, timestamp_ns=None,
                     duplicate=True, prompt=None, sequence=None):
        if timestamp_ns is None:
            timestamp_ns = int(time.time() * 1_000_000_000)
        attributes = [
            self.attr("event.name", "api_request"),
            self.attr("session.id", session),
            self.attr("input_tokens", 10),
            self.attr("output_tokens", 5),
            self.attr("cache_read_tokens", 3),
            self.attr("cache_creation_tokens", 2),
            self.attr("model", "claude-opus-4-1"),
        ]
        if request is not None:
            attributes.append(self.attr("request_id", request))
        if prompt is not None:
            attributes.append(self.attr("prompt.id", prompt))
        if sequence is not None:
            attributes.append(self.attr("event.sequence", sequence))
        if secret is not None:
            attributes.append(self.attr("prompt", secret))
        record = {
            "timeUnixNano": str(timestamp_ns),
            "body": {"stringValue": "claude_code.api_request"},
            "attributes": attributes,
        }
        records = [record, record] if duplicate else [record]
        return {"resourceLogs": [{"scopeLogs": [{"logRecords": records}]}]}

    def test_otel_sequence_dedup_does_not_collapse_one_prompt_multiple_requests(self):
        store = self.store()
        session_fp = store.fingerprint("claude-session", "otel-session")
        run_id = str(uuid.uuid4())
        store.bind_session("claude", session_fp, is_root=True)
        store.start_run(
            "claude", "anthropic", "otel", session_fp, run_id, "J-all-10"
        )
        for sequence in (20, 21):
            payload = self.otlp_payload(
                request=None,
                prompt="one-prompt-many-api-requests",
                sequence=sequence,
                duplicate=False,
            )
            self.assertEqual(1, audit.ingest_otlp_json(store, payload))
        store.request_end(run_id, "progress")
        store.signal_complete("claude", session_fp)
        total = self.store().claim_outbox()["finalization"]["measurement"][
            "normalized_total_tokens"
        ]
        self.assertEqual(40, total)

    def test_late_otel_export_uses_provider_time_for_phase_boundary(self):
        store = self.store()
        session_fp = store.fingerprint("claude-session", "otel-session")
        run_id = str(uuid.uuid4())
        store.bind_session("claude", session_fp, is_root=True)
        store.start_run(
            "claude", "anthropic", "otel", session_fp, run_id, "J-all-9"
        )
        before_marker = time.time() - 0.5
        store.set_phase(run_id, "testing", 1)
        after_marker = time.time()
        # Both exports arrive after the marker. Event time keeps the request
        # that invoked the marker in planning and applies testing only next.
        audit.ingest_otlp_json(store, self.otlp_payload(
            request="before", timestamp_ns=int(before_marker * 1_000_000_000),
            duplicate=False,
        ))
        audit.ingest_otlp_json(store, self.otlp_payload(
            request="after", timestamp_ns=int(after_marker * 1_000_000_000),
            duplicate=False,
        ))
        store.request_end(run_id, "progress")
        store.signal_complete("claude", session_fp)
        phases = store.claim_outbox()["finalization"]["phases"]
        self.assertEqual(20, phases["planning"])
        self.assertEqual(20, phases["testing"])

    def test_delayed_pre_job_batch_backfills_only_newest_start_request(self):
        store = self.store()
        session_fp = store.fingerprint("claude-session", "otel-session")
        store.bind_session("claude", session_fp, is_root=True)
        run_id = str(uuid.uuid4())
        store.start_run(
            "claude", "anthropic", "otel", session_fp, run_id, "J-all-11"
        )
        run = store.session_run("claude", session_fp)
        started = float(run["started_at"])
        old = self.otlp_payload(
            request="old-history",
            timestamp_ns=int((started - 120) * 1_000_000_000),
            duplicate=False,
        )["resourceLogs"][0]["scopeLogs"][0]["logRecords"][0]
        current = self.otlp_payload(
            request="start-request",
            timestamp_ns=int((started - 1) * 1_000_000_000),
            duplicate=False,
        )["resourceLogs"][0]["scopeLogs"][0]["logRecords"][0]
        after = self.otlp_payload(
            request="after-start",
            timestamp_ns=int((started + 1) * 1_000_000_000),
            duplicate=False,
        )["resourceLogs"][0]["scopeLogs"][0]["logRecords"][0]
        payload = {"resourceLogs": [{"scopeLogs": [{
            "logRecords": [old, current, after]
        }]}]}
        self.assertEqual(3, audit.ingest_otlp_json(store, payload))
        store.request_end(run_id, "progress")
        store.signal_complete("claude", session_fp)
        finalization = store.claim_outbox()["finalization"]
        self.assertEqual(
            40, finalization["measurement"]["normalized_total_tokens"]
        )
        self.assertEqual(40, finalization["phases"]["planning"])

    def test_otlp_dedupes_normalizes_and_never_persists_unlisted_content(self):
        store = self.store()
        session_fp = store.fingerprint("claude-session", "otel-session")
        run_id = str(uuid.uuid4())
        store.bind_session("claude", session_fp, is_root=True)
        self.assertTrue(store.start_run(
            "claude", "anthropic", "otel", session_fp, run_id, "J-all-7"
        ))
        secret = "DO-NOT-PERSIST-secret-prompt"
        self.assertEqual(1, audit.ingest_otlp_json(
            store, self.otlp_payload(secret=secret)
        ))
        store.request_end(run_id, "completed")
        store.signal_complete("claude", session_fp)
        finalization = store.claim_outbox()["finalization"]
        self.assertEqual(20, finalization["measurement"]["normalized_total_tokens"])
        self.assertEqual("exact", finalization["measurement"]["status"])
        for candidate in (
            self.db_path, self.db_path + "-wal", self.db_path + "-shm"
        ):
            if os.path.exists(candidate):
                self.assertNotIn(secret.encode(), Path(candidate).read_bytes())

    def test_observation_time_without_provider_time_is_partial(self):
        store = self.store()
        session_fp = store.fingerprint("claude-session", "otel-session")
        run_id = str(uuid.uuid4())
        store.bind_session("claude", session_fp, is_root=True)
        store.start_run(
            "claude", "anthropic", "otel", session_fp, run_id, "J-all-15"
        )
        payload = self.otlp_payload(duplicate=False)
        record = payload["resourceLogs"][0]["scopeLogs"][0]["logRecords"][0]
        record["observedTimeUnixNano"] = record.pop("timeUnixNano")
        self.assertEqual(1, audit.ingest_otlp_json(store, payload))
        store.request_end(run_id, "progress")
        store.signal_complete("claude", session_fp)
        measurement = store.claim_outbox()["finalization"]["measurement"]
        self.assertEqual("partial", measurement["status"])
        self.assertEqual("collector_failure", measurement["reason_code"])

    def test_missing_provider_time_during_completion_grace_marks_old_run(self):
        store = self.store()
        session = store.fingerprint("claude-session", "missing-time-grace")
        store.bind_session("claude", session, is_root=True)
        run_id = str(uuid.uuid4())
        store.start_run(
            "claude", "anthropic", "otel", session, run_id, "J-all-537"
        )
        store.record_usage(
            "claude", session, "on-time",
            audit._anthropic_counts({
                "input_tokens": 2, "output_tokens": 1,
                "cache_read_input_tokens": 0,
                "cache_creation_input_tokens": 0,
            }), "otel",
        )
        store.request_end(run_id, "progress")
        store.signal_complete("claude", session, grace=10)

        payload = self.otlp_payload(
            session="missing-time-grace", request="unplaceable",
            duplicate=False,
        )
        record = payload["resourceLogs"][0]["scopeLogs"][0]["logRecords"][0]
        record.pop("timeUnixNano")
        self.assertEqual(1, audit.ingest_otlp_json(store, payload))

        finalization = store.claim_outbox(time.time() + 20)["finalization"]
        self.assertEqual(3, finalization["measurement"][
            "normalized_total_tokens"
        ])
        self.assertEqual("partial", finalization["measurement"]["status"])
        self.assertEqual(
            "collector_failure", finalization["measurement"]["reason_code"]
        )

    def test_invalid_or_oversized_otlp_counters_never_finalize_exact(self):
        invalid_values = (-1, "not-a-counter", "9" * 5000, 10 ** 5000)
        for index, invalid in enumerate(invalid_values):
            with self.subTest(index=index):
                store = self.store()
                session_id = f"invalid-counter-{index}"
                session = store.fingerprint("claude-session", session_id)
                store.bind_session("claude", session, is_root=True)
                run_id = str(uuid.uuid4())
                store.start_run(
                    "claude", "anthropic", "otel", session,
                    run_id, f"J-all-54{index}",
                )
                store.record_usage(
                    "claude", session, f"valid-{index}",
                    audit._anthropic_counts({
                        "input_tokens": 1, "output_tokens": 1,
                        "cache_read_input_tokens": 0,
                        "cache_creation_input_tokens": 0,
                    }), "otel",
                )
                payload = self.otlp_payload(
                    session=session_id, request=f"invalid-{index}",
                    duplicate=False,
                )
                record = payload["resourceLogs"][0]["scopeLogs"][0][
                    "logRecords"
                ][0]
                for item in record["attributes"]:
                    if item["key"] == "cache_read_tokens":
                        value_key = (
                            "intValue" if isinstance(invalid, int)
                            else "stringValue"
                        )
                        item["value"] = {value_key: invalid}
                self.assertEqual(0, audit.ingest_otlp_json(store, payload))
                store.request_end(run_id, "progress")
                store.signal_complete("claude", session)
                measurement = store.claim_outbox(
                    time.time() + audit.CLAUDE_EXPORT_GRACE_SECONDS + 1
                )["finalization"]["measurement"]
                self.assertEqual("partial", measurement["status"])
                self.assertEqual(2, measurement["normalized_total_tokens"])

    def test_loopback_receiver_accepts_otlp_json_and_exposes_scoped_health(self):
        store = self.store()
        receiver = audit.LocalOtlpReceiver(store, 0)
        receiver.start()
        self.addCleanup(receiver.close)
        port = receiver.server.server_address[1]
        request = urllib.request.Request(
            f"http://127.0.0.1:{port}/v1/logs",
            data=json.dumps(self.otlp_payload()).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=2) as response:
            self.assertEqual(200, response.status)
            self.assertEqual({"partialSuccess": {}}, json.load(response))
        with urllib.request.urlopen(
            f"http://127.0.0.1:{port}/uclusion-token-audit/health",
            timeout=2,
        ) as response:
            health = json.load(response)
        self.assertEqual(1, health["schema_version"])
        self.assertEqual(64, len(health["scope"]))

    def test_otel_root_stream_accounts_for_discovered_descendant(self):
        self.store()  # Seed healthy OTel source state used by start_run.
        run_id = str(uuid.uuid4())
        audit.process_claude_hook(
            "stage", "workspace-1", "otel", {
                "hook_event_name": "PostToolUse",
                "session_id": "otel-descendant-session",
                "tool_name": "mcp__Uclusion__start_job_audit",
                "tool_input": {"job_id": "J-all-326"},
                "tool_response": {"structuredContent": {
                    "schema_version": 1,
                    "state": "active",
                    "audit_run_id": run_id,
                    "canonical_job_id": "J-all-326",
                }},
                "tool_use_id": "descendant-start",
            },
        )
        audit.process_claude_hook(
            "stage", "workspace-1", "otel", {
                "hook_event_name": "SubagentStart",
                "session_id": "otel-descendant-session",
                "agent_id": "child-1",
            },
        )
        payload = self.otlp_payload(
            session="otel-descendant-session",
            request="child-query-in-root-stream",
            duplicate=False,
        )
        record = payload["resourceLogs"][0]["scopeLogs"][0]["logRecords"][0]
        record["attributes"].append(self.attr("query_source", "subagent"))
        self.assertEqual(1, audit.ingest_otlp_json(self.store(), payload))
        audit.process_claude_hook(
            "stage", "workspace-1", "otel", {
                "hook_event_name": "PostToolUse",
                "session_id": "otel-descendant-session",
                "tool_name": "mcp__Uclusion__end_job_audit",
                "tool_input": {
                    "job_id": "J-all-326",
                    "audit_run_id": run_id,
                    "handoff_type": "progress",
                },
                "tool_response": {"structuredContent": {
                    "schema_version": 1,
                    "state": "pending_finalization",
                    "audit_run_id": run_id,
                    "canonical_job_id": "J-all-326",
                    "handoff_type": "progress",
                }},
                "tool_use_id": "descendant-end",
            },
        )
        audit.process_claude_hook(
            "stage", "workspace-1", "otel", {
                "hook_event_name": "Stop",
                "session_id": "otel-descendant-session",
            },
        )
        finalization = self.store().claim_outbox(
            time.time() + audit.CLAUDE_EXPORT_GRACE_SECONDS + 1
        )["finalization"]
        self.assertEqual("exact", finalization["measurement"]["status"])
        self.assertEqual(1, finalization["coverage"]["descendants_discovered"])
        self.assertEqual(1, finalization["coverage"]["descendants_included"])
        self.assertEqual("complete", finalization["coverage"]["descendants"])

    def test_otel_tool_decision_and_result_count_one_execution(self):
        store = self.store()
        session = store.fingerprint("claude-session", "tool-pair-session")
        store.bind_session("claude", session, is_root=True)
        run_id = str(uuid.uuid4())
        store.start_run(
            "claude", "anthropic", "otel", session, run_id, "J-all-327"
        )
        store.record_usage(
            "claude", session, "paired-tool-usage",
            audit._anthropic_counts({
                "input_tokens": 4,
                "output_tokens": 2,
                "cache_read_input_tokens": 0,
                "cache_creation_input_tokens": 0,
            }),
            "otel",
        )
        timestamp = str(int(time.time() * 1_000_000_000))

        def tool_record(event):
            return {
                "timeUnixNano": timestamp,
                "body": {"stringValue": "claude_code." + event},
                "attributes": [
                    self.attr("event.name", event),
                    self.attr("session.id", "tool-pair-session"),
                    self.attr("tool.id", "tool-use-1"),
                    self.attr("tool.name", "Bash"),
                    self.attr("success", "true"),
                ],
            }

        payload = {"resourceLogs": [{"scopeLogs": [{"logRecords": [
            tool_record("tool_decision"), tool_record("tool_result"),
        ]}]}]}
        self.assertEqual(0, audit.ingest_otlp_json(store, payload))
        store.request_end(run_id, "progress")
        store.signal_complete("claude", session)
        activity = store.claim_outbox()["finalization"]["activity"]
        self.assertEqual(1, activity["tool_calls"])

    def test_receiver_takeover_marks_overlapping_run_partial(self):
        probe = socket.socket()
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]
        probe.close()
        first = audit.TokenAuditProxy(
            "stage", "workspace-1", "otel", "claude", port, lambda _row: None
        )
        second = audit.TokenAuditProxy(
            "stage", "workspace-1", "otel", "claude", port, lambda _row: None
        )
        self.addCleanup(second.close)
        self.addCleanup(first.close)
        store = second.store
        session = store.fingerprint("claude-session", "receiver-gap")
        store.bind_session("claude", session, is_root=True)
        run_id = str(uuid.uuid4())
        store.start_run(
            "claude", "anthropic", "otel", session, run_id, "J-all-328"
        )
        first.close()
        second._maintain_receiver()
        with closing(store.connect()) as connection:
            reason = connection.execute(
                "SELECT partial_reason FROM token_audit_runs "
                "WHERE audit_run_id=?", (run_id,),
            ).fetchone()[0]
        self.assertEqual("telemetry_unavailable", reason)
        self.assertIsNotNone(second.receiver.server)

    def test_non_uclusion_port_owner_marks_new_otel_run_partial(self):
        store = self.store()
        foreign = audit._AuditHTTPServer(
            ("127.0.0.1", 0), audit._OtlpHandler
        )
        foreign.audit_store = store
        foreign.scope_token = "foreign-scope"
        thread = threading.Thread(target=foreign.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(thread.join, 1)
        self.addCleanup(foreign.server_close)
        self.addCleanup(foreign.shutdown)
        runtime = audit.TokenAuditProxy(
            "stage", "workspace-1", "otel", "claude",
            foreign.server_address[1], lambda _row: None,
        )
        self.addCleanup(runtime.close)
        session = runtime.store.fingerprint(
            "claude-session", "foreign-port-session"
        )
        runtime.store.bind_session("claude", session, is_root=True)
        run_id = str(uuid.uuid4())
        runtime.store.start_run(
            "claude", "anthropic", "otel", session, run_id, "J-all-329"
        )
        with closing(runtime.store.connect()) as connection:
            reason = connection.execute(
                "SELECT partial_reason FROM token_audit_runs "
                "WHERE audit_run_id=?", (run_id,),
            ).fetchone()[0]
        self.assertEqual("telemetry_unavailable", reason)

    def test_proxy_startup_rebuilds_queued_payload_after_otel_gap(self):
        store = self.store()
        session = store.fingerprint("claude-session", "queued-gap-session")
        store.bind_session("claude", session, is_root=True)
        run_id = str(uuid.uuid4())
        store.start_run(
            "claude", "anthropic", "otel", session, run_id, "J-all-330"
        )
        store.record_usage(
            "claude", session, "queued-gap-usage",
            audit._anthropic_counts({
                "input_tokens": 4,
                "output_tokens": 2,
                "cache_read_input_tokens": 0,
                "cache_creation_input_tokens": 0,
            }),
            "otel",
        )
        store.request_end(run_id, "progress")
        store.signal_complete("claude", session)
        store.prepare_due_outbox()

        probe = socket.socket()
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]
        probe.close()
        published = []
        delivered = threading.Event()

        def publish(row):
            published.append(row)
            delivered.set()

        runtime = audit.TokenAuditProxy(
            "stage", "workspace-1", "otel", "claude", port, publish
        )
        self.addCleanup(runtime.close)
        self.assertTrue(delivered.wait(3), "rebuilt outbox was not published")
        self.assertEqual(run_id, published[0]["audit_run_id"])
        self.assertEqual(
            "partial", published[0]["finalization"]["measurement"]["status"]
        )
        self.assertEqual(
            "telemetry_unavailable",
            published[0]["finalization"]["measurement"]["reason_code"],
        )

    def test_publisher_loop_survives_retry_and_completion_store_errors(self):
        def exercise(publish_error, store_method):
            runtime = audit.TokenAuditProxy.__new__(audit.TokenAuditProxy)
            runtime.source = "native"
            runtime.receiver = None
            runtime.stop_event = threading.Event()

            class FailingStore:
                def __init__(self):
                    self.claims = 0

                def claim_outbox(inner_self):
                    inner_self.claims += 1
                    if inner_self.claims == 1:
                        return {
                            "audit_run_id": "run-1",
                            "lease_token": "lease-1",
                        }
                    runtime.stop_event.set()
                    return None

                def complete_outbox(inner_self, *_args):
                    if store_method == "complete":
                        raise sqlite3.OperationalError("injected")

                def retry_outbox(inner_self, *_args):
                    if store_method == "retry":
                        raise sqlite3.OperationalError("injected")

                def prune_retained(inner_self):
                    return None

            runtime.store = FailingStore()

            def publish(_row):
                if publish_error:
                    raise RuntimeError("injected publish failure")

            runtime.publish = publish
            runtime._publish_loop()
            # The normal retry iteration plus the bounded shutdown drain both
            # survive a store error without killing the publisher.
            self.assertEqual(3, runtime.store.claims)

        exercise(False, "complete")
        exercise(True, "retry")

    def test_publisher_shutdown_performs_one_final_due_outbox_drain(self):
        store = self.store()
        session = store.fingerprint("codex-thread", "shutdown-drain")
        store.bind_session("codex", session, is_root=True)
        run_id = str(uuid.uuid4())
        store.start_run(
            "codex", "openai", "native", session, run_id, "J-all-546"
        )
        store.record_usage(
            "codex", session, "shutdown-usage",
            audit._openai_counts({"totalTokens": 5}), "native",
        )
        store.request_end(run_id, "review_requested")
        store.signal_complete("codex", session)

        runtime = audit.TokenAuditProxy.__new__(audit.TokenAuditProxy)
        runtime.store = store
        runtime.source = "native"
        runtime.receiver = None
        runtime.stop_event = threading.Event()
        runtime.stop_event.set()
        published = []
        runtime.publish = published.append
        runtime._publish_loop()

        self.assertEqual([run_id], [row["audit_run_id"] for row in published])
        with closing(store.connect()) as connection:
            state = connection.execute(
                "SELECT state FROM token_audit_runs WHERE audit_run_id=?",
                (run_id,),
            ).fetchone()["state"]
        self.assertEqual("finalized", state)

    def test_late_activity_rebuilds_unattempted_payload(self):
        store = self.store()
        session = store.fingerprint("codex-thread", "late-activity")
        store.bind_session("codex", session, is_root=True)
        run_id = str(uuid.uuid4())
        store.start_run(
            "codex", "openai", "native", session, run_id, "J-all-344"
        )
        store.record_usage(
            "codex", session, "late-activity-usage",
            audit._openai_counts({"totalTokens": 5}), "native",
        )
        store.request_end(run_id, "progress")
        store.signal_complete("codex", session)
        with closing(store.connect()) as connection:
            boundary = connection.execute(
                "SELECT completed_at FROM token_audit_runs "
                "WHERE audit_run_id=?", (run_id,),
            ).fetchone()[0]
        self.assertTrue(store.record_activity(
            "codex", session, "late-tool", created_at=boundary
        ))
        finalization = store.claim_outbox()["finalization"]
        self.assertEqual(1, finalization["activity"]["tool_calls"])

    def test_outbox_claim_retry_and_completion_are_durable(self):
        store = self.store()
        session_fp = store.fingerprint("codex-thread", "root")
        run_id = str(uuid.uuid4())
        store.bind_session("codex", session_fp, is_root=True)
        store.record_usage(
            "codex", session_fp, "before-start", usage(1, 1, 0), "native"
        )
        # record_usage expects normalized snake-case counts in this direct path.
        with closing(store.connect()) as connection, connection:
            connection.execute("DELETE FROM token_audit_usage")
        store.start_run("codex", "openai", "native", session_fp,
                        run_id, "J-all-8")
        store.record_usage(
            "codex", session_fp, "request", audit._openai_counts(usage(9, 7, 2)),
            "native"
        )
        store.request_end(run_id, "progress")
        store.signal_complete("codex", session_fp)
        claimed = store.claim_outbox()
        self.assertEqual(run_id, claimed["audit_run_id"])
        store.retry_outbox(run_id, claimed["lease_token"], "network")
        store.record_usage(
            "codex", session_fp, "late-request",
            audit._openai_counts(usage(4, 3, 1)), "native"
        )
        with closing(store.connect()) as connection:
            immutable = connection.execute(
                """
                SELECT attempts, finalization_json FROM token_audit_outbox
                WHERE audit_run_id=?
                """,
                (run_id,),
            ).fetchone()
        self.assertEqual(1, immutable["attempts"])
        self.assertEqual(
            claimed["finalization"], json.loads(immutable["finalization_json"])
        )
        with closing(store.connect()) as connection:
            connection.execute(
                "UPDATE token_audit_outbox SET next_attempt_at=0 WHERE audit_run_id=?",
                (run_id,),
            )
            connection.commit()
        retried = audit.AuditStore("stage", "workspace-1").claim_outbox()
        self.assertEqual(run_id, retried["audit_run_id"])
        store.complete_outbox(run_id, retried["lease_token"])
        with closing(store.connect()) as connection:
            state = connection.execute(
                "SELECT state FROM token_audit_runs WHERE audit_run_id=?",
                (run_id,),
            ).fetchone()["state"]
        self.assertEqual("finalized", state)

    def test_stale_outbox_lease_cannot_overwrite_new_claimant(self):
        store = self.store()
        session_fp = store.fingerprint("codex-thread", "lease-root")
        store.bind_session("codex", session_fp, is_root=True)
        run_id = str(uuid.uuid4())
        store.start_run(
            "codex", "openai", "native", session_fp, run_id, "J-all-12"
        )
        store.record_usage(
            "codex", session_fp, "request",
            audit._openai_counts(usage(3, 2, 1)), "native",
        )
        store.request_end(run_id, "progress")
        store.signal_complete("codex", session_fp)
        now = time.time()
        first = store.claim_outbox(now)
        second = store.claim_outbox(now + audit.OUTBOX_LEASE_SECONDS + 1)
        self.assertNotEqual(first["lease_token"], second["lease_token"])
        self.assertTrue(store.complete_outbox(run_id, second["lease_token"]))
        self.assertFalse(store.retry_outbox(
            run_id, first["lease_token"], "stale-worker"
        ))
        with closing(store.connect()) as connection:
            row = connection.execute(
                "SELECT state, attempts FROM token_audit_outbox "
                "WHERE audit_run_id=?", (run_id,)
            ).fetchone()
        self.assertEqual("sent", row["state"])
        self.assertEqual(0, row["attempts"])

    def test_finalization_uses_persisted_completion_time(self):
        store = self.store()
        session_fp = store.fingerprint("codex-thread", "clock-root")
        store.bind_session("codex", session_fp, is_root=True)
        run_id = str(uuid.uuid4())
        store.start_run(
            "codex", "openai", "native", session_fp, run_id, "J-all-13"
        )
        started = float(store.session_run("codex", session_fp)["started_at"])
        store.record_usage(
            "codex", session_fp, "request",
            audit._openai_counts(usage(3, 2, 1)), "native",
        )
        store.request_end(run_id, "progress")
        completed = started + 5
        with mock.patch.object(audit.time, "time", return_value=completed):
            store.signal_complete("codex", session_fp)
        finalization = store.claim_outbox(started + 5000)["finalization"]
        self.assertEqual(
            audit._utc_iso(completed), finalization["window"]["ended_at"]
        )
        self.assertEqual(5000, finalization["window"]["elapsed_ms"])


class ProxyContractTests(TokenAuditTestCase):
    def test_codex_readiness_lease_is_owner_scoped_fresh_and_revocable(self):
        first_path = os.path.join(self.temporary.name, "first.ready")
        second_path = os.path.join(self.temporary.name, "second.ready")
        first = audit.CodexCollectorLease(first_path, "launch-one")
        second = audit.CodexCollectorLease(second_path, "launch-two")
        self.addCleanup(first.close)
        self.addCleanup(second.close)
        self.assertTrue(first.publish(force=True))
        self.assertTrue(second.publish(force=True))
        self.assertTrue(audit.codex_collector_ready(
            first_path, "launch-one"
        ))
        self.assertFalse(audit.codex_collector_ready(
            first_path, "launch-two"
        ))
        self.assertFalse(audit.codex_collector_ready(
            second_path, "launch-one"
        ))
        stale = time.time() - audit.CODEX_COLLECTOR_READY_TTL_SECONDS - 1
        os.utime(first_path, (stale, stale))
        self.assertFalse(audit.codex_collector_ready(
            first_path, "launch-one"
        ))
        first.publish(force=True)
        runtime = audit.TokenAuditProxy(
            "stage", "workspace-1", "codex", "codex", 23456,
            lambda _row: None,
            ready_file=first_path,
            ready_owner="launch-one",
        )
        self.addCleanup(runtime.close)
        self.assertTrue(runtime.tools_ready())
        first.close()
        self.assertFalse(runtime.tools_ready())

    def test_malformed_start_request_marks_new_run_partial(self):
        store = self.store()
        session = store.fingerprint("codex-thread", "bad-start-request")
        store.bind_session("codex", session, is_root=True)
        run_id = str(uuid.uuid4())
        store.start_run(
            "codex", "openai", "native", session, run_id, "J-all-345"
        )
        started_at = store.session_run("codex", session)["started_at"]
        store.mark_partial(
            "codex", session, "unsupported_client_version",
            event_time=float(started_at) - 1,
        )
        store.record_usage(
            "codex", session, "valid-after-bad-start",
            audit._openai_counts({"totalTokens": 4}), "native",
        )
        store.request_end(run_id, "progress")
        store.signal_complete("codex", session)
        measurement = store.claim_outbox()["finalization"]["measurement"]
        self.assertEqual("partial", measurement["status"])
        self.assertEqual(
            "unsupported_client_version", measurement["reason_code"]
        )

    def test_proxy_exposes_marker_tools_only_when_collector_is_enabled(self):
        response = {
            "jsonrpc": "2.0",
            "id": 1,
            "result": {"tools": [
                {"name": "get_job"},
                {"name": "start_job_audit"},
                {"name": "set_job_audit_phase"},
                {"name": "end_job_audit"},
            ]},
        }
        disabled = proxy.filter_token_audit_tools(response, False)
        self.assertEqual(
            ["get_job"],
            [tool["name"] for tool in disabled["result"]["tools"]],
        )
        self.assertIs(response, proxy.filter_token_audit_tools(response, True))

    def test_proxy_parser_handles_production_flags_without_positional_env(self):
        parsed = proxy.parse_args([
            "workspace-1", "--token-audit", "--token-audit-port", "23456",
            "--token-audit-source", "otel", "--token-audit-client", "claude",
        ])
        self.assertIsNone(parsed.environment)
        self.assertEqual("claude", parsed.token_audit_client)
        codex = proxy.parse_args([
            "workspace-1", "stage", "--token-audit",
            "--token-audit-port", "23456", "--token-audit-source", "codex",
            "--token-audit-ready-file", "/private/audit.ready",
            "--token-audit-owner", "launch-one",
        ])
        self.assertEqual("codex", codex.token_audit_client)

    def test_private_publisher_calls_finalizing_end_tool(self):
        class Response(io.BytesIO):
            def __init__(self, payload):
                super().__init__(json.dumps(payload).encode())
                self.headers = {"Content-Type": "application/json"}

        captured = {}

        def post(_url, _headers, body, _provider, timeout=30):
            del timeout
            captured.update(json.loads(body))
            return Response({
                "jsonrpc": "2.0", "id": captured["id"],
                "result": {"structuredContent": {
                    "schema_version": 1,
                    "state": "completed",
                    "audit_run_id": captured["params"]["arguments"][
                        "audit_run_id"
                    ],
                    "canonical_job_id": captured["params"]["arguments"][
                        "job_id"
                    ],
                }},
            }), None

        row = {
            "job_id": "J-all-387",
            "audit_run_id": str(uuid.uuid4()),
            "handoff_type": "review_requested",
            "finalization": {"schema_version": 1},
        }
        with mock.patch.object(proxy, "post_to_mcp_refreshing_token", post):
            result = proxy.make_token_audit_publisher(
                "https://example.test/mcp", lambda: "token"
            )(row)
        self.assertEqual("completed", result["state"])
        self.assertEqual("end_job_audit", captured["params"]["name"])
        self.assertEqual(
            row["finalization"],
            captured["params"]["arguments"]["finalization"],
        )

    def test_private_publisher_rejects_uncorrelated_completion_responses(self):
        class Response(io.BytesIO):
            def __init__(self, payload):
                super().__init__(json.dumps(payload).encode())
                self.headers = {"Content-Type": "application/json"}

        row = {
            "job_id": "J-all-387",
            "audit_run_id": str(uuid.uuid4()),
            "handoff_type": "review_requested",
            "finalization": {"schema_version": 1},
        }
        valid_id = "job-audit-" + row["audit_run_id"]
        valid_structured = {
            "schema_version": 1,
            "state": "completed",
            "audit_run_id": row["audit_run_id"],
            "canonical_job_id": row["job_id"],
        }
        invalid_responses = {
            "wrong_rpc_id": {
                "jsonrpc": "2.0", "id": "another-request",
                "result": {"structuredContent": valid_structured},
            },
            "wrong_schema": {
                "jsonrpc": "2.0", "id": valid_id,
                "result": {"structuredContent": {
                    **valid_structured, "schema_version": 2,
                }},
            },
            "wrong_run": {
                "jsonrpc": "2.0", "id": valid_id,
                "result": {"structuredContent": {
                    **valid_structured, "audit_run_id": str(uuid.uuid4()),
                }},
            },
            "wrong_job": {
                "jsonrpc": "2.0", "id": valid_id,
                "result": {"structuredContent": {
                    **valid_structured, "canonical_job_id": "J-all-999",
                }},
            },
        }
        for name, payload in invalid_responses.items():
            with self.subTest(name=name):
                def post(_url, _headers, _body, _provider, timeout=30):
                    del timeout
                    return Response(payload), None

                with mock.patch.object(
                    proxy, "post_to_mcp_refreshing_token", post
                ), self.assertRaises(RuntimeError):
                    proxy.make_token_audit_publisher(
                        "https://example.test/mcp", lambda: "token"
                    )(row)


if __name__ == "__main__":
    unittest.main()
