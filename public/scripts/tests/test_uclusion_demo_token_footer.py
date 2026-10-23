"""Saved-session regressions through the demo's actual footer/result entry points."""

import copy
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import re
import shutil
import sys
import tempfile
import unittest
from unittest import mock


SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))
import uclusionCLI as cli

spec = importlib.util.spec_from_file_location('footer_demo_install', SCRIPTS / 'uclusionInstall.py')
install = importlib.util.module_from_spec(spec)
spec.loader.exec_module(install)

STAMP = '2026-10-23T12:00:00Z'
STARTED = 1792756800.0
TOTALS = re.compile(r'of ([\d,]+) measured tokens .*?across ([\d,]+) model requests', re.S)


class FooterScenarios:
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.folder = Path(temporary.name)
        self.home = self.folder / 'demo-home'
        self.run = self.home / '.uclusion' / 'demo-runs' / 'run-one'
        self.run.mkdir(parents=True)
        (self.run.parent.parent / cli.DEMO_CURRENT_RUN_FILE).write_text(str(self.run))
        self.codex_home = self.folder / 'codex'
        self.claude_home = self.folder / 'claude'
        self.logs = (self.codex_home / 'sessions' if self.client == 'codex' else
                     self.claude_home / 'projects' / install.claude_project_name(str(self.home)))
        self.logs.mkdir(parents=True)
        self.root = 'evaluator-root'
        self.selection = install.new_demo_evaluator_selection(self.client, str(self.home), STARTED)
        self.publications = 0
        self.report = '  # Published evaluation\r\n\r\nCafé ✓\nNo final newline'.encode('utf-8')
        (self.run / 'evaluation.md').write_bytes(self.report)
        for patch in (
            mock.patch.object(install, 'CODEX_HOME', str(self.codex_home)),
            mock.patch.object(install, '_demo_claude_config_homes', return_value=[str(self.claude_home)]),
            mock.patch.object(cli, 'uclusion_home_root', return_value=str(self.home)),
            mock.patch.object(cli, 'get_credentials', return_value={'secret_key_id': cli.DEMO_CLIENT_ID_PREFIX + 'fixture'}),
        ):
            patch.start()
            self.addCleanup(patch.stop)
        evidence = os.environ.get('UCLUSION_DEMO_FOOTER_TEST_EVIDENCE')
        if evidence:
            destination = Path(evidence) / type(self).__name__ / self._testMethodName
            self.addCleanup(shutil.copytree, self.folder, destination, dirs_exist_ok=True)

    def path(self, identity, parent=None):
        if self.client == 'codex':
            return self.logs / ('rollout-' + identity + '.jsonl')
        if parent:
            return self.logs / self.root / 'subagents' / ('agent-' + identity + '.jsonl')
        return self.logs / (identity + '.jsonl')

    def opening(self, identity, parent=None, scope='helper'):
        prompt = (install.DEMO_EVALUATOR_PROMPT_MARK +
                  ('\n' + self.selection['prompt_marker'] if identity == self.root and not parent else ''))
        if self.client == 'codex':
            meta = {'id': identity, 'timestamp': STAMP, 'cwd': str(self.home)}
            if parent:
                meta.update(parent_thread_id=parent, accounting_scope=scope,
                            agent_path='/root/' + identity)
            return [{'type': 'session_meta', 'payload': meta},
                    {'type': 'response_item', 'timestamp': STAMP,
                     'payload': {'type': 'message', 'role': 'user', 'content': [
                         {'type': 'input_text', 'text': prompt if not parent else 'Helper assignment'}]}}]
        return [{'type': 'user', 'sessionId': self.root if parent else identity,
                 'agentId': identity if parent else None, 'isSidechain': bool(parent),
                 'cwd': str(self.home), 'timestamp': STAMP,
                 'message': {'role': 'user', 'content': prompt if not parent else 'Helper assignment'}}]

    def request(self, identity, response, total=120, usage=True):
        if self.client == 'codex':
            payload = {'thread_id': identity, 'turn_id': 'turn-' + response,
                       'response_id': response}
            if usage:
                counts = {'input_tokens': total - 20, 'cached_input_tokens': 0,
                          'output_tokens': 20, 'total_tokens': total}
                payload.update(usage=counts, thread_token_usage=counts)
            return {'type': 'token_usage_record', 'timestamp': '2026-10-23T12:00:10Z', 'payload': payload}
        message = {'role': 'assistant', 'id': response, 'content': [{'type': 'text', 'text': 'Complete.'}]}
        if usage:
            message['usage'] = {'input_tokens': total - 20, 'output_tokens': 20,
                                'cache_read_input_tokens': 0, 'cache_creation_input_tokens': 0}
        return {'type': 'assistant', 'sessionId': identity, 'requestId': response,
                'timestamp': '2026-10-23T12:00:10Z', 'message': message}

    def spawn(self, identity):
        if self.client == 'codex':
            return [{'type': 'response_item', 'timestamp': STAMP, 'payload': {
                'type': 'function_call', 'name': 'spawn_agent', 'call_id': 'spawn-' + identity,
                'arguments': json.dumps({'task_name': identity, 'fork_turns': 'none'})}},
                {'type': 'response_item', 'timestamp': STAMP, 'payload': {
                    'type': 'function_call_output', 'call_id': 'spawn-' + identity,
                    'output': json.dumps({'agent_id': identity})}}]
        return [{'type': 'assistant', 'sessionId': self.root, 'timestamp': STAMP,
                 'message': {'role': 'assistant', 'id': 'message-' + identity, 'content': [{
                     'type': 'tool_use', 'id': 'spawn-' + identity, 'name': 'Agent',
                     'input': {'description': identity, 'prompt': 'Inspect the assigned evidence.'}}]}},
                {'type': 'user', 'sessionId': self.root, 'timestamp': STAMP,
                 'message': {'role': 'user', 'content': [{'type': 'tool_result',
                     'tool_use_id': 'spawn-' + identity, 'content': 'agentId: ' + identity}]},
                 'toolUseResult': {'isAsync': True, 'status': 'async_launched', 'agentId': identity}}]

    def save(self, identity, requests, parent=None, scope='helper', extra=(), modified=10):
        path = self.path(identity, parent)
        path.parent.mkdir(parents=True, exist_ok=True)
        requests = copy.deepcopy(list(requests))
        extra = copy.deepcopy(list(extra))
        if self.client == 'claude' and extra:
            # Agent calls are content blocks in the billed assistant message;
            # their tool results carry the returned descendant identity.
            for record in extra:
                if record['type'] == 'assistant':
                    requests[0]['message']['content'].extend(record['message']['content'])
            records = requests[:1] + [record for record in extra if record['type'] != 'assistant'] + requests[1:]
        else:
            records = extra + requests
        records = self.opening(identity, parent, scope) + records
        if self.client == 'claude' and parent:
            for record in records:
                record.update(sessionId=self.root, agentId=identity, isSidechain=True)
        path.write_text(''.join(json.dumps(record) + '\n' for record in records))
        os.utime(path, (STARTED + modified, STARTED + modified))
        return path

    def publish(self, selected=None):
        # Match the supervisor's retained launch evidence and actual selection.
        chosen = install.demo_evaluator_log(self.client, str(self.home), STARTED,
            selection=self.selection, ended_at=STARTED + 60)
        if selected is not None:
            self.assertEqual(str(selected), str(chosen))
        selected = chosen
        section = install.write_demo_token_breakdown(str(self.run), str(selected) if selected else None,
                                                      selection=self.selection)
        self.assertIsNotNone(section, 'the real footer writer did not publish a section')
        output = io.TextIOWrapper(io.BytesIO(), encoding='utf-8', newline='')
        self.addCleanup(output.close)
        with mock.patch.object(cli.sys, 'stdout', output):
            result = cli.cmd_demo_result(cli.build_parser().parse_args(['-e', 'stage', 'demo', '--result']))
        output.flush()
        result_bytes = output.buffer.getvalue()
        footer = (self.run / install.DEMO_TOKEN_BREAKDOWN_NAME).read_text()
        self.publications += 1
        (self.run / ('result-' + str(self.publications) + '.stdout')).write_bytes(result_bytes)
        (self.run / ('observation-' + str(self.publications) + '.json')).write_text(json.dumps({
            'client': self.client, 'selected_log': str(selected), 'expected_root': str(self.path(self.root)),
            'return_code': result, 'numeric_claims': TOTALS.findall(footer),
            'report_sha256_before': hashlib.sha256(self.report).hexdigest(),
            'report_sha256_after': hashlib.sha256((self.run / 'evaluation.md').read_bytes()).hexdigest(),
            'source_logs': {str(path.relative_to(self.folder)): path.read_text() for path in self.logs.rglob('*.jsonl')},
        }, indent=2) + '\n')
        self.assertEqual(0, result)
        self.assertIn(footer.encode('utf-8'), result_bytes)
        return footer, result_bytes, selected

    def assert_totals(self, footer, total, requests):
        claims = [(int(tokens.replace(',', '')), int(count.replace(',', '')))
                  for tokens, count in TOTALS.findall(footer)]
        self.assertEqual([(total, requests)], claims, footer)

    def assert_unknown(self, footer, reason):
        self.assertEqual([], TOTALS.findall(footer), 'uncertain run totals were presented as measured\n' + footer)
        self.assertRegex(footer.lower(), r'unknown|unavailable')
        self.assertRegex(footer.lower(), reason)

    def test_unrelated_newer_marked_log_does_not_replace_evaluator(self):
        root = self.save(self.root, [self.request(self.root, 'root-response')])
        self.save('unrelated', [self.request('unrelated', 'unrelated-response', 920)], modified=20)
        footer, _output, selected = self.publish()
        self.assertEqual(str(root), str(selected))
        self.assert_totals(footer, 120, 1)

    def test_root_and_descendants_include_reviewer_and_auditor(self):
        children = [('worker', 'helper', 140), ('reviewer', 'review', 160), ('auditor', 'auditor', 180)]
        root = self.save(self.root, [self.request(self.root, 'root-response')],
                         extra=[record for identity, _scope, _total in children for record in self.spawn(identity)])
        for identity, scope, total in children:
            self.save(identity, [self.request(identity, identity + '-response', total)], self.root, scope)
        footer, _output, _selected = self.publish(root)
        self.assert_totals(footer, 600, 4)

    def test_repeated_and_copied_provider_response_is_counted_once(self):
        response = self.request(self.root, 'same-provider-response')
        root = self.save(self.root, [response, copy.deepcopy(response)], extra=self.spawn('worker'))
        copied = copy.deepcopy(response)
        if self.client == 'codex':
            copied['payload']['thread_id'] = 'worker'
        else:
            copied['sessionId'] = self.root
        self.save('worker', [copied, self.request('worker', 'worker-response', 140)], self.root)
        footer, _output, _selected = self.publish(root)
        self.assert_totals(footer, 260, 2)

    def test_missing_or_conflicting_usage_makes_totals_unknown(self):
        scenarios = ['missing', 'conflicting']
        if self.client == 'codex':
            scenarios += ['missing_cumulative_request', 'conflicting_cached_usage']
        for scenario in scenarios:
            with self.subTest(scenario=scenario):
                self.path('worker', self.root).unlink(missing_ok=True)
                first = self.request(self.root, 'root-response')
                if scenario == 'missing':
                    root = self.save(self.root, [first, self.request(self.root, 'bad-response', usage=False)])
                elif scenario == 'conflicting':
                    root = self.save(self.root, [first], extra=self.spawn('worker'))
                    self.save('worker', [self.request('worker', 'root-response', 240)], self.root)
                else:
                    cumulative = dict(first['payload']['thread_token_usage'])
                    first['payload']['thread_token_usage'] = cumulative
                    if scenario == 'missing_cumulative_request':
                        cumulative.update(input_tokens=200, output_tokens=40, total_tokens=240)
                    else:
                        cumulative['cached_input_tokens'] = 80
                    root = self.save(self.root, [first])
                footer, _output, _selected = self.publish(root)
                (self.run / ('footer-' + scenario + '.md')).write_text(footer)
                self.assert_unknown(footer, r'usage|counter|conflict|reconcil|unsupported')

    def test_missing_declared_descendant_makes_totals_unknown(self):
        root = self.save(self.root, [self.request(self.root, 'root-response')], extra=self.spawn('missing-worker'))
        footer, _output, _selected = self.publish(root)
        self.assert_unknown(footer, r'descendant|subagent|missing.*log')

    def test_demo_result_preserves_exact_published_report_bytes(self):
        root = self.save(self.root, [self.request(self.root, 'root-response')])
        footer, output, _selected = self.publish(root)
        self.assertEqual(self.report, (self.run / 'evaluation.md').read_bytes())
        self.assertEqual(1, output.count(self.report))
        self.assertTrue(output.endswith(self.report + footer.encode('utf-8')))


class CodexDemoTokenFooterTests(FooterScenarios, unittest.TestCase):
    client = 'codex'


class ClaudeDemoTokenFooterTests(FooterScenarios, unittest.TestCase):
    client = 'claude'


if __name__ == '__main__':
    unittest.main()
