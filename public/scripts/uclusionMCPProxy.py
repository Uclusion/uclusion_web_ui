import base64
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


def get_inbox_path():
    return os.path.join(os.path.expanduser('~'), '.uclusion', INBOX_FILE)


def open_inbox():
    """Open the cross-client Poke AI inbox with user-only permissions."""
    inbox_path = get_inbox_path()
    os.makedirs(os.path.dirname(inbox_path), mode=0o700, exist_ok=True)
    connection = sqlite3.connect(inbox_path, timeout=5)
    connection.execute('PRAGMA busy_timeout = 5000')
    connection.execute(
        '''
        CREATE TABLE IF NOT EXISTS poke_messages (
            message_id TEXT NOT NULL,
            environment TEXT NOT NULL,
            workspace_id TEXT NOT NULL,
            message TEXT NOT NULL,
            received_at REAL NOT NULL,
            consumed_at REAL,
            PRIMARY KEY (environment, workspace_id, message_id)
        )
        '''
    )
    connection.execute(
        '''
        CREATE INDEX IF NOT EXISTS poke_messages_pending
        ON poke_messages(environment, workspace_id, consumed_at, received_at)
        '''
    )
    connection.commit()
    try:
        os.chmod(inbox_path, 0o600)
    except OSError:
        # The database is still created inside the user's private Uclusion
        # directory on platforms that do not support POSIX file modes.
        pass
    return connection


def reset_inbox(environment, workspace_id):
    """Discard stale pending prompts while retaining retry de-duplication."""
    with closing(open_inbox()) as connection, connection:
        connection.execute(
            '''
            DELETE FROM poke_messages
            WHERE environment = ? AND workspace_id = ? AND consumed_at IS NULL
            ''',
            (environment, workspace_id)
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
            'DELETE FROM poke_messages WHERE consumed_at IS NOT NULL AND consumed_at < ?',
            (now - 604800,)
        )
        cursor = connection.execute(
            '''
            INSERT OR IGNORE INTO poke_messages
                (message_id, environment, workspace_id, message, received_at, consumed_at)
            VALUES (?, ?, ?, ?, ?, NULL)
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
            websocket.connect()
            websocket.send_text(json.dumps({
                'action': 'subscribe',
                'identity': token,
                'is_ai': True
            }, separators=(',', ':')))
            retry_delay = 1
            while not stop_event.is_set():
                try:
                    raw_message = websocket.receive_text()
                except socket.timeout:
                    websocket.send_frame(0x9)
                    continue
                payload = json.loads(raw_message)
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


def handle_json_response(resp):
    data = resp.read().decode('utf-8')
    if data.strip():
        write_message(json.loads(data))


def handle_sse_response(resp):
    for raw_line in resp:
        line = raw_line.decode('utf-8').rstrip('\r\n')
        if line.startswith('data: '):
            payload = line[6:]
            if payload.strip():
                write_message(json.loads(payload))


def main():
    sys.stdin = os.fdopen(sys.stdin.fileno(), 'r', buffering=1, closefd=False)
    sys.stdout = os.fdopen(sys.stdout.fileno(), 'w', buffering=1, closefd=False)

    market_id = sys.argv[1]
    url_env = sys.argv[2] if len(sys.argv) > 2 else None
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
    try:
        credentials = get_credentials(credentials_path)
        if credentials is None:
            sys.exit(1)
        credentials['workspace_id'] = market_id

        token = login(api_url, credentials)['uclusion_token']
        reset_inbox(environment, market_id)
        listener = threading.Thread(
            target=listen_for_pokes,
            args=(websocket_url, token, environment, market_id, stop_event),
            name='uclusion-poke-ai',
            daemon=True
        )
        listener.start()

        post_url = 'https://investibles.' + api_url + '/mcp'
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

            try:
                resp = post_to_mcp(post_url, headers, line)

                sid = resp.headers.get('Mcp-Session-Id')
                if sid:
                    session_id = sid

                if is_notification:
                    resp.read()
                    continue

                content_type = resp.headers.get('Content-Type', '')
                if 'text/event-stream' in content_type:
                    handle_sse_response(resp)
                else:
                    handle_json_response(resp)

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


if __name__ == "__main__":
    main()
