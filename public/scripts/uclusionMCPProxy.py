import base64
import argparse
import hashlib
import os
import sys
import json
import socket
import sqlite3
import ssl
import struct
import threading
import time
import urllib.request
import urllib.parse
from contextlib import closing
from uuid import uuid4


CREDENTIALS_FILE = 'credentials'
DEV_CREDENTIALS_FILE = 'dev_credentials'
STAGE_CREDENTIALS_FILE = 'stage_credentials'
DEV_API_URL = "dev.api.uclusion.com/v1"
STAGE_API_URL = "stage.api.uclusion.com/v1"
PRODUCTION_API_URL = "production.api.uclusion.com/v1"
DEV_WEBSOCKET_URL = "wss://dev.ws.uclusion.com/v1"
STAGE_WEBSOCKET_URL = "wss://stage.ws.uclusion.com/v1"
PRODUCTION_WEBSOCKET_URL = "wss://production.ws.uclusion.com/v1"
INBOX_FILE = 'poke_inbox.sqlite3'
WEBSOCKET_ACCEPT_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
MESSAGE_RETENTION_SECONDS = 7 * 24 * 60 * 60
TOKEN_AUDIT_TOOLS = frozenset({
    'start_job_audit', 'set_job_audit_phase', 'end_job_audit'
})
WORK_CLAIM_TOOL_NAME = 'claim_work'
WORK_CLAIM_TOOL = {
    'name': WORK_CLAIM_TOOL_NAME,
    'description': (
        'Attempts to take, or releases, the opt-in work claim lock for job '
        'or bug short codes so idle agents do not start the same work. Claim '
        'before starting auto-take work, passing every candidate you would '
        'start in preference order via short_code_ids; the result names the one '
        'code you now hold, and you start that item. A denied claim means '
        'every listed item is already held by other agents and grants no '
        'ownership. Release the held code at lane handoff. Human-guided '
        'selections do not require a claim. An error result means the lock '
        'service is unreachable and auto-take work must not start.'
    ),
    'inputSchema': {
        'type': 'object',
        'additionalProperties': False,
        'properties': {
            'operation': {'enum': ['claim', 'release']},
            'short_code_id': {'type': 'string', 'minLength': 1, 'maxLength': 255},
            'short_code_ids': {
                'type': 'array',
                'minItems': 1,
                'maxItems': 32,
                'items': {'type': 'string', 'minLength': 1, 'maxLength': 255}
            }
        },
        'required': ['operation']
    }
}


def prune_token_audit_storage(environment, workspace_id):
    """Apply scoped retention even when collection is currently disabled."""
    try:
        from uclusionTokenAudit import prune_existing_audit_store
        return prune_existing_audit_store(environment, workspace_id)
    except Exception:
        # Cleanup must never make the ordinary MCP connection unavailable.
        return 0


def token_audit_port(value):
    try:
        port = int(value)
    except (TypeError, ValueError):
        raise argparse.ArgumentTypeError('token-audit port must be an integer')
    if not 1024 <= port <= 65535:
        raise argparse.ArgumentTypeError(
            'token-audit port must be between 1024 and 65535'
        )
    return port


def parse_args(argv=None):
    parser = argparse.ArgumentParser(
        description='Proxy a local MCP client to Uclusion.'
    )
    parser.add_argument('workspace_id')
    parser.add_argument(
        'environment', nargs='?', choices=('dev', 'stage', 'production')
    )
    parser.add_argument('--work-claims', action='store_true')
    parser.add_argument('--token-audit', action='store_true')
    parser.add_argument('--token-audit-port', type=token_audit_port)
    parser.add_argument(
        '--token-audit-source', choices=('codex', 'otel', 'transcript')
    )
    parser.add_argument(
        '--token-audit-client', choices=('codex', 'claude')
    )
    parser.add_argument('--token-audit-ready-file')
    parser.add_argument('--token-audit-owner')
    args = parser.parse_args(argv)
    if args.token_audit:
        if args.token_audit_port is None or args.token_audit_source is None:
            parser.error(
                '--token-audit requires --token-audit-port and '
                '--token-audit-source'
            )
        expected_client = (
            'codex' if args.token_audit_source == 'codex' else 'claude'
        )
        if args.token_audit_client is None:
            args.token_audit_client = expected_client
        elif args.token_audit_client != expected_client:
            parser.error(
                f'--token-audit-source {args.token_audit_source} requires '
                f'--token-audit-client {expected_client}'
            )
        if args.token_audit_source == 'codex':
            if not args.token_audit_ready_file or not args.token_audit_owner:
                parser.error(
                    '--token-audit-source codex requires '
                    '--token-audit-ready-file and --token-audit-owner'
                )
        elif args.token_audit_ready_file or args.token_audit_owner:
            parser.error(
                'token-audit readiness settings apply only to Codex'
            )
    elif any((
        args.token_audit_port is not None,
        args.token_audit_source is not None,
        args.token_audit_client is not None,
        args.token_audit_ready_file is not None,
        args.token_audit_owner is not None,
    )):
        parser.error('token-audit settings require --token-audit')
    return args


