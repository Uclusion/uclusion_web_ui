#!/usr/bin/python3
import argparse
import hashlib
import io
import json
import math
import os
import re
import select
import shutil
import signal
import sqlite3
import stat
import subprocess
import sys
import tempfile
import threading
import time
import urllib.request
import urllib.parse
import traceback
import uuid
from contextlib import closing, contextmanager, redirect_stdout
from itertools import batched
from datetime import datetime


# Define the names of the configuration file and the target file
SOURCES_CONFIG_FILE = 'uclusion.json'
DEV_SOURCES_CONFIG_FILE = 'dev_uclusion.json'
STAGE_SOURCES_CONFIG_FILE = 'stage_uclusion.json'
CREDENTIALS_FILE = 'credentials'
DEV_CREDENTIALS_FILE = 'dev_credentials'
STAGE_CREDENTIALS_FILE = 'stage_credentials'
DEV_API_URL = "dev.api.uclusion.com/v1"
STAGE_API_URL = "stage.api.uclusion.com/v1"
PRODUCTION_API_URL = "production.api.uclusion.com/v1"
DEFAULT_EXPORT_FOLDER = os.path.join(os.path.expanduser('~'), '.uclusion', 'export')
INBOX_FILE = 'poke_inbox.sqlite3'
MESSAGE_RETENTION_SECONDS = 7 * 24 * 60 * 60
DEFAULT_CONSUMER = 'default'
SESSION_CONSUMER_PREFIX = 'session-'
CONSUMER_ENV_VAR = 'UCLUSION_CONSUMER'


def generate_session_consumer():
    return SESSION_CONSUMER_PREFIX + uuid.uuid4().hex[:12]


def resolve_consumer(explicit_consumer, is_listener):
    """Pick the delivery cursor identity for a wait or listen (J-all-379).

    Every agent session gets its own cursor so every session sees every poke
    arriving while it is armed (S-all-205: a brand-new cursor starts at the
    arm-time high-water mark — the retained backlog is history). Priority:
    an explicit --consumer, then the UCLUSION_CONSUMER environment variable
    (the human's knob for surfaces that spawn many processes per session),
    then for a listener a fresh generated identity - the listener process IS
    the session. A bare wait falls back to the shared default cursor because
    a per-invocation identity would start past the pending backlog on every
    drain and deliver nothing; surfaces that can identify their session (the
    Cursor stop hook's conversation id, or the human via UCLUSION_CONSUMER)
    get their own lane.
    """
    if explicit_consumer is not None:
        return explicit_consumer
    env_consumer = os.environ.get(CONSUMER_ENV_VAR)
    if env_consumer:
        return env_consumer
    if is_listener:
        return generate_session_consumer()
    return DEFAULT_CONSUMER
CODEX_BRIDGE_SYMLINK = os.path.join(
    os.path.expanduser('~'), '.local', 'bin', 'uclusionCodexBridge.py'
)
UCLUSION_MCP_PROXY_SYMLINK = os.path.join(
    os.path.expanduser('~'), '.local', 'bin', 'uclusionMCPProxy.py'
)
CODEX_CHILD_SHUTDOWN_TIMEOUT = 5
CODEX_CHILD_POLL_INTERVAL = 0.1
CODEX_APP_SERVER_START_TIMEOUT = 10
CODEX_BRIDGE_READY_TIMEOUT = 10
CODEX_APP_SERVER_DIAGNOSTIC_BYTES = 16 * 1024
CODEX_APP_SERVER_DIAGNOSTIC_LINES = 8
CODEX_APP_SERVER_DIAGNOSTIC_LINE_CHARS = 512
CODEX_APP_SERVER_DIAGNOSTIC_DRAIN_TIMEOUT = 0.2
# Keep synchronized with uclusionCodexBridge.EXIT_RELAY_FAILED.
CODEX_BRIDGE_RELAY_FAILED_EXIT = 5
MINIMUM_CODEX_VERSION = (0, 145, 0)
MINIMUM_CODEX_VERSION_TEXT = '.'.join(str(part) for part in MINIMUM_CODEX_VERSION)
TOKEN_AUDIT_DEFAULT_PORT_BASE = 20000
TOKEN_AUDIT_PORT_SPAN = 30000
CODEX_LEGACY_BRIDGE_ENV = (
    'UCLUSION_CODEX_BRIDGE_INSTANCE',
    'UCLUSION_CODEX_BRIDGE_ENV',
    'UCLUSION_CODEX_BRIDGE_WORKSPACE',
    'UCLUSION_CODEX_BRIDGE_CWD',
    'UCLUSION_CODEX_BRIDGE_SCRIPT',
    'UCLUSION_CODEX_APP_SERVER_SOCKET',
    'UCLUSION_CODEX_BRIDGE_READY_FILE',
    'UCLUSION_CODEX_RECEIVER_PID_FILE',
)
CODEX_LAUNCH_MANAGED_ENV = CODEX_LEGACY_BRIDGE_ENV + (
    'UCLUSION_CODEX_ACTIVE_RELEASE',
    'UCLUSION_CODEX_STAGED_CLI',
)

# Update machinery (J-all-367). Scripts live in a version-named install dir
# (~/.local/uclusion-cli/<script_reinstall_version>/bin) so the installed
# release is derivable from this file's realpath; the workflow-doc marker and
# Codex table header identify which AI client surfaces are installed so
# `uclusion update` refreshes exactly those.
SCRIPT_INSTALL_PREFIX = os.path.join(os.path.expanduser('~'), '.local', 'uclusion-cli')
UNVERSIONED_DIR_NAMES = ('v1', 'current', 'unversioned', 'bin')

# The wait loop doubles as the update watcher (Q-all-301 O-1): it checks at
# most once per interval across processes, and surfaces each newer release
# exactly once — recorded here so relaunched waits stay silent about it.
UPDATE_CHECK_STATE_FILE = os.path.join(os.path.expanduser('~'), '.uclusion', 'update_check.json')
UPDATE_CHECK_INTERVAL = 900
WORKFLOW_MD_MARKER = '<!-- uclusion-workflow:v1 -->'
CODEX_UCLUSION_TABLE = '[mcp_servers.Uclusion]'


def get_inbox_path():
    return os.path.join(os.path.expanduser('~'), '.uclusion', INBOX_FILE)


def open_inbox():
    """Open the inbox shared by every local AI client for this user."""
    inbox_path = get_inbox_path()
    os.makedirs(os.path.dirname(inbox_path), mode=0o700, exist_ok=True)
    connection = sqlite3.connect(inbox_path, timeout=5)
    connection.execute('PRAGMA busy_timeout = 5000')
    ensure_inbox_schema(connection)
    try:
        os.chmod(inbox_path, 0o600)
    except OSError:
        pass
    return connection


def ensure_inbox_schema(connection):
    """Create or migrate the shared inbox schema (S-all-168 age-out model).

    Prompts are never deleted when read; they persist until the retention
    window expires so every consumer can see every message. ``sequence`` is
    AUTOINCREMENT so per-consumer delivery cursors in ``poke_consumers`` stay
    valid after expired rows are removed. ``consumed_at`` survives only so
    pre-migration tombstones and mixed-version clients keep de-duplicating
    and are not re-delivered; current code never sets it.
    """
    connection.execute('BEGIN IMMEDIATE')
    try:
        columns = [row[1] for row in connection.execute('PRAGMA table_info(poke_messages)')]
        needs_migration = bool(columns) and 'sequence' not in columns
        if needs_migration:
            connection.execute('ALTER TABLE poke_messages RENAME TO poke_messages_v1')
        connection.execute(
            '''
            CREATE TABLE IF NOT EXISTS poke_messages (
                sequence INTEGER PRIMARY KEY AUTOINCREMENT,
                message_id TEXT NOT NULL,
                environment TEXT NOT NULL,
                workspace_id TEXT NOT NULL,
                message TEXT NOT NULL,
                received_at REAL NOT NULL,
                consumed_at REAL,
                UNIQUE (environment, workspace_id, message_id)
            )
            '''
        )
        if needs_migration:
            connection.execute(
                '''
                INSERT INTO poke_messages
                    (message_id, environment, workspace_id, message, received_at, consumed_at)
                SELECT message_id, environment, workspace_id, message, received_at, consumed_at
                FROM poke_messages_v1 ORDER BY received_at, rowid
                '''
            )
            connection.execute('DROP TABLE poke_messages_v1')
        connection.execute(
            '''
            CREATE INDEX IF NOT EXISTS poke_messages_pending
            ON poke_messages(environment, workspace_id, consumed_at, received_at)
            '''
        )
        connection.execute(
            '''
            CREATE TABLE IF NOT EXISTS poke_consumers (
                environment TEXT NOT NULL,
                workspace_id TEXT NOT NULL,
                consumer TEXT NOT NULL,
                last_sequence INTEGER NOT NULL,
                updated_at REAL NOT NULL,
                PRIMARY KEY (environment, workspace_id, consumer)
            )
            '''
        )
        connection.commit()
    except Exception:
        connection.rollback()
        raise


def start_new_consumer_at_arm_time(environment, workspace_id, consumer):
    """Initialize a BRAND-NEW consumer's cursor at the arm-time high-water mark.

    S-all-205: the retained backlog is history a new session cannot act on —
    anything still needing attention is on the agent's find work list — so a
    fresh session cursor starts past it instead of redelivering it (the
    ``--deliver-existing-pokes`` opt-in, Q-all-351 O-1, skips this call). An
    established consumer is untouched: its pending rows were never
    delivered and remain live. The shared default cursor is always exempt:
    for surfaces that drain it at turn start the pending backlog IS the
    live work, even on first-ever use.
    """
    if consumer == DEFAULT_CONSUMER:
        return
    with closing(open_inbox()) as connection:
        row = connection.execute(
            '''
            SELECT last_sequence FROM poke_consumers
            WHERE environment = ? AND workspace_id = ? AND consumer = ?
            ''',
            (environment, workspace_id, consumer)
        ).fetchone()
    if row is None:
        ignore_existing_prompts(environment, workspace_id, consumer)


def next_prompt(environment, workspace_id, consumer):
    """Deliver the oldest prompt past this consumer's cursor (S-all-168).

    Prompts are not removed on delivery — they age out after
    MESSAGE_RETENTION_SECONDS — so every named consumer sees every prompt
    exactly once, in arrival order. Waits sharing one consumer name share
    one cursor, and the atomic advance means each prompt goes to exactly
    one of them. ``consumed_at IS NULL`` skips rows claimed by
    pre-migration clients so mixed versions do not double-deliver.
    """
    now = time.time()
    with closing(open_inbox()) as connection, connection:
        connection.execute('BEGIN IMMEDIATE')
        connection.execute(
            'DELETE FROM poke_messages WHERE received_at < ?',
            (now - MESSAGE_RETENTION_SECONDS,)
        )
        # J-all-379: session cursors idle past the retention window are garbage.
        # Deleting one is semantically safe - every row it claimed has aged out,
        # and a returning consumer counts as brand-new, starting at the current
        # high-water mark (S-all-205).
        connection.execute(
            'DELETE FROM poke_consumers WHERE updated_at < ?',
            (now - MESSAGE_RETENTION_SECONDS,)
        )
        row = connection.execute(
            '''
            SELECT sequence, message
            FROM poke_messages
            WHERE environment = ? AND workspace_id = ? AND consumed_at IS NULL
                AND sequence > COALESCE(
                    (SELECT last_sequence FROM poke_consumers
                     WHERE environment = ? AND workspace_id = ? AND consumer = ?), 0)
            ORDER BY sequence
            LIMIT 1
            ''',
            (environment, workspace_id, environment, workspace_id, consumer)
        ).fetchone()
        if row is None:
            connection.commit()
            return None
        connection.execute(
            '''
            INSERT INTO poke_consumers
                (environment, workspace_id, consumer, last_sequence, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT (environment, workspace_id, consumer)
            DO UPDATE SET last_sequence = excluded.last_sequence,
                updated_at = excluded.updated_at
            ''',
            (environment, workspace_id, consumer, row[0], now)
        )
        connection.commit()
        return row[1]


def ignore_existing_prompts(environment, workspace_id, consumer):
    """Advance ``consumer`` past every prompt already in the inbox (B-all-515).

    The wait/listen counterpart of the Codex bridge launch cutoff (Q-all-328
    O-1): one BEGIN IMMEDIATE transaction reads this environment/workspace's
    high-water sequence and moves only the named consumer's cursor up to it.
    Prompt rows are never deleted, other consumers keep their own cursors,
    and update notices are unaffected because they do not flow through the
    inbox cursor. An enqueue serialized after the transaction gets a larger
    AUTOINCREMENT sequence, so it remains deliverable. The cursor never
    moves backward.
    """
    now = time.time()
    with closing(open_inbox()) as connection, connection:
        connection.execute('BEGIN IMMEDIATE')
        row = connection.execute(
            '''
            SELECT MAX(sequence) FROM poke_messages
            WHERE environment = ? AND workspace_id = ?
            ''',
            (environment, workspace_id)
        ).fetchone()
        high_water = row[0] if row is not None and row[0] is not None else 0
        if high_water:
            connection.execute(
                '''
                INSERT INTO poke_consumers
                    (environment, workspace_id, consumer, last_sequence, updated_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT (environment, workspace_id, consumer)
                DO UPDATE SET
                    last_sequence = MAX(last_sequence, excluded.last_sequence),
                    updated_at = excluded.updated_at
                ''',
                (environment, workspace_id, consumer, high_water, now)
            )
        connection.commit()


