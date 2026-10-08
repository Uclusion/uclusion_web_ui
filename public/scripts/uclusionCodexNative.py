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
import sqlite3
import subprocess
import sys
import threading
import time
import uuid
from contextlib import closing
from pathlib import Path
from types import SimpleNamespace

from uclusionMCPProxy import (ReconnectBackoff, WebSocketConnection, get_inbox_path, open_inbox,
                             record_demo_input, uclusion_home_root)
from uclusionUpdateNotices import UpdateNoticeStore

POKE_RETRY_DELAYS_SECONDS = (1, 2, 4, 5)


def native_scope(environment, workspace_id):
    identity = json.dumps([environment, workspace_id], separators=(',', ':')).encode('utf-8')
    digest = hashlib.sha256(b'uclusion.codex.native.scope.v1\0' + identity).hexdigest()
    return 'uclusion-scope-v1-' + digest


def version_has_marker(version, marker):
    return marker in str(version).replace('+', '.').split('.')


def native_recipients(client, scope):
    """Return eligible roots in the server's exact native recency order.

    Neither saved timestamps nor observer subscriptions establish recency.
    Any failed read leaves ordering/binding unconfirmed rather than skipping a
    possibly newer recipient. This read-only path is also used by inspection.
    """
    loaded = set()
    cursor = None
    while True:
        page = client.request('thread/loaded/list', {'cursor': cursor})
        loaded.update(page['data'])
        cursor = page.get('nextCursor')
        if cursor is None:
            break
    recipients = []
    cursor = None
    while True:
        page = client.request('thread/list', {'cursor': cursor, 'sortKey': 'recency_at',
                                             'sortDirection': 'desc', 'useStateDbOnly': True})
        for listed in page['data']:
            root = listed['id']
            if root not in loaded:
                continue
            thread = client.request('thread/read', {'threadId': root, 'includeTurns': False})['thread']
            if (thread.get('threadSource') != 'user' or thread.get('parentThreadId')
                    or thread.get('canAcceptDirectInput') is not True):
                continue
            versions = []
            # Unscoped discovery starts fresh MCP clients in Codex. A proxy
            # inspecting itself would recursively start more proxies.
            for server_name in ('uclusion', 'Uclusion'):
                status_cursor = None
                while True:
                    status = client.request('mcpServerStatus/list', {
                        'threadId': root, 'serverName': server_name,
                        'detail': 'toolsAndAuthOnly', 'cursor': status_cursor})
                    versions.extend((server.get('serverInfo') or {}).get('version', '')
                                    for server in status['data'] if server.get('runtimeStatus') == 'connected')
                    status_cursor = status.get('nextCursor')
                    if status_cursor is None:
                        break
            if any(version_has_marker(version, scope) for version in versions):
                recipients.append({**thread, '_uclusion_versions': versions})
        cursor = page.get('nextCursor')
        if cursor is None:
            return recipients


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
    """One durable workspace stream, with atomic ownership of each event."""
    def __init__(self, environment, workspace_id, replay=False):
        self.environment = environment
        self.workspace_id = workspace_id
        self.consumer = 'codex-native:' + native_scope(environment, workspace_id)
        if replay:
            self.consumer += ':replay:' + uuid.uuid4().hex
        self.owner = uuid.uuid4().hex
        self.pid_is_alive = UpdateNoticeStore._pid_is_alive
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
            for name, declaration in (('stream', 'TEXT'), ('root', 'TEXT'),
                                      ('prior_admissions', 'TEXT'),
                                      ('owner_instance', 'TEXT'), ('owner_pid', 'INTEGER')):
                if name not in columns:
                    connection.execute(f'ALTER TABLE codex_native_pending ADD COLUMN {name} {declaration}')
            connection.execute('''CREATE TABLE IF NOT EXISTS codex_native_proxies (
                environment TEXT NOT NULL, workspace_id TEXT NOT NULL, stream TEXT NOT NULL,
                instance TEXT NOT NULL, pid INTEGER NOT NULL,
                PRIMARY KEY(environment, workspace_id, stream, instance))''')
            proxies = connection.execute('''SELECT instance, pid FROM codex_native_proxies
                WHERE environment = ? AND workspace_id = ? AND stream = ?''', self.scope()).fetchall()
            live = False
            for instance, pid in proxies:
                if self.pid_is_alive(pid):
                    live = True
                else:
                    connection.execute('''DELETE FROM codex_native_proxies WHERE environment = ?
                        AND workspace_id = ? AND stream = ? AND instance = ?''', (*self.scope(), instance))
            cutoff = 0 if replay else connection.execute('''
                SELECT COALESCE(MAX(sequence), 0) FROM poke_messages
                WHERE environment = ? AND workspace_id = ?''',
                (environment, workspace_id)).fetchone()[0]
            if live:
                connection.execute('''INSERT OR IGNORE INTO poke_consumers
                    (environment, workspace_id, consumer, last_sequence, updated_at)
                    VALUES (?, ?, ?, ?, ?)''', (*self.scope(), cutoff, time.time()))
            else:
                connection.execute('''INSERT INTO poke_consumers
                    (environment, workspace_id, consumer, last_sequence, updated_at)
                    VALUES (?, ?, ?, ?, ?) ON CONFLICT (environment, workspace_id, consumer)
                    DO UPDATE SET last_sequence = MAX(last_sequence, excluded.last_sequence),
                        updated_at = excluded.updated_at''', (*self.scope(), cutoff, time.time()))
            connection.execute('INSERT INTO codex_native_proxies VALUES (?, ?, ?, ?, ?)',
                               (*self.scope(), self.owner, os.getpid()))
            if not replay:
                # Consolidate only existing native pending work. Preserve every
                # attempted identity for reconciliation, with one exact retry
                # target per event. A cursor alone may be a startup cutoff.
                old = connection.execute('''SELECT consumer, sequence, client_id, state,
                        attempt_count, attempt_started_at, steered_turn_id
                    FROM codex_native_pending WHERE environment = ? AND workspace_id = ?
                    AND stream IS NULL AND consumer LIKE 'codex-native:%' AND consumer NOT LIKE '%:replay:%'
                    ORDER BY sequence, attempt_started_at, consumer''', (environment, workspace_id)).fetchall()
                events = {}
                for row in old:
                    parts = row[0].split(':')
                    if len(parts) >= 3:
                        events.setdefault(row[1], []).append((parts[2], row))
                for sequence, copies in events.items():
                    self._insert(connection, sequence)
                    current = connection.execute('''SELECT client_id, attempt_count, prior_admissions, state
                        FROM codex_native_pending WHERE environment = ? AND workspace_id = ?
                        AND consumer = ?''', (environment, workspace_id, self.consumer + ':event:' + str(sequence))).fetchone()
                    prior = json.loads(current[2]) if current[2] else []
                    attempted = [(root, row) for root, row in copies if row[4] > 0 or row[3] == 'sending']
                    primary_id = current[0]
                    if attempted and current[1] == 0 and current[3] != 'accepted':
                        root, primary = attempted[0]
                        primary_id = primary[2]
                        connection.execute('''UPDATE codex_native_pending SET root = ?, client_id = ?, state = ?,
                            attempt_count = ?, attempt_started_at = ?, steered_turn_id = ?
                            WHERE environment = ? AND workspace_id = ? AND stream = ? AND sequence = ?''',
                            (root, primary[2], primary[3], max(primary[4], 1), primary[5], primary[6], *self.scope(), sequence))
                    prior.extend([root, row[2], row[6]] for root, row in attempted if row[2] != primary_id)
                    consumers = connection.execute('''SELECT consumer FROM poke_consumers
                        WHERE environment = ? AND workspace_id = ? AND consumer LIKE 'codex-native:%'
                        AND consumer NOT LIKE '%:replay:%' AND consumer != ? AND last_sequence >= ?''',
                        (environment, workspace_id, self.consumer, sequence)).fetchall()
                    for (consumer,) in consumers:
                        parts = consumer.split(':')
                        if len(parts) < 3 or parts[1].startswith('uclusion-scope-v1-'):
                            continue
                        client_id = str(uuid.uuid5(uuid.NAMESPACE_URL,
                            json.dumps((environment, workspace_id, consumer, sequence))))
                        if client_id != primary_id:
                            prior.append([parts[2], client_id, None])
                    if prior:
                        connection.execute('''UPDATE codex_native_pending SET prior_admissions = ?
                            WHERE environment = ? AND workspace_id = ? AND stream = ? AND sequence = ?''',
                            (json.dumps(list(dict.fromkeys(tuple(item) for item in prior))), *self.scope(), sequence))
                    for _, row in copies:
                        connection.execute('''DELETE FROM codex_native_pending WHERE environment = ?
                            AND workspace_id = ? AND consumer = ?''', (environment, workspace_id, row[0]))

    def scope(self):
        return self.environment, self.workspace_id, self.consumer

    def _insert(self, connection, sequence):
        consumer = self.consumer + ':event:' + str(sequence)
        client_id = str(uuid.uuid5(uuid.NAMESPACE_URL, json.dumps((*self.scope(), sequence))))
        connection.execute('''INSERT OR IGNORE INTO codex_native_pending
            (environment, workspace_id, consumer, stream, sequence, client_id, state)
            VALUES (?, ?, ?, ?, ?, ?, 'pending')''',
            (self.environment, self.workspace_id, consumer, self.consumer, sequence, client_id))

    def next(self):
        with closing(open_inbox()) as connection, connection:
            connection.execute('BEGIN IMMEDIATE')
            connection.execute('''DELETE FROM codex_native_pending WHERE environment = ?
                AND workspace_id = ? AND stream = ? AND sequence NOT IN (SELECT sequence FROM poke_messages)''',
                self.scope())
            row = connection.execute('''SELECT p.sequence, m.message, p.client_id, p.state,
                    p.steered_turn_id, p.root, p.owner_instance, p.owner_pid
                FROM codex_native_pending p JOIN poke_messages m ON m.sequence = p.sequence
                WHERE p.environment = ? AND p.workspace_id = ? AND p.stream = ? AND p.state != 'accepted'
                ORDER BY p.sequence LIMIT 1''', self.scope()).fetchone()
            if row is None:
                event = connection.execute('''SELECT sequence FROM poke_messages
                WHERE environment = ? AND workspace_id = ? AND consumed_at IS NULL
                AND sequence > (SELECT last_sequence FROM poke_consumers
                    WHERE environment = ? AND workspace_id = ? AND consumer = ?)
                ORDER BY sequence LIMIT 1''', (*self.scope()[:2], *self.scope())).fetchone()
                if event is None:
                    return None
                self._insert(connection, event[0])
                row = connection.execute('''SELECT p.sequence, m.message, p.client_id, p.state,
                        p.steered_turn_id, p.root, p.owner_instance, p.owner_pid
                    FROM codex_native_pending p JOIN poke_messages m ON m.sequence = p.sequence
                    WHERE p.environment = ? AND p.workspace_id = ? AND p.stream = ? AND p.sequence = ?''',
                    (*self.scope(), event[0])).fetchone()
            if row[6] not in (None, self.owner) and self.pid_is_alive(row[7]):
                return None
            connection.execute('''UPDATE codex_native_pending SET owner_instance = ?, owner_pid = ?
                WHERE environment = ? AND workspace_id = ? AND stream = ? AND sequence = ?''',
                (self.owner, os.getpid(), *self.scope(), row[0]))
            return row[:6]

    def release(self):
        with closing(open_inbox()) as connection, connection:
            connection.execute('''UPDATE codex_native_pending SET owner_instance = NULL, owner_pid = NULL
                WHERE environment = ? AND workspace_id = ? AND stream = ? AND owner_instance = ?''',
                (*self.scope(), self.owner))

    def close(self):
        with closing(open_inbox()) as connection, connection:
            connection.execute('BEGIN IMMEDIATE')
            connection.execute('''UPDATE codex_native_pending SET owner_instance = NULL, owner_pid = NULL
                WHERE environment = ? AND workspace_id = ? AND stream = ? AND owner_instance = ?''',
                (*self.scope(), self.owner))
            connection.execute('''DELETE FROM codex_native_proxies WHERE environment = ?
                AND workspace_id = ? AND stream = ? AND instance = ?''', (*self.scope(), self.owner))

    def prior_admissions(self):
        with closing(open_inbox()) as connection:
            row = connection.execute('''SELECT prior_admissions FROM codex_native_pending
                WHERE environment = ? AND workspace_id = ? AND stream = ? AND owner_instance = ?''',
                (*self.scope(), self.owner)).fetchone()
        return json.loads(row[0]) if row and row[0] else []

    def clear_prior_admissions(self):
        with closing(open_inbox()) as connection, connection:
            connection.execute('''UPDATE codex_native_pending SET prior_admissions = NULL
                WHERE environment = ? AND workspace_id = ? AND stream = ? AND owner_instance = ?''',
                (*self.scope(), self.owner))

    def state(self, root, value, steered_turn_id=None):
        with closing(open_inbox()) as connection, connection:
            if value == 'sending':
                connection.execute('''UPDATE codex_native_pending SET state = ?, root = COALESCE(root, ?),
                    attempt_count = attempt_count + 1, attempt_started_at = ?, steered_turn_id = ?
                    WHERE environment = ? AND workspace_id = ? AND stream = ? AND owner_instance = ?''',
                    (value, root, time.time(), steered_turn_id, *self.scope(), self.owner))
            else:
                connection.execute('''UPDATE codex_native_pending SET state = ?
                    WHERE environment = ? AND workspace_id = ? AND stream = ? AND owner_instance = ?''',
                    (value, *self.scope(), self.owner))

    def retry_due(self):
        with closing(open_inbox()) as connection:
            row = connection.execute('''SELECT attempt_count, attempt_started_at
                FROM codex_native_pending WHERE environment = ? AND workspace_id = ?
                AND stream = ? AND owner_instance = ?''', (*self.scope(), self.owner)).fetchone()
            if row is None:
                return False
            attempts, started = row
        now = time.time()
        if started is None or started > now:
            return True
        delay = POKE_RETRY_DELAYS_SECONDS[min(max(attempts - 1, 0), len(POKE_RETRY_DELAYS_SECONDS) - 1)]
        return now - started >= delay

    def acknowledge(self, root, sequence):
        with closing(open_inbox()) as connection, connection:
            connection.execute('BEGIN IMMEDIATE')
            accepted = connection.execute('''UPDATE codex_native_pending SET state = 'accepted',
                owner_instance = NULL, owner_pid = NULL WHERE environment = ?
                AND workspace_id = ? AND stream = ? AND sequence = ? AND owner_instance = ?
                AND (root IS NULL OR root = ?)''', (*self.scope(), sequence, self.owner, root))
            if accepted.rowcount:
                connection.execute('''UPDATE poke_consumers SET last_sequence = MAX(last_sequence, ?),
                    updated_at = ? WHERE environment = ? AND workspace_id = ? AND consumer = ?''',
                    (sequence, time.time(), *self.scope()))


