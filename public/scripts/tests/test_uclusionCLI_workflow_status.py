import io
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS_DIR))

import uclusionCLI as cli


class WorkflowStatusTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.package = self.root / 'source' / 'uclusion'
        (self.package / 'references').mkdir(parents=True)
        (self.package / 'SKILL.md').write_text(
            '# Core\n[Read](references/reading.md)\n<!-- /uclusion-skill:v1 -->\n'
        )
        (self.package / 'references' / 'reading.md').write_text(
            '# Reading\nRead complete bodies.\n<!-- /uclusion-skill-reference:v1 -->\n'
        )

    def status(self, package=None, loaded=None):
        command = ['workflow-status', str(package or self.package)]
        if loaded is not None:
            command.extend(['--loaded', loaded])
        args = cli.parse_args(command)
        output = io.StringIO()
        with redirect_stdout(output):
            self.assertEqual(0, args.func(args))
        return json.loads(output.getvalue())

    def test_identical_complete_package_is_reused_across_paths(self):
        first = self.status()
        self.assertTrue(first['reload_required'])
        installed = self.root / 'installed' / 'uclusion'
        shutil.copytree(self.package, installed)
        reused = self.status(installed, first['content_id'])
        self.assertEqual({'content_id': first['content_id'],
                          'reload_required': False}, reused)

    def test_changed_reference_requires_reload_without_manifest_update(self):
        first = self.status()
        reference = self.package / 'references' / 'reading.md'
        reference.write_text(reference.read_text().replace('complete', 'current complete'))
        changed = self.status(loaded=first['content_id'])
        self.assertNotEqual(first['content_id'], changed['content_id'])
        self.assertTrue(changed['reload_required'])

    def test_every_reference_and_core_contributes_to_content_id(self):
        first = self.status()
        optional = self.package / 'references' / 'nested' / 'optional.md'
        optional.parent.mkdir()
        optional.write_text('Optional workflow instructions.\n')
        added = self.status(loaded=first['content_id'])
        self.assertNotEqual(first['content_id'], added['content_id'])
        core = self.package / 'SKILL.md'
        core.write_text(core.read_text() + '\nChanged core.\n')
        self.assertNotEqual(added['content_id'], self.status()['content_id'])

    def test_omitting_loaded_after_body_loss_or_compaction_requires_reload(self):
        first = self.status()
        self.assertFalse(self.status(loaded=first['content_id'])['reload_required'])
        restored = self.status()
        self.assertEqual(first['content_id'], restored['content_id'])
        self.assertTrue(restored['reload_required'])

    def test_missing_linked_reference_fails_without_an_indicator(self):
        (self.package / 'references' / 'reading.md').unlink()
        args = cli.parse_args(['workflow-status', str(self.package)])
        output, errors = io.StringIO(), io.StringIO()
        with redirect_stdout(output), redirect_stderr(errors):
            self.assertEqual(1, args.func(args))
        self.assertEqual('', output.getvalue())
        self.assertIn('workflow package unavailable', errors.getvalue())

    def test_missing_core_fails_without_an_indicator(self):
        (self.package / 'SKILL.md').unlink()
        args = cli.parse_args(['workflow-status', str(self.package)])
        with redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
            self.assertEqual(1, args.func(args))

    def test_command_runs_locally_without_workspace_configuration(self):
        result = subprocess.run(
            [sys.executable, str(SCRIPTS_DIR / 'uclusionCLI.py'), '-e', 'stage',
             'workflow-status', str(self.package)],
            cwd=self.root, capture_output=True, text=True, check=True,
        )
        self.assertTrue(json.loads(result.stdout)['reload_required'])
        self.assertEqual('', result.stderr)


if __name__ == '__main__':
    unittest.main()
