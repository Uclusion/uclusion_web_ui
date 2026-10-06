import concurrent.futures
import os
import sys
import tempfile
import threading
import time
import unittest
from contextlib import closing
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import uclusionMCPProxy as proxy
from uclusionCodexNative import NativeCodexDelivery, NativeInbox, NativeRequestError
from uclusionUpdateNotices import UpdateNoticeStore


class NativeQueue:
    def __init__(self):
        self.admissions = []
        self.fail_before_send = False
        self.lose_receipt = False
        self.reject = False
        self.history_unavailable = False
        self.active_turns = {}
        self.steered = []
        self.defer_history = False
        self.complete_before_steer = False

    def request(self, method, params):
        root = params['threadId']
        if method == 'thread/queue/list':
            # These admissions have already started turns and left the queue.
            return {'data': [], 'nextCursor': None}
        if method == 'thread/read':
            if params.get('includeTurns') is False:
                return {'thread': {'status': {'type': 'active' if root in self.active_turns else 'idle'}}}
            if self.history_unavailable:
                raise NativeRequestError('history unavailable')
            turns = [{'id': 'completed', 'status': 'completed', 'items': [
                {'type': 'userMessage', 'clientId': client_id}
                for admitted_root, client_id, _ in self.admissions
                if admitted_root == root and not (self.defer_history and root in self.active_turns)]}]
            if root in self.active_turns:
                turns.append({'id': self.active_turns[root], 'status': 'inProgress', 'items': []})
            return {'thread': {'turns': turns}}
        if method in {'thread/queue/add', 'turn/steer'}:
            if method == 'turn/steer':
                if self.complete_before_steer:
                    self.complete_before_steer = False
                    self.active_turns.pop(root)
                if params['expectedTurnId'] != self.active_turns.get(root):
                    raise NativeRequestError('turn no longer active')
            if self.reject:
                self.reject = False
                raise NativeRequestError('definite rejection')
            if self.fail_before_send:
                self.fail_before_send = False
                raise TimeoutError('interrupted before submission')
            client_id = params['clientUserMessageId']
            self.admissions.append((root, client_id, params['input'][0]['text']))
            if method == 'turn/steer':
                self.steered.append((root, params['expectedTurnId'], client_id))
            if self.lose_receipt:
                self.lose_receipt = False
                raise TimeoutError('lost receipt after admission')
            return ({'turnId': params['expectedTurnId']} if method == 'turn/steer'
                    else {'queuedSubmission': {'clientUserMessageId': client_id}})
        raise AssertionError(method)


