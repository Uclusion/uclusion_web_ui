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
const mockPoll = jest.fn();

jest.mock('aws-amplify', () => ({
  __esModule: true,
  default: { configure: jest.fn() },
  Auth: {
    configure: jest.fn(),
    currentAuthenticatedUser: jest.fn(() => Promise.resolve({
      attributes: {
        'custom:user_id': 'user-id',
        email: 'ada@example.com',
      },
    })),
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
  onSignOut: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../utils/renderProfiler', () => ({
  startEventTimingWatch: jest.fn(),
}));

jest.mock('../../authorization/CustomSignIn', () => () => null);
jest.mock('../../pages/Authentication/Signup', () => () => null);
jest.mock('../../pages/Authentication/ForgotPassword', () => () => null);
jest.mock('../Root', () => () => null);

jest.mock('../../pages/Setup/SetupApproval', () => ({ setupId }) => (
  <div data-testid="setup-approval">Setup {setupId}</div>
));

jest.mock('logrocket', () => ({ identify: jest.fn() }));


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
    mockPoll.mockReset();
    mockPoll.mockRejectedValue(new Error('account is still being created'));
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
});
