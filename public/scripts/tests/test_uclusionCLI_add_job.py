import io
import sys
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest import mock

SCRIPTS_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS_DIR))

import uclusionCLI as cli


class AddJobCLITestCase(unittest.TestCase):
    def test_optional_bug_ids_forward_with_existing_job_arguments(self):
        credentials = {'api_url': 'stage.example.com', 'api_token': 'test-token'}
        job_arguments = {
            'name': 'Fix upload failures',
            'description': 'Group related upload work.',
            'tasks': ['Check uploads', 'Document retry behavior'],
            'view_short_code_id': 'J-example-1',
        }
        bug_ids = ['B-example-1', 'B-example-2', 'B-example-1']
        for requested_bugs in (None, bug_ids):
            with self.subTest(bug_short_code_ids=requested_bugs):
                command = [
                    'add_job', '--name', job_arguments['name'],
                    '--description', job_arguments['description'],
                    '--task', job_arguments['tasks'][0],
                    '--task', job_arguments['tasks'][1],
                    '--view-short-code-id', job_arguments['view_short_code_id'],
                ]
                expected = dict(job_arguments)
                if requested_bugs is not None:
                    for short_code_id in requested_bugs:
                        command.extend(['--bug-short-code-id', short_code_id])
                    expected['bug_short_code_ids'] = requested_bugs
                args = cli.build_parser().parse_args(command)
                result = {'content': [{'type': 'text', 'text': 'Added job'}]}
                with mock.patch.object(
                    cli, 'initialize', return_value=(credentials, {}, {})
                ), mock.patch.object(
                    cli, 'call_mcp_tool', return_value=result
                ) as call_tool, redirect_stdout(io.StringIO()) as output:
                    self.assertEqual(0, args.func(args))
                call_tool.assert_called_once_with(credentials, 'add_job', expected)
                self.assertEqual('Added job\n', output.getvalue())


if __name__ == '__main__':
    unittest.main()