# Why the request that just returned None failed, e.g. 'HTTP 504 Gateway
# Timeout' (S-all-174). Callers append it to their failure lines so a piped
# or truncated console still records the cause.
last_send_error = None


def send(data, method, my_api_url, auth=None):
    global last_send_error
    last_send_error = None
    json_data_as_bytes = None
    if data is not None:
        # Encode the data into JSON format
        json_data = json.dumps(data)
        json_data_as_bytes = json_data.encode('utf-8')  # Convert to bytes

    headers = {'Content-Type': 'application/json'}
    if auth is not None:
        headers['Authorization'] = auth

    if json_data_as_bytes is not None:
        req = urllib.request.Request(
            my_api_url,
            data=json_data_as_bytes,
            headers=headers,
            method=method
        )
    else:
        req = urllib.request.Request(
            my_api_url,
            headers=headers,
            method=method
        )

    try:
        # Send the request and get the response
        with urllib.request.urlopen(req) as response:
            # Check the HTTP status code
            if response.status == 200 or response.status == 201:
                # Read and decode the response body
                response_body = response.read().decode('utf-8')
                # If the response is JSON, you can parse it
                response_json = json.loads(response_body)
                return response_json
            else:
                last_send_error = f'HTTP {response.status}'
                print(f"Failed to post data. Status code: {response.status}")
                print(f"Response: {response.read().decode('utf-8')}")

    except urllib.request.HTTPError as e:
        last_send_error = f'HTTP {e.code} {e.reason}'
        print(f"Error making request: {e.reason}")
    except Exception as e:
        last_send_error = str(e)
        print(f"An unexpected error occurred: {e}")


def get_resolved_ticket_codes(credentials):
    ticket_code_api_url = 'https://markets.' + credentials['api_url'] + '/list'
    data = { 'list_type': 'ticket_codes' }
    return send(data, 'POST', ticket_code_api_url, credentials['api_token'])


def get_sentence_aware_ampersand_remove_duplicate(stripped_element, max_length=80):
    description = stripped_element
    extracted = stripped_element or ''
    ends_in_sentence = extracted.endswith('.') or extracted.endswith('!') or extracted.endswith('?')

    if len(extracted) <= max_length and ends_in_sentence:
        return {'name': extracted, 'description': ''}

    # Helper function to find the index or return an 'out of bounds' value
    def index_of_or_out_of_bounds(text, substring):
        try:
            return text.index(substring)
        except ValueError:
            return len(text) + 1 # Represents an "out of bounds" position

    period_position = index_of_or_out_of_bounds(extracted, '. ')
    exclamation_position = index_of_or_out_of_bounds(extracted, '! ')
    question_position = index_of_or_out_of_bounds(extracted, '? ')

    sentence_position = min(period_position, exclamation_position, question_position)

    if sentence_position < len(extracted):
        extracted = extracted[:sentence_position + 1]

    if len(extracted) <= max_length:
        split_description = description[sentence_position + 2:]
        return {'name': extracted, 'description': split_description}

    last_index = extracted.rfind(' ', 0, max_length - 3)
    if last_index < 0:
        last_index = max_length - 3

    extracted = extracted[:last_index]
    split_description = description[3 + len(extracted):]
    if split_description.startswith(' '):
        split_description = split_description[1:]

    return {'name': f'{extracted}...', 'description': split_description}


def send_job(comment_stripped, credentials, is_assign=False, stage=None, is_ready=False):
    create_job_api_url = 'https://investibles.' + credentials['api_url'] + '/create'
    comment_processed = get_sentence_aware_ampersand_remove_duplicate(comment_stripped)
    data = {
        'name': comment_processed['name'],
        'group_id': credentials['view_id']
    }
    if len(comment_processed['description']) > 0:
        data['description'] = f"<p>{comment_processed['description']}</p>"
    if is_assign:
        data['assignments'] = [credentials['user_id']]
    elif is_ready:
        data['open_for_investment'] = True
    if stage is not None:
        data['stage_id'] = stage['id']
    return send(data, 'POST', create_job_api_url, credentials['api_token'])


def process_waiting(comment_stripped, credentials, waiting_stage):
    return send_job(comment_stripped, credentials, True, waiting_stage)


def process_ready(comment_stripped, credentials, ready_stage):
    return send_job(comment_stripped, credentials, True, ready_stage)


def process_backlog_ready(comment_stripped, credentials):
    return send_job(comment_stripped, credentials, False, None, True)


def process_backlog_not_ready(comment_stripped, credentials):
    return send_job(comment_stripped, credentials, False, None, False)


def token_split(token, comment_stripped):
    return comment_stripped[len(token):].strip()


def get_waiting_stage(stages):
    for stage in stages:
        if stage['allows_investment']:
            return stage
    return None


def get_ready_stage(stages):
    for stage in stages:
        if stage['assignee_enter_only']:
            return stage
    return None


def get_readable_ticket_code(ticket_code):
    return urllib.parse.unquote(ticket_code)


def process_job(comment_stripped, credentials, stages):
    comment_stripped_lower = comment_stripped.lower()
    if comment_stripped_lower.startswith('waiting'):
        print(f"  ✅ Creating waiting job")
        job = process_waiting(token_split('waiting', comment_stripped), credentials, get_waiting_stage(stages))
    elif comment_stripped_lower.startswith('ready'):
        print(f"  ✅ Creating ready job")
        job = process_ready(token_split('ready', comment_stripped), credentials, get_ready_stage(stages))
    elif comment_stripped_lower.startswith('backlog_ready'):
        print(f"  ✅ Creating backlog ready job")
        job = process_backlog_ready(token_split('backlog_ready', comment_stripped), credentials)
    elif comment_stripped_lower.startswith('backlog_not_ready'):
        print(f"  ✅ Creating backlog job")
        job = process_backlog_not_ready(token_split('backlog_not_ready', comment_stripped), credentials)
    else:
        print(f"  ✅ Creating backlog job")
        job = process_backlog_not_ready(comment_stripped, credentials)
    return job


def send_bug(notification_type, comment_stripped, credentials):
    create_bug_api_url = 'https://investibles.' + credentials['api_url'] + '/comment'
    data = {
        'group_id': credentials['view_id'],
        'body': f"<p>{comment_stripped}</p>",
        'notification_type': notification_type,
        'comment_type': 'TODO'
    }
    return send(data, 'POST', create_bug_api_url, credentials['api_token'])


def process_bug(comment_stripped, credentials):
    comment_stripped_lower = comment_stripped.lower()
    if comment_stripped_lower.startswith('critical'):
        print(f"  ✅ Creating critical bug")
        bug = send_bug('RED', token_split('critical', comment_stripped), credentials)
    elif comment_stripped_lower.startswith('normal'):
        print(f"  ✅ Creating normal bug")
        bug = send_bug('YELLOW', token_split('normal', comment_stripped), credentials)
    elif comment_stripped_lower.startswith('minor'):
        print(f"  ✅ Creating minor bug")
        bug = send_bug('BLUE', token_split('minor', comment_stripped), credentials)
    else:
        print(f"  ✅ Creating minor bug")
        bug = send_bug('BLUE', comment_stripped, credentials)
    return bug


def send_note(comment_stripped, credentials):
    create_note_api_url = 'https://investibles.' + credentials['api_url'] + '/comment'
    data = {
        'group_id': credentials['view_id'],
        'body': f"<p>{comment_stripped}</p>",
        'comment_type': 'REPORT'
    }
    return send(data, 'POST', create_note_api_url, credentials['api_token'])


def process_note(comment_stripped, credentials):
    print(f"  ✅ Creating note")
    return send_note(comment_stripped, credentials)


def sync_comment(comment, credentials, stages):
    comment_stripped = comment.strip()
    comment_stripped_lower = comment_stripped.lower()
    if comment_stripped_lower.startswith('job'):
        return process_job(token_split('job', comment_stripped), credentials, stages)
    if comment_stripped_lower.startswith('waiting'):
        return process_job(comment_stripped, credentials, stages)
    if comment_stripped_lower.startswith('ready'):
        return process_job(comment_stripped, credentials, stages)
    if comment_stripped_lower.startswith('backlog_ready'):
        return process_job(comment_stripped, credentials, stages)
    if comment_stripped_lower.startswith('backlog_not_ready'):
        return  process_job(comment_stripped, credentials, stages)
    if comment_stripped_lower.startswith('note'):
        return process_note(token_split('note', comment_stripped), credentials)
    if comment_stripped_lower.startswith('bug'):
        bug = process_bug(token_split('bug', comment_stripped), credentials)
    else:
        bug = process_bug(comment_stripped, credentials)
    return bug


def get_credentials(credentials_path):
    """
    Reads credentials from '~/.uclusion/credentials'.

    The file is expected to be in a 'key=value' format. This function
    will look for 'secret_key_id' and 'secret_key'.

    Returns:
        A dictionary with the credentials, or None if the file is not
        found, is invalid, or missing required keys.
    """
    credentials = {}
    # os.path.expanduser('~') correctly finds the user's home directory
    cred_path = os.path.join(os.path.expanduser('~'), '.uclusion', credentials_path)

    if not os.path.exists(cred_path):
        print("🔐 Error: Credentials file not found.")
        return None

    try:
        with open(cred_path, 'r') as f:
            for line in f:
                line = line.strip()
                # Ignore comments and empty lines
                if not line or line.startswith('#'):
                    continue
                # Split by the first '=' to handle values that might contain '='
                if '=' in line:
                    key, value = line.split('=', 1)
                    credentials[key.strip()] = value.strip()
    except Exception as e:
        print(f"   -> ❌ Error reading credentials file: {e}")
        return None

    return credentials


def get_ticket_code(content, credentials):
    if 'ticket_code' in content:
        return content['ticket_code']
    for market_info in content['market_infos']:
        if market_info['market_id'] == credentials['workspace_id']:
            return market_info['ticket_code']
    return None


def get_readable_description(description):
    # remove <p> </p>
    return description[3:-4]


def add_comment_line(comment, credentials):
    return f"{get_readable_ticket_code(get_ticket_code(comment, credentials))} {get_readable_description(comment['body'])}\n"


def add_job_line(full_investible, credentials):
    description = full_investible['investible']['description']
    name = full_investible['investible']['name']
    if description == '':
        combined_description = name
    elif name.endswith('...'):
        combined_description = f"{name[:-3]} {description}"
    else:
        combined_description = f"{name} {description}"
    return f"{get_readable_ticket_code(get_ticket_code(full_investible, credentials))} {get_readable_description(combined_description)}\n"


def get_ticket_code_from_line(line, ticket_type):
    first_split = line.split(ticket_type, 1)
    line_split = first_split[1].split()
    return f"{ticket_type}{line_split[0]}"


def approve_job(credentials, job_short_code, certainty, reason):
    approve_api_url = 'https://investibles.' + credentials['api_url'] + '/cli/' + job_short_code
    data = {
        'certainty': certainty
    }
    if reason is not None:
        data['reason'] = reason
    return send(data, 'PATCH', approve_api_url, credentials['api_token'])


def add_info(credentials, short_code, info, question_short_code=None):
    info_api_url = 'https://investibles.' + credentials['api_url'] + '/cli/' + short_code
    local_tz = datetime.now().astimezone().tzinfo
    data = {
        'body': info,
        'tz': local_tz.tzname(None)
    }
    if question_short_code is not None:
        data['parent_question_short_code_id'] = question_short_code
    return send(data, 'POST', info_api_url, credentials['api_token'])


def resolve(credentials, short_code, stage_id):
    resolve_api_url = 'https://investibles.' + credentials['api_url'] + '/cli/' + short_code
    data = {
        'stage_id': stage_id
    }
    return send(data, 'PATCH', resolve_api_url, credentials['api_token'])


def add_question(credentials, job_short_code, question, options):
    question_api_url = 'https://investibles.' + credentials['api_url'] + '/cli/' + job_short_code
    data = {
        'body': question,
        'is_question': True
    }
    if len(options) > 0:
        processed_options = []
        for option in options:
            processed_options.append({
                'name': option[0],
                'description': option[1]
            })
        data['options'] = processed_options
    return send(data, 'POST', question_api_url, credentials['api_token'])


def add_options(credentials, question_short_code, options):
    question_api_url = 'https://investibles.' + credentials['api_url'] + '/cli/' + question_short_code
    processed_options = []
    for option in options:
        processed_options.append({
            'name': option[0],
            'description': option[1]
        })
    data = {
        'options': processed_options
    } 
    return send(data, 'POST', question_api_url, credentials['api_token'])


def add_report(credentials, job_short_code, report):
    report_api_url = 'https://investibles.' + credentials['api_url'] + '/cli/' + job_short_code
    data = {
        'body': report,
        'is_review': True
    }
    return send(data, 'POST', report_api_url, credentials['api_token'])


def add_suggestion(credentials, job_short_code, suggestion):
    suggestion_api_url = 'https://investibles.' + credentials['api_url'] + '/cli/' + job_short_code
    data = {
        'body': suggestion,
        'is_question': False
    }
    return send(data, 'POST', suggestion_api_url, credentials['api_token'])


EXPORT_SEPARATOR = '<br/><br/>\n***\n'
EXPORT_MARKER_RE = re.compile(r'^<!-- uclusion:(marketInvestible|comment):([^:]+):([^ ]+) -->\n',
                              re.MULTILINE)
