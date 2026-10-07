#!/usr/bin/python3
"""Count the tokens of every artifact Uclusion ships, once per release.

The session-log breakdown (``uclusion usage`` and the per-run lines in a job's
audit note) charges Uclusion's skills, bootstrap blocks and MCP tool
definitions at their exact token counts. Customers never run a tokenizer or
need an API key for that: this script counts each artifact with each
provider's own token counter and writes ``public/scripts/token-manifest.json``,
which ships and is pinned with the rest of the workflow bundle.

Content that changes from call to call, such as MCP framing and export output,
is converted from its size with a bytes-per-token ratio this script measures on
real Uclusion output (a workspace export).

Usage:
    ANTHROPIC_API_KEY=... OPENAI_API_KEY=... python3 countArtifactTokens.py \\
        --environment stage --sample-export ~/.uclusion/export/<workspace>.md

Afterwards refresh the ``token_manifest`` entry in WORKFLOW_ASSET_SHA256 and run
``python3 checkWorkflowAssetPins.py public/scripts``.
"""

import argparse
import hashlib
import importlib.util
import json
import os
import sys
import time
import urllib.error
import urllib.request

ANTHROPIC_COUNT_URL = 'https://api.anthropic.com/v1/messages/count_tokens'
OPENAI_COUNT_URL = 'https://api.openai.com/v1/responses/input_tokens'
STANDARD_CLI_COMMANDS = ('uclusion', 'uclusion -e stage', 'uclusion -e dev')
SKILL_ASSETS = (
    'skill', 'job_reference', 'pokes_reference', 'reading_reference',
    'operations_reference', 'completion_reference', 'audit_reference', 'claims_reference',
    'uploads_reference', 'design_skill', 'design_examples',
)
SAMPLE_CHUNK_BYTES = 8192
SAMPLE_CHUNKS = 24
DUMMY_TOOL = {
    'name': 'noop',
    'description': 'No operation.',
    'input_schema': {'type': 'object', 'properties': {}},
}


def load_module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None:
        raise RuntimeError(f'{path} is missing')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def post_json(url, headers, body, attempts=5):
    data = json.dumps(body).encode('utf-8')
    for attempt in range(attempts):
        request = urllib.request.Request(
            url, data=data, headers={**headers, 'content-type': 'application/json'},
            method='POST',
        )
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                return json.loads(response.read().decode('utf-8'))
        except urllib.error.HTTPError as error:
            if error.code in (429, 500, 502, 503, 529) and attempt + 1 < attempts:
                time.sleep(2 ** attempt)
                continue
            detail = error.read().decode('utf-8', errors='replace')[:500]
            raise RuntimeError(f'{url}: HTTP {error.code}: {detail}') from error
    raise RuntimeError(f'{url}: gave up after {attempts} attempts')


class AnthropicCounter:
    family = 'claude'

    def __init__(self, api_key, model):
        self.model = model
        self.headers = {
            'x-api-key': api_key,
            'anthropic-version': '2023-06-01',
        }
        self.text_base = self._count([{'role': 'user', 'content': 'a'}]) - 1
        self.tool_base = self._count(
            [{'role': 'user', 'content': 'a'}], [DUMMY_TOOL]
        )

    def _count(self, messages, tools=None):
        body = {'model': self.model, 'messages': messages}
        if tools:
            body['tools'] = tools
        return post_json(ANTHROPIC_COUNT_URL, self.headers, body)['input_tokens']

    def text(self, text):
        return self._count([{'role': 'user', 'content': text}]) - self.text_base

    def tool(self, name, description, input_schema):
        # Anthropic rejects these MCP schemas rather than counting them.
        # Retain the original definition and let the analyzer mark its
        # measured bytes-per-token fallback as estimated.
        if any(keyword in (input_schema or {}) for keyword in ('oneOf', 'allOf', 'anyOf')):
            return None
        tool = {
            'name': name,
            'description': description or '',
            'input_schema': input_schema or {'type': 'object', 'properties': {}},
        }
        return self._count(
            [{'role': 'user', 'content': 'a'}], [DUMMY_TOOL, tool]
        ) - self.tool_base


