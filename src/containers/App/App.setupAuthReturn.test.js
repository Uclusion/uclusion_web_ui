import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Router } from 'react-router';
import { createMemoryHistory } from 'history';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { LocaleContext } from '../../contexts/LocaleContext';
import { clearRedirect, getRedirect } from '../../utils/redirectUtils';
import AppWithAuth from './AppWithAuth';


let mockAuthState = 'signIn';
let mockAuthListener;
let mockSetupApprovalProps;
let mockLogoutGeneration = 'session-a';
const mockPoll = jest.fn();
const mockGetMarketFromUrl = jest.fn();
const mockIdentify = jest.fn();
const mockOnSignOut = jest.fn();
const mockCurrentAuthenticatedUser = jest.fn();
let mockSignedOut = false;

jest.mock('aws-amplify', () => ({
  __esModule: true,
  default: { configure: jest.fn() },
  Auth: {
    configure: jest.fn(),
    currentAuthenticatedUser: (...args) => mockCurrentAuthenticatedUser(...args),
  },
}));

jest.mock('aws-amplify-react', () => {
  const React = require('react');
  const HiddenAuthControl = () => null;
  return {
    Authenticator: ({ children }) => (
      <>
        {React.Children.map(children, (child) => React.isValidElement(child)
          ? React.cloneElement(child, { authState: mockAuthState })
          : child)}
      </>
    ),
    ForgotPassword: HiddenAuthControl,
    Greetings: HiddenAuthControl,
    SignIn: HiddenAuthControl,
    SignOut: HiddenAuthControl,
    SignUp: HiddenAuthControl,
  };
});

jest.mock('../../utils/MessageBusUtils', () => ({
  registerListener: jest.fn((_channel, _name, listener) => {
    mockAuthListener = listener;
  }),
}));

jest.mock('../../contexts/AccountContext/accountContextMessages', () => ({
  AUTH_HUB_CHANNEL: 'auth',
  poll: (...args) => mockPoll(...args),
}));

jest.mock('../../utils/userFunctions', () => ({
  clearSignedOut: jest.fn(),
  onSignOut: (...args) => mockOnSignOut(...args),
}));

jest.mock('../../utils/logoutState', () => ({
  getLogoutGeneration: () => mockLogoutGeneration,
  isLogoutGenerationCurrent: (generation) => generation === mockLogoutGeneration,
  isSignedOut: () => mockSignedOut,
}));

jest.mock('../../api/marketLogin', () => ({
  getMarketFromUrl: (...args) => mockGetMarketFromUrl(...args),
}));

jest.mock('../../utils/renderProfiler', () => ({
  startEventTimingWatch: jest.fn(),
}));

jest.mock('../../authorization/CustomSignIn', () => () => null);
jest.mock('../../pages/Authentication/Signup', () => () => null);
jest.mock('../../pages/Authentication/ForgotPassword', () => () => null);
jest.mock('../Root', () => () => null);

jest.mock('../../pages/Setup/SetupApproval', () => {
  const React = require('react');
  return (props) => {
    mockSetupApprovalProps = props;
    return React.createElement(
      'div',
      { 'data-testid': 'setup-approval' },
      `Setup ${props.setupId}`
    );
  };
});

jest.mock('logrocket', () => ({ identify: (...args) => mockIdentify(...args) }));

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}


