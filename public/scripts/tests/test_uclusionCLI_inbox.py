import io
import sys
import tempfile
import time
import unittest
from contextlib import closing, redirect_stderr, redirect_stdout
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

    def test_listen_max_seconds_defaults_to_unlimited(self):
        args = cli.build_parser().parse_args(['-e', 'stage', 'listen'])
        self.assertIsNone(args.max_seconds)

    def test_listen_max_seconds_parses(self):
        args = cli.build_parser().parse_args(
            ['-e', 'stage', 'listen', '--max-seconds', '1500']
        )
        self.assertEqual(args.max_seconds, 1500)

    def test_deliver_flag_defaults_false_and_parses(self):
        args = cli.build_parser().parse_args(['-e', 'stage', 'listen'])
        self.assertFalse(args.deliver_existing_pokes)
        args = cli.build_parser().parse_args(
            ['-e', 'stage', 'listen', '--deliver-existing-pokes']
        )
        self.assertTrue(args.deliver_existing_pokes)
        args = cli.build_parser().parse_args(
            ['-e', 'stage', 'wait', '--timeout', '0',
             '--deliver-existing-pokes']
        )
        self.assertTrue(args.deliver_existing_pokes)

    def test_deliver_and_ignore_flags_are_mutually_exclusive(self):
        with redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit):
                cli.build_parser().parse_args(
                    ['-e', 'stage', 'listen', '--ignore-existing-pokes',
                     '--deliver-existing-pokes']
                )
            with self.assertRaises(SystemExit):
                cli.build_parser().parse_args(
                    ['-e', 'stage', 'wait', '--timeout', '0',
                     '--ignore-existing-pokes', '--deliver-existing-pokes']
                )


class WaitCommandCutoffTests(InboxTestCase):
    def run_wait(self, ignore_existing_pokes, consumer='default',
                 deliver_existing_pokes=False):
        args = SimpleNamespace(
            env='stage',
            timeout=0,
            consumer=consumer,
            ignore_existing_pokes=ignore_existing_pokes,
            deliver_existing_pokes=deliver_existing_pokes,
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

    def test_wait_fresh_session_consumer_skips_backlog(self):
        self.enqueue('Start T-all-1', 'm1')
        result, output = self.run_wait(
            ignore_existing_pokes=False, consumer='session-fresh1'
        )
        self.assertEqual(result, 0)
        self.assertEqual(output, '')

    def test_wait_deliver_flag_gives_fresh_consumer_the_backlog(self):
        self.enqueue('Start T-all-1', 'm1')
        self.enqueue('Responded J-all-2', 'm2')
        result, output = self.run_wait(
            ignore_existing_pokes=False, consumer='session-fresh2',
            deliver_existing_pokes=True,
        )
        self.assertEqual(result, 0)
        self.assertEqual(output, 'Start T-all-1\nResponded J-all-2\n')


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
        ), mock.patch.object(
            cli, 'stop_other_cursor_listeners'
        ) as stop_others, mock.patch.object(cli.time, 'sleep'):
            with self.assertRaises(StopListening):
                cli.cmd_listen(args)
        stop_others.assert_not_called()
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


class ListenMaxSecondsTests(unittest.TestCase):
    def run_listen(self, max_seconds, prompts, clock):
        args = SimpleNamespace(
            env='stage',
            consumer='session-cursor-1',
            ignore_existing_pokes=False,
            deliver_existing_pokes=False,
            max_seconds=max_seconds,
        )
        claims = []

        def fake_next_prompt(environment, workspace_id, consumer):
            claims.append((environment, workspace_id, consumer))
            if not prompts:
                return None
            return prompts.pop(0)

        stdout = io.StringIO()
        with mock.patch.object(
            cli, 'get_env_paths',
            return_value=('api', 'stage_uclusion.json', 'creds'),
        ), mock.patch.object(
            cli, 'load_config', return_value={'workspaceId': 'w1'}
        ), mock.patch.object(
            cli, 'start_new_consumer_at_arm_time'
        ), mock.patch.object(
            cli, 'next_prompt', side_effect=fake_next_prompt
        ), mock.patch.object(
            cli, 'check_wait_update_notice', return_value=None
        ), mock.patch.object(
            cli, 'is_orphaned', return_value=False
        ), mock.patch.object(
            cli, 'stop_other_cursor_listeners'
        ) as stop_others, mock.patch.object(
            cli.time, 'monotonic', side_effect=clock
        ), mock.patch.object(cli.time, 'sleep'), redirect_stdout(stdout):
            result = cli.cmd_listen(args)
        return result, stdout.getvalue(), claims, stop_others

    def test_limit_prints_rearm_without_taking_a_later_prompt(self):
        result, output, claims, stop_others = self.run_listen(
            1500,
            ['Added T-1 of J-1', 'Responded J-1'],
            # Deadline, the update clock, the first loop check, then the limit.
            iter([0, 0, 0, 1500]),
        )
        self.assertEqual(result, 0)
        self.assertEqual(
            output,
            'Added T-1 of J-1\nUclusion listener rearm session-cursor-1\n',
        )
        self.assertEqual(claims, [('stage', 'w1', 'session-cursor-1')])
        stop_others.assert_called_once_with()

    def test_limit_already_reached_claims_nothing(self):
        result, output, claims, stop_others = self.run_listen(
            1500, ['Added T-1 of J-1'], iter([0, 0, 1500])
        )
        self.assertEqual(result, 0)
        self.assertEqual(output, 'Uclusion listener rearm session-cursor-1\n')
        self.assertEqual(claims, [])
        stop_others.assert_called_once_with()

    def test_non_positive_limit_exits_before_claiming(self):
        result, output, claims, stop_others = self.run_listen(
            0, ['Added T-1 of J-1'], iter([])
        )
        self.assertEqual(result, 1)
        self.assertIn('--max-seconds must be greater than zero', output)
        self.assertEqual(claims, [])
        stop_others.assert_not_called()


