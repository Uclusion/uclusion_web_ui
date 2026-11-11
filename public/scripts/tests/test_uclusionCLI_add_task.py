import io
import sys
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest import mock

SCRIPTS_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS_DIR))

import uclusionCLI as cli


class AddTaskCLITestCase(unittest.TestCase):
    def test_task_body_still_forwards(self):
        credentials = {'api_url': 'stage.example.com', 'api_token': 'test-token'}
        args = cli.build_parser().parse_args(['add_task', 'J-example-1', 'Write the note'])
        result = {'content': [{'type': 'text', 'text': 'Added task'}]}
        with mock.patch.object(cli, 'initialize', return_value=(credentials, {}, {})), \
                mock.patch.object(cli, 'call_mcp_tool', return_value=result) as call_tool, \
                redirect_stdout(io.StringIO()) as output:
            self.assertEqual(0, args.func(args))
        call_tool.assert_called_once_with(credentials, 'add_task', {
            'job_id': 'J-example-1',
            'task': 'Write the note',
        })
        self.assertEqual('Added task\n', output.getvalue())

    def test_bug_id_forwards_without_a_task_body(self):
        credentials = {'api_url': 'stage.example.com', 'api_token': 'test-token'}
        args = cli.build_parser().parse_args([
            'add_task', '--job-id', 'J-example-1', '--bug-short-code-id', 'B-example-1',
        ])
        result = {'content': [{'type': 'text', 'text': 'B-example-1: moved.'}]}
        with mock.patch.object(cli, 'initialize', return_value=(credentials, {}, {})), \
                mock.patch.object(cli, 'call_mcp_tool', return_value=result) as call_tool, \
                redirect_stdout(io.StringIO()):
            self.assertEqual(0, args.func(args))
        call_tool.assert_called_once_with(credentials, 'add_task', {
            'job_id': 'J-example-1',
            'bug_short_code_id': 'B-example-1',
        })

    def test_neither_or_both_are_refused_before_the_tool_call(self):
        commands = (
            ['add_task', '--job-id', 'J-example-1'],
            ['add_task', 'J-example-1', 'Write the note', '--bug-short-code-id', 'B-example-1'],
        )
        for command in commands:
            with self.subTest(command=command):
                args = cli.build_parser().parse_args(command)
                with mock.patch.object(cli, 'call_mcp_tool') as call_tool, \
                        redirect_stderr(io.StringIO()) as error:
                    self.assertEqual(2, args.func(args))
                call_tool.assert_not_called()
                self.assertIn('task', error.getvalue())


if __name__ == '__main__':
    unittest.main()
