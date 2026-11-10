import io
import json
import os
import sys
import unittest
import uuid
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest import mock


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import uclusionCLI as cli


WORKSPACE = 'dd56682c-0000-4000-8000-000000000000'


class SubscribeCLITests(unittest.TestCase):
    def setUp(self):
        environment = mock.patch.dict(os.environ, {}, clear=False)
        environment.start()
        self.addCleanup(environment.stop)
        for name in (cli.CONSUMER_ENV_VAR, cli.CLAUDE_SESSION_ENV_VAR):
            os.environ.pop(name, None)
        self.credentials = {'api_url': 'stage.example.com', 'api_token': 'test-token',
                            'workspace_id': WORKSPACE}

    def receipt(self, agent_id, subscribed=True):
        work = {'kind': 'job', 'id': 'job-info-id', 'short_code_id': 'J-example-1'}
        payload = {'work': work, 'agent_id': agent_id, 'subscribed': subscribed}
        return {'content': [{'type': 'text', 'text': json.dumps(payload)}],
                'structuredContent': payload, 'isError': False}

    def invoke(self, argv, result=None, error=None):
        def call(credentials, tool_name, arguments, meta=None):
            if error is not None:
                raise error
            return result if result is not None else self.receipt(meta['uclusionAgentId'])

        stdout, stderr = io.StringIO(), io.StringIO()
        with mock.patch.object(cli, 'initialize', return_value=(self.credentials, {}, {})), \
                mock.patch.object(cli, 'call_mcp_tool', side_effect=call) as call_tool, \
                redirect_stdout(stdout), redirect_stderr(stderr):
            args = cli.build_parser().parse_args(argv)
            status = args.func(args)
        return status, call_tool, stdout.getvalue(), stderr.getvalue()

    def test_consumer_resolution_matches_wait_and_listen_order(self):
        cases = [
            ({cli.CONSUMER_ENV_VAR: 'human-knob', cli.CLAUDE_SESSION_ENV_VAR: 'abc'},
             ['--consumer', 'explicit'], 'explicit'),
            ({cli.CONSUMER_ENV_VAR: 'human-knob', cli.CLAUDE_SESSION_ENV_VAR: 'abc'}, [], 'human-knob'),
            ({cli.CLAUDE_SESSION_ENV_VAR: 'abc'}, [], 'session-claude-abc'),
            ({}, [], cli.DEFAULT_CONSUMER),
        ]
        for variables, extra, consumer in cases:
            with self.subTest(consumer=consumer), mock.patch.dict(os.environ, variables):
                status, call_tool, stdout, _ = self.invoke(['-e', 'stage', 'subscribe', 'J-example-1'] + extra)
                self.assertEqual(0, status)
                # The same name wait uses, so the subscriber is the session that receives the Pokes.
                if not extra:
                    self.assertEqual(consumer, cli.resolve_consumer(None, is_listener=False))
                expected = cli.consumer_agent_id('stage', WORKSPACE, consumer)
                call_tool.assert_called_once_with(
                    self.credentials, 'set_agent_subscription',
                    {'short_code_id': 'J-example-1', 'action': 'subscribe'},
                    meta={'uclusionAgentId': expected})
                self.assertEqual(consumer, json.loads(stdout)['consumer'])

    def test_agent_id_is_a_stable_name_based_uuid_per_environment_workspace_and_consumer(self):
        agent_id = cli.consumer_agent_id('stage', WORKSPACE, 'session-claude-abc')
        # Pinned: a different value would orphan every existing consumer subscription.
        self.assertEqual('dc37e542-4b19-5641-9b76-a0999e240478', agent_id)
        self.assertEqual(5, uuid.UUID(agent_id).version)
        self.assertEqual(agent_id, str(uuid.UUID(agent_id)), 'The backend accepts only canonical UUIDs')
        self.assertEqual(agent_id, cli.consumer_agent_id('stage', WORKSPACE, 'session-claude-abc'))
        others = {cli.consumer_agent_id('production', WORKSPACE, 'session-claude-abc'),
                  cli.consumer_agent_id('stage', 'other-workspace', 'session-claude-abc'),
                  cli.consumer_agent_id('stage', WORKSPACE, 'session-claude-def')}
        self.assertEqual(3, len(others))
        self.assertNotIn(agent_id, others)

    def test_receipt_is_printed_with_its_consumer_and_success_exits_zero(self):
        status, _, stdout, stderr = self.invoke(['-e', 'stage', 'subscribe', 'Q-example-1_O-2',
                                                 '--consumer', 'cursor-chat'])
        self.assertEqual(0, status)
        self.assertEqual('', stderr)
        printed = json.loads(stdout)
        self.assertEqual({'consumer': 'cursor-chat', 'subscribed': True,
                          'agent_id': cli.consumer_agent_id('stage', WORKSPACE, 'cursor-chat'),
                          'work': {'kind': 'job', 'id': 'job-info-id', 'short_code_id': 'J-example-1'}},
                         printed)

    def test_failures_exit_nonzero_and_leave_the_adoption_retryable(self):
        refused = {'content': [{'type': 'text', 'text': 'Target is neither a job nor a standalone bug'}],
                   'isError': True}
        other = cli.consumer_agent_id('stage', WORKSPACE, 'someone-else')
        cases = [
            ('refused', {'result': refused}, 'neither a job'),
            ('transport', {'error': cli.MCPCallError('HTTP 502 Bad Gateway')}, 'HTTP 502'),
            ('no receipt', {'result': {'content': [], 'isError': False}}, 'no receipt'),
            ('not subscribed', {'result': self.receipt(cli.consumer_agent_id('stage', WORKSPACE, 'default'),
                                                       subscribed=False)}, 'not confirmed'),
            ('other agent', {'result': self.receipt(other)}, 'not confirmed'),
        ]
        for name, outcome, message in cases:
            with self.subTest(name=name):
                status, _, _, stderr = self.invoke(['-e', 'stage', 'subscribe', 'J-example-1'], **outcome)
                self.assertEqual(1, status)
                self.assertIn(message, stderr)

    def test_setup_failure_exits_nonzero_without_a_request(self):
        with mock.patch.object(cli, 'initialize', return_value=None), \
                mock.patch.object(cli, 'call_mcp_tool') as call_tool, \
                redirect_stdout(io.StringIO()) as stdout, redirect_stderr(io.StringIO()):
            args = cli.build_parser().parse_args(['subscribe', 'J-example-1'])
            self.assertEqual(1, args.func(args))
        call_tool.assert_not_called()
        self.assertEqual('', stdout.getvalue())