class CursorListenerStopTests(unittest.TestCase):
    def test_ps_listing_splits_pid_and_arguments(self):
        listing = (
            '  10 /usr/bin/uclusion -e stage listen --max-seconds 1500\n'
            'not-a-pid ignored\n'
            '  11 \n'
        )
        self.assertEqual(
            cli.argvs_from_ps_listing(listing),
            [(10, ['/usr/bin/uclusion', '-e', 'stage', 'listen', '--max-seconds', '1500'])],
        )

    def test_only_other_limited_listeners_are_selected(self):
        processes = [
            (10, ['uclusion', '-e', 'stage', 'listen', '--max-seconds', '1500']),
            (11, ['uclusion', '-e', 'stage', 'listen']),
            (12, ['bash', '-lc', 'uclusion -e stage listen --max-seconds 1500']),
            (13, ['uclusion', 'listen', '--max-seconds', '1500']),
            (14, ['bash', 'uclusion', 'listen', '--max-seconds', '1500']),
        ]
        self.assertEqual(cli.other_cursor_listener_pids(13, 14, processes), [10])

    def test_stop_signals_the_selected_listener(self):
        processes = [
            (10, ['uclusion', 'listen', '--max-seconds', '1500']),
            (13, ['uclusion', 'listen', '--max-seconds', '1500']),
        ]
        with mock.patch.object(
            cli, 'read_process_argvs', return_value=processes
        ), mock.patch.object(
            cli.os, 'getpid', return_value=13
        ), mock.patch.object(
            cli.os, 'getppid', return_value=14
        ), mock.patch.object(cli.os, 'kill') as kill:
            cli.stop_other_cursor_listeners()
        kill.assert_called_once_with(10, cli.signal.SIGTERM)


class ConsumerResolutionTests(unittest.TestCase):
    def setUp(self):
        patcher = mock.patch.dict(cli.os.environ)
        patcher.start()
        self.addCleanup(patcher.stop)
        cli.os.environ.pop(cli.CONSUMER_ENV_VAR, None)
        cli.os.environ.pop(cli.CLAUDE_SESSION_ENV_VAR, None)

    def test_explicit_consumer_beats_environment(self):
        cli.os.environ[cli.CONSUMER_ENV_VAR] = 'env-name'
        self.assertEqual('mine', cli.resolve_consumer('mine', is_listener=True))
        self.assertEqual('mine', cli.resolve_consumer('mine', is_listener=False))

    def test_environment_variable_names_the_session(self):
        cli.os.environ[cli.CONSUMER_ENV_VAR] = 'env-name'
        self.assertEqual('env-name', cli.resolve_consumer(None, is_listener=True))
        self.assertEqual('env-name', cli.resolve_consumer(None, is_listener=False))

    def test_listener_defaults_to_fresh_session_identity(self):
        first = cli.resolve_consumer(None, is_listener=True)
        second = cli.resolve_consumer(None, is_listener=True)
        self.assertTrue(first.startswith(cli.SESSION_CONSUMER_PREFIX))
        self.assertNotEqual(first, second)

    def test_wait_falls_back_to_shared_default(self):
        self.assertEqual(cli.DEFAULT_CONSUMER,
                         cli.resolve_consumer(None, is_listener=False))

    def test_claude_code_listener_keeps_its_sessions_cursor(self):
        """Q-Marketing-198 O-1: every listener a session arms shares one cursor."""
        cli.os.environ[cli.CLAUDE_SESSION_ENV_VAR] = 'cd2af58a'
        first = cli.resolve_consumer(None, is_listener=True)
        self.assertEqual(cli.SESSION_CONSUMER_PREFIX + 'claude-cd2af58a', first)
        self.assertEqual(first, cli.resolve_consumer(None, is_listener=True))
        self.assertEqual(cli.DEFAULT_CONSUMER, cli.resolve_consumer(None, is_listener=False))

    def test_named_consumers_still_beat_the_claude_session(self):
        cli.os.environ[cli.CLAUDE_SESSION_ENV_VAR] = 'cd2af58a'
        self.assertEqual('mine', cli.resolve_consumer('mine', is_listener=True))
        cli.os.environ[cli.CONSUMER_ENV_VAR] = 'env-name'
        self.assertEqual('env-name', cli.resolve_consumer(None, is_listener=True))


