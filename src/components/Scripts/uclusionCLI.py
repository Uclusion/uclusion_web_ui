#!/usr/bin/python3
import json
import os
import re
import sys
import urllib.request
import urllib.parse
import traceback
from itertools import batched


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


def write_uclusion_md(config, credentials):
    file_path = config.get('uclusionMDFilePath')
    file_type = config.get('uclusionMDFileType')
    print(f"  ✅ Processing: '{file_path}'")
    if file_type == 'export':
        export_list_api_url = 'https://summaries.' + credentials['api_url'] + '/export_list'
        response = send(None, 'GET', export_list_api_url, credentials['api_token'])
        market_investible_ids = response['market_investible_ids']
        export_api_url = 'https://summaries.' + credentials['api_url'] + '/export'
        new_file_content = ''
        for batch in batched(market_investible_ids, 20):
            full_export_api_url = export_api_url + '?idType=marketInvestible&id=' + '&id='.join(batch)
            new_file_content += send(None, 'GET', full_export_api_url, credentials['api_token'])
        new_file_content += '<br/><br/>\n'
        new_file_content += '***\n'
        comment_ids = response['comment_ids']
        for batch in batched(comment_ids, 20):
            full_export_api_url = export_api_url + '?idType=comment&id=' + '&id='.join(batch)
            new_file_content += send(None, 'GET', full_export_api_url, credentials['api_token'])
    else:
        report_api_url = 'https://summaries.' + credentials['api_url'] + '/report'
        new_file_content = send(None, 'GET', report_api_url, credentials['api_token'])
    try:
        with open(file_path, 'w', encoding='utf-8') as uclusion_file:
            uclusion_file.write(new_file_content)
    except Exception as e:
        print(f"     -> ❌ Error processing file: {e}")


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

        # C-style languages using '//'
        '.js': r'^\s*//\s*TODO',
        '.ts': r'^\s*//\s*TODO',
        '.java': r'^\s*//\s*TODO',
        '.c': r'^\s*(//|/\*)\s*TODO', # Handles // and /*
        '.cpp': r'^\s*(//|/\*)\s*TODO', # Handles // and /*
        '.cs': r'^\s*//\s*TODO',
        '.go': r'^\s*//\s*TODO',
        '.rs': r'^\s*//\s*TODO',
        '.swift': r'^\s*//\s*TODO',
        '.kt': r'^\s*//\s*TODO',
        '.php': r'^\s*(//|#)\s*TODO', # PHP supports both // and #

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


def process_code_file(root, file, extension, credentials, stages, resolved_ticket_codes):
    file_path = os.path.join(root, file)
    try:
        with open(file_path, 'r+', encoding='utf-8') as code_file:
            line_contexts = []
            all_lines = code_file.readlines()
            line_number = 0
            for line in all_lines:
                if is_todo(line, extension):
                    # TODO J-all-214 this split will not work with multi-line comments
                    line_split = line.split('|', 1)
                    if len(line_split) > 1:
                        todo, comment = line_split
                        new_content = sync_comment(comment, credentials, stages)
                        description = get_description(new_content)
                        ticket_code = get_ticket_code(new_content, credentials)
                        line_context = {'ticket_code': ticket_code, 'description': description[3: -4],
                                        'line_number': line_number, 'line': line}
                        line_contexts.append(line_context)
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


if __name__ == "__main__":
    urlEnv = sys.argv[1] if len(sys.argv) > 1 else None
    if urlEnv == 'dev':
        api_url = DEV_API_URL
        json_path = DEV_SOURCES_CONFIG_FILE
        credentials_path = DEV_CREDENTIALS_FILE
    elif urlEnv == 'stage':
        json_path = STAGE_SOURCES_CONFIG_FILE
        api_url = STAGE_API_URL
        credentials_path = STAGE_CREDENTIALS_FILE
    else:
        json_path = SOURCES_CONFIG_FILE
        api_url = PRODUCTION_API_URL
        credentials_path = CREDENTIALS_FILE
    credentials = get_credentials(credentials_path)
    config = None
    try:
        with open(json_path, 'r') as f:
            config = json.load(f)
    except FileNotFoundError:
        print(f"❌ Error: Configuration file '{json_path}' not found.")
    except json.JSONDecodeError as error:
        print(f"❌ Error:CLISecret Could not parse JSON from '{json_path}':")
        print(error)

    secret_key = credentials.get('secret_key')
    secret_key_id = credentials.get('secret_key_id')

    if secret_key is None:
        print("   -> ❌ Error: 'secret_key' not found in credentials file.")
    if secret_key_id is None:
        print("   -> ❌ Error: 'secret_key_id' not found in credentials file.")
    
    workspace_id = config.get('workspaceId')
    view_id = config.get('todoViewId')
    if workspace_id is None:
        print(f"⚠️ Warning: No workspaceId in config.")
    if view_id is None:
        view_id = workspace_id
        print(f"     ---\n{view_id}\n     ---")

    if secret_key is not None and secret_key_id is not None  and workspace_id is not None:
        credentials['view_id'] = view_id
        credentials['workspace_id'] = workspace_id
        credentials['api_url'] = api_url

        response = login(credentials)
        if response is None or 'uclusion_token' not in response:
            print("   -> ❌ Error: login failed.")
        else:
            credentials['api_token'] = response['uclusion_token']
            credentials['ui_url'] = response['ui_url']
            credentials['user_id'] = response['user_id']
            stages = response['stages']

            if credentials is not None and config is not None:
                write_uclusion_md(config, credentials)
                process_source_directories(stages, config, credentials)