def get_inbox_path():
    return os.path.join(os.path.expanduser('~'), '.uclusion', INBOX_FILE)


def open_inbox():
    """Open the cross-client Poke AI inbox with user-only permissions."""
    inbox_path = get_inbox_path()
    os.makedirs(os.path.dirname(inbox_path), mode=0o700, exist_ok=True)
    connection = sqlite3.connect(inbox_path, timeout=5)
    connection.execute('PRAGMA busy_timeout = 5000')
    ensure_inbox_schema(connection)
    try:
        os.chmod(inbox_path, 0o600)
    except OSError:
        # The database is still created inside the user's private Uclusion
        # directory on platforms that do not support POSIX file modes.
        pass
    return connection


def ensure_inbox_schema(connection):
    """Create or migrate the shared inbox schema (S-all-168 age-out model).

    Prompts are never deleted when read; they persist until the retention
    window expires so every consumer can see every message. ``sequence`` is
    AUTOINCREMENT so per-consumer delivery cursors in ``poke_consumers`` stay
    valid after expired rows are removed. ``consumed_at`` survives only so
    pre-migration tombstones and mixed-version clients keep de-duplicating
    and are not re-delivered; current code never sets it.
    """
    connection.execute('BEGIN IMMEDIATE')
    try:
        columns = [row[1] for row in connection.execute('PRAGMA table_info(poke_messages)')]
        needs_migration = bool(columns) and 'sequence' not in columns
        if needs_migration:
            connection.execute('ALTER TABLE poke_messages RENAME TO poke_messages_v1')
        connection.execute(
            '''
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
            '''
        )
        if needs_migration:
            connection.execute(
                '''
                INSERT INTO poke_messages
                    (message_id, environment, workspace_id, message, received_at, consumed_at)
                SELECT message_id, environment, workspace_id, message, received_at, consumed_at
                FROM poke_messages_v1 ORDER BY received_at, rowid
                '''
            )
            connection.execute('DROP TABLE poke_messages_v1')
        connection.execute(
            '''
            CREATE INDEX IF NOT EXISTS poke_messages_pending
            ON poke_messages(environment, workspace_id, consumed_at, received_at)
            '''
        )
        connection.execute(
            '''
            CREATE TABLE IF NOT EXISTS poke_consumers (
                environment TEXT NOT NULL,
                workspace_id TEXT NOT NULL,
                consumer TEXT NOT NULL,
                last_sequence INTEGER NOT NULL,
                updated_at REAL NOT NULL,
                PRIMARY KEY (environment, workspace_id, consumer)
            )
            '''
        )
        connection.commit()
    except Exception:
        connection.rollback()
        raise


def prune_inbox():
    """Age out prompts past the retention window (S-all-168).

    Delivery never deletes rows, so expiry is the only cleanup; pending
    prompts younger than the window always survive a proxy restart.
    """
    cutoff = time.time() - MESSAGE_RETENTION_SECONDS
    with closing(open_inbox()) as connection, connection:
        connection.execute(
            'DELETE FROM poke_messages WHERE received_at < ?',
            (cutoff,)
        )


def enqueue_prompt(environment, workspace_id, payload):
    """Persist one websocket prompt, de-duplicating broadcasts by message id."""
    message = payload.get('message')
    if not isinstance(message, str) or not message:
        return False
    message_id = payload.get('message_id')
    if not isinstance(message_id, str) or not message_id:
        # Compatibility fallback for an older sender. New senders provide a
        # UUID so two legitimate identical prompts remain distinct.
        encoded = (
            environment + '\0' + workspace_id + '\0' +
            json.dumps(payload, sort_keys=True, separators=(',', ':'))
        ).encode('utf-8')
        message_id = hashlib.sha256(encoded).hexdigest()
    now = time.time()
    with closing(open_inbox()) as connection, connection:
        connection.execute(
            'DELETE FROM poke_messages WHERE received_at < ?',
            (now - MESSAGE_RETENTION_SECONDS,)
        )
        cursor = connection.execute(
            '''
            INSERT OR IGNORE INTO poke_messages
                (message_id, environment, workspace_id, message, received_at)
            VALUES (?, ?, ?, ?, ?)
            ''',
            (message_id, environment, workspace_id, message, now)
        )
    return cursor.rowcount == 1


