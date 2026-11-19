"""Opt-in, local CLI phase diagnostics. Never serialize request/response bodies."""
import atexit
from contextlib import contextmanager
from datetime import datetime, timezone
import json
import ipaddress
import os
from pathlib import Path
import re
import signal
import socket
import ssl
import stat
import sys
import threading
import time
import urllib.parse
import urllib.request
import uuid

try:
    import fcntl
except ImportError:
    fcntl = None

ENVIRONMENT = 'UCLUSION_DIAGNOSTICS_DIR'
MAX_BYTES = 1024 * 1024
MAX_FILES = 50
MAX_AGE_SECONDS = 7 * 24 * 60 * 60
STACK_INTERVAL = 10
OWNED_NAME = re.compile(r'uclusion-cli-\d{8}T\d{6}Z-\d+-[0-9a-f]{32}\.jsonl')
_active = None


def selected_directory(argv):
    """Read just our global option early, before other product imports/config."""
    selected = os.environ.get(ENVIRONMENT)
    for index, value in enumerate(argv):
        if value == '--':
            break
        if value == '--diagnostics' and index + 1 < len(argv):
            selected = argv[index + 1]
        elif value.startswith('--diagnostics='):
            selected = value.split('=', 1)[1]
    return selected


def endpoint(url):
    """Exclude userinfo, query strings and arbitrary secret-bearing URL paths."""
    parsed = urllib.parse.urlsplit(url)
    host = parsed.hostname or ''
    known = host.endswith('.api.uclusion.com') or host in ('127.0.0.1', 'localhost', '::1')
    return {'host': host if known else '[other-host]',
            'path': parsed.path if parsed.path in ('/v1/cli', '/v1/mcp') else '[other-path]'}


def response_metadata(response):
    content_type = response.headers.get('Content-Type', '').split(';')[0]
    length = response.headers.get('Content-Length', '')
    request_id = response.headers.get('x-amzn-RequestId', '')
    gateway_id = response.headers.get('x-amz-apigw-id', '')
    return {'status': response.status,
            'content_type': content_type if content_type in ('application/json', 'text/event-stream',
                            'text/plain', 'application/octet-stream') else '[other-type]',
            'content_length': int(length) if length.isdigit() and len(length) < 20 else None,
            'aws_request_id': request_id if re.fullmatch(r'[0-9a-fA-F-]{36}', request_id) else None,
            'gateway_request_id': gateway_id if re.fullmatch(r'[A-Za-z0-9_=-]{8,32}', gateway_id) else None}


