import json
import os


# Define the names of the configuration file and the target file
SOURCES_CONFIG_FILE = 'uclusion.json'
TARGET_FILENAME = 'uclusion.txt'


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

    # --- 4. Read and print the file's content ---
    try:
        with open(file_path, 'r', encoding='utf-8') as uclusion_file:
            content = uclusion_file.read().strip()
            # Indent content for better readability
            indented_content = "\n".join([f"     | {line}" for line in content.split('\n')])
            print(f"     ---\n{indented_content}\n     ---")
    except Exception as e:
        print(f"     -> ❌ Error reading file: {e}")


def process_code_file(file):
    pass


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
                    if file_extension[1:] in extensions:
                        total_code_files_found += 1
                        process_code_file(file)

    print(f"\n🏁 Processed {total_notes_files_found} {TARGET_FILENAME} and {total_code_files_found} code files.")
    return None


if __name__ == "__main__":
    process_source_directories()