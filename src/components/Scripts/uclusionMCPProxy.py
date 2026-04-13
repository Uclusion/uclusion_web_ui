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


def post_to_mcp(url, headers, body):
    """
    POST a JSON-RPC message to the streamable HTTP MCP endpoint.
    Returns the response, handling both application/json and text/event-stream.
    """
    req = urllib.request.Request(
        url, data=body.encode('utf-8'),
        headers=headers, method='POST'
    )
    resp = urllib.request.urlopen(req)
    return resp


def handle_json_response(resp):
    if resp.status == 200 or resp.status == 201:
        """Write a plain JSON response back to stdout for Cursor."""
        data = resp.read().decode('utf-8')
        if data.strip():
            sys.stdout.write(data)
            if not data.endswith('\n'):
                sys.stdout.write('\n')
            sys.stdout.flush()


def handle_sse_response(resp):
    """Parse an SSE stream and write each JSON-RPC message to stdout for Cursor."""
    for raw_line in resp:
        line = raw_line.decode('utf-8').rstrip('\r\n')
        if line.startswith('data: '):
            payload = line[6:]
            if payload.strip():
                sys.stdout.write(payload)
                if not payload.endswith('\n'):
                    sys.stdout.write('\n')
                sys.stdout.flush()


def main():
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

        for line in sys.stdin:
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
            if is_notification:
                continue

            try:
                resp = post_to_mcp(post_url, headers, line)

                sid = resp.headers.get('Mcp-Session-Id')
                if sid:
                    session_id = sid

                content_type = resp.headers.get('Content-Type', '')
                if 'text/event-stream' in content_type:
                    handle_sse_response(resp)
                else:
                    handle_json_response(resp)

            except urllib.request.HTTPError as e:
                body = e.read().decode('utf-8', errors='replace')
                sys.stderr.write(f"HTTP {e.code} from MCP server: {body}\n")
            except Exception as e:
                sys.stderr.write(f"Error posting to MCP server: {e}\n")

    except Exception as e:
        sys.stderr.write(f"Proxy setup failed: {e}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()