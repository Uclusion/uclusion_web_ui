import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import messages from '../../config/locales/en';
import { decideSetup, getSetup } from '../../api/setup';
import SetupApproval from './SetupApproval';

let mockLogoutGeneration = 'session-a';
let mockSignedOut = false;

jest.mock('../../api/setup', () => ({
  decideSetup: jest.fn(),
  getSetup: jest.fn(),
}));
jest.mock('../../utils/logoutState', () => ({
  getLogoutGeneration: () => mockLogoutGeneration,
  isLogoutGenerationCurrent: (generation) => generation === mockLogoutGeneration,
  isSignedOut: () => mockSignedOut,
}));

const proposal = {
  workspace_name: 'Agent workspace',
  client: 'codex',
  scope: 'project',
  project_label: 'uclusion-web-ui',
  token_audit: false,
  work_claims: false,
};
const approver = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  account_id: 'account-id',
};
const workspaceId = '00000000-0000-4000-8000-000000000001';
const viewId = '00000000-0000-4000-8000-000000000002';
const baseSetup = {
  setup_id: 'opaque-id',
  proposal,
  approver,
  expires_at: '2026-08-23T20:00:00Z',
};
const consumedSetup = {
  ...baseSetup,
  state: 'CONSUMED',
  workspace_id: workspaceId,
  view_id: viewId,
};
const previousActEnvironment = window.IS_REACT_ACT_ENVIRONMENT;

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('SetupApproval', () => {
  let container;
  let root;

  beforeAll(() => {
    window.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterAll(() => {
    window.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  });

  beforeEach(() => {
    getSetup.mockReset();
    decideSetup.mockReset();
    mockLogoutGeneration = 'session-a';
    mockSignedOut = false;
    container = document.createElement('div');
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    jest.useRealTimers();
  });

  async function renderSetup(setup, props = {}) {
    getSetup.mockResolvedValue(setup);
    await act(async () => {
      root.render(
        <IntlProvider locale="en" messages={messages}>
          <SetupApproval setupId="opaque-id" {...props} />
        </IntlProvider>
      );
      await flushPromises();
    });
  }

  it('shows the immutable proposal, account identity, and explicit Approve or Deny actions', async () => {
    const onAccountReady = jest.fn();
    await renderSetup({ ...baseSetup, state: 'PENDING' }, { onAccountReady });

    expect(container.textContent).toContain('Agent workspace');
    expect(container.textContent).toContain('Codex');
    expect(container.textContent).toContain('Current project — uclusion-web-ui');
    expect(container.textContent).toContain('Ada Lovelace');
    expect(container.textContent).toContain('ada@example.com');
    expect(container.querySelector('#setupApproveButton')).not.toBeNull();
    expect(container.querySelector('#setupDenyButton')).not.toBeNull();
    expect(container.querySelector('input')).toBeNull();
    expect(onAccountReady).toHaveBeenCalledTimes(1);
  });

  it.each([
    [{ state: 'APPROVED' }, 'Setup approved'],
    [{ state: 'DENIED', reason: 'DENIED' }, 'Setup denied'],
    [{ state: 'DENIED', reason: 'EXPIRED' }, 'Setup expired'],
    [consumedSetup, 'Setup complete'],
    [{ state: 'WRONG_ACCOUNT' }, 'Different account'],
  ])('renders non-pending state %j without decision controls', async (state, expected) => {
    await renderSetup(state.state === 'WRONG_ACCOUNT' ? state : { ...baseSetup, ...state });

    expect(container.textContent).toContain(expected);
    expect(container.querySelector('#setupApproveButton')).toBeNull();
    expect(container.querySelector('#setupDenyButton')).toBeNull();
  });

  it('submits only after an explicit approval click, then polls through completion', async () => {
    jest.useFakeTimers();
    const onSetupComplete = jest.fn().mockResolvedValue();
    await renderSetup({ ...baseSetup, state: 'PENDING' }, { onSetupComplete });
    decideSetup.mockResolvedValue({ ...baseSetup, state: 'APPROVED' });
    getSetup.mockResolvedValueOnce(consumedSetup);

    await act(async () => {
      container.querySelector('#setupApproveButton').click();
      await flushPromises();
    });

    expect(decideSetup).toHaveBeenCalledWith('opaque-id', 'APPROVE');
    expect(container.textContent).toContain('Setup approved');

    await act(async () => {
      jest.advanceTimersByTime(2000);
      await flushPromises();
    });
    expect(onSetupComplete).toHaveBeenCalledWith(consumedSetup, expect.any(Function));
  });

  it('offers a working account switch when another account owns the setup', async () => {
    const onSwitchAccount = jest.fn().mockResolvedValue();
    await renderSetup({ state: 'WRONG_ACCOUNT' }, { onSwitchAccount });

    await act(async () => {
      container.querySelector('#setupSwitchAccountButton').click();
      await flushPromises();
    });

    expect(onSwitchAccount).toHaveBeenCalledTimes(1);
  });

  it('polls while a federated account finishes provisioning', async () => {
    jest.useFakeTimers();
    getSetup
      .mockRejectedValueOnce(Object.assign(new Error('not ready'), {
        code: 'FINISHING_ACCOUNT',
        retryable: true,
      }))
      .mockResolvedValueOnce({ ...baseSetup, state: 'PENDING' });

    await act(async () => {
      root.render(
        <IntlProvider locale="en" messages={messages}>
          <SetupApproval setupId="opaque-id" />
        </IntlProvider>
      );
      await flushPromises();
    });
    expect(container.textContent).toContain('Finishing account setup');

    await act(async () => {
      jest.advanceTimersByTime(2000);
      await flushPromises();
    });

    expect(getSetup).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain('Agent workspace');
  });

  it('polls approved and completing states through consumed, then hands off exactly once', async () => {
    jest.useFakeTimers();
    const onSetupComplete = jest.fn().mockResolvedValue();
    getSetup
      .mockResolvedValueOnce({ ...baseSetup, state: 'APPROVED' })
      .mockResolvedValueOnce({ ...baseSetup, state: 'COMPLETING' })
      .mockResolvedValueOnce(consumedSetup);

    await act(async () => {
      root.render(
        <IntlProvider locale="en" messages={messages}>
          <SetupApproval setupId="opaque-id" onSetupComplete={onSetupComplete} />
        </IntlProvider>
      );
      await flushPromises();
    });

    await act(async () => {
      jest.advanceTimersByTime(2000);
      await flushPromises();
    });
    expect(container.textContent).toContain('finishing this setup');

    await act(async () => {
      jest.advanceTimersByTime(2000);
      await flushPromises();
    });

    expect(getSetup).toHaveBeenCalledTimes(3);
    expect(onSetupComplete).toHaveBeenCalledTimes(1);
    expect(onSetupComplete).toHaveBeenCalledWith(consumedSetup, expect.any(Function));

    await act(async () => {
      jest.advanceTimersByTime(6000);
      await flushPromises();
    });
    expect(getSetup).toHaveBeenCalledTimes(3);
    expect(onSetupComplete).toHaveBeenCalledTimes(1);
  });

  it('names the created workspace and preserves the completed page when automatic opening fails', async () => {
    const onSetupComplete = jest.fn().mockRejectedValue(new Error('market login failed'));

    await renderSetup(consumedSetup, { onSetupComplete });

    expect(onSetupComplete).toHaveBeenCalledWith(consumedSetup, expect.any(Function));
    expect(container.textContent).toContain('Agent workspace was created');
    expect(container.textContent).toContain('Reload this page to try again');
    expect(container.querySelector('button')).toBeNull();
  });

  it('does not present an intentional completion cancellation as an opening failure', async () => {
    const cancellation = new Error('setup page left');
    cancellation.cancelled = true;
    const onSetupComplete = jest.fn().mockRejectedValue(cancellation);

    await renderSetup(consumedSetup, { onSetupComplete });

    expect(container.textContent).toContain('Agent workspace was created');
    expect(container.textContent).not.toContain('Reload this page to try again');
  });

  it('ignores a consumed poll response from before rapid logout and login', async () => {
    let finishPoll;
    const poll = new Promise((resolve) => {
      finishPoll = resolve;
    });
    const onSetupComplete = jest.fn().mockResolvedValue();
    getSetup.mockReturnValue(poll);

    await act(async () => {
      root.render(
        <IntlProvider locale="en" messages={messages}>
          <SetupApproval setupId="opaque-id" onSetupComplete={onSetupComplete} />
        </IntlProvider>
      );
      await flushPromises();
    });

    mockSignedOut = true;
    mockLogoutGeneration = 'session-b';
    mockSignedOut = false;
    await act(async () => {
      finishPoll(consumedSetup);
      await flushPromises();
    });

    expect(onSetupComplete).not.toHaveBeenCalled();
    expect(container.textContent).not.toContain('Setup complete');
  });

  it('ignores a setup decision response from before rapid logout and login', async () => {
    let finishDecision;
    const decision = new Promise((resolve) => {
      finishDecision = resolve;
    });
    const onSetupComplete = jest.fn().mockResolvedValue();
    await renderSetup({ ...baseSetup, state: 'PENDING' }, { onSetupComplete });
    decideSetup.mockReturnValue(decision);

    act(() => container.querySelector('#setupApproveButton').click());
    mockSignedOut = true;
    mockLogoutGeneration = 'session-b';
    mockSignedOut = false;
    await act(async () => {
      finishDecision(consumedSetup);
      await flushPromises();
    });

    expect(onSetupComplete).not.toHaveBeenCalled();
    expect(container.textContent).not.toContain('Setup complete');
  });
});