class WebSocketConnection:
    """Small RFC 6455 client sufficient for the API Gateway websocket."""

    def __init__(self, url):
        self.url = url
        self.socket = None
        self.buffer = bytearray()

    def connect(self):
        parsed = urllib.parse.urlsplit(self.url)
        if parsed.scheme != 'wss' or not parsed.hostname:
            raise ValueError(f'Unsupported websocket URL: {self.url}')
        port = parsed.port or 443
        raw_socket = socket.create_connection((parsed.hostname, port), timeout=10)
        self.socket = ssl.create_default_context().wrap_socket(
            raw_socket, server_hostname=parsed.hostname
        )
        self.socket.settimeout(30)

        key = base64.b64encode(os.urandom(16)).decode('ascii')
        path = parsed.path or '/'
        if parsed.query:
            path += '?' + parsed.query
        host = parsed.hostname if port == 443 else f'{parsed.hostname}:{port}'
        request = (
            f'GET {path} HTTP/1.1\r\n'
            f'Host: {host}\r\n'
            'Upgrade: websocket\r\n'
            'Connection: Upgrade\r\n'
            f'Sec-WebSocket-Key: {key}\r\n'
            'Sec-WebSocket-Version: 13\r\n'
            '\r\n'
        ).encode('ascii')
        self.socket.sendall(request)

        response = bytearray()
        while b'\r\n\r\n' not in response:
            chunk = self.socket.recv(4096)
            if not chunk:
                raise ConnectionError('Websocket closed during handshake')
            response.extend(chunk)
            if len(response) > 65536:
                raise ConnectionError('Websocket handshake headers were too large')
        header_bytes, remainder = bytes(response).split(b'\r\n\r\n', 1)
        header_lines = header_bytes.decode('iso-8859-1').split('\r\n')
        if len(header_lines) == 0 or ' 101 ' not in f' {header_lines[0]} ':
            raise ConnectionError(f'Websocket handshake failed: {header_lines[0]}')
        headers = {}
        for line in header_lines[1:]:
            if ':' in line:
                name, value = line.split(':', 1)
                headers[name.strip().lower()] = value.strip()
        expected_accept = base64.b64encode(
            hashlib.sha1((key + WEBSOCKET_ACCEPT_GUID).encode('ascii')).digest()
        ).decode('ascii')
        if headers.get('sec-websocket-accept') != expected_accept:
            raise ConnectionError('Websocket handshake returned an invalid accept key')
        self.buffer.extend(remainder)

    def _recv_exact(self, size):
        while len(self.buffer) < size:
            chunk = self.socket.recv(max(4096, size - len(self.buffer)))
            if not chunk:
                raise ConnectionError('Websocket closed')
            self.buffer.extend(chunk)
        result = bytes(self.buffer[:size])
        del self.buffer[:size]
        return result

    def receive_frame(self):
        first, second = self._recv_exact(2)
        is_final = bool(first & 0x80)
        opcode = first & 0x0f
        is_masked = bool(second & 0x80)
        length = second & 0x7f
        if length == 126:
            length = struct.unpack('!H', self._recv_exact(2))[0]
        elif length == 127:
            length = struct.unpack('!Q', self._recv_exact(8))[0]
        mask = self._recv_exact(4) if is_masked else None
        payload = self._recv_exact(length)
        if mask is not None:
            payload = bytes(value ^ mask[index % 4] for index, value in enumerate(payload))
        return opcode, payload, is_final

    def send_frame(self, opcode, payload=b''):
        if isinstance(payload, str):
            payload = payload.encode('utf-8')
        mask = os.urandom(4)
        length = len(payload)
        header = bytearray([0x80 | opcode])
        if length < 126:
            header.append(0x80 | length)
        elif length < 65536:
            header.append(0x80 | 126)
            header.extend(struct.pack('!H', length))
        else:
            header.append(0x80 | 127)
            header.extend(struct.pack('!Q', length))
        header.extend(mask)
        header.extend(value ^ mask[index % 4] for index, value in enumerate(payload))
        self.socket.sendall(header)

    def send_text(self, text):
        self.send_frame(0x1, text)

    def receive_text(self):
        fragments = bytearray()
        receiving_text = False
        while True:
            opcode, payload, is_final = self.receive_frame()
            if opcode == 0x8:
                raise ConnectionError('Websocket closed by server')
            if opcode == 0x9:
                self.send_frame(0xA, payload)
                continue
            if opcode == 0xA:
                continue
            if opcode == 0x1:
                fragments = bytearray(payload)
                receiving_text = True
            elif opcode == 0x0 and receiving_text:
                fragments.extend(payload)
            else:
                continue
            if is_final:
                return fragments.decode('utf-8')

    def close(self):
        if self.socket is None:
            return
        try:
            self.send_frame(0x8)
        except Exception:
            pass
        try:
            self.socket.close()
        except Exception:
            pass
        self.socket = None