describe('setup authorization auth return', () => {
  let container;
  let root;
  let history;
  let previousActEnvironment;
  const dispatch = jest.fn();

  function renderBoundary() {
    root.render(
      <Router history={history}>
        <LocaleContext.Provider value={[{ locale: 'en' }, jest.fn()]}>
          <AccountContext.Provider value={[{}, dispatch]}>
            <AppWithAuth />
          </AccountContext.Provider>
        </LocaleContext.Provider>
      </Router>
    );
  }

  beforeEach(() => {
    previousActEnvironment = window.IS_REACT_ACT_ENVIRONMENT;
    window.IS_REACT_ACT_ENVIRONMENT = true;
    clearRedirect();
    mockAuthState = 'signIn';
    mockAuthListener = undefined;
    mockSetupApprovalProps = undefined;
    mockPoll.mockReset();
    mockPoll.mockRejectedValue(new Error('account is still being created'));
    mockGetMarketFromUrl.mockReset().mockResolvedValue({});
    mockIdentify.mockReset();
    mockOnSignOut.mockReset().mockResolvedValue();
    mockLogoutGeneration = 'session-a';
    mockSignedOut = false;
    mockCurrentAuthenticatedUser.mockReset().mockResolvedValue({
      attributes: {
        'custom:user_id': 'user-id',
        email: 'ada@example.com',
      },
    });
    dispatch.mockReset();
    history = createMemoryHistory({ initialEntries: ['/setup/opaque-id'] });
    container = document.createElement('div');
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    window.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
    clearRedirect();
  });

  it('restores the setup page when sign-in returns to the site root', async () => {
    await act(async () => {
      renderBoundary();
    });
    expect(getRedirect()).toBe('/setup/opaque-id');

    await act(async () => {
      history.replace('/');
    });
    await act(async () => {
      await mockAuthListener({ payload: { event: 'signIn' } });
      mockAuthState = 'signedIn';
      renderBoundary();
    });

    expect(history.location.pathname).toBe('/setup/opaque-id');
    expect(container.querySelector('[data-testid="setup-approval"]').textContent)
      .toBe('Setup opaque-id');
    expect(mockPoll).not.toHaveBeenCalled();
  });

  it('stores the new workspace session and replaces the setup route without signing out', async () => {
    const workspaceId = '00000000-0000-4000-8000-000000000001';
    const viewId = '00000000-0000-4000-8000-000000000002';
    mockAuthState = 'signedIn';
    mockCurrentAuthenticatedUser.mockReturnValue(new Promise(() => {}));

    await act(async () => {
      renderBoundary();
    });

    await act(async () => {
      await mockSetupApprovalProps.onSetupComplete({
        setup_id: 'opaque-id',
        workspace_id: workspaceId,
        view_id: viewId,
      });
    });

    expect(mockGetMarketFromUrl).toHaveBeenCalledWith(workspaceId, expect.any(Function));
    expect(dispatch).toHaveBeenCalledWith({ type: 'QUICK_JOIN_ACCOUNT_USER' });
    expect(history.action).toBe('REPLACE');
    expect(history.location.pathname).toBe(`/dialog/${workspaceId}`);
    expect(history.location.search).toBe(`?groupId=${viewId}`);
    expect(history.location.state).toEqual({ setupWorkspaceId: workspaceId });
    expect(mockOnSignOut).not.toHaveBeenCalled();
  });

  it('does not replace newer navigation after setup completion becomes stale', async () => {
    const workspaceId = '00000000-0000-4000-8000-000000000001';
    const viewId = '00000000-0000-4000-8000-000000000002';
    let finishMarketLogin;
    mockAuthState = 'signedIn';
    mockCurrentAuthenticatedUser.mockReturnValue(new Promise(() => {}));
    mockGetMarketFromUrl.mockReturnValue(new Promise((resolve) => {
      finishMarketLogin = resolve;
    }));

    await act(async () => {
      renderBoundary();
    });

    const completion = mockSetupApprovalProps.onSetupComplete({
      setup_id: 'opaque-id',
      workspace_id: workspaceId,
      view_id: viewId,
    }, () => true);
    const activityGuard = mockGetMarketFromUrl.mock.calls[0][1];
    expect(activityGuard()).toBe(true);

    act(() => history.push('/newer-route'));
    expect(activityGuard()).toBe(false);
    await act(async () => {
      finishMarketLogin({});
      await expect(completion).rejects.toMatchObject({ cancelled: true });
    });

    expect(history.location.pathname).toBe('/newer-route');
    expect(dispatch).not.toHaveBeenCalledWith({ type: 'QUICK_JOIN_ACCOUNT_USER' });
  });

  it('invalidates setup completion as soon as sign-out starts', async () => {
    const workspaceId = '00000000-0000-4000-8000-000000000001';
    let finishMarketLogin;
    mockAuthState = 'signedIn';
    mockCurrentAuthenticatedUser.mockReturnValue(new Promise(() => {}));
    mockGetMarketFromUrl.mockReturnValue(new Promise((resolve) => {
      finishMarketLogin = resolve;
    }));

    await act(async () => {
      renderBoundary();
    });

    const completion = mockSetupApprovalProps.onSetupComplete({
      setup_id: 'opaque-id',
      workspace_id: workspaceId,
      view_id: '00000000-0000-4000-8000-000000000002',
    }, () => true);
    const activityGuard = mockGetMarketFromUrl.mock.calls[0][1];
    mockSignedOut = true;
    expect(activityGuard()).toBe(false);

    await act(async () => {
      finishMarketLogin({});
      await expect(completion).rejects.toMatchObject({ cancelled: true });
    });
    expect(history.location.pathname).toBe('/setup/opaque-id');
    expect(dispatch).not.toHaveBeenCalledWith({ type: 'QUICK_JOIN_ACCOUNT_USER' });
  });

  it('does not resume setup completion after rapid logout and login', async () => {
    const workspaceId = '00000000-0000-4000-8000-000000000001';
    let finishMarketLogin;
    mockAuthState = 'signedIn';
    mockCurrentAuthenticatedUser.mockReturnValue(new Promise(() => {}));
    mockGetMarketFromUrl.mockReturnValue(new Promise((resolve) => {
      finishMarketLogin = resolve;
    }));

    await act(async () => {
      renderBoundary();
    });

    const completion = mockSetupApprovalProps.onSetupComplete({
      setup_id: 'opaque-id',
      workspace_id: workspaceId,
      view_id: '00000000-0000-4000-8000-000000000002',
    }, () => true);
    const activityGuard = mockGetMarketFromUrl.mock.calls[0][1];
    mockSignedOut = true;
    mockLogoutGeneration = 'session-b';
    mockSignedOut = false;
    expect(activityGuard()).toBe(false);

    await act(async () => {
      finishMarketLogin({});
      await expect(completion).rejects.toMatchObject({ cancelled: true });
    });
    expect(history.location.pathname).toBe('/setup/opaque-id');
    expect(dispatch).not.toHaveBeenCalledWith({ type: 'QUICK_JOIN_ACCOUNT_USER' });
  });

  it('ignores a pending identity from before rapid logout and login', async () => {
    let finishUserA;
    const userA = new Promise((resolve) => {
      finishUserA = resolve;
    });
    mockAuthState = 'signedIn';
    mockCurrentAuthenticatedUser
      .mockReset()
      .mockReturnValueOnce(userA)
      .mockResolvedValueOnce({
        attributes: {
          'custom:user_id': 'user-b',
          email: 'b@example.com',
        },
      });

    await act(async () => {
      renderBoundary();
      await Promise.resolve();
    });
    mockAuthState = 'signOut';
    mockLogoutGeneration = 'session-b';
    await act(async () => {
      renderBoundary();
      await Promise.resolve();
    });
    mockAuthState = 'signedIn';
    await act(async () => {
      renderBoundary();
      await flushPromises();
    });
    await act(async () => {
      finishUserA({
        attributes: {
          'custom:user_id': 'user-a',
          email: 'a@example.com',
        },
      });
      await flushPromises();
    });

    expect(mockCurrentAuthenticatedUser).toHaveBeenCalledTimes(2);
    expect(mockIdentify).toHaveBeenCalledTimes(1);
    expect(mockIdentify).toHaveBeenCalledWith('user-b', expect.objectContaining({
      email: 'b@example.com',
    }));
  });

  it('replaces already-loaded identity attributes after logout and login', async () => {
    mockAuthState = 'signedIn';
    mockCurrentAuthenticatedUser
      .mockReset()
      .mockResolvedValueOnce({
        attributes: {
          'custom:user_id': 'user-a',
          email: 'a@example.com',
        },
      })
      .mockResolvedValueOnce({
        attributes: {
          'custom:user_id': 'user-b',
          email: 'b@example.com',
        },
      });

    await act(async () => {
      renderBoundary();
      await flushPromises();
    });
    expect(mockIdentify).toHaveBeenLastCalledWith('user-a', expect.any(Object));

    mockAuthState = 'signOut';
    mockLogoutGeneration = 'session-b';
    await act(async () => {
      renderBoundary();
      await flushPromises();
    });
    mockAuthState = 'signedIn';
    await act(async () => {
      renderBoundary();
      await flushPromises();
    });

    expect(mockCurrentAuthenticatedUser).toHaveBeenCalledTimes(2);
    expect(mockIdentify).toHaveBeenLastCalledWith('user-b', expect.objectContaining({
      email: 'b@example.com',
    }));
  });

  it('loads a restored signed-in session that predates login generations', async () => {
    mockAuthState = 'signedIn';
    mockLogoutGeneration = null;

    await act(async () => {
      renderBoundary();
      await flushPromises();
    });

    expect(mockIdentify).toHaveBeenCalledWith('user-id', expect.objectContaining({
      email: 'ada@example.com',
    }));
  });
});
