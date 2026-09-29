import io
import sys
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest import mock


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import uclusionCLI as cli


class ResolveCLITests(unittest.TestCase):
    def invoke(self, command, expected):
        credentials = {'api_url': 'stage.example.com', 'api_token': 'test-token'}
        with mock.patch.object(cli, 'initialize', return_value=(credentials, {}, {})), \
                mock.patch.object(cli, 'call_mcp_tool', return_value={'content': []}) as call_tool, \
                mock.patch.object(cli, 'local_timezone_name', return_value='America/Los_Angeles'), \
                redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
            args = cli.build_parser().parse_args(['resolve'] + command)
            result = args.func(args)
        self.assertEqual(result, 0)
        call_tool.assert_called_once_with(credentials, 'resolve', expected)

    def test_resolve_without_a_note_sends_only_the_target(self):
        self.invoke(['B-all-1'], {'short_code_id': 'B-all-1'})

    def test_progress_note_defaults_the_timezone(self):
        self.invoke(['--short-code-id', 'B-all-1', '--progress-note', 'Fixed the timer.'], {
            'short_code_id': 'B-all-1',
            'progress_note': 'Fixed the timer.',
            'tz': 'America/Los_Angeles',
        })

    def test_progress_note_keeps_an_explicit_timezone(self):
        self.invoke(['B-all-1', '--progress-note', 'Fixed the timer.', '--tz', 'UTC'], {
            'short_code_id': 'B-all-1',
            'progress_note': 'Fixed the timer.',
            'tz': 'UTC',
        })


if __name__ == '__main__':
    unittest.main()
