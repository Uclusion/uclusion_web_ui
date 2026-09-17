import io
import json
import sys
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import uclusionMCPProxy as proxy


JSONRPC_RESULT = {
    'jsonrpc': '2.0',
    'id': 7,
    'result': {'tools': [{'name': 'get_job'}]},
}


class _BodyResponse:
    def __init__(self, body):
        self._body = body.encode('utf-8')

    def read(self):
        return self._body


class _LineResponse:
    def __init__(self, lines):
        self._lines = [line.encode('utf-8') for line in lines]

    def __iter__(self):
        return iter(self._lines)


class McpProxyStdioTests(unittest.TestCase):
    def test_write_message_drops_a_root_json_string(self):
        stdout = io.StringIO()
        stderr = io.StringIO()
        with redirect_stdout(stdout), redirect_stderr(stderr):
            proxy.write_message('not-an-object')
        self.assertEqual('', stdout.getvalue())
        self.assertIn('str is not a JSON-RPC object', stderr.getvalue())

    def test_json_object_response_is_forwarded(self):
        stdout = io.StringIO()
        with redirect_stdout(stdout), redirect_stderr(io.StringIO()):
            proxy.handle_json_response(
                _BodyResponse(json.dumps(JSONRPC_RESULT)),
                request_id=7,
            )
        self.assertEqual(
            JSONRPC_RESULT,
            json.loads(stdout.getvalue()),
        )

    def test_double_encoded_json_string_does_not_reach_stdout(self):
        stdout = io.StringIO()
        stderr = io.StringIO()
        with redirect_stdout(stdout), redirect_stderr(stderr):
            proxy.handle_json_response(
                _BodyResponse(json.dumps(json.dumps(JSONRPC_RESULT))),
                request_id=7,
            )
        messages = [
            json.loads(line)
            for line in stdout.getvalue().splitlines()
            if line.strip()
        ]
        self.assertEqual(1, len(messages))
        self.assertIsInstance(messages[0], dict)
        self.assertEqual(
            'MCP server returned a non-object JSON payload',
            messages[0]['error']['message'],
        )
        self.assertIn('payload is str, not a JSON object', stderr.getvalue())

    def test_sse_skips_done_and_string_frames_then_forwards_object(self):
        stdout = io.StringIO()
        stderr = io.StringIO()
        with redirect_stdout(stdout), redirect_stderr(stderr):
            proxy.handle_sse_response(
                _LineResponse([
                    'event: message\n',
                    'data: "[DONE]"\n',
                    'data: [DONE]\n',
                    'data: ' + json.dumps(JSONRPC_RESULT) + '\n',
                    'data: [DONE]\n',
                ]),
                request_id=7,
            )
        self.assertEqual(
            JSONRPC_RESULT,
            json.loads(stdout.getvalue()),
        )
        self.assertIn('payload is str, not a JSON object', stderr.getvalue())

    def test_sse_string_only_stream_returns_jsonrpc_error(self):
        stdout = io.StringIO()
        with redirect_stdout(stdout), redirect_stderr(io.StringIO()):
            proxy.handle_sse_response(
                _LineResponse([
                    'data: "not-an-object"\n',
                    'data: [DONE]\n',
                ]),
                request_id=7,
            )
        message = json.loads(stdout.getvalue())
        self.assertEqual(-32001, message['error']['code'])
        self.assertEqual(7, message['id'])


if __name__ == '__main__':
    unittest.main()