class WorkClaimsManager:
    """Client side of the opt-in work claim lock served by the claim_work route.

    The listener thread owns the websocket receive loop, so claim requests
    from the MCP thread resolve through pending events keyed by message id.
    A shared send lock keeps claim frames and the heartbeat ping from
    interleaving on the socket.
    """

    REQUEST_TIMEOUT_SECONDS = 20

    def __init__(self, token_provider):
        self._token_provider = token_provider
        self._lock = threading.Lock()
        self._send_lock = threading.Lock()
        self._connection = None
        self._held = set()
        self._pending = {}
        self._subscribe_snapshot = ()

    def send_text(self, connection, text):
        with self._send_lock:
            connection.send_text(text)

    def attach_connection(self, connection):
        with self._lock:
            self._connection = connection

    def detach_connection(self, connection):
        with self._lock:
            if self._connection is connection:
                self._connection = None
            pending = list(self._pending.values())
        # Fail pending waits so tool calls do not hang across a reconnect.
        for entry in pending:
            entry['event'].set()

    def owned_short_codes_for_subscribe(self):
        with self._lock:
            self._subscribe_snapshot = tuple(sorted(self._held))
            return list(self._subscribe_snapshot)

    def handle_event(self, payload):
        if payload.get('event_type') == 'rebind_result':
            recovered = set(payload.get('short_code_ids') or [])
            with self._lock:
                lost = set(self._subscribe_snapshot) - recovered
                self._held -= lost
            if lost:
                sys.stderr.write(
                    'Work claims lost during reconnect: '
                    + ', '.join(sorted(lost)) + '\n'
                )
            return
        with self._lock:
            entry = self._pending.get(payload.get('message_id'))
        if entry is not None:
            entry['result'] = payload
            entry['event'].set()

    def request(self, operation, short_code_id=None, short_code_ids=None):
        """Run one claim or release round trip.

        A claim may carry an ordered preference list; the result's
        short_code_id names the single code granted from it.

        :return: the claim_result payload, or None when the lock service is
                 unreachable
        """
        message_id = str(uuid4())
        entry = {'event': threading.Event(), 'result': None}
        with self._lock:
            connection = self._connection
            self._pending[message_id] = entry
        try:
            if connection is None:
                return None
            body = {
                'action': 'claim_work',
                'identity': self._token_provider(),
                'operation': operation,
                'message_id': message_id
            }
            if short_code_ids is not None:
                body['short_code_ids'] = list(short_code_ids)
            if short_code_id is not None:
                body['short_code_id'] = short_code_id
            try:
                self.send_text(connection, json.dumps(body, separators=(',', ':')))
            except Exception:
                return None
            entry['event'].wait(self.REQUEST_TIMEOUT_SECONDS)
            result = entry['result']
            if result is None:
                return None
            with self._lock:
                if operation == 'claim' and result.get('claimed'):
                    granted = result.get('short_code_id')
                    if granted:
                        self._held.add(granted)
                elif operation == 'release' and short_code_id is not None:
                    self._held.discard(short_code_id)
            return result
        finally:
            with self._lock:
                self._pending.pop(message_id, None)

    def release_all_on_exit(self):
        """Free every held claim during graceful shutdown, fire and forget.

        A crash skips this on purpose; the server lets unrefreshed claims
        lapse so a crashed agent cannot hold the lock indefinitely.
        """
        with self._lock:
            connection = self._connection
            held = bool(self._held)
        if connection is None or not held:
            return
        try:
            body = {
                'action': 'claim_work',
                'identity': self._token_provider(),
                'operation': 'release_all',
                'message_id': str(uuid4())
            }
            self.send_text(connection, json.dumps(body, separators=(',', ':')))
        except Exception:
            pass


def listen_for_pokes(websocket_url, token, environment, workspace_id, stop_event,
                     work_claims=None):
    """Maintain the AI websocket subscription until the MCP process exits."""
    retry_delay = 1
    while not stop_event.is_set():
        websocket = WebSocketConnection(websocket_url)
        try:
            # A CLI market token lasts fourteen days. Resolve it for every
            # connection so a long-running proxy can recover after a network
            # break instead of resubscribing forever with an expired token.
            connection_token = token() if callable(token) else token
            websocket.connect()
            subscribe_body = {
                'action': 'subscribe',
                'identity': connection_token,
                'is_ai': True
            }
            if work_claims is not None:
                owned_short_code_ids = work_claims.owned_short_codes_for_subscribe()
                if owned_short_code_ids:
                    # Re-binds claims that survived the disconnect to this
                    # connection; the rebind_result event reports which did.
                    subscribe_body['owned_short_code_ids'] = owned_short_code_ids
            websocket.send_text(json.dumps(subscribe_body, separators=(',', ':')))
            if work_claims is not None:
                work_claims.attach_connection(websocket)
            retry_delay = 1
            awaiting_pong = False
            while not stop_event.is_set():
                try:
                    raw_message = websocket.receive_text()
                except socket.timeout:
                    if awaiting_pong:
                        raise ConnectionError(
                            'Poke AI websocket did not answer its application heartbeat'
                        )
                    # Match the browser's application-level heartbeat. The
                    # server sends this through its tracked-subscriber path,
                    # so pong proves both that the socket is alive and that
                    # the AI subscription still exists. An RFC control ping
                    # alone cannot prove the latter. The same ping also
                    # refreshes any held work claims server side.
                    if work_claims is not None:
                        work_claims.send_text(websocket, 'ping')
                    else:
                        websocket.send_text('ping')
                    awaiting_pong = True
                    continue
                payload = json.loads(raw_message)
                # Any application message proves the receive path is alive.
                awaiting_pong = False
                event_type = payload.get('event_type')
                if event_type == 'poke_ai':
                    enqueue_prompt(environment, workspace_id, payload)
                elif work_claims is not None and event_type in (
                        'claim_result', 'rebind_result'):
                    work_claims.handle_event(payload)
        except Exception as error:
            if not stop_event.is_set():
                sys.stderr.write(f'Poke AI websocket reconnecting after error: {error}\n')
                sys.stderr.flush()
        finally:
            if work_claims is not None:
                work_claims.detach_connection(websocket)
            websocket.close()
        if stop_event.wait(retry_delay):
            break
        retry_delay = min(retry_delay * 2, 30)


