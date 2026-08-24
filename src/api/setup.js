import config from '../config';
import { getLogin } from './homeAccount';

const REQUEST_TIMEOUT_MS = 15000;
const SETUP_STATES = new Set(['PENDING', 'APPROVED', 'DENIED', 'COMPLETING', 'CONSUMED']);

export class SetupApiError extends Error {
  constructor(code, retryable = false) {
    super(code);
    this.name = 'SetupApiError';
    this.code = code;
    this.retryable = retryable;
  }
}

export function getSetupUrl(setupId) {
  const url = new URL(`${config.api_configuration.baseURL}/setup/${encodeURIComponent(setupId)}`);
  url.hostname = `users.${url.hostname}`;
  return url.toString();
}

function safeIdentity(value) {
  if (!value || typeof value !== 'object' || typeof value.name !== 'string' ||
    typeof value.email !== 'string' || typeof value.account_id !== 'string') {
    return undefined;
  }
  return {
    name: value.name,
    email: value.email,
    account_id: value.account_id,
  };
}

function safeProposal(value) {
  if (!value || typeof value !== 'object' || typeof value.workspace_name !== 'string' ||
    !['claude', 'cursor', 'codex'].includes(value.client) ||
    !['global', 'project'].includes(value.scope) || typeof value.token_audit !== 'boolean' ||
    typeof value.work_claims !== 'boolean') {
    return undefined;
  }
  return {
    workspace_name: value.workspace_name,
    client: value.client,
    scope: value.scope,
    token_audit: value.token_audit,
    work_claims: value.work_claims,
    project_label: typeof value.project_label === 'string' ? value.project_label : undefined,
  };
}

function safeSetupResponse(value) {
  const state = SETUP_STATES.has(value?.state) ? value.state : undefined;
  const proposal = safeProposal(value?.proposal);
  const approver = safeIdentity(value?.approver);
  if (!state || typeof value.setup_id !== 'string' || !proposal || !approver ||
    typeof value.expires_at !== 'string' || !Number.isFinite(Date.parse(value.expires_at))) {
    throw new SetupApiError('INVALID_RESPONSE');
  }
  return {
    setup_id: value.setup_id,
    state,
    proposal,
    expires_at: value.expires_at,
    approver,
    reason: ['EXPIRED', 'DENIED'].includes(value.reason) ? value.reason : undefined,
  };
}

async function readJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return {};
  }
}

function terminalErrorResponse(response, data, setupId) {
  if (response.status === 403 && data?.error_code === 'WRONG_ACCOUNT') {
    return { state: 'WRONG_ACCOUNT' };
  }
  if (response.status === 404) {
    return { state: 'NOT_FOUND' };
  }
  if (response.status === 409 && data?.error_code === 'SETUP_TERMINAL') {
    throw new SetupApiError('REFRESH_REQUIRED', true);
  }
  if ([409, 410].includes(response.status) && SETUP_STATES.has(data?.state)) {
    const setup = safeSetupResponse(data);
    if (setup.setup_id !== setupId) {
      throw new SetupApiError('INVALID_RESPONSE');
    }
    return setup;
  }
  return undefined;
}

function isRetryableStatus(status) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

async function setupToken() {
  try {
    const login = await getLogin();
    if (!login?.uclusion_token) {
      throw new Error('Account is not ready');
    }
    return login.uclusion_token;
  } catch (error) {
    // Federated account creation is asynchronous. The setup page owns the bounded polling UI.
    throw new SetupApiError('FINISHING_ACCOUNT', true);
  }
}

async function requestSetup(setupId, decision) {
  const token = await setupToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const options = {
    method: decision ? 'POST' : 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: token,
      ...(decision ? { 'Content-Type': 'application/json;charset=UTF-8' } : {}),
    },
    cache: 'no-store',
    signal: controller.signal,
  };
  if (decision) {
    options.body = JSON.stringify({ decision });
  }

  let response;
  try {
    response = await fetch(getSetupUrl(setupId), options);
  } catch (error) {
    throw new SetupApiError('RETRYABLE', true);
  } finally {
    clearTimeout(timeout);
  }

  const data = await readJson(response);
  if (response.ok) {
    const setup = safeSetupResponse(data);
    if (setup.setup_id !== setupId) {
      throw new SetupApiError('INVALID_RESPONSE');
    }
    return setup;
  }
  const terminal = terminalErrorResponse(response, data, setupId);
  if (terminal) {
    return terminal;
  }
  throw new SetupApiError(isRetryableStatus(response.status) ? 'RETRYABLE' : 'UNAVAILABLE',
    isRetryableStatus(response.status));
}

export function getSetup(setupId) {
  return requestSetup(setupId);
}

export function decideSetup(setupId, decision) {
  if (!['APPROVE', 'DENY'].includes(decision)) {
    return Promise.reject(new SetupApiError('INVALID_DECISION'));
  }
  return requestSetup(setupId, decision).catch((error) => {
    if (error?.code === 'REFRESH_REQUIRED') {
      return requestSetup(setupId);
    }
    throw error;
  });
}