class CallMcpToolMetaTests(unittest.TestCase):
    def test_meta_travels_in_the_json_rpc_params(self):
        sent = []

        class Response:
            status = 200
            headers = {'Content-Type': 'application/json'}

            def __enter__(self):
                return self

            def __exit__(self, *exc):
                return False

            def read(self):
                request = json.loads(sent[-1].data)
                return json.dumps({'jsonrpc': '2.0', 'id': request['id'],
                                   'result': {'content': [], 'isError': False}}).encode()

        def urlopen(request):
            sent.append(request)
            return Response()

        credentials = {'api_url': 'stage.example.com', 'api_token': 'test-token'}
        with mock.patch.object(cli.urllib.request, 'urlopen', side_effect=urlopen):
            cli.call_mcp_tool(credentials, 'set_agent_subscription', {'short_code_id': 'J-example-1'},
                              meta={'uclusionAgentId': 'agent'})
            cli.call_mcp_tool(credentials, 'get_job', {'short_code_id': 'J-example-1'})
        with_meta, without_meta = (json.loads(request.data)['params'] for request in sent)
        self.assertEqual({'uclusionAgentId': 'agent'}, with_meta['_meta'])
        self.assertNotIn('_meta', without_meta, 'Other tools keep their exact request shape')


if __name__ == '__main__':
    unittest.main()
