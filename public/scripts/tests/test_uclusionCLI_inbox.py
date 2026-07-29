import io
import sys
import tempfile
import time
import unittest
from contextlib import closing, redirect_stdout
from pathlib import Path
from types import SimpleNamespace
from unittest import mock


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS_DIR))

import uclusionCLI as cli


class StopListening(Exception):
    """Raised from a patched next_prompt to end cmd_listen's infinite loop."""


class InboxTestCase(unittest.TestCase):
    def setUp(self):
        tempdir = tempfile.TemporaryDirectory()
        self.addCleanup(tempdir.cleanup)
        inbox_path = str(Path(tempdir.name) / 'poke_inbox.sqlite3')
        patcher = mock.patch.object(
            cli, 'get_inbox_path', return_value=inbox_path
        )
        patcher.start()
        self.addCleanup(patcher.stop)

    def enqueue(self, message, message_id, environment='stage',
                workspace_id='w1'):
        with closing(cli.open_inbox()) as connection, connection:
            connection.execute(
                '''
                INSERT INTO poke_messages
                    (message_id, environment, workspace_id, message,
                     received_at)
                VALUES (?, ?, ?, ?, ?)
                ''',
                (message_id, environment, workspace_id, message, time.time()),
            )

    def row_count(self):
        with closing(cli.open_inbox()) as connection:
            return connection.execute(
                'SELECT COUNT(*) FROM poke_messages'
            ).fetchone()[0]

    def cursor_for(self, consumer, environment='stage', workspace_id='w1'):
        with closing(cli.open_inbox()) as connection:
            row = connection.execute(
                '''
                SELECT last_sequence FROM poke_consumers
                WHERE environment = ? AND workspace_id = ? AND consumer = ?
                ''',
                (environment, workspace_id, consumer),
            ).fetchone()
            return None if row is None else row[0]


class IgnoreExistingPromptsTests(InboxTestCase):
    def test_cutoff_skips_backlog_and_delivers_later_arrivals(self):
        self.enqueue('Start T-all-1', 'm1')
        self.enqueue('Responded J-all-2', 'm2')
        cli.ignore_existing_prompts('stage', 'w1', 'default')
        self.assertIsNone(cli.next_prompt('stage', 'w1', 'default'))
        self.enqueue('Start J-all-3', 'm3')
        self.assertEqual(
            cli.next_prompt('stage', 'w1', 'default'), 'Start J-all-3'
        )

    def test_cutoff_deletes_no_rows(self):
        self.enqueue('Start T-all-1', 'm1')
        self.enqueue('Responded J-all-2', 'm2')
        cli.ignore_existing_prompts('stage', 'w1', 'default')
        self.assertEqual(self.row_count(), 2)

    def test_cutoff_moves_only_the_named_consumer(self):
        self.enqueue('Start T-all-1', 'm1')
        cli.ignore_existing_prompts('stage', 'w1', 'default')
        self.assertEqual(
            cli.next_prompt('stage', 'w1', 'other'), 'Start T-all-1'
        )

    def test_cutoff_scoped_to_environment_and_workspace(self):
        self.enqueue('Start T-all-1', 'm1', environment='stage')
        self.enqueue('Start T-all-2', 'm2', environment='production')
        self.enqueue('Start T-all-3', 'm3', workspace_id='w2')
        cli.ignore_existing_prompts('stage', 'w1', 'default')
        self.assertIsNone(cli.next_prompt('stage', 'w1', 'default'))
        self.assertEqual(
            cli.next_prompt('production', 'w1', 'default'), 'Start T-all-2'
        )
        self.assertEqual(
            cli.next_prompt('stage', 'w2', 'default'), 'Start T-all-3'
        )

    def test_cutoff_never_moves_cursor_backward(self):
        self.enqueue('Start T-all-1', 'm1')
        with closing(cli.open_inbox()) as connection, connection:
            connection.execute(
                '''
                INSERT INTO poke_consumers
                    (environment, workspace_id, consumer, last_sequence,
                     updated_at)
                VALUES (?, ?, ?, ?, ?)
                ''',
                ('stage', 'w1', 'default', 100, time.time()),
            )
        cli.ignore_existing_prompts('stage', 'w1', 'default')
        self.assertEqual(self.cursor_for('default'), 100)

    def test_cutoff_on_empty_inbox_is_a_noop(self):
        cli.ignore_existing_prompts('stage', 'w1', 'default')
        self.assertIsNone(self.cursor_for('default'))
        self.assertIsNone(cli.next_prompt('stage', 'w1', 'default'))


