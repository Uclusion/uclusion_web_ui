import importlib.util
import hashlib
import os
import stat
import tempfile
import threading
import time
import tomllib
import unittest
from unittest import mock


SCRIPT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODULE_PATH = os.path.join(SCRIPT_DIR, 'uclusionInstall.py')
SPEC = importlib.util.spec_from_file_location('uclusion_install_under_test', MODULE_PATH)
INSTALL = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(INSTALL)


class WorkflowProtocolContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        workflow_paths = (
            os.path.join(SCRIPT_DIR, 'skills', 'uclusion', 'SKILL.md'),
            os.path.join(
                SCRIPT_DIR, 'skills', 'uclusion', 'references', 'pokes.md'
            ),
            os.path.join(
                SCRIPT_DIR, 'skills', 'uclusion', 'references', 'operations.md'
            ),
        )
        parts = []
        for workflow_path in workflow_paths:
            with open(workflow_path, encoding='utf-8') as workflow:
                parts.append(workflow.read())
        cls.workflow = ' '.join(' '.join(parts).split())
        with open(
            os.path.join(SCRIPT_DIR, 'AGENTS.md'), encoding='utf-8'
        ) as codex_stub:
            cls.codex_stub = ' '.join(codex_stub.read().split())
        with open(
            os.path.join(SCRIPT_DIR, 'uclusion.mdc'), encoding='utf-8'
        ) as cursor_stub:
            cls.cursor_stub = ' '.join(cursor_stub.read().split())
        with open(
            os.path.join(SCRIPT_DIR, 'UCLUSION_CODEX_BRIDGE.md'),
            encoding='utf-8',
        ) as bridge_doc:
            cls.bridge_doc = ' '.join(bridge_doc.read().split())

    def test_protocol_reserves_start_for_explicit_ui_poke(self):
        self.assertIn(
            '`Start <target>` comes only from an explicit human Poke AI click',
            self.workflow,
        )
        self.assertIn('A deferred Start never auto-starts', self.workflow)
        self.assertIn('Replayed Start is history', self.workflow)
        self.assertIn('fresh per-session cursor starts at arm time', self.workflow)
        self.assertIn('--deliver-existing-pokes', self.workflow)
        self.assertIn('`Start` is an untargeted broadcast', self.workflow)
        self.assertIn(
            'must not use it while more than one default agent is idle',
            self.workflow,
        )

    def test_poke_shaped_start_never_counts_as_a_direct_switch(self):
        self.assertIn(
            'A complete trimmed input of the form `Start <target>` keeps its '
            'Poke event meaning even when the client presents it in the '
            'ordinary user/chat channel',
            self.workflow,
        )
        self.assertIn(
            'Never reinterpret a bare `Start <target>` as a direct human '
            'selection or an explicit switch',
            self.workflow,
        )
        self.assertIn(
            'Only unambiguous non-event human instruction language, such as '
            '`switch from <current> to <target>`, may replace an active lane',
            self.workflow,
        )
        self.assertIn('Mid-lane, defer an outside target', self.workflow)

    def test_codex_bridge_skips_startup_backlog_by_default(self):
        self.assertIn(
            'bridge starts after the retained backlog by default',
            self.codex_stub,
        )
        self.assertIn(
            '`--deliver-existing-pokes`',
            self.codex_stub,
        )
        self.assertIn('Never add `--deliver-existing-pokes` yourself', self.codex_stub)
        self.assertIn('unmarked private copy', self.codex_stub)

    def test_current_work_lists_are_numbered_and_descriptive(self):
        self.assertIn(
            'Whenever presenting `find_work` results or any equivalent '
            'current-work list, render the complete result as a numbered list',
            self.workflow,
        )
        self.assertIn(
            'Every numbered entry must include both its exact `short_code_id` '
            'and returned `name` (its short description)',
            self.workflow,
        )
        self.assertIn(
            'never present an entry as only a bug, job, suggestion, or other '
            'short code',
            self.workflow,
        )
        self.assertIn(
            'at an idle session start, immediately after finishing or handing '
            'off work, and anywhere else current work is shown',
            self.workflow,
        )

    def test_default_workflows_assign_one_agent(self):
        self.assertIn(
            'one agent owns a job or bug assignment at a time',
            self.workflow,
        )
        self.assertIn(
            'Reading, classifying, or reloading an object does not assign it',
            self.workflow,
        )
        self.assertIn(
            'A human-guided assignment remains with that session while it '
            'waits for human input or review',
            self.workflow,
        )
        self.assertIn(
            'Ending an audit or execution interval does not clear a retained '
            'human-guided assignment',
            self.workflow,
        )
        self.assertIn(
            'Explicit human-configured roles may deliberately assign multiple '
            'agents to the same work',
            self.workflow,
        )

    def test_continuation_events_resume_only_the_assigned_lane(self):
        self.assertIn(
            'Merely receiving `Added`, `Updated`, or `Responded` never creates '
            'or switches an assignment',
            self.workflow,
        )
        self.assertIn(
            '`Added`, `Updated`, and `Responded` do not load or activate a '
            'target while the session is unassigned',
            self.workflow,
        )
        self.assertIn(
            'stops there without `get_job`, audit startup, or activation',
            self.workflow,
        )
        self.assertIn(
            'A job moving into Doable is an `Updated` state transition, never '
            'a `Start`',
            self.workflow,
        )
        self.assertIn(
            'An idle session or a session assigned elsewhere does not activate '
            'because the job became executable',
            self.workflow,
        )
        self.assertIn(
            'With no assignment, ignore it',
            self.workflow,
        )
        self.assertIn(
            'a capsule update does not assign a session',
            self.workflow,
        )
        self.assertNotIn(
            'live Start, Responded, and Added events load and activate',
            self.workflow,
        )

    def test_bridge_broadcast_is_not_assignment_ownership(self):
        self.assertIn(
            'every live Codex session receives its own copy of Pokes',
            self.bridge_doc,
        )
        self.assertIn(
            'Per-session delivery is transport, not assignment',
            self.bridge_doc,
        )
        self.assertIn(
            'a job becoming Doable is an update and does not assign an idle '
            'session',
            self.bridge_doc,
        )
        self.assertIn('`Start` has no destination session', self.bridge_doc)

    def test_direct_and_compound_targets_have_explicit_lookup_rules(self):
        self.assertIn(
            'Call `get_job` with their exact short code',
            self.workflow,
        )
        self.assertIn(
            'call `get_job` with the parent after `of`',
            self.workflow,
        )
        self.assertIn('Direct lookup already retries five times', self.workflow)
        self.assertIn(
            'retry later rather than discarding it',
            self.workflow,
        )

    def test_stage_changing_addition_is_delivered_after_workflow_commit(self):
        self.assertIn(
            'emits its Added event only after the workflow transaction commits',
            self.workflow,
        )
        self.assertIn(
            'That single reload contains both item and new stage',
            self.workflow,
        )
        self.assertIn(
            'never wait for a second stage Poke',
            self.workflow,
        )

    def test_cursor_gui_poke_consumption_is_disabled(self):
        self.assertIn(
            'Cursor GUI does not consume Poke AI deliveries',
            self.cursor_stub,
        )
        self.assertIn(
            'Never run `uclusion wait` or `uclusion listen`',
            self.cursor_stub,
        )
        self.assertIn(
            "Cursor's IDE chat cannot be awakened automatically",
            self.cursor_stub,
        )
        self.assertIn(
            'The human must start the next turn by typing `Responded`',
            self.cursor_stub,
        )
        self.assertIn('relevant short code', self.cursor_stub)
        self.assertNotIn('wait --timeout 0', self.cursor_stub)

    def test_auto_take_claims_before_loading_and_persists_checkpoints(self):
        self.assertIn('response has `auto_take_directions`', self.workflow)
        self.assertIn(
            'follow the work claim lock before loading any marked item',
            self.workflow,
        )
        self.assertIn(
            'load only the one returned by a successful claim',
            self.workflow,
        )
        self.assertIn('Every auto-take activation is claim-gated', self.workflow)
        self.assertIn(
            'auto-take directions arrive without the tool, present the list '
            'but do not load or start an item',
            self.workflow,
        )
        self.assertIn(
            'No claim was granted, so do not start auto-take work; remain idle '
            'and report the failure',
            self.workflow,
        )
        self.assertIn('A timeout or error result', self.workflow)
        self.assertIn(
            'Auto-take applies only while the session has no human-guided '
            'assignment',
            self.workflow,
        )
        self.assertIn(
            'must not switch the session automatically',
            self.workflow,
        )
        self.assertIn('in the same turn', self.workflow)
        self.assertIn(
            'An auto-taken lane always gets a durable progress checkpoint '
            'before a turn ends',
            self.workflow,
        )
        self.assertNotIn('durable handoff before a turn ends', self.workflow)
        self.assertIn('This rule lasts for every turn in that lane', self.workflow)
        self.assertIn(
            'Use the specialized Uclusion tool when one applies, otherwise '
            '`add_info` on the active item',
            self.workflow,
        )
        self.assertIn('A progress checkpoint is not a lane handoff', self.workflow)
        self.assertIn(
            'continue every authorized investigation, planning, and execution step',
            self.workflow,
        )
        self.assertIn(
            'surface or create the actual next actionable item before final output',
            self.workflow,
        )
        self.assertIn('Chat may mirror the artifact but never replace it', self.workflow)

    def test_one_time_onboarding_precedes_ordinary_empty_opt_in(self):
        self.assertIn('"first AI session"', self.workflow)
        self.assertIn('"served only once"', self.workflow)
        self.assertIn(
            'follow those directions immediately in the same turn before yielding',
            self.workflow,
        )
        self.assertIn(
            'This one-time onboarding takes precedence over the ordinary '
            'empty-list opt-in',
            self.workflow,
        )
        self.assertIn(
            'Your find work list is empty—would you like instructions for adding '
            'and working on a job?',
            self.workflow,
        )

    def test_execution_is_allowed_in_doable_or_reviewable(self):
        self.assertIn('Doable and Reviewable permit execution', self.workflow)
        self.assertIn(
            'neither proves questions or suggestions were handled',
            self.workflow,
        )
        self.assertIn(
            'job returns to Doable or Reviewable',
            self.workflow,
        )
        self.assertIn(
            'Execute only in Doable or Reviewable',
            self.workflow,
        )
        self.assertIn(
            'latest Reports comment still controls review direction',
            self.workflow,
        )

    def test_testing_form_requires_qualifying_human_approval(self):
        self.assertIn(
            'An executable stage authorizes implementation, not the form of '
            'testing',
            self.workflow,
        )
        self.assertIn(
            'An explicit test plan in the job counts as human approval',
            self.workflow,
        )
        self.assertIn(
            'one `ask_question` per unresolved decision about test types and '
            'quantities',
            self.workflow,
        )
        self.assertIn(
            'wait for a qualifying human answer',
            self.workflow,
        )

    def test_security_work_requires_qualifying_human_approval(self):
        self.assertIn(
            'An executable stage alone does not authorize introducing or '
            'expanding security behavior',
            self.workflow,
        )
        self.assertIn(
            'An explicit security plan already recorded in the human-authored '
            'job counts as approval',
            self.workflow,
        )
        self.assertIn(
            'before implementation, use `ask_question` to describe the proposed '
            'security work and wait for a qualifying human answer',
            self.workflow,
        )
        self.assertIn(
            'This gate applies when work changes or introduces authentication, '
            'authorization, credentials or secrets, threat models, trust '
            'boundaries, security-sensitive persistence or lifecycle behavior, '
            'or shared security infrastructure',
            self.workflow,
        )
        self.assertIn(
            'when an AI reviewer labels a finding as security-related and the '
            'proposed correction would expand scope',
            self.workflow,
        )
        self.assertIn(
            'Treat the finding as evidence to assess, not approval to implement '
            'a broader security model',
            self.workflow,
        )

    def test_ai_questions_use_advisory_markers_or_explicit_delegation(self):
        self.assertIn(
            'An open AI-authored question created from Doable or Reviewable '
            'moves the job to Requires Input',
            self.workflow,
        )
        self.assertIn(
            'Treat the rendered advisory marker as authoritative',
            self.workflow,
        )
        self.assertIn(
            'do not infer authority from other metadata',
            self.workflow,
        )
        self.assertIn(
            'cannot make the question answerable or unlock execution',
            self.workflow,
        )
        self.assertIn(
            'job stays locked until the AI calls `resolve`',
            self.workflow,
        )
        self.assertIn(
            'restores the prior executable stage',
            self.workflow,
        )
        self.assertIn(
            'Standalone AI-authored view-level questions have no advisory gate',
            self.workflow,
        )
        self.assertIn(
            'any clear non-AI reply or Approvable For vote answers',
            self.workflow,
        )
        self.assertIn(
            'delegates the choice to the AI',
            self.workflow,
        )
        self.assertIn(
            'Advisory responses also send it',
            self.workflow,
        )
        self.assertNotIn('current human assignees', self.workflow)
        self.assertNotIn('reassignment changes that set', self.workflow)

    def test_optioned_bug_question_converts_to_a_human_owned_job(self):
        self.assertIn(
            'Ask for missing facts with `add_info`, keeping the single-comment '
            'workflow',
            self.workflow,
        )
        self.assertIn(
            'call `ask_question` with the bug short code and a nonempty '
            'options list',
            self.workflow,
        )
        self.assertIn('creates a human-owned Bugs job', self.workflow)
        self.assertIn(
            'moves the original bug thread into that job as a task',
            self.workflow,
        )
        self.assertIn(
            'Complete the conversion as one atomic workflow turn',
            self.workflow,
        )
        self.assertIn(
            '`ask_question` → reload the returned Bugs job → cast exactly '
            'one explained preferred-option vote with '
            '`approve_job_or_option`, all before ending the turn',
            self.workflow,
        )
        self.assertIn(
            'Never convert a bug merely to ask an open-ended question',
            self.workflow,
        )

    def test_token_audit_boundaries_and_bucket_semantics_are_documented(self):
        self.assertIn(
            'call `start_job_audit` before substantive planning',
            self.workflow,
        )
        self.assertIn('initial bucket is `planning`', self.workflow)
        self.assertIn('marker applies to the next model request', self.workflow)
        self.assertIn(
            'Ordinary labels are `planning`, `implementation`, `testing`, and '
            '`other`',
            self.workflow,
        )
        self.assertIn('Keep at most 32 labels', self.workflow)
        self.assertIn('Every request belongs to one bucket', self.workflow)
        self.assertIn('Switch to `testing` before tests or builds', self.workflow)
        self.assertIn('lookup used only to classify a Poke starts no audit', self.workflow)
        self.assertIn('Keep the audit active across ordinary model/chat turns', self.workflow)
        self.assertIn(
            '`end_job_audit` only when the lane genuinely hands off for a '
            'blocking human dependency, review, completion, pause, or interruption',
            self.workflow,
        )
        self.assertIn(
            'returning an ordinary model/chat turn is not a lane handoff and '
            'must not end the audit',
            self.workflow,
        )
        self.assertIn('Collection finishes asynchronously', self.workflow)
        self.assertIn('partial telemetry never block', self.workflow)


