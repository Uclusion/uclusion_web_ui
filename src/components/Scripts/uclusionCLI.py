import json
import os
import re


# Define the names of the configuration file and the target file
SOURCES_CONFIG_FILE = 'uclusion.json'
TARGET_FILENAME = 'uclusion.txt'


def sync_comment(comment):
    print(f"  ✅ Processing: '{comment}'")


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


def process_uclusion_txt(root):
    file_path = os.path.join(root, TARGET_FILENAME)
    print(f"  ✅ Processing: '{file_path}'")
    try:
        with open(file_path, 'r', encoding='utf-8') as uclusion_file:
            content = uclusion_file.read()
            comments = content.split('|')
            if len(comments) > 1:
                for comment in comments:
                    if content.startswith(comment):
                        # Handle the case that some text before the first |
                        continue
                    sync_comment(comment)
    except Exception as e:
        print(f"     -> ❌ Error reading file: {e}")


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


def process_code_file(root, file, extension):
    file_path = os.path.join(root, file)
    try:
        with open(file_path, 'r', encoding='utf-8') as code_file:
            for line in code_file:
                if is_todo(line, extension):
                    line_split = line.split('|', 1)
                    if len(line_split) > 1:
                        todo, comment = line_split
                        sync_comment(comment)
    except Exception as e:
        print(f"     -> ❌ Error reading file {file}: {e}")


def process_source_directories():
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
                    process_uclusion_txt(root)
                else:
                    file_name, file_extension = os.path.splitext(file)
                    if len(file_extension) > 1 and file_extension[1:] in extensions:
                        total_code_files_found += 1
                        process_code_file(root, file, file_extension)

    print(f"\n🏁 Processed {total_notes_files_found} {TARGET_FILENAME} and {total_code_files_found} code files.")
    return None


if __name__ == "__main__":
    process_source_directories()