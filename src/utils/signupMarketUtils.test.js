import {
  getSignupMarketSubType,
  setSignupMarketSubType
} from './redirectUtils';
import {
  createMarketFromSignup,
  isTestSignup,
  resolveSignupTestObject,
  withSignupTestObject
} from './signupMarketUtils';

describe('signup object type', () => {
  it('marks only the TEST signup contract as a synthetic test account', () => {
    const signupData = { name: 'Tester', email: 'tester@example.com' };

    expect(isTestSignup('TEST')).toBe(true);
    expect(withSignupTestObject(signupData, 'TEST')).toEqual({
      ...signupData,
      test_object: true
    });
    expect(isTestSignup(undefined)).toBe(false);
    expect(withSignupTestObject(signupData, undefined)).toBe(signupData);
  });

  it('uses the persisted marker when a resend URL no longer has TEST', () => {
    expect(resolveSignupTestObject(undefined, 'TEST')).toBe(true);
    expect(resolveSignupTestObject(undefined, undefined)).toBe(false);
    expect(resolveSignupTestObject(false, 'TEST')).toBe(false);
  });
});

describe('createMarketFromSignup', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('enriches the create request and clears TEST after a successful create', async () => {
    const marketDetails = { market: { id: 'market-id' } };
    const createMarket = jest.fn().mockResolvedValue(marketDetails);
    setSignupMarketSubType('TEST');

    await expect(createMarketFromSignup(createMarket, {
      name: 'UI Smoke',
      group_type: 'TEAM'
    })).resolves.toBe(marketDetails);

    expect(createMarket).toHaveBeenCalledWith({
      name: 'UI Smoke',
      group_type: 'TEAM',
      market_sub_type: 'TEST'
    });
    expect(getSignupMarketSubType()).toBeNull();

    const laterCreate = jest.fn().mockResolvedValue({ market: { id: 'later-market' } });
    await createMarketFromSignup(laterCreate, { name: 'Customer workspace' });
    expect(laterCreate).toHaveBeenCalledWith({ name: 'Customer workspace' });
  });

  it('retains TEST when creation fails so a retry stays marked', async () => {
    const createMarket = jest.fn().mockRejectedValue(new Error('create failed'));
    setSignupMarketSubType('TEST');

    await expect(createMarketFromSignup(createMarket, {
      name: 'UI Smoke'
    })).rejects.toThrow('create failed');

    expect(getSignupMarketSubType()).toBe('TEST');
  });
});
