import json
import os
import re
import sys
import urllib.request


# Define the names of the configuration file and the target file
SOURCES_CONFIG_FILE = 'uclusion.json'
TARGET_FILENAME = 'uclusion.txt'
DEV_API_URL = "dev.api.uclusion.com/v1"
STAGE_API_URL = "stage.api.uclusion.com/v1"
PRODUCTION_API_URL = "production.api.uclusion.com/v1"


def send(data, method, my_api_url, auth=None):
    # Encode the data into JSON format
    json_data = json.dumps(data)
    json_data_as_bytes = json_data.encode('utf-8')  # Convert to bytes

    headers = {'Content-Type': 'application/json'}
    if auth is not None:
        headers['Authorization'] = auth

    # Create a Request object
    # The 'data' parameter in Request() is used for POST requests
    # We also need to set the 'Content-Type' header to 'application/json'
    req = urllib.request.Request(
        my_api_url,
        data=json_data_as_bytes,
        headers=headers,
        method=method
    )
    print(f"Sending to {my_api_url} and {method}")
    try:
        # Send the request and get the response
        with urllib.request.urlopen(req) as response:
            # Check the HTTP status code
            if response.status == 200 or response.status == 201:
                print(f"Successfully posted data. Status code: {response.status}")
                # Read and decode the response body
                response_body = response.read().decode('utf-8')
                print("Response Body:")
                print(response_body)
                # If the response is JSON, you can parse it
                response_json = json.loads(response_body)
                print("\nParsed JSON Response:")
                print(json.dumps(response_json, indent=2))
                return response_json
            else:
                print(f"Failed to post data. Status code: {response.status}")
                print(f"Response: {response.read().decode('utf-8')}")

    except urllib.request.HTTPError as e:
        print(f"Error making request: {e.reason}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")


def send_job(comment_stripped, credentials, is_assign=False, stage=None, is_ready=False):
    create_job_api_url = 'https://investibles.' + credentials['api_url'] + '/create'
    data = {
        'name': comment_stripped.splitlines()[0][0:79],
        'description': f"<p>{comment_stripped}</p>",
        'group_id': credentials['view_id']
    }
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


def process_job(comment_stripped, credentials, stages):
    comment_stripped_lower = comment_stripped.lower()
    if comment_stripped_lower.startswith('waiting'):
        job = process_waiting(token_split('waiting', comment_stripped), credentials, get_waiting_stage(stages))
    elif comment_stripped_lower.startswith('ready'):
        job = process_ready(token_split('ready', comment_stripped), credentials, get_ready_stage(stages))
    elif comment_stripped_lower.startswith('backlog_ready'):
        job = process_backlog_ready(token_split('backlog_ready', comment_stripped), credentials)
    elif comment_stripped_lower.startswith('backlog_not_ready'):
        job = process_backlog_not_ready(token_split('backlog_not_ready', comment_stripped), credentials)
    else:
        job = process_backlog_not_ready(comment_stripped, credentials)
    return job


def send_bug(notification_type, comment_stripped, credentials):
    create_bug_api_url = 'https://investibles.' + credentials['api_url'] + '/comment'
    data = {
        'group_id': credentials['view_id'],
        'body': comment_stripped,
        'notification_type': notification_type,
        'comment_type': 'TODO'
    }
    return send(data, 'POST', create_bug_api_url, credentials['api_token'])


def process_bug(comment_stripped, credentials):
    comment_stripped_lower = comment_stripped.lower()
    if comment_stripped_lower.startswith('critical'):
        bug = send_bug('RED', token_split('critical', comment_stripped), credentials)
    elif comment_stripped_lower.startswith('normal'):
        bug = send_bug('YELLOW', token_split('normal', comment_stripped), credentials)
    elif comment_stripped_lower.startswith('minor'):
        bug = send_bug('BLUE', token_split('minor', comment_stripped), credentials)
    else:
        bug = send_bug('BLUE', comment_stripped, credentials)
    return bug


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
    if comment_stripped_lower.startswith('bug'):
        bug = process_bug(token_split('bug', comment_stripped), credentials)
    else:
        bug = process_bug(comment_stripped, credentials)
    return bug


def get_credentials():
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
    cred_path = os.path.join(os.path.expanduser('~'), '.uclusion', 'credentials')

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


def add_bug_url_line(comment, credentials):
    return f"{credentials['ui_url']}/dialog/{comment['market_id']}?groupId={comment['group_id']}#c{comment['id']}\r\n"


def add_job_url_line(full_investible, credentials):
    return f"{credentials['ui_url']}/dialog/{credentials['workspace_id']}/{full_investible['investible']['id']}\r\n"