def get_credentials(credentials_path):
    credentials = {}
    cred_path = os.path.join(os.path.expanduser('~'), '.uclusion', credentials_path)

    if not os.path.exists(cred_path):
        sys.stderr.write("Error: Credentials file not found.\n")
        return None

    with open(cred_path, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, value = line.split('=', 1)
                credentials[key.strip()] = value.strip()

    return credentials


def login(api_url, credentials):
    login_url = 'https://sso.' + api_url + '/cli'
    data = json.dumps({
        'market_id': credentials['workspace_id'],
        'client_secret': credentials['secret_key'],
        'client_id': credentials['secret_key_id']
    }).encode('utf-8')
    req = urllib.request.Request(
        login_url, data=data,
        headers={'Content-Type': 'application/json'}, method='POST'
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))


def post_to_mcp(url, headers, body, timeout=30):
    req = urllib.request.Request(
        url, data=body.encode('utf-8'),
        headers=headers, method='POST'
    )
    return urllib.request.urlopen(req, timeout=timeout)


def post_to_mcp_refreshing_token(url, headers, body, token_provider, timeout=30):
    """Retry one MCP request with a fresh capability after token expiry."""
    try:
        return post_to_mcp(url, headers, body, timeout), None
    except urllib.request.HTTPError as error:
        if error.code != 401:
            raise
        error.close()
        refreshed_token = token_provider()
        refreshed_headers = dict(headers)
        refreshed_headers['Authorization'] = refreshed_token
        return (
            post_to_mcp(url, refreshed_headers, body, timeout),
            refreshed_token
        )


def write_message(obj):
    """Write a JSON-RPC message as a single compact line to stdout (stdio transport)."""
    line = json.dumps(obj, separators=(',', ':'))
    sys.stdout.write(line + '\n')
    sys.stdout.flush()

def write_jsonrpc_error(request_id, code, message, data=None):
    """Emit a JSON-RPC error response for a request id."""
    err = {"code": code, "message": message}
    if data is not None:
        err["data"] = data
    write_message({"jsonrpc": "2.0", "id": request_id, "error": err})


def filter_token_audit_tools(message, enabled):
    """Hide audit markers unless this MCP process owns a collector."""
    if enabled or not isinstance(message, dict):
        return message
    result = message.get('result')
    if not isinstance(result, dict) or not isinstance(result.get('tools'), list):
        return message
    filtered = [
        tool for tool in result['tools']
        if not isinstance(tool, dict) or tool.get('name') not in TOKEN_AUDIT_TOOLS
    ]
    if len(filtered) == len(result['tools']):
        return message
    return {**message, 'result': {**result, 'tools': filtered}}


def inject_work_claim_tool(message, enabled):
    """Advertise the proxy-local claim tool when the user opted in."""
    if not enabled or not isinstance(message, dict):
        return message
    result = message.get('result')
    if not isinstance(result, dict) or not isinstance(result.get('tools'), list):
        return message
    tools = result['tools']
    if any(isinstance(tool, dict) and tool.get('name') == WORK_CLAIM_TOOL_NAME
           for tool in tools):
        return message
    return {**message, 'result': {**result, 'tools': tools + [WORK_CLAIM_TOOL]}}


def handle_json_response(resp, token_audit_enabled=False, work_claims_enabled=False):
    data = resp.read().decode('utf-8')
    if data.strip():
        write_message(inject_work_claim_tool(filter_token_audit_tools(
            json.loads(data), token_audit_enabled
        ), work_claims_enabled))


