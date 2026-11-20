"""Codex's real configuration API, isolated from the user's settings and models."""
import importlib.util
import io
from pathlib import Path
import shutil
import tempfile
import tomllib
import unittest
from contextlib import redirect_stdout
from unittest.mock import patch


SPEC = importlib.util.spec_from_file_location(
    'concurrency_install', Path(__file__).resolve().parents[1] / 'uclusionInstall.py')
INSTALL = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(INSTALL)


@unittest.skipUnless(shutil.which('codex'), 'Codex is needed for the isolated configuration API check')
class CodexConcurrencyTests(unittest.TestCase):
    def configure(self, existing, answer=False):
        with tempfile.TemporaryDirectory(prefix='uclusion-concurrency-test-') as directory:
            home = Path(directory)
            path = home / 'config.toml'
            path.write_text(existing)
            with patch.object(INSTALL, 'CODEX_HOME', directory), \
                    patch.object(INSTALL, 'CODEX_CONFIG_PATH', str(path)), \
                    patch.object(INSTALL, 'prompt_yes_no', return_value=answer) as prompt, \
                    redirect_stdout(io.StringIO()):
                INSTALL.configure_codex_concurrency()
            return path.read_text(), prompt.call_args_list

    def test_absent_limit_is_added_and_existing_configuration_is_preserved(self):
        text, prompts = self.configure('# Customer settings\napproval_policy = "on-request"\n'
                                       '[agents.reviewer]\ndescription = "Keep reviewer"\n')
        config = tomllib.loads(text)
        self.assertEqual(16, config['agents']['max_concurrent_threads_per_session'])
        self.assertEqual('Keep reviewer', config['agents']['reviewer']['description'])
        self.assertEqual('on-request', config['approval_policy'])
        self.assertIn('# Customer settings', text)
        self.assertEqual([], prompts)

    def test_existing_limits_are_preserved_without_an_affirmative_answer(self):
        for existing in ('[agents]\nmax_concurrent_threads_per_session = 3\n',
                         '[agents]\nmax_threads = 4\n',
                         '[features.multi_agent_v2]\nmax_concurrent_threads_per_session = 5\n'):
            with self.subTest(existing=existing):
                text, prompts = self.configure(existing)
                self.assertEqual(existing, text)
                self.assertEqual(1, len(prompts))
                self.assertFalse(prompts[0].kwargs['default'])

    def test_acceptance_updates_existing_alias_without_duplicate_keys(self):
        text, prompts = self.configure('[agents]\nmax_threads = 3\n', answer=True)
        self.assertEqual({'max_threads': 16}, tomllib.loads(text)['agents'])
        self.assertEqual(1, len(prompts))
        self.assertIn('16 helpers (17 total threads)', prompts[0].args[0])

    def test_v2_override_gets_seventeen_total_threads_and_preserves_other_features(self):
        for existing in (
                '[agents]\nmax_concurrent_threads_per_session = 16\n'
                '[features.multi_agent_v2]\nenabled = true\nmax_concurrent_threads_per_session = 4\n',
                '# Inline settings\n[features]\n'
                'multi_agent_v2 = { enabled = true, max_concurrent_threads_per_session = 4 }\n'):
            with self.subTest(existing=existing):
                text, prompts = self.configure(existing, answer=True)
                v2 = tomllib.loads(text)['features']['multi_agent_v2']
                self.assertEqual({'enabled': True, 'max_concurrent_threads_per_session': 17}, v2)
                self.assertEqual(1, len(prompts))
                self.assertIn('4 total threads', prompts[0].args[0])

    def test_current_recommendation_is_unchanged_without_an_override_prompt(self):
        for existing in ('[agents]\nmax_concurrent_threads_per_session = 16\n',
                         '[features.multi_agent_v2]\nmax_concurrent_threads_per_session = 17\n'):
            with self.subTest(existing=existing):
                text, prompts = self.configure(existing)
                self.assertEqual(existing, text)
                self.assertEqual([], prompts)

    def test_disabled_v2_keeps_its_override_and_updates_the_active_agents_setting(self):
        text, prompts = self.configure('[agents]\nmax_concurrent_threads_per_session = 3\n'
                                       '[features.multi_agent_v2]\nenabled = false\n'
                                       'max_concurrent_threads_per_session = 23\n', answer=True)
        config = tomllib.loads(text)
        self.assertEqual(16, config['agents']['max_concurrent_threads_per_session'])
        self.assertEqual({'enabled': False, 'max_concurrent_threads_per_session': 23},
                         config['features']['multi_agent_v2'])
        self.assertIn('3 helpers', prompts[0].args[0])


if __name__ == '__main__':
    unittest.main()