# Bump when the server-side markdown rendering changes shape (J-all-376 added
# dates); a mismatch discards cached sections so stamps alone cannot pin stale
# renderings in the file forever.
EXPORT_FORMAT_VERSION = '2'
EXPORT_FORMAT_MARKER = f'<!-- uclusion:format:{EXPORT_FORMAT_VERSION} -->\n'
# The legend ships with the format version because it describes what that
# version's rendering means - the file must decode itself for an AI reading it
# standalone (J-all-376).
EXPORT_LEGEND = ('<!-- uclusion-export-legend: "(updated YYYY-MM-DD)" on a job, comment, reply, or vote '
                 'line is the day (UTC) that item last changed; new items show their creation day. An item '
                 'without the annotation has no recorded update time. Use these dates to answer questions '
                 'about recent changes. -->\n')


def make_export_marker(id_type, an_id, stamp):
    return f'<!-- uclusion:{id_type}:{an_id}:{stamp} -->\n'


def parse_export_sections(file_path):
    """Reads a marker-formatted export into {(id_type, id): (stamp, section_text)}.

    Returns None when the file is absent or holds no markers (legacy blob or first run)."""
    if file_path is None:
        return None
    try:
        with open(file_path, 'r', encoding='utf-8') as export_file:
            content = export_file.read()
    except OSError:
        return None
    if EXPORT_FORMAT_MARKER not in content[:1024]:
        # Older format version (or none): rebuild everything rather than reuse
        # sections rendered the old way.
        return None
    matches = list(EXPORT_MARKER_RE.finditer(content))
    if not matches:
        return None
    sections = {}
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(content)
        text = content[match.end():end]
        # The group separator is written between the investible and comment groups on
        # assembly, so it cannot stay glued to a reused section
        if text.endswith(EXPORT_SEPARATOR):
            text = text[:-len(EXPORT_SEPARATOR)]
        sections[(match.group(1), match.group(2))] = (match.group(3), text)
    return sections


def fetch_export_batch(export_api_url, id_type, ids, credentials, failed_ids):
    full_export_api_url = export_api_url + f'?idType={id_type}&id=' + '&id='.join(ids)
    batch_content = send(None, 'GET', full_export_api_url, credentials['api_token'])
    if batch_content is not None:
        return batch_content
    # One object the back end cannot render fails its whole batch, so retry
    # one at a time and collect the bad ids instead of losing the export.
    content = ''
    for an_id in ids:
        single = send(None, 'GET', f'{export_api_url}?idType={id_type}&id={an_id}',
                      credentials['api_token'])
        if single is None:
            failed_ids.append(f'{id_type}:{an_id}')
        else:
            content += single
    return content


def fetch_export_sections(export_api_url, id_type, ids, credentials, failed_ids):
    """Fetches changed sections as {id: (stamp, markdown)} via format=json, falling back to
    per-id fetches when a batch fails so one bad object cannot lose the run. Requested ids
    absent from a successful response also count as failed so sections never drop silently."""
    fetched = {}
    for batch in batched(ids, 20):
        url = f'{export_api_url}?format=json&idType={id_type}&id=' + '&id='.join(batch)
        got = send(None, 'GET', url, credentials['api_token'])
        if got is None:
            for an_id in batch:
                single = send(None, 'GET', f'{export_api_url}?format=json&idType={id_type}&id={an_id}',
                              credentials['api_token'])
                if single is None:
                    failed_ids.append(f'{id_type}:{an_id}')
                else:
                    for item in single:
                        fetched[item['id']] = (item['stamp'], item['markdown'])
        else:
            for item in got:
                fetched[item['id']] = (item['stamp'], item['markdown'])
    for an_id in ids:
        if an_id not in fetched and f'{id_type}:{an_id}' not in failed_ids:
            failed_ids.append(f'{id_type}:{an_id}')
    return fetched


def build_incremental_export(credentials, list_response, existing_sections, failed_ids, stale_ids):
    export_api_url = 'https://summaries.' + credentials['api_url'] + '/export'
    existing_sections = existing_sections or {}
    listed = (('marketInvestible', list_response['market_investibles']),
              ('comment', list_response['comments']))
    parts_by_type = {'marketInvestible': [], 'comment': []}
    for id_type, entries in listed:
        changed_ids = [entry['id'] for entry in entries
                       if existing_sections.get((id_type, entry['id']), (None,))[0] != entry['stamp']]
        fetched = fetch_export_sections(export_api_url, id_type, changed_ids, credentials, failed_ids)
        for entry in entries:
            an_id = entry['id']
            if an_id in fetched:
                stamp, markdown = fetched[an_id]
                parts_by_type[id_type].append(make_export_marker(id_type, an_id, stamp) + markdown)
            else:
                old = existing_sections.get((id_type, an_id))
                if old is None:
                    # fetch failed with nothing to reuse - already recorded in failed_ids
                    continue
                old_stamp, old_text = old
                if old_stamp != entry['stamp']:
                    # fetch failed but an out of date copy exists - keeping it beats dropping it
                    stale_ids.append(f'{id_type}:{an_id}')
                    if f'{id_type}:{an_id}' in failed_ids:
                        failed_ids.remove(f'{id_type}:{an_id}')
                parts_by_type[id_type].append(make_export_marker(id_type, an_id, old_stamp) + old_text)
    return ''.join(parts_by_type['marketInvestible']) + EXPORT_SEPARATOR + ''.join(parts_by_type['comment'])


def fetch_workspace_export(credentials, file_path=None):
    export_list_api_url = 'https://summaries.' + credentials['api_url'] + '/export_list'
    # Unlike the per-id section fetches this opening call has no fallback, so
    # a transient failure here would abort the whole export (S-all-174).
    response = None
    for attempt in range(3):
        if attempt > 0:
            print(f"  ⚠️ export_list failed ({last_send_error}); retrying...")
            time.sleep(attempt)
        response = send(None, 'GET', export_list_api_url, credentials['api_token'])
        if response is not None:
            break
    if response is None:
        return None
    failed_ids = []
    stale_ids = []
    existing_sections = parse_export_sections(file_path)
    new_file_content = build_incremental_export(credentials, response, existing_sections,
                                                failed_ids, stale_ids)
    warnings = ''
    if failed_ids:
        print(f"  ⚠️ {len(failed_ids)} objects failed to export and are missing from the file:")
        print(f"     {', '.join(failed_ids)}")
        warnings += (f"<!-- uclusion-export-warning: {len(failed_ids)} objects failed to export "
                     f"and are missing from this file: {', '.join(failed_ids)} -->\n")
    if stale_ids:
        print(f"  ⚠️ {len(stale_ids)} objects failed to export; their sections are out of date:")
        print(f"     {', '.join(stale_ids)}")
        warnings += (f"<!-- uclusion-export-warning: {len(stale_ids)} objects failed to export "
                     f"and their sections are out of date: {', '.join(stale_ids)} -->\n")
    return EXPORT_FORMAT_MARKER + EXPORT_LEGEND + warnings + new_file_content


def get_workspace_export_destination(config, credentials):
    """Returns (file_path, create_folder) for a workspace export.

    New configurations name an export folder and the CLI gives each workspace
    its own markdown file. Existing export configurations that name a complete
    file path keep working so upgrading the CLI does not abandon their
    incremental-export markers.
    """
    folder_path = config.get('uclusionMDFolderPath')
    if folder_path is not None:
        expanded_folder = os.path.expanduser(folder_path)
        return os.path.join(expanded_folder, f"{credentials['workspace_id']}.md"), True
    if config.get('uclusionMDFileType') == 'export':
        legacy_file_path = config.get('uclusionMDFilePath')
        if legacy_file_path is not None:
            return legacy_file_path, False
    return os.path.join(DEFAULT_EXPORT_FOLDER, f"{credentials['workspace_id']}.md"), True


def write_uclusion_md(config, credentials, short_code_id, job_report_path='job_report.md'):
    if short_code_id is not None:
        file_path = job_report_path if job_report_path is not None else 'job_report.md'
        report_api_url = 'https://investibles.' + credentials['api_url'] + '/cli_report/' + short_code_id
        new_file_content = send(None, 'GET', report_api_url, credentials['api_token'])
    else:
        file_type = config.get('uclusionMDFileType')
        create_export_folder = False
        if file_type == 'export':
            file_path, create_export_folder = get_workspace_export_destination(config, credentials)
        else:
            file_path = config.get('uclusionMDFilePath')
        print(f"  ✅ Processing: '{file_path}'")
        if file_type == 'export':
            new_file_content = fetch_workspace_export(credentials, file_path)
        else:
            report_api_url = 'https://summaries.' + credentials['api_url'] + '/report'
            new_file_content = send(None, 'GET', report_api_url, credentials['api_token'])
    if new_file_content is None:
        print(f"     -> ❌ Fetch failed ({last_send_error or 'unknown error'}); not writing '{file_path}'")
        return
    try:
        if short_code_id is None and create_export_folder:
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w', encoding='utf-8') as uclusion_file:
            uclusion_file.write(new_file_content)
    except Exception as e:
        print(f"     -> ❌ For: {new_file_content}")
        print(f"     -> ❌ Error processing file: {e} with path: {file_path}")


def is_todo(text: str, extension: str) -> bool:
    """
    Checks if a given string is a TO-DO comment in the language associated
    with the provided file extension.

    This function supports single-line and common multi-line comment
    starters for a variety of popular programming languages.

    Args:
        text: The line of text to check.
        extension: The file extension (e.g., '.py', '.js', '.html') which
                   determines the comment syntax to look for.

    Returns:
        True if the string is identified as a TO-DO comment for the specified
        language, False otherwise.
    """
    # Dictionary mapping file extensions to their comment regex patterns.
    # The patterns look for the start of a line (after optional whitespace),
    # the comment syntax, and the case-insensitive.
    comment_patterns = {
        # Scripting languages using '#'
        '.py': r'^\s*#\s*TODO',
        '.rb': r'^\s*#\s*TODO',
        '.sh': r'^\s*#\s*TODO',
        '.pl': r'^\s*#\s*TODO',

        # C-style languages using '//' or '/*'
        '.js': r'^\s*(//|/\*)\s*TODO',
        '.ts': r'^\s*(//|/\*)\s*TODO',
        '.java': r'^\s*(//|/\*)\s*TODO',
        '.c': r'^\s*(//|/\*)\s*TODO',
        '.cpp': r'^\s*(//|/\*)\s*TODO',
        '.cs': r'^\s*(//|/\*)\s*TODO',
        '.go': r'^\s*(//|/\*)\s*TODO',
        '.rs': r'^\s*(//|/\*)\s*TODO',
        '.swift': r'^\s*(//|/\*)\s*TODO',
        '.kt': r'^\s*(//|/\*)\s*TODO',
        '.php': r'^\s*(//|#|/\*)\s*TODO', # PHP supports //, # and /*

        # HTML/XML/CSS
        '.html': r'^\s*<!--\s*TODO',
        '.xml': r'^\s*<!--\s*TODO',
        '.css': r'^\s*/\*\s*TODO',
        '.scss': r'^\s*(//|/\*)\s*TODO',

        # Lisp-style languages
        '.lisp': r'^\s*;\s*TODO',
        '.clj': r'^\s*;\s*TODO',
    }

    # Get the pattern for the given extension, case-insensitively.
    pattern = comment_patterns.get(extension.lower())

    # If the extension is not supported in our dictionary, it's not a TO-DO.
    if not pattern:
        return False

    # Use re.match to check if the beginning of the stripped string
    # matches the pattern. re.IGNORECASE makes case-insensitive
    return bool(re.match(pattern, text.strip(), re.IGNORECASE))


def get_description(content):
    if 'body' in content:
        return content['body']
    return content['investible']['description']


def get_new_todo_line(context):
    line = context['line']
    pipe_index = line.find('|')
    # replace from | to start of description with ticket_code
    # Ignore windows \r because it messes up when commit to GitHub
    return line[:pipe_index] + get_readable_ticket_code(context['ticket_code']) + ' ' + context['description'] + "\n"


def get_done_line(context):
    print(f"  ✅ Marking {context['ticket_code']} DONE")
    line = context['line']
    todo_index = line.find('TODO')
    return line[:todo_index] + 'DONE' + line[todo_index + 4:]


# Block comments are the only multi-line TODO format supported. Languages with
# only single-line comments (#, ;) stay single-line because there is no
# terminator to tell an intended continuation from an unrelated comment.
BLOCK_COMMENT_CLOSERS = {'/*': '*/', '<!--': '-->'}


def get_block_comment_closer(line):
    """Returns the closing marker if this TODO line opens a block comment,
    otherwise None."""
    stripped = line.strip()
    for opener, closer in BLOCK_COMMENT_CLOSERS.items():
        if stripped.startswith(opener):
            return closer
    return None


def gather_block_comment(all_lines, start_line_number, closer):
    """Collects continuation lines of a block comment until the closing marker.

    A leading '*' on a continuation line (javadoc style) is stripped. Returns
    (extra_text, last_line_number) where last_line_number is the line holding
    the closing marker (or the last line of the file if never closed).
    """
    parts = []
    line_number = start_line_number + 1
    while line_number < len(all_lines):
        stripped = all_lines[line_number].strip()
        closed = closer in stripped
        if closed:
            stripped = stripped[:stripped.index(closer)].strip()
        if closer == '*/' and stripped.startswith('*'):
            stripped = stripped[1:].strip()
        if stripped:
            parts.append(stripped)
        if closed:
            break
        line_number += 1
    return ' '.join(parts), min(line_number, len(all_lines) - 1)


