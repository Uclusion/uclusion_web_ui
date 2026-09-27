import io
import sys
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest import mock


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import uclusionCLI as cli


class ClearNotificationsCLITests(unittest.TestCase):
    """T-Marketing-295: the package's terminal record travels with the clear."""

    def invoke(self, command, expected=None):
        credentials = {'api_url': 'stage.example.com', 'api_token': 'test-token'}
        with mock.patch.object(cli, 'initialize', return_value=(credentials, {}, {})) as initialize, \
                mock.patch.object(cli, 'call_mcp_tool', return_value={'content': []}) as call_tool, \
                mock.patch.object(cli, 'local_timezone_name', return_value='America/Los_Angeles'), \
                redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
            args = cli.build_parser().parse_args(['clear_notifications'] + command)
            result = args.func(args)
        if expected is None:
            self.assertEqual(result, 2)
            initialize.assert_not_called()
            call_tool.assert_not_called()
        else:
            self.assertEqual(result, 0)
            call_tool.assert_called_once_with(credentials, 'clear_notifications', expected)

    def test_a_clear_without_a_record_sends_only_its_target(self):
        self.invoke(['--short-code-id', 'J-all-1'], {'short_code_id': 'J-all-1'})

    def test_a_record_is_sent_with_the_local_timezone_by_default(self):
        self.invoke(['--short-code-id', 'J-all-1', '--record-short-code-id', 'C-all-9',
                     '--record-info', 'Completed 1 and 2.'], {
            'short_code_id': 'J-all-1',
            'record': {'short_code_id': 'C-all-9', 'info': 'Completed 1 and 2.',
                       'tz': 'America/Los_Angeles'},
        })

    def test_a_record_keeps_an_explicit_timezone(self):
        self.invoke(['--short-code-id', 'J-all-1', '--record-short-code-id', 'C-all-9',
                     '--record-info', 'Done.', '--record-tz', 'UTC'], {
            'short_code_id': 'J-all-1',
            'record': {'short_code_id': 'C-all-9', 'info': 'Done.', 'tz': 'UTC'},
        })

    def test_a_partial_record_is_refused_before_any_call(self):
        for command in (
            ['--record-short-code-id', 'C-all-9'],
            ['--record-info', 'Done.'],
            ['--record-short-code-id', 'C-all-9', '--record-info', '  '],
            ['--record-tz', 'UTC'],
        ):
            with self.subTest(command=command):
                self.invoke(['--short-code-id', 'J-all-1'] + command)

    def test_record_flags_cannot_be_combined_with_arguments_json(self):
        self.invoke(['--arguments-json', '{"short_code_id": "J-all-1"}',
                     '--record-short-code-id', 'C-all-9', '--record-info', 'Done.'])


if __name__ == '__main__':
    unittest.main()
