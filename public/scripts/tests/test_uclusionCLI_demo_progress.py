"""demo --progress estimates a running exercise from the owner's watch log."""

import io
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest import mock


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS_DIR))

import uclusionCLI as cli


DEMO_CLIENT_ID = 'ai-demo:3f2b8c1a-1111-4222-8333-944455556666:human_owner'
QUESTION = '7abd3fa4-d7ec-43c9-92cb-5dc877608012'
SUGGESTION = 'cbbce4da-dbe6-48fd-815e-96d1f17b2edf'
CAPSULE = '3dac0244-15b5-564d-b45c-b0d2f55c9dd6'
REVIEW = '8301f242-bdf4-44aa-ac22-badc0baaf89d'

# What the owner's watch logged while the exercise's records were replayed on
# stage: question, owner's suggestion, option revised, owner's vote, capsule
# updated, review opened, owner's `all`, final clear.
REPLAY = (
    ('NOT_FULLY_VOTED', QUESTION),
    ('NOT_FULLY_VOTED', QUESTION),
    ('UNREAD_RESOLVED', SUGGESTION),
    ('NOT_FULLY_VOTED', QUESTION),
    ('NOT_FULLY_VOTED', QUESTION),
    ('UNREAD_RESOLVED', SUGGESTION),
    ('UNREAD_COMMENT', CAPSULE),
    ('UNREAD_REVIEWABLE', REVIEW),
    ('UNREAD_REVIEWABLE', REVIEW),
    ('UNREAD_COMMENT', CAPSULE),
)


def entries(pushes):
    return [('2026-09-23T21:29:00Z', kind, row) for kind, row in pushes]


class DemoProgressEstimateTests(unittest.TestCase):
    def estimate(self, pushes):
        return cli.demo_progress_estimate(entries(pushes))

    def test_nothing_yet_says_the_evaluator_is_reading(self):
        percent, message = self.estimate(())
        self.assertEqual(5, percent)
        self.assertIn('reading its job', message)

    def test_each_milestone_of_the_replay_is_recognised_in_order(self):
        cases = (
            (1, 25, 'question with options'),
            (3, 50, 'suggested change'),
            (8, 80, 'opened its completion review'),
            (9, 90, 'answered the completion review'),
        )
        for count, percent, phrase in cases:
            with self.subTest(count=count):
                estimate, message = self.estimate(REPLAY[:count])
                self.assertEqual(percent, estimate)
                self.assertIn(phrase, message)

    def test_the_estimate_never_goes_backwards_through_the_replay(self):
        estimates = [self.estimate(REPLAY[:n])[0] for n in range(len(REPLAY) + 1)]
        self.assertEqual(estimates, sorted(estimates))

    def test_pushes_alone_never_reach_the_next_milestone(self):
        # Removals and updates are routine, so a pile of pushes of an
        # unrelated type must not pass for the review having opened.
        many = (('NOT_FULLY_VOTED', QUESTION),) + (('UNREAD_COMMENT', CAPSULE),) * 40
        percent, message = self.estimate(many)
        self.assertLess(percent, 50)
        self.assertIn('question with options', message)

    def test_one_push_on_a_review_row_is_the_review_opening_not_its_answer(self):
        percent, message = self.estimate((('UNREAD_REVIEWABLE', REVIEW),))
        self.assertEqual(80, percent)
        self.assertIn('opened', message)

    def test_a_second_review_row_opening_is_not_the_owner_answering(self):
        other = 'aaaaaaaa-bdf4-44aa-ac22-badc0baaf89d'
        percent, message = self.estimate(
            (('UNREAD_REVIEWABLE', REVIEW), ('UNREAD_REVIEWABLE', other))
        )
        self.assertLess(percent, 90)
        self.assertIn('opened', message)

    def test_the_estimate_never_claims_the_run_is_over(self):
        percent, _message = self.estimate(REPLAY + (('UNREAD_COMMENT', CAPSULE),) * 50)
        self.assertLess(percent, 100)

    def test_the_line_names_the_count_and_the_milestone(self):
        line = cli.demo_progress_line(entries(REPLAY[:3]))
        self.assertTrue(line.startswith('About 50% through: '), line)
        self.assertIn('(3 notification changes so far)', line)


class DemoProgressCommandTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.log = Path(temporary.name) / 'demo-notifications.log'
        for target, value in (
            ('demo_notification_log_path', str(self.log)),
            ('get_credentials', {'secret_key_id': DEMO_CLIENT_ID,
                                 'secret_key': 'secret'}),
        ):
            patcher = mock.patch.object(cli, target, return_value=value)
            patcher.start()
            self.addCleanup(patcher.stop)

    def write(self, pushes):
        with open(self.log, 'a', encoding='utf-8') as handle:
            for stamp, kind, row in entries(pushes):
                handle.write(f'{stamp}\t{kind}\t{row}\n')

    def run_demo(self, *flags):
        args = cli.build_parser().parse_args(['-e', 'stage', 'demo', *flags])
        stdout, stderr = io.StringIO(), io.StringIO()
        with redirect_stdout(stdout), redirect_stderr(stderr):
            result = args.func(args)
        return result, stdout.getvalue(), stderr.getvalue()

    def test_it_prints_one_line_from_the_log(self):
        self.write(REPLAY[:8])
        result, stdout, stderr = self.run_demo('--progress')
        self.assertEqual(0, result, stderr)
        self.assertEqual(1, len(stdout.splitlines()))
        self.assertIn('About 80% through', stdout)

    def test_it_reads_nothing_but_the_log(self):
        # A job read costs the caller tokens and a script cannot tell what
        # the job's text means; the estimate never goes to the network.
        self.write(REPLAY[:3])
        with mock.patch.object(cli, 'call_mcp_tool') as call, \
                mock.patch.object(cli, 'login') as login:
            result, _stdout, _stderr = self.run_demo('--progress')
        self.assertEqual(0, result)
        call.assert_not_called()
        login.assert_not_called()

    def test_it_refuses_outside_a_demo_install(self):
        for credentials in (None, {'secret_key_id': 'person-client',
                                   'secret_key': 'secret'}):
            with self.subTest(credentials=credentials), mock.patch.object(
                cli, 'get_credentials', return_value=credentials
            ):
                result, stdout, stderr = self.run_demo('--progress')
                self.assertEqual(1, result)
                self.assertEqual('', stdout)
                self.assertIn('disposable demo install', stderr)

    def test_wait_returns_as_soon_as_the_estimate_moves(self):
        self.write(REPLAY[:9])
        ticks = []

        def sleep(_seconds):
            ticks.append(1)
            if len(ticks) == 2:
                # The final clear's push leaves the rounded estimate where it
                # was, so it must not wake the caller; the next push moves it.
                self.write(REPLAY[9:10])
            if len(ticks) == 4:
                self.write((('UNREAD_COMMENT', CAPSULE),))

        with mock.patch.object(cli.time, 'sleep', side_effect=sleep):
            result, stdout, _stderr = self.run_demo('--progress', '--wait')
        self.assertEqual(0, result)
        self.assertEqual(4, len(ticks))
        self.assertIn('About 95% through', stdout)
        self.assertNotIn('No change', stdout)

    def test_wait_gives_up_and_says_nothing_changed(self):
        self.write(REPLAY[:1])
        clock = iter(range(0, 10000, 30))
        with mock.patch.object(cli.time, 'sleep'), \
                mock.patch.object(cli.time, 'monotonic', side_effect=lambda: next(clock)):
            result, stdout, _stderr = self.run_demo('--progress', '--wait')
        self.assertEqual(0, result)
        self.assertIn('About 25% through', stdout)
        self.assertIn(
            f'No change in the last {cli.DEMO_PROGRESS_WAIT_SECONDS} seconds.',
            stdout,
        )

    def test_wait_needs_progress(self):
        result, _stdout, stderr = self.run_demo('--wait')
        self.assertEqual(1, result)
        self.assertIn('--progress', stderr)


if __name__ == '__main__':
    unittest.main()