def process_code_file(root, file, extension, credentials, stages, resolved_ticket_codes):
    file_path = os.path.join(root, file)
    try:
        with open(file_path, 'r+', encoding='utf-8') as code_file:
            line_contexts = []
            all_lines = code_file.readlines()
            line_number = 0
            while line_number < len(all_lines):
                line = all_lines[line_number]
                if is_todo(line, extension):
                    # TODO J-all-214 this split will not work with multi-line comments
                    line_split = line.split('|', 1)
                    if len(line_split) > 1:
                        todo, comment = line_split
                        closer = get_block_comment_closer(line)
                        if closer is None:
                            new_content = sync_comment(comment, credentials, stages)
                            description = get_description(new_content)
                            ticket_code = get_ticket_code(new_content, credentials)
                            line_context = {'ticket_code': ticket_code, 'description': description[3: -4],
                                            'line_number': line_number, 'line': line}
                            line_contexts.append(line_context)
                        else:
                            # Block comment: send the full text but rewrite only the
                            # first line so the block structure stays intact in the file
                            first_line_text = comment.strip('\n')
                            if closer in comment:
                                comment = comment[:comment.index(closer)]
                                end_line_number = line_number
                            else:
                                extra_text, end_line_number = gather_block_comment(all_lines, line_number, closer)
                                if extra_text:
                                    comment = f"{comment.strip()} {extra_text}"
                            new_content = sync_comment(comment, credentials, stages)
                            ticket_code = get_ticket_code(new_content, credentials)
                            line_context = {'ticket_code': ticket_code,
                                            'description': first_line_text.strip(),
                                            'line_number': line_number, 'line': line}
                            line_contexts.append(line_context)
                            line_number = end_line_number
                    elif 'J-' in line or 'B-' in line:
                        if 'J-' in line:
                            ticket_code = get_ticket_code_from_line(line, 'J-')
                        elif 'B-' in line:
                            ticket_code = get_ticket_code_from_line(line, 'B-')
                        if ticket_code in resolved_ticket_codes:
                            line_context = {'ticket_code': ticket_code, 'is_done': True,
                                            'line_number': line_number, 'line': line}
                            line_contexts.append(line_context)
                line_number += 1
            code_file.seek(0)
            for line_context in line_contexts:
                if 'is_done' in line_context:
                    all_lines[line_context['line_number']] = get_done_line(line_context)
                else:
                    all_lines[line_context['line_number']] = get_new_todo_line(line_context)
            if len(line_contexts) > 0:
                code_file.writelines(all_lines)
    except Exception as e:
        print(f"     -> ❌ Error reading file {file}: {e}")
        traceback.print_exc() 


def login(credentials):
    login_api_url = 'https://sso.' + credentials['api_url'] + '/cli'
    data = {
        'market_id': credentials['workspace_id'],
        'client_secret': credentials['secret_key'],
        'client_id': credentials['secret_key_id']
    }
    return send(data, 'POST', login_api_url)


def process_source_directories(stages, config, credentials):
    """
    Reads source directories from a JSON config, recursively finds all TARGET_FILENAME files
    """
    print(f"🚀 Starting search for TODOs...")

    source_dirs = config.get('sourcesList', [])
    if not source_dirs:
        print(f"⚠️ Warning: No source directories listed in config.")
        return None
    extensions = config.get('extensionsList', [])
    if not extensions:
        print(f"⚠️ Warning: No extensions listed in config.")
        return None

    resolved_ticket_codes = get_resolved_ticket_codes(credentials)
    if resolved_ticket_codes is None:
        resolved_ticket_codes = []

    # Process each source directory
    total_code_files_found = 0
    for directory in source_dirs:
        print(f"\n📁 Processing directory: '{directory}'")

        if not os.path.isdir(directory):
            print(f"   -> Skipping: Directory does not exist.")
            continue

        # Recursively walk the directory tree
        for root, _, files in os.walk(directory):
            for file in files:
                file_name, file_extension = os.path.splitext(file)
                if len(file_extension) > 1 and file_extension[1:] in extensions:
                    total_code_files_found += 1
                    process_code_file(root, file, file_extension, credentials, stages, resolved_ticket_codes)

    print(f"\n🏁 Processed {total_code_files_found} code files.")
    return None


def get_env_paths(env):
    """Returns (api_url, config_path, credentials_path) for the given environment name."""
    if env == 'dev':
        return DEV_API_URL, DEV_SOURCES_CONFIG_FILE, DEV_CREDENTIALS_FILE
    if env == 'stage':
        return STAGE_API_URL, STAGE_SOURCES_CONFIG_FILE, STAGE_CREDENTIALS_FILE
    return PRODUCTION_API_URL, SOURCES_CONFIG_FILE, CREDENTIALS_FILE


def load_config(json_path):
    # Prefer a project-local config in the current directory (written by a
    # project-level install) so `uclusion` run inside a project uses that
    # project's sources/report settings; fall back to the user-global
    # ~/.uclusion copy. Credentials always stay user-global (see get_credentials).
    local_path = os.path.join(os.getcwd(), json_path)
    config_path = local_path if os.path.exists(local_path) else \
        os.path.join(os.path.expanduser('~'), '.uclusion', json_path)
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"❌ Error: Configuration file '{config_path}' not found.")
    except json.JSONDecodeError as error:
        print(f"❌ Error: Could not parse JSON from '{config_path}':")
        print(error)
    return None


def initialize(env):
    """Loads credentials & config, performs login, and returns (credentials, config, stages).

    Returns None if any step fails so callers can exit cleanly.
    """
    api_url, json_path, credentials_path = get_env_paths(env)

    credentials = get_credentials(credentials_path)
    if credentials is None:
        return None

    config = load_config(json_path)
    if config is None:
        return None

    secret_key = credentials.get('secret_key')
    secret_key_id = credentials.get('secret_key_id')
    if secret_key is None:
        print("   -> ❌ Error: 'secret_key' not found in credentials file.")
        return None
    if secret_key_id is None:
        print("   -> ❌ Error: 'secret_key_id' not found in credentials file.")
        return None

    workspace_id = config.get('workspaceId')
    if workspace_id is None:
        print(f"⚠️ Warning: No workspaceId in config.")
        return None

    view_id = config.get('todoViewId') or workspace_id

    credentials['view_id'] = view_id
    credentials['workspace_id'] = workspace_id
    credentials['api_url'] = api_url

    response = login(credentials)
    if response is None or 'uclusion_token' not in response:
        print("   -> ❌ Error: login failed.")
        return None

    credentials['api_token'] = response['uclusion_token']
    credentials['ui_url'] = response['ui_url']
    credentials['user_id'] = response['user_id']

    return credentials, config, response['stages']


def cmd_sync(args):
    result = initialize(args.env)
    if result is None:
        return 1
    credentials, config, stages = result
    write_uclusion_md(config, credentials, None, None)
    process_source_directories(stages, config, credentials)
    return 0


def cmd_export(args):
    result = initialize(args.env)
    if result is None:
        return 1
    credentials, config, _stages = result
    create_export_folder = False
    if args.output is not None:
        file_path = args.output
    else:
        file_path, create_export_folder = get_workspace_export_destination(config, credentials)
    new_file_content = fetch_workspace_export(credentials, file_path)
    if new_file_content is None:
        print(f"     -> ❌ Fetch failed ({last_send_error or 'unknown error'}); not writing '{file_path}'")
        return 1
    try:
        if create_export_folder:
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w', encoding='utf-8') as uclusion_file:
            uclusion_file.write(new_file_content)
        print(f"  ✅ Wrote workspace export to '{file_path}'")
    except Exception as e:
        print(f"     -> ❌ Error writing export: {e} with path: {file_path}")
        return 1
    return 0


def stop_codex_child(process):
    """Terminate a managed launcher child, then reap it."""
    if process is None:
        return
    if process.poll() is None:
        process.terminate()
        try:
            process.wait(timeout=CODEX_CHILD_SHUTDOWN_TIMEOUT)
            return
        except subprocess.TimeoutExpired:
            process.kill()
    process.wait()


def stop_codex_children(*processes):
    """Best-effort cleanup that never lets one broken child skip the others."""
    for process in processes:
        try:
            stop_codex_child(process)
        except Exception as error:
            print(
                f"⚠️  Could not fully stop a Codex launcher child: {error}",
                file=sys.stderr,
            )


class CodexAppServerDiagnostics:
    """Drain private app-server output without letting it reach the TUI.

    Codex writes tracing to the app-server's inherited terminal even though
    its protocol uses the Unix socket. Those writes can interleave with a TUI
    redraw and leave fragments such as a bare timestamp and ``ERROR`` on the
    user's screen. Continuously draining a combined stdout/stderr pipe avoids
    both terminal corruption and child-process backpressure. Only a bounded
    in-memory tail is retained; it is never written to disk.
    """

    def __init__(
        self,
        stream,
        max_bytes=CODEX_APP_SERVER_DIAGNOSTIC_BYTES,
    ):
        self.stream = stream
        self.max_bytes = max(1, int(max_bytes))
        self._tail = bytearray()
        self._truncated = False
        self._lock = threading.Lock()
        self._done = threading.Event()
        self._thread = None
        if stream is None:
            self._done.set()
            return
        self._thread = threading.Thread(
            target=self._drain,
            name='uclusion-codex-app-server-diagnostics',
            daemon=True,
        )
        self._thread.start()

    def _drain(self):
        try:
            while True:
                chunk = self.stream.read(4096)
                if not chunk:
                    break
                if isinstance(chunk, str):
                    chunk = chunk.encode('utf-8', errors='replace')
                with self._lock:
                    self._tail.extend(chunk)
                    overflow = len(self._tail) - self.max_bytes
                    if overflow > 0:
                        del self._tail[:overflow]
                        self._truncated = True
        except (OSError, ValueError):
            # Cleanup can close the pipe while the daemon reader is blocked.
            pass
        finally:
            self._done.set()

    def wait_for_eof(self, timeout=CODEX_APP_SERVER_DIAGNOSTIC_DRAIN_TIMEOUT):
        """Give an exited child a bounded window to flush its pipe."""
        self._done.wait(timeout)

    def lines(self, wait_for_eof=False):
        """Return a terminal-safe, display-bounded tail and truncation flag."""
        if wait_for_eof:
            self.wait_for_eof()
        with self._lock:
            raw = bytes(self._tail)
            truncated = self._truncated
        text = raw.decode('utf-8', errors='replace')
        # Strip ANSI/terminal control sequences so even abnormal-exit output
        # cannot manipulate the launcher's terminal.
        text = re.sub(r'\x1b\[[0-?]*[ -/]*[@-~]', '', text)
        text = ''.join(
            character
            if character in ('\n', '\t') or character.isprintable()
            else '\ufffd'
            for character in text
        )
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        if truncated and len(lines) > 1:
            # The first retained line may start midway through a message.
            lines = lines[1:]
        lines = lines[-CODEX_APP_SERVER_DIAGNOSTIC_LINES:]
        bounded = []
        for line in lines:
            if len(line) > CODEX_APP_SERVER_DIAGNOSTIC_LINE_CHARS:
                line = '\u2026' + line[-(
                    CODEX_APP_SERVER_DIAGNOSTIC_LINE_CHARS - 1
                ):]
            bounded.append(line)
        return bounded, truncated

    def close(self):
        """Release the pipe after the managed child has been stopped."""
        self.wait_for_eof()
        if not self._done.is_set() and self.stream is not None:
            try:
                self.stream.close()
            except (OSError, ValueError):
                pass
        if self._thread is not None:
            self._thread.join(CODEX_APP_SERVER_DIAGNOSTIC_DRAIN_TIMEOUT)
        if self.stream is not None:
            try:
                self.stream.close()
            except (OSError, ValueError):
                pass


def print_app_server_diagnostics(diagnostics, wait_for_eof=False):
    """Print a private child tail only when launch supervision needs it."""
    if diagnostics is None:
        return
    lines, truncated = diagnostics.lines(wait_for_eof=wait_for_eof)
    if not lines:
        return
    qualifier = ' (tail truncated)' if truncated else ''
    print(
        'Private app-server diagnostic tail{}:'.format(qualifier),
        file=sys.stderr,
    )
    for line in lines:
        print('  ' + line, file=sys.stderr)


@contextmanager
def codex_shutdown_signals():
    """Turn launcher termination signals into orderly child cleanup."""
    state = {"signum": None}
    previous = {}

    def request_shutdown(signum, _frame):
        state["signum"] = signum

    for signum in filter(
        None, (getattr(signal, "SIGTERM", None), getattr(signal, "SIGHUP", None))
    ):
        try:
            previous[signum] = signal.getsignal(signum)
            signal.signal(signum, request_shutdown)
        except ValueError:
            # Signal handlers can only be installed from the main thread.
            continue
    try:
        yield state
    finally:
        for signum, handler in previous.items():
            signal.signal(signum, handler)


def codex_signal_exit_code(shutdown_state):
    signum = shutdown_state.get("signum")
    return None if signum is None else 128 + int(signum)


