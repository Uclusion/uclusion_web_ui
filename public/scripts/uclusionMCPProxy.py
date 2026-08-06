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


def listen_for_pokes(websocket_url, token, environment, workspace_id, stop_event):
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
            websocket.send_text(json.dumps({
                'action': 'subscribe',
                'identity': connection_token,
                'is_ai': True
            }, separators=(',', ':')))
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
                    # alone cannot prove the latter.
                    websocket.send_text('ping')
                    awaiting_pong = True
                    continue
                payload = json.loads(raw_message)
                # Any application message proves the receive path is alive.
                awaiting_pong = False
                if payload.get('event_type') == 'poke_ai':
                    enqueue_prompt(environment, workspace_id, payload)
        except Exception as error:
            if not stop_event.is_set():
                sys.stderr.write(f'Poke AI websocket reconnecting after error: {error}\n')
                sys.stderr.flush()
        finally:
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


def handle_json_response(resp, token_audit_enabled=False):
    data = resp.read().decode('utf-8')
    if data.strip():
        write_message(filter_token_audit_tools(
            json.loads(data), token_audit_enabled
        ))


def handle_sse_response(resp, token_audit_enabled=False):
    for raw_line in resp:
        line = raw_line.decode('utf-8').rstrip('\r\n')
        if line.startswith('data: '):
            payload = line[6:]
            if payload.strip():
                write_message(filter_token_audit_tools(
                    json.loads(payload), token_audit_enabled
                ))


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


def make_token_audit_publisher(post_url, token_provider):
    """Build an authenticated, out-of-band finalization callback.

    The callback intentionally creates no user-visible stdout traffic and
    never logs the finalization body. Server-side idempotency makes retrying a
    leased outbox row safe after crashes or token refreshes.
    """
    def publish(row):
        request_id = 'job-audit-' + row['audit_run_id']
        request = {
            'jsonrpc': '2.0',
            'id': request_id,
            'method': 'tools/call',
            'params': {
                'name': 'end_job_audit',
                'arguments': {
                    'job_id': row['job_id'],
                    'audit_run_id': row['audit_run_id'],
                    'handoff_type': row['handoff_type'],
                    'finalization': row['finalization'],
                },
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
        if (
            not isinstance(structured, dict)
            or structured.get('schema_version') != 1
            or structured.get('state') != 'completed'
            or structured.get('audit_run_id') != row['audit_run_id']
            or structured.get('canonical_job_id') != row['job_id']
        ):
            raise RuntimeError('audit finalization was not completed')
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
        listener = threading.Thread(
            target=listen_for_pokes,
            args=(websocket_url, websocket_token, environment, market_id, stop_event),
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
                    handle_sse_response(resp, token_audit_available())
                else:
                    handle_json_response(resp, token_audit_available())

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
        stop_event.set()
        if token_audit_runtime is not None:
            token_audit_runtime.close()


if __name__ == "__main__":
    main()
