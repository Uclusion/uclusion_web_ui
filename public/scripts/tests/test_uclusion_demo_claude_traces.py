"""S-Marketing-87: removal takes back what Claude Code kept for the demo home.

The demo's sessions run in its home, so Claude Code files their transcripts,
their task output and a project entry under that path, outside the home.
T-Marketing-299: it also counts the demo plugin in .claude.json. Removal
deletes those counters and nothing else of the same shape.
"""

import importlib.util
import inspect
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest import mock


spec = importlib.util.spec_from_file_location(
    'demo_claude_traces', Path(__file__).resolve().parents[1] / 'uclusionInstall.py'
)
INSTALL = importlib.util.module_from_spec(spec)
spec.loader.exec_module(INSTALL)


class ClaudeSessionTraceTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        root = Path(os.path.realpath(directory.name))
        self.home = str(root / 'uclusion-demo-1000')
        self.config = root / 'config'
        self.claude_json = root / '.claude.json'
        self.temp_root = root / 'tmp'
        self.name = INSTALL.claude_project_name(self.home)
        uid = os.getuid() if hasattr(os, 'getuid') else 0
        self.claude_temp = self.temp_root / f'claude-{uid}'
        for patch in (
            mock.patch.object(INSTALL, 'CLAUDE_CONFIG_HOME', str(self.config)),
            mock.patch.object(INSTALL, 'CLAUDE_JSON_PATH', str(self.claude_json)),
            mock.patch.object(INSTALL, 'USER_HOME', str(root)),
            mock.patch.object(INSTALL, '_claude_temp_roots', return_value=[str(self.temp_root)]),
        ):
            patch.start()
            self.addCleanup(patch.stop)

    def leave_traces(self):
        transcripts = self.config / 'projects' / self.name
        output = self.claude_temp / self.name / 'tasks'
        for folder in (transcripts, output,
                       self.config / 'projects' / '-home-me-project',
                       self.claude_temp / '-home-me-project'):
            folder.mkdir(parents=True)
            (folder / 'session.jsonl').write_text('{}')
        session = '11111111-1111-4111-8111-111111111111'
        other = '22222222-2222-4222-8222-222222222222'
        (transcripts / f'{session}.jsonl').write_text('{}')
        for kind in ('session-env', 'tasks', 'file-history'):
            for name, marker in ((session, 'demo'), (other, 'keep')):
                folder = self.config / kind / name
                folder.mkdir(parents=True)
                (folder / 'marker').write_text(marker)
        debug = self.config / 'debug'
        debug.mkdir()
        (debug / f'{session}.txt').write_text('demo')
        (debug / f'{other}.txt').write_text('keep')
        (self.config / 'history.jsonl').write_text(
            json.dumps({'project': self.home, 'display': 'demo'}) + '\n'
            + json.dumps({'project': '/home/me/project', 'display': 'keep'}) + '\n'
        )
        self.claude_json.write_text(json.dumps({
            'numStartups': 7,
            'projects': {self.home: {'allowedTools': []}, '/home/me/project': {'x': 1}},
            'pluginUsage': {
                'uclusion-demo@inline': {'usageCount': 1},
                'other@builtin': {'usageCount': 2},
            },
            'skillUsage': {
                'uclusion-demo:uclusion': {'usageCount': 1},
                'uclusion-demo:uclusion-design': {'usageCount': 1},
                'uclusion': {'usageCount': 4},
                'uclusion-design': {'usageCount': 3},
            },
        }))

    def test_the_encoded_name_is_claude_code_s(self):
        self.assertEqual('-tmp-uclusion-demo-1000',
                         INSTALL.claude_project_name('/tmp/uclusion-demo-1000'))
        self.assertIsNone(INSTALL.claude_project_name('/' + 'a' * 200))

    def test_only_the_demo_s_three_traces_go(self):
        self.leave_traces()
        session = '11111111-1111-4111-8111-111111111111'
        other = '22222222-2222-4222-8222-222222222222'
        outcomes = INSTALL.remove_demo_claude_session_traces(self.home)
        self.assertNotIn('kept', [state for state, _detail in outcomes])
        self.assertFalse((self.config / 'projects' / self.name).exists())
        self.assertFalse((self.claude_temp / self.name).exists())
        for kind in ('session-env', 'tasks', 'file-history'):
            self.assertFalse((self.config / kind / session).exists())
            self.assertEqual('keep', (self.config / kind / other / 'marker').read_text())
        self.assertFalse((self.config / 'debug' / f'{session}.txt').exists())
        self.assertEqual('keep', (self.config / 'debug' / f'{other}.txt').read_text())
        history = [
            json.loads(line)
            for line in (self.config / 'history.jsonl').read_text().splitlines()
        ]
        self.assertEqual([{'project': '/home/me/project', 'display': 'keep'}], history)
        # Folders of the same shape for other projects stay
        self.assertTrue((self.config / 'projects' / '-home-me-project').is_dir())
        self.assertTrue((self.claude_temp / '-home-me-project').is_dir())
        config = json.loads(self.claude_json.read_text())
        self.assertEqual({'/home/me/project': {'x': 1}}, config['projects'])
        self.assertEqual(7, config['numStartups'])
        self.assertEqual({'other@builtin': {'usageCount': 2}}, config['pluginUsage'])
        self.assertEqual(
            {'uclusion': {'usageCount': 4}, 'uclusion-design': {'usageCount': 3}},
            config['skillUsage'],
        )
        # The lock taken for the edit is not left behind as a new trace
        self.assertFalse(Path(f'{self.claude_json}.uclusion.lock').exists())

    def test_nothing_to_remove_writes_nothing(self):
        outcomes = INSTALL.remove_demo_claude_session_traces(self.home)
        self.assertTrue(outcomes)
        self.assertTrue(all(state == 'absent' for state, _detail in outcomes))
        self.assertFalse(self.claude_json.exists())
        self.assertFalse((self.config / 'history.jsonl').exists())

    def test_a_config_it_cannot_read_is_left_alone(self):
        self.claude_json.write_text('{not json')
        state, detail = INSTALL.remove_demo_claude_session_traces(self.home)[-1]
        self.assertEqual('kept', state)
        self.assertIn('not valid JSON', detail)
        self.assertEqual('{not json', self.claude_json.read_text())

    def test_a_linked_folder_is_not_followed(self):
        elsewhere = self.temp_root / 'elsewhere'
        elsewhere.mkdir(parents=True)
        (self.config / 'projects').mkdir(parents=True)
        os.symlink(elsewhere, self.config / 'projects' / self.name)
        state, _detail = INSTALL.remove_demo_claude_session_traces(self.home)[0]
        self.assertEqual('kept', state)
        self.assertTrue(elsewhere.is_dir())

    def test_the_demo_home_is_recorded_as_trusted_before_a_session_starts(self):
        home_config = self.temp_root / 'person' / '.claude.json'
        home_config.parent.mkdir(parents=True)
        home_config.write_text(json.dumps({
            'projects': {
                '/home/me/project': {'hasTrustDialogAccepted': False, 'allowedTools': []},
            },
        }))
        session_config = self.claude_json
        with mock.patch.object(INSTALL, 'USER_HOME', str(home_config.parent)), \
                mock.patch.object(INSTALL, 'CLAUDE_JSON_PATH', str(session_config)):
            INSTALL.accept_demo_workspace_trust(self.home)
        for path in (session_config, home_config):
            projects = json.loads(path.read_text())['projects']
            self.assertIs(True, projects[self.home]['hasTrustDialogAccepted'])
        kept = json.loads(home_config.read_text())['projects']['/home/me/project']
        self.assertIs(False, kept['hasTrustDialogAccepted'])
        self.assertEqual([], kept['allowedTools'])
        source = inspect.getsource(INSTALL.run_claude_demo)
        self.assertLess(
            source.index('accept_demo_workspace_trust('),
            source.index('DemoCodexTerminal('),
        )

    def test_a_separate_home_config_loses_only_the_demo_counters(self):
        home = self.temp_root / 'person'
        home.mkdir(parents=True)
        config = home / '.claude.json'
        config.write_text(json.dumps({
            'pluginUsage': {'uclusion-demo@inline': {'usageCount': 6}},
            'skillUsage': {
                'uclusion-demo:uclusion': {'usageCount': 6},
                'uclusion': {'usageCount': 29},
            },
        }))
        with mock.patch.object(INSTALL, 'USER_HOME', str(home)):
            outcomes = INSTALL.remove_demo_claude_session_traces(self.home)
        self.assertIn(
            ('removed', f"the demo plugin's usage counters from {config}"),
            outcomes,
        )
        saved = json.loads(config.read_text())
        self.assertNotIn('pluginUsage', saved)
        self.assertEqual({'uclusion': {'usageCount': 29}}, saved['skillUsage'])
        self.assertFalse(Path(f'{config}.uclusion.lock').exists())

    def test_a_separate_home_config_loses_the_demo_trust_entry(self):
        person = self.temp_root / 'person'
        person.mkdir(parents=True)
        home_config = person / '.claude.json'
        home_config.write_text(json.dumps({
            'projects': {
                self.home: {'hasTrustDialogAccepted': True},
                '/home/me/project': {'hasTrustDialogAccepted': True},
            },
        }))
        self.claude_json.write_text(json.dumps({
            'projects': {
                self.home: {'hasTrustDialogAccepted': True, 'allowedTools': []},
                '/home/me/other': {'x': 1},
            },
        }))
        with mock.patch.object(INSTALL, 'USER_HOME', str(person)):
            outcomes = INSTALL.remove_demo_claude_session_traces(self.home)
        self.assertIn(
            ('removed', f"the demo's project entry from {home_config}"),
            outcomes,
        )
        self.assertIn(
            ('removed', f"the demo's project entry from {self.claude_json}"),
            outcomes,
        )
        self.assertEqual(
            {'/home/me/project': {'hasTrustDialogAccepted': True}},
            json.loads(home_config.read_text())['projects'],
        )
        self.assertEqual(
            {'/home/me/other': {'x': 1}},
            json.loads(self.claude_json.read_text())['projects'],
        )
        self.assertFalse(Path(f'{home_config}.uclusion.lock').exists())

    def test_a_name_claude_code_shortens_is_not_guessed(self):
        outcomes = INSTALL.remove_demo_claude_session_traces('/' + 'a' * 200)
        self.assertEqual(['kept', 'kept'],
                         [state for state, _detail in outcomes[:2]])
        self.assertTrue(all(state == 'absent' for state, _detail in outcomes[2:]))

    def test_removal_waits_until_no_session_can_write_them_again(self):
        source = inspect.getsource(INSTALL.remove_demo_install)
        self.assertLess(source.index('stop_demo_home_processes(home)'),
                        source.index('remove_demo_claude_session_traces(home)'))
        self.assertLess(source.index('remove_demo_claude_session_traces(home)'),
                        source.index('DEMO_PURGE_MODE'))

    def test_the_installer_names_the_removal_command(self):
        home = Path(tempfile.mkdtemp())
        self.addCleanup(lambda: __import__('shutil').rmtree(home, ignore_errors=True))
        (home / '.uclusion').mkdir()
        (home / '.local' / 'bin').mkdir(parents=True)
        with mock.patch.object(INSTALL, 'UCLUSION_HOME', str(home / '.uclusion')), \
                mock.patch.object(INSTALL, 'SYMLINK_DIR', str(home / '.local' / 'bin')), \
                mock.patch.object(INSTALL, 'uclusion_home_root', return_value=str(home)), \
                mock.patch.object(INSTALL.subprocess, 'Popen', return_value=mock.Mock(pid=1)), \
                mock.patch('builtins.print') as printed:
            INSTALL.start_demo_supervisor('stage', 'claude', 'workspace', 'Start J-Demo-1.')
        told = ' '.join(str(call.args[0]) for call in printed.call_args_list)
        self.assertIn('demo --remove` removes the demo', told)
        self.assertIn(
            'transcripts, task output, session files, prompt history, '
            'project entries and demo-plugin usage counters Claude Code keeps',
            told,
        )
        self.assertIn('including the demo home in ~/.claude.json', told)

    def test_trust_and_removal_leave_the_rest_of_the_file_byte_for_byte(self):
        original = (
            '{\n'
            '\t"numStartups": 7,\n'
            '\t"projects": {\n'
            '\t\t"/home/me/project": { "hasTrustDialogAccepted": false, "allowedTools": [] }\n'
            '\t}\n'
            '}\n'
        )
        home_config = self.temp_root / 'person' / '.claude.json'
        home_config.parent.mkdir(parents=True)
        home_config.write_text(original)
        with mock.patch.object(INSTALL, 'USER_HOME', str(home_config.parent)), \
                mock.patch.object(INSTALL, 'CLAUDE_JSON_PATH', str(self.claude_json)):
            INSTALL.accept_demo_workspace_trust(self.home)
        updated = home_config.read_text()
        self.assertIn('\t\t"/home/me/project": { "hasTrustDialogAccepted": false, "allowedTools": [] }', updated)
        self.assertIn('\t"numStartups": 7,', updated)
        self.assertTrue(updated.endswith('}\n'))
        projects = json.loads(updated)['projects']
        self.assertIs(True, projects[self.home]['hasTrustDialogAccepted'])
        self.assertIs(False, projects['/home/me/project']['hasTrustDialogAccepted'])
        with mock.patch.object(INSTALL, 'USER_HOME', str(home_config.parent)), \
                mock.patch.object(INSTALL, 'CLAUDE_JSON_PATH', str(self.claude_json)):
            INSTALL.remove_demo_claude_session_traces(self.home)
        removed = home_config.read_text()
        self.assertIn('\t\t"/home/me/project": { "hasTrustDialogAccepted": false, "allowedTools": [] }', removed)
        self.assertIn('\t"numStartups": 7,', removed)
        self.assertNotIn(self.home, json.loads(removed)['projects'])


if __name__ == '__main__':
    unittest.main()
