import concurrent.futures
import io
import json
import os
import sys
import tempfile
import threading
import time
import unittest
from contextlib import closing, redirect_stdout
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import uclusionMCPProxy as proxy
import uclusionCLI as cli
from uclusionCodexNative import (NativeCodexDelivery, NativeInbox, NativeRequestError,
                                native_scope, native_recipients)
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
        self.roots = []

    def request(self, method, params):
        if method == 'thread/loaded/list':
            return {'data': self.roots, 'nextCursor': None}
        if method == 'thread/list':
            return {'data': [{'id': root} for root in self.roots], 'nextCursor': None}
        root = params['threadId']
        if method == 'mcpServerStatus/list':
            return {'data': [{'runtimeStatus': 'connected', 'serverInfo': {
                'version': '1+' + native_scope('stage', 'workspace')}}]}
        if method == 'thread/queue/list':
            # These admissions have already started turns and left the queue.
            return {'data': [], 'nextCursor': None}
        if method == 'thread/read':
            if params.get('includeTurns') is False:
                return {'thread': {'id': root, 'threadSource': 'user', 'canAcceptDirectInput': True,
                    'status': {'type': 'active' if root in self.active_turns else 'idle'}}}
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
    def test_root_discovery_uses_scope_with_current_and_legacy_names(self):
        for server_name in ('uclusion', 'Uclusion'):
            with self.subTest(server_name=server_name):
                delivery = NativeCodexDelivery.__new__(NativeCodexDelivery)
                delivery.identity = 'this-proxy'
                delivery.scope_marker = native_scope('stage', 'workspace')
                delivery.token_audit = False
                delivery.roots = {}
                delivery.joined_roots = set()
                delivery.collectors = {}
                delivery.context_events = None
                delivery.lock = threading.RLock()

                def request(method, params):
                    if method == 'thread/loaded/list':
                        return {'data': ['own-root', 'other-root', 'foreign'], 'nextCursor': None}
                    if method == 'thread/list':
                        self.assertEqual('recency_at', params['sortKey'])
                        self.assertEqual('desc', params['sortDirection'])
                        self.assertTrue(params['useStateDbOnly'])
                        return {'data': [{'id': root} for root in ('other-root', 'foreign', 'own-root')],
                                'nextCursor': None}
                    root = params['threadId']
                    if method == 'thread/read':
                        return {'thread': {'id': root, 'threadSource': 'user',
                                           'canAcceptDirectInput': True}}
                    if method == 'mcpServerStatus/list':
                        self.assertIn(params.get('serverName'), ('uclusion', 'Uclusion'))
                        if params['serverName'] != server_name:
                            return {'data': []}
                        identity = 'this-proxy' if root == 'own-root' else 'another-proxy'
                        scope = native_scope('stage', 'other' if root == 'foreign' else 'workspace')
                        return {'data': [{'name': server_name, 'runtimeStatus': 'connected',
                                          'serverInfo': {'version': '1+' + identity + '.' + scope}}]}
                    raise AssertionError(method)

                delivery.client = SimpleNamespace(request=request)
                delivery._register = lambda thread: delivery.roots.update({thread['id']: thread})
                delivery._scan()
                self.assertEqual(['other-root', 'own-root'], list(delivery.roots))

    def test_failed_server_inspection_does_not_start_more_mcp_clients(self):
        scope = native_scope('stage', 'workspace')
        starts = []
        cursors = []

        def request(method, params):
            if method == 'thread/loaded/list':
                return {'data': ['failed', 'legacy'], 'nextCursor': None}
            if method == 'thread/list':
                return {'data': [{'id': root} for root in ('failed', 'legacy')], 'nextCursor': None}
            root = params['threadId']
            if method == 'thread/read':
                return {'thread': {'id': root, 'threadSource': 'user', 'canAcceptDirectInput': True}}
            if method == 'mcpServerStatus/list':
                name = params.get('serverName')
                if name is None:
                    starts.append(root)  # Codex creates new clients for unscoped discovery.
                if root == 'failed':
                    return {'data': [{'name': 'uclusion', 'runtimeStatus': 'failed'}]}
                if name == 'uclusion':
                    return {'data': []}
                cursors.append(params.get('cursor'))
                if params.get('cursor') is None:
                    return {'data': [], 'nextCursor': 'legacy-page-two'}
                return {'data': [{'name': 'Uclusion', 'runtimeStatus': 'connected',
                                 'serverInfo': {'version': '1+' + scope}}]}
            raise AssertionError(method)

        recipients = native_recipients(SimpleNamespace(request=request), scope)
        self.assertEqual(['legacy'], [thread['id'] for thread in recipients])
        self.assertEqual([], starts)
        self.assertEqual([None, 'legacy-page-two'], cursors)

    def test_only_completed_compaction_resets_its_registered_context(self):
        events = []
        delivery = NativeCodexDelivery.__new__(NativeCodexDelivery)
        delivery.context_events = lambda root, reason: events.append((root, reason))
        delivery.joined_roots = {'first', 'second'}
        delivery.collectors = {}
        delivery.lock = threading.RLock()
        for method, root, kind in (
                ('item/started', 'first', 'contextCompaction'),
                ('item/completed', 'first', 'agentMessage'),
                ('item/completed', 'foreign', 'contextCompaction'),
                ('item/completed', 'first', 'contextCompaction')):
            delivery._observe({'method': method, 'params': {'threadId': root, 'item': {'type': kind}}})
        self.assertEqual([('first', 'compact')], events)

    def test_selector_preserves_native_pages_and_excludes_ineligible_roots(self):
        scope = native_scope('stage', 'workspace')
        methods = []

        def request(method, params):
            methods.append((method, params))
            if method == 'thread/loaded/list':
                return {'data': ['z-newer', 'a-older', 'child', 'foreign', 'review', 'aux'], 'nextCursor': None}
            if method == 'thread/list':
                roots = ['z-newer', 'foreign', 'child'] if params['cursor'] is None else ['saved', 'review', 'aux', 'a-older']
                return {'data': [{'id': root, 'updatedAt': 100} for root in roots],
                        'nextCursor': 'page-two' if params['cursor'] is None else None}
            root = params['threadId']
            if method == 'thread/read':
                return {'thread': {'id': root, 'threadSource': 'user' if root != 'review' else 'review',
                    'parentThreadId': 'parent' if root == 'child' else None,
                    'canAcceptDirectInput': root != 'aux', 'status': {'type': 'idle'}}}
            if method == 'mcpServerStatus/list':
                version = scope + '-suffix' if root == 'foreign' else '1+instance.' + scope
                return {'data': [{'runtimeStatus': 'connected', 'serverInfo': {'version': version}}]}
            raise AssertionError(method)

        self.assertEqual(['z-newer', 'a-older'],
                         [thread['id'] for thread in native_recipients(SimpleNamespace(request=request), scope)])
        self.assertEqual(2, sum(method == 'thread/list' for method, _ in methods))
        self.assertFalse(any(method == 'thread/resume' for method, _ in methods))

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
        delivery.inbox = NativeInbox('stage', 'workspace')
        delivery.client = client
        delivery.roots = {root: {'path': 'fixture-rollout'} for root in roots}
        delivery.reconciliation_errors = {}
        delivery.scope_marker = native_scope('stage', 'workspace')
        client.roots = list(dict.fromkeys([*getattr(client, 'roots', []), *roots]))
        return delivery

    def test_one_shared_stream_delivers_each_event_in_order(self):
        inbox = NativeInbox('stage', 'workspace')
        other = NativeInbox('stage', 'workspace')
        self.poke('one', 'First')
        self.poke('two', 'Second')
        first = inbox.next()
        second = other.next()
        self.assertEqual(first[1], 'First')
        self.assertIsNone(second)
        inbox.acknowledge('first', first[0])
        self.assertEqual(other.next()[1], 'Second')
        self.assertIsNone(inbox.next())

    def test_startup_cutoff_keeps_arrivals_during_registration(self):
        self.poke('retained', 'Old')
        inbox = NativeInbox('stage', 'workspace')
        self.poke('new', 'During startup')
        self.assertEqual(inbox.next()[1], 'During startup')

    def test_fresh_start_skips_unreserved_history_and_preserves_explicit_pending(self):
        original = NativeInbox('stage', 'workspace')
        self.poke('pending', 'Explicit pending')
        pending = original.next()
        original.close()
        self.poke('history', 'Arrived while stopped')
        restarted = NativeInbox('stage', 'workspace')
        self.assertEqual(pending, restarted.next())
        restarted.acknowledge('root', pending[0])
        self.assertIsNone(restarted.next())
        self.poke('new', 'Fresh arrival')
        self.assertEqual('Fresh arrival', restarted.next()[1])

    def test_joining_live_stream_does_not_advance_its_arrival_cutoff(self):
        original = NativeInbox('stage', 'workspace')
        self.poke('live', 'Live arrival')
        joined = NativeInbox('stage', 'workspace')
        self.assertEqual('Live arrival', joined.next()[1])
        self.assertIsNone(original.next())

    def test_unconfirmed_admission_survives_proxy_restart(self):
        inbox = NativeInbox('stage', 'workspace')
        self.poke('pending')
        pending = inbox.next()
        inbox.state('root', 'sending')
        inbox.release()
        restarted = NativeInbox('stage', 'workspace')
        self.assertEqual(restarted.next(), (*pending[:3], 'sending', None, 'root'))
        restarted.acknowledge('root', pending[0])
        self.assertIsNone(restarted.next())

    def test_replay_is_independent_of_live_cursor(self):
        self.poke('retained')
        live = NativeInbox('stage', 'workspace')
        replay = NativeInbox('stage', 'workspace', replay=True)
        self.assertIsNone(live.next())
        retained = replay.next()
        self.assertIsNotNone(retained)
        replay.acknowledge('root', retained[0])
        self.assertIsNone(live.next())
        another_replay = NativeInbox('stage', 'workspace', replay=True)
        self.assertIsNotNone(another_replay.next())

    def test_identical_pokes_keep_distinct_admission_identities(self):
        inbox = NativeInbox('stage', 'workspace')
        self.poke('one')
        first = inbox.next()
        inbox.acknowledge('root', first[0])
        self.poke('two')
        second = inbox.next()
        self.assertEqual(first[1], second[1])
        self.assertNotEqual(first[2], second[2])

    def test_late_legacy_startup_cursor_does_not_discard_unattempted_poke(self):
        native = NativeQueue()
        inbox = NativeInbox('stage', 'workspace')
        self.poke('carry', 'Carry forward')
        with closing(proxy.open_inbox()) as connection, connection:
            sequence = connection.execute('SELECT MAX(sequence) FROM poke_messages').fetchone()[0]
            connection.execute('DELETE FROM poke_consumers WHERE consumer = ?', (inbox.consumer,))
            connection.execute('''INSERT INTO codex_native_pending
                (environment, workspace_id, consumer, sequence, client_id, state)
                VALUES ('stage', 'workspace', 'codex-native:old-home:old-root', ?, 'old-id', 'pending')''',
                (sequence,))
            connection.execute('''INSERT INTO poke_consumers VALUES
                ('stage', 'workspace', 'codex-native:old-home:late-root', ?, ?)''', (sequence, time.time()))
        delivery = self.delivery(native, 'intended')
        delivery._deliver()
        delivery._deliver()
        self.assertEqual([('intended', 'Carry forward')], [(root, text) for root, _, text in native.admissions])

    def test_concurrent_delivery_entrypoints_admit_only_one_copy(self):
        native = NativeQueue()
        first = self.delivery(native, 'latest', 'older')
        second = self.delivery(native, 'latest', 'older')
        self.poke('one', 'Only once')
        barrier = threading.Barrier(2)

        def deliver(worker):
            barrier.wait(timeout=3)
            worker._deliver()

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as workers:
            list(workers.map(deliver, (first, second)))
        self.assertEqual([('latest', 'Only once')], [(root, text) for root, _, text in native.admissions])

    def test_legacy_attempts_consolidate_and_any_admission_prevents_another_send(self):
        native = NativeQueue()
        inbox = NativeInbox('stage', 'workspace')
        self.poke('one', 'Already attempted')
        with closing(proxy.open_inbox()) as connection, connection:
            sequence = connection.execute('SELECT MAX(sequence) FROM poke_messages').fetchone()[0]
            for root, client_id, attempts in (('first', 'first-id', 1), ('second', 'second-id', 1),
                                               ('never', 'never-id', 0)):
                connection.execute('''INSERT INTO codex_native_pending
                    (environment, workspace_id, consumer, sequence, client_id, state, attempt_count, steered_turn_id)
                    VALUES ('stage', 'workspace', ?, ?, ?, ?, ?, ?)''',
                    ('codex-native:old-home:' + root, sequence, client_id,
                     'sending' if attempts else 'pending', attempts, root + '-turn' if attempts else None))
        native.active_turns['first'] = 'first-turn'
        native.admissions.append(('second', 'second-id', 'Already attempted'))
        delivery = self.delivery(native, 'latest', 'first', 'second')
        delivery._deliver()
        delivery._deliver()
        self.assertEqual([('second', 'second-id', 'Already attempted')], native.admissions)
        with closing(proxy.open_inbox()) as connection:
            rows = connection.execute('SELECT sequence, root, client_id, state FROM codex_native_pending').fetchall()
        self.assertEqual([(sequence, 'first', 'first-id', 'accepted')], rows)

    def test_read_only_inspection_reports_frozen_receipt_without_starting_delivery(self):
        native = NativeQueue()
        worker = self.delivery(native, 'older', 'latest')
        self.poke('one')
        pending = worker.inbox.next()
        worker.inbox.state('older', 'sending', 'active-turn')
        worker.inbox.release()
        native.roots = ['latest', 'older']
        calls = []
        original = native.request
        native.request = lambda method, params: (calls.append(method) or original(method, params))
        native.start = lambda: None
        native.close = lambda: None
        output = io.StringIO()
        with patch('uclusionCodexNative.NativeClient', return_value=native), patch.object(
                NativeCodexDelivery, '__init__', side_effect=AssertionError('inspection started delivery')), \
                patch.object(cli, 'load_config', return_value={'workspaceId': 'workspace'}), redirect_stdout(output):
            args = cli.parse_args(['-e', 'stage', 'codex-recipients'])
            self.assertEqual(0, args.func(args))
        result = json.loads(output.getvalue())
        self.assertEqual('latest', result['selected']['id'])
        self.assertEqual(2, result['candidate_count'])
        self.assertEqual('older', result['outstanding_receipt_reconciliation'][0]['root'])
        self.assertEqual(pending[2], result['outstanding_receipt_reconciliation'][0]['client_id'])
        self.assertFalse({'thread/resume', 'turn/steer', 'thread/queue/add'} & set(calls))

    def test_workspace_is_separate_and_proxies_share_scope(self):
        first = NativeInbox('stage', 'workspace')
        other_home = NativeInbox('stage', 'workspace')
        other_workspace = NativeInbox('stage', 'other')
        self.poke('one')
        pending = first.next()
        first.acknowledge('root', pending[0])
        self.assertIsNone(other_home.next())
        self.assertIsNone(other_workspace.next())

    def test_restart_after_pre_send_crash_delivers_pending_and_later_pokes(self):
        native = NativeQueue()
        delivery = self.delivery(native, 'root')
        self.poke('one', 'First')
        self.poke('two', 'Second')
        native.fail_before_send = True
        clock = time.time()
        with patch('uclusionCodexNative.time.time', return_value=clock) as now:
            with self.assertRaises(TimeoutError):
                delivery._deliver()
            restarted = self.delivery(native, 'root')
            restarted._deliver()
            self.assertEqual([], native.admissions)
            now.return_value = clock + 1
            restarted._deliver()
            restarted._deliver()
        self.assertEqual(['First', 'Second'], [row[2] for row in native.admissions])
        self.assertIsNone(restarted.inbox.next())

    def test_consumed_admission_with_lost_receipt_is_not_retried(self):
        native = NativeQueue()
        delivery = self.delivery(native, 'root')
        self.poke('one', 'First')
        self.poke('two', 'Second')
        native.lose_receipt = True
        with self.assertRaises(TimeoutError):
            delivery._deliver()
        restarted = self.delivery(native, 'root')
        # A missing cached rollout path says nothing about native history.
        restarted.roots['root']['path'] = None
        restarted._deliver()
        restarted._deliver()
        self.assertEqual(['First', 'Second'], [row[2] for row in native.admissions])

    def test_definite_rejection_preserves_poke_and_waits_for_retry_floor(self):
        native = NativeQueue()
        delivery = self.delivery(native, 'root')
        self.poke('one', 'First')
        native.reject = True
        clock = time.time()
        with patch('uclusionCodexNative.time.time', return_value=clock) as now:
            delivery._deliver()
            restarted = self.delivery(native, 'root')
            restarted._deliver()
            self.assertEqual([], native.admissions)
            now.return_value = clock + 1
            restarted._deliver()
        self.assertEqual(['First'], [row[2] for row in native.admissions])
        self.assertIsNone(delivery.inbox.next())

    def test_busy_root_receives_feedback_in_its_active_turn(self):
        native = NativeQueue()
        native.active_turns['root'] = 'busy-turn'
        delivery = self.delivery(native, 'root')
        self.poke('one', 'Current feedback')
        delivery._deliver()
        self.assertEqual(['busy-turn'], [turn for _, turn, _ in native.steered])
        self.assertEqual(['Current feedback'], [text for _, _, text in native.admissions])
        self.assertIsNone(delivery.inbox.next())

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
                delivery._deliver()
            restarted = self.delivery(native, 'busy', 'other')
            now.return_value = clock + 10
            restarted._deliver()
            restarted._deliver()
            self.assertEqual(1, len(native.admissions))
            self.assertEqual('busy-turn', restarted.inbox.next()[4])
            restarted._deliver()
            self.assertEqual(['busy'], [root for root, _, _ in native.admissions])
            native.active_turns.pop('busy')
            restarted._deliver()
            restarted._deliver()
        self.assertEqual(['First', 'Second'], [text for root, _, text in native.admissions if root == 'busy'])
        self.assertIsNone(restarted.inbox.next())

    def test_unconfirmed_unsent_steer_retries_after_its_turn_ends(self):
        native = NativeQueue()
        native.active_turns['root'] = 'original-turn'
        native.fail_before_send = True
        delivery = self.delivery(native, 'root')
        self.poke('one', 'First')
        original_id = delivery.inbox.next()[2]
        clock = time.time()
        with patch('uclusionCodexNative.time.time', return_value=clock) as now:
            with self.assertRaises(TimeoutError):
                delivery._deliver()
            restarted = self.delivery(native, 'root')
            now.return_value = clock + 10
            restarted._deliver()
            self.assertEqual([], native.admissions)
            native.active_turns['root'] = 'later-turn'
            restarted._deliver()
        self.assertEqual([('root', 'later-turn', original_id)], native.steered)
        self.assertIsNone(restarted.inbox.next())

    def test_turn_completion_race_retries_the_same_poke_in_idle_queue(self):
        native = NativeQueue()
        native.active_turns['root'] = 'ending-turn'
        native.complete_before_steer = True
        delivery = self.delivery(native, 'root')
        self.poke('one', 'First')
        original_id = delivery.inbox.next()[2]
        clock = time.time()
        with patch('uclusionCodexNative.time.time', return_value=clock) as now:
            delivery._deliver()
            self.assertEqual([], native.admissions)
            now.return_value = clock + 1
            delivery._deliver()
        self.assertEqual([('root', original_id, 'First')], native.admissions)
        self.assertEqual([], native.steered)
        self.assertIsNone(delivery.inbox.next())

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
            return NativeInbox('stage', 'workspace')

        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as workers:
            restarts = list(workers.map(lambda _: restart(), range(4)))
        self.assertEqual(4, len(restarts))
        with closing(proxy.open_inbox()) as connection:
            pending = connection.execute('''SELECT consumer,sequence,client_id,state
                FROM codex_native_pending''').fetchall()
        self.assertEqual([('prior-consumer', 1, 'prior-id', 'sending')], pending)

    def test_unavailable_history_keeps_exact_root_pending(self):
        native = NativeQueue()
        delivery = self.delivery(native, 'first', 'second')
        self.poke('one', 'First')
        native.fail_before_send = True
        with self.assertRaises(TimeoutError):
            delivery._deliver()
        native.history_unavailable = True
        with patch('sys.stderr'):
            delivery._deliver()
        delivery._deliver()
        self.assertEqual([], native.admissions)
        self.assertEqual('sending', delivery.inbox.next()[3])


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
                return {'thread': {'id': params['threadId'], 'threadSource': 'user',
                    'canAcceptDirectInput': True, 'status': {
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
        self.assertEqual('Ordinary Poke', first.inbox.next()[1])
        self.assertIsNone(second.inbox.next())
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
            delivery._deliver()
            self.assertEqual(['Ordinary Poke'], [text for _, _, text in client.admissions])
        finally:
            finish.set()


if __name__ == '__main__':
    unittest.main()