def print_bridge_exit_error(returncode):
    if returncode == 3:
        print(
            "❌ The Uclusion Codex bridge exited before the Codex TUI because "
            "another launcher already owns this environment and workspace.",
            file=sys.stderr,
        )
    elif returncode == CODEX_BRIDGE_RELAY_FAILED_EXIT:
        print(
            "❌ The Uclusion Codex relay could not establish a safe private "
            "Codex connection. Run `uclusion update`, then retry "
            "`uclusion codex`.",
            file=sys.stderr,
        )
    else:
        print(
            "❌ The Uclusion Codex bridge exited unexpectedly with status "
            f"{returncode} before the Codex TUI exited. The Codex TUI was stopped.",
            file=sys.stderr,
        )


def print_app_server_exit_error(returncode, diagnostics=None):
    print(
        "❌ The private Codex app-server exited unexpectedly with status "
        f"{returncode} before the Codex TUI exited. The Codex TUI was stopped.",
        file=sys.stderr,
    )
    print_app_server_diagnostics(diagnostics, wait_for_eof=True)


def is_unix_socket(path):
    """Return whether ``path`` currently names a Unix-domain socket."""
    try:
        return stat.S_ISSOCK(os.stat(path).st_mode)
    except OSError:
        return False


def wait_for_app_server_socket(
    app_server, socket_path, should_stop=lambda: False
):
    """Wait until the private app-server binds its Unix socket.

    Returns ``(True, None)`` when ready, ``(False, status)`` if the child
    exits, and ``(False, None)`` on timeout.
    """
    deadline = time.monotonic() + CODEX_APP_SERVER_START_TIMEOUT
    while True:
        if should_stop():
            return False, None
        returncode = app_server.poll()
        if returncode is not None:
            return False, returncode
        if is_unix_socket(socket_path):
            return True, None
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            return False, None
        time.sleep(min(CODEX_CHILD_POLL_INTERVAL, remaining))


def wait_for_bridge_ready(
    bridge,
    app_server,
    ready_file,
    expected_instance,
    frontend_socket_path,
    should_stop=lambda: False,
):
    """Wait for the initialized backend driver and bound frontend relay.

    Returns ``(True, None, None)`` when ready. Otherwise the second value is
    ``bridge`` or ``app-server`` with its exit status, ``invalid`` for a bad
    private marker, or ``None`` on timeout/shutdown.
    """
    deadline = time.monotonic() + CODEX_BRIDGE_READY_TIMEOUT
    while True:
        if should_stop():
            return False, None, None
        bridge_returncode = bridge.poll()
        if bridge_returncode is not None:
            return False, 'bridge', bridge_returncode
        app_server_returncode = app_server.poll()
        if app_server_returncode is not None:
            return False, 'app-server', app_server_returncode
        try:
            with open(ready_file, 'r', encoding='utf-8') as marker:
                value = marker.read(256)
        except FileNotFoundError:
            value = None
        except (OSError, UnicodeError):
            return False, 'invalid', None
        if value is not None:
            if value.strip() == expected_instance:
                if is_unix_socket(frontend_socket_path):
                    return True, None, None
                return False, 'invalid', None
            return False, 'invalid', None
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            return False, None, None
        time.sleep(min(CODEX_CHILD_POLL_INTERVAL, remaining))


def write_codex_receiver_file(path, instance, pid):
    """Register the one visible TUI in the launcher's private runtime dir."""
    if not isinstance(pid, int) or pid <= 1:
        raise OSError(f'invalid Codex TUI pid: {pid!r}')
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
    if hasattr(os, 'O_NOFOLLOW'):
        flags |= os.O_NOFOLLOW
    descriptor = os.open(path, flags, 0o600)
    payload = f'{instance} {pid}\n'.encode('utf-8')
    try:
        offset = 0
        while offset < len(payload):
            written = os.write(descriptor, payload[offset:])
            if written <= 0:
                raise OSError('receiver marker write made no progress')
            offset += written
        os.fsync(descriptor)
    except Exception:
        try:
            os.unlink(path)
        except OSError:
            pass
        raise
    finally:
        os.close(descriptor)


def codex_receiver_liveness_supported():
    """Whether the bridge can distinguish a live TUI from a zombie PID."""
    if sys.platform.startswith('linux'):
        return hasattr(os, 'pidfd_open') or os.path.isdir('/proc')
    return (
        sys.platform == 'darwin'
        and hasattr(select, 'kqueue')
        and hasattr(select, 'KQ_FILTER_PROC')
        and hasattr(select, 'KQ_NOTE_EXIT')
    )


def codex_token_audit_settings(config, workspace_id):
    """Normalize the persisted token-audit preference for Codex launch."""
    value = config.get('tokenAudit') if isinstance(config, dict) else None
    if isinstance(value, dict):
        enabled = value.get('enabled') is True
        port = value.get('port')
    else:
        # Older experimental configs used a scalar. Preserve an explicit
        # truthy opt-in while the installer migrates it to the object shape.
        enabled = bool(value)
        port = None
    if not enabled:
        return None
    if (
        not isinstance(port, int)
        or isinstance(port, bool)
        or not 1024 <= port <= 65535
    ):
        digest = hashlib.sha256(str(workspace_id).encode('utf-8')).digest()
        port = TOKEN_AUDIT_DEFAULT_PORT_BASE + (
            int.from_bytes(digest[:4], 'big') % TOKEN_AUDIT_PORT_SPAN
        )
    return {'enabled': True, 'port': port}


def build_codex_mcp_overrides(
    workspace_id,
    environment,
    proxy_path=UCLUSION_MCP_PROXY_SYMLINK,
    token_audit=None,
    token_audit_ready_file=None,
    token_audit_owner=None,
):
    """Build a complete per-launch Uclusion MCP table as Codex ``-c`` args."""
    proxy_args = [
        proxy_path,
        str(workspace_id),
        environment,
    ]
    if token_audit is not None:
        if not token_audit_ready_file or not token_audit_owner:
            raise ValueError(
                'Codex token audit requires a launch-scoped readiness marker'
            )
        proxy_args.extend([
            '--token-audit',
            '--token-audit-port', str(token_audit['port']),
            '--token-audit-source', 'codex',
            '--token-audit-ready-file', str(token_audit_ready_file),
            '--token-audit-owner', str(token_audit_owner),
        ])
    inline_table = (
        '{ enabled = true, command = '
        + json.dumps("python3")
        + ', args = '
        + json.dumps(proxy_args)
        + ', default_tools_approval_mode = '
        + json.dumps("approve")
        + ' }'
    )
    return [
        '-c',
        'mcp_servers.Uclusion=' + inline_table,
    ]


def resolve_codex_companion_paths():
    """Pin the bridge and proxy to one immutable release beside this CLI."""
    cli_bin_dir = os.path.dirname(
        os.path.realpath(os.path.abspath(__file__))
    )
    sibling_bridge = os.path.join(cli_bin_dir, "uclusionCodexBridge.py")
    sibling_proxy = os.path.join(cli_bin_dir, "uclusionMCPProxy.py")
    if os.path.isfile(sibling_bridge) and os.path.isfile(sibling_proxy):
        return sibling_bridge, sibling_proxy

    public_paths = (CODEX_BRIDGE_SYMLINK, UCLUSION_MCP_PROXY_SYMLINK)
    for path in public_paths:
        if not os.path.islink(path) or not os.path.exists(path):
            raise RuntimeError(
                "the Uclusion bridge/proxy release is incomplete; "
                "run `uclusion update`"
            )
    resolved = tuple(os.path.realpath(path) for path in public_paths)
    if len({os.path.dirname(path) for path in resolved}) != 1:
        raise RuntimeError(
            "the Uclusion bridge and MCP proxy come from different releases; "
            "run `uclusion update`"
        )
    return resolved


def stage_codex_companions(
    runtime_dir,
    cli_source,
    bridge_source,
    proxy_source,
    token_audit_required=False,
):
    """Copy one validated release into this launch's private lifetime."""
    staging_dir = os.path.join(runtime_dir, 'bin')
    staged_cli = os.path.join(staging_dir, 'uclusion.py')
    staged_bridge = os.path.join(staging_dir, 'uclusionCodexBridge.py')
    staged_proxy = os.path.join(staging_dir, 'uclusionMCPProxy.py')
    token_audit_source = os.path.join(
        os.path.dirname(os.path.realpath(bridge_source)),
        'uclusionTokenAudit.py',
    )
    staged_token_audit = os.path.join(
        staging_dir, 'uclusionTokenAudit.py'
    )
    try:
        os.makedirs(staging_dir, mode=0o700, exist_ok=False)
        shutil.copy2(cli_source, staged_cli)
        shutil.copy2(bridge_source, staged_bridge)
        shutil.copy2(proxy_source, staged_proxy)
        if os.path.isfile(token_audit_source):
            shutil.copy2(token_audit_source, staged_token_audit)
    except OSError as error:
        raise RuntimeError(
            f'could not stage the Uclusion Codex release: {error}'
        ) from error
    required_paths = [staged_cli, staged_bridge, staged_proxy]
    if token_audit_required:
        required_paths.append(staged_token_audit)
    if not all(
        os.path.isfile(path)
        for path in required_paths
    ):
        raise RuntimeError(
            'the staged Uclusion Codex release is incomplete'
        )
    return staged_cli, staged_bridge, staged_proxy


def parse_codex_version(output):
    """Return the numeric Codex CLI version, accepting build/prerelease suffixes."""
    match = re.search(
        r'(?:^|\s)codex-cli\s+(\d+)\.(\d+)\.(\d+)'
        r'(?:-[0-9A-Za-z][0-9A-Za-z._-]*)?'
        r'(?:\+[0-9A-Za-z][0-9A-Za-z._-]*)?(?=\s|$)',
        output,
    )
    if match is None:
        return None
    return tuple(int(part) for part in match.groups())


def check_codex_version(codex_path):
    """Reject known-too-old Codex; the relay checks protocol shape at runtime."""
    try:
        result = subprocess.run(
            [codex_path, '--version'],
            capture_output=True,
            text=True,
            timeout=10,
        )
    except (OSError, subprocess.TimeoutExpired) as error:
        print(f"❌ Could not check the Codex version: {error}", file=sys.stderr)
        print("Run `codex update`, then try `uclusion codex` again.", file=sys.stderr)
        return False
    if result.returncode != 0:
        print(
            "❌ Could not check the Codex version "
            f"(`codex --version` exited with status {result.returncode}).",
            file=sys.stderr,
        )
        print("Run `codex update`, then try `uclusion codex` again.", file=sys.stderr)
        return False
    version_output = '\n'.join(
        part for part in (result.stdout, result.stderr) if part
    )
    version = parse_codex_version(version_output)
    if version is None:
        print(
            "❌ Could not parse `codex --version`; Uclusion requires Codex "
            f"{MINIMUM_CODEX_VERSION_TEXT} or newer.",
            file=sys.stderr,
        )
        print("Run `codex update`, then try `uclusion codex` again.", file=sys.stderr)
        return False
    if version < MINIMUM_CODEX_VERSION:
        installed = '.'.join(str(part) for part in version)
        print(
            f"❌ Codex {installed} is too old; Uclusion requires Codex "
            f"{MINIMUM_CODEX_VERSION_TEXT} or newer.",
            file=sys.stderr,
        )
        print("Run `codex update`, then try `uclusion codex` again.", file=sys.stderr)
        return False
    return True


def validate_codex_passthrough_args(codex_args):
    """Reject caller attempts to bypass the launcher's private relay."""
    for argument in codex_args:
        if argument == '--':
            break
        if argument == '--remote' or argument.startswith('--remote='):
            print(
                "❌ `uclusion codex` owns the Codex `--remote` connection; "
                "do not pass another `--remote` argument.",
                file=sys.stderr,
            )
            return False
    return True


def codex_app_server_passthrough_args(codex_args):
    """Copy backend-owned global configuration flags to app-server.

    The visible TUI remains the recipient of every passthrough argument, but
    feature and config switches must also reach the private app-server which
    actually starts MCP/apps and owns the Codex runtime configuration.
    """
    result = []
    value_options = frozenset(
        ("-c", "--config", "--enable", "--disable")
    )
    attached_options = (
        "--config=",
        "--enable=",
        "--disable=",
    )
    index = 0
    while index < len(codex_args):
        argument = codex_args[index]
        if argument == "--":
            break
        if argument in value_options:
            if index + 1 >= len(codex_args) or codex_args[index + 1] == "--":
                raise ValueError(
                    "{} requires a value".format(argument)
                )
            result.extend((argument, codex_args[index + 1]))
            index += 2
            continue
        if argument.startswith("-c") and len(argument) > 2:
            value = argument[3:] if argument.startswith("-c=") else argument[2:]
            if not value:
                raise ValueError("-c requires a value")
            result.append(argument)
            index += 1
            continue
        if argument.startswith(attached_options):
            _name, _separator, value = argument.partition("=")
            if not value:
                raise ValueError(
                    "{} requires a value".format(_name)
                )
            result.append(argument)
        elif argument == "--strict-config":
            result.append(argument)
        index += 1
    return result


