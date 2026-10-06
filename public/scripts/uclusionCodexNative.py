"""Uclusion delivery through ordinary Codex's native steering and queue APIs.

The MCP connection identifies its own roots. This client never starts a Codex
server, supplies frontend input, changes thread configuration, or answers an
approval request. Native steering supplies active-turn input; the queue owns
idle wake-up.
"""
import hashlib
import json
import os
import socket
import subprocess
import sys
import threading
import time
import uuid
from contextlib import closing
from types import SimpleNamespace

from uclusionMCPProxy import WebSocketConnection, open_inbox, record_demo_input, uclusion_home_root
from uclusionUpdateNotices import UpdateNoticeStore

POKE_RETRY_DELAYS_SECONDS = (1, 2, 4, 5)


def update_notice_source(environment):
    # Keep the CLI's update state and credential lookup. Its stdout capture
    # runs in a separate process so it cannot capture MCP JSON-RPC responses.
    release_dir = os.path.dirname(os.path.realpath(__file__))
    cli = os.path.join(release_dir, 'uclusion.py')
    if not os.path.isfile(cli):
        cli = os.path.join(release_dir, 'uclusionCLI.py')
    result = subprocess.run([sys.executable, cli, '--uclusion-update-notice', environment],
                            capture_output=True, text=True, timeout=15)
    if result.returncode == 0:
        return json.loads(result.stdout)


class NativeRequestError(Exception):
    pass


class NativeNotSent(ConnectionError):
    pass


class NativeClient:
    def __init__(self, codex_home, observe):
        self.connection = WebSocketConnection('unix://' + os.path.join(
            codex_home, 'app-server-control', 'app-server-control.sock'))
        self.observe = observe
        self.pending = {}
        self.lock = threading.Lock()
        self.write_lock = threading.Lock()
        self.next_id = 0
        self.closed = threading.Event()

    def start(self):
        self.connection.connect()
        self.reader = threading.Thread(target=self._read, daemon=True,
                                       name='uclusion-codex-native-events')
        self.reader.start()
        self.request('initialize', {'clientInfo': {
            'name': 'uclusion_codex_native', 'title': 'Uclusion', 'version': '1'},
            'capabilities': {'experimentalApi': True}})
        self.send({'jsonrpc': '2.0', 'method': 'initialized'})

    def send(self, message):
        with self.write_lock:
            if self.closed.is_set():
                raise NativeNotSent('Native Codex observer is disconnected')
            self.connection.send_text(json.dumps(message))

    def request(self, method, params):
        result = []
        finished = threading.Event()
        with self.lock:
            self.next_id += 1
            request_id = self.next_id
            self.pending[request_id] = (finished, result)
        try:
            self.send({'jsonrpc': '2.0', 'id': request_id,
                       'method': method, 'params': params})
            if not finished.wait(10):
                raise TimeoutError('Native Codex request has no confirmed outcome')
            message = result[0]
            if isinstance(message, Exception):
                raise message
            if 'error' in message:
                raise NativeRequestError(str(message['error']))
            return message['result']
        finally:
            with self.lock:
                self.pending.pop(request_id, None)

    def _read(self):
        try:
            while not self.closed.is_set():
                try:
                    message = json.loads(self.connection.receive_text())
                except socket.timeout:
                    continue
                if 'method' in message:
                    if 'id' not in message:
                        self.observe(message)
                    # Approval and elicitation requests belong to Codex's UI.
                    continue
                with self.lock:
                    waiting = self.pending.get(message.get('id'))
                    if waiting:
                        waiting[1].append(message)
                        waiting[0].set()
        except Exception as error:
            self.closed.set()
            with self.lock:
                for finished, result in self.pending.values():
                    if not finished.is_set():
                        result.append(ConnectionError(type(error).__name__))
                        finished.set()

    def close(self):
        self.closed.set()
        with self.lock:
            for finished, result in self.pending.values():
                if not finished.is_set():
                    result.append(ConnectionError('Native Codex observer closed'))
                    finished.set()
        connection = self.connection.socket
        if connection is not None:
            try:
                connection.shutdown(socket.SHUT_RDWR)
            except OSError:
                pass
        self.connection.close()
        reader = getattr(self, 'reader', None)
        if reader is not None and reader is not threading.current_thread():
            reader.join(timeout=2)


