"""S-Marketing-110: install.sh removes its download however the installer ends.

It used to `exec` the installer, which replaced the shell before its EXIT trap
could run, so every run left a tmp.* directory holding uclusionInstall.py.
"""

import os
from pathlib import Path
import stat
import subprocess
import tempfile
import unittest


INSTALL_SH = Path(__file__).resolve().parents[1] / 'install.sh'

STUB_CURL = '''#!/bin/sh
while [ "$#" -gt 0 ]; do
  if [ "$1" = "-o" ]; then
    shift
    echo "# downloaded installer" > "$1"
  fi
  shift
done
'''

# Records what it was given, then ends the way the test asks.
STUB_PYTHON = '''#!/bin/sh
printf '%s\\n' "$@" > "$STUB_RECORD"
exit "${STUB_EXIT:-0}"
'''


@unittest.skipUnless(os.name == 'posix', 'install.sh is a POSIX shell script')
class InstallShTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        root = Path(directory.name)
        self.bin = root / 'bin'
        self.tmp = root / 'tmp'
        self.bin.mkdir()
        self.tmp.mkdir()
        self.record = root / 'python-args'
        for name, body in (('curl', STUB_CURL), ('python3', STUB_PYTHON)):
            path = self.bin / name
            path.write_text(body)
            path.chmod(path.stat().st_mode | stat.S_IXUSR)

    def run_install(self, *args, exit_code=0):
        environment = dict(os.environ)
        environment.update({
            'PATH': f'{self.bin}{os.pathsep}/usr/bin{os.pathsep}/bin',
            'TMPDIR': str(self.tmp),
            'STUB_RECORD': str(self.record),
            'STUB_EXIT': str(exit_code),
        })
        return subprocess.run(
            ['bash', str(INSTALL_SH), *args], env=environment,
            stdin=subprocess.DEVNULL, capture_output=True, text=True, timeout=30,
        )

    def test_a_failed_demo_keeps_its_status_and_leaves_no_download(self):
        result = self.run_install(
            'demo', 'stage', '--clients', 'codex', '--model', 'gpt-6', '--effort', 'high',
            exit_code=7,
        )
        self.assertEqual(7, result.returncode, result.stderr)
        script, *rest = self.record.read_text().splitlines()
        self.assertEqual('uclusionInstall.py', Path(script).name)
        self.assertEqual(self.tmp, Path(script).parent.parent)
        self.assertEqual(
            ['stage', 'demo', '--clients', 'codex', '--model', 'gpt-6', '--effort', 'high'],
            rest,
        )
        self.assertEqual([], list(self.tmp.iterdir()))

    def test_an_install_leaves_no_download(self):
        result = self.run_install('workspace', 'view', 'stage')
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertEqual(
            ['stage', 'workspace', 'view'], self.record.read_text().splitlines()[1:],
        )
        self.assertEqual([], list(self.tmp.iterdir()))


if __name__ == '__main__':
    unittest.main()