def handle_sse_response(resp, token_audit_enabled=False, work_claims_enabled=False):
    for raw_line in resp:
        line = raw_line.decode('utf-8').rstrip('\r\n')
        if line.startswith('data: '):
            payload = line[6:]
            if payload.strip():
                write_message(inject_work_claim_tool(filter_token_audit_tools(
                    json.loads(payload), token_audit_enabled
                ), work_claims_enabled))


def handle_claim_tool_call(work_claims, request_id, params):
    """Service the local claim tool without involving the MCP backend."""
    arguments = params.get('arguments')
    arguments = arguments if isinstance(arguments, dict) else {}
    operation = arguments.get('operation')
    short_code_id = arguments.get('short_code_id')
    short_code_ids = arguments.get('short_code_ids')
    valid_single = isinstance(short_code_id, str) and short_code_id
    valid_list = (isinstance(short_code_ids, list) and short_code_ids
                  and all(isinstance(code, str) and code for code in short_code_ids))
    if operation == 'claim':
        valid = valid_single or valid_list
    elif operation == 'release':
        valid = valid_single and short_code_ids is None
    else:
        valid = False
    if not valid:
        write_jsonrpc_error(
            request_id=request_id,
            code=-32602,
            message='claim_work takes operation claim with short_code_id or '
                    'short_code_ids, or operation release with short_code_id',
        )
        return
    result = work_claims.request(
        operation,
        short_code_id=short_code_id if valid_single else None,
        short_code_ids=short_code_ids if valid_list else None,
    )
    if result is None:
        text = json.dumps({
            'error': 'The work claim service is unreachable; no claim was '
                     'granted, so do not start auto-take work.'
        })
        write_message({'jsonrpc': '2.0', 'id': request_id,
                       'result': {'content': [{'type': 'text', 'text': text}],
                                  'isError': True}})
        return
    text = json.dumps({
        'operation': operation,
        'short_code_id': result.get('short_code_id') if operation == 'claim'
        else short_code_id,
        'claimed': bool(result.get('claimed'))
    })
    write_message({'jsonrpc': '2.0', 'id': request_id,
                   'result': {'content': [{'type': 'text', 'text': text}],
                              'isError': False}})


def read_mcp_response(resp):
    """Read one JSON-RPC response for the private audit publisher."""
    content_type = resp.headers.get('Content-Type', '')
    if 'text/event-stream' in content_type:
        result = None
        for raw_line in resp:
            line = raw_line.decode('utf-8').rstrip('\r\n')
            if line.startswith('data: '):
                payload = line[6:].strip()
                if payload:
                    result = json.loads(payload)
        return result
    body = resp.read().decode('utf-8')
    return json.loads(body) if body.strip() else None


def checkpoint_identity_fingerprint(
    canonical_job_id,
    audit_run_id,
    marker_sequence,
    bucket,
    finalization,
):
    identity = {
        'identity_version': 1,
        'canonical_job_id': canonical_job_id,
        'audit_run_id': audit_run_id,
        'marker_sequence': marker_sequence,
        'bucket': bucket,
        'finalization': finalization,
    }
    canonical = json.dumps(
        identity,
        sort_keys=True,
        separators=(',', ':'),
        ensure_ascii=True,
    ).encode('utf-8')
    return 'sha256-v1:' + hashlib.sha256(canonical).hexdigest()


