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

# What the owner's watch logged while the exercise's records were replayed on
# stage through the demo CLI: question, owner's suggestion, option revised,
# owner's vote, capsule updated, review opened, owner's `all`, final clear.
REPLAY = (
    ('2026-09-23T21:29:00Z', 'NOT_FULLY_VOTED', '7abd3fa4-d7ec-43c9-92cb-5dc877608012'),
    ('2026-09-23T21:29:23Z', 'NOT_FULLY_VOTED', '7abd3fa4-d7ec-43c9-92cb-5dc877608012'),
    ('2026-09-23T21:29:50Z', 'UNREAD_RESOLVED', 'cbbce4da-dbe6-48fd-815e-96d1f17b2edf'),
    ('2026-09-23T21:29:51Z', 'NOT_FULLY_VOTED', '7abd3fa4-d7ec-43c9-92cb-5dc877608012'),
    ('2026-09-23T21:30:03Z', 'NOT_FULLY_VOTED', '7abd3fa4-d7ec-43c9-92cb-5dc877608012'),
    ('2026-09-23T21:30:03Z', 'UNREAD_RESOLVED', 'cbbce4da-dbe6-48fd-815e-96d1f17b2edf'),
    ('2026-09-23T21:30:40Z', 'UNREAD_COMMENT', '3dac0244-15b5-564d-b45c-b0d2f55c9dd6'),
    ('2026-09-23T21:31:16Z', 'UNREAD_REVIEWABLE', '8301f242-bdf4-44aa-ac22-badc0baaf89d'),
    ('2026-09-23T21:31:36Z', 'UNREAD_REVIEWABLE', '8301f242-bdf4-44aa-ac22-badc0baaf89d'),
    ('2026-09-23T21:32:14Z', 'UNREAD_COMMENT', '3dac0244-15b5-564d-b45c-b0d2f55c9dd6'),
)

# What the owner's watch logged in a live Claude demo on stage
# (T-Marketing-275). Most changes pushed their row twice in the same second;
# the review opened at 22:36:09 and the owner answered it at 22:36:21.
LIVE = (
    ('2026-09-23T22:33:03Z', 'NOT_FULLY_VOTED', '4b62fc76-6a19-4195-bb37-6025b375e1e3'),
    ('2026-09-23T22:33:03Z', 'NOT_FULLY_VOTED', '4b62fc76-6a19-4195-bb37-6025b375e1e3'),
    ('2026-09-23T22:33:12Z', 'NOT_FULLY_VOTED', '4b62fc76-6a19-4195-bb37-6025b375e1e3'),
    ('2026-09-23T22:33:41Z', 'UNREAD_RESOLVED', 'f9a28d8f-cd82-430b-8ccc-840053bd4f55'),
    ('2026-09-23T22:33:41Z', 'UNREAD_RESOLVED', 'f9a28d8f-cd82-430b-8ccc-840053bd4f55'),
    ('2026-09-23T22:33:41Z', 'NOT_FULLY_VOTED', '4b62fc76-6a19-4195-bb37-6025b375e1e3'),
    ('2026-09-23T22:33:51Z', 'NOT_FULLY_VOTED', '4b62fc76-6a19-4195-bb37-6025b375e1e3'),
    ('2026-09-23T22:33:51Z', 'UNREAD_RESOLVED', 'f9a28d8f-cd82-430b-8ccc-840053bd4f55'),
    ('2026-09-23T22:34:47Z', 'UNREAD_COMMENT', 'c7719c2a-40a1-5fad-9388-fb6893620371'),
    ('2026-09-23T22:34:47Z', 'UNREAD_COMMENT', 'c7719c2a-40a1-5fad-9388-fb6893620371'),
    ('2026-09-23T22:35:54Z', 'UNREAD_COMMENT', '87a476c1-0707-426a-8da3-52d77d271b61'),
    ('2026-09-23T22:35:54Z', 'UNREAD_COMMENT', '87a476c1-0707-426a-8da3-52d77d271b61'),
    ('2026-09-23T22:35:56Z', 'UNREAD_COMMENT', '03b51c5b-5260-4829-8885-6709bee56e6f'),
    ('2026-09-23T22:36:09Z', 'UNREAD_REVIEWABLE', '7fc2128f-63ed-43e3-8b2b-fd689a0f684b'),
    ('2026-09-23T22:36:09Z', 'UNREAD_REVIEWABLE', '7fc2128f-63ed-43e3-8b2b-fd689a0f684b'),
    ('2026-09-23T22:36:21Z', 'UNREAD_REVIEWABLE', '7fc2128f-63ed-43e3-8b2b-fd689a0f684b'),
    ('2026-09-23T22:37:05Z', 'UNREAD_REPLY', '28d637a3-54c6-4124-8ff6-1752b0e56a3a'),
    ('2026-09-23T22:37:05Z', 'UNREAD_REPLY', '28d637a3-54c6-4124-8ff6-1752b0e56a3a'),
    ('2026-09-23T22:37:07Z', 'UNREAD_COMMENT', 'c7719c2a-40a1-5fad-9388-fb6893620371'),
    ('2026-09-23T22:37:07Z', 'UNREAD_REPLY', '28d637a3-54c6-4124-8ff6-1752b0e56a3a'),
)


