"""The demo provisions once, then uses the ordinary disposable install."""

import importlib.util
import inspect
import json
import os
from pathlib import Path
import stat
import tempfile
import unittest
from unittest import mock


def load_script(name):
    path = Path(__file__).resolve().parents[1] / (name + '.py')
    spec = importlib.util.spec_from_file_location(name + '_install_test', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


INSTALL = load_script('uclusionInstall')


class DemoHomeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        patcher = mock.patch.object(
            INSTALL.tempfile, 'gettempdir', return_value=self.temp.name
        )
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_demo_home_is_private_and_deterministic(self):
        first = INSTALL.demo_runtime_dir()
        second = INSTALL.demo_runtime_dir()
        self.assertEqual(first, second)
        self.assertEqual(stat.S_IMODE(os.stat(first).st_mode), 0o700)

    def test_a_pre_existing_path_we_do_not_own_is_refused(self):
        hostile = Path(INSTALL.demo_runtime_dir())
        hostile.rmdir()
        hostile.symlink_to(self.temp.name)
        with self.assertRaisesRegex(RuntimeError, 'not a directory'):
            INSTALL.demo_runtime_dir()

    def test_a_widened_directory_is_narrowed(self):
        directory = Path(INSTALL.demo_runtime_dir())
        os.chmod(directory, 0o755)
        INSTALL.demo_runtime_dir()
        self.assertEqual(stat.S_IMODE(os.stat(directory).st_mode), 0o700)

    def test_reexec_sets_home_before_import_time_paths_are_recomputed(self):
        home = INSTALL.demo_runtime_dir()
        with mock.patch.object(
            INSTALL, 'uclusion_home_root', return_value='/real/home'
        ), mock.patch.object(
            INSTALL.os, 'execve', side_effect=RuntimeError('reexec')
        ) as execute:
            with self.assertRaisesRegex(RuntimeError, 'reexec'):
                INSTALL.reexec_in_demo_home()
        environment = execute.call_args.args[2]
        self.assertEqual(environment['UCLUSION_HOME'], home)

    def test_reexec_leaves_the_client_configuration_where_it_is(self):
        # A moved configuration directory holds no credentials, and the
        # person's identity is a logged-in session rather than a file the
        # installer could copy. A session started against a moved one reports
        # "Not logged in" and never begins the exercise.
        with mock.patch.object(
            INSTALL, 'uclusion_home_root', return_value='/real/home'
        ), mock.patch.object(
            INSTALL.os, 'execve', side_effect=RuntimeError('reexec')
        ) as execute:
            with self.assertRaisesRegex(RuntimeError, 'reexec'):
                INSTALL.reexec_in_demo_home()
        environment = execute.call_args.args[2]
        self.assertNotIn('CLAUDE_CONFIG_DIR', environment)

    def test_the_plugin_and_bootstrap_stay_inside_the_demo_home(self):
        # Both are named on the launch line, so they have to live somewhere
        # that removing the demo takes with it.
        self.assertTrue(
            INSTALL.demo_plugin_path().startswith(INSTALL.UCLUSION_HOME)
        )
        self.assertTrue(
            INSTALL.demo_bootstrap_path().startswith(INSTALL.UCLUSION_HOME)
        )

    def test_removal_reports_cleanly_beside_the_person_s_own_install(self):
        # A person who already uses Uclusion can now take the demo. Removal
        # must not inspect their client, find their own registration and
        # report the demo as only partly removed - which is what it did.
        home = Path(INSTALL.UCLUSION_HOME)
        (home / 'plugin').mkdir(parents=True, exist_ok=True)
        with mock.patch.object(
            INSTALL, 'demo_installed_clients', return_value=['claude']
        ), mock.patch.object(
            INSTALL, '_demo_client_paths', return_value=('resident', ('a', 'b'))
        ), mock.patch.object(
            INSTALL, '_remove_demo_registration'
        ) as registration:
            outcomes = INSTALL.remove_demo_client_traces()
        registration.assert_not_called()
        self.assertEqual(['absent'], [state for state, _detail in outcomes])

    def test_the_demo_guard_only_protects_clients_it_still_writes_to(self):
        # Both clients now carry their demo workflow outside native config.
        source = inspect.getsource(INSTALL.main)
        self.assertNotIn('assert_demo_may_replace_client(setup_client)', source)

    def test_the_launch_configuration_stays_inside_the_demo_home(self):
        # The launch line names this file, so it has to be somewhere removing
        # the demo takes with it.
        self.assertTrue(
            INSTALL.demo_mcp_config_path().startswith(INSTALL.UCLUSION_HOME)
        )

    def test_the_installer_runs_the_exercise_rather_than_printing_it(self):
        # Two sessions have to be started in a fixed order by something that
        # can see both, and stopped by it afterwards. Printing commands for
        # another agent to run is what this replaced, and an owner left
        # running fails silently, so the stop is part of the contract rather
        # than tidiness. Nothing passes between participants as a file.
        # S-Marketing-77: the demo command starts a detached supervisor, which is
        # the one process that starts both sessions and stops them.
        self.assertIn('start_demo_supervisor(', inspect.getsource(INSTALL.main))
        supervise = inspect.getsource(INSTALL.supervise_demo)
        self.assertIn('run_claude_demo', supervise)
        self.assertIn('run_codex_demo', supervise)
        source = inspect.getsource(INSTALL.run_claude_demo)
        self.assertIn('wait_for_owner_watch(', source)
        self.assertIn('stop_demo_home_processes(', source)
        # S-Marketing-73: the evaluator publishes its report to the installer,
        # which is not a participant. Only the evaluator is told where, and
        # the owner's directions name nothing but its brief.
        self.assertEqual(1, source.count("['UCLUSION_DEMO_REPORT_FILE']"))
        self.assertIn('env=evaluator_environment', source)
        owner_launch = source[source.index('owner = subprocess.Popen('):]
        self.assertNotIn('env=', owner_launch[:owner_launch.index(')')])

    def test_the_brief_is_a_file_in_the_home_not_an_address(self):
        # A session's grant holds the demo's tools and its CLI; nothing in it
        # can fetch a URL, so an owner handed a link has no instructions.
        self.assertIn('demo_brief', INSTALL.WORKFLOW_ASSET_PATHS)
        self.assertIn('demo_brief', INSTALL.WORKFLOW_ASSET_SHA256)
        self.assertTrue(
            INSTALL.demo_brief_path().startswith(INSTALL.UCLUSION_HOME)
        )
        source = inspect.getsource(INSTALL.run_claude_demo)
        self.assertIn('demo_brief_path()', source)
        self.assertNotIn('demo_brief_url', source)

    def test_the_claude_owner_is_told_not_to_start_a_poke_listener(self):
        # S-Marketing-74: its bootstrap says to arm Poke delivery, but the
        # owner shares the evaluator's credential, so a listener would hand it
        # the evaluator's AI events. The Codex owner is told the same.
        home = tempfile.TemporaryDirectory()
        self.addCleanup(home.cleanup)
        launched = []

        def launch(command, **kwargs):
            process = mock.Mock()
            process.poll.return_value = 0
            launched.append(process)
            return process

        with mock.patch.object(INSTALL, 'UCLUSION_HOME', home.name), \
                mock.patch.object(INSTALL, 'demo_session_args', return_value=[]), \
                mock.patch.object(INSTALL, 'write_demo_evaluator_mcp_config'), \
                mock.patch.object(INSTALL.subprocess, 'Popen', side_effect=launch), \
                mock.patch.object(INSTALL, 'wait_for_owner_watch', return_value=True), \
                mock.patch.object(INSTALL, 'stop_demo_session'), \
                mock.patch.object(INSTALL, 'stop_demo_home_processes', return_value=(0, [])), \
                mock.patch('builtins.print'):
            INSTALL.run_claude_demo('stage', 'workspace', 'Start J-Demo-1.')
            brief = INSTALL.demo_brief_path()
        opening = launched[0].stdin.write.call_args.args[0]
        self.assertTrue(opening.startswith(
            f'Read the file {brief} and follow it exactly. It is addressed to you. '
        ), opening)
        self.assertIn(
            'You play the human workshop owner, so use '
            f'{INSTALL.workflow_cli_command("stage")} watch for human notifications '
            'and do not start a Poke listener or drain.', opening)
        codex = inspect.getsource(INSTALL.run_codex_demo)
        self.assertIn("'Poke listener or drain.", codex)

    def test_the_evaluator_is_not_told_what_its_report_is_for(self):
        # Its scope is what it used. Naming the comparison, or the reader who
        # makes it, hands it a frame to write toward - which is the coaching
        # the demo is not allowed to do, and naming the project is what puts
        # the project in the room.
        source = inspect.getsource(INSTALL.run_claude_demo)
        self.assertIn('Report on Uclusion itself', source)
        for leak in ('compare your report', 'whoever is reading',
                     'Do not speculate about the project'):
            self.assertNotIn(leak, source)

    def test_the_grant_is_argv_not_a_shell_line(self):
        # shlex.quote output here arrives as literal quote characters, the
        # client rejects both rules as malformed, and every session runs with
        # no grant at all - which is why the owner could not run its watch.
        args = INSTALL.demo_session_args('stage')
        grant = args[args.index('--allowedTools') + 1:]
        for value in grant[:2]:
            self.assertFalse(value.startswith("'"), value)
            self.assertFalse(value.endswith("'"), value)
        self.assertIn('mcp__Uclusion__*', grant)

    def test_sessions_load_none_of_the_person_s_own_settings(self):
        # S-Marketing-75: anything in a customer's global directory, or in the
        # project the installer was run from, could change how the demo's
        # sessions behave. Project and local mean the demo home, where they start.
        args = INSTALL.demo_session_args('stage')
        self.assertEqual('project,local', args[args.index('--setting-sources') + 1])
        source = inspect.getsource(INSTALL.run_claude_demo)
        self.assertEqual(2, source.count("['claude'] + "))
        self.assertEqual(2, source.count('cwd=uclusion_home_root()'))

    def test_sessions_can_reach_the_demo_home_they_are_told_to_read(self):
        # The brief and the workflow references sit under the demo home.
        self.assertIn('--add-dir', INSTALL.demo_session_args('stage'))
        # The launch must use that definition rather than assembling its own.
        self.assertIn('demo_session_args(env)', inspect.getsource(INSTALL.run_claude_demo))

    def test_the_owner_session_is_kept_for_diagnosis(self):
        # When the owner never wakes, its session is the only evidence of why.
        source = inspect.getsource(INSTALL.run_claude_demo)
        self.assertIn("'owner.log'", source)
        self.assertIn("'evaluator.log'", source)
        self.assertNotIn('stdout=subprocess.DEVNULL', source)

    def test_the_sessions_write_their_logs_as_they_go(self):
        # S-Marketing-92: text output arrives only when a turn ends, which the
        # supervisor never lets either session reach, so both logs stayed empty.
        args = INSTALL.demo_session_args('stage')
        self.assertEqual('stream-json', args[args.index('--output-format') + 1])
        self.assertIn('--verbose', args)

    def test_a_demo_can_be_installed_without_running_the_exercise(self):
        # Installing and running are one command now, so without this the
        # pre-flight would have to spend an exercise to get a home to check.
        source = inspect.getsource(INSTALL.main)
        self.assertIn("os.environ.get('UCLUSION_DEMO_INSTALL_ONLY')", source)
        # It has to stop before anything is started, not after.
        self.assertLess(
            source.index('UCLUSION_DEMO_INSTALL_ONLY'),
            source.index('return start_demo_supervisor('),
        )

    def test_the_progress_command_is_named_before_any_session_starts(self):
        # The person's agent reads this output while the command runs; a
        # command printed after the sessions start could arrive too late to
        # follow them, and the pre-flight has to see it too.
        source = inspect.getsource(INSTALL.main)
        self.assertLess(
            source.index('reset_demo_progress(env)'),
            source.index('UCLUSION_DEMO_INSTALL_ONLY'),
        )

    def test_demo_output_is_line_buffered_from_the_start(self):
        # Block buffering held every line back until the evaluator had
        # finished whenever the output went to a file, which is where a
        # backgrounded command's output goes (R-Marketing-788).
        source = inspect.getsource(INSTALL.main)
        self.assertLess(
            source.index('reconfigure(line_buffering=True)'),
            source.index('reexec_in_demo_home()'),
        )

    def test_a_new_run_starts_its_progress_from_nothing(self):
        # The home is reused, so an old log would report a finished exercise.
        home = tempfile.TemporaryDirectory()
        self.addCleanup(home.cleanup)
        patcher = mock.patch.object(INSTALL, 'UCLUSION_HOME', home.name)
        patcher.start()
        self.addCleanup(patcher.stop)
        log = Path(INSTALL.demo_notification_log_path())
        log.write_text('2026-09-23T21:29:00Z\tUNREAD_REVIEWABLE\trow\n')
        with mock.patch('builtins.print') as printed:
            INSTALL.reset_demo_progress('stage')
        self.assertFalse(log.exists())
        line = printed.call_args.args[0]
        self.assertIn(
            f'{INSTALL.workflow_cli_command("stage")} demo --progress --wait',
            line,
        )
        # A missing log is the ordinary first run, not an error.
        with mock.patch('builtins.print'):
            INSTALL.reset_demo_progress('stage')

    def test_the_installer_resets_the_log_the_owner_s_watch_writes(self):
        cli = load_script('uclusionCLI')
        self.assertEqual(INSTALL.DEMO_NOTIFICATION_LOG, cli.DEMO_NOTIFICATION_LOG)
        self.assertEqual(
            INSTALL.demo_notification_log_path(),
            os.path.join(cli.uclusion_home_root(), '.uclusion',
                         cli.DEMO_NOTIFICATION_LOG),
        )

    def test_only_the_evaluator_records_response_sizes(self):
        # The owner keeps the shared config; the evaluator's copy differs
        # only by the flag, so nothing else about the two sessions diverges.
        home = tempfile.TemporaryDirectory()
        self.addCleanup(home.cleanup)
        patcher = mock.patch.object(INSTALL, 'UCLUSION_HOME', home.name)
        patcher.start()
        self.addCleanup(patcher.stop)
        shared = {'mcpServers': {INSTALL.MCP_SERVER_KEY: {
            'command': 'python3', 'args': ['proxy.py', 'workspace', 'stage'],
            'type': 'stdio',
        }}}
        Path(INSTALL.demo_mcp_config_path()).write_text(json.dumps(shared))
        path = INSTALL.write_demo_evaluator_mcp_config('/tmp/eval.jsonl')
        self.assertEqual(INSTALL.demo_evaluator_mcp_config_path(), path)
        evaluator = json.loads(Path(path).read_text())
        server = evaluator['mcpServers'][INSTALL.MCP_SERVER_KEY]
        self.assertEqual(
            ['proxy.py', 'workspace', 'stage', '--response-stats', '/tmp/eval.jsonl'],
            server['args'],
        )
        self.assertEqual('stdio', server['type'])
        self.assertEqual(shared, json.loads(
            Path(INSTALL.demo_mcp_config_path()).read_text()
        ))
        args = INSTALL.demo_session_args('stage', path)
        self.assertEqual(path, args[args.index('--mcp-config') + 1])
        # The home is reused: a run without statistics must not keep
        # recording into an earlier run's path.
        self.assertIsNone(INSTALL.write_demo_evaluator_mcp_config(None))
        self.assertFalse(Path(path).exists())
        args = INSTALL.demo_session_args('stage', None)
        self.assertEqual(
            INSTALL.demo_mcp_config_path(), args[args.index('--mcp-config') + 1]
        )

    def test_the_claude_evaluator_is_launched_with_its_own_config(self):
        source = inspect.getsource(INSTALL.run_claude_demo)
        self.assertIn('write_demo_evaluator_mcp_config(response_stats)', source)
        self.assertIn("['claude'] + evaluator_session_args", source)
        self.assertIn('response_stats=args.response_stats',
                      inspect.getsource(INSTALL.main))
        # The shared registration is the owner's and never records.
        self.assertIn(
            "None if bootstrap_mode == 'demo' else args.response_stats",
            inspect.getsource(INSTALL.main),
        )

    def demo_guard(self, *argv):
        # Past the argument guard, the next step is the demo home re-exec.
        with mock.patch.object(INSTALL.sys, 'argv', ['uclusionInstall.py', *argv]), \
                mock.patch.object(INSTALL, 'reexec_in_demo_home',
                                  side_effect=RuntimeError('past the guard')), \
                mock.patch('builtins.print') as printed, \
                mock.patch.object(INSTALL.sys, 'stderr'):
            try:
                result = INSTALL.main()
            except SystemExit as refusal:
                return 'refused', refusal.code
        return result, ' '.join(str(call.args[0]) for call in printed.call_args_list)

    def test_demo_mode_accepts_a_statistics_path_and_nothing_else_new(self):
        result, output = self.demo_guard(
            'stage', 'demo', '--clients', 'claude',
            '--response-stats', '/tmp/eval.jsonl',
        )
        self.assertEqual(1, result)
        self.assertIn('past the guard', output)
        for argv in (
            ('stage', 'demo', '--clients', 'claude', '--no-response-stats'),
            ('stage', 'setup', '--clients', 'claude',
             '--response-stats', '/tmp/eval.jsonl'),
            ('stage', 'demo', '--clients', 'claude', '--work-claims'),
        ):
            with self.subTest(argv=argv):
                self.assertEqual(('refused', 2), self.demo_guard(*argv))

    def test_removal_refuses_a_home_something_is_still_using(self):
        # A session started against this home keeps its client and its
        # credentials inside it, and deleting underneath one fails later,
        # somewhere nobody is watching.
        source = inspect.getsource(INSTALL.remove_demo_install)
        self.assertIn('stop_demo_home_processes(home)', source)
        self.assertIn('Refusing to delete', source)

    def test_the_process_scan_cannot_stop_its_own_removal(self):
        # The removal pipeline and the shell that launched it both name this
        # home on their command lines, and so does anything else that merely
        # mentions the path - a grep, an editor, the script running a check.
        # Matching those means killing bystanders, and in the gate's first run
        # it meant killing the gate.
        home = INSTALL.demo_home_path()
        listing = '\n'.join([
            f'  111 claude --mcp-config {home}/.uclusion/mcp.json',
            f'  222 python3 {home}/.local/bin/uclusionInstall.py '
            f'{INSTALL.DEMO_REMOVE_MODE} stage',
            f'  333 bash -c UCLUSION_HOME={home} uclusion -e stage demo --remove',
            f'  {os.getpid()} python3 {home}/anything',
            '  444 an unrelated process',
            f'  555 grep -r something {home}',
            f'  666 /bin/bash ./gate.sh {home} stage',
            # Named a file inside the home on its command line without ever
            # running it. This is what killed the gate twice.
            f'  777 /bin/bash -c GATE_INSTALLER={home}/.local/bin/x.py ./gate.sh',
            f'  888 vim {home}/.uclusion/bootstrap.md',
            # The demo's own client, running from the home.
            f'  999 python3 {home}/.local/bin/uclusion.py -e stage watch',
            f'  1001 codex exec -c projects={{"{home}"={{trust_level="trusted"}}}} '
            f'-c mcp_servers={{Uclusion={{args=["{home}/.local/bin/uclusionMCPProxy.py"]}}}} '
            f'Read the brief and run {home}/.local/bin/uclusion -e stage watch',
            f'  1002 codex exec inspect files in {home}',
            # The person's agent following the run: it only reads a log and
            # ends on its own, and killing it would hand the agent a failed
            # command just as the report arrives.
            f'  1003 python3 {home}/.local/bin/uclusion -e stage demo '
            '--progress --wait',
        ])
        with mock.patch.object(
            INSTALL.subprocess, 'run', return_value=mock.Mock(stdout=listing)
        ):
            found = INSTALL.demo_home_processes(home)
            watchers = INSTALL.demo_home_processes(home, ' watch')
        self.assertEqual([111, 999, 1001], sorted(pid for pid, _args in found))
        self.assertEqual([999], [pid for pid, _args in watchers])


class DemoProvisionTests(unittest.TestCase):
    DEMO_ID = '11111111-1111-4111-8111-111111111111'
    READY = {
        'demo_id': DEMO_ID,
        'state': 'READY',
        'workspace_id': 'workspace-1',
        'view_id': 'view-1',
        'client_id': 'ai-demo:11111111-1111-4111-8111-111111111111:human_account-1',
        'starting_job_short_codes': ['J-Demo-1'],
    }

    def provision(self, start_state, polls_before_ready):
        """Run provision_demo against a fake service; return the result and every request."""
        sent = []

        def request(url, payload):
            sent.append((url, payload))
            if 'code_challenge' in payload:
                return (200 if start_state == 'READY' else 202), {'demo_id': self.DEMO_ID, 'state': start_state}
            if request.polls < polls_before_ready:
                request.polls += 1
                return 202, {'demo_id': self.DEMO_ID, 'state': 'PROVISIONING', 'retry_after_seconds': 0}
            return 200, dict(self.READY)

        request.polls = 0
        with mock.patch.object(INSTALL, 'request_demo_json', side_effect=request), \
                mock.patch.object(INSTALL.time, 'sleep') as sleep:
            result = INSTALL.provision_demo('stage')
        return result, sent, sleep

    def test_start_sends_only_the_challenge_and_uses_the_assigned_id(self):
        """J-Marketing-43: the service names a pre-built demo, so the installer does not."""
        result, sent, sleep = self.provision('READY', 0)
        start_url, start_payload = sent[0]
        self.assertEqual({'code_challenge'}, set(start_payload))
        self.assertEqual(f'{start_url}/{self.DEMO_ID}/status', sent[1][0])
        self.assertEqual(result['workspace_id'], 'workspace-1')
        self.assertEqual(result['client_id'], self.READY['client_id'])
        sleep.assert_not_called()

    def test_empty_pool_still_polls_until_ready(self):
        result, _sent, sleep = self.provision('PROVISIONING', 1)
        self.assertEqual(result['workspace_id'], 'workspace-1')
        sleep.assert_called_once_with(0.25)

    def test_a_rate_limited_start_says_why(self):
        """Q-Marketing-204: the person hears that their network started too many, not a generic failure."""
        message = 'Too many demos were started from this network in the last hour. Try again later.'
        with mock.patch.object(INSTALL, 'request_demo_json',
                               return_value=(429, {'error_code': 'RATE_LIMITED', 'message': message})), \
                self.assertRaises(RuntimeError) as caught:
            INSTALL.provision_demo('stage')
        self.assertEqual(message, str(caught.exception))

    def test_a_start_reply_without_a_valid_demo_id_is_refused(self):
        for reply in ({'state': 'READY'}, {'demo_id': 'not-a-uuid', 'state': 'READY'}):
            with self.subTest(reply=reply), \
                    mock.patch.object(INSTALL, 'request_demo_json', return_value=(200, reply)), \
                    self.assertRaises(RuntimeError):
                INSTALL.provision_demo('stage')

    def test_credentials_use_the_ready_client_id_and_public_demo_secret(self):
        with tempfile.TemporaryDirectory() as directory, mock.patch.object(
            INSTALL, 'UCLUSION_HOME', directory
        ):
            INSTALL.write_demo_credentials(
                'stage', 'ai-demo:demo:human_account-1'
            )
            path = Path(directory) / INSTALL.CREDENTIALS_FILES['stage']
            self.assertEqual(path.read_text(), (
                'secret_key_id=ai-demo:demo:human_account-1\n'
                f'secret_key={INSTALL.DEMO_CLIENT_SECRET}\n'
            ))
            self.assertEqual(stat.S_IMODE(path.stat().st_mode), 0o600)


class OrdinaryInstallRegressionTests(unittest.TestCase):
    def test_demo_accepts_only_clients_with_poke_delivery(self):
        self.assertEqual(INSTALL.DEMO_CLIENTS, frozenset({'claude', 'codex'}))

    def test_demo_proxy_is_not_part_of_the_shipped_script_bundle(self):
        sources = {
            source for source, _installed, _symlink in INSTALL.SCRIPT_FILES
        }
        self.assertNotIn('uclusionDemoMCP.py', sources)
        self.assertNotIn(
            'uclusionDemoMCP.py', INSTALL.SETUP_BOOTSTRAP_SCRIPT_SHA256
        )

    def test_setup_still_installs_every_script_and_symlink(self):
        with tempfile.TemporaryDirectory() as directory:
            scripts = Path(__file__).resolve().parents[1]
            prefix = Path(directory) / 'uclusion-cli'
            symlinks = Path(directory) / 'bin'

            def real_bytes(url, dest_path):
                Path(dest_path).write_bytes(
                    (scripts / url.rsplit('/', 1)[1]).read_bytes()
                )

            with mock.patch.object(
                INSTALL, 'SCRIPT_INSTALL_PREFIX', str(prefix)
            ), mock.patch.object(
                INSTALL, 'SYMLINK_DIR', str(symlinks)
            ), mock.patch.object(
                INSTALL, 'download_to', side_effect=real_bytes
            ), mock.patch.object(
                INSTALL, '_preflight_activation_paths'
            ), mock.patch.object(
                INSTALL, '__file__', str(scripts / 'uclusionInstall.py')
            ):
                INSTALL.install_scripts(
                    'stage', None, setup_bootstrap=True
                )

            expected = {
                installed
                for _source, installed, _symlink in INSTALL.SCRIPT_FILES
            }
            release = next(
                path for path in prefix.iterdir()
                if path.name.startswith('unversioned')
            )
            self.assertEqual(
                {path.name for path in (release / 'bin').iterdir()},
                expected,
            )
            self.assertEqual(
                {path.name for path in symlinks.iterdir()},
                {
                    symlink
                    for _source, _installed, symlink in INSTALL.SCRIPT_FILES
                },
            )


if __name__ == '__main__':
    unittest.main()
