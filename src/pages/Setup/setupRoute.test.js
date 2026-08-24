import {
  clearRedirect,
  getRedirect,
  redirectFromHistory,
  setRedirect,
} from '../../utils/redirectUtils';
import { getSetupRoute, parseSetupPath, switchSetupAccount } from './setupRoute';

jest.mock('localforage', () => ({
  clear: jest.fn(() => Promise.resolve()),
}));

describe('setup auth redirect', () => {
  beforeEach(() => {
    clearRedirect();
  });

  it('restores the setup path after Google, GitHub, or email auth returns to root', () => {
    const history = {
      location: {
        pathname: '/setup/opaque_setup-id_123',
        hash: '',
      },
    };

    setRedirect(redirectFromHistory(history));

    expect(getSetupRoute('/', getRedirect())).toEqual({
      pathname: '/setup/opaque_setup-id_123',
      setupId: 'opaque_setup-id_123',
    });
  });

  it('accepts only a setup id in the path segment', () => {
    expect(parseSetupPath('/setup/opaque-id')).toEqual({
      pathname: '/setup/opaque-id',
      setupId: 'opaque-id',
    });
    expect(parseSetupPath('/setup/../../secret')).toBeUndefined();
    expect(parseSetupPath('/setup/id?verifier=private')).toBeUndefined();
  });

  it('signs out before restoring the public setup route for an account switch', async () => {
    const signOut = jest.fn().mockResolvedValue();
    const history = { replace: jest.fn() };

    await switchSetupAccount(signOut, history, '/setup/opaque-id');

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(getRedirect()).toBe('/setup/opaque-id');
    expect(history.replace).toHaveBeenCalledWith('/setup/opaque-id');
  });
});