def cmd_codex(args):
    """Launch Codex through a private Uclusion Poke relay.

    This path needs only the workspace config; it intentionally does not load
    credentials or log in. The TUI connects only to the relay's private
    frontend socket; the relay owns the separate backend app-server
    connection. Every child and the private runtime directory are cleaned up
    with the TUI. The bridge starts past the queued backlog unless the human
    explicitly opts into delivering it.
    """
    environment = args.env or 'production'
    _api_url, json_path, _credentials_path = get_env_paths(environment)
    config = load_config(json_path)
    if config is None:
        return 1
    workspace_id = config.get('workspaceId') if isinstance(config, dict) else None
    if not workspace_id:
        print(
            f"❌ Cannot launch Codex: no workspaceId in '{json_path}'.",
            file=sys.stderr,
        )
        return 1
    token_audit = codex_token_audit_settings(config, workspace_id)
    if not codex_receiver_liveness_supported():
        print(
            "❌ Cannot launch Codex safely on this platform: Uclusion cannot "
            "distinguish an exited Codex TUI from a live receiver.",
            file=sys.stderr,
        )
        return 1

    codex_path = shutil.which('codex')
    if codex_path is None:
        print(
            "❌ Cannot launch Codex: the 'codex' executable was not found on PATH.",
            file=sys.stderr,
        )
        return 1
    if not check_codex_version(codex_path):
        return 1

    try:
        bridge_path, proxy_path = resolve_codex_companion_paths()
    except RuntimeError as error:
        print(
            f"❌ Cannot launch Codex: {error}.",
            file=sys.stderr,
        )
        return 1
    cli_path = os.path.realpath(os.path.abspath(__file__))
    active_release = get_installed_script_version()

    instance_id = str(uuid.uuid4())
    cwd = os.getcwd()
    codex_args = list(args.codex_args)
    if codex_args and codex_args[0] == '--':
        codex_args.pop(0)
    if not validate_codex_passthrough_args(codex_args):
        return 1
    try:
        app_server_passthrough = codex_app_server_passthrough_args(
            codex_args
        )
    except ValueError as error:
        print(
            "❌ Invalid Codex passthrough arguments: {}.".format(error),
            file=sys.stderr,
        )
        return 1

    app_server = None
    app_server_diagnostics = None
    bridge = None
    tui = None
    with codex_shutdown_signals() as shutdown_state, \
            tempfile.TemporaryDirectory(
                prefix=f'uclusion-codex-{instance_id[:8]}-'
            ) as runtime_dir:
        try:
            try:
                (
                    staged_cli_path,
                    staged_bridge_path,
                    staged_proxy_path,
                ) = (
                    stage_codex_companions(
                        runtime_dir,
                        cli_path,
                        bridge_path,
                        proxy_path,
                        token_audit_required=token_audit is not None,
                    )
                )
            except RuntimeError as error:
                print(
                    f"❌ Cannot launch Codex: {error}.",
                    file=sys.stderr,
                )
                return 1
            child_env = os.environ.copy()
            for managed_name in CODEX_LAUNCH_MANAGED_ENV:
                child_env.pop(managed_name, None)
            if active_release is not None:
                child_env['UCLUSION_CODEX_ACTIVE_RELEASE'] = active_release
                child_env['UCLUSION_CODEX_STAGED_CLI'] = staged_cli_path
            backend_socket_path = os.path.join(
                runtime_dir, 'app-server.sock'
            )
            frontend_socket_path = os.path.join(
                runtime_dir, 'tui-relay.sock'
            )
            bridge_ready_path = os.path.join(runtime_dir, 'bridge.ready')
            receiver_pid_path = os.path.join(runtime_dir, 'receiver.pid')
            token_audit_ready_path = os.path.join(
                runtime_dir, 'token-audit.ready'
            )
            backend_listen_url = f'unix://{backend_socket_path}'
            frontend_listen_url = f'unix://{frontend_socket_path}'
            app_server_command = [
                codex_path,
                'app-server',
                *app_server_passthrough,
                *build_codex_mcp_overrides(
                    workspace_id,
                    environment,
                    staged_proxy_path,
                    token_audit=token_audit,
                    token_audit_ready_file=token_audit_ready_path,
                    token_audit_owner=instance_id,
                ),
                '--listen',
                backend_listen_url,
            ]
            bridge_command = [
                sys.executable,
                staged_bridge_path,
                'run',
                '--environment', environment,
                '--workspace-id', str(workspace_id),
                '--instance', instance_id,
                '--cwd', cwd,
                '--app-server-socket', backend_socket_path,
                '--frontend-socket', frontend_socket_path,
                '--ready-file', bridge_ready_path,
                '--receiver-pid-file', receiver_pid_path,
            ]
            if token_audit is not None:
                bridge_command.extend([
                    '--token-audit',
                    '--token-audit-ready-file', token_audit_ready_path,
                ])
            if getattr(args, 'deliver_existing_pokes', False):
                bridge_command.append('--deliver-existing-pokes')
            tui_command = [
                codex_path,
                '--remote',
                frontend_listen_url,
                *codex_args,
            ]

            try:
                app_server = subprocess.Popen(
                    app_server_command,
                    env=child_env,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    bufsize=0,
                )
                app_server_diagnostics = CodexAppServerDiagnostics(
                    getattr(app_server, 'stdout', None)
                )
            except OSError as error:
                print(
                    f"❌ Could not start the private Codex app-server: {error}",
                    file=sys.stderr,
                )
                return 1
            ready, app_server_returncode = wait_for_app_server_socket(
                app_server,
                backend_socket_path,
                should_stop=lambda: shutdown_state["signum"] is not None,
            )
            signal_exit = codex_signal_exit_code(shutdown_state)
            if signal_exit is not None:
                return signal_exit
            if not ready:
                if app_server_returncode is None:
                    print(
                        "❌ Timed out waiting for the private Codex app-server "
                        f"socket at '{backend_socket_path}'.",
                        file=sys.stderr,
                    )
                    print_app_server_diagnostics(app_server_diagnostics)
                else:
                    print_app_server_exit_error(
                        app_server_returncode, app_server_diagnostics
                    )
                return 1

            try:
                bridge = subprocess.Popen(bridge_command, env=child_env)
            except OSError as error:
                print(
                    f"❌ Could not start the Uclusion Codex bridge: {error}",
                    file=sys.stderr,
                )
                return 1

            bridge_ready, failed_child, child_returncode = (
                wait_for_bridge_ready(
                    bridge,
                    app_server,
                    bridge_ready_path,
                    instance_id,
                    frontend_socket_path,
                    should_stop=lambda: (
                        shutdown_state["signum"] is not None
                    ),
                )
            )
            signal_exit = codex_signal_exit_code(shutdown_state)
            if signal_exit is not None:
                return signal_exit
            if not bridge_ready:
                if failed_child == 'bridge':
                    print_bridge_exit_error(child_returncode)
                elif failed_child == 'app-server':
                    print_app_server_exit_error(
                        child_returncode, app_server_diagnostics
                    )
                elif failed_child == 'invalid':
                    print(
                        "❌ The Uclusion Codex bridge wrote an invalid private "
                        "readiness marker or did not bind its frontend socket.",
                        file=sys.stderr,
                    )
                else:
                    print(
                        "❌ Timed out waiting for the Uclusion Codex bridge "
                        "to initialize its backend driver and bind its "
                        "frontend relay.",
                        file=sys.stderr,
                    )
                return 1

            try:
                tui = subprocess.Popen(tui_command, env=child_env)
            except OSError as error:
                print(f"❌ Could not start the Codex TUI: {error}", file=sys.stderr)
                return 1
            try:
                write_codex_receiver_file(
                    receiver_pid_path, instance_id, tui.pid
                )
            except OSError as error:
                print(
                    "❌ Could not register the Codex TUI with the Uclusion "
                    f"bridge: {error}",
                    file=sys.stderr,
                )
                return 1

            while True:
                signal_exit = codex_signal_exit_code(shutdown_state)
                if signal_exit is not None:
                    return signal_exit
                tui_returncode = tui.poll()
                if tui_returncode is not None:
                    return tui_returncode
                app_server_returncode = app_server.poll()
                if app_server_returncode is not None:
                    print_app_server_exit_error(
                        app_server_returncode, app_server_diagnostics
                    )
                    return 1
                bridge_returncode = bridge.poll()
                if bridge_returncode is not None:
                    print_bridge_exit_error(bridge_returncode)
                    return 1
                time.sleep(CODEX_CHILD_POLL_INTERVAL)
        finally:
            stop_codex_children(tui, bridge, app_server)
            if app_server_diagnostics is not None:
                app_server_diagnostics.close()


def is_orphaned(initial_ppid):
    """True when the launching parent died and this poller was reparented.

    S-all-173 (Q-all-309 O-2): an orphaned wait/listen must exit BEFORE its
    next claim — the consumer cursor only advances inside ``next_prompt``, so
    exiting first guarantees an orphan never swallows a prompt no agent will
    handle (a harness that leaks the process past session end otherwise eats
    every poke it claims, and a prompt is never delivered twice). Compares
    against the parent pid recorded at loop start. POSIX-only by decision:
    Windows keeps a dead parent's pid, so this never fires there and native
    Windows retains prior behavior.
    """
    return os.getppid() != initial_ppid


def cmd_wait(args):
    """Wait for inbound Poke AI prompts, watching for updates while idle.

    Prompt delivery stays local and quarter-second fast; the update watch
    (Q-all-301 O-1) piggybacks on the loop, network-checking at most once
    per UPDATE_CHECK_INTERVAL. On first sight of a newer release the wait
    prints the update notice instead of a prompt and exits so the AI client
    can offer `uclusion update` right away. ``--consumer`` names the cursor
    this wait advances (S-all-168); identity resolution is per-session by
    design (J-all-379, see ``resolve_consumer``) so every session sees
    every prompt. Since a wait costs its client a
    full exit/relaunch cycle, delivery drains the whole pending backlog —
    one prompt per line — so a stack of pokes costs one cycle (B-all-507).
    ``--ignore-existing-pokes`` (B-all-515) advances this consumer past the
    backlog already queued at launch before the first delivery.
    ``--deliver-existing-pokes`` (Q-all-351 O-1) keeps a brand-new session
    consumer's cursor at zero so the retained backlog is delivered as its
    private copy.
    """
    _api_url, json_path, _credentials_path = get_env_paths(args.env)
    config = load_config(json_path)
    if config is None:
        return 1
    workspace_id = config.get('workspaceId')
    if workspace_id is None:
        print("⚠️ Warning: No workspaceId in config.")
        return 1

    environment = args.env or 'production'
    consumer = resolve_consumer(args.consumer, is_listener=False)
    if not getattr(args, 'deliver_existing_pokes', False):
        start_new_consumer_at_arm_time(environment, workspace_id, consumer)
    if getattr(args, 'ignore_existing_pokes', False):
        ignore_existing_prompts(environment, workspace_id, consumer)
    deadline = time.monotonic() + args.timeout
    next_update_check = time.monotonic()
    initial_ppid = os.getppid()
    while True:
        if is_orphaned(initial_ppid):
            return 0
        prompt = next_prompt(environment, workspace_id, consumer)
        if prompt is not None:
            while prompt is not None:
                print(prompt, flush=True)
                if is_orphaned(initial_ppid):
                    return 0
                prompt = next_prompt(environment, workspace_id, consumer)
            return 0
        if time.monotonic() >= next_update_check:
            next_update_check = time.monotonic() + UPDATE_CHECK_INTERVAL
            notice = check_wait_update_notice(environment)
            if notice is not None:
                print(notice)
                return 0
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            return 0
        time.sleep(min(0.25, remaining))


def cmd_listen(args):
    """Stream Poke AI prompts indefinitely, one flushed line per prompt.

    B-all-507: for harnesses that raise stdout lines from a still-running
    process as events (Claude Code's Monitor), delivery needs no exit at
    all — each claimed prompt prints as one line and the loop keeps
    listening, so there is no timeout, no completion notice, and no
    relaunch choreography. The update watch piggybacks exactly as in
    ``wait`` but emits the notice as a stream line and keeps running; the
    shared state file already guarantees each release is announced once.
    ``--ignore-existing-pokes`` (B-all-515) advances this consumer past the
    backlog already queued at launch before the first delivery.
    ``--deliver-existing-pokes`` (Q-all-351 O-1) keeps a brand-new session
    consumer's cursor at zero so the retained backlog is delivered as its
    private copy.
    """
    _api_url, json_path, _credentials_path = get_env_paths(args.env)
    config = load_config(json_path)
    if config is None:
        return 1
    workspace_id = config.get('workspaceId')
    if workspace_id is None:
        print("⚠️ Warning: No workspaceId in config.")
        return 1

    environment = args.env or 'production'
    consumer = resolve_consumer(args.consumer, is_listener=True)
    if not getattr(args, 'deliver_existing_pokes', False):
        start_new_consumer_at_arm_time(environment, workspace_id, consumer)
    if getattr(args, 'ignore_existing_pokes', False):
        ignore_existing_prompts(environment, workspace_id, consumer)
    next_update_check = time.monotonic()
    initial_ppid = os.getppid()
    while True:
        if is_orphaned(initial_ppid):
            return 0
        prompt = next_prompt(environment, workspace_id, consumer)
        if prompt is not None:
            print(prompt, flush=True)
            continue
        if time.monotonic() >= next_update_check:
            next_update_check = time.monotonic() + UPDATE_CHECK_INTERVAL
            notice = check_wait_update_notice(environment)
            if notice is not None:
                print(notice, flush=True)
        time.sleep(0.25)


def get_scripts_base_url(env):
    """Return the base URL the helper scripts are served from for ``env``."""
    if env == 'dev':
        return 'https://localhost:3000/scripts/'
    if env in ('stage', 'production'):
        return f'https://{env}.uclusion.com/scripts/'
    return 'https://production.uclusion.com/scripts/'