class PortableFileLockTests(unittest.TestCase):
    def test_installer_imports_without_fcntl(self):
        real_import = __import__
        fake_msvcrt = mock.Mock()

        def import_without_fcntl(name, globals=None, locals=None, fromlist=(), level=0):
            if name == 'fcntl':
                raise ImportError('fcntl is unavailable on native Windows')
            if name == 'msvcrt':
                return fake_msvcrt
            return real_import(name, globals, locals, fromlist, level)

        spec = importlib.util.spec_from_file_location(
            'uclusion_install_windows_import_test',
            MODULE_PATH,
        )
        windows_install = importlib.util.module_from_spec(spec)
        with mock.patch('builtins.__import__', side_effect=import_without_fcntl):
            spec.loader.exec_module(windows_install)

        self.assertIsNone(windows_install.fcntl)
        self.assertIs(windows_install.msvcrt, fake_msvcrt)

    def test_windows_file_lock_retries_contention_and_releases(self):
        fake_msvcrt = mock.Mock()
        fake_msvcrt.LK_NBLCK = 1
        fake_msvcrt.LK_UNLCK = 2
        fake_msvcrt.locking.side_effect = [
            OSError(INSTALL.errno.EACCES, 'already locked'),
            None,
            None,
        ]

        with tempfile.TemporaryDirectory() as temp_dir:
            lock_path = os.path.join(temp_dir, 'portable.lock')
            with open(lock_path, 'a+b') as lock_file, \
                    mock.patch.object(INSTALL, 'fcntl', None), \
                    mock.patch.object(INSTALL, 'msvcrt', fake_msvcrt), \
                    mock.patch.object(INSTALL.time, 'sleep') as sleep:
                with INSTALL._exclusive_file_lock(lock_file):
                    self.assertEqual(lock_file.tell(), 0)

            with open(lock_path, 'rb') as lock_file:
                self.assertEqual(lock_file.read(), b'\0')

        modes = [
            call.args[1]
            for call in fake_msvcrt.locking.call_args_list
        ]
        self.assertEqual(modes, [fake_msvcrt.LK_NBLCK] * 2 + [fake_msvcrt.LK_UNLCK])
        sleep.assert_called_once_with(0.05)


