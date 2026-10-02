"""Evaluator disclosure records the client boundary, not a recreated catalog."""
import importlib.util
import io
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))
import uclusionMCPProxy as proxy
import uclusionCLI as cli

spec = importlib.util.spec_from_file_location('evidence_install', SCRIPTS / 'uclusionInstall.py')
install = importlib.util.module_from_spec(spec)
spec.loader.exec_module(install)


class EvidenceTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.evidence = self.root / 'evidence'
        self.evidence.mkdir()
        env = mock.patch.dict(os.environ, {proxy.DEMO_EVIDENCE_ENV: str(self.evidence)})
        env.start()
        self.addCleanup(env.stop)

    def events(self):
        return [json.loads(line) for path in self.evidence.glob('events-*.jsonl')
                for line in path.read_text().splitlines()]

    def test_json_and_sse_capture_final_definitions_and_errors_exactly(self):
        definition = {'name': 'get_job', 'description': 'Read café context',
                      'inputSchema': {'type': 'object', 'properties': {'id': {'type': 'string'}}}}
        payload = {'jsonrpc': '2.0', 'id': 1, 'result': {
            'tools': [definition, {'name': 'start_job_audit'}]}}
        output = io.StringIO()
        with mock.patch.object(proxy.sys, 'stdout', output):
            proxy.handle_json_response(io.BytesIO(json.dumps(payload).encode()), work_claims_enabled=True)
            proxy.handle_sse_response(io.BytesIO(('data: ' + json.dumps(payload) + '\n').encode()))
            proxy.write_jsonrpc_error(4, -32001, 'Local error')
        rows = self.events()
        self.assertEqual(output.getvalue(), ''.join(row['payload'] for row in rows))
        definitions = json.loads(rows[0]['payload'])['result']['tools']
        self.assertEqual([definition, proxy.WORK_CLAIM_TOOL], definitions)
        self.assertEqual([definition], json.loads(rows[1]['payload'])['result']['tools'])
        self.assertEqual(-32001, json.loads(rows[2]['payload'])['error']['code'])

    def test_main_captures_requests_without_http_credentials(self):
        incoming = json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': 'tools/list'}) + '\n'
        stdin, stdout = io.StringIO(incoming), io.StringIO()
        # main reopens only stdin/stdout; keep this unit test entirely local.
        stdin.fileno = lambda: 0
        stdout.fileno = lambda: 1
        args = proxy.parse_args(['workspace', 'stage'])
        real_fdopen = os.fdopen
        response = mock.Mock(headers={'Content-Type': 'application/json'})
        response.read.return_value = b'{"jsonrpc":"2.0","id":1,"result":{"tools":[]}}'
        with (mock.patch.object(proxy.sys, 'stdin', stdin),
              mock.patch.object(proxy.sys, 'stdout', stdout),
              mock.patch.object(proxy.os, 'fdopen', side_effect=lambda fd, *a, **k:
                                stdin if fd == 0 else stdout if fd == 1 else real_fdopen(fd, *a, **k)),
              mock.patch.object(proxy, 'parse_args', return_value=args),
              mock.patch.object(proxy, 'get_credentials', return_value={}),
              mock.patch.object(proxy, 'login', return_value={'uclusion_token': 'DO-NOT-RECORD'}),
              mock.patch.object(proxy, 'prune_token_audit_storage'),
              mock.patch.object(proxy, 'prune_inbox'),
              mock.patch.object(proxy.threading, 'Thread'),
              mock.patch.object(proxy, 'post_to_mcp_refreshing_token', return_value=(response, None))):
            proxy.main()
        rows = self.events()
        self.assertEqual(['mcp_session_start', 'mcp_request', 'mcp_response'],
                         [row['kind'] for row in rows])
        self.assertEqual(incoming.strip(), rows[1]['payload'])
        self.assertEqual(stdout.getvalue(), rows[2]['payload'])
        self.assertNotIn('DO-NOT-RECORD', json.dumps(rows))

    def test_disabled_capture_writes_nothing(self):
        with mock.patch.dict(os.environ, {proxy.DEMO_EVIDENCE_ENV: ''}):
            proxy.record_demo_input('mcp_request', 'private')
        self.assertEqual([], list(self.evidence.iterdir()))

    def test_capture_failure_is_visible_and_does_not_break_transport(self):
        (self.evidence / 'manifest.json').write_text('{"gaps":[]}')
        stdout, stderr = io.StringIO(), io.StringIO()
        with (mock.patch.object(proxy.os, 'open', side_effect=OSError('full')),
              mock.patch.object(proxy.sys, 'stdout', stdout),
              mock.patch.object(proxy.sys, 'stderr', stderr)):
            proxy.write_message({'id': 1, 'result': {}})
        self.assertEqual({'id': 1, 'result': {}}, json.loads(stdout.getvalue()))
        self.assertIn('incomplete', stderr.getvalue())
        self.assertTrue((self.evidence / 'capture-failed').exists())
        self.assertIn('INCOMPLETE', proxy.demo_evidence_summary(str(self.root)))

    def test_snapshot_preserves_inputs_and_names_missing_sources(self):
        bootstrap = self.root / 'bootstrap.md'
        bootstrap.write_text('Bootstrap original')
        (self.root / 'evaluator-input.md').write_text('Start J-Demo-1')
        with (mock.patch.object(install, 'demo_bootstrap_path', return_value=str(bootstrap)),
              mock.patch.object(install, 'uclusion_home_root', return_value=str(self.root)),
              mock.patch.object(install, 'demo_plugin_path', return_value=str(self.root / 'plugin'))):
            install.snapshot_demo_evidence(str(self.root), 'claude')
        bootstrap.write_text('Changed later')
        self.assertEqual('Bootstrap original', (self.evidence / 'inputs/bootstrap.md').read_text())
        manifest = json.loads((self.evidence / 'manifest.json').read_text())
        self.assertTrue(any('skills/' in gap for gap in manifest['gaps']))
        self.assertTrue((self.evidence / 'source/uclusionMCPProxy.py').is_file())
        self.assertIn('INCOMPLETE', proxy.demo_evidence_summary(str(self.root)))

    def test_result_discovers_evidence_and_preserves_report(self):
        report = b'  Report\r\n\n'
        (self.root / 'evaluation.md').write_bytes(report)
        (self.evidence / 'manifest.json').write_text('{"gaps":[]}')
        proxy.record_demo_input('mcp_response', '{"jsonrpc":"2.0","id":1,"result":{}}\n')
        stdout = io.TextIOWrapper(io.BytesIO(), encoding='utf-8')
        with (mock.patch.object(cli, 'get_credentials', return_value={}),
              mock.patch.object(cli, 'is_demo_credential', return_value=True),
              mock.patch.object(cli, 'demo_current_run_dir', return_value=str(self.root)),
              mock.patch.object(cli.sys, 'stdout', stdout)):
            args = cli.build_parser().parse_args(['demo', '--result'])
            self.assertEqual(0, cli.cmd_demo_result(args))
        stdout.flush()
        output = stdout.buffer.getvalue()
        self.assertIn(str(self.evidence / 'README.md').encode(), output)
        self.assertTrue(output.endswith(report))
        (self.evidence / 'broken.jsonl').write_text('unused')
        (self.evidence / 'events-broken.jsonl').write_text('{')
        self.assertIn('INCOMPLETE', proxy.demo_evidence_summary(str(self.root)))

    def test_codex_proxy_override_explicitly_passes_evidence(self):
        arguments = cli.build_codex_mcp_overrides('workspace', 'stage', '/proxy.py')
        self.assertIn('--demo-evidence', ' '.join(arguments))
        self.assertIn(str(self.evidence), ' '.join(arguments))

    def test_partial_and_malformed_protocol_records_are_incomplete(self):
        (self.evidence / 'manifest.json').write_text('{"gaps":[]}')
        proxy.record_demo_input('mcp_session_start', {})
        proxy.record_demo_input('mcp_request', '{"jsonrpc":"2.0","id":1,"method":"tools/list"}')
        proxy.record_demo_input('mcp_response', '{"jsonrpc":"2.0","id":1,"result":{"tools":[]}}')
        proxy.record_demo_input('mcp_request', '{"jsonrpc":"2.0","method":"notifications/initialized"}')
        self.assertNotIn('INCOMPLETE', proxy.demo_evidence_summary(str(self.root)))
        proxy.record_demo_input('mcp_request', '{"jsonrpc":"2.0","id":2,"method":"tools/call"}')
        self.assertIn('requests without recorded responses', proxy.demo_evidence_summary(str(self.root)))
        proxy.record_demo_input('mcp_response', '{"jsonrpc":"2.0","id":2,"error":{"code":-1}}')
        self.assertNotIn('INCOMPLETE', proxy.demo_evidence_summary(str(self.root)))
        for payload in ('{}', 'null', 'bad JSON', None):
            with self.subTest(payload=payload):
                bad = self.evidence / 'events-malformed.jsonl'
                bad.write_text(json.dumps({'kind': 'mcp_response', 'payload': payload}) + '\n')
                self.assertIn('INCOMPLETE', proxy.demo_evidence_summary(str(self.root)))

    def test_detached_snapshot_includes_installed_sources_and_workflows(self):
        scripts = self.root / '.local/bin'
        scripts.mkdir(parents=True)
        for source, _installed, link in install.SCRIPT_FILES:
            (scripts / link).symlink_to(SCRIPTS / source)
        bootstrap = self.root / 'bootstrap.md'
        bootstrap.write_text('Exact bootstrap')
        brief = self.root / 'demo-brief.md'
        brief.write_text('Exact brief')
        owner_role = self.root / 'owner-instructions.md'
        owner_role.write_text('Exact owner instructions')
        (self.root / 'evaluator-input.md').write_text('Exact prompt')
        (self.root / 'owner-input.md').write_text('Exact owner prompt')
        for client in ('claude', 'codex'):
            skill_root = (self.root / 'plugin/skills' if client == 'claude'
                          else self.root / '.agents/skills')
            skill_root.mkdir(parents=True)
            for package in ('uclusion', install.DESIGN_SKILL_NAME):
                (skill_root / package).symlink_to(SCRIPTS / 'skills' / package)
            with (mock.patch.object(install, '__file__', str(scripts / 'uclusionDemoSupervisor.py')),
                  mock.patch.object(install, 'demo_bootstrap_path', return_value=str(bootstrap)),
                  mock.patch.object(install, 'demo_brief_path', return_value=str(brief)),
                  mock.patch.object(install, 'demo_codex_owner_instructions_path',
                                    return_value=str(owner_role)),
                  mock.patch.object(install, 'uclusion_home_root', return_value=str(self.root)),
                  mock.patch.object(install, 'demo_plugin_path', return_value=str(self.root / 'plugin'))):
                install.snapshot_demo_evidence(str(self.root), client)
            manifest = json.loads((self.evidence / 'manifest.json').read_text())
            self.assertEqual([], manifest['gaps'])
            self.assertEqual((SCRIPTS / 'uclusionCLI.py').read_bytes(),
                             (self.evidence / 'source/uclusionCLI.py').read_bytes())

    def test_owner_traffic_is_labeled_and_required_once_roles_are_recorded(self):
        (self.evidence / 'manifest.json').write_text('{"gaps":[]}')
        with mock.patch.dict(os.environ, {proxy.DEMO_EVIDENCE_ROLE_ENV: 'evaluator'}):
            proxy.record_demo_input(
                'mcp_response', '{"jsonrpc":"2.0","id":1,"result":{}}\n',
            )
        self.assertIn('no owner MCP responses recorded',
                      proxy.demo_evidence_summary(str(self.root)))
        with mock.patch.dict(os.environ, {proxy.DEMO_EVIDENCE_ROLE_ENV: 'owner'}):
            proxy.record_demo_input(
                'mcp_response', '{"jsonrpc":"2.0","id":2,"result":{}}\n',
            )
        self.assertNotIn('INCOMPLETE', proxy.demo_evidence_summary(str(self.root)))
        roles = {row['role'] for row in self.events()}
        self.assertEqual({'owner', 'evaluator'}, roles)

    def test_the_evidence_note_tells_the_reviewer_how_to_read_the_workspace(self):
        with (mock.patch.object(install, 'demo_bootstrap_path', return_value=str(self.root / 'missing')),
              mock.patch.object(install, 'uclusion_home_root', return_value=str(self.root)),
              mock.patch.object(install, 'demo_plugin_path', return_value=str(self.root / 'plugin'))):
            install.snapshot_demo_evidence(str(self.root), 'claude')
        note = (self.evidence / 'README.md').read_text()
        self.assertIn('export', note)
        self.assertIn('get_job', note)
        self.assertIn('"owner"', note)
        self.assertIn('does not retain the HTTP request', note)

    def test_each_client_s_disclosure_is_its_own_and_covers_the_owner(self):
        # S-Marketing-112: a Codex run's README spoke of Claude Code, called the
        # events evaluator-only, and the manifest left out the owner's inputs.
        (self.root / 'owner-input.md').write_text('Read the brief.')
        brief = self.root / 'demo-brief.md'
        brief.write_text('You are playing a human.')
        owner_role = self.root / 'owner-instructions.md'
        owner_role.write_text('You are the workshop owner.')
        for client, own, other, owner_log in (
                ('claude', 'Claude Code', 'Codex', 'owner.log'),
                ('codex', 'Codex', 'Claude', 'owner.jsonl')):
            with self.subTest(client=client), \
                    mock.patch.object(install, 'demo_bootstrap_path',
                                      return_value=str(self.root / 'missing')), \
                    mock.patch.object(install, 'demo_brief_path', return_value=str(brief)), \
                    mock.patch.object(install, 'demo_codex_owner_instructions_path',
                                      return_value=str(owner_role)), \
                    mock.patch.object(install, 'uclusion_home_root', return_value=str(self.root)), \
                    mock.patch.object(install, 'demo_plugin_path',
                                      return_value=str(self.root / 'plugin')):
                install.snapshot_demo_evidence(str(self.root), client)
                manifest = json.loads((self.evidence / 'manifest.json').read_text())
                hashed = {entry['path']: entry['sha256'] for entry in manifest['files']}
                for name in ('inputs/owner-input.md', 'inputs/demo-brief.md'):
                    self.assertRegex(hashed.get(name, ''), '^[0-9a-f]{64}$')
                # S-Marketing-114: only the Codex owner has its own instructions.
                self.assertEqual(client == 'codex', 'inputs/owner-instructions.md' in hashed)
                note = (self.evidence / 'README.md').read_text()
                self.assertIn(own, note)
                self.assertNotIn(other, note)
                self.assertNotIn('evaluator-only', note)
                self.assertIn(owner_log, note)
                sentences = [sentence.strip() for sentence in note.replace('\n', ' ').split('. ')
                             if sentence.strip()]
                self.assertEqual(len(sentences), len(set(sentences)))

    def test_claude_config_enables_disclosure_without_size_statistics(self):
        shared = self.root / 'mcp.json'
        evaluator = self.root / 'evaluator.json'
        config = {'mcpServers': {install.MCP_SERVER_KEY: {
            'command': 'python3', 'args': ['proxy.py', 'workspace', 'stage']}}}
        shared.write_text(json.dumps(config))
        with (mock.patch.object(install, 'demo_mcp_config_path', return_value=str(shared)),
              mock.patch.object(install, 'demo_evaluator_mcp_config_path', return_value=str(evaluator))):
            install.write_demo_evaluator_mcp_config(None, str(self.evidence))
        self.assertEqual(config, json.loads(shared.read_text()))
        self.assertEqual(
            ['proxy.py', 'workspace', 'stage', '--demo-evidence', str(self.evidence),
             '--demo-evidence-role', 'evaluator'],
            json.loads(evaluator.read_text())['mcpServers'][install.MCP_SERVER_KEY]['args'],
        )


if __name__ == '__main__':
    unittest.main()
