import { getAccountStorageManager } from './singletons';
import AmpifyIdentitySource from '../authorization/AmplifyIdentityTokenRefresher';
import uclusion from 'uclusion_sdk';
import {
  getLogoutGeneration,
  isLogoutGenerationCurrent,
  isSignedOut,
} from '../utils/logoutState';
import { getLogin, HOME_ACCOUNT_LOCK_NAME } from './homeAccount';

jest.mock('./singletons', () => ({
  getAccountStorageManager: jest.fn(),
}));
jest.mock('../authorization/AmplifyIdentityTokenRefresher');
jest.mock('uclusion_sdk', () => ({
  constructClient: jest.fn(),
  constructSSOClient: jest.fn(),
}));
jest.mock('../config', () => ({
  api_configuration: {},
}));
jest.mock('../utils/userMessage', () => ({
  toastErrorAndThrow: jest.fn(),
}));
jest.mock('../utils/logoutState', () => ({
  getLogoutGeneration: jest.fn(),
  isLogoutGenerationCurrent: jest.fn(),
  isSignedOut: jest.fn(),
}));

async function waitForCall(mockFunction) {
  for (let attempt = 0; attempt < 20 && mockFunction.mock.calls.length === 0; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  expect(mockFunction).toHaveBeenCalled();
}

describe('getLogin logout generation', () => {
  let accountStorageManager;
  let currentGeneration;
  let identitySource;
  let lockRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    currentGeneration = 'user-a';
    getLogoutGeneration.mockImplementation(() => currentGeneration);
    isLogoutGenerationCurrent.mockImplementation((generation) => {
      return generation === currentGeneration;
    });
    isSignedOut.mockReturnValue(false);
    accountStorageManager = {
      clearAccountStorage: jest.fn().mockResolvedValue(),
      getValidAccount: jest.fn().mockResolvedValue(null),
      storeAccountData: jest.fn().mockResolvedValue(),
    };
    getAccountStorageManager.mockReturnValue(accountStorageManager);
    identitySource = { getIdentity: jest.fn().mockResolvedValue('identity-a') };
    AmpifyIdentitySource.mockImplementation(() => identitySource);
    lockRequest = jest.fn((_name, _options, callback) => callback({ name: HOME_ACCOUNT_LOCK_NAME }));
    Object.defineProperty(window.navigator, 'locks', {
      configurable: true,
      value: { request: lockRequest },
    });
  });

  it('does not return delayed cached account data after logout and login', async () => {
    let resolveAccount;
    accountStorageManager.getValidAccount.mockReturnValue(new Promise((resolve) => {
      resolveAccount = resolve;
    }));

    const loginPromise = getLogin();
    await waitForCall(accountStorageManager.getValidAccount);
    currentGeneration = 'user-b';
    resolveAccount({ account: { version: 1 }, user: { version: 1 } });

    await expect(loginPromise).rejects.toMatchObject({ cancelled: true });
    expect(accountStorageManager.clearAccountStorage).toHaveBeenCalledTimes(1);
    expect(identitySource.getIdentity).not.toHaveBeenCalled();
  });

  it('does not return a delayed network login after logout and login', async () => {
    let resolveLogin;
    const accountCognitoLogin = jest.fn(() => new Promise((resolve) => {
      resolveLogin = resolve;
    }));
    uclusion.constructSSOClient.mockResolvedValue({ accountCognitoLogin });

    const loginPromise = getLogin();
    await waitForCall(accountCognitoLogin);
    currentGeneration = 'user-b';
    resolveLogin({ uclusion_token: 'user-a-token' });

    await expect(loginPromise).rejects.toMatchObject({ cancelled: true });
    expect(accountStorageManager.clearAccountStorage).toHaveBeenCalledTimes(1);
    expect(accountStorageManager.storeAccountData).not.toHaveBeenCalled();
  });

  it('cleans a stale persisted account before rejecting', async () => {
    let resolveStore;
    const accountData = { uclusion_token: 'user-a-token' };
    uclusion.constructSSOClient.mockResolvedValue({
      accountCognitoLogin: jest.fn().mockResolvedValue(accountData),
    });
    accountStorageManager.storeAccountData.mockReturnValue(new Promise((resolve) => {
      resolveStore = resolve;
    }));

    const loginPromise = getLogin();
    await waitForCall(accountStorageManager.storeAccountData);
    currentGeneration = 'user-b';
    resolveStore();

    await expect(loginPromise).rejects.toMatchObject({ cancelled: true });
    expect(accountStorageManager.clearAccountStorage).toHaveBeenCalledTimes(1);
  });

  it('preserves cancellation when stale-account cleanup fails', async () => {
    const cleanupError = new Error('storage unavailable');
    let resolveAccount;
    accountStorageManager.getValidAccount.mockReturnValue(new Promise((resolve) => {
      resolveAccount = resolve;
    }));
    accountStorageManager.clearAccountStorage.mockRejectedValue(cleanupError);

    const loginPromise = getLogin();
    await waitForCall(accountStorageManager.getValidAccount);
    currentGeneration = 'user-b';
    resolveAccount(null);

    await expect(loginPromise).rejects.toMatchObject({ cancelled: true, cleanupError });
  });

  it('finishes old-session cleanup before a queued new-session writer', async () => {
    let resolveCleanup;
    let resolveOldAccount;
    const oldAccount = new Promise((resolve) => {
      resolveOldAccount = resolve;
    });
    const cleanup = new Promise((resolve) => {
      resolveCleanup = resolve;
    });
    const currentAccount = { uclusion_token: 'user-b-token' };
    const order = [];
    accountStorageManager.getValidAccount
      .mockImplementationOnce(() => oldAccount)
      .mockResolvedValueOnce(null);
    accountStorageManager.clearAccountStorage.mockImplementation(() => {
      order.push('old cleanup');
      return cleanup;
    });
    accountStorageManager.storeAccountData.mockImplementation(() => {
      order.push('new store');
      return Promise.resolve();
    });
    uclusion.constructSSOClient.mockResolvedValue({
      accountCognitoLogin: jest.fn().mockResolvedValue(currentAccount),
    });
    let lockTail = Promise.resolve();
    lockRequest.mockImplementation((_name, _options, callback) => {
      const result = lockTail.then(() => callback({ name: HOME_ACCOUNT_LOCK_NAME }));
      lockTail = result.catch(() => undefined);
      return result;
    });

    const oldLogin = getLogin();
    await waitForCall(accountStorageManager.getValidAccount);
    currentGeneration = 'user-b';
    const currentLogin = getLogin();
    resolveOldAccount({ account: { version: 1 }, user: { version: 1 } });
    await waitForCall(accountStorageManager.clearAccountStorage);

    expect(accountStorageManager.getValidAccount).toHaveBeenCalledTimes(1);
    resolveCleanup();

    await expect(oldLogin).rejects.toMatchObject({ cancelled: true });
    await expect(currentLogin).resolves.toBe(currentAccount);
    expect(order).toEqual(['old cleanup', 'new store']);
  });

  it('stores and returns account data for the current session', async () => {
    const accountData = { uclusion_token: 'current-token' };
    const accountCognitoLogin = jest.fn().mockResolvedValue(accountData);
    uclusion.constructSSOClient.mockResolvedValue({ accountCognitoLogin });

    await expect(getLogin()).resolves.toBe(accountData);

    expect(lockRequest).toHaveBeenCalledWith(
      HOME_ACCOUNT_LOCK_NAME,
      { ifAvailable: false },
      expect.any(Function)
    );
    expect(accountCognitoLogin).toHaveBeenCalledWith('identity-a');
    expect(accountStorageManager.storeAccountData).toHaveBeenCalledWith(accountData);
    expect(accountStorageManager.clearAccountStorage).not.toHaveBeenCalled();
  });
});
