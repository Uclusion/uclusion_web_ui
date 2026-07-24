import {
  clearSignupMarketSubType,
  getSignupMarketSubType,
  setSignupMarketSubType,
  syncSignupMarketSubType,
  withSignupMarketSubType
} from './redirectUtils';
import { clearUclusionLocalStorage } from '../components/localStorageUtils';

jest.mock('localforage', () => ({
  clear: jest.fn(() => Promise.resolve())
}));

describe('signup market subtype', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists TEST through the signup flow and adds it to workspace creation', () => {
    syncSignupMarketSubType('signUp', 'TEST');

    expect(getSignupMarketSubType()).toBe('TEST');
    expect(withSignupMarketSubType({ name: 'UI Smoke' })).toEqual({
      name: 'UI Smoke',
      market_sub_type: 'TEST'
    });
  });

  it.each(['NORMAL', 'test', 'INTEGRATION_TEST'])(
    'clears a stale TEST marker for unsupported signup subtype %s',
    (marketSubType) => {
      setSignupMarketSubType('TEST');
      setSignupMarketSubType(marketSubType);

      expect(getSignupMarketSubType()).toBeNull();
      expect(withSignupMarketSubType({ name: 'Customer workspace' })).toEqual({
        name: 'Customer workspace'
      });
    }
  );

  it('clears a stale marker when an active ordinary signup starts', () => {
    setSignupMarketSubType('TEST');

    syncSignupMarketSubType('signUp', undefined);

    expect(getSignupMarketSubType()).toBeNull();
  });

  it('preserves the marker while the signup component is hidden for verification', () => {
    setSignupMarketSubType('TEST');

    syncSignupMarketSubType('signIn', undefined);

    expect(getSignupMarketSubType()).toBe('TEST');
  });

  it('clears the marker after the workspace is created', () => {
    setSignupMarketSubType('TEST');
    clearSignupMarketSubType();

    expect(getSignupMarketSubType()).toBeNull();
  });

  it('is removed by the root-storage clearing used on logout', async () => {
    setSignupMarketSubType('TEST');

    await clearUclusionLocalStorage(false);

    expect(getSignupMarketSubType()).toBeNull();
  });
});