class IgnoreExistingPokesParserTests(unittest.TestCase):
    def test_wait_flag_defaults_false(self):
        args = cli.build_parser().parse_args(
            ['-e', 'stage', 'wait', '--timeout', '0']
        )
        self.assertFalse(args.ignore_existing_pokes)

    def test_wait_flag_parses(self):
        args = cli.build_parser().parse_args(
            ['-e', 'stage', 'wait', '--timeout', '0',
             '--ignore-existing-pokes']
        )
        self.assertTrue(args.ignore_existing_pokes)

    def test_listen_flag_defaults_false(self):
        args = cli.build_parser().parse_args(['-e', 'stage', 'listen'])
        self.assertFalse(args.ignore_existing_pokes)

    def test_listen_flag_parses(self):
        args = cli.build_parser().parse_args(
            ['-e', 'stage', 'listen', '--ignore-existing-pokes']
        )
        self.assertTrue(args.ignore_existing_pokes)


class WaitCommandCutoffTests(InboxTestCase):
    def run_wait(self, ignore_existing_pokes):
        args = SimpleNamespace(
            env='stage',
            timeout=0,
            consumer='default',
            ignore_existing_pokes=ignore_existing_pokes,
        )
        buffer = io.StringIO()
        with mock.patch.object(
            cli, 'get_env_paths',
            return_value=('api', 'stage_uclusion.json', 'creds'),
        ), mock.patch.object(
            cli, 'load_config', return_value={'workspaceId': 'w1'}
        ), mock.patch.object(
            cli, 'check_wait_update_notice', return_value=None
        ), redirect_stdout(buffer):
            result = cli.cmd_wait(args)
        return result, buffer.getvalue()

    def test_wait_with_flag_skips_backlog(self):
        self.enqueue('Start T-all-1', 'm1')
        self.enqueue('Responded J-all-2', 'm2')
        result, output = self.run_wait(ignore_existing_pokes=True)
        self.assertEqual(result, 0)
        self.assertEqual(output, '')

    def test_wait_after_flagged_run_still_delivers_new_prompts(self):
        self.enqueue('Start T-all-1', 'm1')
        self.run_wait(ignore_existing_pokes=True)
        self.enqueue('Start J-all-3', 'm3')
        result, output = self.run_wait(ignore_existing_pokes=False)
        self.assertEqual(result, 0)
        self.assertEqual(output, 'Start J-all-3\n')

    def test_wait_without_flag_delivers_backlog(self):
        self.enqueue('Start T-all-1', 'm1')
        result, output = self.run_wait(ignore_existing_pokes=False)
        self.assertEqual(result, 0)
        self.assertEqual(output, 'Start T-all-1\n')


class ListenCommandCutoffTests(unittest.TestCase):
    def run_listen(self, ignore_existing_pokes):
        calls = []

        def fake_cutoff(environment, workspace_id, consumer):
            calls.append(('cutoff', environment, workspace_id, consumer))

        def fake_next_prompt(environment, workspace_id, consumer):
            calls.append(('claim', environment, workspace_id, consumer))
            raise StopListening()

        args = SimpleNamespace(
            env='stage',
            consumer='default',
            ignore_existing_pokes=ignore_existing_pokes,
        )
        with mock.patch.object(
            cli, 'get_env_paths',
            return_value=('api', 'stage_uclusion.json', 'creds'),
        ), mock.patch.object(
            cli, 'load_config', return_value={'workspaceId': 'w1'}
        ), mock.patch.object(
            cli, 'ignore_existing_prompts', side_effect=fake_cutoff
        ), mock.patch.object(
            cli, 'next_prompt', side_effect=fake_next_prompt
        ), mock.patch.object(
            cli, 'check_wait_update_notice', return_value=None
        ), mock.patch.object(cli.time, 'sleep'):
            with self.assertRaises(StopListening):
                cli.cmd_listen(args)
        return calls

    def test_listen_flag_applies_cutoff_before_first_claim(self):
        calls = self.run_listen(ignore_existing_pokes=True)
        self.assertEqual(
            calls,
            [
                ('cutoff', 'stage', 'w1', 'default'),
                ('claim', 'stage', 'w1', 'default'),
            ],
        )

    def test_listen_without_flag_never_applies_cutoff(self):
        calls = self.run_listen(ignore_existing_pokes=False)
        self.assertEqual(calls, [('claim', 'stage', 'w1', 'default')])


if __name__ == '__main__':
    unittest.main()