def get_installed_script_version():
    """Return this CLI's release from its install path, or None if unknown.

    The installer names the install dir after the script_reinstall_version in
    effect when it ran (~/.local/uclusion-cli/<version>/bin), so realpath of
    this file identifies the installed release. Dev checkouts, the legacy
    v1/current/bin layout, and installs stamped without credentials all
    return None.
    """
    active_release = os.environ.get('UCLUSION_CODEX_ACTIVE_RELEASE')
    staged_cli = os.environ.get('UCLUSION_CODEX_STAGED_CLI')
    if (
        active_release
        and staged_cli
        and os.path.realpath(os.path.abspath(__file__))
        == os.path.realpath(os.path.abspath(staged_cli))
        and re.fullmatch(r'[A-Za-z0-9._-]+', active_release)
        and active_release.casefold() not in UNVERSIONED_DIR_NAMES
        and not active_release.casefold().startswith('unversioned-')
        and not active_release.startswith('.')
    ):
        return active_release
    real_path = os.path.realpath(os.path.abspath(__file__))
    bin_dir = os.path.dirname(real_path)
    version = os.path.basename(os.path.dirname(bin_dir))
    if os.path.basename(bin_dir) != 'bin' or not version:
        return None
    if version in UNVERSIONED_DIR_NAMES or version.startswith('unversioned-'):
        return None
    if os.path.dirname(os.path.dirname(bin_dir)) != SCRIPT_INSTALL_PREFIX:
        return None
    return version


def file_contains(path, needle):
    try:
        with open(path, 'r', encoding='utf-8') as src:
            return needle in src.read()
    except OSError:
        return False


def json_has_uclusion_server(path):
    try:
        with open(path, 'r', encoding='utf-8') as src:
            config = json.load(src)
    except (OSError, json.JSONDecodeError):
        return False
    servers = config.get('mcpServers') if isinstance(config, dict) else None
    return isinstance(servers, dict) and 'Uclusion' in servers


def detect_global_clients():
    """Return the AI clients with a global Uclusion install on this machine."""
    home = os.path.expanduser('~')
    clients = set()
    if (json_has_uclusion_server(os.path.join(home, '.claude.json'))
            or file_contains(os.path.join(home, '.claude', 'CLAUDE.md'), WORKFLOW_MD_MARKER)):
        clients.add('claude')
    if (json_has_uclusion_server(os.path.join(home, '.cursor', 'mcp.json'))
            or os.path.exists(os.path.join(home, '.cursor', 'rules', 'uclusion.mdc'))):
        clients.add('cursor')
    if (file_contains(os.path.join(home, '.codex', 'config.toml'), CODEX_UCLUSION_TABLE)
            or file_contains(os.path.join(home, '.codex', 'AGENTS.md'), WORKFLOW_MD_MARKER)):
        clients.add('codex')
    return clients


def detect_project_clients(project_dir):
    """Return the AI clients with a project-level Uclusion install in ``project_dir``."""
    clients = set()
    if (json_has_uclusion_server(os.path.join(project_dir, '.mcp.json'))
            or file_contains(os.path.join(project_dir, 'CLAUDE.md'), WORKFLOW_MD_MARKER)):
        clients.add('claude')
    if (json_has_uclusion_server(os.path.join(project_dir, '.cursor', 'mcp.json'))
            or os.path.exists(os.path.join(project_dir, '.cursor', 'rules', 'uclusion.mdc'))):
        clients.add('cursor')
    if file_contains(os.path.join(project_dir, 'AGENTS.md'), WORKFLOW_MD_MARKER):
        clients.add('codex')
    return clients


def get_project_config_path(env):
    """Return the project workspace config path in cwd, or None.

    Installs write plain uclusion.json, but a hand-configured project may use
    the env-specific name the CLI reads, so accept either.
    """
    json_names = {'dev': DEV_SOURCES_CONFIG_FILE, 'stage': STAGE_SOURCES_CONFIG_FILE}
    candidates = [json_names.get(env, SOURCES_CONFIG_FILE), SOURCES_CONFIG_FILE]
    for name in dict.fromkeys(candidates):
        path = os.path.join(os.getcwd(), name)
        if os.path.exists(path):
            return path
    return None


def load_config_at(config_path):
    """Load a specific workspace config file; None when absent or invalid."""
    if config_path is None:
        return None
    try:
        with open(config_path, 'r', encoding='utf-8') as src:
            config = json.load(src)
        return config if isinstance(config, dict) else None
    except FileNotFoundError:
        return None
    except (OSError, json.JSONDecodeError) as error:
        print(f"⚠️ Warning: could not parse '{config_path}': {error}")
        return None


def fetch_script_version_for_workspace(env, workspace_id):
    """Return one workspace's current script release, failing closed."""
    api_url, _json_path, credentials_path = get_env_paths(env)
    credentials = get_credentials(credentials_path)
    if credentials is None:
        return None
    if not workspace_id:
        return None
    credentials['workspace_id'] = workspace_id
    credentials['api_url'] = api_url
    response = login(credentials)
    if response is None or 'uclusion_token' not in response:
        print("   -> ❌ Error: login failed.")
        return None
    app_url = 'https://sso.' + api_url + '/app?' + urllib.parse.urlencode(
        {'idToken': response['uclusion_token']}
    )
    try:
        with urllib.request.urlopen(app_url, timeout=15) as app_response:
            version = json.loads(app_response.read().decode('utf-8')).get(
                'script_reinstall_version'
            )
        if (
            not isinstance(version, str)
            or not re.fullmatch(r'[A-Za-z0-9._-]+', version)
            or version.casefold() in UNVERSIONED_DIR_NAMES
            or version.casefold().startswith('unversioned-')
            or version.startswith('.')
        ):
            print(
                "   -> ❌ The server returned an invalid script release.",
                file=sys.stderr,
            )
            return None
        return version
    except Exception as error:
        print(f"   -> ❌ Error fetching the current script version: {error}")
        return None


def fetch_latest_script_version(env):
    """Login and return the current workspace's script release, or None."""
    _api_url, json_path, _credentials_path = get_env_paths(env)
    config = load_config(json_path)
    if config is None:
        return None
    return fetch_script_version_for_workspace(env, config.get('workspaceId'))


def load_update_check_state():
    """Per-environment wait update-check state: {env: {checked_at, notified}}."""
    try:
        with open(UPDATE_CHECK_STATE_FILE, 'r', encoding='utf-8') as src:
            state = json.load(src)
        return state if isinstance(state, dict) else {}
    except Exception:
        return {}


def save_update_check_state(state):
    try:
        with open(UPDATE_CHECK_STATE_FILE, 'w', encoding='utf-8') as out:
            json.dump(state, out)
        try:
            os.chmod(UPDATE_CHECK_STATE_FILE, 0o600)
        except OSError:
            pass
    except Exception:
        pass


def check_wait_update_notice(environment):
    """Staleness check inside the wait loop (Q-all-301 O-1).

    Compares the installed release and any project stamp in cwd against the
    current script_reinstall_version, network-checking at most once per
    UPDATE_CHECK_INTERVAL across processes (checked_at). The first wait to
    see a given newer release returns the notice and records it (notified),
    so relaunched waits — from any AI client sharing this machine — stay
    silent about that release and a declined update never renags. Every
    failure returns None: an update check must never break waiting.
    """
    try:
        installed_version = get_installed_script_version()
        project_config_path = get_project_config_path(environment)
        if installed_version is None and project_config_path is None:
            return None
        state = load_update_check_state()
        env_state = state.get(environment)
        if not isinstance(env_state, dict):
            env_state = {}
        if time.time() - env_state.get('checked_at', 0) < UPDATE_CHECK_INTERVAL:
            return None
        env_state['checked_at'] = time.time()
        state[environment] = env_state
        save_update_check_state(state)
        # The nested helpers print their own errors; the wait's output must
        # hold nothing but prompts and the notice, so swallow stdout here.
        with redirect_stdout(io.StringIO()):
            latest = fetch_latest_script_version(environment)
            project_version = (load_config_at(project_config_path) or {}).get(
                'scriptReinstallVersion'
            ) if project_config_path else None
        if not latest or env_state.get('notified') == latest:
            return None
        global_stale = installed_version is not None and installed_version != latest
        project_stale = project_config_path is not None and project_version != latest
        if not (global_stale or project_stale):
            return None
        env_state['notified'] = latest
        save_update_check_state(state)
        env_flag = '' if environment == 'production' else f' -e {environment}'
        if global_stale and project_stale:
            scope = ("The local Uclusion install and this project's workflow "
                     'files are older than the current release.')
        elif global_stale:
            scope = 'The local Uclusion install is older than the current release.'
        else:
            scope = ("This project's Uclusion workflow files are older than "
                     'the current release.')
        return (
            f'[Uclusion update notice — from the local update check, not workspace data] {scope} '
            f'Tell the user, and ask their permission to run `uclusion{env_flag} update` '
            f'from this directory. If they grant it, run the command, then tell them to '
            f'restart the AI client session (or reconnect the MCP server) so the updated '
            f'connection loads. If they decline, continue without updating and do not ask '
            f'again this session; this notice will not repeat for this release.'
        )
    except Exception:
        return None


def run_installer(
    installer_path,
    env,
    config,
    fallback_config,
    clients,
    project,
    script_version,
    skip_scripts=False,
):
    """Run the downloaded installer non-interactively for one install scope.

    Returns True when the installer ran successfully. ``fallback_config``
    supplies the workspace identity when the scope's own config lacks it
    (e.g. a project whose uclusion.json predates workspaceId stamping).
    ``skip_scripts`` keeps a project pass from reinstalling the scripts the
    global pass just refreshed.
    """
    source = config or fallback_config
    workspace_id = source.get('workspaceId') if source else None
    if workspace_id is None:
        scope = 'project' if project else 'global'
        print(f"⚠️ Skipping {scope} update: no workspaceId found in its config.")
        return False
    view_id = source.get('todoViewId') or workspace_id
    command = [sys.executable, installer_path, env, workspace_id, view_id]
    command += ['--script-version', script_version]
    token_audit = source.get('tokenAudit')
    if isinstance(token_audit, dict):
        token_audit_enabled = token_audit.get('enabled') is True
    else:
        token_audit_enabled = bool(token_audit)
    command.append('--token-audit' if token_audit_enabled else '--no-token-audit')
    if clients:
        command += ['--clients', ','.join(sorted(clients))]
    else:
        command.append('--scripts-only')
    if project:
        command.append('--project')
    if skip_scripts:
        command.append('--skip-scripts')
    print(f"🚀 Running installer: {' '.join(command[2:])}")
    result = subprocess.run(command)
    if result.returncode != 0:
        print(f"❌ Installer exited with status {result.returncode}.")
        return False
    return True


def cmd_update(args):
    """Update the scripts and every installed Uclusion surface (T-all-2409).

    Downloads the CURRENT installer and runs it non-interactively, so the
    update logic always comes from the new release rather than this possibly
    years-old CLI (Q-all-299). Scope is the global surfaces plus a project
    install in the current directory when one exists (Q-all-298).
    """
    env = args.env or 'production'

    project_dir = os.getcwd()
    project_config_path = get_project_config_path(env)
    project_clients = detect_project_clients(project_dir)
    has_project_install = project_config_path is not None or bool(project_clients)

    _api_url, json_path, _credentials_path = get_env_paths(env)
    global_config_path = os.path.join(os.path.expanduser('~'), '.uclusion', json_path)
    global_config = load_config_at(global_config_path)
    project_config = load_config_at(project_config_path)

    if args.check:
        latest = fetch_latest_script_version(env)
        if latest is None:
            print("❌ Could not determine the current release version.")
            return 1
        installed = get_installed_script_version()
        stale = False
        if installed == latest:
            print(f"✅ Scripts are current ({installed}).")
        elif installed is None:
            print(f"⚠️ Installed script version is unknown (current release {latest}); "
                  f"run `uclusion update` to move to a versioned install.")
            stale = True
        else:
            print(f"⬆️  Update available: installed {installed}, current release {latest}.")
            stale = True
        if has_project_install:
            project_version = (project_config or {}).get('scriptReinstallVersion')
            if project_version == latest:
                print(f"✅ Project install in {project_dir} is current.")
            else:
                print(f"⬆️  Project install in {project_dir} is out of date "
                      f"(stamped {project_version or 'nothing'}, current release {latest}).")
                stale = True
        return 2 if stale else 0

    if global_config is None and not has_project_install:
        print("❌ No Uclusion install found to update (no workspace config in "
              "~/.uclusion or the current directory).")
        return 1

    workspace_ids = set()
    if global_config is not None and global_config.get('workspaceId'):
        workspace_ids.add(global_config['workspaceId'])
    project_source = project_config or global_config
    if (
        has_project_install
        and project_source is not None
        and project_source.get('workspaceId')
    ):
        workspace_ids.add(project_source['workspaceId'])
    if not workspace_ids:
        print("❌ No workspaceId is available to resolve the update release.")
        return 1
    release_by_workspace = {}
    for workspace_id in sorted(workspace_ids):
        release = fetch_script_version_for_workspace(env, workspace_id)
        if release is None:
            print(
                "❌ Could not determine a script release for workspace "
                f"{workspace_id}; no update was applied."
            )
            return 1
        release_by_workspace[workspace_id] = release
    releases = set(release_by_workspace.values())
    if len(releases) != 1:
        detail = ', '.join(
            f'{workspace_id}={release}'
            for workspace_id, release in sorted(release_by_workspace.items())
        )
        print(
            "❌ Global and project workspaces resolve to different script "
            f"releases ({detail}); no update was applied."
        )
        return 1
    script_version = releases.pop()

    installer_url = get_scripts_base_url(env) + 'uclusionInstall.py'
    with tempfile.TemporaryDirectory() as tmp_dir:
        installer_path = os.path.join(tmp_dir, 'uclusionInstall.py')
        print(f"⬇️  Downloading {installer_url}")
        try:
            with urllib.request.urlopen(installer_url, timeout=15) as response:
                with open(installer_path, 'wb') as out:
                    out.write(response.read())
        except Exception as error:
            print(f"❌ Could not download the installer: {error}")
            return 1

        # The global run refreshes the scripts under ~/.local plus detected
        # global surfaces; skip it only when this machine has no global config
        # at all (project-only setups still get scripts via the project run).
        ran_global = False
        if global_config is not None:
            if not run_installer(installer_path, env, global_config, None,
                                 detect_global_clients(), project=False,
                                 script_version=script_version):
                return 1
            ran_global = True
        if has_project_install:
            if not run_installer(installer_path, env, project_config, global_config,
                                 project_clients, project=True,
                                 script_version=script_version,
                                 skip_scripts=ran_global):
                return 1

    print("🎉 Update complete. Restart your AI client sessions (or reconnect the "
          "Uclusion MCP server) so the updated connection loads.")
    return 0


