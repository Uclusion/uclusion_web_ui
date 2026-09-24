"""S-Marketing-82: the CLI passes the stage the job is moving from, and requires it."""
import io
import sys
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest import mock


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import uclusionCLI as cli


CREDENTIALS = {'api_url': 'stage.example.com', 'api_token': 'test-token'}


class ChangeJobStageCLITests(unittest.TestCase):
    def run_command(self, command):
        args = cli.build_parser().parse_args(command)
        with mock.patch.object(cli, 'initialize', return_value=(CREDENTIALS, {}, {})), \
                mock.patch.object(cli, 'call_mcp_tool', return_value={'content': []}) as call_tool, \
                redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
            status = args.func(args)
        return status, call_tool

    def test_the_from_stage_reaches_the_tool(self):
        status, call_tool = self.run_command(
            ['change_job_stage', '--job-id', 'J-example-1', '--from-stage', 'Doable', '--stage', 'Reviewable'])
        self.assertEqual(0, status)
        call_tool.assert_called_once_with(
            CREDENTIALS, 'change_job_stage', {'job_id': 'J-example-1', 'from_stage': 'Doable', 'stage': 'Reviewable'})

    def test_a_move_without_a_from_stage_is_not_sent(self):
        status, call_tool = self.run_command(['change_job_stage', '--job-id', 'J-example-1', '--stage', 'Reviewable'])
        self.assertNotEqual(0, status)
        call_tool.assert_not_called()


if __name__ == '__main__':
    unittest.main()
