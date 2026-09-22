import io
import os
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from types import SimpleNamespace
from unittest import mock


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS_DIR))

import uclusionCLI as cli


class DemoReportTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.home = Path(temporary.name)
        self.report_path = (
            self.home / '.uclusion' / 'demo-runs' / 'run-one' / 'evaluation.md'
        )
        self.report_path.parent.mkdir(parents=True)
        environment = mock.patch.dict(os.environ, {
            'UCLUSION_HOME': str(self.home),
            'UCLUSION_DEMO_REPORT_FILE': str(self.report_path),
        })
        environment.start()
        self.addCleanup(environment.stop)

    def publish(self, report=b'Complete evaluation.\n'):
        args = cli.build_parser().parse_args(['demo', '--report'])
        stdout, stderr = io.StringIO(), io.StringIO()
        with (
            mock.patch.object(cli.sys, 'stdin', SimpleNamespace(buffer=io.BytesIO(report))),
            redirect_stdout(stdout),
            redirect_stderr(stderr),
        ):
            result = args.func(args)
        return result, stdout.getvalue(), stderr.getvalue()

    def test_publishes_exact_utf8_bytes(self):
        report = '  # Evaluation\r\n\r\nCafé ✓\n'.encode('utf-8')

        result, stdout, stderr = self.publish(report)

        self.assertEqual(0, result, stderr)
        self.assertEqual(report, self.report_path.read_bytes())
        self.assertNotIn('Café', stdout)
        self.assertEqual([self.report_path], list(self.report_path.parent.iterdir()))

    def test_rejects_blank_or_invalid_utf8(self):
        for report in (b'', b' \r\n\t', '\u2003'.encode('utf-8'), b'bad\xffutf8'):
            with self.subTest(report=report):
                result, _stdout, stderr = self.publish(report)

                self.assertEqual(1, result)
                self.assertTrue(stderr)
                self.assertEqual([], list(self.report_path.parent.iterdir()))

    def test_requires_both_run_destination_and_explicit_demo_home(self):
        for name in ('UCLUSION_HOME', 'UCLUSION_DEMO_REPORT_FILE'):
            with self.subTest(name=name), mock.patch.dict(os.environ):
                os.environ.pop(name)

                result, _stdout, stderr = self.publish()

                self.assertEqual(1, result)
                self.assertIn('no designated demo report', stderr)
                self.assertFalse(self.report_path.exists())

    def test_rejects_destinations_outside_one_run_directory(self):
        destinations = (
            self.home / 'evaluation.md',
            self.home / '.uclusion' / 'demo-runs' / 'evaluation.md',
            self.report_path.parent / 'nested' / 'evaluation.md',
            self.report_path.with_name('other.md'),
            Path('evaluation.md'),
        )
        for destination in destinations:
            with self.subTest(destination=destination), mock.patch.dict(os.environ, {
                'UCLUSION_DEMO_REPORT_FILE': str(destination),
            }):
                result, _stdout, stderr = self.publish()

                self.assertEqual(1, result)
                self.assertIn('outside this demo run', stderr)
                self.assertFalse(destination.exists())

    def test_does_not_create_a_missing_run_directory(self):
        destination = self.report_path.parent.parent / 'missing' / 'evaluation.md'
        with mock.patch.dict(os.environ, {'UCLUSION_DEMO_REPORT_FILE': str(destination)}):
            result, _stdout, stderr = self.publish()

        self.assertEqual(1, result)
        self.assertTrue(stderr)
        self.assertFalse(destination.parent.exists())

    def test_rejects_run_directory_symlink_escape(self):
        outside = self.home / 'outside'
        outside.mkdir()
        linked_run = self.report_path.parent.parent / 'linked-run'
        linked_run.symlink_to(outside, target_is_directory=True)
        with mock.patch.dict(os.environ, {
            'UCLUSION_DEMO_REPORT_FILE': str(linked_run / 'evaluation.md'),
        }):
            result, _stdout, stderr = self.publish()

        self.assertEqual(1, result)
        self.assertIn('outside this demo run', stderr)
        self.assertEqual([], list(outside.iterdir()))

    def test_repeated_publication_preserves_first_report(self):
        self.assertEqual(0, self.publish(b'First complete evaluation.')[0])

        result, _stdout, stderr = self.publish(b'Replacement evaluation.')

        self.assertEqual(1, result)
        self.assertIn('already has an evaluation', stderr)
        self.assertEqual(b'First complete evaluation.', self.report_path.read_bytes())
        self.assertEqual([self.report_path], list(self.report_path.parent.iterdir()))

    def test_concurrent_publication_does_not_replace_winner(self):
        original_link = os.link

        def competing_publication(source, destination):
            self.assertFalse(self.report_path.exists())
            self.report_path.write_bytes(b'Concurrent complete evaluation.')
            original_link(source, destination)

        with mock.patch.object(cli.os, 'link', side_effect=competing_publication):
            result, _stdout, stderr = self.publish()

        self.assertEqual(1, result)
        self.assertIn('already has an evaluation', stderr)
        self.assertEqual(b'Concurrent complete evaluation.', self.report_path.read_bytes())
        self.assertEqual([self.report_path], list(self.report_path.parent.iterdir()))

    def test_failed_flush_leaves_no_completed_or_partial_report(self):
        with mock.patch.object(cli.os, 'fsync', side_effect=OSError('disk failure')):
            result, _stdout, stderr = self.publish()

        self.assertEqual(1, result)
        self.assertIn('disk failure', stderr)
        self.assertEqual([], list(self.report_path.parent.iterdir()))

    def test_report_and_remove_are_mutually_exclusive(self):
        with redirect_stderr(io.StringIO()), self.assertRaises(SystemExit) as error:
            cli.build_parser().parse_args(['demo', '--report', '--remove'])

        self.assertEqual(2, error.exception.code)

    def test_remove_still_executes_installer_for_current_demo(self):
        installer = self.home / 'uclusionInstall.py'
        installer.touch()
        args = cli.build_parser().parse_args(['-e', 'stage', 'demo', '--remove'])
        with (
            mock.patch.object(cli, 'UCLUSION_INSTALLER_SYMLINK', str(installer)),
            mock.patch.object(cli.os, 'execve') as execute,
        ):
            args.func(args)

        executable, arguments, environment = execute.call_args.args
        self.assertEqual(sys.executable, executable)
        self.assertEqual(
            [sys.executable, str(installer), cli.DEMO_REMOVE_MODE, 'stage'], arguments
        )
        self.assertEqual(str(self.home), environment['UCLUSION_HOME'])


if __name__ == '__main__':
    unittest.main()
