import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import threading
import unittest
from unittest import mock


SCRIPTS = Path(__file__).resolve().parents[1] / 'public' / 'scripts'


def load_script(name):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / f'{name}.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class PokeInboxTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.cli = load_script('uclusionCLI')
        cls.proxy = load_script('uclusionMCPProxy')

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.home_patch = mock.patch.dict(os.environ, {'HOME': self.temp_dir.name})
        self.home_patch.start()

    def tearDown(self):
        self.home_patch.stop()
        self.temp_dir.cleanup()

    def test_proxy_broadcasts_are_deduplicated_and_claimed_once(self):
        payload = {
            'event_type': 'poke_ai',
            'message_id': 'message-1',
            'message': 'Start J-all-364'
        }
        self.assertTrue(self.proxy.enqueue_prompt('stage', 'workspace-1', payload))
        self.assertFalse(self.proxy.enqueue_prompt('stage', 'workspace-1', payload))

        self.assertEqual(
            self.cli.claim_prompt('stage', 'workspace-1'),
            'Start J-all-364'
        )
        self.assertIsNone(self.cli.claim_prompt('stage', 'workspace-1'))
        # A late copy from another proxy is still suppressed after consumption.
        self.assertFalse(self.proxy.enqueue_prompt('stage', 'workspace-1', payload))
        self.assertIsNone(self.cli.claim_prompt('stage', 'workspace-1'))

    def test_identical_text_with_distinct_ids_remains_two_prompts(self):
        for message_id in ('message-1', 'message-2'):
            self.assertTrue(self.proxy.enqueue_prompt('stage', 'workspace-1', {
                'event_type': 'poke_ai',
                'message_id': message_id,
                'message': 'Responded.'
            }))

        self.assertEqual(self.cli.claim_prompt('stage', 'workspace-1'), 'Responded.')
        self.assertEqual(self.cli.claim_prompt('stage', 'workspace-1'), 'Responded.')
        self.assertIsNone(self.cli.claim_prompt('stage', 'workspace-1'))

    def test_proxy_start_clears_pending_but_keeps_consumed_retry_ids(self):
        consumed = {
            'event_type': 'poke_ai',
            'message_id': 'consumed-message',
            'message': 'Responded.'
        }
        pending = {
            'event_type': 'poke_ai',
            'message_id': 'pending-message',
            'message': 'Start J-all-364'
        }
        self.proxy.enqueue_prompt('stage', 'workspace-1', consumed)
        self.assertEqual(self.cli.claim_prompt('stage', 'workspace-1'), 'Responded.')
        self.proxy.enqueue_prompt('stage', 'workspace-1', pending)

        self.proxy.reset_inbox('stage', 'workspace-1')

        self.assertIsNone(self.cli.claim_prompt('stage', 'workspace-1'))
        self.assertFalse(self.proxy.enqueue_prompt('stage', 'workspace-1', consumed))

    def test_first_concurrent_poller_wins(self):
        self.proxy.enqueue_prompt('stage', 'workspace-1', {
            'event_type': 'poke_ai',
            'message_id': 'message-1',
            'message': 'Start T-all-2396'
        })
        barrier = threading.Barrier(3)
        results = []

        def claim():
            barrier.wait()
            results.append(self.cli.claim_prompt('stage', 'workspace-1'))

        threads = [threading.Thread(target=claim) for _ in range(2)]
        for thread in threads:
            thread.start()
        barrier.wait()
        for thread in threads:
            thread.join()

        self.assertEqual(results.count('Start T-all-2396'), 1)
        self.assertEqual(results.count(None), 1)

    def test_listener_subscribes_as_ai_and_persists_poke(self):
        stop_event = threading.Event()
        sent_payloads = []

        class FakeWebSocket:
            def __init__(self, url):
                self.url = url

            def connect(self):
                return None

            def send_text(self, text):
                sent_payloads.append(json.loads(text))

            def receive_text(self):
                stop_event.set()
                return json.dumps({
                    'event_type': 'poke_ai',
                    'message_id': 'message-1',
                    'message': 'Responded.'
                })

            def close(self):
                return None

        with mock.patch.object(self.proxy, 'WebSocketConnection', FakeWebSocket):
            self.proxy.listen_for_pokes(
                'wss://stage.ws.uclusion.com/v1',
                'account-token',
                'stage',
                'workspace-1',
                stop_event
            )

        self.assertEqual(sent_payloads, [{
            'action': 'subscribe',
            'identity': 'account-token',
            'is_ai': True
        }])
        self.assertEqual(self.cli.claim_prompt('stage', 'workspace-1'), 'Responded.')

    def test_wait_command_prints_claimed_prompt_without_login(self):
        self.proxy.enqueue_prompt('stage', 'workspace-1', {
            'event_type': 'poke_ai',
            'message_id': 'message-1',
            'message': 'Start B-all-12'
        })
        config_path = Path(self.temp_dir.name) / 'stage_uclusion.json'
        config_path.write_text(json.dumps({'workspaceId': 'workspace-1'}), encoding='utf-8')
        args = self.cli.build_parser().parse_args(
            ['-e', 'stage', 'wait', '--timeout', '0']
        )
        output = io.StringIO()
        with mock.patch.object(self.cli.os, 'getcwd', return_value=self.temp_dir.name), \
                mock.patch('sys.stdout', output):
            result = args.func(args)

        self.assertEqual(result, 0)
        self.assertEqual(output.getvalue(), 'Start B-all-12\n')


if __name__ == '__main__':
    unittest.main()
