import localforage from 'localforage';
import { clearUclusionLocalStorage } from './localStorageUtils';
import { clearSignedOut, getLogoutGeneration } from '../utils/logoutState';

jest.mock('localforage', () => ({
  clear: jest.fn(() => Promise.resolve()),
}));

describe('clearUclusionLocalStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('removes the per-login generation during logout clearing', async () => {
    clearSignedOut();
    expect(getLogoutGeneration()).not.toBeNull();

    await clearUclusionLocalStorage(false);

    expect(getLogoutGeneration()).toBeNull();
    expect(localforage.clear).toHaveBeenCalledTimes(1);
  });
});
