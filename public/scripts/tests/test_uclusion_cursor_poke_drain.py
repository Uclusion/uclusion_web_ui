import contextlib
import importlib.util
import io
import os
import unittest


SCRIPT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODULE_PATH = os.path.join(SCRIPT_DIR, 'uclusionCursorPokeDrain.py')
SPEC = importlib.util.spec_from_file_location(
    'uclusion_cursor_poke_drain_under_test', MODULE_PATH
)
DRAIN = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(DRAIN)


class CursorPokeDrainCompatibilityTests(unittest.TestCase):
    def test_emits_empty_hook_response(self):
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            DRAIN.main()
        self.assertEqual('{}\n', output.getvalue())


if __name__ == '__main__':
    unittest.main()
