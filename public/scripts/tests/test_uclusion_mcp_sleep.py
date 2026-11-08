import io
import json
import sys
import unittest
from pathlib import Path
from unittest import mock


SCRIPT_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import uclusionMCPProxy as proxy


REQUEST = {'jsonrpc': '2.0', 'id': 7, 'method': 'tools/call', 'params': {
    'name': 'set_job_audit_phase', 'arguments': {
        'job_id': 'J-all-513', 'audit_run_id': 'run-1',
        'marker_sequence': 22, 'bucket': 'implementation',
    },
}}
# The system was already asleep for 500 seconds before the request; only the
# additional 372 seconds during this request should affect its diagnosis.
SLEEP_SAMPLES = [100, 600, 100, 130, 1002, 130]


class McpSleepTests(unittest.TestCase):
    def exchange(self, post, samples):
        incoming = io.StringIO(json.dumps(REQUEST) + '\n')
        outgoing = io.StringIO()
        arguments = proxy.parse_args(['workspace-1', 'stage', '--token-audit'])
        with mock.patch.object(proxy.sys, 'stdin'), mock.patch.object(proxy.sys, 'stdout'), \
                mock.patch.object(proxy.os, 'fdopen', side_effect=[incoming, outgoing]), \
                mock.patch.object(proxy, 'parse_args', return_value=arguments), \
                mock.patch.object(proxy, 'prune_token_audit_storage'), \
                mock.patch.object(proxy, 'prune_inbox'), \
                mock.patch.object(proxy, 'get_credentials', return_value={}), \
                mock.patch.object(proxy, 'login', return_value={'uclusion_token': 'test-token'}), \
                mock.patch.object(proxy.threading, 'Thread'), \
                mock.patch.object(proxy, 'record_demo_input'), \
                mock.patch.object(proxy.sys, 'platform', 'linux'), \
                mock.patch.object(proxy.time, 'CLOCK_MONOTONIC', 1, create=True), \
                mock.patch.object(proxy.time, 'CLOCK_BOOTTIME', 7, create=True), \
                mock.patch.object(proxy.time, 'clock_gettime', side_effect=samples, create=True), \
                mock.patch.object(proxy, 'post_to_mcp_refreshing_token', post):
            proxy.main()
        return [json.loads(line) for line in outgoing.getvalue().splitlines()]

    def test_sleep_interrupted_read_preserves_error_and_request_without_replay(self):
        response = mock.Mock()
        response.headers = {'Content-Type': 'application/json'}
        response.read.side_effect = TimeoutError('The read operation timed out')
        post = mock.Mock(return_value=(response, None))
        replies = self.exchange(post, SLEEP_SAMPLES)
        self.assertEqual(1, len(replies))
        reply = replies[0]
        self.assertEqual(7, reply['id'])
        self.assertEqual(-32001, reply['error']['code'])
        self.assertIn('local system sleep', reply['error']['message'])
        self.assertIn('after wake', reply['error']['message'])
        self.assertIn('may already have completed', reply['error']['message'])
        self.assertEqual('system_sleep', reply['error']['data']['local_interruption'])
        self.assertEqual('unconfirmed', reply['error']['data']['outcome'])
        self.assertEqual(372, reply['error']['data']['suspended_seconds'])
        self.assertEqual('The read operation timed out', reply['error']['data']['error'])
        post.assert_called_once()
        self.assertEqual(REQUEST, json.loads(post.call_args.args[2]))

    def test_ordinary_timeout_and_clock_sampling_delays_do_not_claim_sleep(self):
        for samples in (
            [100, 600, 100, 130, 630, 130],
            [100, 600, 100, 130, 650, 180],
        ):
            with self.subTest(samples=samples):
                post = mock.Mock(side_effect=TimeoutError('read timed out'))
                replies = self.exchange(post, samples)
                self.assertEqual('Error posting to MCP server', replies[0]['error']['message'])
                self.assertEqual({'error': 'read timed out'}, replies[0]['error']['data'])
                post.assert_called_once()

    def test_sse_terminal_reply_does_not_wait_for_a_later_timeout(self):
        progress = {'jsonrpc': '2.0', 'method': 'notifications/progress', 'params': {}}
        other_reply = {'jsonrpc': '2.0', 'id': 8, 'result': {}}
        for terminal in (
            {'jsonrpc': '2.0', 'id': 7, 'result': {'isError': False}},
            {'jsonrpc': '2.0', 'id': 7, 'error': {'code': -32602, 'message': 'Invalid parameters'}},
        ):
            with self.subTest(terminal=terminal):
                def frames():
                    for payload in (progress, other_reply, terminal):
                        yield ('data: ' + json.dumps(payload) + '\n').encode()
                    raise TimeoutError('The read operation timed out')

                response = mock.MagicMock()
                response.headers = {'Content-Type': 'text/event-stream'}
                response.__iter__.side_effect = frames
                response.close.side_effect = OSError('close failed')
                post = mock.Mock(return_value=(response, None))
                replies = self.exchange(post, SLEEP_SAMPLES)
                self.assertEqual([progress, other_reply, terminal], replies)
                response.close.assert_called_once()
                post.assert_called_once()


if __name__ == '__main__':
    unittest.main()
