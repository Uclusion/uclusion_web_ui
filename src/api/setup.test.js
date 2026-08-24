import { getLogin } from './homeAccount';
import { decideSetup, getSetup, getSetupUrl } from './setup';

jest.mock('./homeAccount', () => ({
  getLogin: jest.fn(),
}));

jest.mock('../config', () => ({
  api_configuration: {
    baseURL: 'https://dev.api.uclusion.com/v1',
  },
}));

const pendingResponse = {
  setup_id: 'opaque-id',
  state: 'PENDING',
  proposal: {
    workspace_name: 'My workspace',
    client: 'codex',
    scope: 'project',
    token_audit: false,
    work_claims: false,
    project_label: 'uclusion',
    verifier: 'must-not-escape',
  },
  expires_at: '2026-08-23T20:00:00Z',
  approver: {
    name: 'Ada',
    email: 'ada@example.com',
    account_id: 'account-id',
    shared_secret: 'must-not-escape',
  },
  shared_secret: 'must-not-escape',
};

function response(status, data) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(data),
  };
}

describe('setup API', () => {
  beforeEach(() => {
    getLogin.mockReset().mockResolvedValue({ uclusion_token: 'account-token' });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('uses the users subdomain, preserves the API base path, and encodes the setup id', () => {
    expect(getSetupUrl('opaque id')).toBe('https://users.dev.api.uclusion.com/v1/setup/opaque%20id');
  });

  it('fetches only an allowlisted safe proposal with the existing account authorization', async () => {
    fetch.mockResolvedValue(response(200, pendingResponse));

    const setup = await getSetup('opaque-id');

    expect(fetch).toHaveBeenCalledWith(
      'https://users.dev.api.uclusion.com/v1/setup/opaque-id',
      expect.objectContaining({
        method: 'GET',
        cache: 'no-store',
        headers: expect.objectContaining({ Authorization: 'account-token' }),
      })
    );
    expect(setup).toEqual({
      setup_id: 'opaque-id',
      state: 'PENDING',
      proposal: {
        workspace_name: 'My workspace',
        client: 'codex',
        scope: 'project',
        token_audit: false,
        work_claims: false,
        project_label: 'uclusion',
      },
      expires_at: '2026-08-23T20:00:00Z',
      approver: {
        name: 'Ada',
        email: 'ada@example.com',
        account_id: 'account-id',
      },
      reason: undefined,
    });
    expect(JSON.stringify(setup)).not.toContain('must-not-escape');
  });

  it('posts only the explicit decision and maps wrong-account errors without exposing backend text', async () => {
    fetch.mockResolvedValue(response(403, {
      error_code: 'WRONG_ACCOUNT',
      error_message: 'This setup was approved by a different account.',
      shared_secret: 'must-not-escape',
    }));

    const setup = await decideSetup('opaque-id', 'DENY');

    expect(fetch).toHaveBeenCalledWith(
      'https://users.dev.api.uclusion.com/v1/setup/opaque-id',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ decision: 'DENY' }),
      })
    );
    expect(setup).toEqual({ state: 'WRONG_ACCOUNT' });
  });

  it('rejects a response for a different setup id instead of displaying its proposal', async () => {
    fetch.mockResolvedValue(response(200, { ...pendingResponse, setup_id: 'different-id' }));

    await expect(getSetup('opaque-id')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('rejects a malformed expiry instead of rendering an invalid date', async () => {
    fetch.mockResolvedValue(response(200, { ...pendingResponse, expires_at: 'not-a-date' }));

    await expect(getSetup('opaque-id')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('refreshes a decision conflict so a concurrent terminal state is displayed', async () => {
    fetch
      .mockResolvedValueOnce(response(409, {
        error_code: 'SETUP_TERMINAL',
        error_message: 'This setup decision can no longer be changed.',
      }))
      .mockResolvedValueOnce(response(200, { ...pendingResponse, state: 'CONSUMED' }));

    const setup = await decideSetup('opaque-id', 'APPROVE');

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[1][1]).toEqual(expect.objectContaining({ method: 'GET' }));
    expect(setup.state).toBe('CONSUMED');
  });

  it('treats an unavailable federated account as finishing rather than leaking its error', async () => {
    getLogin.mockRejectedValue(new Error('raw provisioning failure'));

    await expect(getSetup('opaque-id')).rejects.toMatchObject({
      code: 'FINISHING_ACCOUNT',
      retryable: true,
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
