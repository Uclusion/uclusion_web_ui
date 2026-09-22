import io
import sys
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest import mock


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import uclusionCLI as cli


class UpdateOptionCLITests(unittest.TestCase):
    def test_option_edit_and_acceptance_each_use_one_mcp_call(self):
        credentials = {'api_url': 'stage.example.com', 'api_token': 'test-token'}
        option = {
            'parent_question_short_code_id': 'Q-example-1',
            'option_id': 'O-1',
            'name': 'Nightly export',
            'description': 'Export at 06:00 UTC.',
        }
        for suggestion in (None, 'S-1'):
            with self.subTest(suggestion=suggestion):
                command = [
                    'update_option', '--parent-question-short-code-id', option['parent_question_short_code_id'],
                    '--option-id', option['option_id'], '--name', option['name'],
                    '--description', option['description'],
                ]
                expected = dict(option)
                if suggestion is not None:
                    command.extend(['--resolve-suggestion-short-code-id', suggestion])
                    expected['resolve_suggestion_short_code_id'] = suggestion
                args = cli.build_parser().parse_args(command)
                with mock.patch.object(cli, 'initialize', return_value=(credentials, {}, {})), \
                        mock.patch.object(cli, 'call_mcp_tool', return_value={'content': []}) as call_tool, \
                        redirect_stdout(io.StringIO()):
                    self.assertEqual(args.func(args), 0)
                call_tool.assert_called_once_with(credentials, 'update_option', expected)


if __name__ == '__main__':
    unittest.main()
