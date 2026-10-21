"""S-Marketing-77: the demo command returns while the exercise runs detached.

A prospect's agent that ran the command in the foreground waited out the whole
exercise and could lose it to its own command timeout. Now the command starts a
supervisor and returns, and `uclusion demo --result --wait` prints the report.
"""

import importlib.util
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import textwrap
import unittest
from unittest import mock


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS_DIR))

import uclusionCLI as cli

spec = importlib.util.spec_from_file_location('demo_detached', SCRIPTS_DIR / 'uclusionInstall.py')
INSTALL = importlib.util.module_from_spec(spec)
spec.loader.exec_module(INSTALL)

DEMO_CLIENT_ID = 'ai-demo:3f2b8c1a-1111-4222-8333-944455556666:human_owner'


class DetachedDemoTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.home = Path(directory.name)
        (self.home / '.uclusion').mkdir()
        (self.home / '.local' / 'bin').mkdir(parents=True)
        self.installer = self.home / '.local' / 'uclusion-cli' / 'fixture-release' / 'bin' / 'uclusionInstall.py'
        self.installer.parent.mkdir(parents=True)
        shutil.copyfile(SCRIPTS_DIR / 'uclusionInstall.py', self.installer)
        (self.home / '.local' / 'bin' / 'uclusionInstall.py').symlink_to(self.installer)

    def test_the_command_returns_while_the_exercise_keeps_running(self):
        supervisor = mock.Mock(pid=4242)
        supervisor.poll.return_value = None
        with mock.patch.object(INSTALL, 'UCLUSION_HOME', str(self.home / '.uclusion')), \
                mock.patch.object(INSTALL, 'SYMLINK_DIR', str(self.home / '.local' / 'bin')), \
                mock.patch.object(INSTALL, 'uclusion_home_root', return_value=str(self.home)), \
                mock.patch.object(INSTALL.subprocess, 'Popen', return_value=supervisor) as popen, \
                mock.patch('builtins.print') as printed:
            self.assertEqual(0, INSTALL.start_demo_supervisor(
                'stage', 'claude', 'workspace', 'Start J-Demo-1.'))
        command, kwargs = popen.call_args.args[0], popen.call_args.kwargs
        # Started, never waited on: it lives in its own session and keeps running.
        self.assertTrue(kwargs['start_new_session'])
        supervisor.wait.assert_not_called()
        supervisor.communicate.assert_not_called()
        # It runs the owned immutable release, which `demo --remove` can recognise.
        self.assertEqual(str(self.installer), command[1])
        self.assertEqual((SCRIPTS_DIR / 'uclusionInstall.py').read_bytes(), self.installer.read_bytes())
        self.assertEqual(INSTALL.DEMO_SUPERVISE_MODE, command[2])
        run_dir = Path((self.home / '.uclusion' / INSTALL.DEMO_CURRENT_RUN_FILE).read_text())
        self.assertEqual(self.home / '.uclusion' / 'demo-runs', run_dir.parent)
        self.assertIn(str(run_dir), command)
        self.assertEqual('4242', (run_dir / INSTALL.DEMO_SUPERVISOR_PID_FILE).read_text())
        told = ' '.join(str(call.args[0]) for call in printed.call_args_list)
        self.assertIn('demo --result --wait', told)

    def test_result_wait_prints_the_published_report(self):
        run_dir = self.home / '.uclusion' / 'demo-runs' / 'run-1'
        run_dir.mkdir(parents=True)
        (self.home / '.uclusion' / cli.DEMO_CURRENT_RUN_FILE).write_text(str(run_dir))
        (run_dir / cli.DEMO_SUPERVISOR_PID_FILE).write_text(str(os.getpid()))
        report = b'  Evaluation\r\nUnicode: \xe2\x9c\x93\n'
        waits = []

        def publish_while_waiting(_seconds):
            waits.append(True)
            (run_dir / 'evaluation.md').write_bytes(report)
            (run_dir / cli.DEMO_TOKEN_BREAKDOWN_NAME).write_text('Token breakdown fixture.\n')

        output = io.TextIOWrapper(io.BytesIO(), encoding='utf-8')
        args = cli.build_parser().parse_args(['-e', 'stage', 'demo', '--result', '--wait'])
        with mock.patch.object(cli, 'uclusion_home_root', return_value=str(self.home)), \
                mock.patch.object(cli, 'get_credentials',
                                  return_value={'secret_key_id': DEMO_CLIENT_ID, 'secret_key': 'secret'}), \
                mock.patch.object(cli.time, 'sleep', side_effect=publish_while_waiting), \
                mock.patch.object(cli.sys, 'stdout', output):
            self.assertEqual(0, args.func(args))
        output.flush()
        self.assertEqual(1, len(waits), 'It should wait until the report is published')
        header = cli.demo_evidence_summary(str(run_dir)).encode('utf-8')
        self.assertIn(b'INCOMPLETE', header)
        self.assertEqual(header + b'\n' + report + b'Token breakdown fixture.\n', output.buffer.getvalue())


class DownloadedDemoBootstrapTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name)
        self.home = self.root / 'demo-home'
        self.scripts = self.home / '.local' / 'uclusion-cli' / 'fixture-release' / 'bin'
        self.scripts.mkdir(parents=True)
        (self.scripts.parent.parent / 'current').symlink_to('fixture-release')
        public_bin = self.home / '.local' / 'bin'
        public_bin.mkdir()
        for source, installed, link in INSTALL.SCRIPT_FILES:
            shutil.copyfile(SCRIPTS_DIR / source, self.scripts / installed)
            (public_bin / link).symlink_to(self.scripts.parent.parent / 'current' / 'bin' / installed)
        self.environment = {'PATH': os.defpath, 'HOME': str(self.root / 'native-home'),
                            'UCLUSION_HOME': str(self.home)}

    def run_probe(self, program, *, isolated=False):
        probe = self.scripts / 'probe.py'
        probe.write_text(textwrap.dedent(program))
        process = subprocess.run(
            [sys.executable, '-B', *(['-I'] if isolated else []), str(probe)],
            cwd=self.root, env=self.environment, text=True, capture_output=True, timeout=30,
        )
        self.assertEqual(0, process.returncode, process.stdout + process.stderr)
        return json.loads(process.stdout.splitlines()[-1])

    def test_downloaded_bootstrap_uses_installed_runtime_after_download_is_removed(self):
        download = self.root / 'download'
        download.mkdir()
        shutil.copyfile(SCRIPTS_DIR / 'uclusionInstall.py', download / 'uclusionInstall.py')
        result = self.run_probe('''
            import importlib.util, json, pathlib, shutil, subprocess, sys
            from unittest import mock
            root = pathlib.Path.cwd()
            downloaded = root / 'download' / 'uclusionInstall.py'
            spec = importlib.util.spec_from_file_location('downloaded_installer', downloaded)
            install = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(install)
            assert 'uclusionTokenBudget' not in sys.modules
            commands = []
            for client in ('claude', 'codex'):
                with mock.patch.object(install.subprocess, 'Popen', return_value=mock.Mock(pid=4242)) as launch:
                    assert install.start_demo_supervisor('stage', client, 'workspace', 'Start J-Demo-1.') == 0
                commands.append(launch.call_args.args[0])
            # The shell bootstrap removes only its standalone download on exit.
            shutil.rmtree(downloaded.parent)
            spec = importlib.util.spec_from_file_location('fixture_budget', root / 'demo-home' / '.local' / 'bin' / 'uclusionTokenBudget.py')
            budget = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(budget)
            for command in commands:
                run = pathlib.Path(command[6])
                ledger = budget.BudgetLedger(run / 'token-budget.sqlite3', run.name, 1_000_000_000, 100_000_000)
                assert ledger.snapshot()['generation_attempts'] == 0
                ledger.halt('intentional local stop before participants')
                child = subprocess.run(command, cwd=root, text=True, capture_output=True, timeout=10)
                assert child.returncode != 0
                assert 'intentional local stop before participants' in child.stderr, child.stderr
                assert 'ModuleNotFoundError' not in child.stderr
            print(json.dumps({'supervisors': [command[1] for command in commands], 'download_removed': not downloaded.exists()}))
        ''', isolated=True)
        self.assertTrue(result['download_removed'])
        self.assertEqual([str(self.scripts / 'uclusionInstall.py')] * 2, result['supervisors'])

    def test_installed_budgeted_runners_use_real_ledgers_without_repository_imports(self):
        result = self.run_probe('''
            import json, pathlib
            from unittest import mock
            import uclusionInstall as install
            import uclusionTokenBudget as budget
            import uclusionCodexNative as native
            scripts = pathlib.Path(__file__).parent
            assert pathlib.Path(native.__file__).parent == scripts
            completed = []
            for client in ('claude', 'codex'):
                def runner(*args, **kwargs):
                    control = kwargs['budget']
                    assert control.ledger.snapshot()['generation_attempts'] == 0
                    if client == 'codex':
                        # Exercise the budget module's native dependency with a local policy reader.
                        with mock.patch.object(native, 'NativeClient') as policy:
                            policy.return_value.request.return_value = {'account': {'type': 'chatgpt'}}
                            reader = budget.bind_codex_account(control.gateway, 'fixture-home', 'fixture.sock')
                            reader.close()
                            policy.return_value.request.assert_called_once_with('account/read', {'refreshToken': False})
                    completed.append(client)
                    return 0
                with mock.patch.object(install, '_run_' + client + '_demo', side_effect=runner):
                    assert getattr(install, 'run_' + client + '_demo')('stage', 'workspace', 'Start J-Demo-1.') == 0
            summaries = list((pathlib.Path(install.UCLUSION_HOME) / 'demo-runs').glob('*/token-budget-summary.json'))
            assert len(summaries) == 2
            assert all(json.loads(path.read_text())['finished'] for path in summaries)
            print(json.dumps({'completed': completed, 'summaries': len(summaries)}))
        ''')
        self.assertEqual(['claude', 'codex'], result['completed'])
        self.assertEqual(2, result['summaries'])

    @unittest.skipUnless(hasattr(os, 'fork'), 'the demo guardian requires fork')
    def test_guarded_report_shutdown_keeps_supervisor_and_stops_owned_processes(self):
        result = self.run_probe(r'''
            import io, json, os, pathlib, subprocess, sys, threading, time
            from contextlib import ExitStack
            from unittest import mock
            if sys.argv[1:] == ['--participant']:
                time.sleep(30)
                raise SystemExit(0)
            import uclusion as cli
            import uclusionInstall as install
            import uclusionTokenBudget as token
            home = pathlib.Path(os.environ['UCLUSION_HOME'])
            run = home / '.uclusion' / 'demo-runs' / 'run-guarded'
            run.mkdir(parents=True)
            report = b'  Local evaluation\r\nUnicode: \xe2\x9c\x93\n\n'
            ledger = token.BudgetLedger(run / 'token-budget.sqlite3', run.name,
                                        1_000_000_000, 100_000_000, create=True)
            public, public_parent = os.getpid(), os.getppid()
            children, participants, residuals = [], [], []
            real_fork = os.fork

            def fork():
                child = real_fork()
                if child:
                    children.append(child)
                return child

            class LocalTree(token.OwnedProcesses):
                # Use the real guardian and stop logic with only this fixture's
                # explicit fork PIDs; no ps or /proc discovery is permitted.
                def __init__(self, watch=False):
                    self.root, self.known, self.excluded = os.getpid(), {}, set()
                    self.lock = threading.RLock()

                def processes(self):
                    return {pid: (self.root, 1, 'S') for pid in children if pid != self.root}

            class LocalBudget:
                base_url = 'http://127.0.0.1:1/no-requests'
                def __init__(self, *_args):
                    self.ledger = ledger

                def check(self):
                    if ledger.snapshot()['halt_reason']:
                        raise token.BudgetError(ledger.snapshot()['halt_reason'])

                def track(self, process):
                    return process

                def close(self):
                    # Record before fallback cleanup so a missed residual
                    # cannot be hidden by the budget's final participant stop.
                    (run / 'shutdown.json').write_text(json.dumps(
                        [process.poll() for process in participants]))
                    for process in participants:
                        install.stop_demo_session(process)
                    ledger.finish_active()

            def participant():
                process = subprocess.Popen([sys.executable, __file__, '--participant'],
                    stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL, start_new_session=True)
                participants.append(process)
                return process

            class LocalTerminal:
                def __init__(self, _command, environment, _log):
                    self.environment, self.published = environment, False
                    self.process = participant()

                def drain(self, timeout=.25):
                    if 'UCLUSION_DEMO_REPORT_FILE' in self.environment and not self.published:
                        self.published = True
                        with mock.patch.dict(os.environ, self.environment), \
                                mock.patch.object(cli.sys, 'stdin', io.TextIOWrapper(
                                    io.BytesIO(report), encoding='utf-8')):
                            assert cli.publish_demo_report() == 0
                        residuals.append(participant())
                    return False

                def close(self):
                    pass

            def ps(command, **_kwargs):
                assert command in (['ps', '-eo', 'pid=,args='],
                                   ['ps', '-eo', 'pid=,ppid=,args=']), command
                rows = [(public, public_parent), (os.getppid(), public),
                        (os.getpid(), os.getppid())]
                rows.extend((process.pid, os.getpid()) for process in residuals
                            if process.poll() is None)
                return mock.Mock(stdout='\n'.join(f'{pid} '
                    + (f'{parent} ' if command[-1] == 'pid=,ppid=,args=' else '')
                    + f'{sys.executable} {__file__}' for pid, parent in rows))

            with ExitStack() as stack:
                for target, name, replacement in (
                    (os, 'fork', fork), (token, 'OwnedProcesses', LocalTree),
                    (token, 'RunBudget', LocalBudget),
                    (install, 'demo_claude_session_environment', lambda: {}),
                    (install, 'demo_session_args', lambda *_args: []),
                    (install, 'write_demo_owner_mcp_config', lambda *_args: None),
                    (install, 'write_demo_evaluator_mcp_config', lambda *_args: None),
                    (install, 'accept_demo_workspace_trust', lambda *_args: None),
                    (install, 'snapshot_demo_evidence', lambda *_args: str(run / 'evidence')),
                    (install, 'wait_for_owner_watch', lambda *_args, **_kwargs: True),
                    (install, 'DemoCodexTerminal', LocalTerminal),
                    (install, 'demo_evaluator_log', lambda *_args: None),
                    (install.subprocess, 'run', ps),
                ):
                    stack.enter_context(mock.patch.object(target, name, replacement))
                status = install.supervise_demo(['stage', 'claude', 'local-workspace', str(run),
                    'Local fixture only.', '', '1000000000', '100000000', '', ''])
            if os.getpid() != public:
                raise SystemExit(status)
            print(json.dumps({'status': status, 'report': (run / 'evaluation.md').read_bytes().hex(),
                'stopped': json.loads((run / 'shutdown.json').read_text()),
                'failure': (run / 'failure.txt').exists(), 'halt': ledger.snapshot()['halt_reason'],
                'lifetime': json.loads((run / 'token-budget-lifetime.json').read_text())}))
        ''')
        self.assertEqual(0, result['status'])
        self.assertEqual(b'  Local evaluation\r\nUnicode: \xe2\x9c\x93\n\n'.hex(), result['report'])
        self.assertEqual([-15, -15, -15], result['stopped'])
        self.assertFalse(result['failure'])
        self.assertIsNone(result['halt'])
        self.assertTrue(result['lifetime']['owned_processes_stopped'])
        self.assertIsNone(result['lifetime']['stop_reason'])
        self.assertEqual(0, result['lifetime']['controller_exit_status'])


if __name__ == '__main__':
    unittest.main()
