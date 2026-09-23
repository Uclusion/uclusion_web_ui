"""The watch command subscribes as the human and says only that something came."""

import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest import mock


def load_script(name):
    path = Path(__file__).resolve().parents[1] / (name + '.py')
    spec = importlib.util.spec_from_file_location(name + '_watch_test', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


CLI = load_script('uclusionCLI')


class FakeSocket:
    """A websocket that replays scripted frames, then blocks like a real one."""

    def __init__(self, frames):
        self.frames = list(frames)
        self.sent = []
        self.closed = False

    def connect(self):
        return None

    def send_text(self, text):
        self.sent.append(text)

    def receive_text(self):
        if self.frames:
            return self.frames.pop(0)
        raise AssertionError('the watch asked for more frames than it was given')

    def close(self):
        self.closed = True


def notification_frame(type_object_id=None):
    payload = {'event_type': 'notification', 'object_id': 'market-1'}
    if type_object_id is not None:
        payload['type_object_id'] = type_object_id
    return json.dumps(payload)


def run_watch(frames, secret_key_id='id', **overrides):
    sockets = []

    def make_socket(_url):
        socket = FakeSocket(frames)
        sockets.append(socket)
        return socket

    proxy = mock.Mock()
    proxy.WebSocketConnection.side_effect = make_socket
    proxy.login.return_value = {'uclusion_token': 'identity-token'}
    settings = {'env': 'stage', 'bell': False, 'once': True, 'timeout': 30}
    settings.update(overrides)
    args = mock.Mock(**settings)
    with mock.patch.object(CLI, 'load_proxy_module', return_value=proxy), \
            mock.patch.object(CLI, 'load_config',
                              return_value={'workspaceId': 'workspace-1'}), \
            mock.patch.object(CLI, 'get_credentials',
                              return_value={'secret_key_id': secret_key_id,
                                            'secret_key': 'secret'}), \
            mock.patch('builtins.print') as printed:
        status = CLI.cmd_watch(args)
    return status, sockets, printed


class WatchSubscriptionTests(unittest.TestCase):
    def test_it_subscribes_as_the_human_rather_than_as_an_agent(self):
        # The only difference between this stream and the Poke listener's is
        # the absent is_ai, and it is the whole point of the command.
        _status, sockets, _printed = run_watch([notification_frame()])
        subscribe = json.loads(sockets[0].sent[0])
        self.assertEqual('subscribe', subscribe['action'])
        self.assertEqual('identity-token', subscribe['identity'])
        self.assertNotIn('is_ai', subscribe)

    def test_a_notification_prints_one_line_and_once_exits(self):
        status, _sockets, printed = run_watch([notification_frame()])
        self.assertEqual(0, status)
        printed.assert_called_once()
        line = printed.call_args.args[0]
        self.assertTrue(line.startswith('notification '), line)

    def test_the_line_never_carries_inbox_content(self):
        # The push has none to carry, and the caller already holds
        # get_notifications, so anything more would be invented or fetched.
        _status, _sockets, printed = run_watch([notification_frame()])
        line = printed.call_args.args[0]
        self.assertNotIn('market-1', line)

    def test_bell_adds_the_bell_character_to_the_same_line(self):
        _status, _sockets, printed = run_watch([notification_frame()], bell=True)
        line = printed.call_args.args[0]
        self.assertTrue(line.startswith('\a'), repr(line))
        self.assertIn('notification ', line)

    def test_other_events_do_not_ring(self):
        frames = [
            json.dumps({'event_type': 'pong'}),
            json.dumps({'event_type': 'investible', 'object_id': 'market-1'}),
            notification_frame(),
        ]
        _status, _sockets, printed = run_watch(frames)
        self.assertEqual(1, printed.call_count)


DEMO_CLIENT_ID = (
    'ai-demo:3f2b8c1a-1111-4222-8333-944455556666:human_owner'
)
REVIEW_ROW = 'UNREAD_REVIEWABLE_8301f242-bdf4-44aa-ac22-badc0baaf89d'


class DemoNotificationLogTests(unittest.TestCase):
    """The owner's own watch keeps the record demo --progress estimates from."""

    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.log = Path(temporary.name) / 'demo-notifications.log'
        patcher = mock.patch.object(
            CLI, 'demo_notification_log_path', return_value=str(self.log)
        )
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_a_demo_watch_logs_the_type_and_object_of_each_push(self):
        run_watch([notification_frame(REVIEW_ROW)],
                  secret_key_id=DEMO_CLIENT_ID)
        stamp, notification_type, object_id = (
            self.log.read_text().rstrip('\n').split('\t')
        )
        self.assertEqual('UNREAD_REVIEWABLE', notification_type)
        self.assertEqual('8301f242-bdf4-44aa-ac22-badc0baaf89d', object_id)
        self.assertTrue(stamp.endswith('Z'), stamp)

    def test_what_the_owner_sees_is_unchanged_in_a_demo(self):
        _status, _sockets, printed = run_watch(
            [notification_frame(REVIEW_ROW)], secret_key_id=DEMO_CLIENT_ID
        )
        line = printed.call_args.args[0]
        self.assertTrue(line.startswith('notification '), line)
        self.assertNotIn('UNREAD_REVIEWABLE', line)

    def test_an_ordinary_install_writes_no_log(self):
        run_watch([notification_frame(REVIEW_ROW)])
        self.assertFalse(self.log.exists())

    def test_an_unrecognised_row_is_still_logged(self):
        # Losing a push would undercount the run; a push without a readable
        # type still moves the count.
        run_watch([notification_frame()], secret_key_id=DEMO_CLIENT_ID)
        self.assertEqual('UNKNOWN', self.log.read_text().split('\t')[1])

    def test_a_log_it_cannot_write_does_not_stop_the_watch(self):
        with mock.patch.object(CLI, 'demo_notification_log_path',
                               return_value=str(self.log.parent / 'x' / 'y')):
            status, _sockets, printed = run_watch(
                [notification_frame(REVIEW_ROW)],
                secret_key_id=DEMO_CLIENT_ID,
            )
        self.assertEqual(0, status)
        printed.assert_called_once()


if __name__ == '__main__':
    unittest.main()
