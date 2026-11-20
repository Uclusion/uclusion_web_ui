"""Claude concurrency installation in disposable settings files, without model calls."""
import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from contextlib import redirect_stdout
from unittest.mock import patch


SPEC = importlib.util.spec_from_file_location(
    'claude_concurrency_install', Path(__file__).resolve().parents[1] / 'uclusionInstall.py')
INSTALL = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(INSTALL)
LIMIT_KEY = 'CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS'


class ClaudeConcurrencyTests(unittest.TestCase):
    def setUp(self):
        environment = patch.dict(os.environ)
        environment.start()
        self.addCleanup(environment.stop)
        os.environ.pop(LIMIT_KEY, None)

    def configure(self, existing, answer=False, inherited=()):
        with tempfile.TemporaryDirectory(prefix='uclusion-claude-concurrency-') as directory:
            path = Path(directory) / 'settings.json'
            if existing is not None:
                path.write_text(existing)
            inherited_paths = []
            for index, text in enumerate(inherited):
                inherited_path = Path(directory) / f'inherited-{index}.json'
                inherited_path.write_text(text)
                inherited_paths.append(str(inherited_path))
            with patch.object(INSTALL, 'prompt_yes_no', return_value=answer) as prompt, \
                    redirect_stdout(io.StringIO()):
                INSTALL.configure_claude_concurrency(str(path), inherited_paths)
            return path.read_text() if path.exists() else None, prompt.call_args_list

    def test_absent_limit_is_added_without_changing_other_settings(self):
        for existing in (None, '{\n  "env": {"KEEP": "yes"},\n  "model": "keep-model"\n}\n'):
            with self.subTest(existing=existing):
                text, prompts = self.configure(existing)
                config = json.loads(text)
                self.assertEqual('16', config['env'][LIMIT_KEY])
                if existing is not None:
                    self.assertEqual('yes', config['env']['KEEP'])
                    self.assertEqual('keep-model', config['model'])
                    self.assertIn('\n  "model": "keep-model"\n', text)
                self.assertEqual([], prompts)

    def test_explicit_limit_is_preserved_without_an_affirmative_answer(self):
        existing = '{"env": {"' + LIMIT_KEY + '": "8", "KEEP": "yes"}}\n'
        text, prompts = self.configure(existing)
        self.assertEqual(existing, text)
        self.assertEqual(1, len(prompts))
        self.assertFalse(prompts[0].kwargs['default'])

    def test_affirmative_answer_replaces_only_the_explicit_limit(self):
        existing = '{\n  "env": {"' + LIMIT_KEY + '": "8", "KEEP": "yes"}\n}\n'
        text, prompts = self.configure(existing, answer=True)
        self.assertEqual(existing.replace('"8"', '"16"'), text)
        self.assertEqual(1, len(prompts))

    def test_matching_limit_is_unchanged_without_a_prompt(self):
        existing = '{ "env" : { "' + LIMIT_KEY + '" : "16" } }\n'
        text, prompts = self.configure(existing)
        self.assertEqual(existing, text)
        self.assertEqual([], prompts)

    def test_project_override_requires_acceptance_of_the_effective_inherited_limit(self):
        user = json.dumps({'env': {LIMIT_KEY: '8'}})
        shared = json.dumps({'env': {LIMIT_KEY: '12'}})
        for inherited, expected in (((user, '{}'), '8'), ((user, shared), '12')):
            for answer in (False, True):
                with self.subTest(expected=expected, answer=answer):
                    text, prompts = self.configure(None, answer, inherited)
                    self.assertEqual(1, len(prompts))
                    self.assertIn(repr(expected), prompts[0].args[0])
                    if answer:
                        self.assertEqual('16', json.loads(text)['env'][LIMIT_KEY])
                    else:
                        self.assertIsNone(text)

    def test_matching_inherited_limit_needs_no_local_override(self):
        matching = json.dumps({'env': {LIMIT_KEY: '16'}})
        for inherited in ((matching, '{}'), ('{}', matching)):
            with self.subTest(inherited=inherited):
                text, prompts = self.configure(None, inherited=inherited)
                self.assertIsNone(text)
                self.assertEqual([], prompts)

    def test_exported_limit_is_preserved_until_accepted_and_files_take_precedence(self):
        with patch.dict(os.environ, {LIMIT_KEY: '8'}):
            for answer in (False, True):
                with self.subTest(answer=answer):
                    text, prompts = self.configure(None, answer)
                    self.assertEqual(1, len(prompts))
                    self.assertIn('the environment', prompts[0].args[0])
                    if answer:
                        self.assertEqual('16', json.loads(text)['env'][LIMIT_KEY])
                    else:
                        self.assertIsNone(text)
            existing = json.dumps({'env': {LIMIT_KEY: '16'}})
            text, prompts = self.configure(existing)
            self.assertEqual(existing, text)
            self.assertEqual([], prompts)

    def test_invalid_settings_are_not_overwritten(self):
        for existing in ('not json', '[]', '{"env": []}', '{"env": null}'):
            with self.subTest(existing=existing), tempfile.TemporaryDirectory() as directory:
                path = Path(directory) / 'settings.json'
                path.write_text(existing)
                with self.assertRaisesRegex(RuntimeError, 'invalid Claude settings'):
                    INSTALL.configure_claude_concurrency(str(path))
                self.assertEqual(existing, path.read_text())


if __name__ == '__main__':
    unittest.main()
