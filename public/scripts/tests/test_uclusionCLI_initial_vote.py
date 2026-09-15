import io
import json
import sys
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest import mock


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import uclusionCLI as cli


class InitialVoteCLITests(unittest.TestCase):
    def invoke(self, command, expected=None):
        args = cli.build_parser().parse_args(command)
        credentials = {'api_url': 'stage.example.com', 'api_token': 'test-token'}
        with mock.patch.object(cli, 'initialize', return_value=(credentials, {}, {})) as initialize, \
                mock.patch.object(cli, 'call_mcp_tool', return_value={'content': []}) as call_tool, \
                redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
            result = args.func(args)
        if expected is None:
            self.assertEqual(result, 2)
            initialize.assert_not_called()
            call_tool.assert_not_called()
        else:
            self.assertEqual(result, 0)
            call_tool.assert_called_once_with(credentials, args.mcp_name, expected)

    def test_question_flags_send_the_selected_option_and_explained_vote(self):
        self.invoke([
            'ask_question', '--job-id', 'J-example-1', '--question', 'Which approach?',
            '--option', 'First', 'First approach', '--option', 'Second', 'Second approach',
            '--vote-new-option-index', '1', '--vote-certainty', '4', '--vote-reason', 'Less maintenance.',
        ], {
            'job_id': 'J-example-1', 'question': 'Which approach?',
            'options': [{'name': 'First', 'description': 'First approach'},
                        {'name': 'Second', 'description': 'Second approach'}],
            'initial_vote': {'new_option_index': 1, 'certainty': 4, 'reason': 'Less maintenance.'},
        })

    def test_positional_question_alias_passes_vote_for_bug_conversion(self):
        self.invoke([
            'add_question', 'B-example-1', 'How should this be fixed?',
            '--option', 'Repair', 'Fix the existing behavior',
            '--vote-new-option-index', '0', '--vote-certainty', '5', '--vote-reason', 'Addresses the defect.',
        ], {
            'job_id': 'B-example-1', 'question': 'How should this be fixed?',
            'options': [{'name': 'Repair', 'description': 'Fix the existing behavior'}],
            'initial_vote': {'new_option_index': 0, 'certainty': 5, 'reason': 'Addresses the defect.'},
        })

    def test_option_addition_can_select_a_new_or_existing_option(self):
        for flag, value, selector in [
            ('--vote-new-option-index', '0', {'new_option_index': 0}),
            ('--vote-existing-option-id', 'O-3', {'existing_option_id': 'O-3'}),
        ]:
            with self.subTest(selector=selector):
                self.invoke([
                    'add_options', 'Q-example-1', '--option', 'Alternative', 'Another approach',
                    flag, value, '--vote-certainty', '4', '--vote-reason', 'Best fit for the constraints.',
                ], {
                    'question_id': 'Q-example-1',
                    'options': [{'name': 'Alternative', 'description': 'Another approach'}],
                    'initial_vote': {**selector, 'certainty': 4, 'reason': 'Best fit for the constraints.'},
                })

    def test_missing_or_invalid_vote_flags_fail_before_authentication(self):
        command = ['ask_question', '--job-id', 'J-example-1', '--question', 'Which approach?',
                   '--option', 'First', 'First approach']
        for flags in [
            [],
            ['--vote-new-option-index', '0', '--vote-certainty', '4', '--vote-reason', '  '],
            ['--vote-new-option-index', '1', '--vote-certainty', '4', '--vote-reason', 'Reason'],
        ]:
            with self.subTest(flags=flags):
                self.invoke(command + flags)

    def test_complete_json_is_forwarded_and_cannot_be_mixed_with_vote_flags(self):
        arguments = {
            'question_id': 'Q-example-1',
            'options': [{'name': 'Alternative', 'description': 'Another approach'}],
            'initial_vote': {'existing_option_id': 'O-2', 'certainty': 4, 'reason': 'Still preferred.'},
        }
        command = ['add_options', '--arguments-json', json.dumps(arguments)]
        self.invoke(command, arguments)
        self.invoke(command + ['--vote-reason', 'A conflicting source.'])

    def test_for_human_is_sent_only_when_asked_for_and_only_where_accepted(self):
        for command, expected in [
            (['add_info', 'J-example-1', 'Agreed, use the nightly file.', '--for-human'],
             {'short_code_id': 'J-example-1', 'info': 'Agreed, use the nightly file.',
              'for_human': True, 'tz': cli.local_timezone_name()}),
            (['approve', '--job-or-option-id', 'O-2', '--parent-question-short-code-id', 'Q-example-1',
              '--certainty', '4', '--reason', 'Keeps the record with us.', '--for-human'],
             {'job_or_option_id': 'O-2', 'parent_question_short_code_id': 'Q-example-1',
              'certainty': 4, 'reason': 'Keeps the record with us.', 'for_human': True}),
            (['make_suggestion', '--suggestion', 'Name the 06:00 window.', '--for-human'],
             {'suggestion': 'Name the 06:00 window.', 'for_human': True}),
        ]:
            with self.subTest(command=command[0]):
                self.invoke(command, expected)

    def test_omitting_for_human_leaves_the_record_authored_by_the_agent(self):
        self.invoke(['make_suggestion', '--suggestion', 'Name the 06:00 window.'],
                    {'suggestion': 'Name the 06:00 window.'})

    def test_a_relayed_question_can_carry_a_separately_relayed_vote(self):
        self.invoke([
            'ask_question', '--job-id', 'J-example-1', '--question', 'Which approach?',
            '--option', 'First', 'First approach',
            '--vote-new-option-index', '0', '--vote-certainty', '4',
            '--vote-reason', 'Fewest moving parts.', '--vote-for-human',
        ], {
            'job_id': 'J-example-1', 'question': 'Which approach?',
            'options': [{'name': 'First', 'description': 'First approach'}],
            'initial_vote': {'new_option_index': 0, 'certainty': 4,
                             'reason': 'Fewest moving parts.', 'for_human': True},
        })

    def test_vote_for_human_alone_is_not_a_vote(self):
        self.invoke([
            'add_options', 'Q-example-1', '--option', 'Alternative', 'Another approach',
            '--vote-for-human',
        ])

    def test_open_ended_question_has_no_vote_and_rejects_vote_flags(self):
        command = ['ask_question', '--job-id', 'J-example-1', '--question', 'What happened?']
        self.invoke(command, {'job_id': 'J-example-1', 'question': 'What happened?'})
        self.invoke(command + ['--vote-reason', 'No option to vote on.'])


if __name__ == '__main__':
    unittest.main()