class Diagnostics:
    def __init__(self, directory, *, interval=STACK_INTERVAL):
        self.invocation = uuid.uuid4().hex
        self.path = None
        self.fd = None
        self.bytes_written = 0
        self.gaps = []
        self.phases = {}
        self.lock = threading.RLock()
        self.stop = threading.Event()
        self.originals = []
        self.signals = {}
        self.interval = interval
        self.worker = None
        self.truncated = False
        self.boottime_clock = getattr(time, 'CLOCK_BOOTTIME', None)
        try:
            directory = Path(directory).expanduser().absolute()
            directory.mkdir(mode=0o700, parents=True, exist_ok=True)
            mode = directory.lstat().st_mode
            if not stat.S_ISDIR(mode) or mode & 0o077:
                raise PermissionError('diagnostic directory must be private')
            stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
            self.path = directory / f'uclusion-cli-{stamp}-{os.getpid()}-{self.invocation}.jsonl'
            flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, 'O_NOFOLLOW', 0)
            self.fd = os.open(self.path, flags, 0o600)
            if fcntl:
                fcntl.flock(self.fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
            try:
                self.prune(directory)
            except Exception as error:
                self.gap('retention', error)
            self.event('process_start', parent_pid=os.getppid(), python=list(sys.version_info[:3]),
                       stack_interval_seconds=interval, max_bytes=MAX_BYTES,
                       boot_clock_available=hasattr(time, 'CLOCK_BOOTTIME'))
        except Exception as error:
            self.gap('storage', error)

    def gap(self, boundary, error):
        # No exception strings: HTTP errors and filenames can contain secrets.
        failure = {'boundary': boundary, 'error_type': type(error).__name__}
        if failure not in self.gaps:
            self.gaps.append(failure)
            if boundary != 'write':
                self.event('coverage_gap', **failure)

    def prune(self, directory):
        if not fcntl:
            self.gap('retention_lock', RuntimeError())
            return
        candidates = sorted((p for p in directory.iterdir() if OWNED_NAME.fullmatch(p.name)
                             and p != self.path and not p.is_symlink()), key=lambda p: p.stat().st_mtime,
                            reverse=True)
        for index, path in enumerate(candidates):
            if index < MAX_FILES - 1 and time.time() - path.stat().st_mtime <= MAX_AGE_SECONDS:
                continue
            try:
                with path.open('rb') as handle:
                    fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
                    path.unlink()
            except (OSError, BlockingIOError):
                # A live invocation retains its file; killed processes release locks.
                continue

    def event(self, kind, **fields):
        if self.fd is None or self.truncated:
            return
        try:
            with self.lock:
                row = {'schema_version': 1, 'invocation_id': self.invocation, 'pid': os.getpid(),
                       'thread_id': threading.get_ident(), 'utc': datetime.now(timezone.utc).isoformat(),
                       'wall_ns': time.time_ns(), 'monotonic_ns': time.monotonic_ns(), 'event': kind,
                       **fields}
                if self.boottime_clock is not None:
                    try:
                        row['boottime_ns'] = time.clock_gettime_ns(self.boottime_clock)
                    except Exception as error:
                        self.boottime_clock = None
                        failure = {'boundary': 'boottime', 'error_type': type(error).__name__}
                        self.gaps.append(failure)
                        row['gaps'] = list(self.gaps)
                row['boot_clock_available'] = self.boottime_clock is not None
                encoded = (json.dumps(row, separators=(',', ':')) + '\n').encode()
                if self.bytes_written + len(encoded) > MAX_BYTES - 1024:
                    self.truncated = True
                    row = {k: v for k, v in row.items() if k in ('invocation_id', 'pid', 'wall_ns')}
                    row.update(event='coverage_gap', reason='per-invocation byte limit reached')
                    encoded = (json.dumps(row) + '\n').encode()
                written = os.write(self.fd, encoded)
                self.bytes_written += written
                if written != len(encoded):
                    raise OSError('partial diagnostic write')
                os.fsync(self.fd)
        except Exception as error:
            self.gap('write', error)

    @contextmanager
    def phase(self, name, **fields):
        started = time.monotonic_ns()
        identity = threading.get_ident()
        state = {'name': name, 'started_monotonic_ns': started}
        with self.lock:
            self.phases.setdefault(identity, []).append(state)
        self.event('phase_start', phase=name, **fields)
        try:
            yield
        except BaseException as error:
            self.event('phase_error', phase=name, error_type=type(error).__name__)
            raise
        finally:
            self.event('phase_end', phase=name, elapsed_ns=time.monotonic_ns() - started)
            with self.lock:
                self.phases[identity].remove(state)
                if not self.phases[identity]:
                    del self.phases[identity]

    def snapshot(self, reason):
        try:
            with self.lock:
                phases = {str(k): list(v) for k, v in self.phases.items()}
            stacks = []
            for identity, frame in sys._current_frames().items():
                if identity == (self.worker.ident if self.worker else None):
                    continue
                frames = []
                while frame is not None and len(frames) < 48:
                    # Deliberately omit source text, arguments, locals and exception text.
                    frames.append({'file': Path(frame.f_code.co_filename).name,
                                   'function': frame.f_code.co_name, 'line': frame.f_lineno})
                    frame = frame.f_back
                stacks.append({'thread_id': identity, 'frames': frames})
                if len(stacks) == 16:
                    break
            self.event('stack_snapshot', reason=reason, active_phases=phases, stacks=stacks)
        except Exception as error:
            self.gap('stack', error)

    def install(self):
        if self.fd is None:
            return
        def patch(owner, name, replacement):
            old = getattr(owner, name)
            setattr(owner, name, replacement(old))
            self.originals.append((owner, name, old))

        def timed(name):
            def wrap(original):
                def observe(*args, **kwargs):
                    fields = {}
                    try:
                        if name == 'connect' and isinstance(args[1], tuple):
                            fields = {'address': str(ipaddress.ip_address(args[1][0])), 'port': args[1][1]}
                        elif name == 'tls':
                            fields = endpoint('https://' + (kwargs.get('server_hostname') or ''))
                    except Exception as error:
                        self.gap(name + '_metadata', error)
                    with self.phase(name, **fields):
                        return original(*args, **kwargs)
                return observe
            return wrap

        for owner, name, phase_name in ((socket, 'getaddrinfo', 'dns'),
                                       (socket.socket, 'connect', 'connect'),
                                       (ssl.SSLContext, 'wrap_socket', 'tls')):
            try:
                patch(owner, name, timed(phase_name))
            except Exception as error:
                self.gap(phase_name, error)

        def observed_open(original):
            def observe(request, *args, **kwargs):
                url = request.full_url if hasattr(request, 'full_url') else str(request)
                try:
                    label = endpoint(url)
                except Exception as error:
                    self.gap('endpoint', error)
                    label = {}
                timeout = kwargs.get('timeout', args[1] if len(args) > 1 else None)
                try:
                    with self.phase('http_headers', **label,
                                    socket_timeout_seconds=timeout if type(timeout) in (float, int) else None):
                        response = original(request, *args, **kwargs)
                except urllib.error.HTTPError as error:
                    try:
                        self.event('http_error_response', **label, **response_metadata(error))
                    except Exception as diagnostic_error:
                        self.gap('error_headers', diagnostic_error)
                    raise
                try:
                    self.event('http_response', **label, **response_metadata(response))
                except Exception as error:
                    self.gap('headers', error)
                return ObservedResponse(response, self)
            return observe
        try:
            patch(urllib.request, 'urlopen', observed_open)
        except Exception as error:
            self.gap('http', error)
        def watch():
            while not self.stop.wait(self.interval):
                self.snapshot('periodic')
        self.worker = threading.Thread(target=watch, name='uclusion-cli-diagnostics', daemon=True)
        self.worker.start()
        if threading.current_thread() is threading.main_thread():
            for signum in (signal.SIGTERM, signal.SIGINT):
                previous = signal.getsignal(signum)
                def receive(number, frame, prior=previous):
                    self.snapshot('signal_' + str(number))
                    if callable(prior):
                        return prior(number, frame)
                    if prior == signal.SIG_DFL:
                        signal.signal(number, prior)
                        signal.raise_signal(number)
                signal.signal(signum, receive)
                self.signals[signum] = previous
        self.event('instrumentation_ready', gaps=self.gaps)

    def close(self):
        self.stop.set()
        for owner, name, original in reversed(self.originals):
            setattr(owner, name, original)
        self.originals.clear()
        for signum, handler in self.signals.items():
            signal.signal(signum, handler)
        self.signals.clear()
        self.event('process_end', gaps=self.gaps)
        if self.fd is not None:
            os.close(self.fd)
            self.fd = None


class ObservedResponse:
    def __init__(self, response, diagnostics):
        self.response, self.diagnostics = response, diagnostics

    def __getattr__(self, name):
        return getattr(self.response, name)

    def __enter__(self):
        self.response.__enter__()
        return self

    def __exit__(self, *args):
        return self.response.__exit__(*args)

    def read(self, *args, **kwargs):
        with self.diagnostics.phase('http_body'):
            value = self.response.read(*args, **kwargs)
        self.diagnostics.event('body_read', bytes=len(value))
        return value

    def __iter__(self):
        with self.diagnostics.phase('http_stream'):
            for value in self.response:
                yield value


def start(argv):
    global _active
    directory = selected_directory(argv)
    if not directory:
        return
    try:
        _active = Diagnostics(directory)
        atexit.register(_active.close)
        _active.install()
    except Exception as error:
        if _active:
            _active.gap('startup', error)


def event(kind, **fields):
    if _active:
        _active.event(kind, **fields)


def mcp_request(tool, identity, arguments):
    if not _active:
        return
    identifiers = {}
    for key in ('short_code_id', 'job_id', 'view_short_code_id'):
        value = arguments.get(key)
        if isinstance(value, str) and re.fullmatch(r'[A-Z]-[A-Za-z0-9]+-\d+', value):
            identifiers[key] = value
    for key in ('thread_only', 'stage_only'):
        if type(arguments.get(key)) is bool:
            identifiers[key] = arguments[key]
    _active.event('mcp_request', tool=tool if re.fullmatch(r'[a-z_]{1,80}', tool) else '[other-tool]',
                  rpc_id=identity, identifiers=identifiers)


@contextmanager
def phase(name, **fields):
    if _active:
        with _active.phase(name, **fields):
            yield
    else:
        yield
