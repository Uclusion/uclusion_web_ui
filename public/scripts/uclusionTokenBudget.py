#!/usr/bin/env python3
"""Durable, shared input/output admission for owned native client runs.

The gateway forwards the caller's authentication in memory. Its SQLite records
contain limits, request identities, bounds and numeric usage, never headers or
provider request/response bodies. It neither retries nor redirects a request.
"""
import ctypes
import ctypes.util
import http.client
import http.server
import json
import os
from pathlib import Path
import re
import secrets
import select
import signal
import socket
import sqlite3
import subprocess
import tempfile
import threading
import time
import urllib.parse
import uuid
import zlib
from contextlib import contextmanager


PROVISIONAL_INPUT_TOKENS = 1_000_000_000
PROVISIONAL_OUTPUT_TOKENS = 100_000_000
_GUARDED_NATIVE_SOCKET = None
# These are model limits, not measurements of a particular prompt. A complete
# accepted model context includes instructions, tools, history and cached state.
# Unknown models and hosted generation loops fail before forwarding.
MODEL_BOUNDS = {
    'codex': {
        'gpt-6.1-sol': (1_050_000, 128_000,
            'https://developers.openai.com/api/docs/models/gpt-6.1-sol'),
        'gpt-6-sol': (1_050_000, 128_000,
            'https://developers.openai.com/api/docs/models/gpt-6-sol'),
        'gpt-6-astra': (1_050_000, 128_000,
            'https://developers.openai.com/api/docs/models/gpt-6-astra'),
        'gpt-5.6-sol': (1_050_000, 128_000,
            'https://developers.openai.com/api/docs/models/gpt-5.6-sol'),
    },
    'claude': {
        'claude-sonnet-4-6': (1_000_000, 128_000,
            'https://platform.claude.com/docs/en/models/sonnet-4-6/overview'),
        'claude-opus-4-6': (1_000_000, 128_000,
            'https://platform.claude.com/docs/en/models/opus-4-6/overview'),
        'claude-haiku-4-5-20251001': (200_000, 64_000,
            'https://platform.claude.com/docs/en/models/haiku-4-5/overview'),
        'claude-haiku-4-5': (200_000, 64_000,
            'https://platform.claude.com/docs/en/models/haiku-4-5/overview'),
    },
}
HOP_HEADERS = {'host', 'connection', 'proxy-connection', 'keep-alive',
               'transfer-encoding', 'te', 'trailer', 'upgrade', 'content-length'}
# Every accepted selector belongs to the qualified synchronous native request
# forms. New provider inference features need bounds qualification before use.
# Tools are forwarded intact; client-executed tool loops return here as fresh
# requests rather than acquiring an internal provider generation allowance.
GENERATION_FIELDS = {
    'codex': {'model', 'input', 'instructions', 'tools', 'tool_choice', 'parallel_tool_calls',
              'reasoning', 'store', 'stream', 'stream_options', 'include', 'service_tier',
              'prompt_cache_key', 'prompt_cache_retention', 'text', 'client_metadata',
              'max_output_tokens', 'metadata', 'previous_response_id', 'truncation',
              'temperature', 'top_p', 'safety_identifier', 'user', 'multi_agent',
              'background', 'n', 'access_programs', 'context_management'},
    'claude': {'model', 'messages', 'system', 'tools', 'tool_choice', 'metadata',
               'max_tokens', 'stream', 'thinking', 'temperature', 'top_p', 'top_k',
               'stop_sequences', 'output_config', 'context_management', 'inference_geo',
               'service_tier', 'speed', 'mcp_servers', 'container', 'compaction', 'safeguards'},
}


class BudgetError(RuntimeError):
    """A fixed diagnostic suitable for display without provider content."""


class AdmissionPaused(BudgetError):
    """Temporary refusal while a verified stopped tree waits for a person."""


def _failure_diagnostic(error=None, stage='unknown', handler_context='unknown', request_id=None):
    """Static context and exact known exception types only; never error text."""
    known_types = (BudgetError, http.client.IncompleteRead, http.client.RemoteDisconnected,
                   http.client.BadStatusLine, ConnectionResetError, ConnectionRefusedError,
                   ConnectionAbortedError, BrokenPipeError, TimeoutError, OSError,
                   json.JSONDecodeError, UnicodeDecodeError, ValueError, TypeError, AttributeError, zlib.error)
    exception_class = ('unknown' if error is None else
                       type(error).__name__ if type(error) in known_types else 'other')
    return {'exception_class': exception_class, 'stage': stage,
            'handler_context': handler_context, 'request_id': request_id,
            'recorded_at': time.time()}


def positive_tokens(value):
    """Argparse-compatible finite, positive integer validation."""
    try:
        number = int(value)
    except (ValueError, TypeError, OverflowError):
        raise ValueError('token limits must be positive finite integers') from None
    if str(number) != str(value) or not 0 < number <= 2**63 - 1:
        raise ValueError('token limits must be positive finite integers')
    return number


def _counter(value):
    if type(value) is not int or not 0 <= value <= 2**63 - 1:
        raise BudgetError('invalid canonical usage')
    return value


def _numeric_details(value):
    """Keep only numeric usage trees; arbitrary provider strings never persist."""
    if type(value) is int:
        return _counter(value)
    if isinstance(value, dict):
        return {key: _numeric_details(item) for key, item in value.items()
                if isinstance(key, str) and (type(item) is int or isinstance(item, dict))}
    raise BudgetError('invalid canonical usage details')


def normalize_usage(provider, usage):
    if not isinstance(usage, dict):
        raise BudgetError('missing canonical usage')
    if provider == 'codex':
        incoming = _counter(usage.get('input_tokens'))
        outgoing = _counter(usage.get('output_tokens'))
        cached = _counter(usage.get('input_tokens_details', {}).get('cached_tokens', 0))
        reasoning = _counter(usage.get('output_tokens_details', {}).get('reasoning_tokens', 0))
        if cached > incoming or reasoning > outgoing:
            raise BudgetError('inconsistent canonical usage')
        if 'total_tokens' in usage and _counter(usage['total_tokens']) != incoming + outgoing:
            raise BudgetError('inconsistent canonical total')
    elif provider == 'claude':
        iterations = usage.get('iterations')
        if iterations is not None and not isinstance(iterations, list):
            raise BudgetError('invalid compaction iterations')
        if iterations:
            totals = [normalize_usage('claude', item) for item in iterations]
            if any(item.get('type') not in ('message', 'compaction') for item in iterations):
                raise BudgetError('unsupported generation iteration')
            # Top-level counters describe non-compaction generations, not all
            # generations. Validate them, then count the iterations once.
            top = normalize_usage('claude', {k: v for k, v in usage.items() if k != 'iterations'})
            message = [value for item, value in zip(iterations, totals) if item['type'] == 'message']
            if top[:2] != (sum(value[0] for value in message), sum(value[1] for value in message)):
                raise BudgetError('inconsistent compaction usage')
            incoming, outgoing = sum(v[0] for v in totals), sum(v[1] for v in totals)
            raw = _numeric_details(usage)
            raw['iterations'] = [dict(_numeric_details(item), type=item['type']) for item in iterations]
            return incoming, outgoing, raw
        fresh = _counter(usage.get('input_tokens'))
        created = _counter(usage.get('cache_creation_input_tokens', 0))
        cached = _counter(usage.get('cache_read_input_tokens', 0))
        incoming = fresh + created + cached
        outgoing = _counter(usage.get('output_tokens'))
        ttl = usage.get('cache_creation', {})
        if not isinstance(ttl, dict) or sum(_counter(value) for value in ttl.values()) > created:
            raise BudgetError('inconsistent cache creation usage')
    else:
        raise BudgetError('unsupported usage provider')
    raw = _numeric_details(usage)
    if provider == 'claude' and 'iterations' in usage:
        raw['iterations'] = []
    return incoming, outgoing, raw


