"""S-Marketing-109: removal takes back what Codex kept for the demo's sessions.

Codex files each session's rollout under CODEX_HOME/sessions with the
directory it started in, and names the session in history.jsonl,
session_index.jsonl and, for an interactive session, a TUI marker. The
person's own agent that installed the demo is a session too, started
elsewhere, and its rollout mentions the demo's session ids; it stays.
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
    'demo_codex_traces', Path(__file__).resolve().parents[1] / 'uclusionInstall.py'
)
INSTALL = importlib.util.module_from_spec(spec)
spec.loader.exec_module(INSTALL)

OWNER = '01a0fdbf-302b-7281-90f3-6dad72a75f53'
EVALUATOR = '01a0fdbf-70f4-7de2-af71-49722c63a7fa'
PERSON = '01a0fda1-2775-7550-a7e4-2e81496ec9bd'


def rollout(session_id, cwd, *more):
    lines = [{'timestamp': '2026-10-02T17:52:40Z', 'type': 'session_meta',
              'payload': {'id': session_id, 'cwd': cwd, 'source': 'exec'}}, *more]
    return ''.join(json.dumps(line) + '\n' for line in lines)


class CodexSessionTraceTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        root = Path(os.path.realpath(directory.name))
        self.home = str(root / 'uclusion-demo-1000')
        self.codex = root / 'codex-home'
        self.config = self.codex / 'config.toml'
        for patch in (
            mock.patch.object(INSTALL, 'CODEX_HOME', str(self.codex)),
            mock.patch.object(INSTALL, 'CODEX_CONFIG_PATH', str(self.config)),
        ):
            patch.start()
            self.addCleanup(patch.stop)

    def leave_traces(self):
        day = self.codex / 'sessions' / '2026' / '10' / '02'
        day.mkdir(parents=True)
        self.demo_rollouts = [
            day / f'rollout-2026-10-02T10-52-40-{OWNER}.jsonl',
            day / f'rollout-2026-10-02T10-52-57-{EVALUATOR}.jsonl',
        ]
        self.demo_rollouts[0].write_text(rollout(OWNER, self.home))
        self.demo_rollouts[1].write_text(rollout(EVALUATOR, self.home))
        self.person = day / f'rollout-2026-10-02T10-19-52-{PERSON}.jsonl'
        self.person.write_text(rollout(
            PERSON, '/home/me/project',
            {'type': 'event_msg', 'payload': {'message': f'demo sessions {OWNER} {EVALUATOR}'}},
        ))
        (self.codex / 'history.jsonl').write_text(''.join(
            json.dumps(line) + '\n' for line in (
                {'session_id': PERSON, 'ts': 1, 'text': f'install the demo ({OWNER})'},
                {'session_id': EVALUATOR, 'ts': 2, 'text': 'Start J-Demo-1.'},
            )) + 'not json\n')
        (self.codex / 'session_index.jsonl').write_text(''.join(
            json.dumps(line) + '\n' for line in (
                {'id': PERSON, 'thread_name': 'Run Uclusion agent demo'},
                {'id': EVALUATOR, 'thread_name': 'Start J-Demo-1'},
            )))
        markers = self.codex / 'tui-thread-reference-capabilities'
        markers.mkdir()
        for session_id in (PERSON, EVALUATOR):
            (markers / session_id).write_text('')
        (self.codex / 'state_5.sqlite').write_bytes(b'sqlite state')

    def snapshot(self):
        return {str(path.relative_to(self.codex)): path.read_bytes()
                for path in sorted(self.codex.rglob('*')) if path.is_file()}

    def test_only_the_demo_sessions_are_removed(self):
        self.leave_traces()
        before = self.snapshot()
        outcomes = INSTALL.remove_demo_codex_session_traces(self.home)
        self.assertEqual([], [detail for state, detail in outcomes if state == 'kept'])
        after = self.snapshot()
        gone = set(before) - set(after)
        self.assertEqual({
            *(str(path.relative_to(self.codex)) for path in self.demo_rollouts),
            f'tui-thread-reference-capabilities/{EVALUATOR}',
        }, gone)
        self.assertEqual(
            json.dumps({'session_id': PERSON, 'ts': 1, 'text': f'install the demo ({OWNER})'})
            + '\nnot json\n',
            after['history.jsonl'].decode(),
        )
        self.assertEqual(
            json.dumps({'id': PERSON, 'thread_name': 'Run Uclusion agent demo'}) + '\n',
            after['session_index.jsonl'].decode(),
        )
        for name in after:
            if name not in ('history.jsonl', 'session_index.jsonl'):
                self.assertEqual(before[name], after[name], name)

    def test_a_second_removal_changes_nothing(self):
        self.leave_traces()
        INSTALL.remove_demo_codex_session_traces(self.home)
        before = self.snapshot()
        outcomes = INSTALL.remove_demo_codex_session_traces(self.home)
        self.assertEqual(before, self.snapshot())
        self.assertEqual({'absent'}, {state for state, _detail in outcomes})

    def test_nothing_to_remove_writes_nothing(self):
        outcomes = INSTALL.remove_demo_codex_session_traces(self.home)
        self.assertFalse(self.codex.exists())
        self.assertEqual({'absent'}, {state for state, _detail in outcomes})

    def test_codex_trust_uses_the_demo_setup_and_removal_lifecycle(self):
        self.codex.mkdir()
        original = 'model = "gpt-6-luna"\n\n[projects."/home/me/work"]\ntrust_level = "trusted"\n'
        self.config.write_text(original)
        INSTALL.accept_demo_workspace_trust(self.home, client='codex')
        saved = self.config.read_text()
        self.assertTrue(saved.startswith(original))
        self.assertEqual('trusted', INSTALL.tomllib.loads(saved)['projects'][self.home]['trust_level'])
        INSTALL.accept_demo_workspace_trust(self.home, client='codex')
        self.assertEqual(saved, self.config.read_text())
        outcomes = INSTALL.remove_demo_codex_session_traces(self.home)
        self.assertIn(('removed', f'the demo trust entry from {self.config}'), outcomes)
        self.assertEqual(original, self.config.read_text())
        self.assertFalse(Path(f'{self.config}.uclusion.lock').exists())

    def test_removal_preserves_a_human_change_to_demo_trust(self):
        INSTALL.accept_demo_workspace_trust(self.home, client='codex')
        changed = self.config.read_text().replace('trust_level = "trusted"', 'trust_level = "untrusted"')
        self.config.write_text(changed)
        outcomes = INSTALL.remove_demo_codex_session_traces(self.home)
        self.assertIn(('kept', f'the changed demo trust entry in {self.config}'), outcomes)
        self.assertEqual(changed, self.config.read_text())

    def test_existing_human_trust_is_neither_owned_nor_removed(self):
        self.codex.mkdir()
        original = f'[projects.{json.dumps(self.home)}]\ntrust_level = "trusted"\n'
        self.config.write_text(original)
        INSTALL.accept_demo_workspace_trust(self.home, client='codex')
        INSTALL.remove_demo_codex_session_traces(self.home)
        self.assertEqual(original, self.config.read_text())

    def test_cleanup_keeps_unrelated_changes_added_during_the_demo(self):
        INSTALL.accept_demo_workspace_trust(self.home, client='codex')
        added = '[projects."/home/me/other"]\ntrust_level = "trusted"\n'
        with self.config.open('a') as output:
            output.write('\n' + added)
        INSTALL.remove_demo_codex_session_traces(self.home)
        self.assertEqual(added, self.config.read_text())

    def test_demo_does_not_replace_a_human_untrusted_project(self):
        self.codex.mkdir()
        original = f'[projects.{json.dumps(self.home)}]\ntrust_level = "untrusted"\n'
        self.config.write_text(original)
        with self.assertRaisesRegex(RuntimeError, 'already configures trust'):
            INSTALL.accept_demo_workspace_trust(self.home, client='codex')
        self.assertEqual(original, self.config.read_text())

    def test_removal_runs_after_the_sessions_are_stopped(self):
        source = inspect.getsource(INSTALL.remove_demo_install)
        self.assertLess(source.index('stop_demo_home_processes(home)'),
                        source.index('remove_demo_codex_session_traces(home)'))
        self.assertLess(source.index('remove_demo_codex_session_traces(home)'),
                        source.index('DEMO_PURGE_MODE'))

    def test_the_installer_names_what_codex_removal_takes(self):
        supervisor = mock.Mock(pid=4242)
        root = Path(self.home)
        (root / '.uclusion').mkdir(parents=True)
        (root / '.local' / 'bin').mkdir(parents=True)
        printed = []
        with mock.patch.object(INSTALL, 'UCLUSION_HOME', str(root / '.uclusion')), \
                mock.patch.object(INSTALL, 'SYMLINK_DIR', str(root / '.local' / 'bin')), \
                mock.patch.object(INSTALL, 'uclusion_home_root', return_value=self.home), \
                mock.patch.object(INSTALL.subprocess, 'Popen', return_value=supervisor), \
                mock.patch('builtins.print', side_effect=lambda *a, **_k: printed.append(a[0])):
            INSTALL.start_demo_supervisor('stage', 'codex', 'workspace', 'Start J-Demo-1.',
                                          model='gpt-6', effort='high')
        line = next(text for text in printed if 'demo --remove' in text)
        self.assertIn(str(self.codex), line)
        self.assertIn('session logs, prompt history and session index lines', line)
        self.assertIn('sqlite records of those sessions remain', line)


if __name__ == '__main__':
    unittest.main()