class CodexIntegrationConfigTests(unittest.TestCase):
    LEGACY_HOOK_BLOCK = (
        f'{INSTALL.LEGACY_CODEX_HOOKS_MARKER}\n'
        '[[hooks.SessionStart]]\n'
        'matcher = "startup|resume|clear|compact"\n'
        '[[hooks.SessionStart.hooks]]\n'
        'type = "command"\n'
        'command = "legacy-uclusion-register"\n'
        f'{INSTALL.LEGACY_CODEX_HOOKS_END_MARKER}\n'
    )
    UNRELATED_HOOK_BLOCK = (
        '[[hooks.Stop]]\n'
        '[[hooks.Stop.hooks]]\n'
        'type = "command"\n'
        'command = "keep-this-hook"\n'
    )

    def test_bridge_script_is_part_of_release(self):
        self.assertIn(
            ('uclusionCodexBridge.py', 'uclusionCodexBridge.py', 'uclusionCodexBridge.py'),
            INSTALL.SCRIPT_FILES,
        )

    def test_cursor_poke_drain_script_is_part_of_release(self):
        self.assertIn(
            (
                'uclusionCursorPokeDrain.py',
                'uclusionCursorPokeDrain.py',
                INSTALL.CURSOR_POKE_DRAIN_SYMLINK_NAME,
            ),
            INSTALL.SCRIPT_FILES,
        )

    def test_legacy_hook_cleanup_is_idempotent_and_preserves_other_config(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = os.path.join(temp_dir, 'config.toml')
            with open(config_path, 'w', encoding='utf-8') as config:
                config.write(
                    'model = "gpt-test"\n\n'
                    + self.UNRELATED_HOOK_BLOCK
                    + '\n'
                    + self.LEGACY_HOOK_BLOCK
                )
            with mock.patch.object(INSTALL, 'CODEX_HOME', temp_dir), \
                    mock.patch.object(INSTALL, 'CODEX_CONFIG_PATH', config_path):
                INSTALL.remove_legacy_codex_hooks_config(force=True)
                INSTALL.remove_legacy_codex_hooks_config(force=True)
            with open(config_path, encoding='utf-8') as config:
                result = config.read()

        parsed = tomllib.loads(result)
        self.assertIn('model = "gpt-test"', result)
        self.assertNotIn(INSTALL.LEGACY_CODEX_HOOKS_MARKER, result)
        self.assertNotIn(INSTALL.LEGACY_CODEX_HOOKS_END_MARKER, result)
        self.assertEqual(
            parsed['hooks']['Stop'][0]['hooks'][0]['command'],
            'keep-this-hook',
        )

    @unittest.skipUnless(hasattr(os, 'symlink'), 'requires symlink support')
    def test_config_symlink_is_preserved_while_target_is_updated(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            codex_home = os.path.join(temp_dir, 'codex')
            dotfiles_dir = os.path.join(temp_dir, 'dotfiles')
            os.makedirs(codex_home)
            os.makedirs(dotfiles_dir)
            config_path = os.path.join(codex_home, 'config.toml')
            target_path = os.path.join(dotfiles_dir, 'codex.toml')
            original = (
                'model = "gpt-test"\n\n'
                + self.UNRELATED_HOOK_BLOCK
                + '\n'
                + self.LEGACY_HOOK_BLOCK
            )
            with open(target_path, 'w', encoding='utf-8') as config:
                config.write(original)
            os.chmod(target_path, 0o640)
            relative_target = os.path.relpath(target_path, codex_home)
            os.symlink(relative_target, config_path)

            with mock.patch.object(INSTALL, 'CODEX_HOME', codex_home), \
                    mock.patch.object(
                        INSTALL, 'CODEX_CONFIG_PATH', config_path
                    ):
                INSTALL.remove_legacy_codex_hooks_config(force=True)

            with open(target_path, encoding='utf-8') as config:
                result = config.read()

            self.assertTrue(os.path.islink(config_path))
            self.assertEqual(relative_target, os.readlink(config_path))
            self.assertEqual(0o640, stat.S_IMODE(os.stat(target_path).st_mode))

        parsed = tomllib.loads(result)
        self.assertNotIn(INSTALL.LEGACY_CODEX_HOOKS_MARKER, result)
        self.assertEqual(
            parsed['hooks']['Stop'][0]['hooks'][0]['command'],
            'keep-this-hook',
        )

    @unittest.skipUnless(hasattr(os, 'symlink'), 'requires symlink support')
    def test_dangling_config_symlink_is_rejected_without_replacement(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = os.path.join(temp_dir, 'config.toml')
            missing_target = os.path.join(temp_dir, 'missing.toml')
            os.symlink(missing_target, config_path)

            with mock.patch.object(INSTALL, 'CODEX_HOME', temp_dir), \
                    mock.patch.object(
                        INSTALL, 'CODEX_CONFIG_PATH', config_path
                    ):
                with self.assertRaisesRegex(RuntimeError, 'dangling symlink'):
                    INSTALL.remove_legacy_codex_hooks_config(force=True)

            self.assertTrue(os.path.islink(config_path))
            self.assertEqual(missing_target, os.readlink(config_path))
            self.assertFalse(os.path.exists(missing_target))

    def test_same_content_concurrent_replacement_is_not_overwritten(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = os.path.join(temp_dir, 'config.toml')
            original = 'model = "gpt-test"\n\n' + self.LEGACY_HOOK_BLOCK
            with open(config_path, 'w', encoding='utf-8') as config:
                config.write(original)
            real_atomic_write = INSTALL.atomic_write_text
            racing_inode = []

            def replace_after_read(*args, **kwargs):
                replacement_path = config_path + '.editor'
                with open(
                    replacement_path, 'w', encoding='utf-8'
                ) as replacement:
                    replacement.write(original)
                os.replace(replacement_path, config_path)
                racing_inode.append(os.stat(config_path).st_ino)
                return real_atomic_write(*args, **kwargs)

            with mock.patch.object(INSTALL, 'CODEX_HOME', temp_dir), \
                    mock.patch.object(
                        INSTALL, 'CODEX_CONFIG_PATH', config_path
                    ), mock.patch.object(
                        INSTALL,
                        'atomic_write_text',
                        side_effect=replace_after_read,
                    ):
                with self.assertRaisesRegex(RuntimeError, 'changed while'):
                    INSTALL.remove_legacy_codex_hooks_config(force=True)

            with open(config_path, encoding='utf-8') as config:
                result = config.read()
            final_inode = os.stat(config_path).st_ino

        self.assertEqual(original, result)
        self.assertEqual(racing_inode, [final_inode])

    def test_cleanup_without_legacy_hooks_does_not_rewrite_config(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = os.path.join(temp_dir, 'config.toml')
            original = 'model = "gpt-test"\n'
            with open(config_path, 'w', encoding='utf-8') as config:
                config.write(original)
            with mock.patch.object(INSTALL, 'CODEX_HOME', temp_dir), \
                    mock.patch.object(INSTALL, 'CODEX_CONFIG_PATH', config_path), \
                    mock.patch.object(INSTALL, 'atomic_write_text') as write:
                INSTALL.remove_legacy_codex_hooks_config(force=True)
            write.assert_not_called()
            with open(config_path, encoding='utf-8') as config:
                self.assertEqual(config.read(), original)

    def test_orphan_hook_marker_refuses_to_modify(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = os.path.join(temp_dir, 'config.toml')
            original = (
                'model = "gpt-test"\n'
                f'{INSTALL.LEGACY_CODEX_HOOKS_MARKER}\n'
            )
            with open(config_path, 'w', encoding='utf-8') as config:
                config.write(original)
            with mock.patch.object(INSTALL, 'CODEX_HOME', temp_dir), \
                    mock.patch.object(INSTALL, 'CODEX_CONFIG_PATH', config_path):
                with self.assertRaisesRegex(RuntimeError, 'orphaned'):
                    INSTALL.remove_legacy_codex_hooks_config(force=True)
            with open(config_path, encoding='utf-8') as config:
                result = config.read()
        self.assertEqual(result, original)

    def test_duplicate_or_reversed_markers_refuse_without_modifying(self):
        malformed_configs = (
            (
                f'{INSTALL.LEGACY_CODEX_HOOKS_MARKER}\n'
                f'{INSTALL.LEGACY_CODEX_HOOKS_MARKER}\n'
                f'{INSTALL.LEGACY_CODEX_HOOKS_END_MARKER}\n'
            ),
            (
                f'{INSTALL.LEGACY_CODEX_HOOKS_END_MARKER}\n'
                f'{INSTALL.LEGACY_CODEX_HOOKS_MARKER}\n'
            ),
        )
        for original in malformed_configs:
            with self.subTest(original=original), \
                    tempfile.TemporaryDirectory() as temp_dir:
                config_path = os.path.join(temp_dir, 'config.toml')
                with open(config_path, 'w', encoding='utf-8') as config:
                    config.write(original)
                with mock.patch.object(INSTALL, 'CODEX_HOME', temp_dir), \
                        mock.patch.object(
                            INSTALL, 'CODEX_CONFIG_PATH', config_path
                        ):
                    with self.assertRaisesRegex(
                        RuntimeError, 'duplicate, orphaned, or reversed'
                    ):
                        INSTALL.remove_legacy_codex_hooks_config(force=True)
                with open(config_path, encoding='utf-8') as config:
                    self.assertEqual(config.read(), original)

    def test_combined_codex_update_adds_mcp_and_removes_legacy_hooks(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = os.path.join(temp_dir, 'config.toml')
            with open(config_path, 'w', encoding='utf-8') as config:
                config.write(
                    'model = "gpt-test"\n\n'
                    + self.UNRELATED_HOOK_BLOCK
                    + '\n'
                    + self.LEGACY_HOOK_BLOCK
                )
            with mock.patch.object(INSTALL, 'CODEX_HOME', temp_dir), \
                    mock.patch.object(INSTALL, 'CODEX_CONFIG_PATH', config_path):
                INSTALL.update_codex_integration_config(
                    'workspace-1', 'stage', force=True
                )
                INSTALL.update_codex_integration_config(
                    'workspace-1', 'stage', force=True
                )
            with open(config_path, encoding='utf-8') as config:
                result = config.read()

        parsed = tomllib.loads(result)
        self.assertEqual('gpt-test', parsed['model'])
        self.assertEqual(result.count(INSTALL.CODEX_CONFIG_MARKER), 1)
        self.assertEqual(result.count(INSTALL.CODEX_CONFIG_END_MARKER), 1)
        self.assertNotIn(INSTALL.LEGACY_CODEX_HOOKS_MARKER, result)
        self.assertNotIn(INSTALL.LEGACY_CODEX_HOOKS_END_MARKER, result)
        self.assertEqual(
            parsed['hooks']['Stop'][0]['hooks'][0]['command'],
            'keep-this-hook',
        )
        self.assertEqual(
            parsed['mcp_servers']['Uclusion']['default_tools_approval_mode'],
            'approve',
        )

    def test_atomic_config_write_failure_propagates_and_preserves_original(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = os.path.join(temp_dir, 'config.toml')
            original = 'model = "gpt-test"\n\n' + self.LEGACY_HOOK_BLOCK
            with open(config_path, 'w', encoding='utf-8') as config:
                config.write(original)
            with mock.patch.object(INSTALL, 'CODEX_HOME', temp_dir), \
                    mock.patch.object(INSTALL, 'CODEX_CONFIG_PATH', config_path), \
                    mock.patch.object(
                        INSTALL,
                        'atomic_write_text',
                        side_effect=OSError('disk full'),
                    ):
                with self.assertRaisesRegex(OSError, 'disk full'):
                    INSTALL.remove_legacy_codex_hooks_config(force=True)
            with open(config_path, encoding='utf-8') as config:
                self.assertEqual(config.read(), original)

    def test_project_codex_install_cleans_legacy_hooks_and_installs_agents(self):
        with tempfile.TemporaryDirectory() as project_dir, \
                mock.patch.object(
                    INSTALL, 'write_uclusion_config',
                    return_value=({'enabled': False, 'port': 23456}, False),
                ), \
                mock.patch.object(INSTALL, 'persist_workflow_install_state'), \
                mock.patch.object(
                    INSTALL,
                    'effective_codex_instruction_path',
                    return_value=os.path.join(project_dir, 'AGENTS.md'),
                ), \
                mock.patch.object(
                    INSTALL, 'remove_legacy_codex_hooks_config'
                ) as remove_hooks, \
                mock.patch.object(
                    INSTALL, 'install_skill_and_stub'
                ) as install_skill:
            fetch_md = mock.Mock()
            INSTALL.install_project_level(
                'workspace-1',
                'view-1',
                'stage',
                fetch_md,
                project_dir,
                clients={'codex'},
                script_version='release-1',
            )

        remove_hooks.assert_called_once_with(force=True)
        install_skill.assert_called_once_with(
            fetch_md,
            os.path.join(
                project_dir, '.agents', 'skills', 'uclusion'
            ),
            os.path.join(project_dir, 'AGENTS.md'),
            'codex',
            'Codex (project)',
            assume_yes=True,
        )


class ConfigVersionStampTests(unittest.TestCase):
    def test_unversioned_activation_clears_stale_release_stamp(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = os.path.join(temp_dir, 'uclusion.json')
            INSTALL.write_uclusion_config(
                'workspace-1', None, config_path, 'release-1'
            )
            INSTALL.write_uclusion_config(
                'workspace-1', None, config_path, None
            )
            with open(config_path, encoding='utf-8') as config:
                result = INSTALL.json.load(config)

        self.assertNotIn('scriptReinstallVersion', result)


class TokenAuditInstallerTests(unittest.TestCase):
    def test_claude_disabled_hooks_declines_audit_and_preserves_setting(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            settings_path = os.path.join(temp_dir, 'settings.json')
            managed_env = INSTALL.claude_token_audit_env(23456)
            owned_command = INSTALL.claude_token_audit_hook_command(
                'stage', 'workspace-1', 'otel', 23456
            )
            with open(settings_path, 'w', encoding='utf-8') as settings:
                INSTALL.json.dump(
                    {
                        'disableAllHooks': True,
                        'env': dict(managed_env, KEEP_ME='yes'),
                        'hooks': {
                            'Stop': [
                                {
                                    'hooks': [
                                        {
                                            'type': 'command',
                                            'command': owned_command,
                                        },
                                        {
                                            'type': 'command',
                                            'command': 'keep-stop',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    settings,
                )

            with mock.patch('builtins.print') as output:
                result = INSTALL.configure_claude_token_audit(
                    settings_path, True, 'stage', 'workspace-1', 23456,
                    managed_env,
                )
            with open(settings_path, encoding='utf-8') as settings:
                config = INSTALL.json.load(settings)

        self.assertEqual(
            result,
            {'source': None, 'managedEnv': {}, 'available': False},
        )
        self.assertIs(config['disableAllHooks'], True)
        self.assertEqual(config['env'], {'KEEP_ME': 'yes'})
        self.assertEqual(
            config['hooks']['Stop'],
            [{'hooks': [{'type': 'command', 'command': 'keep-stop'}]}],
        )
        warning = ' '.join(
            str(call.args[0]) for call in output.call_args_list if call.args
        )
        self.assertIn('disableAllHooks=true', warning)
        self.assertIn('Claude token audit was not enabled', warning)

    def test_disabled_hooks_omits_audit_args_from_claude_registration(self):
        unavailable = {
            'source': None,
            'managedEnv': {},
            'available': False,
        }
        with tempfile.TemporaryDirectory() as project_dir, \
                mock.patch.object(INSTALL, 'write_uclusion_config', return_value=({
                    'enabled': True, 'port': 23456,
                }, False)), \
                mock.patch.object(INSTALL, 'persist_workflow_install_state'), \
                mock.patch.object(INSTALL, 'add_claude_permissions'), \
                mock.patch.object(
                    INSTALL, 'configure_claude_token_audit',
                    return_value=unavailable,
                ), \
                mock.patch.object(INSTALL, 'update_token_audit_client_config'), \
                mock.patch.object(INSTALL, 'register_mcp_json') as register, \
                mock.patch.object(INSTALL, 'install_skill_and_stub'):
            INSTALL.install_project_level(
                'workspace-1', 'view-1', 'stage', mock.Mock(), project_dir,
                clients={'claude'}, token_audit_enabled=True,
            )

        self.assertIsNone(register.call_args.kwargs['token_audit'])

    def test_claude_settings_failure_is_operational_failure(self):
        with tempfile.TemporaryDirectory() as project_dir, \
                mock.patch.object(INSTALL, 'write_uclusion_config', return_value=({
                    'enabled': True, 'port': 23456,
                }, False)), \
                mock.patch.object(INSTALL, 'persist_workflow_install_state'), \
                mock.patch.object(INSTALL, 'add_claude_permissions'), \
                mock.patch.object(
                    INSTALL, 'configure_claude_token_audit', return_value=None
                ), \
                mock.patch.object(INSTALL, 'register_mcp_json') as register, \
                mock.patch.object(INSTALL, 'install_skill_and_stub'):
            with self.assertRaisesRegex(
                RuntimeError, 'failed to configure Claude settings'
            ):
                INSTALL.install_project_level(
                    'workspace-1', 'view-1', 'stage', mock.Mock(), project_dir,
                    clients={'claude'}, token_audit_enabled=True,
                )

        register.assert_not_called()

    def test_helper_script_and_tri_state_flags(self):
        self.assertIn(
            (
                'uclusionTokenAudit.py',
                'uclusionTokenAudit.py',
                INSTALL.TOKEN_AUDIT_SYMLINK_NAME,
            ),
            INSTALL.SCRIPT_FILES,
        )
        base = ['stage', 'workspace-1', 'view-1']
        self.assertIsNone(INSTALL.build_parser().parse_args(base).token_audit)
        self.assertTrue(
            INSTALL.build_parser().parse_args(base + ['--token-audit']).token_audit
        )
        self.assertFalse(
            INSTALL.build_parser().parse_args(base + ['--no-token-audit']).token_audit
        )

    def test_config_defaults_off_and_preserves_explicit_preference(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = os.path.join(temp_dir, 'uclusion.json')
            initial, initial_claims = INSTALL.write_uclusion_config(
                'workspace-1', None, config_path
            )
            enabled, enabled_claims = INSTALL.write_uclusion_config(
                'workspace-1', None, config_path, token_audit_enabled=True,
                work_claims_enabled=True
            )
            preserved, preserved_claims = INSTALL.write_uclusion_config(
                'workspace-1', None, config_path
            )
            disabled, disabled_claims = INSTALL.write_uclusion_config(
                'workspace-1', None, config_path, token_audit_enabled=False,
                work_claims_enabled=False
            )

        self.assertFalse(initial['enabled'])
        self.assertIsInstance(initial['port'], int)
        self.assertTrue(enabled['enabled'])
        self.assertEqual(enabled['port'], initial['port'])
        self.assertTrue(preserved['enabled'])
        self.assertFalse(disabled['enabled'])
        self.assertFalse(initial_claims)
        self.assertTrue(enabled_claims)
        self.assertTrue(preserved_claims)
        self.assertFalse(disabled_claims)

    def test_enabled_claude_registration_receives_audit_arguments(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            mcp_path = os.path.join(temp_dir, '.mcp.json')
            INSTALL.register_mcp_json(
                mcp_path,
                'Claude Code',
                'workspace-1',
                'stage',
                require_existing=False,
                token_audit={
                    'enabled': True,
                    'port': 23456,
                    'claudeSource': 'otel',
                },
                token_audit_client='claude',
            )
            with open(mcp_path, encoding='utf-8') as mcp_file:
                args = INSTALL.json.load(mcp_file)['mcpServers']['Uclusion']['args']

        self.assertEqual(
            args,
            [
                INSTALL.MCP_PROXY_SYMLINK_PATH,
                'workspace-1',
                'stage',
                '--token-audit',
                '--token-audit-port', '23456',
                '--token-audit-source', 'otel',
                '--token-audit-client', 'claude',
            ],
        )

    def test_claude_otel_merge_is_private_and_idempotent(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            settings_path = os.path.join(temp_dir, 'settings.json')
            with open(settings_path, 'w', encoding='utf-8') as settings:
                INSTALL.json.dump(
                    {
                        'theme': 'dark',
                        'env': {'KEEP_ME': 'yes'},
                        'hooks': {
                            'Stop': [
                                {'hooks': [{'type': 'command', 'command': 'keep-stop'}]},
                            ],
                        },
                    },
                    settings,
                )

            first = INSTALL.configure_claude_token_audit(
                settings_path, True, 'stage', 'workspace-1', 23456
            )
            with open(settings_path, encoding='utf-8') as settings:
                first_config = INSTALL.json.load(settings)
            second = INSTALL.configure_claude_token_audit(
                settings_path, True, 'stage', 'workspace-1', 23456,
                first['managedEnv'],
            )
            with open(settings_path, encoding='utf-8') as settings:
                second_config = INSTALL.json.load(settings)

        self.assertEqual(first['source'], 'otel')
        self.assertEqual(second['source'], 'otel')
        self.assertEqual(first_config, second_config)
        self.assertEqual(first_config['theme'], 'dark')
        self.assertEqual(first_config['env']['KEEP_ME'], 'yes')
        for key, value in INSTALL.claude_token_audit_env(23456).items():
            self.assertEqual(first_config['env'][key], value)
        marker_groups = first_config['hooks']['PostToolUse']
        self.assertEqual(len(marker_groups), 1)
        self.assertEqual(
            marker_groups[0]['matcher'],
            INSTALL.CLAUDE_TOKEN_AUDIT_MARKER_MATCHER,
        )
        marker_command = INSTALL.shlex.split(
            marker_groups[0]['hooks'][0]['command']
        )
        self.assertEqual(
            marker_command,
            [
                INSTALL.TOKEN_AUDIT_SYMLINK_PATH,
                'hook',
                '--environment', 'stage',
                '--workspace-id', 'workspace-1',
                '--source', 'otel',
                '--port', '23456',
            ],
        )
        self.assertEqual(len(first_config['hooks']['Stop']), 2)
        for event, _matcher in INSTALL.CLAUDE_TOKEN_AUDIT_HOOK_EVENTS:
            owned_handlers = [
                handler
                for group in first_config['hooks'][event]
                for handler in group.get('hooks', [])
                if INSTALL._is_claude_token_audit_handler(handler)
            ]
            self.assertEqual(len(owned_handlers), 1, event)
            self.assertEqual(
                owned_handlers[0]['timeout'],
                INSTALL.CLAUDE_TOKEN_AUDIT_OTEL_HOOK_TIMEOUT_SECONDS,
                event,
            )

    def test_existing_telemetry_policy_uses_transcript_without_changes(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            settings_path = os.path.join(temp_dir, 'settings.json')
            existing_env = {
                'OTEL_EXPORTER_OTLP_ENDPOINT': 'https://telemetry.example',
                'OTEL_LOG_USER_PROMPTS': '1',
                'KEEP_ME': 'yes',
            }
            with open(settings_path, 'w', encoding='utf-8') as settings:
                INSTALL.json.dump({'env': existing_env}, settings)

            result = INSTALL.configure_claude_token_audit(
                settings_path, True, 'production', 'workspace-1', 23456
            )
            with open(settings_path, encoding='utf-8') as settings:
                config = INSTALL.json.load(settings)

        self.assertEqual(result, {'source': 'transcript', 'managedEnv': {}})
        self.assertEqual(config['env'], existing_env)
        command = config['hooks']['PostToolUse'][0]['hooks'][0]['command']
        self.assertIn('--source transcript', command)
        for event, _matcher in INSTALL.CLAUDE_TOKEN_AUDIT_HOOK_EVENTS:
            owned_handlers = [
                handler
                for group in config['hooks'][event]
                for handler in group.get('hooks', [])
                if INSTALL._is_claude_token_audit_handler(handler)
            ]
            self.assertEqual(len(owned_handlers), 1, event)
            self.assertEqual(
                owned_handlers[0]['timeout'],
                INSTALL.CLAUDE_TOKEN_AUDIT_TRANSCRIPT_HOOK_TIMEOUT_SECONDS,
                event,
            )

    def test_disable_removes_only_owned_values_and_hook_handlers(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            settings_path = os.path.join(temp_dir, 'settings.json')
            enabled = INSTALL.configure_claude_token_audit(
                settings_path, True, 'stage', 'workspace-1', 23456
            )
            with open(settings_path, encoding='utf-8') as settings:
                config = INSTALL.json.load(settings)
            config['env']['OTEL_LOG_USER_PROMPTS'] = '1'
            config['hooks']['Stop'][0]['hooks'].append(
                {'type': 'command', 'command': 'keep-stop'}
            )
            config['hooks']['PreToolUse'] = [
                {'matcher': '^keep$', 'hooks': []},
            ]
            with open(settings_path, 'w', encoding='utf-8') as settings:
                INSTALL.json.dump(config, settings)

            result = INSTALL.configure_claude_token_audit(
                settings_path, False, 'stage', 'workspace-1', 23456,
                enabled['managedEnv'],
            )
            with open(settings_path, encoding='utf-8') as settings:
                disabled = INSTALL.json.load(settings)

        self.assertEqual(result, {'source': None, 'managedEnv': {}})
        self.assertEqual(disabled['env'], {'OTEL_LOG_USER_PROMPTS': '1'})
        self.assertEqual(
            disabled['hooks']['Stop'],
            [{'hooks': [{'type': 'command', 'command': 'keep-stop'}]}],
        )
        self.assertEqual(
            disabled['hooks']['PreToolUse'],
            [{'matcher': '^keep$', 'hooks': []}],
        )
        for groups in disabled['hooks'].values():
            for group in groups:
                for handler in group.get('hooks', []):
                    self.assertFalse(INSTALL._is_claude_token_audit_handler(handler))


class AtomicScriptInstallTests(unittest.TestCase):
    FILES = (
        ('one.py', 'one.py', 'one'),
        ('two.py', 'two.py', 'two'),
        ('three.py', 'three.py', 'three'),
    )

    def patch_paths(self, temp_dir):
        prefix = os.path.join(temp_dir, 'releases')
        links = os.path.join(temp_dir, 'bin')
        return mock.patch.multiple(
            INSTALL,
            SCRIPT_INSTALL_PREFIX=prefix,
            SYMLINK_DIR=links,
            SCRIPT_FILES=self.FILES,
        )

    @staticmethod
    def successful_download(url, destination):
        with open(destination, 'w', encoding='utf-8') as script:
            script.write('#!/usr/bin/python3\nVALUE = 1\n')

    def release_bin(self, name):
        return os.path.join(INSTALL.SCRIPT_INSTALL_PREFIX, name, 'bin')

    def write_release(self, name, file_count=None, value=1):
        release_bin = self.release_bin(name)
        os.makedirs(release_bin)
        files = self.FILES if file_count is None else self.FILES[:file_count]
        for _source, installed, _link_name in files:
            path = os.path.join(release_bin, installed)
            with open(path, 'w', encoding='utf-8') as script:
                script.write(f'#!/usr/bin/python3\nVALUE = {value}\n')
            INSTALL.make_executable(path)
        return release_bin

    def link_directly_to_release(self, name, file_count=None):
        os.makedirs(INSTALL.SYMLINK_DIR, exist_ok=True)
        files = self.FILES if file_count is None else self.FILES[:file_count]
        for _source, installed, link_name in files:
            os.symlink(
                os.path.join(self.release_bin(name), installed),
                os.path.join(INSTALL.SYMLINK_DIR, link_name),
            )

    def link_through_current(self, name, file_count=None):
        os.makedirs(INSTALL.SYMLINK_DIR, exist_ok=True)
        os.symlink(name, os.path.join(
            INSTALL.SCRIPT_INSTALL_PREFIX, INSTALL.CURRENT_RELEASE_LINK
        ))
        files = self.FILES if file_count is None else self.FILES[:file_count]
        for _source, installed, link_name in files:
            os.symlink(
                os.path.join(
                    INSTALL.SCRIPT_INSTALL_PREFIX,
                    INSTALL.CURRENT_RELEASE_LINK,
                    'bin',
                    installed,
                ),
                os.path.join(INSTALL.SYMLINK_DIR, link_name),
            )

    def assert_public_links_use_current(self, release_name):
        current = os.path.join(
            INSTALL.SCRIPT_INSTALL_PREFIX, INSTALL.CURRENT_RELEASE_LINK
        )
        self.assertEqual(os.readlink(current), release_name)
        for _source, installed, link_name in self.FILES:
            link = os.path.join(INSTALL.SYMLINK_DIR, link_name)
            self.assertEqual(
                os.readlink(link),
                os.path.join(current, 'bin', installed),
            )
            self.assertEqual(
                os.path.realpath(link),
                os.path.join(self.release_bin(release_name), installed),
            )

    def test_download_failure_leaves_existing_release_and_links_untouched(self):
        with tempfile.TemporaryDirectory() as temp_dir, self.patch_paths(temp_dir):
            old_dir = self.write_release('old', value=0)
            self.link_directly_to_release('old')

            calls = 0

            def fail_last(url, destination):
                nonlocal calls
                calls += 1
                if calls == len(self.FILES):
                    raise OSError('last download failed')
                self.successful_download(url, destination)

            with mock.patch.object(INSTALL, 'download_to', side_effect=fail_last):
                with self.assertRaises(OSError):
                    INSTALL.install_scripts('stage', 'new')

            for _source, installed, link_name in self.FILES:
                link = os.path.join(INSTALL.SYMLINK_DIR, link_name)
                self.assertEqual(os.readlink(link), os.path.join(old_dir, installed))
            self.assertFalse(os.path.lexists(os.path.join(
                INSTALL.SCRIPT_INSTALL_PREFIX, INSTALL.CURRENT_RELEASE_LINK
            )))
            self.assertFalse(os.path.exists(
                os.path.join(INSTALL.SCRIPT_INSTALL_PREFIX, 'new')
            ))

    def test_activation_swings_one_current_pointer_and_public_links_are_stable(self):
        with tempfile.TemporaryDirectory() as temp_dir, self.patch_paths(temp_dir):
            with mock.patch.object(
                    INSTALL, 'download_to', side_effect=self.successful_download):
                INSTALL.install_scripts('stage', 'new')
            self.assert_public_links_use_current('new')

    def test_pointer_failure_leaves_old_release_active_and_new_complete(self):
        with tempfile.TemporaryDirectory() as temp_dir, self.patch_paths(temp_dir):
            old_dir = self.write_release('old', value=0)
            self.link_through_current('old')

            real_create_symlink = INSTALL.create_symlink

            def fail_pointer_activation(target, link_path):
                if (link_path == os.path.join(
                        INSTALL.SCRIPT_INSTALL_PREFIX,
                        INSTALL.CURRENT_RELEASE_LINK)
                        and target == 'new'):
                    raise OSError('pointer activation failed')
                real_create_symlink(target, link_path)

            with mock.patch.object(
                    INSTALL, 'download_to', side_effect=self.successful_download), \
                    mock.patch.object(
                        INSTALL,
                        'create_symlink',
                        side_effect=fail_pointer_activation,
                    ):
                with self.assertRaises(OSError):
                    INSTALL.install_scripts('stage', 'new')

            self.assertEqual(os.readlink(os.path.join(
                INSTALL.SCRIPT_INSTALL_PREFIX, INSTALL.CURRENT_RELEASE_LINK
            )), 'old')
            for _source, installed, link_name in self.FILES:
                link = os.path.join(INSTALL.SYMLINK_DIR, link_name)
                self.assertEqual(
                    os.path.realpath(link), os.path.join(old_dir, installed)
                )
            for _source, installed, _link_name in self.FILES:
                self.assertTrue(os.path.isfile(os.path.join(
                    self.release_bin('new'), installed
                )))

    def test_termination_after_pointer_switch_leaves_all_commands_on_new_release(self):
        with tempfile.TemporaryDirectory() as temp_dir, self.patch_paths(temp_dir):
            self.write_release('old', value=0)
            self.link_directly_to_release('old')

            with mock.patch.object(
                    INSTALL, 'download_to', side_effect=self.successful_download), \
                    mock.patch.object(
                        INSTALL,
                        '_repair_all_public_links',
                        side_effect=SystemExit('simulated termination'),
                    ):
                with self.assertRaises(SystemExit):
                    INSTALL.install_scripts('stage', 'new')

            # Pre-switch migration routed every existing command through
            # current, so a process death immediately after the one commit
            # operation cannot leave a mixed old/new command set.
            self.assert_public_links_use_current('new')

    def test_same_stamped_version_with_different_bytes_is_refused(self):
        with tempfile.TemporaryDirectory() as temp_dir, self.patch_paths(temp_dir):
            with mock.patch.object(
                    INSTALL, 'download_to', side_effect=self.successful_download):
                INSTALL.install_scripts('stage', 'release-1')
            original_targets = {
                link_name: os.readlink(os.path.join(INSTALL.SYMLINK_DIR, link_name))
                for _source, _installed, link_name in self.FILES
            }

            def changed_download(url, destination):
                with open(destination, 'w', encoding='utf-8') as script:
                    script.write('#!/usr/bin/python3\nVALUE = 2\n')

            with mock.patch.object(
                    INSTALL, 'download_to', side_effect=changed_download):
                with self.assertRaisesRegex(RuntimeError, 'different contents'):
                    INSTALL.install_scripts('stage', 'release-1')

            for _source, _installed, link_name in self.FILES:
                self.assertEqual(
                    os.readlink(os.path.join(INSTALL.SYMLINK_DIR, link_name)),
                    original_targets[link_name],
                )
            self.assertEqual(os.readlink(os.path.join(
                INSTALL.SCRIPT_INSTALL_PREFIX, INSTALL.CURRENT_RELEASE_LINK
            )), 'release-1')
            for _source, installed, _link_name in self.FILES:
                with open(
                    os.path.join(
                        INSTALL.SCRIPT_INSTALL_PREFIX,
                        'release-1',
                        'bin',
                        installed,
                    ),
                    encoding='utf-8',
                ) as script:
                    self.assertIn('VALUE = 1', script.read())

    def test_same_stamped_version_with_identical_bytes_is_reused(self):
        with tempfile.TemporaryDirectory() as temp_dir, self.patch_paths(temp_dir):
            with mock.patch.object(
                    INSTALL, 'download_to', side_effect=self.successful_download):
                INSTALL.install_scripts('stage', 'release-1')
                release_dir = os.path.join(
                    INSTALL.SCRIPT_INSTALL_PREFIX, 'release-1'
                )
                original_inode = os.stat(release_dir).st_ino
                INSTALL.install_scripts('stage', 'release-1')

            self.assertEqual(os.stat(release_dir).st_ino, original_inode)
            self.assert_public_links_use_current('release-1')

    def test_same_version_repairs_modes_pointer_and_links_without_replacing_files(self):
        with tempfile.TemporaryDirectory() as temp_dir, self.patch_paths(temp_dir):
            with mock.patch.object(
                    INSTALL, 'download_to', side_effect=self.successful_download):
                INSTALL.install_scripts('stage', 'release-1')
                paths = [
                    os.path.join(self.release_bin('release-1'), installed)
                    for _source, installed, _link_name in self.FILES
                ]
                inodes = [os.stat(path).st_ino for path in paths]
                for path in paths:
                    os.chmod(path, stat.S_IRUSR | stat.S_IWUSR)
                os.remove(os.path.join(
                    INSTALL.SCRIPT_INSTALL_PREFIX,
                    INSTALL.CURRENT_RELEASE_LINK,
                ))
                for (_source, installed, link_name), path in zip(
                        self.FILES, paths):
                    link = os.path.join(INSTALL.SYMLINK_DIR, link_name)
                    os.remove(link)
                    os.symlink(path, link)
                INSTALL.install_scripts('stage', 'release-1')

            self.assertEqual([os.stat(path).st_ino for path in paths], inodes)
            for path in paths:
                self.assertTrue(os.stat(path).st_mode & stat.S_IXUSR)
            self.assert_public_links_use_current('release-1')

    def test_old_two_file_same_version_requires_a_new_release_name(self):
        with tempfile.TemporaryDirectory() as temp_dir, self.patch_paths(temp_dir):
            self.write_release('release-1', file_count=2)
            self.link_directly_to_release('release-1', file_count=2)

            with mock.patch.object(
                    INSTALL, 'download_to', side_effect=self.successful_download):
                with self.assertRaisesRegex(
                        RuntimeError, 'incomplete.*new script version'):
                    INSTALL.install_scripts('stage', 'release-1')

            self.assertFalse(os.path.lexists(os.path.join(
                INSTALL.SCRIPT_INSTALL_PREFIX, INSTALL.CURRENT_RELEASE_LINK
            )))
            self.assertFalse(os.path.exists(os.path.join(
                self.release_bin('release-1'), self.FILES[2][1]
            )))
            for _source, installed, link_name in self.FILES[:2]:
                self.assertEqual(
                    os.path.realpath(os.path.join(
                        INSTALL.SYMLINK_DIR, link_name
                    )),
                    os.path.join(self.release_bin('release-1'), installed),
                )

    def test_new_version_migrates_legacy_two_file_release_safely(self):
        with tempfile.TemporaryDirectory() as temp_dir, self.patch_paths(temp_dir):
            self.write_release('old', file_count=2, value=0)
            self.link_directly_to_release('old', file_count=2)

            with mock.patch.object(
                    INSTALL, 'download_to', side_effect=self.successful_download):
                INSTALL.install_scripts('stage', 'new')

            self.assert_public_links_use_current('new')
            self.assertTrue(os.path.isdir(
                os.path.join(INSTALL.SCRIPT_INSTALL_PREFIX, 'old')
            ))

    def test_different_unversioned_installs_use_distinct_immutable_releases(self):
        with tempfile.TemporaryDirectory() as temp_dir, self.patch_paths(temp_dir):
            downloads = 0

            def changing_download(url, destination):
                nonlocal downloads
                # install_scripts downloads every release as one batch.
                release_number = downloads // len(self.FILES) + 1
                downloads += 1
                with open(destination, 'w', encoding='utf-8') as script:
                    script.write(
                        f'#!/usr/bin/python3\nVALUE = {release_number}\n'
                    )

            with mock.patch.object(
                    INSTALL, 'download_to', side_effect=changing_download), \
                    mock.patch.object(
                        INSTALL,
                        '_new_unversioned_release_name',
                        side_effect=('unversioned-first', 'unversioned-second'),
                    ):
                INSTALL.install_scripts('stage', None)
                current = os.path.join(
                    INSTALL.SCRIPT_INSTALL_PREFIX,
                    INSTALL.CURRENT_RELEASE_LINK,
                )
                first_release = os.readlink(current)
                INSTALL.install_scripts('stage', None)
                second_release = os.readlink(current)

            self.assertEqual(first_release, 'unversioned-first')
            self.assertEqual(second_release, 'unversioned-second')
            first_path = os.path.join(
                self.release_bin(first_release), self.FILES[0][1]
            )
            second_path = os.path.join(
                self.release_bin(second_release), self.FILES[0][1]
            )
            self.assertTrue(os.path.exists(first_path))
            self.assertTrue(os.path.exists(second_path))
            with open(first_path, encoding='utf-8') as first_script:
                self.assertIn('VALUE = 1', first_script.read())
            with open(second_path, encoding='utf-8') as second_script:
                self.assertIn('VALUE = 2', second_script.read())

    def test_setup_bootstrap_copies_installer_and_accepts_one_pinned_bundle(self):
        payload = b'#!/usr/bin/python3\nVALUE = 1\n'
        pins = {
            source_name: hashlib.sha256(payload).hexdigest()
            for source_name, _installed_name, _symlink_name in INSTALL.SCRIPT_FILES
            if source_name != 'uclusionInstall.py'
        }

        def pinned_download(_url, destination):
            with open(destination, 'wb') as script:
                script.write(payload)

        with tempfile.TemporaryDirectory() as temp_dir, mock.patch.multiple(
            INSTALL,
            SCRIPT_INSTALL_PREFIX=os.path.join(temp_dir, 'releases'),
            SYMLINK_DIR=os.path.join(temp_dir, 'bin'),
            SETUP_BOOTSTRAP_SCRIPT_SHA256=pins,
        ), mock.patch.object(
            INSTALL,
            '_new_unversioned_release_name',
            return_value='unversioned-setup',
        ), mock.patch.object(
            INSTALL, 'download_to', side_effect=pinned_download
        ) as download:
            INSTALL.install_scripts('stage', None, setup_bootstrap=True)

            downloaded = [call.args[0] for call in download.call_args_list]
            self.assertNotIn(
                INSTALL.get_scripts_base_url('stage') + 'uclusionInstall.py',
                downloaded,
            )
            self.assertEqual(len(INSTALL.SCRIPT_FILES) - 1, len(downloaded))
            installed_path = os.path.join(
                INSTALL.SCRIPT_INSTALL_PREFIX,
                'unversioned-setup',
                'bin',
                'uclusionInstall.py',
            )
            with open(INSTALL.__file__, 'rb') as running, open(
                installed_path, 'rb'
            ) as installed:
                self.assertEqual(running.read(), installed.read())

    def test_setup_bootstrap_rejects_mixed_bundle_before_activation(self):
        payload = b'#!/usr/bin/python3\nVALUE = 1\n'
        pins = {
            source_name: hashlib.sha256(payload).hexdigest()
            for source_name, _installed_name, _symlink_name in INSTALL.SCRIPT_FILES
            if source_name != 'uclusionInstall.py'
        }

        def mixed_download(url, destination):
            content = (
                b'#!/usr/bin/python3\nVALUE = 2\n'
                if url.endswith('/uclusionSetupMCP.py')
                else payload
            )
            with open(destination, 'wb') as script:
                script.write(content)

        with tempfile.TemporaryDirectory() as temp_dir, mock.patch.multiple(
            INSTALL,
            SCRIPT_INSTALL_PREFIX=os.path.join(temp_dir, 'releases'),
            SYMLINK_DIR=os.path.join(temp_dir, 'bin'),
            SETUP_BOOTSTRAP_SCRIPT_SHA256=pins,
        ), mock.patch.object(
            INSTALL,
            '_new_unversioned_release_name',
            return_value='unversioned-mixed',
        ), mock.patch.object(
            INSTALL, 'download_to', side_effect=mixed_download
        ):
            with self.assertRaisesRegex(
                RuntimeError,
                'uclusionSetupMCP.py does not match this installer release',
            ):
                INSTALL.install_scripts('stage', None, setup_bootstrap=True)

            self.assertFalse(os.path.lexists(os.path.join(
                INSTALL.SCRIPT_INSTALL_PREFIX,
                INSTALL.CURRENT_RELEASE_LINK,
            )))
            self.assertFalse(os.path.exists(os.path.join(
                INSTALL.SCRIPT_INSTALL_PREFIX, 'unversioned-mixed'
            )))

    def test_setup_bootstrap_pins_match_the_current_source_bundle(self):
        INSTALL.validate_setup_script_bundle(os.path.dirname(INSTALL.__file__))

    def test_setup_bootstrap_rejects_incomplete_pins_before_download(self):
        pins = dict(INSTALL.SETUP_BOOTSTRAP_SCRIPT_SHA256)
        pins.pop('uclusionSetupMCP.py')
        with tempfile.TemporaryDirectory() as temp_dir, mock.patch.multiple(
            INSTALL,
            SCRIPT_INSTALL_PREFIX=os.path.join(temp_dir, 'releases'),
            SYMLINK_DIR=os.path.join(temp_dir, 'bin'),
            SETUP_BOOTSTRAP_SCRIPT_SHA256=pins,
        ), mock.patch.object(INSTALL, 'download_to') as download:
            with self.assertRaisesRegex(
                RuntimeError, 'pins do not match the installer bundle'
            ):
                INSTALL.install_scripts('stage', None, setup_bootstrap=True)

        download.assert_not_called()

    def test_reserved_release_names_are_rejected_before_download(self):
        reserved = (
            'current',
            'CURRENT',
            'v1',
            'bin',
            'unversioned',
            'unversioned-manual',
            '.staging-forged',
            '../outside',
        )
        for version in reserved:
            with self.subTest(version=version), \
                    tempfile.TemporaryDirectory() as temp_dir, \
                    self.patch_paths(temp_dir), \
                    mock.patch.object(INSTALL, 'download_to') as download:
                with self.assertRaisesRegex(RuntimeError, 'reserved|Unsafe'):
                    INSTALL.install_scripts('stage', version)
                download.assert_not_called()

    def test_prune_retains_prior_and_every_symlink_referenced_release(self):
        with tempfile.TemporaryDirectory() as temp_dir, self.patch_paths(temp_dir):
            os.makedirs(INSTALL.SCRIPT_INSTALL_PREFIX)
            for index, name in enumerate(
                    ('referenced', 'discard', 'previous', 'active'), start=1):
                path = os.path.join(INSTALL.SCRIPT_INSTALL_PREFIX, name)
                os.makedirs(path)
                os.utime(path, (index, index))
            os.makedirs(INSTALL.SYMLINK_DIR)
            os.symlink('active', os.path.join(
                INSTALL.SCRIPT_INSTALL_PREFIX, INSTALL.CURRENT_RELEASE_LINK
            ))
            os.symlink(
                os.path.join(
                    INSTALL.SCRIPT_INSTALL_PREFIX,
                    'referenced',
                    'bin',
                    self.FILES[0][1],
                ),
                os.path.join(INSTALL.SYMLINK_DIR, self.FILES[0][2]),
            )
            INSTALL.prune_old_install_dirs('active', retain_previous=1)
            self.assertFalse(os.path.exists(
                os.path.join(INSTALL.SCRIPT_INSTALL_PREFIX, 'discard')
            ))
            self.assertTrue(os.path.isdir(
                os.path.join(INSTALL.SCRIPT_INSTALL_PREFIX, 'referenced')
            ))
            self.assertTrue(os.path.isdir(
                os.path.join(INSTALL.SCRIPT_INSTALL_PREFIX, 'previous')
            ))
            self.assertTrue(os.path.isdir(
                os.path.join(INSTALL.SCRIPT_INSTALL_PREFIX, 'active')
            ))

    def test_install_lock_serializes_concurrent_publications(self):
        with tempfile.TemporaryDirectory() as temp_dir, self.patch_paths(temp_dir):
            first_started = threading.Event()
            allow_first_to_finish = threading.Event()
            download_threads = []
            errors = []

            def controlled_download(url, destination):
                thread_name = threading.current_thread().name
                download_threads.append(thread_name)
                if thread_name == 'installer-one' and not first_started.is_set():
                    first_started.set()
                    if not allow_first_to_finish.wait(timeout=3):
                        raise RuntimeError('test timed out waiting to release lock')
                self.successful_download(url, destination)

            def run(version):
                try:
                    INSTALL.install_scripts('stage', version)
                except Exception as err:  # pragma: no cover - asserted below
                    errors.append(err)

            with mock.patch.object(
                    INSTALL, 'download_to', side_effect=controlled_download), \
                    mock.patch.object(INSTALL, 'warn_if_not_on_path'):
                first = threading.Thread(
                    target=run, args=('first',), name='installer-one'
                )
                second = threading.Thread(
                    target=run, args=('second',), name='installer-two'
                )
                first.start()
                self.assertTrue(first_started.wait(timeout=3))
                second.start()
                time.sleep(0.1)
                self.assertNotIn('installer-two', download_threads)
                allow_first_to_finish.set()
                first.join(timeout=3)
                second.join(timeout=3)

            self.assertFalse(first.is_alive())
            self.assertFalse(second.is_alive())
            self.assertEqual(errors, [])
            self.assertEqual(os.readlink(os.path.join(
                INSTALL.SCRIPT_INSTALL_PREFIX, INSTALL.CURRENT_RELEASE_LINK
            )), 'second')
            self.assert_public_links_use_current('second')


class CursorPokeDrainHookRemovalTests(unittest.TestCase):
    def test_missing_or_malformed_unrelated_hooks_json_is_unchanged(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            hooks_path = os.path.join(temp_dir, 'hooks.json')
            with mock.patch.object(
                INSTALL,
                'SCRIPT_INSTALL_PREFIX',
                os.path.join(temp_dir, 'locks'),
            ):
                self.assertFalse(
                    INSTALL.remove_cursor_poke_drain_hook(hooks_path)
                )
            self.assertFalse(os.path.exists(hooks_path))

            malformed = '{not valid JSON\n'
            with open(hooks_path, 'w', encoding='utf-8') as hooks_file:
                hooks_file.write(malformed)
            with mock.patch.object(
                INSTALL,
                'SCRIPT_INSTALL_PREFIX',
                os.path.join(temp_dir, 'locks'),
            ):
                self.assertFalse(
                    INSTALL.remove_cursor_poke_drain_hook(hooks_path)
                )
            with open(hooks_path, encoding='utf-8') as hooks_file:
                self.assertEqual(malformed, hooks_file.read())

    def test_removes_all_uclusion_entries_and_preserves_other_hook_groups(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            hooks_path = os.path.join(temp_dir, 'hooks.json')
            bin_dir = os.path.join(temp_dir, 'bin')
            managed = os.path.join(
                bin_dir, INSTALL.CURSOR_POKE_DRAIN_SYMLINK_NAME
            )
            with open(hooks_path, 'w', encoding='utf-8') as hooks_file:
                INSTALL.json.dump(
                    {
                        'version': True,
                        'hooks': {'stop': [{'command': managed}]},
                    },
                    hooks_file,
                )
            with mock.patch.object(
                INSTALL,
                'SCRIPT_INSTALL_PREFIX',
                os.path.join(temp_dir, 'locks'),
            ), mock.patch.object(
                INSTALL, 'SYMLINK_DIR', bin_dir,
            ), self.assertRaisesRegex(RuntimeError, 'expected 1'):
                INSTALL.remove_cursor_poke_drain_hook(hooks_path)

            with open(hooks_path, 'w', encoding='utf-8') as hooks_file:
                INSTALL.json.dump(
                    {
                        'version': 1,
                        'hooks': {
                            'stop': [
                                {
                                    'command': managed,
                                    'loop_limit': 5,
                                },
                                {
                                    'command': managed,
                                },
                            ],
                            'sessionStart': [
                                {'command': './hooks/start.sh'},
                            ],
                        },
                    },
                    hooks_file,
                )
            with mock.patch.object(
                INSTALL,
                'SCRIPT_INSTALL_PREFIX',
                os.path.join(temp_dir, 'locks'),
            ), mock.patch.object(
                INSTALL, 'SYMLINK_DIR', bin_dir,
            ):
                self.assertTrue(
                    INSTALL.remove_cursor_poke_drain_hook(hooks_path)
                )
                self.assertFalse(
                    INSTALL.remove_cursor_poke_drain_hook(hooks_path)
                )

            with open(hooks_path, encoding='utf-8') as hooks_file:
                config = INSTALL.json.load(hooks_file)

            self.assertEqual(
                config['hooks']['sessionStart'],
                [{'command': './hooks/start.sh'}],
            )
            self.assertNotIn('stop', config['hooks'])

    def test_project_cursor_install_removes_only_uclusion_stop_hook(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            project_dir = os.path.join(temp_dir, 'project')
            os.makedirs(project_dir)
            bin_dir = os.path.join(temp_dir, 'bin')
            managed = os.path.join(
                bin_dir, INSTALL.CURSOR_POKE_DRAIN_SYMLINK_NAME
            )
            hooks_path = os.path.join(project_dir, '.cursor', 'hooks.json')
            os.makedirs(os.path.dirname(hooks_path))
            with open(hooks_path, 'w', encoding='utf-8') as hooks_file:
                INSTALL.json.dump(
                    {
                        'version': 1,
                        'hooks': {
                            'stop': [
                                {'command': './hooks/other.sh'},
                                {
                                    'command': './hooks/'
                                    'check-uclusionCursorPokeDrain-state.sh',
                                },
                                {
                                    'command': managed,
                                },
                            ],
                        },
                    },
                    hooks_file,
                )
            with mock.patch.object(
                    INSTALL,
                    'SCRIPT_INSTALL_PREFIX',
                    os.path.join(temp_dir, 'locks'),
            ), mock.patch.object(
                    INSTALL, 'SYMLINK_DIR', bin_dir,
            ), mock.patch.object(INSTALL, 'register_mcp_json'), \
                    mock.patch.object(INSTALL, 'install_skill_and_stub'), \
                    mock.patch.object(
                        INSTALL, 'write_uclusion_config',
                        return_value=({'enabled': False, 'port': 23456}, False),
                    ), \
                    mock.patch.object(
                        INSTALL, 'persist_workflow_install_state'
                    ), \
                    mock.patch.object(
                        INSTALL, 'remove_legacy_codex_hooks_config'
                    ):
                INSTALL.install_project_level(
                    'workspace-1',
                    None,
                    'stage',
                    fetch_bundle=lambda: None,
                    project_dir=project_dir,
                    clients={'cursor'},
                )

            with open(hooks_path, encoding='utf-8') as hooks_file:
                config = INSTALL.json.load(hooks_file)
            self.assertEqual(
                [
                    {'command': './hooks/other.sh'},
                    {
                        'command': './hooks/'
                        'check-uclusionCursorPokeDrain-state.sh',
                    },
                ],
                config['hooks']['stop'],
            )


if __name__ == '__main__':
    unittest.main()
