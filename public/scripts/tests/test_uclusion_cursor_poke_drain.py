import importlib.util
import json
import os
import tempfile
import unittest
from unittest import mock


SCRIPT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODULE_PATH = os.path.join(SCRIPT_DIR, 'uclusionCursorPokeDrain.py')
SPEC = importlib.util.spec_from_file_location(
    'uclusion_cursor_poke_drain_under_test', MODULE_PATH
)
DRAIN = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(DRAIN)


class InferEnvironmentTests(unittest.TestCase):
    def test_reads_stage_from_mcp_args(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            mcp_path = os.path.join(temp_dir, 'mcp.json')
            with open(mcp_path, 'w', encoding='utf-8') as mcp:
                json.dump(
                    {
                        'mcpServers': {
                            'Uclusion': {
                                'command': 'python3',
                                'args': ['/bin/proxy', 'ws', 'stage'],
                            }
                        }
                    },
                    mcp,
                )
            self.assertEqual(
                DRAIN._mcp_environment_from_path(mcp_path), 'stage'
            )

    def test_production_when_mcp_omits_env_arg(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            mcp_path = os.path.join(temp_dir, 'mcp.json')
            with open(mcp_path, 'w', encoding='utf-8') as mcp:
                json.dump(
                    {
                        'mcpServers': {
                            'Uclusion': {
                                'command': 'python3',
                                'args': ['/bin/proxy', 'ws-id'],
                            }
                        }
                    },
                    mcp,
                )
            self.assertIsNone(DRAIN._mcp_environment_from_path(mcp_path))

    def test_prefers_first_workspace_root_mcp(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root_a = os.path.join(temp_dir, 'a')
            root_b = os.path.join(temp_dir, 'b')
            for root, env in ((root_a, 'dev'), (root_b, 'stage')):
                mcp_path = os.path.join(root, '.cursor', 'mcp.json')
                os.makedirs(os.path.dirname(mcp_path))
                with open(mcp_path, 'w', encoding='utf-8') as mcp:
                    json.dump(
                        {
                            'mcpServers': {
                                'Uclusion': {
                                    'command': 'python3',
                                    'args': ['/bin/proxy', 'ws', env],
                                }
                            }
                        },
                        mcp,
                    )
            home = os.path.join(temp_dir, 'home')
            os.makedirs(home)
            with mock.patch.object(
                    DRAIN.os.path, 'expanduser', return_value=home
            ):
                self.assertEqual(
                    DRAIN.infer_environment([root_a, root_b]), 'dev'
                )


class FollowupForPayloadTests(unittest.TestCase):
    def test_skips_non_completed_status(self):
        with mock.patch.object(DRAIN, 'drain_pokes') as drain:
            self.assertEqual(
                DRAIN.followup_for_payload({'status': 'aborted'}),
                {},
            )
            drain.assert_not_called()

    def test_empty_drain_returns_empty_object(self):
        with mock.patch.object(DRAIN, 'infer_environment', return_value='stage'), \
                mock.patch.object(DRAIN, 'drain_pokes', return_value=[]):
            self.assertEqual(
                DRAIN.followup_for_payload({'status': 'completed'}),
                {},
            )

    def test_joins_claimed_lines_as_followup_message(self):
        with mock.patch.object(DRAIN, 'infer_environment', return_value='stage'), \
                mock.patch.object(
                    DRAIN,
                    'drain_pokes',
                    return_value=['Responded Q-all-1', 'Added T-all-2'],
                ):
            self.assertEqual(
                DRAIN.followup_for_payload({'status': 'completed'}),
                {
                    'followup_message': 'Responded Q-all-1\nAdded T-all-2',
                },
            )

    def test_drain_pokes_passes_environment_flag(self):
        completed = mock.Mock(returncode=0, stdout='Responded S-all-192\n')
        with mock.patch.object(
                DRAIN, 'resolve_uclusion_command', return_value='/bin/uclusion'
        ), mock.patch.object(
                DRAIN.subprocess, 'run', return_value=completed
        ) as run:
            lines = DRAIN.drain_pokes('stage')
        self.assertEqual(lines, ['Responded S-all-192'])
        self.assertEqual(
            run.call_args.args[0],
            ['/bin/uclusion', '-e', 'stage', 'wait', '--timeout', '0'],
        )


if __name__ == '__main__':
    unittest.main()
