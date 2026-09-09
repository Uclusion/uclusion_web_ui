#!/usr/bin/python3
"""Disposable Uclusion demo MCP. Authorization proof exists only in memory."""

import argparse
import base64
import hashlib
import http.client
import json
import secrets
import sys
import urllib.error
import urllib.request
import uuid


ENVIRONMENTS = ('dev', 'stage', 'production')
ALLOWED_TOOLS = frozenset({
    'get_job', 'find_work', 'ask_question', 'add_options', 'update_option',
    'approve_job_or_option', 'resolve', 'add_info', 'set_design_capsule',
    'add_view_note', 'ask_for_review', 'make_suggestion', 'export_demo',
})
READ_TOOLS = frozenset({'get_job', 'find_work', 'export_demo'})
MAX_RESPONSE_BYTES = 2 * 1024 * 1024


class DemoError(Exception):
    """Only fixed, public messages may cross the local MCP boundary."""


class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, _request, _fp, _code, _message, _headers, _url):
        return None


def request_json(url, payload=None):
    request = urllib.request.Request(
        url,
        data=None if payload is None else json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'Accept': 'application/json'},
        method='GET' if payload is None else 'POST',
    )
    try:
        try:
            response = urllib.request.build_opener(NoRedirectHandler()).open(
                request, timeout=25,
            )
        except urllib.error.HTTPError as error:
            response = error
        with response:
            body = response.read(MAX_RESPONSE_BYTES + 1)
            if len(body) > MAX_RESPONSE_BYTES:
                raise ValueError('oversize')
            parsed = json.loads(body)
            if not isinstance(parsed, dict):
                raise ValueError('not an object')
            return response.code, parsed
    except (OSError, ValueError, urllib.error.URLError, http.client.HTTPException) as error:
        raise DemoError('The demo service could not return a valid response.') from error


def tool_result(payload, is_error=False):
    return {
        'content': [{'type': 'text', 'text': json.dumps(payload)}],
        'isError': is_error,
    }