def make_token_audit_publisher(post_url, token_provider):
    """Build an authenticated, out-of-band finalization callback.

    The callback intentionally creates no user-visible stdout traffic and
    never logs the finalization body. The leased outbox keeps the payload
    immutable across retries, and the server reuses a matching audit note once
    that ordinary report is visible in the job export.
    """
    def publish(row):
        finalization = row.get('finalization')
        buckets = (
            finalization.get('buckets')
            if isinstance(finalization, dict) else None
        )
        if (
            not isinstance(buckets, dict)
            or not isinstance(buckets.get('items'), list)
            or 'phases' in finalization
        ):
            raise RuntimeError('audit finalization uses an unsupported shape')
        is_checkpoint = row.get('publication_kind') == 'checkpoint'
        if is_checkpoint:
            marker_sequence = row.get('marker_sequence')
            bucket = row.get('bucket')
            if (
                not isinstance(marker_sequence, int)
                or isinstance(marker_sequence, bool)
                or marker_sequence < 1
                or not isinstance(bucket, str)
                or not bucket
            ):
                raise RuntimeError('audit checkpoint identity is invalid')
            request_id = (
                'job-audit-' + row['audit_run_id']
                + '-checkpoint-' + str(marker_sequence)
            )
            tool_name = 'set_job_audit_phase'
            arguments = {
                'job_id': row['job_id'],
                'audit_run_id': row['audit_run_id'],
                'bucket': bucket,
                'marker_sequence': marker_sequence,
                'finalization': finalization,
            }
            expected_state = 'checkpointed'
            expected_publication = 'checkpoint'
            expected_checkpoint_fingerprint = (
                checkpoint_identity_fingerprint(
                    row['job_id'],
                    row['audit_run_id'],
                    marker_sequence,
                    bucket,
                    finalization,
                )
            )
        else:
            request_id = 'job-audit-' + row['audit_run_id']
            tool_name = 'end_job_audit'
            arguments = {
                'job_id': row['job_id'],
                'audit_run_id': row['audit_run_id'],
                'handoff_type': row['handoff_type'],
                'finalization': finalization,
            }
            expected_state = 'completed'
            expected_publication = 'final'
            expected_checkpoint_fingerprint = None
        request = {
            'jsonrpc': '2.0',
            'id': request_id,
            'method': 'tools/call',
            'params': {
                'name': tool_name,
                'arguments': arguments,
            },
        }
        token = token_provider()
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'Authorization': token,
        }
        resp, _refreshed = post_to_mcp_refreshing_token(
            post_url,
            headers,
            json.dumps(request, separators=(',', ':')),
            token_provider,
        )
        try:
            result = read_mcp_response(resp)
        finally:
            resp.close()
        if (
            not isinstance(result, dict)
            or result.get('jsonrpc') != '2.0'
            or result.get('id') != request_id
            or result.get('error') is not None
        ):
            raise RuntimeError('audit finalization RPC failed')
        tool_result = result.get('result')
        structured = (
            tool_result.get('structuredContent')
            if isinstance(tool_result, dict) else None
        )
        expected_total = finalization.get('measurement', {}).get(
            'normalized_total_tokens'
        )
        returned_total_field = (
            'checkpoint_normalized_total_tokens'
            if is_checkpoint else 'run_normalized_total_tokens'
        )
        returned_total = (
            structured.get(returned_total_field)
            if isinstance(structured, dict) else None
        )
        total_matches = (
            returned_total is None
            if expected_total is None
            else (
                isinstance(expected_total, int)
                and not isinstance(expected_total, bool)
                and isinstance(returned_total, int)
                and not isinstance(returned_total, bool)
                and returned_total == expected_total
            )
        )
        if (
            not isinstance(structured, dict)
            or not isinstance(structured.get('schema_version'), int)
            or isinstance(structured.get('schema_version'), bool)
            or structured.get('schema_version') != 1
            or structured.get('state') != expected_state
            # During a rolling API deployment, a legacy server can mistake a
            # visible checkpoint note for a completed run. Requiring the new
            # explicit publication kind keeps the terminal row retryable until
            # a server can prove that it found or created the final snapshot.
            or structured.get('publication') != expected_publication
            or structured.get('audit_run_id') != row['audit_run_id']
            or structured.get('canonical_job_id') != row['job_id']
            or not isinstance(structured.get('idempotent'), bool)
            or not isinstance(structured.get('note_short_code_id'), str)
            or not structured.get('note_short_code_id')
            or not isinstance(structured.get('note_url'), str)
            or not structured.get('note_url')
            or returned_total_field not in structured
            or not total_matches
        ):
            raise RuntimeError('audit finalization was not completed')
        if is_checkpoint:
            superseded = structured.get('superseded')
            identity_verified = structured.get('identity_verified')
            if (
                structured.get('marker_sequence') != row['marker_sequence']
                or structured.get('bucket') != row['bucket']
                or not isinstance(superseded, bool)
                or not isinstance(identity_verified, bool)
                or (
                    not superseded
                    and (
                        not identity_verified
                        or structured.get(
                            'checkpoint_identity_fingerprint'
                        ) != expected_checkpoint_fingerprint
                    )
                )
            ):
                raise RuntimeError('audit checkpoint was not correlated')
        return structured

    return publish


