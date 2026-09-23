import io
import json
import sys
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest import mock


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import uclusionCLI as cli


class AddInfoCLITests(unittest.TestCase):
    def invoke(self, command, expected=None):
        credentials = {'api_url': 'stage.example.com', 'api_token': 'test-token'}
        with mock.patch.object(cli, 'initialize', return_value=(credentials, {}, {})) as initialize, \
                mock.patch.object(cli, 'call_mcp_tool', return_value={'content': []}) as call_tool, \
                mock.patch.object(cli, 'local_timezone_name', return_value='America/Los_Angeles'), \
                redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
            args = cli.build_parser().parse_args(['add_info'] + command)
            result = args.func(args)
        if expected is None:
            self.assertEqual(result, 2)
            initialize.assert_not_called()
            call_tool.assert_not_called()
        else:
            self.assertEqual(result, 0)
            call_tool.assert_called_once_with(credentials, 'add_info', expected)

    def test_flag_and_positional_creation_keep_human_authorship_and_timezone_defaults(self):
        for command in [
            ['--short-code-id', 'R-1', '--info', 'Agreed.', '--parent-question-short-code-id', 'Q-example-1'],
            ['R-1', 'Agreed.', 'Q-example-1'],
        ]:
            with self.subTest(command=command):
                self.invoke(command + ['--for-human'], {
                    'short_code_id': 'R-1', 'info': 'Agreed.',
                    'parent_question_short_code_id': 'Q-example-1', 'for_human': True,
                    'tz': 'America/Los_Angeles',
                })

    def test_update_sends_the_read_version_without_a_create_target(self):
        self.invoke([
            '--update-info-short-code-id', 'R-example-1', '--update-info-version', '7',
            '--info', 'Corrected finding.',
        ], {
            'update_info_short_code_id': 'R-example-1', 'update_info_version': 7,
            'info': 'Corrected finding.', 'tz': 'America/Los_Angeles',
        })

    def test_nested_update_preserves_question_attachment_and_timezone_inputs(self):
        attachment = {'file_name': 'result.txt', 'file_path': 'uploads/result.txt'}
        self.invoke([
            '--update-info-short-code-id', 'C-1', '--update-info-version', '2',
            '--info', 'Corrected reply.', '--parent-question-short-code-id', 'Q-example-1',
            '--tz', 'UTC', '--uploaded-file', json.dumps(attachment),
        ], {
            'update_info_short_code_id': 'C-1', 'update_info_version': 2,
            'info': 'Corrected reply.', 'parent_question_short_code_id': 'Q-example-1',
            'tz': 'UTC', 'uploaded_files': [attachment],
        })

    def test_incomplete_mixed_and_human_update_modes_fail_before_authentication(self):
        update = ['--update-info-short-code-id', 'R-example-1', '--update-info-version', '2']
        for command in [
            ['--info', 'Body.'],
            ['--update-info-short-code-id', 'R-example-1', '--info', 'Body.'],
            ['--update-info-version', '2', '--info', 'Body.'],
            ['--short-code-id', 'J-example-1', '--update-info-version', '2', '--info', 'Body.'],
            update,
            update + ['--info', 'Body.', '--for-human'],
            update + ['--info', 'Body.', '--short-code-id', 'J-example-1'],
            update + ['J-example-1', 'Body.'],
        ]:
            with self.subTest(command=command):
                self.invoke(command)

    def test_update_version_must_be_a_positive_integer(self):
        for version in ('0', '-1', '1.5', 'true'):
            with self.subTest(version=version), redirect_stderr(io.StringIO()):
                with self.assertRaises(SystemExit) as error:
                    cli.build_parser().parse_args([
                        'add_info', '--update-info-short-code-id', 'R-example-1',
                        '--update-info-version', version, '--info', 'Body.',
                    ])
                self.assertEqual(error.exception.code, 2)

    def test_complete_json_is_forwarded_unchanged_for_server_validation(self):
        arguments = {
            'update_info_short_code_id': 'R-example-1', 'update_info_version': 0,
            'info': 'Body.', 'for_human': True, 'uploaded_files': [],
        }
        command = ['--arguments-json', json.dumps(arguments)]
        self.invoke(command, arguments)
        for flags in [
            ['--update-info-short-code-id', 'R-example-2'],
            ['--update-info-version', '2'],
        ]:
            with self.subTest(flags=flags):
                self.invoke(command + flags)


if __name__ == '__main__':
    unittest.main()