class BudgetLedger:
    """One immutable run configuration, serialized by SQLite write transactions."""
    def __init__(self, path, run_id, max_input_tokens, max_output_tokens, *, create=False,
                 max_requests=None, max_active_seconds=None):
        self.path = str(Path(path).resolve())
        self.run_id = str(run_id)
        self.config = {'run_id': self.run_id, 'max_input_tokens': positive_tokens(max_input_tokens),
                       'max_output_tokens': positive_tokens(max_output_tokens),
                       'max_requests': max_requests, 'max_active_seconds': max_active_seconds}
        if not self.run_id or (max_requests is not None and (type(max_requests) is not int or max_requests < 1)):
            raise BudgetError('invalid run configuration')
        if max_active_seconds is not None and (not isinstance(max_active_seconds, (int, float))
                                               or not 0 < max_active_seconds < float('inf')):
            raise BudgetError('invalid active time limit')
        self.failed = False
        self.lock = threading.RLock()
        if create:
            Path(self.path).parent.mkdir(parents=True, exist_ok=True)
            descriptor = os.open(self.path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            os.close(descriptor)
            try:
                with self._transaction() as db:
                    db.execute('CREATE TABLE run (singleton INTEGER PRIMARY KEY CHECK(singleton=1), config TEXT NOT NULL, state TEXT NOT NULL)')
                    db.execute("CREATE TABLE requests (id TEXT PRIMARY KEY, provider TEXT NOT NULL, route TEXT NOT NULL, model TEXT NOT NULL, input_bound INTEGER NOT NULL, output_bound INTEGER NOT NULL, status TEXT NOT NULL, usage TEXT, input_tokens INTEGER NOT NULL DEFAULT 0, output_tokens INTEGER NOT NULL DEFAULT 0, delivered INTEGER NOT NULL DEFAULT 0, bound_basis TEXT NOT NULL, started REAL NOT NULL, completed REAL, admission_ms REAL, first_byte_ms REAL, settlement_ms REAL, provider_request_id TEXT, response_metadata TEXT, root_role TEXT NOT NULL DEFAULT 'unknown')")
                    db.execute('INSERT INTO run VALUES (1,?,?)', (json.dumps(self.config, sort_keys=True), json.dumps({
                        'halt_reason': None, 'ceiling_valid': True, 'peak_input_reservation': 0,
                        'peak_output_reservation': 0, 'active_seconds': 0, 'active_since': time.time(),
                        'human_wait_seconds': 0, 'human_wait_since': None, 'created_at': time.time(), 'finished': False})))
            except Exception:
                self.failed = True
                raise
        else:
            with self._transaction() as db:
                state = self._state(db)
                columns = {row['name'] for row in db.execute('PRAGMA table_info(requests)')}
                if 'response_metadata' not in columns:
                    db.execute('ALTER TABLE requests ADD COLUMN response_metadata TEXT')
                if 'root_role' not in columns:
                    db.execute("ALTER TABLE requests ADD COLUMN root_role TEXT NOT NULL DEFAULT 'unknown'")

    @contextmanager
    def _transaction(self):
        with self.lock:
            if self.failed:
                raise BudgetError('budget controller is unavailable')
            db = None
            try:
                db = sqlite3.connect('file:' + urllib.parse.quote(self.path) + '?mode=rw', uri=True, timeout=30)
                db.row_factory = sqlite3.Row
                db.execute('PRAGMA synchronous=FULL')
                db.execute('BEGIN IMMEDIATE')
                yield db
                db.commit()
            except sqlite3.Error:
                self.failed = True
                raise BudgetError('missing, corrupt or unavailable budget state') from None
            finally:
                if db is not None:
                    db.close()

    def _state(self, db):
        row = db.execute('SELECT config,state FROM run WHERE singleton=1').fetchone()
        if row is None or json.loads(row['config']) != self.config:
            raise BudgetError('budget run identity or immutable limits mismatch')
        state = json.loads(row['state'])
        if not isinstance(state, dict) or 'halt_reason' not in state:
            raise BudgetError('corrupt budget run state')
        return state

    @staticmethod
    def _save(db, state):
        db.execute('UPDATE run SET state=? WHERE singleton=1', (json.dumps(state, sort_keys=True),))

    def _halt(self, db, state, reason, diagnostic=None):
        if not state['halt_reason']:
            state['halt_reason'] = reason
            state['halt_diagnostic'] = diagnostic or _failure_diagnostic()
        self._save(db, state)

    @staticmethod
    def _totals(db):
        row = db.execute("SELECT COALESCE(SUM(input_tokens),0),COALESCE(SUM(output_tokens),0),COALESCE(SUM(CASE WHEN status!='settled' THEN input_bound ELSE 0 END),0),COALESCE(SUM(CASE WHEN status!='settled' THEN output_bound ELSE 0 END),0),COUNT(*) FROM requests").fetchone()
        return tuple(row)

    def reserve(self, input_bound, output_bound, route, model, *, provider='codex', bound_basis='',
                root_role='unknown'):
        started = time.perf_counter()
        input_bound, output_bound = positive_tokens(input_bound), positive_tokens(output_bound)
        # Launch provenance only: an inherited alias cannot identify a helper,
        # participant or request purpose. Unrecognized/legacy callers stay unknown.
        root_role = root_role if root_role in ('owner', 'evaluator') else 'unknown'
        refusal = None
        with self._transaction() as db:
            state = self._state(db)
            used_in, used_out, held_in, held_out, requests = self._totals(db)
            if state['halt_reason']:
                refusal = state['halt_reason']
            elif state['finished']:
                refusal = 'budget run is finished'
            elif state['active_since'] is None:
                raise AdmissionPaused('budget admission is paused for human input')
            elif self.config['max_requests'] is not None and requests >= self.config['max_requests']:
                refusal = 'generation attempt backstop reached'
            elif self._active(state) >= (self.config['max_active_seconds'] or float('inf')):
                refusal = 'active time backstop reached'
            elif used_in + held_in + input_bound > self.config['max_input_tokens']:
                refusal = 'input token ceiling cannot admit the next request'
            elif used_out + held_out + output_bound > self.config['max_output_tokens']:
                refusal = 'output token ceiling cannot admit the next request'
            if refusal:
                self._halt(db, state, refusal)
            else:
                identity = uuid.uuid4().hex
                db.execute('INSERT INTO requests (id,provider,route,model,input_bound,output_bound,status,bound_basis,started,root_role) VALUES (?,?,?,?,?,?,\'reserved\',?,?,?)',
                           (identity, provider, route, model, input_bound, output_bound, bound_basis, time.time(), root_role))
                state['peak_input_reservation'] = max(state['peak_input_reservation'], held_in + input_bound)
                state['peak_output_reservation'] = max(state['peak_output_reservation'], held_out + output_bound)
                self._save(db, state)
                db.execute('UPDATE requests SET admission_ms=? WHERE id=?', ((time.perf_counter() - started) * 1000, identity))
        if refusal:
            raise BudgetError(refusal)
        return identity

    def settle(self, request_id, provider, usage, provider_request_id=None, *,
               stage='settlement', handler_context='unknown'):
        started = time.perf_counter()
        violation = False
        with self._transaction() as db:
            state = self._state(db)
            row = db.execute('SELECT * FROM requests WHERE id=?', (request_id,)).fetchone()
            if row is None or row['provider'] != provider:
                self._halt(db, state, 'unknown provider settlement',
                    _failure_diagnostic(stage=stage, handler_context=handler_context, request_id=row['id'] if row else None))
                violation = True
            else:
                try:
                    incoming, outgoing, raw = normalize_usage(provider, usage)
                except (BudgetError, TypeError, AttributeError) as error:
                    self._retain(db, state, row,
                        _failure_diagnostic(error, stage, handler_context, row['id']))
                    return
            if violation:
                pass
            elif row['usage'] is not None:
                if row['usage'] != json.dumps(raw, sort_keys=True):
                    self._halt(db, state, 'conflicting duplicate settlement',
                        _failure_diagnostic(stage=stage, handler_context=handler_context, request_id=row['id']))
                    violation = True
                # An identical replay does not add usage or release liability.
            else:
                if not isinstance(provider_request_id, str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,200}', provider_request_id):
                    provider_request_id = None
                violation = incoming > row['input_bound'] or outgoing > row['output_bound']
                status = 'bound_violation' if violation else 'settled'
                db.execute('UPDATE requests SET usage=?,input_tokens=?,output_tokens=?,status=?,completed=?,settlement_ms=?,provider_request_id=? WHERE id=?',
                           (json.dumps(raw, sort_keys=True), incoming, outgoing, status, time.time(), (time.perf_counter() - started) * 1000, provider_request_id, request_id))
                if violation:
                    state['ceiling_valid'] = False
                    self._halt(db, state, 'provider usage exceeded its conservative reservation',
                        _failure_diagnostic(stage=stage, handler_context=handler_context, request_id=row['id']))
        if violation:
            raise BudgetError('invalid provider settlement or exceeded reservation')

    def delivered(self, request_id):
        with self._transaction() as db:
            self._state(db)
            db.execute('UPDATE requests SET delivered=1 WHERE id=?', (request_id,))

    def _retain(self, db, state, row, diagnostic=None):
        if row['usage'] is None:
            db.execute("UPDATE requests SET status='retained' WHERE id=?", (row['id'],))
            if diagnostic is not None:
                state.setdefault('uncertainty_diagnostic', diagnostic)
                self._save(db, state)

    def retain(self, request_id):
        """Unconfirmed usage keeps the full original finite liability."""
        self.uncertain(request_id)

    def first_byte(self, request_id):
        with self._transaction() as db:
            self._state(db)
            db.execute('UPDATE requests SET first_byte_ms=(?-started)*1000 WHERE id=? AND first_byte_ms IS NULL', (time.time(), request_id))

    def record_response(self, request_id, response):
        """Retain only bounded transport diagnostics, never a header collection."""
        def token(value, pattern):
            return value if value and re.fullmatch(pattern, value) else None
        media = response.getheader('Content-Type', '').split(';', 1)[0].strip().lower()
        encoding = response.getheader('Content-Encoding', 'identity').strip().lower()
        correlation = response.getheader('request-id') or response.getheader('x-request-id')
        metadata = {'status': response.status,
                    'content_type': token(media, r'[a-z0-9!#$&^_.+-]{1,64}/[a-z0-9!#$&^_.+-]{1,64}'),
                    'content_encoding': token(encoding, r'[a-z0-9_-]{1,32}'),
                    'correlation_id': token(correlation, r'[A-Za-z0-9_.:-]{1,200}')}
        with self._transaction() as db:
            self._state(db)
            db.execute('UPDATE requests SET response_metadata=? WHERE id=?',
                       (json.dumps(metadata, sort_keys=True), request_id))

    @contextmanager
    def decision(self, request_id=None, *, stage='unknown', handler_context='unknown'):
        """Commit a fatal admission/integrity decision before another admission."""
        with self.lock:
            try:
                yield
            except AdmissionPaused:
                raise
            except Exception as error:
                reason = str(error) if isinstance(error, BudgetError) else 'invalid provider request or completion'
                diagnostic = _failure_diagnostic(error, stage, handler_context, request_id)
                self.halt(reason, diagnostic=diagnostic)
                raise

    def uncertain(self, request_id, reason='uncertain provider completion', *, diagnostic=None):
        unknown = False
        with self._transaction() as db:
            state = self._state(db)
            row = db.execute('SELECT * FROM requests WHERE id=?', (request_id,)).fetchone()
            if row is None:
                self._halt(db, state, 'unknown retained request', diagnostic)
                unknown = True
            else:
                self._retain(db, state, row, diagnostic)
        if unknown:
            raise BudgetError('unknown retained request')

    def halt(self, reason, *, diagnostic=None):
        with self._transaction() as db:
            self._halt(db, self._state(db), reason, diagnostic)

    @staticmethod
    def _active(state):
        return state['active_seconds'] + (max(0, time.time() - state['active_since']) if state['active_since'] is not None else 0)

    def pause_active(self):
        """Operator must first freeze/verify all participants and their tools."""
        with self._transaction() as db:
            state = self._state(db)
            if state['active_since'] is not None:
                state['active_seconds'] = self._active(state)
                state['active_since'] = None
                state['human_wait_since'] = time.time()
                self._save(db, state)

    def resume_active(self):
        with self._transaction() as db:
            state = self._state(db)
            if state['finished']:
                raise BudgetError('cannot resume a finished budget run')
            if state['active_since'] is None:
                state['human_wait_seconds'] += max(0, time.time() - state['human_wait_since'])
                state['human_wait_since'] = None
                state['active_since'] = time.time()
                self._save(db, state)

    def finish_active(self, stopped_at=None):
        """Seal participant time at proved tree quiescence; late usage can drain."""
        with self._transaction() as db:
            state = self._state(db)
            if state['finished']:
                return
            stopped_at = time.time() if stopped_at is None else stopped_at
            if not isinstance(stopped_at, (float, int)) or not state['created_at'] <= stopped_at <= time.time():
                raise BudgetError('invalid owned participant stop time')
            state['active_seconds'] += (max(0, stopped_at - state['active_since'])
                                        if state['active_since'] is not None else 0)
            state['active_since'] = None
            if state['human_wait_since'] is not None:
                state['human_wait_seconds'] += max(0, stopped_at - state['human_wait_since'])
                state['human_wait_since'] = None
            state['finished'] = True
            state['participants_stopped_at'] = stopped_at
            self._save(db, state)

    def snapshot(self):
        with self._transaction() as db:
            state = self._state(db)
            incoming, outgoing, reserved_in, reserved_out, count = self._totals(db)
            if self._active(state) >= (self.config['max_active_seconds'] or float('inf')):
                self._halt(db, state, 'active time backstop reached')
            return {**self.config, **state, 'active_seconds': self._active(state),
                    'wall_seconds': max(0, time.time() - state['created_at']),
                    'admission_paused': state['active_since'] is None,
                    'measured_input_tokens': incoming, 'measured_output_tokens': outgoing,
                    'reserved_input_tokens': reserved_in, 'reserved_output_tokens': reserved_out,
                    'generation_attempts': count,
                    'uncertain_attempts': db.execute("SELECT COUNT(*) FROM requests WHERE status='retained' AND usage IS NULL").fetchone()[0]}

    def requests(self):
        with self._transaction() as db:
            self._state(db)
            return [dict(row) for row in db.execute('SELECT * FROM requests ORDER BY started,id')]

    def describe(self):
        state = self.snapshot()
        return ('Shared token budget: input {measured_input_tokens}/{max_input_tokens}; '
                'output {measured_output_tokens}/{max_output_tokens}; outstanding reservations '
                '{reserved_input_tokens} input, {reserved_output_tokens} output; uncertain attempts '
                '{uncertain_attempts}; stop: '
                '{halt_reason}.').format(**state)


def read_budget_status(path):
    """Read diagnostics without changing admission, counters or accounting state."""
    try:
        with sqlite3.connect('file:' + urllib.parse.quote(str(Path(path).resolve())) + '?mode=ro', uri=True) as db:
            row = db.execute('SELECT config,state FROM run WHERE singleton=1').fetchone()
            config, state = json.loads(row[0]), json.loads(row[1])
            incoming, outgoing, held_in, held_out, count = BudgetLedger._totals(db)
            return {**config, **state, 'measured_input_tokens': incoming, 'measured_output_tokens': outgoing,
                    'reserved_input_tokens': held_in, 'reserved_output_tokens': held_out,
                    'generation_attempts': count,
                    'uncertain_attempts': db.execute("SELECT COUNT(*) FROM requests WHERE status='retained' AND usage IS NULL").fetchone()[0]}
    except (sqlite3.Error, ValueError, TypeError, IndexError):
        raise BudgetError('budget diagnostics unavailable; usage is unknown') from None


def request_bounds(provider, route, body, model_bounds=None):
    if not isinstance(body, dict) or not isinstance(body.get('model'), str):
        raise BudgetError('unsupported generation request shape')
    model = body['model']
    unknown = set(body) - GENERATION_FIELDS.get(provider, set())
    if unknown:
        raise BudgetError('unqualified provider generation fields: ' + ','.join(sorted(unknown)))
    bounds = (model_bounds or MODEL_BOUNDS.get(provider, {})).get(model)
    if bounds is None:
        raise BudgetError('unsupported model: ' + model[:100])
    incoming, outgoing, basis = bounds
    generations = 1
    if provider == 'codex':
        if route not in ('/responses', '/responses/compact'):
            raise BudgetError('unsupported Codex generation route')
        if route == '/responses/compact' and set(body) - {
                'model', 'input', 'instructions', 'previous_response_id', 'prompt_cache_key'}:
            raise BudgetError('unqualified Codex compaction fields')
        if body.get('context_management'):
            raise BudgetError('unbounded server-side Codex compaction')
        if body.get('multi_agent') or body.get('access_programs'):
            raise BudgetError('unbounded provider-hosted Codex agents')
        if body.get('background') or body.get('n', 1) != 1:
            raise BudgetError('unqualified asynchronous or multiple Codex generation')
        tools = list(body.get('tools') or [])
        for item in body.get('input', []):
            if isinstance(item, dict) and item.get('type') == 'additional_tools':
                tools.extend(item.get('tools') or [])
            if isinstance(item, dict) and item.get('type') == 'compaction_trigger':
                raise BudgetError('unqualified in-band Codex compaction trigger')
        def local(tool):
            return isinstance(tool, dict) and (tool.get('type') in ('function', 'custom')
                or tool.get('type') == 'namespace' and all(local(child) for child in tool.get('tools', [])))
        if not all(local(tool) for tool in tools):
            raise BudgetError('unbounded hosted Codex generation tool')
        if route == '/responses' and body.get('max_output_tokens') is not None:
            outgoing = min(outgoing, positive_tokens(body['max_output_tokens']))
    elif provider == 'claude':
        if route != '/v1/messages':
            raise BudgetError('unsupported Claude generation route')
        if body.get('mcp_servers') or body.get('container'):
            raise BudgetError('unbounded hosted Claude generation configuration')
        safeguards = body.get('safeguards')
        if safeguards is not None:
            if (not isinstance(safeguards, list) or len(safeguards) != 1
                    or not isinstance(safeguards[0], dict)
                    or set(safeguards[0]) != {'type', 'classifier_context'}
                    or safeguards[0]['type'] != 'dangerous_tool_use'
                    or not isinstance(safeguards[0]['classifier_context'], dict)
                    or safeguards[0]['classifier_context'].get('v') != 1):
                raise BudgetError('unqualified Claude safeguards generation form')
            # Native dangerous_tool_use asks for server permission review inside
            # this session operation. The documented canonical token scope has
            # no separate classifier calls to count; client fallback classifiers
            # are fresh requests and must acquire their own reservations.
            basis += '; https://code.claude.com/docs/en/permission-modes#server-side-classifier-review'
        if any(not isinstance(tool, dict) or tool.get('type', 'custom') != 'custom' for tool in body.get('tools', [])):
            raise BudgetError('unbounded hosted Claude generation tool')
        output_bound = positive_tokens(body.get('max_tokens'))
        outgoing = min(outgoing, output_bound)
        edits = (body.get('context_management') or {}).get('edits', [])
        compactions = [edit for edit in edits if edit.get('type') == 'compact_20260112']
        if len(compactions) > 1 or any(edit.get('type') not in ('compact_20260112', 'clear_tool_uses_20250919', 'clear_thinking_20251015') for edit in edits):
            raise BudgetError('unbounded Claude context management')
        if compactions:
            # No hosted tools: at most one initial compaction and one reply.
            generations = 2
            outgoing = bounds[1]  # Compaction does not share max_tokens.
            basis += '; https://platform.claude.com/docs/en/build-with-claude/compaction-threshold'
        if body.get('compaction'):
            raise BudgetError('unqualified on-demand Claude compaction')
    else:
        raise BudgetError('unsupported generation provider')
    return incoming * generations, outgoing * generations, basis


class UsageObserver:
    """Incremental SSE/JSON usage extraction; response bodies stay in memory."""
    def __init__(self, provider, streaming, compact=False, claude_compaction=False,
                 pause_after_compaction=False, allow_missing_usage=False):
        self.provider, self.streaming, self.compact = provider, streaming, compact
        self.pending = b''
        self.usage = None
        self.terminal = 0
        self.message_started = False
        self.stop_reason = None
        self.provider_request_id = None
        self.claude_compaction = claude_compaction
        self.compaction_blocks = 0
        self.pause_after_compaction = pause_after_compaction
        self.allow_missing_usage = allow_missing_usage
        self.usage_seen = False

    def feed(self, chunk):
        self.pending += chunk
        if self.streaming:
            while b'\n' in self.pending:
                line, self.pending = self.pending.split(b'\n', 1)
                line = line.rstrip(b'\r')
                if line.startswith(b'data:'):
                    data = line[5:].strip()
                    if data and data != b'[DONE]':
                        self.event(json.loads(data))

    def event(self, value):
        if not isinstance(value, dict):
            raise BudgetError('malformed provider event')
        if value.get('type') == 'error' and self.allow_missing_usage and not self.usage_seen and 'usage' not in value:
            self.terminal += 1
            return
        if self.provider == 'codex':
            if value.get('type') in ('response.failed', 'response.incomplete', 'error'):
                raise BudgetError('uncertain provider completion')
            if value.get('type') == 'response.completed':
                response = value.get('response', {})
                if response.get('status') != 'completed':
                    raise BudgetError('uncertain provider completion')
                self.usage = response.get('usage')
                self.usage_seen = 'usage' in response
                self.provider_request_id = response.get('id')
                self.terminal += 1
        else:
            if value.get('type') == 'error':
                raise BudgetError('uncertain provider completion')
            if value.get('type') == 'message_start':
                if self.message_started:
                    raise BudgetError('duplicate provider message start')
                self.message_started = True
                self.usage = dict(value.get('message', {}).get('usage') or {})
                self.usage_seen = 'usage' in value.get('message', {})
                self.provider_request_id = value.get('message', {}).get('id')
            elif value.get('type') == 'message_delta':
                if not self.message_started:
                    raise BudgetError('provider delta before message start')
                self.usage.update(value.get('usage') or {})
                self.usage_seen |= 'usage' in value
                self.stop_reason = value.get('delta', {}).get('stop_reason')
            elif value.get('type') == 'message_stop':
                self.terminal += 1
            elif value.get('type') == 'content_block_start' and value.get('content_block', {}).get('type') == 'compaction':
                self.compaction_blocks += 1

    def finish(self):
        if self.streaming:
            if self.pending.strip():
                raise BudgetError('truncated provider event stream')
            if self.allow_missing_usage and not self.usage_seen and self.terminal == 1:
                return None
            if self.terminal != 1 or (self.provider == 'claude' and not self.stop_reason):
                raise BudgetError('missing unique provider completion')
        else:
            value = json.loads(self.pending)
            if self.allow_missing_usage and isinstance(value, dict) and 'usage' not in value:
                return None
            if not isinstance(value, dict) or ('error' in value):
                raise BudgetError('uncertain provider completion')
            if self.provider == 'codex' and not self.compact and value.get('status') != 'completed':
                raise BudgetError('uncertain provider completion')
            if self.provider == 'claude' and not value.get('stop_reason'):
                raise BudgetError('uncertain provider completion')
            self.stop_reason = value.get('stop_reason')
            self.usage = value.get('usage')
            self.provider_request_id = value.get('id')
            if self.provider == 'claude':
                self.compaction_blocks = sum(item.get('type') == 'compaction' for item in value.get('content', []) if isinstance(item, dict))
        if self.provider == 'claude' and (self.claude_compaction or self.compaction_blocks):
            iterations = (self.usage or {}).get('iterations')
            messages = 0 if self.pause_after_compaction and self.stop_reason == 'compaction' and self.compaction_blocks else 1
            if ((self.compaction_blocks and not iterations)
                    or iterations and (not isinstance(iterations, list)
                        or sum(item.get('type') == 'compaction' for item in iterations if isinstance(item, dict)) != self.compaction_blocks
                        or sum(item.get('type') == 'message' for item in iterations if isinstance(item, dict)) != messages)):
                raise BudgetError('missing complete compaction iteration usage')
        normalize_usage(self.provider, self.usage)
        return self.usage


class _ZstdDecoder:
    class Input(ctypes.Structure):
        _fields_ = [('src', ctypes.c_void_p), ('size', ctypes.c_size_t), ('pos', ctypes.c_size_t)]
    class Output(ctypes.Structure):
        _fields_ = [('dst', ctypes.c_void_p), ('size', ctypes.c_size_t), ('pos', ctypes.c_size_t)]

    def __init__(self):
        library = ctypes.util.find_library('zstd')
        if not library:
            raise BudgetError('zstd content decoder is unavailable')
        self.library = ctypes.CDLL(library)
        self.library.ZSTD_createDStream.restype = ctypes.c_void_p
        self.library.ZSTD_initDStream.argtypes = [ctypes.c_void_p]
        self.library.ZSTD_initDStream.restype = ctypes.c_size_t
        self.library.ZSTD_decompressStream.argtypes = [ctypes.c_void_p, ctypes.POINTER(self.Output), ctypes.POINTER(self.Input)]
        self.library.ZSTD_decompressStream.restype = ctypes.c_size_t
        self.library.ZSTD_freeDStream.argtypes = [ctypes.c_void_p]
        self.library.ZSTD_isError.argtypes = [ctypes.c_size_t]
        self.stream = self.library.ZSTD_createDStream()
        if not self.stream or self.library.ZSTD_isError(self.library.ZSTD_initDStream(self.stream)):
            self.close()
            raise BudgetError('zstd content decoder is unavailable')
        self.complete = False

    def feed(self, raw):
        source = ctypes.create_string_buffer(raw)
        incoming = self.Input(ctypes.cast(source, ctypes.c_void_p), len(raw), 0)
        chunks = []
        while True:
            target = ctypes.create_string_buffer(65536)
            outgoing = self.Output(ctypes.cast(target, ctypes.c_void_p), len(target), 0)
            before = incoming.pos
            remaining = self.library.ZSTD_decompressStream(self.stream, ctypes.byref(outgoing), ctypes.byref(incoming))
            if self.library.ZSTD_isError(remaining):
                raise BudgetError('invalid compressed content frame')
            chunks.append(target.raw[:outgoing.pos])
            self.complete = remaining == 0
            if incoming.pos == incoming.size and (self.complete or outgoing.pos < len(target)):
                return b''.join(chunks)
            if incoming.pos == before and not outgoing.pos:
                raise BudgetError('invalid compressed content frame')

    def finish(self):
        if not self.complete:
            raise BudgetError('truncated compressed content frame')
        return b''

    def close(self):
        if self.stream:
            self.library.ZSTD_freeDStream(self.stream)
            self.stream = None


class _BrotliDecoder:
    def __init__(self):
        library = ctypes.util.find_library('brotlidec')
        if not library:
            raise BudgetError('brotli content decoder is unavailable')
        self.library = ctypes.CDLL(library)
        self.library.BrotliDecoderCreateInstance.argtypes = [ctypes.c_void_p] * 3
        self.library.BrotliDecoderCreateInstance.restype = ctypes.c_void_p
        self.library.BrotliDecoderDestroyInstance.argtypes = [ctypes.c_void_p]
        self.library.BrotliDecoderDecompressStream.argtypes = [ctypes.c_void_p,
            ctypes.POINTER(ctypes.c_size_t), ctypes.POINTER(ctypes.c_void_p),
            ctypes.POINTER(ctypes.c_size_t), ctypes.POINTER(ctypes.c_void_p), ctypes.POINTER(ctypes.c_size_t)]
        self.stream = self.library.BrotliDecoderCreateInstance(None, None, None)
        if not self.stream:
            raise BudgetError('brotli content decoder is unavailable')
        self.complete = False

    def feed(self, raw):
        if self.complete:
            if raw:
                raise BudgetError('trailing compressed content')
            return b''
        source = ctypes.create_string_buffer(raw)
        incoming = ctypes.c_size_t(len(raw))
        next_input = ctypes.c_void_p(ctypes.addressof(source))
        chunks = []
        while True:
            target = ctypes.create_string_buffer(65536)
            outgoing = ctypes.c_size_t(len(target))
            next_output = ctypes.c_void_p(ctypes.addressof(target))
            result = self.library.BrotliDecoderDecompressStream(self.stream,
                ctypes.byref(incoming), ctypes.byref(next_input), ctypes.byref(outgoing), ctypes.byref(next_output), None)
            if result == 0:
                raise BudgetError('invalid compressed content frame')
            chunks.append(target.raw[:len(target) - outgoing.value])
            self.complete = result == 1
            if self.complete and incoming.value:
                raise BudgetError('trailing compressed content')
            if result != 3:
                return b''.join(chunks)

    def finish(self):
        if not self.complete:
            raise BudgetError('truncated compressed content frame')
        return b''

    def close(self):
        if self.stream:
            self.library.BrotliDecoderDestroyInstance(self.stream)
            self.stream = None


class ContentDecoder:
    """Decode incrementally for observation while original wire bytes flow live."""
    def __init__(self, encoding):
        self.encoding = (encoding or 'identity').strip().lower()
        if self.encoding in ('gzip', 'deflate'):
            self.decoder = zlib.decompressobj(31 if self.encoding == 'gzip' else 15)
        elif self.encoding == 'zstd':
            self.decoder = _ZstdDecoder()
        elif self.encoding == 'br':
            self.decoder = _BrotliDecoder()
        elif self.encoding != 'identity':
            raise BudgetError('unsupported provider content encoding')

    def feed(self, raw):
        if self.encoding == 'identity':
            return raw
        if self.encoding not in ('gzip', 'deflate'):
            return self.decoder.feed(raw)
        chunks = []
        while raw:
            if self.decoder.eof:
                if self.encoding != 'gzip':
                    raise BudgetError('trailing compressed content')
                self.decoder = zlib.decompressobj(31)
            chunks.append(self.decoder.decompress(raw))
            raw = self.decoder.unused_data
        return b''.join(chunks)

    def finish(self):
        if self.encoding == 'identity':
            return b''
        if self.encoding not in ('gzip', 'deflate'):
            return self.decoder.finish()
        if not self.decoder.eof:
            raise BudgetError('truncated compressed content frame')
        return self.decoder.flush()

    def close(self):
        if self.encoding in ('zstd', 'br'):
            self.decoder.close()


def decode_request(raw, encoding):
    decoder = ContentDecoder(encoding)
    try:
        return decoder.feed(raw) + decoder.finish()
    finally:
        decoder.close()


class BudgetGateway:
    """Loopback HTTP/SSE route; all generations reserve before upstream I/O."""
    def __init__(self, ledger, provider, upstream_base, *, model_bounds=None):
        self.ledger, self.provider = ledger, provider
        self.upstream = urllib.parse.urlsplit(upstream_base)
        if (self.upstream.scheme not in ('https', 'http') or not self.upstream.hostname
                or self.upstream.username or self.upstream.password or self.upstream.query or self.upstream.fragment):
            raise BudgetError('unsupported provider endpoint')
        if self.upstream.scheme == 'http' and self.upstream.hostname not in ('127.0.0.1', 'localhost', '::1'):
            raise BudgetError('provider endpoint requires HTTPS')
        if self.upstream.scheme == 'https':
            qualified = {
                'codex': ('chatgpt.com', '/backend-api/codex'),
                'claude': ('api.anthropic.com', ''),
            }
            if (self.upstream.port not in (None, 443)
                    or (self.upstream.hostname, self.upstream.path.rstrip('/')) != qualified.get(provider)):
                raise BudgetError('provider endpoint has no qualified model usage bound')
        self.model_bounds = model_bounds
        self.account_reader = None
        self.prefix = '/' + secrets.token_urlsafe(24)
        if provider == 'codex':
            # Native route classification uses this suffix. Keep backend
            # behavior while changing only the run-owned transport address.
            self.prefix += '/backend-api/codex'
        self.connections = set()
        self.lock = threading.Lock()
        self.handlers = set()
        self.closing = threading.Event()
        gateway = self

        class Handler(http.server.BaseHTTPRequestHandler):
            protocol_version = 'HTTP/1.1'

            def log_message(self, *unused):
                pass

            def do_GET(self):
                gateway._handle(self)

            def do_POST(self):
                gateway._handle(self)

            def do_CONNECT(self):
                self.send_error(405)

        self.server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        self.server.daemon_threads = True
        self.server.handle_error = lambda *unused: self.ledger.halt('budget request handler failed')
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True, name='uclusion-token-budget')

    def start(self):
        self.thread.start()
        self.base_url = f'http://127.0.0.1:{self.server.server_port}{self.prefix}'
        return self.base_url

    def url_for_role(self, root_role):
        """Run-owned launch alias; keep the native provider suffix intact."""
        if root_role not in ('owner', 'evaluator'):
            raise ValueError('unsupported launch root role')
        return f'http://127.0.0.1:{self.server.server_port}/{root_role}{self.prefix}'

    def check(self):
        state = self.ledger.snapshot()
        if state['halt_reason']:
            raise BudgetError(state['halt_reason'])
        if self.closing.is_set():
            raise AdmissionPaused('budget gateway is closing')
        if not self.thread.is_alive():
            self.ledger.halt('budget gateway stopped')
            raise BudgetError('budget gateway stopped')

    def _handle(self, handler):
        identity = None
        upstream = None
        decoder = None
        sent_headers = False
        stage = 'request_validation'
        handler_context = 'unknown'
        with self.lock:
            self.handlers.add(threading.current_thread())
        try:
            handler.connection.settimeout(5)
            role_prefix, separator, remainder = handler.path.partition(self.prefix + '/')
            if not separator or (role_prefix and not re.fullmatch(r'/[A-Za-z0-9_-]+', role_prefix)):
                raise BudgetError('uncovered provider route')
            root_role = role_prefix[1:] if role_prefix in ('/owner', '/evaluator') else 'unknown'
            route = '/' + remainder
            path = urllib.parse.urlsplit(route).path
            generation = handler.command == 'POST' and path in ('/responses', '/responses/compact', '/v1/messages')
            metadata = (handler.command == 'GET' and (path == '/models' or path == '/v1/models' or path.startswith('/v1/models/'))
                        or handler.command == 'POST' and path == '/v1/messages/count_tokens')
            handler_context = 'generation' if generation else 'metadata' if metadata else 'unknown'
            if not generation and not metadata:
                raise BudgetError('uncovered provider generation route: ' + path[:100])
            self.check()
            if handler.headers.get('Upgrade'):
                raise BudgetError('uncovered WebSocket generation route')
            if handler.headers.get('Transfer-Encoding'):
                raise BudgetError('unsupported chunked provider request')
            stage = 'request_body_read'
            length = int(handler.headers.get('Content-Length', '0'))
            raw = handler.rfile.read(length)
            if len(raw) != length:
                raise BudgetError('incomplete provider request')
            body = None
            if generation:
                stage = 'request_admission'
                account = self.account_reader() if self.account_reader else None
                with self.ledger.decision(stage=stage, handler_context=handler_context):
                    if self.account_reader:
                        validate_codex_account(account)
                    body = json.loads(decode_request(raw, handler.headers.get('Content-Encoding')))
                    incoming, outgoing, basis = request_bounds(self.provider, path, body, self.model_bounds)
                    identity = self.ledger.reserve(incoming, outgoing, path, body['model'],
                                                   provider=self.provider, bound_basis=basis,
                                                   root_role=root_role)
            connection = http.client.HTTPSConnection if self.upstream.scheme == 'https' else http.client.HTTPConnection
            upstream = connection(self.upstream.hostname, self.upstream.port, timeout=60)
            with self.lock:
                self.connections.add(upstream)
            headers = {key: value for key, value in handler.headers.items() if key.lower() not in HOP_HEADERS}
            headers['Content-Length'] = str(len(raw))
            # One request, with no proxy retry/redirect/fallback, using exactly
            # the native client's in-memory authentication and original bytes.
            stage = 'upstream_request'
            upstream.request(handler.command, self.upstream.path.rstrip('/') + route, body=raw, headers=headers)
            stage = 'upstream_headers'
            response = upstream.getresponse()
            observer = None
            if generation:
                stage = 'response_validation'
                self.ledger.record_response(identity, response)
                observation_error = None
                try:
                    decoder = ContentDecoder(response.getheader('Content-Encoding'))
                    content_type = response.getheader('Content-Type')
                    streaming = ('text/event-stream' in (content_type or '').lower()
                        or response.status == 200 and content_type is None and body.get('stream') is True)
                    edits = (body.get('context_management') or {}).get('edits', []) if self.provider == 'claude' else []
                    observer = UsageObserver(self.provider, streaming, compact=path.endswith('/compact'),
                        allow_missing_usage=response.status != 200,
                        claude_compaction=any(edit.get('type') == 'compact_20260112' for edit in edits),
                        pause_after_compaction=any(edit.get('type') == 'compact_20260112' and edit.get('pause_after_compaction') is True for edit in edits))
                except Exception as error:
                    observation_error = _failure_diagnostic(error, stage, handler_context, identity)
                if observation_error:
                    self.ledger.uncertain(identity, diagnostic=observation_error)
            stage = 'downstream_headers'
            delivered = True
            sent_headers = True
            try:
                handler.send_response(response.status)
                for key, value in response.getheaders():
                    if key.lower() not in HOP_HEADERS - {'content-length'}:
                        handler.send_header(key, value)
                # Reframe decoded HTTP chunks so an interrupted upstream cannot
                # masquerade as successful completion at the native client.
                if response.chunked:
                    handler.send_header('Transfer-Encoding', 'chunked')
                handler.send_header('Connection', 'close')
                handler.end_headers()
            except OSError:
                delivered = False
            first = True
            while True:
                stage = 'upstream_body_read'
                chunk = response.read1(65536)
                if not chunk:
                    break
                if identity and first:
                    stage = 'first_byte_record'
                    self.ledger.first_byte(identity)
                    first = False
                if observer:
                    stage = 'response_observation'
                    observation_error = None
                    try:
                        observer.feed(decoder.feed(chunk))
                    except Exception as error:
                        observation_error = _failure_diagnostic(error, stage, handler_context, identity)
                        observer = None
                    if observation_error:
                        self.ledger.uncertain(identity, diagnostic=observation_error)
                if delivered:
                    try:
                        stage = 'downstream_write'
                        wire = (('%x\r\n' % len(chunk)).encode() + chunk + b'\r\n'
                                if response.chunked else chunk)
                        handler.wfile.write(wire)
                        handler.wfile.flush()
                    except OSError:
                        # Delivery failure does not erase provider consumption.
                        delivered = False
            stage = 'response_completion'
            if response.length not in (None, 0):
                raise http.client.IncompleteRead(b'')
            if observer:
                observation_error = None
                try:
                    observer.feed(decoder.finish())
                    usage = observer.finish()
                except Exception as error:
                    observation_error = _failure_diagnostic(error, stage, handler_context, identity)
                if observation_error:
                    stage = 'uncertainty_record'
                    self.ledger.uncertain(identity, diagnostic=observation_error)
                elif usage is None:
                    stage = 'retention_record'
                    self.ledger.retain(identity)
                else:
                    stage = 'usage_settlement'
                    self.ledger.settle(identity, self.provider, usage, observer.provider_request_id,
                                       stage='response_completion', handler_context=handler_context)
            if delivered:
                try:
                    if response.chunked:
                        handler.wfile.write(b'0\r\n\r\n')
                        handler.wfile.flush()
                except OSError:
                    delivered = False
            if identity and delivered:
                stage = 'delivery_record'
                self.ledger.delivered(identity)
        except Exception as error:
            diagnostic = _failure_diagnostic(error, stage, handler_context, identity)
            transport_failure = (stage in ('upstream_request', 'upstream_headers', 'upstream_body_read', 'response_completion')
                                 and isinstance(error, (OSError, http.client.HTTPException)))
            if isinstance(error, AdmissionPaused):
                reason = str(error)
            elif transport_failure and (identity or handler_context == 'metadata'):
                reason = 'native provider transport interrupted'
                if identity:
                    self.ledger.uncertain(identity, diagnostic=diagnostic)
            else:
                reason = str(error) if isinstance(error, BudgetError) else 'budget controller failed'
                self.ledger.halt(reason, diagnostic=diagnostic)
            if not sent_headers:
                try:
                    payload = json.dumps({'error': {'type': 'uclusion_provider_transport_error' if transport_failure else 'uclusion_budget_halted', 'message': reason}}).encode()
                    handler.send_response(502 if transport_failure else 409)
                    handler.send_header('Content-Type', 'application/json')
                    handler.send_header('Content-Length', str(len(payload)))
                    handler.send_header('Connection', 'close')
                    handler.end_headers()
                    handler.wfile.write(payload)
                except OSError:
                    pass
        finally:
            handler.close_connection = True
            if decoder:
                decoder.close()
            if upstream:
                upstream.close()
                with self.lock:
                    self.connections.discard(upstream)
            with self.lock:
                self.handlers.discard(threading.current_thread())

    def close(self):
        self.closing.set()
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=3)
        # Already-forwarded work may still report trustworthy usage after the
        # run halted or its downstream client exited. Let those handlers drain
        # before closing transport and writing the final summary.
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline:
            with self.lock:
                handlers = list(self.handlers)
            if not handlers:
                return
            for handler in handlers:
                handler.join(timeout=.05)
        with self.lock:
            for connection in self.connections:
                if connection.sock:
                    try:
                        connection.sock.shutdown(socket.SHUT_RDWR)
                    except OSError:
                        pass
                connection.close()
            handlers = list(self.handlers)
        for handler in handlers:
            handler.join(timeout=1)
        if any(handler.is_alive() for handler in handlers):
            self.ledger.halt('budget transport could not stop all outstanding handlers')
            raise BudgetError('budget transport could not stop all outstanding handlers')