def later(stamp, seconds):
    moment = cli.calendar.timegm(cli.time.strptime(stamp, '%Y-%m-%dT%H:%M:%SZ'))
    return cli.time.strftime('%Y-%m-%dT%H:%M:%SZ', cli.time.gmtime(moment + seconds))


class DemoProgressEstimateTests(unittest.TestCase):
    def estimate(self, pushes):
        return cli.demo_progress_estimate(list(pushes))

    def test_nothing_yet_says_the_evaluator_is_reading(self):
        percent, message = self.estimate(())
        self.assertEqual(5, percent)
        self.assertIn('reading its job', message)

    def test_each_milestone_of_the_live_run_is_recognised_in_order(self):
        cases = (
            (1, 25, 'question with options'),
            (4, 50, 'suggested change'),
            (14, 80, 'opened its completion review'),
            (16, 90, 'answered the completion review'),
        )
        for count, percent, phrase in cases:
            with self.subTest(count=count):
                estimate, message = self.estimate(LIVE[:count])
                self.assertEqual(percent, estimate)
                self.assertIn(phrase, message)

    def test_the_review_s_same_second_repeat_is_not_the_owner_answering(self):
        # The live run pushed the review row twice as it opened; reading the
        # repeat as the owner's reply claimed an answer 12 seconds early.
        estimate, message = self.estimate(LIVE[:15])
        self.assertEqual(80, estimate)
        self.assertIn('opened', message)

    def test_a_burst_on_one_row_counts_once(self):
        self.assertEqual(13, len(cli.demo_progress_events(list(LIVE))))
        self.assertEqual(10, len(cli.demo_progress_events(list(REPLAY))))

    def test_the_replay_reaches_the_same_milestones(self):
        self.assertIn('opened', self.estimate(REPLAY[:8])[1])
        self.assertIn('answered', self.estimate(REPLAY[:9])[1])

    def test_the_estimate_never_goes_backwards(self):
        for log in (REPLAY, LIVE):
            estimates = [self.estimate(log[:n])[0] for n in range(len(log) + 1)]
            self.assertEqual(estimates, sorted(estimates))

    def test_other_events_alone_never_reach_the_next_milestone(self):
        # Removals and updates are routine, so a pile of events of an
        # unrelated type must not pass for the owner's suggestion landing.
        start = LIVE[0]
        comments = [
            (later(start[0], 10 * n), 'UNREAD_COMMENT', start[2]) for n in range(1, 40)
        ]
        percent, message = self.estimate([start] + comments)
        self.assertLess(percent, 50)
        self.assertIn('question with options', message)

    def test_a_second_review_row_opening_is_not_the_owner_answering(self):
        opened = LIVE[13]
        other = (later(opened[0], 30), opened[1], 'aaaaaaaa-bdf4-44aa-ac22-badc0baaf89d')
        percent, message = self.estimate([opened, other])
        self.assertLess(percent, 90)
        self.assertIn('opened', message)

    def test_a_push_with_an_unreadable_time_still_counts(self):
        broken = ('not-a-time', LIVE[0][1], LIVE[0][2])
        self.assertEqual(2, len(cli.demo_progress_events([LIVE[0], broken])))

    def test_the_estimate_never_claims_the_run_is_over(self):
        tail = [(later(LIVE[-1][0], 10 * n), 'UNREAD_COMMENT', 'x') for n in range(1, 50)]
        percent, _message = self.estimate(list(LIVE) + tail)
        self.assertLess(percent, 100)

    def test_the_line_is_the_estimate_and_nothing_internal(self):
        line = cli.demo_progress_line(list(LIVE[:4]))
        self.assertEqual(
            'About 50% through: the evaluator has taken the owner\'s suggested '
            'change into its option.',
            line,
        )


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
            for stamp, kind, row in pushes:
                handle.write(f'{stamp}\t{kind}\t{row}\n')

    def run_demo(self, *flags):
        args = cli.build_parser().parse_args(['-e', 'stage', 'demo', *flags])
        stdout, stderr = io.StringIO(), io.StringIO()
        with redirect_stdout(stdout), redirect_stderr(stderr):
            result = args.func(args)
        return result, stdout.getvalue(), stderr.getvalue()

    def test_it_prints_one_line_from_the_log(self):
        self.write(LIVE[:14])
        result, stdout, stderr = self.run_demo('--progress')
        self.assertEqual(0, result, stderr)
        self.assertEqual(1, len(stdout.splitlines()))
        self.assertIn('About 80% through', stdout)

    def test_it_reads_nothing_but_the_log(self):
        # A job read costs the caller tokens and a script cannot tell what
        # the job's text means; the estimate never goes to the network.
        self.write(LIVE[:4])
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
        self.write(LIVE[:14])
        ticks = []

        def sleep(_seconds):
            ticks.append(1)
            if len(ticks) == 2:
                # The review row's same-second repeat changes nothing, so it
                # must not wake the caller; the owner's answer does.
                self.write(LIVE[14:15])
            if len(ticks) == 4:
                self.write(LIVE[15:16])

        with mock.patch.object(cli.time, 'sleep', side_effect=sleep):
            result, stdout, _stderr = self.run_demo('--progress', '--wait')
        self.assertEqual(0, result)
        self.assertEqual(4, len(ticks))
        self.assertIn('About 90% through', stdout)
        self.assertIn('answered', stdout)
        self.assertNotIn('No change', stdout)

    def test_wait_gives_up_and_says_nothing_changed(self):
        self.write(LIVE[:1])
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