class NativeInboxTests(unittest.TestCase):
    def setUp(self):
        self.home = tempfile.TemporaryDirectory()
        self.addCleanup(self.home.cleanup)
        self.environment = patch.dict(os.environ, {'UCLUSION_HOME': self.home.name})
        self.environment.start()
        self.addCleanup(self.environment.stop)

    def poke(self, message_id, text='Start a test job', workspace='workspace'):
        proxy.enqueue_prompt('stage', workspace, {'message_id': message_id, 'message': text})

    def delivery(self, client, *roots):
        delivery = NativeCodexDelivery.__new__(NativeCodexDelivery)
        delivery.inbox = NativeInbox('stage', 'workspace', self.home.name)
        delivery.client = client
        delivery.roots = {root: {'path': 'fixture-rollout'} for root in roots}
        delivery.reconciliation_errors = {}
        for root in roots:
            delivery.inbox.prepare(root)
        return delivery

    def test_each_root_receives_its_own_copy_in_order(self):
        inbox = NativeInbox('stage', 'workspace', self.home.name)
        for root in ('first', 'second'):
            inbox.prepare(root)
        self.poke('one', 'First')
        self.poke('two', 'Second')
        first = inbox.next('first')
        second = inbox.next('second')
        self.assertEqual(first[1], 'First')
        self.assertEqual(second[1], 'First')
        self.assertNotEqual(first[2], second[2])
        inbox.acknowledge('first', first[0])
        self.assertEqual(inbox.next('first')[1], 'Second')
        self.assertEqual(inbox.next('second'), second)

    def test_startup_cutoff_keeps_arrivals_during_registration(self):
        self.poke('retained', 'Old')
        inbox = NativeInbox('stage', 'workspace', self.home.name)
        self.poke('new', 'During startup')
        inbox.prepare('root')
        self.assertEqual(inbox.next('root')[1], 'During startup')

    def test_unconfirmed_admission_survives_proxy_restart(self):
        inbox = NativeInbox('stage', 'workspace', self.home.name)
        inbox.prepare('root')
        self.poke('pending')
        pending = inbox.next('root')
        inbox.state('root', 'sending')
        restarted = NativeInbox('stage', 'workspace', self.home.name)
        restarted.prepare('root')
        self.assertEqual(restarted.next('root'), (*pending[:3], 'sending', None))
        restarted.acknowledge('root', pending[0])
        self.assertIsNone(restarted.next('root'))

    def test_replay_is_independent_of_live_cursor(self):
        self.poke('retained')
        live = NativeInbox('stage', 'workspace', self.home.name)
        live.prepare('root')
        replay = NativeInbox('stage', 'workspace', self.home.name, replay=True)
        replay.prepare('root')
        self.assertIsNone(live.next('root'))
        retained = replay.next('root')
        self.assertIsNotNone(retained)
        replay.acknowledge('root', retained[0])
        self.assertIsNone(live.next('root'))
        another_replay = NativeInbox('stage', 'workspace', self.home.name, replay=True)
        another_replay.prepare('root')
        self.assertIsNotNone(another_replay.next('root'))

    def test_identical_pokes_keep_distinct_admission_identities(self):
        inbox = NativeInbox('stage', 'workspace', self.home.name)
        inbox.prepare('root')
        self.poke('one')
        first = inbox.next('root')
        inbox.acknowledge('root', first[0])
        self.poke('two')
        second = inbox.next('root')
        self.assertEqual(first[1], second[1])
        self.assertNotEqual(first[2], second[2])

    def test_workspace_and_codex_home_are_separate_consumers(self):
        first = NativeInbox('stage', 'workspace', self.home.name)
        other_home = NativeInbox('stage', 'workspace', self.home.name + '-other')
        other_workspace = NativeInbox('stage', 'other', self.home.name)
        for inbox in (first, other_home, other_workspace):
            inbox.prepare('root')
        self.poke('one')
        pending = first.next('root')
        first.acknowledge('root', pending[0])
        self.assertIsNotNone(other_home.next('root'))
        self.assertIsNone(other_workspace.next('root'))

    def test_restart_after_pre_send_crash_delivers_pending_and_later_pokes(self):
        native = NativeQueue()
        delivery = self.delivery(native, 'root')
        self.poke('one', 'First')
        self.poke('two', 'Second')
        native.fail_before_send = True
        clock = time.time()
        with patch('uclusionCodexNative.time.time', return_value=clock) as now:
            with self.assertRaises(TimeoutError):
                delivery._deliver('root')
            restarted = self.delivery(native, 'root')
            restarted._deliver('root')
            self.assertEqual([], native.admissions)
            now.return_value = clock + 1
            restarted._deliver('root')
            restarted._deliver('root')
        self.assertEqual(['First', 'Second'], [row[2] for row in native.admissions])
        self.assertIsNone(restarted.inbox.next('root'))

    def test_consumed_admission_with_lost_receipt_is_not_retried(self):
        native = NativeQueue()
        delivery = self.delivery(native, 'root')
        self.poke('one', 'First')
        self.poke('two', 'Second')
        native.lose_receipt = True
        with self.assertRaises(TimeoutError):
            delivery._deliver('root')
        restarted = self.delivery(native, 'root')
        # A missing cached rollout path says nothing about native history.
        restarted.roots['root']['path'] = None
        restarted._deliver('root')
        restarted._deliver('root')
        self.assertEqual(['First', 'Second'], [row[2] for row in native.admissions])

    def test_definite_rejection_preserves_poke_and_waits_for_retry_floor(self):
        native = NativeQueue()
        delivery = self.delivery(native, 'root')
        self.poke('one', 'First')
        native.reject = True
        clock = time.time()
        with patch('uclusionCodexNative.time.time', return_value=clock) as now:
            delivery._deliver('root')
            restarted = self.delivery(native, 'root')
            restarted._deliver('root')
            self.assertEqual([], native.admissions)
            now.return_value = clock + 1
            restarted._deliver('root')
        self.assertEqual(['First'], [row[2] for row in native.admissions])
        self.assertIsNone(delivery.inbox.next('root'))

    def test_busy_root_receives_feedback_in_its_active_turn(self):
        native = NativeQueue()
        native.active_turns['root'] = 'busy-turn'
        delivery = self.delivery(native, 'root')
        self.poke('one', 'Current feedback')
        delivery._deliver('root')
        self.assertEqual(['busy-turn'], [turn for _, turn, _ in native.steered])
        self.assertEqual(['Current feedback'], [text for _, _, text in native.admissions])
        self.assertIsNone(delivery.inbox.next('root'))

    def test_lost_steer_receipt_waits_for_history_across_restart(self):
        native = NativeQueue()
        native.active_turns['busy'] = 'busy-turn'
        native.defer_history = True
        native.lose_receipt = True
        delivery = self.delivery(native, 'busy', 'other')
        self.poke('one', 'First')
        self.poke('two', 'Second')
        clock = time.time()
        with patch('uclusionCodexNative.time.time', return_value=clock) as now:
            with self.assertRaises(TimeoutError):
                delivery._deliver('busy')
            restarted = self.delivery(native, 'busy', 'other')
            now.return_value = clock + 10
            restarted._deliver('busy')
            restarted._deliver('busy')
            self.assertEqual(1, len(native.admissions))
            self.assertEqual('busy-turn', restarted.inbox.next('busy')[4])
            restarted._deliver('other')
            self.assertEqual(['busy', 'other'], [root for root, _, _ in native.admissions])
            native.active_turns.pop('busy')
            restarted._deliver('busy')
            restarted._deliver('busy')
        self.assertEqual(['First', 'Second'], [text for root, _, text in native.admissions if root == 'busy'])
        self.assertIsNone(restarted.inbox.next('busy'))

    def test_unconfirmed_unsent_steer_retries_after_its_turn_ends(self):
        native = NativeQueue()
        native.active_turns['root'] = 'original-turn'
        native.fail_before_send = True
        delivery = self.delivery(native, 'root')
        self.poke('one', 'First')
        original_id = delivery.inbox.next('root')[2]
        clock = time.time()
        with patch('uclusionCodexNative.time.time', return_value=clock) as now:
            with self.assertRaises(TimeoutError):
                delivery._deliver('root')
            restarted = self.delivery(native, 'root')
            now.return_value = clock + 10
            restarted._deliver('root')
            self.assertEqual([], native.admissions)
            native.active_turns['root'] = 'later-turn'
            restarted._deliver('root')
        self.assertEqual([('root', 'later-turn', original_id)], native.steered)
        self.assertIsNone(restarted.inbox.next('root'))

    def test_turn_completion_race_retries_the_same_poke_in_idle_queue(self):
        native = NativeQueue()
        native.active_turns['root'] = 'ending-turn'
        native.complete_before_steer = True
        delivery = self.delivery(native, 'root')
        self.poke('one', 'First')
        original_id = delivery.inbox.next('root')[2]
        clock = time.time()
        with patch('uclusionCodexNative.time.time', return_value=clock) as now:
            delivery._deliver('root')
            self.assertEqual([], native.admissions)
            now.return_value = clock + 1
            delivery._deliver('root')
        self.assertEqual([('root', original_id, 'First')], native.admissions)
        self.assertEqual([], native.steered)
        self.assertIsNone(delivery.inbox.next('root'))

    def test_concurrent_upgrade_preserves_unconfirmed_admission(self):
        with closing(proxy.open_inbox()) as connection, connection:
            connection.execute('''CREATE TABLE codex_native_pending (
                environment TEXT NOT NULL, workspace_id TEXT NOT NULL,
                consumer TEXT NOT NULL, sequence INTEGER NOT NULL,
                client_id TEXT NOT NULL, state TEXT NOT NULL,
                PRIMARY KEY(environment, workspace_id, consumer))''')
            connection.execute("INSERT INTO codex_native_pending VALUES "
                               "('stage','workspace','prior-consumer',1,'prior-id','sending')")
        ready = threading.Barrier(4)

        def restart():
            ready.wait(timeout=5)
            return NativeInbox('stage', 'workspace', self.home.name)

        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as workers:
            restarts = list(workers.map(lambda _: restart(), range(4)))
        self.assertEqual(4, len(restarts))
        with closing(proxy.open_inbox()) as connection:
            pending = connection.execute('''SELECT consumer,sequence,client_id,state
                FROM codex_native_pending''').fetchall()
        self.assertEqual([('prior-consumer', 1, 'prior-id', 'sending')], pending)

    def test_unavailable_history_keeps_pending_without_blocking_another_root(self):
        native = NativeQueue()
        delivery = self.delivery(native, 'first', 'second')
        self.poke('one', 'First')
        native.fail_before_send = True
        with self.assertRaises(TimeoutError):
            delivery._deliver('first')
        native.history_unavailable = True
        with patch('sys.stderr'):
            delivery._deliver('first')
        delivery._deliver('second')
        self.assertEqual(['second'], [row[0] for row in native.admissions])
        self.assertEqual('sending', delivery.inbox.next('first')[3])