class NativeCodexDelivery:
    def __init__(self, environment, workspace_id, codex_home=None, replay=False,
                 token_audit=False, tools_changed=lambda: None,
                 notice_source=update_notice_source, context_events=None):
        self.codex_home = os.path.abspath(os.path.expanduser(
            codex_home or os.environ.get('CODEX_HOME') or '~/.codex'))
        os.environ['CODEX_HOME'] = self.codex_home
        os.environ.setdefault('UCLUSION_TOKEN_AUDIT_HOME', os.path.join(uclusion_home_root(), '.uclusion'))
        self.environment, self.workspace_id = environment, workspace_id
        self.scope_marker = native_scope(environment, workspace_id)
        self.inbox = NativeInbox(environment, workspace_id, replay=replay)
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
        self.context_events = context_events
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
            info['version'] = version + ('.' if '+' in version else '+') + self.identity + '.' + self.scope_marker
        if self.token_audit and 'result' in response:
            response['result'].setdefault('capabilities', {}).setdefault('tools', {})['listChanged'] = True

    def tools_ready(self):
        # Codex reads the initial catalog without honoring later list changes.
        # Wait for transport only. A cold root appears after catalog discovery.
        return self.healthy.wait(8)

    def _observe(self, message):
        params = message.get('params') or {}
        root = params.get('threadId')
        item = params.get('item') or {}
        if self.context_events and root in self.joined_roots and (
                message.get('method') == 'thread/compacted' or (
                    message.get('method') == 'item/completed' and item.get('type') == 'contextCompaction')):
            self.context_events(root, 'compact')
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
            self.roots[root] = thread
        owned = any(version_has_marker(version, self.identity)
                    for version in thread['_uclusion_versions'])
        if owned and (self.token_audit or self.context_events) and thread.get('path'):
            with self.lock:
                if root in self.joined_roots:
                    return
            collector = None
            if self.token_audit:
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
                if self.context_events:
                    self.context_events(root, 'connected')
            except Exception:
                with self.lock:
                    self.collectors.pop(root, None)
                if collector:
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
        recipients = native_recipients(self.client, self.scope_marker)
        bound = {thread['id'] for thread in recipients}
        for thread in recipients:
            self._register(thread)
        owned = {thread['id'] for thread in recipients
                 if any(version_has_marker(version, self.identity) for version in thread['_uclusion_versions'])}
        candidates = []
        cursor = None
        while self.token_audit:
            page = self.client.request('thread/loaded/list', {'cursor': cursor})
            candidates.extend(page['data'])
            cursor = page.get('nextCursor')
            if cursor is None:
                break
        descendants = []
        for root in candidates:
            try:
                thread = self.client.request('thread/read', {'threadId': root, 'includeTurns': False})['thread']
                if thread.get('parentThreadId'):
                    descendants.append(thread)
            except NativeRequestError:
                continue
        with self.lock:
            for root in set(self.roots) - bound:
                self.roots.pop(root, None)
            for root in (set(self.collectors) | self.joined_roots) - owned:
                self.joined_roots.discard(root)
                if self.context_events:
                    self.context_events(root, 'unavailable')
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

    def _deliver(self):
        try:
            self._deliver_owned()
        finally:
            self.inbox.release()

    def _deliver_owned(self):
        pending = self.inbox.next()
        if pending is None:
            return
        sequence, text, client_id, state, steered_turn_id, root = pending
        prior = self.inbox.prior_admissions()
        reconciliation = ([(root, client_id, steered_turn_id)] if state == 'sending' else []) + prior
        uncertain = False
        for prior_root, prior_id, prior_turn in reconciliation:
            try:
                admitted = self._admitted(prior_root, prior_id, prior_turn)
            except NativeRequestError as error:
                detail = str(error)
                if self.reconciliation_errors.get(prior_root) != detail:
                    sys.stderr.write('Uclusion is waiting to reconcile a Poke for Codex '
                                     f'conversation {prior_root}: {detail}\n')
                    self.reconciliation_errors[prior_root] = detail
                uncertain = True
                continue
            self.reconciliation_errors.pop(prior_root, None)
            if admitted:
                self.inbox.acknowledge(root or prior_root, sequence)
                return
            if admitted is None:
                uncertain = True
        if uncertain:
            return
        if prior:
            self.inbox.clear_prior_admissions()
        if not self.inbox.retry_due():
            return
        try:
            recipients = native_recipients(self.client, self.scope_marker)
            if root is None:
                if not recipients:
                    return
                root = recipients[0]['id']
            elif root not in {thread['id'] for thread in recipients}:
                return
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
            record_demo_input('poke_delivered', {'message': text, 'consumer': self.inbox.scope()[2]})

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
        backoff = ReconnectBackoff()
        while not self.stop.is_set():
            client = NativeClient(self.codex_home, self._observe)
            self.client = client
            try:
                client.start()
                connected_at = time.monotonic()
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
                    self._deliver()
                    self._deliver_update_notice()
                    backoff.reset_if_stable(connected_at)
                    self.stop.wait(.25)
            except Exception as error:
                kind = type(error).__name__
                if kind != reported_error and not self.stop.is_set():
                    sys.stderr.write(f'Uclusion native Codex connection is unavailable ({kind}); reconnecting.\n')
                    reported_error = kind
            finally:
                self.healthy.clear()
                if self.context_events:
                    for root in tuple(self.joined_roots):
                        self.context_events(root, 'unavailable')
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
            if backoff.wait(self.stop):
                break

    def close(self):
        self.stop.set()
        if self.client is not None:
            self.client.close()
        self.thread.join(timeout=3)
        self.inbox.close()
        self.notices.release_update_notice_leader(self.notice_config, os.getpid())


