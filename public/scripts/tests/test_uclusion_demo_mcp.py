import importlib.util
import io
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
import tempfile
import threading
import unittest
from unittest import mock


def load_script(name):
    path = Path(__file__).resolve().parents[1] / (name + '.py')
    spec = importlib.util.spec_from_file_location(name + '_demo_test', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


DEMO = load_script('uclusionDemoMCP')
INSTALL = load_script('uclusionInstall')


class DemoClientTests(unittest.TestCase):
    def setUp(self):
        self.calls = []
        self.service = DEMO.DemoService('stage', self.request)
        self.pending = False
        self.mcp_response = None

    def request(self, url, payload=None):
        self.calls.append((url, payload))
        if url.endswith('/tools'):
            return 200, {'tools': [
                {'name': name, 'inputSchema': {'type': 'object'}}
                for name in sorted(DEMO.ALLOWED_TOOLS)
            ]}
        if url.endswith('/mcp'):
            if self.mcp_response is not None:
                return 200, self.mcp_response
            return 200, {
                'jsonrpc': '2.0', 'id': payload['request']['id'],
                'result': DEMO.tool_result({'record': 'Q-Demo-3', 'message': 'Actual refusal'}, True),
            }
        result = {
            'demo_id': self.service.demo_id,
            'state': 'PROVISIONING' if self.pending else 'READY',
            'scenario_version': '3',
            'workspace_id': 'root', 'view_id': 'root',
            'starting_job_short_codes': ['J-Demo-1', 'J-Demo-2'],
            'instructions': 'Read R-Demo-2 for the scenario view note, then call find_work.',
            'private_backend_field': 'must not appear',
        }
        return (202 if self.pending else 200), result

    def call(self, name='get_job'):
        return self.service.call({
            'jsonrpc': '2.0', 'id': 7, 'method': 'tools/call',
            'params': {'name': name, 'arguments': {'short_code_id': 'J-Demo-1'}},
        })

    def test_catalog_does_not_allocate_and_provisioning_reuses_same_proof(self):
        tools = self.service.tools()
        self.assertIn('start_demo', [tool['name'] for tool in tools])
        self.assertIsNone(self.service.demo_id)
        self.pending = True
        pending_result = self.service.start({})
        pending_payload = json.loads(pending_result['content'][0]['text'])
        self.assertNotIn('expires_at', pending_payload)
        self.assertNotIn('tools', pending_payload)
        first_id, first_proof = self.service.demo_id, self.service.verifier
        self.pending = False
        result = self.service.start({})
        payload = json.loads(result['content'][0]['text'])
        self.assertNotIn('expires_at', payload)
        self.assertEqual(payload['tools'], tools)
        self.assertEqual(self.service.demo_id, first_id)
        self.assertEqual(self.service.verifier, first_proof)
        self.assertNotIn(first_proof, json.dumps(result))
        self.assertNotIn('private_backend_field', json.dumps(result))
        allocations = [body for url, body in self.calls if url == self.service.sso_url]
        self.assertEqual(allocations[0], allocations[1])
        self.assertNotIn('verifier', allocations[0])

    def test_ready_catalog_failure_preserves_demo_for_retry(self):
        def unavailable_catalog(url, payload=None):
            if url.endswith('/tools'):
                return 503, {}
            return self.request(url, payload)

        self.service.requester = unavailable_catalog
        with self.assertRaisesRegex(DEMO.DemoError, 'catalog is unavailable'):
            self.service.start({})
        old_id, old_proof = self.service.demo_id, self.service.verifier
        self.assertFalse(self.service.ready)
        self.service.requester = self.request
        self.service.start({})
        self.assertTrue(self.service.ready)
        self.assertEqual(self.service.demo_id, old_id)
        self.assertEqual(self.service.verifier, old_proof)

    def test_calls_before_ready_or_outside_catalog_never_reach_gateway(self):
        with self.assertRaises(DEMO.DemoError):
            self.call()
        self.service.start({})
        before = len(self.calls)
        with self.assertRaises(DEMO.DemoError):
            self.call('get_upload')
        self.assertEqual(len(self.calls), before)

    def test_normal_business_refusal_and_original_request_are_preserved(self):
        self.service.start({})
        result = self.call()
        self.assertTrue(result['result']['isError'])
        self.assertIn('Actual refusal', result['result']['content'][0]['text'])
        url, envelope = self.calls[-1]
        self.assertEqual(url, self.service.api_url + '/' + self.service.demo_id + '/mcp')
        self.assertEqual(envelope['request']['params']['arguments'], {'short_code_id': 'J-Demo-1'})
        self.assertEqual(envelope['verifier'], self.service.verifier)

    def test_clock_changes_do_not_replace_or_block_ready_demo(self):
        with mock.patch('time.time', return_value=1000):
            self.service.start({})
        old_id, old_proof = self.service.demo_id, self.service.verifier
        with mock.patch('time.time', return_value=10 ** 12):
            self.call()
            self.service.start({})
        self.assertEqual(self.service.demo_id, old_id)
        self.assertEqual(self.service.verifier, old_proof)

    def test_new_process_allocates_fresh_demo_and_proof(self):
        self.service.start({})
        old_id, old_proof = self.service.demo_id, self.service.verifier
        self.service = DEMO.DemoService('stage', self.request)
        self.service.start({})
        self.assertNotEqual(self.service.demo_id, old_id)
        self.assertNotEqual(self.service.verifier, old_proof)

    def test_generic_refusals_keep_existing_demo_and_proof(self):
        self.service.start({})
        old_id, old_proof = self.service.demo_id, self.service.verifier
        for status, code in (
            (403, 'UNAVAILABLE'), (404, 'UNAVAILABLE'), (409, 'DEMO_ID_REUSED'),
            (410, 'UNAVAILABLE'), (500, 'FAILED'),
        ):
            for endpoint in ('allocation', 'status', 'mcp'):
                with self.subTest(status=status, endpoint=endpoint):
                    responses = [(status, {'error_code': code})]
                    if endpoint == 'status':
                        responses.insert(0, (200, {}))
                    self.service.requester = mock.Mock(side_effect=responses)
                    with self.assertRaises(DEMO.DemoError):
                        if endpoint == 'mcp':
                            self.call()
                        else:
                            self.service.start({})
                    self.assertEqual(self.service.demo_id, old_id)
                    self.assertEqual(self.service.verifier, old_proof)
                    self.assertTrue(self.service.ready)

    def test_explicit_deletion_requires_fresh_start(self):
        for endpoint in ('allocation', 'status', 'mcp', 'mutation'):
            with self.subTest(endpoint=endpoint):
                self.service.requester = self.request
                self.service.start({})
                old_id, old_proof = self.service.demo_id, self.service.verifier
                responses = [(410, {'error_code': 'DELETED'})]
                if endpoint == 'status':
                    responses.insert(0, (200, {}))
                self.service.requester = mock.Mock(side_effect=responses)
                with self.assertRaisesRegex(DEMO.DemoError, 'fresh demo'):
                    if endpoint == 'mutation':
                        self.call('add_info')
                    elif endpoint == 'mcp':
                        self.call()
                    else:
                        self.service.start({})
                self.assertEqual(self.service.requester.call_count, len(responses))
                self.assertIsNone(self.service.demo_id)
                self.assertFalse(self.service.ready)
                self.service.requester = self.request
                self.service.start({})
                self.assertNotEqual(self.service.demo_id, old_id)
                self.assertNotEqual(self.service.verifier, old_proof)

    def test_failed_allocation_requires_fresh_start(self):
        self.service.start({})
        old_id = self.service.demo_id
        self.service.requester = mock.Mock(side_effect=[
            (200, {}), (200, {'demo_id': old_id, 'state': 'FAILED'}),
        ])
        with self.assertRaisesRegex(DEMO.DemoError, 'creation failed'):
            self.service.start({})
        self.assertIsNone(self.service.demo_id)
        self.assertFalse(self.service.ready)
        self.service.requester = self.request
        self.service.start({})
        self.assertNotEqual(self.service.demo_id, old_id)

    def test_ambiguous_write_is_not_retried(self):
        self.service.start({})
        for name in ('add_info', 'make_suggestion'):
            with self.subTest(name=name):
                requester = mock.Mock(side_effect=DEMO.DemoError('The service did not respond.'))
                self.service.requester = requester
                with self.assertRaisesRegex(DEMO.DemoError, 'Inspect the demo records'):
                    self.call(name)
                requester.assert_called_once()

    def test_export_failure_is_reported_as_a_read_failure(self):
        self.service.start({})
        requester = mock.Mock(side_effect=DEMO.DemoError('The service did not respond.'))
        self.service.requester = requester
        with self.assertRaisesRegex(DEMO.DemoError, '^The service did not respond.$'):
            self.service.call({'jsonrpc': '2.0', 'id': 8, 'method': 'tools/call',
                               'params': {'name': 'export_demo', 'arguments': {}}})
        requester.assert_called_once()
        self.assertEqual(requester.call_args.args[1]['request']['params']['arguments'], {})

    def test_interrupted_http_write_response_reports_uncertainty(self):
        self.service.start({})
        self.service.requester = DEMO.request_json
        response = mock.MagicMock()
        response.__enter__.return_value = response
        response.read.side_effect = DEMO.http.client.IncompleteRead(b'partial')
        opener = mock.Mock()
        opener.open.return_value = response
        with mock.patch.object(DEMO.urllib.request, 'build_opener', return_value=opener):
            with self.assertRaisesRegex(DEMO.DemoError, 'Inspect the demo records'):
                self.call('add_info')
        opener.open.assert_called_once()

    def test_echoed_proof_and_mismatched_response_never_reach_agent(self):
        self.service.start({})
        for response in (
            {'jsonrpc': '2.0', 'id': 7, 'result': DEMO.tool_result(self.service.verifier)},
            {'jsonrpc': '2.0', 'id': 8, 'result': DEMO.tool_result('wrong request')},
        ):
            with self.subTest(response_id=response['id']):
                self.mcp_response = response
                output = io.StringIO()
                request = {'jsonrpc': '2.0', 'id': 7, 'method': 'tools/call', 'params': {'name': 'get_job'}}
                DEMO.serve(self.service, io.StringIO(json.dumps(request) + '\n'), output)
                self.assertNotIn(self.service.verifier, output.getvalue())
                self.assertTrue(json.loads(output.getvalue())['result']['isError'])

    def test_redirect_never_forwards_private_body(self):
        received = []

        class Handler(BaseHTTPRequestHandler):
            def do_POST(self):
                received.append((self.path, self.rfile.read(int(self.headers['Content-Length']))))
                self.send_response(307)
                self.send_header('Location', '/unexpected-recipient')
                self.end_headers()
                self.wfile.write(b'{}')

            def log_message(self, *_args):
                pass

        with HTTPServer(('127.0.0.1', 0), Handler) as server:
            worker = threading.Thread(target=server.serve_forever)
            worker.start()
            try:
                status, _ = DEMO.request_json(
                    f'http://127.0.0.1:{server.server_port}/proof', {'verifier': 'private'},
                )
            finally:
                server.shutdown()
                worker.join()
        self.assertEqual(status, 307)
        self.assertEqual([path for path, _ in received], ['/proof'])


class DemoRegistrationTests(unittest.TestCase):
    def test_demo_install_and_setup_conversion_preserve_other_config(self):
        for client in ('claude', 'cursor', 'codex'):
            for project_scope in (False, True):
                with self.subTest(client=client, project_scope=project_scope), tempfile.TemporaryDirectory() as directory:
                    root = Path(directory)
                    paths = {
                        'CLAUDE_JSON_PATH': str(root / 'claude.json'),
                        'CURSOR_MCP_PATH': str(root / 'cursor.json'),
                        'CODEX_CONFIG_PATH': str(root / 'codex.toml'),
                        'SCRIPT_INSTALL_PREFIX': str(root / 'releases'),
                    }
                    project = str(root / 'project') if project_scope else None
                    with mock.patch.multiple(INSTALL, **paths):
                        path, _, is_codex = INSTALL._setup_registration_target(client, project)
                        target = Path(path)
                        target.parent.mkdir(parents=True, exist_ok=True)
                        original = 'model = "chosen-model"\n' if is_codex else '{"humanSetting": "keep"}\n'
                        target.write_text(original)
                        expected = INSTALL.bootstrap_registration_expected('stage', client, project)
                        INSTALL._install_temporary_registration(INSTALL.demo_mcp_descriptor('stage'), client, project, expected)
                        expected = INSTALL.bootstrap_registration_expected('stage', client, project)
                        self.assertEqual(expected, INSTALL.demo_mcp_descriptor('stage'))
                        INSTALL.install_setup_registration('stage', client, project, expected=expected)
                        INSTALL.assert_setup_registration('stage', client, project)
                        self.assertIn('chosen-model' if is_codex else 'humanSetting', target.read_text())
                        before = target.read_bytes()
                        with self.assertRaises(RuntimeError):
                            INSTALL.bootstrap_registration_expected('stage', client, project)
                        self.assertEqual(target.read_bytes(), before)

    def test_changed_descriptor_between_preflight_and_write_is_preserved(self):
        with tempfile.TemporaryDirectory() as directory, mock.patch.multiple(
            INSTALL, CLAUDE_JSON_PATH=str(Path(directory) / 'claude.json'),
            SCRIPT_INSTALL_PREFIX=str(Path(directory) / 'releases'),
        ):
            expected = INSTALL.bootstrap_registration_expected('stage', 'claude', None)
            target = Path(INSTALL.CLAUDE_JSON_PATH)
            original = '{"mcpServers":{"Uclusion":{"command":"another-server","args":[]}}}'
            target.write_text(original)
            with self.assertRaises(RuntimeError):
                INSTALL._install_temporary_registration(INSTALL.demo_mcp_descriptor('stage'), 'claude', None, expected)
            self.assertEqual(target.read_text(), original)


if __name__ == '__main__':
    unittest.main()