class NativeInbox:
    """Independent cursors advance only after native admission is confirmed."""
    def __init__(self, environment, workspace_id, codex_home, replay=False):
        self.environment = environment
        self.workspace_id = workspace_id
        home_id = hashlib.sha256(os.fsencode(os.path.realpath(codex_home))).hexdigest()[:24]
        self.prefix = 'codex-native:' + home_id + ':'
        self.replay_id = ':replay:' + uuid.uuid4().hex if replay else ''
        with closing(open_inbox()) as connection, connection:
            connection.execute('BEGIN IMMEDIATE')
            connection.execute('''CREATE TABLE IF NOT EXISTS codex_native_pending (
                environment TEXT NOT NULL, workspace_id TEXT NOT NULL,
                consumer TEXT NOT NULL, sequence INTEGER NOT NULL,
                client_id TEXT NOT NULL, state TEXT NOT NULL,
                attempt_count INTEGER NOT NULL DEFAULT 0, attempt_started_at REAL,
                steered_turn_id TEXT,
                PRIMARY KEY(environment, workspace_id, consumer))''')
            columns = {row[1] for row in connection.execute('PRAGMA table_info(codex_native_pending)')}
            if 'attempt_count' not in columns:
                connection.execute('ALTER TABLE codex_native_pending ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0')
            if 'attempt_started_at' not in columns:
                connection.execute('ALTER TABLE codex_native_pending ADD COLUMN attempt_started_at REAL')
            if 'steered_turn_id' not in columns:
                connection.execute('ALTER TABLE codex_native_pending ADD COLUMN steered_turn_id TEXT')
            self.cutoff = 0 if replay else connection.execute('''
                SELECT COALESCE(MAX(sequence), 0) FROM poke_messages
                WHERE environment = ? AND workspace_id = ?''',
                (environment, workspace_id)).fetchone()[0]

    def scope(self, root):
        return self.environment, self.workspace_id, self.prefix + root + self.replay_id

    def prepare(self, root):
        scope = self.scope(root)
        with closing(open_inbox()) as connection, connection:
            connection.execute('''INSERT OR IGNORE INTO poke_consumers
                (environment, workspace_id, consumer, last_sequence, updated_at)
                VALUES (?, ?, ?, ?, ?)''', (*scope, self.cutoff, time.time()))
            connection.execute('''UPDATE poke_consumers SET updated_at = ?
                WHERE environment = ? AND workspace_id = ? AND consumer = ?''',
                (time.time(), *scope))

    def next(self, root):
        scope = self.scope(root)
        with closing(open_inbox()) as connection, connection:
            connection.execute('BEGIN IMMEDIATE')
            row = connection.execute('''SELECT p.sequence, m.message, p.client_id, p.state, p.steered_turn_id
                FROM codex_native_pending p JOIN poke_messages m ON m.sequence = p.sequence
                WHERE p.environment = ? AND p.workspace_id = ? AND p.consumer = ?''', scope).fetchone()
            if row is not None:
                return row
            connection.execute('''DELETE FROM codex_native_pending
                WHERE environment = ? AND workspace_id = ? AND consumer = ?''', scope)
            row = connection.execute('''SELECT sequence, message FROM poke_messages
                WHERE environment = ? AND workspace_id = ? AND consumed_at IS NULL
                AND sequence > (SELECT last_sequence FROM poke_consumers
                    WHERE environment = ? AND workspace_id = ? AND consumer = ?)
                ORDER BY sequence LIMIT 1''', (*scope[:2], *scope)).fetchone()
            if row is None:
                return None
            client_id = str(uuid.uuid5(uuid.NAMESPACE_URL, json.dumps((*scope, row[0]))))
            connection.execute('''INSERT INTO codex_native_pending
                (environment, workspace_id, consumer, sequence, client_id, state)
                VALUES (?, ?, ?, ?, ?, 'pending')''', (*scope, row[0], client_id))
            return *row, client_id, 'pending', None

    def state(self, root, value, steered_turn_id=None):
        with closing(open_inbox()) as connection, connection:
            if value == 'sending':
                connection.execute('''UPDATE codex_native_pending SET state = ?,
                    attempt_count = attempt_count + 1, attempt_started_at = ?, steered_turn_id = ?
                    WHERE environment = ? AND workspace_id = ? AND consumer = ?''',
                    (value, time.time(), steered_turn_id, *self.scope(root)))
            else:
                connection.execute('''UPDATE codex_native_pending SET state = ?
                    WHERE environment = ? AND workspace_id = ? AND consumer = ?''',
                    (value, *self.scope(root)))

    def retry_due(self, root):
        with closing(open_inbox()) as connection:
            attempts, started = connection.execute('''SELECT attempt_count, attempt_started_at
                FROM codex_native_pending WHERE environment = ? AND workspace_id = ?
                AND consumer = ?''', self.scope(root)).fetchone()
        now = time.time()
        if started is None or started > now:
            return True
        delay = POKE_RETRY_DELAYS_SECONDS[min(max(attempts - 1, 0), len(POKE_RETRY_DELAYS_SECONDS) - 1)]
        return now - started >= delay

    def acknowledge(self, root, sequence):
        scope = self.scope(root)
        with closing(open_inbox()) as connection, connection:
            connection.execute('BEGIN IMMEDIATE')
            connection.execute('''UPDATE poke_consumers SET last_sequence = MAX(last_sequence, ?),
                updated_at = ? WHERE environment = ? AND workspace_id = ? AND consumer = ?''',
                (sequence, time.time(), *scope))
            connection.execute('''DELETE FROM codex_native_pending WHERE environment = ?
                AND workspace_id = ? AND consumer = ? AND sequence = ?''', (*scope, sequence))