class BroadcastDeliveryTests(InboxTestCase):
    def test_every_session_consumer_sees_every_prompt(self):
        self.enqueue('Poke one', 'm1')
        self.enqueue('Poke two', 'm2')
        first = cli.generate_session_consumer()
        second = cli.generate_session_consumer()
        self.assertEqual(
            ['Poke one', 'Poke two'],
            [cli.next_prompt('stage', 'w1', first) for _ in range(2)],
        )
        self.assertEqual(
            ['Poke one', 'Poke two'],
            [cli.next_prompt('stage', 'w1', second) for _ in range(2)],
        )
        self.assertIsNone(cli.next_prompt('stage', 'w1', first))

    def test_fresh_session_consumer_starts_past_backlog(self):
        self.enqueue('Start J-all-44', 'm1')
        consumer = cli.generate_session_consumer()
        cli.start_new_consumer_at_arm_time('stage', 'w1', consumer)
        self.assertIsNone(cli.next_prompt('stage', 'w1', consumer))
        self.enqueue('Responded J-all-10', 'm2')
        self.assertEqual(
            'Responded J-all-10',
            cli.next_prompt('stage', 'w1', consumer),
        )

    def test_rearmed_session_listener_delivers_what_arrived_in_between(self):
        """Q-Marketing-198 O-1: nothing is lost between one listener ending and the next."""
        with mock.patch.dict(cli.os.environ, {cli.CLAUDE_SESSION_ENV_VAR: 'cd2af58a'}):
            cli.os.environ.pop(cli.CONSUMER_ENV_VAR, None)
            self.enqueue('Start J-all-44', 'm1')
            first_listener = cli.resolve_consumer(None, is_listener=True)
            cli.start_new_consumer_at_arm_time('stage', 'w1', first_listener)
            self.enqueue('Added T-all-45 of J-all-44', 'm2')
            self.assertEqual('Added T-all-45 of J-all-44', cli.next_prompt('stage', 'w1', first_listener))
            # The first listener has ended; this arrives before the next one is armed.
            self.enqueue('Responded Q-all-46 of J-all-44', 'm3')
            second_listener = cli.resolve_consumer(None, is_listener=True)
            cli.start_new_consumer_at_arm_time('stage', 'w1', second_listener)
            self.assertEqual('Responded Q-all-46 of J-all-44', cli.next_prompt('stage', 'w1', second_listener))

    def test_established_consumer_backlog_is_not_skipped(self):
        self.enqueue('Start J-all-44', 'm1')
        consumer = cli.generate_session_consumer()
        cli.next_prompt('stage', 'w1', consumer)
        self.enqueue('Updated J-all-10', 'm2')
        cli.start_new_consumer_at_arm_time('stage', 'w1', consumer)
        self.assertEqual(
            'Updated J-all-10',
            cli.next_prompt('stage', 'w1', consumer),
        )

    def test_default_consumer_backlog_is_never_skipped(self):
        self.enqueue('Start J-all-44', 'm1')
        cli.start_new_consumer_at_arm_time('stage', 'w1', cli.DEFAULT_CONSUMER)
        self.assertEqual(
            'Start J-all-44',
            cli.next_prompt('stage', 'w1', cli.DEFAULT_CONSUMER),
        )

    def test_empty_inbox_arm_skips_nothing(self):
        consumer = cli.generate_session_consumer()
        cli.start_new_consumer_at_arm_time('stage', 'w1', consumer)
        self.enqueue('Start J-all-44', 'm1')
        self.assertEqual(
            'Start J-all-44',
            cli.next_prompt('stage', 'w1', consumer),
        )

    def test_stale_session_cursors_are_garbage_collected(self):
        now = time.time()
        stale_age = now - cli.MESSAGE_RETENTION_SECONDS - 60
        with closing(cli.open_inbox()) as connection, connection:
            connection.execute(
                '''
                INSERT INTO poke_consumers
                    (environment, workspace_id, consumer, last_sequence,
                     updated_at)
                VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)
                ''',
                ('stage', 'w1', 'stale-session', 5, stale_age,
                 'stage', 'w1', 'live-session', 5, now),
            )
            connection.execute(
                '''
                INSERT INTO poke_consumers
                    (environment, workspace_id, consumer, last_sequence,
                     updated_at)
                VALUES (?, ?, ?, ?, ?)
                ''',
                (
                    'stage',
                    'w1',
                    cli.CODEX_BRIDGE_CONSUMER_PREFIX + 'private',
                    5,
                    stale_age,
                ),
            )
        cli.next_prompt('stage', 'w1', 'anyone')
        self.assertIsNone(self.cursor_for('stale-session'))
        self.assertEqual(5, self.cursor_for('live-session'))
        self.assertEqual(
            5,
            self.cursor_for(
                cli.CODEX_BRIDGE_CONSUMER_PREFIX + 'private'
            ),
        )


if __name__ == '__main__':
    unittest.main()