class DemoService:
    def __init__(self, environment, requester=request_json):
        if environment not in ENVIRONMENTS:
            raise ValueError('unknown environment')
        self.sso_url = f'https://sso.{environment}.api.uclusion.com/v1/ai-demo'
        self.api_url = f'https://investibles.{environment}.api.uclusion.com/v1/ai-demo'
        self.requester = requester
        self.demo_id = None
        self.verifier = None
        self.ready = False

    def _public(self, value):
        # Normal MCP records pass through intact, but never an echoed proof.
        if self.verifier and self.verifier in json.dumps(value):
            raise DemoError('The demo service returned an invalid response.')
        return value

    def _reject_deleted(self, status, response):
        if status == 410 and response.get('error_code') == 'DELETED':
            self.demo_id = None
            self.ready = False
            raise DemoError('This demo is no longer available. Call start_demo for a fresh demo.')

    def tools(self):
        status, catalog = self.requester(self.api_url + '/tools')
        tools = catalog.get('tools')
        if (
            status != 200 or not isinstance(tools, list)
            or any(not isinstance(tool, dict) for tool in tools)
            or {tool.get('name') for tool in tools} != ALLOWED_TOOLS
            or len(tools) != len(ALLOWED_TOOLS)
            or any(not isinstance(tool.get('inputSchema'), dict) for tool in tools)
        ):
            raise DemoError('The demo tool catalog is unavailable. Retry tools/list.')
        return [{
            'name': 'start_demo',
            'description': (
                'Start or check a disposable Uclusion demo with no time limit. Follow the '
                'AI-visible view note using real collaboration tools. The human '
                'participant supplies predefined scenario responses.'
            ),
            'inputSchema': {'type': 'object', 'properties': {}, 'additionalProperties': False},
        }] + tools

    def start(self, arguments):
        if arguments != {}:
            raise DemoError('start_demo takes no arguments.')
        if self.demo_id is None:
            self.demo_id = str(uuid.uuid4())
            self.verifier = secrets.token_urlsafe(32)
            self.ready = False
        challenge = base64.urlsafe_b64encode(
            hashlib.sha256(self.verifier.encode('ascii')).digest()
        ).decode('ascii').rstrip('=')
        status, result = self.requester(self.sso_url, {
            'demo_id': self.demo_id, 'code_challenge': challenge,
        })
        self._reject_deleted(status, result)
        if status not in (200, 202):
            raise DemoError('Demo allocation could not complete. Retry start_demo.')
        status, result = self.requester(self.sso_url + '/' + self.demo_id + '/status', {
            'verifier': self.verifier,
        })
        self._reject_deleted(status, result)
        if status not in (200, 202) or result.get('demo_id') != self.demo_id:
            raise DemoError('The demo service returned an invalid status. Retry start_demo.')
        state = result.get('state')
        if state == 'FAILED':
            self.demo_id = None
            self.ready = False
            raise DemoError('Demo creation failed. Call start_demo for a fresh demo.')
        payload = {'demo_id': self.demo_id, 'state': state}
        if state == 'PROVISIONING':
            payload.update({
                'retry_after_seconds': 3,
                'next': 'Wait briefly, then call start_demo again for this same demo.',
            })
            return tool_result(payload)
        if state != 'READY':
            raise DemoError('The demo service returned an invalid status. Retry start_demo.')
        if (
            not all(isinstance(result.get(key), str) and result[key] for key in (
                'workspace_id', 'view_id', 'instructions', 'scenario_version',
            ))
            or not isinstance(result.get('starting_job_short_codes'), list)
            or not result['starting_job_short_codes']
            or not all(isinstance(code, str) for code in result['starting_job_short_codes'])
        ):
            raise DemoError('The demo service returned invalid scenario details.')
        payload.update({key: result[key] for key in (
            'workspace_id', 'view_id', 'starting_job_short_codes',
            'scenario_version', 'instructions',
        )})
        payload['tools'] = self.tools()
        self._public(payload)
        self.ready = True
        return tool_result(payload)

    def call(self, request):
        params = request.get('params', {})
        name = params.get('name')
        if name == 'start_demo':
            return {'jsonrpc': '2.0', 'id': request['id'], 'result': self.start(params.get('arguments', {}))}
        if name not in ALLOWED_TOOLS:
            raise DemoError('This tool is unavailable in the programmed demo.')
        if not self.ready:
            raise DemoError('Call start_demo and wait for READY before using collaboration tools.')
        try:
            status, response = self.requester(self.api_url + '/' + self.demo_id + '/mcp', {
                'verifier': self.verifier, 'request': request,
            })
            self._reject_deleted(status, response)
            if (
                status != 200 or response.get('jsonrpc') != '2.0'
                or response.get('id') != request['id']
                or (('result' in response) == ('error' in response))
            ):
                raise DemoError('The demo service did not confirm the tool result.')
            return self._public(response)
        except DemoError as error:
            # A confirmed deletion already supplied the fresh-start instruction.
            if name not in READ_TOOLS and self.demo_id is not None:
                raise DemoError(
                    'The write outcome is unconfirmed. Inspect the demo records '
                    'with get_job before deciding whether to repeat it. '
                    'If the demo is no longer available, its result cannot be verified.'
                ) from error
            raise


def serve(service, source=sys.stdin, output=sys.stdout):
    for line in source:
        try:
            request = json.loads(line)
        except ValueError:
            continue
        if not isinstance(request, dict) or 'id' not in request:
            continue
        response = {'jsonrpc': '2.0', 'id': request['id']}
        method = request.get('method')
        try:
            if method == 'initialize':
                response['result'] = {
                    'protocolVersion': '2024-11-05',
                    'capabilities': {'tools': {}},
                    'serverInfo': {'name': 'Uclusion Demo', 'version': '1'},
                    'instructions': (
                        'Call start_demo and read its referenced AI-visible scenario view note. '
                        'The simulated human supplies fixed responses; do not ask '
                        'the real human to play that role. Keep all observations '
                        'and the complete assessment readable in the conversation. '
                        'Keep this MCP process running: restarting it loses its '
                        'memory-only private proof and requires a fresh demo. Never request '
                        'or display proof or account credentials.'
                    ),
                }
            elif method == 'ping':
                response['result'] = {}
            elif method == 'tools/list':
                response['result'] = {'tools': service.tools()}
            elif method == 'tools/call' and isinstance(request.get('params'), dict):
                response = service.call(request)
            else:
                response['error'] = {'code': -32601, 'message': 'Method not found'}
        except DemoError as error:
            if method == 'tools/call':
                response['result'] = tool_result({'message': str(error)}, True)
            else:
                response['error'] = {'code': -32603, 'message': str(error)}
        except Exception:
            response['error'] = {'code': -32603, 'message': 'The demo request could not complete safely.'}
        output.write(json.dumps(response, separators=(',', ':')) + '\n')
        output.flush()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('environment', choices=ENVIRONMENTS)
    args = parser.parse_args()
    serve(DemoService(args.environment))


if __name__ == '__main__':
    main()