def inspect_native_recipients(environment, workspace_id, codex_home):
    """Inspect without delivery, subscriptions, schema writes or thread resume."""
    scope = native_scope(environment, workspace_id)
    client = NativeClient(codex_home, lambda message: None)
    try:
        client.start()
        candidates = native_recipients(client, scope)
    finally:
        client.close()
    identities = [{'id': thread['id'], 'name': thread.get('name'),
                   'status': (thread.get('status') or {}).get('type')}
                  for thread in candidates]
    outstanding = []
    path = get_inbox_path()
    if os.path.isfile(path):
        with closing(sqlite3.connect(Path(path).as_uri() + '?mode=ro', uri=True)) as connection:
            columns = {row[1] for row in connection.execute('PRAGMA table_info(codex_native_pending)')}
            if 'stream' in columns:
                rows = connection.execute('''SELECT sequence, root, client_id, state, steered_turn_id, prior_admissions
                    FROM codex_native_pending WHERE environment = ? AND workspace_id = ?
                    AND stream = ? AND state != 'accepted'
                    AND (attempt_count > 0 OR prior_admissions IS NOT NULL) ORDER BY sequence''',
                    (environment, workspace_id, 'codex-native:' + scope)).fetchall()
                for sequence, root, client_id, state, turn_id, prior in rows:
                    if root:
                        outstanding.append({'sequence': sequence, 'root': root, 'client_id': client_id,
                                            'state': state, 'steered_turn_id': turn_id})
                    for prior_root, prior_id, prior_turn in json.loads(prior) if prior else []:
                        outstanding.append({'sequence': sequence, 'root': prior_root, 'client_id': prior_id,
                                            'state': 'checking_prior_admission', 'steered_turn_id': prior_turn})
    return {'environment': environment, 'workspace_id': workspace_id,
            'candidate_count': len(identities), 'candidates': identities,
            'selected': identities[0] if identities else None,
            'outstanding_receipt_reconciliation': outstanding}
