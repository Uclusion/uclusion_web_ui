import os
import sys
import json
import urllib.request


CREDENTIALS_FILE = 'credentials'
DEV_CREDENTIALS_FILE = 'dev_credentials'
STAGE_CREDENTIALS_FILE = 'stage_credentials'
DEV_API_URL = "dev.api.uclusion.com/v1"
STAGE_API_URL = "stage.api.uclusion.com/v1"
PRODUCTION_API_URL = "production.api.uclusion.com/v1"


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
    elif url_env == 'stage':
        api_url = STAGE_API_URL
        credentials_path = STAGE_CREDENTIALS_FILE
    else:
        api_url = PRODUCTION_API_URL
        credentials_path = CREDENTIALS_FILE

    try:
        credentials = get_credentials(credentials_path)
        if credentials is None:
            sys.exit(1)
        credentials['workspace_id'] = market_id

        token = login(api_url, credentials)['uclusion_token']

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


if __name__ == "__main__":
    main()