class NativeNoticeTests(unittest.TestCase):
    setUp = NativeInboxTests.setUp
    poke = NativeInboxTests.poke

    def delivery(self, identity, client, *roots):
        delivery = NativeInboxTests.delivery(self, client, *roots)
        delivery.environment = 'stage'
        delivery.notices = UpdateNoticeStore(proxy.open_inbox)
        delivery.notice_config = SimpleNamespace(environment='stage', workspace_id='workspace',
                                                instance=identity)
        delivery.notice_source = lambda environment: None
        delivery.notice_results = []
        delivery.notice_leader = False
        delivery.next_notice_check = float('inf')
        delivery.next_notice_maintenance = 0
        delivery.lock = threading.RLock()
        return delivery

    def queue(self, active=()):
        client = NativeQueue()
        request = client.request

        def current(method, params):
            if method == 'thread/read' and params.get('includeTurns') is False:
                return {'thread': {'status': {
                    'type': 'active' if params['threadId'] in active else 'idle'}}}
            return request(method, params)
        client.request = current
        return client

    def test_one_workspace_notice_waits_for_idle_without_changing_poke_cursors(self):
        client = self.queue(active=('busy',))
        first = self.delivery('owner', client, 'busy', 'idle')
        second = self.delivery('other-proxy', client, 'other')
        first.notice_results.append('A new release is available')
        self.poke('poke', 'Ordinary Poke')
        first._deliver_update_notice()
        second._deliver_update_notice()
        self.assertEqual(['idle'], [root for root, _, _ in client.admissions])
        self.assertEqual('Ordinary Poke', first.inbox.next('busy')[1])
        self.assertEqual('Ordinary Poke', first.inbox.next('idle')[1])
        self.assertEqual('Ordinary Poke', second.inbox.next('other')[1])
        first._deliver_update_notice()
        self.assertEqual(1, len(client.admissions))

    def test_lost_notice_receipt_reconciles_after_owner_replacement(self):
        client = self.queue()
        first = self.delivery('owner', client, 'root')
        first.notice_results.append('A new release is available')
        client.lose_receipt = True
        with self.assertRaises(TimeoutError):
            first._deliver_update_notice()
        first.notices.release_update_notice_leader(first.notice_config, os.getpid())
        replacement = self.delivery('replacement', client, 'root')
        replacement._deliver_update_notice()
        self.assertEqual(1, len(client.admissions))
        self.assertIsNone(replacement.notices.get_sending_update_notice(replacement.notice_config))
        self.assertIsNone(replacement.notices.get_pending_update_notice(replacement.notice_config))

    def test_busy_recipients_keep_the_notice_pending(self):
        client = self.queue(active=('root',))
        delivery = self.delivery('owner', client, 'root')
        delivery.notice_results.append('A new release is available')
        delivery._deliver_update_notice()
        self.assertEqual([], client.admissions)
        self.assertIsNotNone(delivery.notices.get_pending_update_notice(delivery.notice_config))

    def test_notice_leadership_is_scoped_and_live_owner_is_not_stolen(self):
        first = self.delivery('first', self.queue(), 'first-root')
        second = self.delivery('second', self.queue(), 'second-root')
        store = first.notices
        store.clock = lambda: 1000
        store.pid_is_alive = lambda pid: True
        self.assertTrue(store.acquire_update_notice_leader(first.notice_config, 101))
        store.clock = lambda: 1060
        self.assertFalse(store.acquire_update_notice_leader(second.notice_config, 202))
        other = SimpleNamespace(environment='stage', workspace_id='other-workspace', instance='other')
        self.assertTrue(store.acquire_update_notice_leader(other, 303))
        store.release_update_notice_leader(second.notice_config, 202)
        self.assertFalse(store.acquire_update_notice_leader(second.notice_config, 202))
        store.release_update_notice_leader(first.notice_config, 101)
        self.assertTrue(store.acquire_update_notice_leader(second.notice_config, 202))

    def test_notice_leadership_recovers_when_previous_pid_is_dead(self):
        first = self.delivery('first', self.queue(), 'first-root')
        second = self.delivery('second', self.queue(), 'second-root')
        store = first.notices
        store.pid_is_alive = lambda pid: True
        self.assertTrue(store.acquire_update_notice_leader(first.notice_config, 101))
        store.pid_is_alive = lambda pid: False
        self.assertTrue(store.acquire_update_notice_leader(second.notice_config, 202))

    def test_slow_update_check_does_not_delay_poke_delivery(self):
        client = self.queue()
        delivery = self.delivery('owner', client, 'root')
        started, finish = threading.Event(), threading.Event()

        def check(environment):
            started.set()
            finish.wait(3)
            return None
        delivery.notice_source = check
        delivery.next_notice_check = 0
        self.poke('poke', 'Ordinary Poke')
        try:
            delivery._deliver_update_notice()
            self.assertTrue(started.wait(1))
            delivery._deliver('root')
            self.assertEqual(['Ordinary Poke'], [text for _, _, text in client.admissions])
        finally:
            finish.set()


if __name__ == '__main__':
    unittest.main()