class OpenAICounter:
    family = 'openai'

    def __init__(self, api_key, model):
        self.model = model
        self.headers = {'authorization': f'Bearer {api_key}'}
        self.text_base = self._count('a') - 1
        self.tool_base = self._count('a', [self._function(DUMMY_TOOL['name'],
                                                         DUMMY_TOOL['description'],
                                                         DUMMY_TOOL['input_schema'])])

    @staticmethod
    def _function(name, description, input_schema):
        return {
            'type': 'function',
            'name': name,
            'description': description or '',
            'parameters': input_schema or {'type': 'object', 'properties': {}},
        }

    def _count(self, text, tools=None):
        body = {'model': self.model, 'input': text}
        if tools:
            body['tools'] = tools
        return post_json(OPENAI_COUNT_URL, self.headers, body)['input_tokens']

    def text(self, text):
        return self._count(text) - self.text_base

    def tool(self, name, description, input_schema):
        dummy = self._function(
            DUMMY_TOOL['name'], DUMMY_TOOL['description'], DUMMY_TOOL['input_schema']
        )
        return self._count(
            'a', [dummy, self._function(name, description, input_schema)]
        ) - self.tool_base


def shipped_artifacts(installer, token_audit, scripts_dir):
    """Every artifact text a client can show, keyed by its sha256."""
    artifacts = {}

    def read(key):
        with open(os.path.join(scripts_dir, installer.WORKFLOW_ASSET_PATHS[key]),
                  encoding='utf-8') as handle:
            return handle.read()

    def add(kind, name, text):
        if text and text.strip():
            digest = hashlib.sha256(text.encode('utf-8')).hexdigest()
            artifacts.setdefault(digest, {'kind': kind, 'name': name, 'text': text})

    for key in SKILL_ASSETS:
        text = read(key)
        add('skill', installer.WORKFLOW_ASSET_PATHS[key], text)
        # Claude Code's Skill tool presents a skill without its frontmatter.
        add('skill', installer.WORKFLOW_ASSET_PATHS[key] + ', frontmatter removed',
            token_audit.without_frontmatter(text))
        useful = token_audit.without_audit_diagnostics(text)
        if useful != text:
            add('skill', installer.WORKFLOW_ASSET_PATHS[key] + ', audit removed',
                useful)
            add('skill', installer.WORKFLOW_ASSET_PATHS[key]
                + ', frontmatter and audit removed',
                token_audit.without_frontmatter(useful))
    for client, key in installer.CLIENT_STUB_ASSET.items():
        stub = read(key)
        for cli in STANDARD_CLI_COMMANDS:
            rendered = stub.replace(installer.WORKFLOW_ENV_PLACEHOLDER, cli)
            # As written (Codex, Cursor) and as Claude Code presents it.
            add('bootstrap', f'{client} stub ({cli})',
                token_audit.bootstrap_block(rendered))
            add('bootstrap', f'{client} stub ({cli}), comments removed',
                token_audit.bootstrap_block(
                    token_audit.without_html_comments(rendered)))
            block = token_audit.bootstrap_block(rendered)
            useful = token_audit.without_audit_diagnostics(block)
            if useful != block:
                add('bootstrap', f'{client} stub ({cli}), audit removed', useful)
                add('bootstrap', f'{client} stub ({cli}), comments and audit removed',
                    token_audit.without_html_comments(useful))
    return artifacts


def fetch_tool_definitions(scripts_dir, environment, workspace_id):
    """The unfiltered tools/list, plus the proxy's own claim_work tool."""
    proxy = load_module(os.path.join(scripts_dir, 'uclusionMCPProxy.py'),
                        'count_tokens_proxy')
    api_url = {
        'dev': proxy.DEV_API_URL,
        'stage': proxy.STAGE_API_URL,
        'production': proxy.PRODUCTION_API_URL,
    }[environment]
    credentials_path = {
        'dev': proxy.DEV_CREDENTIALS_FILE,
        'stage': proxy.STAGE_CREDENTIALS_FILE,
        'production': proxy.CREDENTIALS_FILE,
    }[environment]
    credentials = proxy.get_credentials(credentials_path)
    if credentials is None:
        raise RuntimeError(f'no {environment} credentials')
    credentials['workspace_id'] = workspace_id
    token = proxy.login(api_url, credentials)['uclusion_token']
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': token,
    }
    body = json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': 'tools/list'})
    response = proxy.post_to_mcp(
        'https://investibles.' + api_url + '/mcp', headers, body
    )
    message = proxy.read_mcp_response(response)
    tools = list((message or {}).get('result', {}).get('tools') or [])
    tools.append(proxy.WORK_CLAIM_TOOL)
    return tools