class NativeCodexDelivery:
    def __init__(self, environment, workspace_id, codex_home=None, replay=False,
                 token_audit=False, tools_changed=lambda: None,
                 notice_source=update_notice_source):
        self.codex_home = os.path.abspath(os.path.expanduser(
            codex_home or os.environ.get('CODEX_HOME') or '~/.codex'))
        os.environ['CODEX_HOME'] = self.codex_home
        os.environ.setdefault('UCLUSION_TOKEN_AUDIT_HOME', os.path.join(uclusion_home_root(), '.uclusion'))
        self.environment, self.workspace_id = environment, workspace_id
        self.inbox = NativeInbox(environment, workspace_id, self.codex_home, replay)
        self.identity = 'uclusion-native-' + uuid.uuid4().hex
        self.notices = UpdateNoticeStore(open_inbox)
        self.notice_config = SimpleNamespace(environment=environment, workspace_id=workspace_id,
                                             instance=self.identity)
        self.notice_source = notice_source
        self.notice_results = []
        self.notice_leader = False
        self.next_notice_check = 0
        self.next_notice_maintenance = 0
        self.client = None
        self.roots = {}
        self.collectors = {}
        self.joined_roots = set()
        self.descendant_subscriptions = set()
        self.pending_descendants = set()
        self.reconciliation_errors = {}
        self.token_audit = token_audit
        self.tools_changed = tools_changed
        self.stop = threading.Event()
        self.healthy = threading.Event()
        self.scan_requested = threading.Event()
        self.lock = threading.RLock()
        self.thread = threading.Thread(target=self._run, daemon=True,
                                       name='uclusion-codex-native-delivery')
        self.thread.start()

    def stamp_initialize(self, response):
        info = response.get('result', {}).get('serverInfo')
        if isinstance(info, dict):
            version = str(info.get('version', '1'))
            info['version'] = version + ('.' if '+' in version else '+') + self.identity
        if self.token_audit and 'result' in response:
            response['result'].setdefault('capabilities', {}).setdefault('tools', {})['listChanged'] = True

    def tools_ready(self):
        # Codex reads the initial catalog without honoring later list changes.
        # Wait for transport only. A cold root appears after catalog discovery.
        return self.healthy.wait(8)

    def _observe(self, message):
        params = message.get('params') or {}
        root = params.get('threadId')
        with self.lock:
            collectors = tuple(self.collectors.values())
        for collector in collectors:
            if message.get('method') == 'thread/started':
                collector.observe_descendant(params.get('thread'))
            if collector.owns_thread(root):
                collector.observe_notification(message)
                item = params.get('item') or {}
                if item.get('type') == 'subAgentActivity' and item.get('agentThreadId'):
                    with self.lock:
                        self.pending_descendants.add(item['agentThreadId'])
                    self.scan_requested.set()
        if message.get('method') in {'thread/started', 'thread/closed', 'mcpServer/startupStatus/updated'}:
            self.scan_requested.set()

    def _register(self, thread):
        root = thread['id']
        with self.lock:
            self.inbox.prepare(root)
            self.roots[root] = thread
        if self.token_audit and thread.get('path'):
            with self.lock:
                if root in self.collectors:
                    return
            from uclusionTokenAudit import CodexTokenAudit
            collector = CodexTokenAudit(self.environment, self.workspace_id,
                                       client_version=thread.get('cliVersion'))
            collector.set_primary_thread(thread)
            with self.lock:
                self.collectors[root] = collector
            try:
                self.client.request('thread/resume', {'threadId': root, 'excludeTurns': True})
                with self.lock:
                    self.joined_roots.add(root)
            except Exception:
                with self.lock:
                    self.collectors.pop(root, None)
                collector.close()
                raise

    def ensure_collector(self, request):
        meta = request.get('params', {}).get('_meta', {})
        root = meta.get('threadId') if isinstance(meta, dict) else None
        if not isinstance(root, str) or not root:
            return False
        self.scan_requested.set()
        deadline = time.monotonic() + 8
        while time.monotonic() < deadline and not self.stop.wait(.05):
            with self.lock:
                collector = self.collectors.get(root)
            if collector is not None and root in self.joined_roots and self.healthy.is_set():
                turn = meta.get('x-codex-turn-metadata', {})
                if isinstance(turn, dict) and turn.get('turn_id'):
                    collector.observe_notification({'method': 'turn/started', 'params': {
                        'threadId': root, 'turn': {'id': turn['turn_id']}}})
                return True
        return False

    def _scan(self):
        candidates = []
        cursor = None
        while True:
            page = self.client.request('thread/loaded/list', {'cursor': cursor})
            candidates.extend(page['data'])
            cursor = page.get('nextCursor')
            if cursor is None:
                break
        bound = set()
        descendants = []
        for root in candidates:
            try:
                thread = self.client.request('thread/read', {'threadId': root, 'includeTurns': False})['thread']
                if (thread.get('threadSource') != 'user' or thread.get('parentThreadId')
                        or thread.get('canAcceptDirectInput') is not True):
                    if thread.get('parentThreadId'):
                        descendants.append(thread)
                    continue
                status = self.client.request('mcpServerStatus/list', {
                    'threadId': root, 'serverName': 'Uclusion', 'detail': 'toolsAndAuthOnly'})
                if not any(self.identity in (server.get('serverInfo') or {}).get('version', '')
                           and server.get('runtimeStatus') == 'connected' for server in status['data']):
                    continue
                bound.add(root)
                self._register(thread)
            except NativeRequestError:
                continue
        with self.lock:
            for root in set(self.roots) - bound:
                self.roots.pop(root, None)
                self.joined_roots.discard(root)
                collector = self.collectors.pop(root, None)
                if collector:
                    collector.close()
            collectors = tuple(self.collectors.values())
        # Loaded children may precede their parents in the native list.
        while descendants:
            remaining = []
            for thread in descendants:
                if not any(collector.observe_descendant(thread) for collector in collectors):
                    remaining.append(thread)
            if len(remaining) == len(descendants):
                break
            descendants = remaining

    def _admitted(self, root, client_id, steered_turn_id=None):
        """Return None while an uncertain steer can still be uncommitted."""
        cursor = None
        while True:
            page = self.client.request('thread/queue/list', {'threadId': root, 'cursor': cursor})
            if any(row.get('clientUserMessageId') == client_id for row in page['data']):
                return True
            cursor = page.get('nextCursor')
            if cursor is None:
                break
        thread = self.client.request('thread/read', {'threadId': root, 'includeTurns': True})['thread']
        if any(item.get('type') == 'userMessage' and item.get('clientId') == client_id
               for turn in thread['turns'] for item in turn.get('items', [])):
            return True
        if steered_turn_id and any(turn['id'] == steered_turn_id and turn.get('status') == 'inProgress'
                                   for turn in thread['turns']):
            return None
        return False

    def _active_turn(self, root):
        thread = self.client.request('thread/read', {'threadId': root, 'includeTurns': False})['thread']
        if (thread.get('status') or {}).get('type') != 'active':
            return None
        thread = self.client.request('thread/read', {'threadId': root, 'includeTurns': True})['thread']
        return next((turn['id'] for turn in reversed(thread['turns'])
                     if turn.get('status') == 'inProgress'), None)

    def _subscribe_descendants(self):
        with self.lock:
            collectors = tuple(self.collectors.values())
        for collector in collectors:
            with self.lock:
                self.pending_descendants.update(collector.drain_descendant_thread_ids())
        with self.lock:
            pending = tuple(self.pending_descendants)
        for child in pending:
            if child in self.descendant_subscriptions:
                with self.lock:
                    self.pending_descendants.discard(child)
                continue
            try:
                thread = self.client.request('thread/read', {'threadId': child, 'includeTurns': False})['thread']
                collector = next((owner for owner in collectors
                                  if owner.observe_descendant(thread)), None)
                if collector is None:
                    continue
                if thread.get('path'):
                    self.client.request('thread/resume', {'threadId': child, 'excludeTurns': True})
                    collector.store.register_session_log(
                        collector.client, collector.store.fingerprint('codex-thread', child), thread['path'])
                    current = self.client.request('thread/read', {
                        'threadId': child, 'includeTurns': True})['thread']
                    for turn in current.get('turns', []):
                        if turn.get('status') == 'inProgress':
                            collector.observe_notification({'method': 'turn/started', 'params': {
                                'threadId': child, 'turn': {'id': turn['id']}}})
                    self.descendant_subscriptions.add(child)
                    with self.lock:
                        self.pending_descendants.discard(child)
            except NativeRequestError:
                continue

    def _deliver(self, root):
        pending = self.inbox.next(root)
        if pending is None:
            return
        sequence, text, client_id, state, steered_turn_id = pending
        if state == 'sending':
            try:
                admitted = self._admitted(root, client_id, steered_turn_id)
            except NativeRequestError as error:
                detail = str(error)
                if self.reconciliation_errors.get(root) != detail:
                    sys.stderr.write('Uclusion is waiting to reconcile a Poke for Codex '
                                     f'conversation {root}: {detail}\n')
                    self.reconciliation_errors[root] = detail
                return
            self.reconciliation_errors.pop(root, None)
            if admitted:
                self.inbox.acknowledge(root, sequence)
                return
            if admitted is None:
                return
        if not self.inbox.retry_due(root):
            return
        try:
            active_turn = self._active_turn(root)
        except NativeRequestError:
            return
        self.inbox.state(root, 'sending', active_turn)
        params = {'threadId': root, 'clientUserMessageId': client_id,
                  'input': [{'type': 'text', 'text': text, 'text_elements': []}]}
        if active_turn:
            params['expectedTurnId'] = active_turn
        try:
            receipt = self.client.request('turn/steer' if active_turn else 'thread/queue/add', params)
        except (NativeRequestError, NativeNotSent):
            self.inbox.state(root, 'pending')
            return
        if ((active_turn and receipt.get('turnId') == active_turn)
                or (not active_turn and receipt.get('queuedSubmission', {}).get('clientUserMessageId') == client_id)):
            self.inbox.acknowledge(root, sequence)
            record_demo_input('poke_delivered', {'message': text, 'consumer': self.inbox.scope(root)[2]})

    def _deliver_update_notice(self):
        now = time.monotonic()
        if now >= self.next_notice_maintenance:
            maintain = (self.notices.refresh_update_notice_leader if self.notice_leader
                        else self.notices.acquire_update_notice_leader)
            self.notice_leader = maintain(self.notice_config, os.getpid())
            self.next_notice_maintenance = now + 5
        if not self.notice_leader:
            return
        if now >= self.next_notice_check:
            self.next_notice_check = now + 60
            threading.Thread(target=self._check_update_notice, daemon=True,
                             name='uclusion-codex-update-check').start()
        with self.lock:
            notice = self.notice_results[0] if self.notice_results else None
        if notice:
            self.notices.enqueue_update_notice(self.notice_config, notice)
            with self.lock:
                self.notice_results.pop(0)
        sending = self.notices.get_sending_update_notice(self.notice_config)
        if sending is not None:
            try:
                admitted = self._admitted(sending.thread_id, sending.notice_id)
            except NativeRequestError:
                return
            if admitted:
                self.notices.acknowledge_update_notice(self.notice_config, sending.notice_id, None)
                return
            self.notices.mark_update_notice_pending(self.notice_config, sending.notice_id,
                                                    'No matching native admission')
        pending = self.notices.get_pending_update_notice(self.notice_config)
        if pending is None:
            return

        for root in tuple(self.roots):
            thread = self.client.request('thread/read', {'threadId': root, 'includeTurns': False})['thread']
            if (thread.get('status') or {}).get('type') != 'idle':
                continue
            queue = self.client.request('thread/queue/list', {'threadId': root})
            if queue['data']:
                continue
            self.notices.begin_update_notice(self.notice_config, pending.notice_id, root)
            try:
                receipt = self.client.request('thread/queue/add', {
                    'threadId': root, 'clientUserMessageId': pending.notice_id,
                    'input': [{'type': 'text', 'text': pending.message, 'text_elements': []}]})
            except (NativeRequestError, NativeNotSent) as error:
                self.notices.mark_update_notice_pending(self.notice_config, pending.notice_id,
                                                        type(error).__name__)
                return
            if receipt.get('queuedSubmission', {}).get('clientUserMessageId') == pending.notice_id:
                self.notices.acknowledge_update_notice(self.notice_config, pending.notice_id, None)
            return

    def _check_update_notice(self):
        try:
            notice = self.notice_source(self.environment)
            if notice:
                with self.lock:
                    self.notice_results.append(notice)
        except Exception:
            # An update check must not interrupt Poke delivery.
            pass

    def _run(self):
        reported_error = None
        while not self.stop.is_set():
            client = NativeClient(self.codex_home, self._observe)
            self.client = client
            try:
                client.start()
                self.healthy.set()
                reported_error = None
                self.tools_changed()
                next_scan = 0
                while not self.stop.is_set() and not client.closed.is_set():
                    if self.scan_requested.is_set() or time.monotonic() >= next_scan:
                        self.scan_requested.clear()
                        self._scan()
                        next_scan = time.monotonic() + 1
                    self._subscribe_descendants()
                    for root in tuple(self.roots):
                        self._deliver(root)
                    self._deliver_update_notice()
                    self.stop.wait(.25)
            except Exception as error:
                kind = type(error).__name__
                if kind != reported_error and not self.stop.is_set():
                    sys.stderr.write(f'Uclusion native Codex connection is unavailable ({kind}); reconnecting.\n')
                    reported_error = kind
            finally:
                self.healthy.clear()
                client.close()
                with self.lock:
                    for collector in self.collectors.values():
                        collector.mark_partial('session_interrupted')
                        collector.close()
                    self.collectors.clear()
                    self.joined_roots.clear()
                    self.descendant_subscriptions.clear()
                    self.pending_descendants.clear()
                self.tools_changed()
            self.stop.wait(1)

    def close(self):
        self.stop.set()
        if self.client is not None:
            self.client.close()
        self.thread.join(timeout=3)
        self.notices.release_update_notice_leader(self.notice_config, os.getpid())