def main():
    sys.stdin = os.fdopen(sys.stdin.fileno(), 'r', buffering=1, closefd=False)
    sys.stdout = os.fdopen(sys.stdout.fileno(), 'w', buffering=1, closefd=False)

    args = parse_args()
    market_id = args.workspace_id
    url_env = args.environment
    if url_env == 'dev':
        api_url = DEV_API_URL
        credentials_path = DEV_CREDENTIALS_FILE
        websocket_url = DEV_WEBSOCKET_URL
        environment = 'dev'
    elif url_env == 'stage':
        api_url = STAGE_API_URL
        credentials_path = STAGE_CREDENTIALS_FILE
        websocket_url = STAGE_WEBSOCKET_URL
        environment = 'stage'
    else:
        api_url = PRODUCTION_API_URL
        credentials_path = CREDENTIALS_FILE
        websocket_url = PRODUCTION_WEBSOCKET_URL
        environment = 'production'

    stop_event = threading.Event()
    token_audit_runtime = None
    work_claims = None
    try:
        # Retention is scoped local maintenance and does not depend on login
        # succeeding. This remains active after an explicit audit opt-out.
        prune_token_audit_storage(environment, market_id)
        credentials = get_credentials(credentials_path)
        if credentials is None:
            sys.exit(1)
        credentials['workspace_id'] = market_id

        def websocket_token():
            return login(api_url, credentials)['uclusion_token']

        token = websocket_token()
        prune_inbox()
        work_claims = WorkClaimsManager(websocket_token) if args.work_claims else None
        listener = threading.Thread(
            target=listen_for_pokes,
            args=(websocket_url, websocket_token, environment, market_id, stop_event,
                  work_claims),
            name='uclusion-poke-ai',
            daemon=True
        )
        listener.start()

        post_url = 'https://investibles.' + api_url + '/mcp'
        if args.token_audit:
            try:
                from uclusionTokenAudit import TokenAuditProxy
                token_audit_runtime = TokenAuditProxy(
                    environment,
                    market_id,
                    args.token_audit_source,
                    args.token_audit_client,
                    args.token_audit_port,
                    make_token_audit_publisher(post_url, websocket_token),
                    ready_file=args.token_audit_ready_file,
                    ready_owner=args.token_audit_owner,
                )
            except Exception as error:
                # Token accounting is opt-in diagnostics; it must not make the
                # user's Uclusion MCP connection unavailable. Avoid exception
                # text because import/runtime errors can contain local paths.
                sys.stderr.write(
                    'Uclusion token audit is unavailable '
                    f'({error.__class__.__name__}).\n'
                )
        def token_audit_available():
            if token_audit_runtime is None:
                return False
            try:
                return bool(token_audit_runtime.tools_ready())
            except Exception:
                return False
        session_id = None

        while True:
            line = sys.stdin.readline()
            if not line:
                break
            line = line.strip()
            if not line:
                continue

            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/event-stream',
                'Authorization': token,
            }
            if session_id:
                headers['Mcp-Session-Id'] = session_id

            try:
                msg = json.loads(line)
            except json.JSONDecodeError as e:
                sys.stderr.write(f"Invalid JSON from stdin: {e}\n")
                continue

            is_notification = 'id' not in msg
            request_id = msg.get('id')

            params = msg.get('params')
            claim_tool_call = (
                msg.get('method') == 'tools/call'
                and isinstance(params, dict)
                and params.get('name') == WORK_CLAIM_TOOL_NAME
            )
            if claim_tool_call:
                # The claim tool is proxy-local; it never reaches the MCP
                # backend regardless of whether the opt-in is on.
                if is_notification:
                    continue
                if work_claims is None:
                    write_jsonrpc_error(
                        request_id=request_id,
                        code=-32601,
                        message='Work claims are not enabled for this connection',
                    )
                    continue
                handle_claim_tool_call(work_claims, request_id, params)
                continue
            audit_tool_call = (
                msg.get('method') == 'tools/call'
                and isinstance(params, dict)
                and params.get('name') in TOKEN_AUDIT_TOOLS
            )
            if audit_tool_call and not token_audit_available():
                if not is_notification:
                    write_jsonrpc_error(
                        request_id=request_id,
                        code=-32601,
                        message='Token audit is not enabled for this connection',
                    )
                continue

            try:
                resp, refreshed_token = post_to_mcp_refreshing_token(
                    post_url,
                    headers,
                    line,
                    websocket_token
                )
                if refreshed_token is not None:
                    token = refreshed_token

                sid = resp.headers.get('Mcp-Session-Id')
                if sid:
                    session_id = sid

                if is_notification:
                    resp.read()
                    continue

                content_type = resp.headers.get('Content-Type', '')
                if 'text/event-stream' in content_type:
                    handle_sse_response(resp, token_audit_available(),
                                        work_claims is not None)
                else:
                    handle_json_response(resp, token_audit_available(),
                                         work_claims is not None)

            except urllib.request.HTTPError as e:
                body = e.read().decode('utf-8', errors='replace')
                # Always return a JSON-RPC error for requests so clients don't hang.
                if not is_notification:
                    write_jsonrpc_error(
                        request_id=request_id,
                        code=-32000,
                        message=f"HTTP {e.code} from MCP server",
                        data={"status": e.code, "body": body}
                    )
                else:
                    sys.stderr.write(f"HTTP {e.code} from MCP server: {body}\n")
            except Exception as e:
                if not is_notification:
                    write_jsonrpc_error(
                        request_id=request_id,
                        code=-32001,
                        message="Error posting to MCP server",
                        data={"error": str(e)}
                    )
                else:
                    sys.stderr.write(f"Error posting to MCP server: {e}\n")

    except Exception as e:
        sys.stderr.write(f"Proxy setup failed: {e}\n")
        sys.exit(1)
    finally:
        if work_claims is not None:
            # Graceful exit frees held locks immediately instead of waiting
            # for the server-side expiry to lapse.
            work_claims.release_all_on_exit()
        stop_event.set()
        if token_audit_runtime is not None:
            token_audit_runtime.close()


if __name__ == "__main__":
    main()