def codex_runtime_args(base_url):
    """Keep OpenAI subscription auth; move only this writer's HTTP transport."""
    provider = {'name': 'OpenAI', 'base_url': base_url,
                'wire_api': 'responses', 'requires_openai_auth': True,
                'supports_websockets': False}
    def toml(value):
        if isinstance(value, dict):
            return '{' + ','.join(key + '=' + toml(item) for key, item in value.items()) + '}'
        return json.dumps(value, separators=(',', ':'))
    return ['-c', 'model_provider="uclusion_budget"',
            '-c', 'model_providers.uclusion_budget=' + toml(provider)]


def validate_codex_account(account):
    """Custom destinations require successful native account-policy discovery.

    The native client regards the gateway as an independent origin after it
    discovers requirements. Qualify only the ordinary backend with no routing
    override, so that this transport cannot discard an account's constraints.
    """
    if (not isinstance(account, dict) or not isinstance(account.get('account'), dict)
            or account['account'].get('type') not in ('apiKey', 'chatgpt')):
        raise BudgetError('saved native Codex sign-in is not ready')
    routing = account.get('workspaceRouting')
    if routing is not None and (not isinstance(routing, dict)
            or routing.get('backendOrigin') != 'https://chatgpt.com'
            or routing.get('accountRoutingOverride') != 'NO_CONSTRAINT'):
        raise BudgetError('unsupported native Codex account backend or routing constraint')