def cmd_report(args):
    result = initialize(args.env)
    if result is None:
        return 1
    credentials, config, _stages = result
    write_uclusion_md(config, credentials, args.short_code, args.output)
    return 0


def cmd_approve(args):
    result = initialize(args.env)
    if result is None:
        return 1
    credentials, _config, _stages = result
    approve_job(credentials, args.job_short_code, args.certainty, args.reason)
    return 0


def cmd_add_info(args):
    result = initialize(args.env)
    if result is None:
        return 1
    credentials, _config, _stages = result
    response = add_info(credentials, args.short_code, args.info, args.question_short_code)
    print(response)
    return 0


def cmd_add_question(args):
    result = initialize(args.env)
    if result is None:
        return 1
    credentials, _config, _stages = result
    response = add_question(credentials, args.job_short_code, args.question, args.options)
    print(response)
    return 0


def cmd_add_options(args):
    result = initialize(args.env)
    if result is None:
        return 1
    credentials, _config, _stages = result
    response = add_options(credentials, args.question_short_code, args.options)
    print(response)
    return 0


def cmd_add_suggestion(args):
    result = initialize(args.env)
    if result is None:
        return 1
    credentials, _config, _stages = result
    response = add_suggestion(credentials, args.job_short_code, args.suggestion)
    print(response)
    return 0


def cmd_add_report(args):
    result = initialize(args.env)
    if result is None:
        return 1
    credentials, _config, _stages = result
    response = add_report(credentials, args.job_short_code, args.report)
    print(response)
    return 0


def cmd_resolve(args):
    result = initialize(args.env)
    if result is None:
        return 1
    credentials, _config, stages = result
    stage_id = None
    for stage in stages:
        if not stage.get('allows_tasks', True): 
            stage_id = stage['id']
            break
    if stage_id is None:
        print("   -> ❌ Error: No stage found that allows tasks.")
        return 1
    response = resolve(credentials, args.short_code, stage_id)
    print(response)
    return 0

def certainty_value(raw):
    try:
        value = int(raw)
    except (TypeError, ValueError):
        raise argparse.ArgumentTypeError(f"certainty must be an integer between 1 and 5, got {raw!r}")
    if value < 1 or value > 5:
        raise argparse.ArgumentTypeError(f"certainty must be between 1 and 5, got {value}")
    return value


def timeout_value(raw):
    try:
        value = float(raw)
    except (TypeError, ValueError):
        raise argparse.ArgumentTypeError(f'timeout must be a non-negative number, got {raw!r}')
    if not math.isfinite(value) or value < 0:
        raise argparse.ArgumentTypeError(f'timeout must be a finite non-negative number, got {raw!r}')
    return value


def build_parser():
    parser = argparse.ArgumentParser(
        prog='uclusionCLI',
        description='Uclusion command line interface.',
    )
    parser.add_argument(
        '-e', '--env',
        choices=['dev', 'stage', 'production'],
        default='production',
        help='API environment to target (default: production).',
    )

    subparsers = parser.add_subparsers(dest='command', metavar='COMMAND', required=True)

    sync_parser = subparsers.add_parser(
        'sync',
        help='Write the Uclusion MD file and sync TODOs in the configured source directories.',
    )
    sync_parser.set_defaults(func=cmd_sync)

    export_parser = subparsers.add_parser(
        'export',
        help='Write the full workspace markdown export for searching past decisions and backup.',
    )
    export_parser.add_argument(
        '-o', '--output',
        default=None,
        help="Full path to write the export to. Without -o, writes <workspaceId>.md in the "
             "configured uclusionMDFolderPath (default: ~/.uclusion/export).",
    )
    export_parser.set_defaults(func=cmd_export)

    codex_parser = subparsers.add_parser(
        'codex',
        help='Launch Codex through the private Uclusion Poke relay.',
    )
    codex_backlog_group = codex_parser.add_mutually_exclusive_group()
    codex_backlog_group.add_argument(
        '--deliver-existing-pokes',
        action='store_true',
        help='Deliver Pokes already queued for the Codex bridge when it starts. '
             'By default a new Codex session starts at the launch-time cutoff '
             'and receives only later Pokes. Place this option before `--` and '
             'any arguments passed through to Codex.',
    )
    codex_backlog_group.add_argument(
        '--ignore-existing-pokes',
        action='store_true',
        help=argparse.SUPPRESS,
    )
    codex_parser.add_argument(
        'codex_args',
        nargs=argparse.REMAINDER,
        help='Arguments passed through to Codex (place them after --).',
    )
    codex_parser.set_defaults(func=cmd_codex)

    wait_parser = subparsers.add_parser(
        'wait',
        help='Wait for the next Poke AI prompt this consumer has not yet seen from the local proxy inbox.',
    )
    wait_parser.add_argument(
        '--timeout',
        type=timeout_value,
        default=55,
        help='Seconds to wait before returning with no output (default: 55).',
    )
    wait_parser.add_argument(
        '--consumer',
        default=None,
        help='Cursor name this wait advances. Prompts are kept until they age '
             'out, so each named consumer sees every prompt exactly once. '
             f'Defaults to the {CONSUMER_ENV_VAR} environment variable when '
             f'set, else the shared "{DEFAULT_CONSUMER}" cursor; give each '
             'session its own name so every session sees every prompt.',
    )
    wait_backlog_group = wait_parser.add_mutually_exclusive_group()
    wait_backlog_group.add_argument(
        '--ignore-existing-pokes',
        action='store_true',
        help='Skip prompts already queued for this consumer when the wait '
             'starts; prompts arriving after that cutoff are still delivered. '
             'No inbox rows are deleted and other consumers and update '
             'notices are unaffected.',
    )
    wait_backlog_group.add_argument(
        '--deliver-existing-pokes',
        action='store_true',
        help='Deliver the whole retained backlog to a brand-new session '
             'consumer instead of starting its cursor at the current '
             'high-water mark. The backlog is this consumer\'s private copy; '
             'other consumers are unaffected. An established consumer or the '
             'shared default cursor already receives its pending prompts, so '
             'the flag changes nothing there.',
    )
    wait_parser.set_defaults(func=cmd_wait)

    listen_parser = subparsers.add_parser(
        'listen',
        help='Stream Poke AI prompts indefinitely, one line per prompt, for AI '
             'clients that consume stdout lines as events without the process '
             'exiting (e.g. under Claude Code\'s persistent Monitor).',
    )
    listen_parser.add_argument(
        '--consumer',
        default=None,
        help='Cursor name this listener advances. Prompts are kept until they '
             'age out, so each named consumer sees every prompt exactly once. '
             f'Defaults to the {CONSUMER_ENV_VAR} environment variable when '
             'set, else a fresh per-session identity that starts at the '
             'current high-water mark, so every session sees every prompt '
             'arriving while it is armed.',
    )
    listen_backlog_group = listen_parser.add_mutually_exclusive_group()
    listen_backlog_group.add_argument(
        '--ignore-existing-pokes',
        action='store_true',
        help='Skip prompts already queued for this consumer when the listener '
             'starts; prompts arriving after that cutoff are still delivered. '
             'No inbox rows are deleted and other consumers and update '
             'notices are unaffected.',
    )
    listen_backlog_group.add_argument(
        '--deliver-existing-pokes',
        action='store_true',
        help='Deliver the whole retained backlog to a brand-new session '
             'consumer instead of starting its cursor at the current '
             'high-water mark. The backlog is this consumer\'s private copy; '
             'other consumers are unaffected. An established consumer or the '
             'shared default cursor already receives its pending prompts, so '
             'the flag changes nothing there.',
    )
    listen_parser.set_defaults(func=cmd_listen)

    update_parser = subparsers.add_parser(
        'update',
        help='Update the Uclusion scripts and every installed AI client surface '
             'to the current release (global surfaces plus a project install in '
             'the current directory).',
    )
    update_parser.add_argument(
        '--check',
        action='store_true',
        help='Only report whether an update is available; exits 0 when current '
             'and 2 when an update is available.',
    )
    update_parser.set_defaults(func=cmd_update)

    report_parser = subparsers.add_parser(
        'report',
        help='Fetch a job report for a single short code.',
    )
    report_parser.add_argument(
        'short_code',
        help='The short code id of the job to fetch (e.g. J-abc-123).',
    )
    report_parser.add_argument(
        '-o', '--output',
        default='job_report.md',
        help='Path to write the job report to (default: job_report.md).',
    )

    report_parser.set_defaults(func=cmd_report)

    approve_parser = subparsers.add_parser(
        'approve',
        help='Approve a job with a job short code, certainty, and optional reason.',
    )
    approve_parser.add_argument(
        'job_short_code',
        help='The short code id of the job to approve (e.g. J-abc-123).',
    )

    approve_parser.add_argument(
        'certainty',
        type=certainty_value,
        help='Certainty level to approve the job with (integer 1-5).',
    )

    approve_parser.add_argument(
        'reason',
        help='Reason for the approval certainty.',
    )

    approve_parser.set_defaults(func=cmd_approve)

    add_info_parser = subparsers.add_parser(
        'add_info',
        help='Add info a job, option or comment with its short code and the info to add. Returns the created object.',
    )
    add_info_parser.add_argument(
        'short_code',
        help='The short code id of the job, option, or comment to add info to (e.g. J-abc-123).',
    )
    add_info_parser.add_argument(
        'info',
        help='Info to add.',
    )
    add_info_parser.add_argument(
        'question_short_code',
        help='If the short code is an option or inside an option then the short code id of the question the option is for (e.g. Q-abc-123).',
    )
    add_info_parser.set_defaults(func=cmd_add_info)

    resolve_parser = subparsers.add_parser(
        'resolve',
        help='Resolves a job by sending to stage Tasks Complete or a comment by marking resolved. Returns the created object.',
    )
    resolve_parser.add_argument(
        'short_code',
        help='The short code id of the job or comment to resolve (e.g. J-abc-123).',
    )
    resolve_parser.set_defaults(func=cmd_resolve)

    add_question_parser = subparsers.add_parser(
        'add_question',
        help='Add a question and optionally options to a job by job short code. Returns the created question.',
    )
    add_question_parser.add_argument(
        'job_short_code',
        help='The short code id of the job to add the question to (e.g. J-abc-123).',
    )
    add_question_parser.add_argument(
        'question',
        help='Question text.',
    )
    add_question_parser.add_argument(
        '-o', '--option',
        action='append',
        nargs=2,
        metavar=('NAME', 'DESCRIPTION'),
        dest='options',
        default=[],
        help='An option for the question as NAME DESCRIPTION. Repeat the flag to add multiple options.',
    )

    add_question_parser.set_defaults(func=cmd_add_question)

    add_options_parser = subparsers.add_parser(
        'add_options',
        help='Add options to a question by question short code.',
    )
    add_options_parser.add_argument(
        'question_short_code',
        help='The short code id of the question to add the options to (e.g. Q-abc-123).',
    )
    add_options_parser.add_argument(
        '-o', '--option',
        action='append',
        nargs=2,
        metavar=('NAME', 'DESCRIPTION'),
        dest='options',
        default=[],
        help='An option for the question as NAME DESCRIPTION. Repeat the flag to add multiple options.',
    )

    add_options_parser.set_defaults(func=cmd_add_options)

    add_suggestion_parser = subparsers.add_parser(
        'add_suggestion',
        help='Add a suggestion to a job by job short code. Returns the created suggestion.',
    )
    add_suggestion_parser.add_argument(
        'job_short_code',
        help='The short code id of the job to add the question to (e.g. J-abc-123).',
    )
    add_suggestion_parser.add_argument(
        'suggestion',
        help='Suggestion text.',
    )

    add_suggestion_parser.set_defaults(func=cmd_add_suggestion)


    add_report_parser = subparsers.add_parser(
        'add_report',
        help='Add a report to a job by job short code. Returns the created report.',
    )
    add_report_parser.add_argument(
        'job_short_code',
        help='The short code id of the job to add the question to (e.g. J-abc-123).',
    )
    add_report_parser.add_argument(
        'report',
        help='Report text.',
    )

    add_report_parser.set_defaults(func=cmd_add_report)

    return parser


if __name__ == "__main__":
    args = build_parser().parse_args()
    sys.exit(args.func(args) or 0)