def sample_chunks(path):
    with open(path, encoding='utf-8') as handle:
        text = handle.read()
    if len(text) < SAMPLE_CHUNK_BYTES:
        return [text]
    step = max(SAMPLE_CHUNK_BYTES, len(text) // SAMPLE_CHUNKS)
    return [
        text[offset:offset + SAMPLE_CHUNK_BYTES]
        for offset in range(0, len(text) - SAMPLE_CHUNK_BYTES, step)
    ][:SAMPLE_CHUNKS]


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    parser.add_argument('--scripts', default='public/scripts')
    parser.add_argument('--environment', choices=('dev', 'stage', 'production'),
                        required=True, help='Where to read the MCP tool list from.')
    parser.add_argument('--workspace-id', default=None,
                        help='Workspace to authenticate with. Defaults to the '
                             'environment config\'s workspace.')
    parser.add_argument('--sample-export', required=True,
                        help='A workspace export used to measure bytes per token.')
    parser.add_argument('--claude-model', default='claude-opus-5-5')
    parser.add_argument('--openai-model', default='gpt-5.5')
    parser.add_argument('--output', default=None)
    args = parser.parse_args(argv)

    scripts_dir = os.path.abspath(args.scripts)
    installer = load_module(os.path.join(scripts_dir, 'uclusionInstall.py'),
                            'count_tokens_installer')
    token_audit = load_module(os.path.join(scripts_dir, 'uclusionTokenAudit.py'),
                              'count_tokens_audit')
    workspace_id = args.workspace_id
    if workspace_id is None:
        config_name = installer.CONFIG_FILES[args.environment]
        with open(os.path.join(installer.UCLUSION_HOME, config_name),
                  encoding='utf-8') as handle:
            workspace_id = json.load(handle)['workspaceId']

    missing = [name for name in ('ANTHROPIC_API_KEY', 'OPENAI_API_KEY')
               if not os.environ.get(name)]
    if missing:
        sys.stderr.write('Set ' + ' and '.join(missing) + ' to count tokens.\n')
        return 2
    counters = (
        AnthropicCounter(os.environ['ANTHROPIC_API_KEY'], args.claude_model),
        OpenAICounter(os.environ['OPENAI_API_KEY'], args.openai_model),
    )

    manifest = {
        'schema_version': 1,
        'method': 'provider_count_endpoints_v1',
        'models': {counter.family: counter.model for counter in counters},
        'bytes_per_token': {},
        'artifacts': {},
        'tools': {},
    }
    for digest, artifact in sorted(
        shipped_artifacts(installer, token_audit, scripts_dir).items()
    ):
        manifest['artifacts'][digest] = {
            'kind': artifact['kind'],
            'name': artifact['name'],
            'bytes': len(artifact['text'].encode('utf-8')),
            'tokens': {
                counter.family: counter.text(artifact['text'])
                for counter in counters
            },
        }
        print(f"  {artifact['name']}: {manifest['artifacts'][digest]['tokens']}")
    for tool in fetch_tool_definitions(scripts_dir, args.environment, workspace_id):
        name = tool.get('name')
        description = tool.get('description')
        schema = tool.get('inputSchema') or {}
        key = token_audit.tool_definition_key(name, description, schema)
        manifest['tools'][key] = {
            'name': name,
            'tokens': {
                counter.family: counter.tool(
                    'mcp__Uclusion__' + name, description, schema
                )
                for counter in counters
            },
        }
        unavailable = {family: 'unsupported_input_schema'
                       for family, tokens in manifest['tools'][key]['tokens'].items()
                       if tokens is None}
        if unavailable:
            manifest['tools'][key]['unavailable'] = unavailable
        print(f"  tool {name}: {manifest['tools'][key]['tokens']}")
    chunks = sample_chunks(os.path.expanduser(args.sample_export))
    sample_bytes = sum(len(chunk.encode('utf-8')) for chunk in chunks)
    for counter in counters:
        tokens = sum(counter.text(chunk) for chunk in chunks)
        manifest['bytes_per_token'][counter.family] = round(
            sample_bytes / max(tokens, 1), 3
        )
    print(f"  bytes per token: {manifest['bytes_per_token']}")

    output = args.output or os.path.join(scripts_dir, 'token-manifest.json')
    with open(output, 'w', encoding='utf-8') as handle:
        json.dump(manifest, handle, indent=1, sort_keys=True)
        handle.write('\n')
    with open(output, encoding='utf-8') as handle:
        digest = hashlib.sha256(handle.read().encode('utf-8')).hexdigest()
    print(f'Wrote {output}\nSet WORKFLOW_ASSET_SHA256["token_manifest"] = {digest!r}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
