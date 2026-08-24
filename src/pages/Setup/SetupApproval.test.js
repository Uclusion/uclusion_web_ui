import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import messages from '../../config/locales/en';
import { decideSetup, getSetup } from '../../api/setup';
import SetupApproval from './SetupApproval';

jest.mock('../../api/setup', () => ({
  decideSetup: jest.fn(),
  getSetup: jest.fn(),
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
const baseSetup = {
  setup_id: 'opaque-id',
  proposal,
  approver,
  expires_at: '2026-08-23T20:00:00Z',
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
    [{ state: 'CONSUMED' }, 'Setup complete'],
    [{ state: 'WRONG_ACCOUNT' }, 'Different account'],
  ])('renders terminal state %j without decision controls', async (state, expected) => {
    await renderSetup(state.state === 'WRONG_ACCOUNT' ? state : { ...baseSetup, ...state });

    expect(container.textContent).toContain(expected);
    expect(container.querySelector('#setupApproveButton')).toBeNull();
    expect(container.querySelector('#setupDenyButton')).toBeNull();
  });

  it('submits only after an explicit approval click and then renders the terminal result', async () => {
    await renderSetup({ ...baseSetup, state: 'PENDING' });
    decideSetup.mockResolvedValue({ ...baseSetup, state: 'APPROVED' });

    await act(async () => {
      container.querySelector('#setupApproveButton').click();
      await flushPromises();
    });

    expect(decideSetup).toHaveBeenCalledWith('opaque-id', 'APPROVE');
    expect(container.textContent).toContain('Setup approved');
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
});
