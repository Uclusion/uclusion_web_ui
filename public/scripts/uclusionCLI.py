#!/usr/bin/python3
import argparse
import json
import os
import re
import sys
import urllib.request
import urllib.parse
import traceback
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


def send(data, method, my_api_url, auth=None):
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
                print(f"Failed to post data. Status code: {response.status}")
                print(f"Response: {response.read().decode('utf-8')}")

    except urllib.request.HTTPError as e:
        print(f"Error making request: {e.reason}")
    except Exception as e:
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
    response = send(None, 'GET', export_list_api_url, credentials['api_token'])
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
    return warnings + new_file_content


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
        print(f"     -> ❌ Fetch failed; not writing '{file_path}'")
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
        print(f"     -> ❌ Fetch failed; not writing '{file_path}'")
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
