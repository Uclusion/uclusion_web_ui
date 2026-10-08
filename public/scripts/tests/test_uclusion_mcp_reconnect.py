"""Outages and brief connections must not produce a reconnect storm."""

import io
import json
import socket
import sys
import threading
import unittest
from contextlib import redirect_stderr
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import uclusionMCPProxy as proxy
import uclusionCodexNative as native


class RetryClock:
    def __init__(self, attempts=8):
        self.now = 0
        self.delays = []
        self.attempts = attempts
        self.stopped = False

    def is_set(self):
        return self.stopped

    def wait(self, delay):
        self.now += delay
        if delay >= 1:
            self.delays.append(delay)
            self.stopped = len(self.delays) >= self.attempts
        return self.stopped


class ReconnectTests(unittest.TestCase):
    def run_websocket(self, failure, stable_attempt=None, jitter='upper'):
        clock = RetryClock()
        sockets = []
        mint = mock.Mock(return_value='market-token')
        token_holder = proxy.MarketTokenHolder(mint)

        def connection(_url):
            websocket = mock.Mock()
            sockets.append(websocket)
            attempt = len(sockets)
            frames = 0

            def receive():
                nonlocal frames
                frames += 1
                if failure == 'heartbeat':
                    clock.now += 30
                    raise socket.timeout()
                if frames == 1 and (failure in ('error-payload', 'short-pong') or attempt == stable_attempt):
                    clock.now += .01 if failure == 'short-pong' else 31
                    return json.dumps({'message': 'Internal server error'} if failure == 'error-payload'
                                      else {'event_type': 'pong'})
                raise ConnectionError('closed immediately')

            if failure == 'handshake':
                websocket.connect.side_effect = ConnectionError('service unavailable')
            websocket.receive_text.side_effect = receive
            return websocket

        with mock.patch.object(proxy, 'WebSocketConnection', side_effect=connection), \
                mock.patch.object(proxy.time, 'monotonic', side_effect=lambda: clock.now), \
                mock.patch.object(proxy.random, 'uniform', side_effect=(
                    lambda lower, upper: upper if jitter == 'upper' else lower)), \
                redirect_stderr(io.StringIO()):
            proxy.listen_for_pokes('wss://example.test', token_holder, 'stage', 'workspace', clock)
        self.assertEqual(clock.attempts, len(sockets))
        self.assertTrue(all(websocket.close.call_count == 1 for websocket in sockets))
        return clock.delays, mint.call_count

    def test_websocket_outages_keep_capped_backoff_and_refresh_unaccepted_tokens(self):
        for failure in ('handshake', 'close', 'heartbeat', 'error-payload'):
            with self.subTest(failure=failure):
                delays, mints = self.run_websocket(failure)
                self.assertEqual([1, 2, 4, 8, 16, 30, 30, 30], delays)
                self.assertEqual(4, mints)

    def test_working_subscription_resets_backoff_after_stable_operation(self):
        delays, _ = self.run_websocket('close', stable_attempt=5)
        self.assertEqual([1, 2, 4, 8, 1, 2, 4, 8], delays)

    def test_brief_accepted_subscriptions_keep_backoff_and_reuse_the_token(self):
        delays, mints = self.run_websocket('short-pong')
        self.assertEqual([1, 2, 4, 8, 16, 30, 30, 30], delays)
        self.assertEqual(1, mints)

    def test_jitter_still_spreads_retries_at_the_cap(self):
        lower, _ = self.run_websocket('close', jitter='lower')
        upper, _ = self.run_websocket('close', jitter='upper')
        self.assertEqual(15, lower[-1])
        self.assertEqual(30, upper[-1])
        self.assertTrue(all(1 <= delay <= 30 for delay in lower + upper))

    def run_native(self, failure, stable_attempt=None):
        clock = RetryClock()
        clients = []
        delivery = native.NativeCodexDelivery.__new__(native.NativeCodexDelivery)
        delivery.codex_home = '/unused-codex-home'
        delivery.stop = clock
        delivery.healthy = threading.Event()
        delivery.scan_requested = threading.Event()
        delivery.lock = threading.RLock()
        delivery.context_events = None
        delivery.collectors = {}
        delivery.joined_roots = set()
        delivery.descendant_subscriptions = set()
        delivery.pending_descendants = set()
        delivery.tools_changed = lambda: None
        delivery._observe = lambda message: None
        delivery._subscribe_descendants = lambda: None
        delivery._deliver = lambda: None
        delivery._deliver_update_notice = lambda: delivery.client.closed.set()

        def connection(*_args):
            client = mock.Mock()
            clients.append(client)
            client.closed = threading.Event()
            if failure == 'handshake':
                client.start.side_effect = ConnectionError('observer unavailable')
            return client

        def scan():
            if len(clients) == stable_attempt:
                clock.now += 31
            else:
                raise ConnectionError('disconnected during discovery')

        delivery._scan = scan
        with mock.patch.object(native, 'NativeClient', side_effect=connection), \
                mock.patch.object(proxy.time, 'monotonic', side_effect=lambda: clock.now), \
                mock.patch.object(proxy.random, 'uniform', side_effect=lambda lower, upper: upper), \
                redirect_stderr(io.StringIO()):
            delivery._run()
        self.assertEqual(clock.attempts, len(clients))
        self.assertTrue(all(client.close.call_count == 1 for client in clients))
        self.assertFalse(delivery.healthy.is_set())
        return clock.delays

    def test_native_handshake_and_discovery_failures_keep_capped_backoff(self):
        for failure in ('handshake', 'discovery'):
            with self.subTest(failure=failure):
                self.assertEqual([1, 2, 4, 8, 16, 30, 30, 30], self.run_native(failure))

    def test_native_backoff_resets_after_stable_operation(self):
        self.assertEqual([1, 2, 4, 8, 1, 2, 4, 8],
                         self.run_native('discovery', stable_attempt=5))


if __name__ == '__main__':
    unittest.main()