def process_uclusion_txt(root, credentials, stages):
    file_path = os.path.join(root, TARGET_FILENAME)
    print(f"  ✅ Processing: '{file_path}'")
    try:
        with open(file_path, 'r+', encoding='utf-8') as uclusion_file:
            content = uclusion_file.read()
            uclusion_file.seek(0)
            comments = content.split('|')
            if len(comments) > 1:
                new_file_content_lines = []
                for comment in comments:
                    if content.startswith(comment):
                        # Handle the case that some text before the first | by just keeping it
                        new_file_content_lines.append(comment)
                        continue
                    new_content = sync_comment(comment, credentials, stages)
                    if 'comment_type' in new_content:
                        new_file_content_lines.append(add_bug_url_line(new_content, credentials))
                    else:
                        new_file_content_lines.append(add_job_url_line(new_content, credentials))
                    uclusion_file.writelines(new_file_content_lines)

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


def process_code_file(root, file, extension, credentials, stages):
    file_path = os.path.join(root, file)
    try:
        with open(file_path, 'r', encoding='utf-8') as code_file:
            for line in code_file:
                if is_todo(line, extension):
                    line_split = line.split('|', 1)
                    if len(line_split) > 1:
                        todo, comment = line_split
                        sync_comment(comment, credentials, stages)
    except Exception as e:
        print(f"     -> ❌ Error reading file {file}: {e}")


def login(credentials):
    login_api_url = 'https://sso.' + credentials['api_url'] + '/cli'
    data = {
        'market_id': credentials['workspace_id'],
        'client_secret': credentials['secret_key'],
        'client_id': credentials['secret_key_id']
    }
    return send(data, 'POST', login_api_url)


def process_source_directories(api_url):
    """
    Reads source directories from a JSON config, recursively finds all TARGET_FILENAME files
    """
    print(f"🚀 Starting search for '{TARGET_FILENAME}' files and TODOs...")

    # Read and parse the SOURCES_CONFIG_FILE file
    try:
        with open(SOURCES_CONFIG_FILE, 'r') as f:
            config = json.load(f)
        source_dirs = config.get('sourcesList', [])
        if not source_dirs:
            print(f"⚠️ Warning: No source directories listed in '{SOURCES_CONFIG_FILE}'.")
            return None
        extensions = config.get('extensionsList', [])
        if not extensions:
            print(f"⚠️ Warning: No extensions listed in '{SOURCES_CONFIG_FILE}'.")
            return None
        workspace_id = config.get('workspaceId')
        view_id = config.get('viewId')
        if workspace_id is None:
            print(f"⚠️ Warning: No workspaceId in '{SOURCES_CONFIG_FILE}'.")
            return None
        if view_id is None:
            view_id = workspace_id
            print(f"     ---\n{view_id}\n     ---")
    except FileNotFoundError:
        print(f"❌ Error: Configuration file '{SOURCES_CONFIG_FILE}' not found.")
        return None
    except json.JSONDecodeError as error:
        print(f"❌ Error:CLISecret Could not parse JSON from '{SOURCES_CONFIG_FILE}':")
        print(error)
        return None

    credentials = get_credentials()

    if credentials is None:
        return None

    secret_key = credentials.get('secret_key')
    secret_key_id = credentials.get('secret_key_id')

    if secret_key is None:
        print("   -> ❌ Error: 'secret_key' not found in credentials file.")
        return None
    if secret_key_id is None:
        print("   -> ❌ Error: 'secret_key_id' not found in credentials file.")
        return None

    credentials['view_id'] = view_id
    credentials['workspace_id'] = workspace_id
    credentials['api_url'] = api_url

    response = login(credentials)
    credentials['api_token'] = response['uclusion_token']
    credentials['ui_url'] = response['ui_url']
    stages = response['stages']

    # Process each source directory
    total_notes_files_found = 0
    total_code_files_found = 0
    for directory in source_dirs:
        print(f"\n📁 Processing directory: '{directory}'")

        if not os.path.isdir(directory):
            print(f"   -> Skipping: Directory does not exist.")
            continue

        # Recursively walk the directory tree
        for root, _, files in os.walk(directory):
            for file in files:
                if TARGET_FILENAME == file:
                    total_notes_files_found += 1
                    process_uclusion_txt(root, credentials, stages)
                else:
                    file_name, file_extension = os.path.splitext(file)
                    if len(file_extension) > 1 and file_extension[1:] in extensions:
                        total_code_files_found += 1
                        process_code_file(root, file, file_extension, credentials, stages)

    print(f"\n🏁 Processed {total_notes_files_found} {TARGET_FILENAME} and {total_code_files_found} code files.")
    return None


if __name__ == "__main__":
    urlEnv = sys.argv[1]
    if urlEnv == 'dev':
        api_url = DEV_API_URL
    elif urlEnv == 'stage':
        api_url = STAGE_API_URL
    else:
        api_url = PRODUCTION_API_URL
    process_source_directories(api_url)