def bind_codex_account(gateway, codex_home, socket_path):
    """Read native policy before any generation, and recheck for each request."""
    from uclusionCodexNative import NativeClient
    client = NativeClient(codex_home, lambda unused: None, socket_path=socket_path)
    try:
        client.start()
        reader = lambda: client.request('account/read', {'refreshToken': False})
        account = reader()
        with gateway.ledger.decision():
            validate_codex_account(account)
        gateway.account_reader = reader
        return client
    except Exception as error:
        reason = str(error) if isinstance(error, BudgetError) else 'native Codex account requirements could not be confirmed'
        gateway.ledger.halt(reason)
        client.close()
        raise BudgetError(reason) from None


class OwnedCodexServer:
    """A run-owned native writer, sharing the caller's existing CODEX_HOME."""
    def __init__(self, args, environment, cwd, socket_path=None):
        self.args, self.environment, self.cwd = args, environment, cwd
        self.directory = None
        if socket_path is None:
            self.directory = tempfile.TemporaryDirectory(prefix='ucl-native-')
            socket_path = os.path.join(self.directory.name, 'control.sock')
        self.socket_path = str(Path(socket_path).absolute())
        if os.path.lexists(self.socket_path) or len(os.fsencode(self.socket_path)) > 100:
            raise BudgetError('native run socket is occupied or too long')
        self.process = None

    def start(self):
        self.process = subprocess.Popen([*self.args, 'app-server', '--listen', 'unix://' + self.socket_path],
            cwd=self.cwd, env=self.environment, stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
        deadline = time.monotonic() + 20
        while time.monotonic() < deadline:
            if self.process.poll() is not None:
                raise BudgetError('owned native Codex server exited during startup')
            if os.path.exists(self.socket_path):
                return self
            time.sleep(.05)
        raise BudgetError('owned native Codex server did not become ready')

    @property
    def remote_args(self):
        return ['--remote', 'unix://' + self.socket_path]

    def close(self):
        if self.process:
            for sig in (signal.SIGTERM, signal.SIGKILL):
                try:
                    os.killpg(self.process.pid, sig)
                except ProcessLookupError:
                    pass
                try:
                    self.process.wait(timeout=2)
                    break
                except subprocess.TimeoutExpired:
                    pass
        if self.directory:
            self.directory.cleanup()


class OwnedProcesses:
    """Linux subreaper tracking for this supervisor's complete descendant tree."""
    def __init__(self, watch=True):
        if not Path('/proc/self/stat').is_file():
            raise BudgetError('owned process-tree stopping requires Linux /proc')
        self.libc = ctypes.CDLL(None, use_errno=True)
        previous = ctypes.c_int()
        if self.libc.prctl(37, ctypes.byref(previous), 0, 0, 0) or self.libc.prctl(36, 1, 0, 0, 0):
            raise BudgetError('owned process-tree subreaper is unavailable')
        self.previous = previous.value
        self.root = os.getpid()
        self.known = {}
        self.excluded = set()
        self.lock = threading.RLock()
        self.closed = threading.Event()
        self.thread = None
        if watch:
            self.thread = threading.Thread(target=self._watch, daemon=True, name='uclusion-owned-processes')
            self.thread.start()

    @staticmethod
    def processes():
        result = {}
        for entry in Path('/proc').iterdir():
            if not entry.name.isdigit():
                continue
            try:
                fields = (entry / 'stat').read_text().rsplit(')', 1)[1].split()
                result[int(entry.name)] = (int(fields[1]), int(fields[19]), fields[0])
            except (OSError, ValueError, IndexError):
                continue
        return result

    def _scan(self):
        rows = self.processes()
        parents = {self.root, *[pid for pid, start in self.known.items()
                               if pid in rows and rows[pid][1] == start]}
        while True:
            additions = {pid for pid, (parent, start, state) in rows.items()
                         if parent in parents and pid not in parents}
            if not additions:
                break
            parents.update(additions)
        for pid in parents - {self.root}:
            self.known[pid] = rows[pid][1]
        return {pid: rows[pid][2] for pid, start in self.known.items()
                if pid not in self.excluded and pid in rows and rows[pid][1] == start and rows[pid][2] != 'Z'}

    def _watch(self):
        while not self.closed.wait(.05):
            with self.lock:
                self._scan()

    def track(self, process):
        with self.lock:
            self._scan()
        return process

    def stop(self):
        with self.lock:
            started = time.monotonic()
            quiet = 0
            while time.monotonic() - started < 5:
                alive = self._scan()
                if not alive:
                    quiet += 1
                    if quiet == 3:
                        return
                else:
                    quiet = 0
                for pid in alive:
                    try:
                        os.kill(pid, signal.SIGKILL if time.monotonic() - started >= 1 else signal.SIGTERM)
                    except ProcessLookupError:
                        pass
                time.sleep(.05)
            if self._scan():
                raise BudgetError('could not stop all owned participant descendants')

    def close(self):
        try:
            self.stop()
        finally:
            self.closed.set()
            if self.thread:
                self.thread.join(timeout=2)
            self.libc.prctl(36, self.previous, 0, 0, 0)


def guard_demo_supervisor(run_dir, max_input_tokens, max_output_tokens):
    """Fork before threads: a surviving ancestor owns every detached tool.

    Only the worker returns None. The public supervisor owns a pipe and waits;
    its death, including SIGKILL, closes the pipe and triggers owned cleanup.
    """
    global _GUARDED_NATIVE_SOCKET
    directory = Path(run_dir)
    ledger = BudgetLedger(directory / 'token-budget.sqlite3', directory.name,
                          max_input_tokens, max_output_tokens)
    state = ledger.snapshot()
    if state['halt_reason'] or state['finished']:
        raise BudgetError(state['halt_reason'] or 'budget run is finished')
    reader, writer = os.pipe()
    guardian = os.fork()
    if guardian:
        os.close(reader)
        try:
            _, status = os.waitpid(guardian, 0)
            return os.waitstatus_to_exitcode(status)
        finally:
            os.close(writer)
    os.close(writer)
    os.setsid()
    requested = []
    for signum in (signal.SIGTERM, signal.SIGHUP):
        signal.signal(signum, lambda number, frame: requested.append(number))
    tree = None
    sockets = None
    try:
        tree = OwnedProcesses(watch=False)
        sockets = tempfile.TemporaryDirectory(prefix='ucl-native-')
        _GUARDED_NATIVE_SOCKET = str(Path(sockets.name) / 'control.sock')
        worker = os.fork()
        if not worker:
            os.close(reader)
            for signum in (signal.SIGTERM, signal.SIGHUP):
                signal.signal(signum, signal.SIG_DFL)
            return None
        tree.excluded.add(worker)
        tree._scan()
        running = directory / 'token-budget-running.json'
        running.write_text(json.dumps({'guardian_pid': os.getpid(),
            'worker_pid': worker, 'worker_birth': tree.known[worker]}))
        reason, status = None, None
        while reason is None:
            state = ledger.snapshot()
            tree._scan()
            exited, value = os.waitpid(worker, os.WNOHANG)
            if exited:
                status = value
                reason = 'demo controller worker exited'
            elif requested or (select.select([reader], [], [], 0)[0] and not os.read(reader, 1)):
                reason = 'demo supervisor exited'
            elif state['halt_reason']:
                reason = state['halt_reason']
            else:
                time.sleep(.05)
        state = ledger.snapshot()
        normal = (status is not None and os.waitstatus_to_exitcode(status) == 0
                  and state['finished'] and not state['halt_reason'])
        if not normal:
            ledger.halt(reason)
        if status is None:
            try:
                os.kill(worker, signal.SIGSTOP)
            except ProcessLookupError:
                pass
        stop_started = time.monotonic()
        tree.stop()
        stopped_at = time.time()
        if status is None:
            for signum in (signal.SIGTERM, signal.SIGCONT):
                try:
                    os.kill(worker, signum)
                except ProcessLookupError:
                    pass
        ledger.finish_active(stopped_at=stopped_at)
        drain_started = time.monotonic()
        while status is None and time.monotonic() - drain_started < 6:
            exited, value = os.waitpid(worker, os.WNOHANG)
            if exited:
                status = value
            else:
                time.sleep(.05)
        if status is None:
            try:
                os.kill(worker, signal.SIGKILL)
            except ProcessLookupError:
                pass
            _, status = os.waitpid(worker, 0)
        tree.stop()
        proof = {'owned_processes_stopped': True, 'stop_reason': None if normal else reason,
                 'participants_stopped_at': stopped_at, 'stop_seconds': drain_started - stop_started,
                 'controller_drain_seconds': time.monotonic() - drain_started,
                 'controller_exit_status': os.waitstatus_to_exitcode(status)}
        (directory / 'token-budget-lifetime.json').write_text(json.dumps(proof, indent=2))
        summary = directory / 'token-budget-summary.json'
        if not summary.exists():
            state = ledger.snapshot()
            state.update(requests=ledger.requests(), **proof)
            summary.write_text(json.dumps(state, indent=2))
        sockets.cleanup()
        running.unlink(missing_ok=True)
        os._exit(os.waitstatus_to_exitcode(status) if normal else 1)
    except BaseException:
        try:
            if tree:
                tree.excluded.clear()
                tree.stop()
            if sockets:
                sockets.cleanup()
        finally:
            os._exit(1)


class RunBudget:
    """Demo lifetime: one ledger and one gateway shared by both native roles."""
    def __init__(self, run_dir, provider, max_input_tokens=PROVISIONAL_INPUT_TOKENS,
                 max_output_tokens=PROVISIONAL_OUTPUT_TOKENS, upstream_base=None, *, create=False):
        self.run_dir = Path(run_dir)
        self.native_socket_path = _GUARDED_NATIVE_SOCKET
        ledger_path = self.run_dir / 'token-budget.sqlite3'
        identity = self.run_dir.name
        self.ledger = BudgetLedger(ledger_path, identity, max_input_tokens, max_output_tokens,
                                  create=create)
        state = self.ledger.snapshot()
        if state['halt_reason'] or state['finished']:
            raise BudgetError(state['halt_reason'] or 'budget run is finished')
        default = ('https://chatgpt.com/backend-api/codex' if provider == 'codex'
                   else os.environ.get('ANTHROPIC_BASE_URL', 'https://api.anthropic.com'))
        if upstream_base is None and urllib.parse.urlsplit(default).scheme != 'https':
            self.ledger.halt('inherited provider endpoint has no qualified model usage bound')
            raise BudgetError('inherited provider endpoint has no qualified model usage bound')
        self.processes = OwnedProcesses()
        try:
            self.gateway = BudgetGateway(self.ledger, provider, upstream_base or default)
            self.base_url = self.gateway.start()
        except Exception as error:
            try:
                self.ledger.halt(str(error) if isinstance(error, BudgetError) else 'budget gateway could not start')
            finally:
                self.processes.close()
            raise
        print(self.ledger.describe(), flush=True)
        self.monitor_stop = threading.Event()
        self.on_halt = self.processes.stop
        self.monitor = threading.Thread(target=self._monitor, daemon=True, name='uclusion-budget-monitor')
        self.monitor.start()

    def _monitor(self):
        while not self.monitor_stop.wait(.1):
            try:
                self.check()
            except Exception:
                if self.on_halt:
                    self.on_halt()
                return

    def check(self):
        self.gateway.check()

    def track(self, process):
        return self.processes.track(process)

    def close(self):
        self.monitor_stop.set()
        self.monitor.join(timeout=3)
        self.processes.close()
        self.ledger.finish_active()
        self.gateway.close()
        print(self.ledger.describe(), flush=True)
        state = self.ledger.snapshot()
        state['requests'] = self.ledger.requests()
        state['owned_processes_stopped'] = True
        path = self.run_dir / 'token-budget-summary.json'
        temporary = path.with_suffix('.tmp')
        with open(temporary, 'w', encoding='utf-8') as output:
            json.dump(state, output, indent=2, sort_keys=True)
        os.replace(temporary, path)
