"""S-Marketing-87: removal takes back what Claude Code kept for the demo home.

The demo's sessions run in its home, so Claude Code files their transcripts,
their task output and a project entry under that path, outside the home. The
landing prompt promises removal takes everything, so removal deletes exactly
those three and nothing else of the same shape.
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
        self.claude_json.write_text(json.dumps({
            'numStartups': 7,
            'projects': {self.home: {'allowedTools': []}, '/home/me/project': {'x': 1}},
        }))

    def test_the_encoded_name_is_claude_code_s(self):
        self.assertEqual('-tmp-uclusion-demo-1000',
                         INSTALL.claude_project_name('/tmp/uclusion-demo-1000'))
        self.assertIsNone(INSTALL.claude_project_name('/' + 'a' * 200))

    def test_only_the_demo_s_three_traces_go(self):
        self.leave_traces()
        outcomes = INSTALL.remove_demo_claude_session_traces(self.home)
        self.assertEqual(['removed'] * 3, [state for state, _detail in outcomes])
        self.assertFalse((self.config / 'projects' / self.name).exists())
        self.assertFalse((self.claude_temp / self.name).exists())
        # Folders of the same shape for other projects stay
        self.assertTrue((self.config / 'projects' / '-home-me-project').is_dir())
        self.assertTrue((self.claude_temp / '-home-me-project').is_dir())
        config = json.loads(self.claude_json.read_text())
        self.assertEqual({'/home/me/project': {'x': 1}}, config['projects'])
        self.assertEqual(7, config['numStartups'])
        # The lock taken for the edit is not left behind as a new trace
        self.assertFalse(Path(f'{self.claude_json}.uclusion.lock').exists())

    def test_nothing_to_remove_writes_nothing(self):
        outcomes = INSTALL.remove_demo_claude_session_traces(self.home)
        self.assertEqual(['absent'] * 3, [state for state, _detail in outcomes])
        self.assertFalse(self.claude_json.exists())

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

    def test_a_name_claude_code_shortens_is_not_guessed(self):
        outcomes = INSTALL.remove_demo_claude_session_traces('/' + 'a' * 200)
        self.assertEqual(['kept'], [state for state, _detail in outcomes])

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
        self.assertIn('transcripts, task output and project entry Claude Code keeps', told)


if __name__ == '__main__':
    unittest.main()
