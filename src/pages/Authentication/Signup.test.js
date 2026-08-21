import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { signUp } from '../../api/sso';
import messages from '../../config/locales/en';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import Signup from './Signup';

jest.mock('../../api/sso', () => ({
  getMarketInfoForToken: jest.fn(),
  resendVerification: jest.fn(),
  signUp: jest.fn(),
}));

jest.mock('aws-amplify', () => ({
  Auth: { federatedSignIn: jest.fn() },
}));

jest.mock('react-router', () => ({
  useHistory: () => ({
    location: { hash: '', pathname: '/', search: '' },
  }),
}));

jest.mock('react-social-login-buttons', () => {
  const React = require('react');
  return {
    GithubLoginButton: ({ children }) => <button type="button">{children}</button>,
  };
});

const setNativeInputValue = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  'value'
).set;
const previousActEnvironment = window.IS_REACT_ACT_ENVIRONMENT;

function changeInput(container, id, value) {
  const input = container.querySelector(`#${id}`);
  act(() => {
    setNativeInputValue.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function submitForm(container) {
  container.querySelector('form').dispatchEvent(new Event('submit', {
    bubbles: true,
    cancelable: true,
  }));
}

describe('Signup', () => {
  let container;
  let root;

  beforeAll(() => {
    window.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterAll(() => {
    window.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  });

  beforeEach(() => {
    signUp.mockReset();
    container = document.createElement('div');
    root = createRoot(container);
    act(() => {
      root.render(
        <IntlProvider locale="en" messages={messages}>
          <OperationInProgressContext.Provider value={[false, jest.fn()]}>
            <Signup authState="signUp" />
          </OperationInProgressContext.Provider>
        </IntlProvider>
      );
    });
  });

  afterEach(() => {
    act(() => root.unmount());
  });

  it('blocks Cognito-incompatible emails and restores retry after a rejected signup', async () => {
    const tooLongEmail = `${'a'.repeat(64)}@${'b'.repeat(60)}.com`;
    expect(tooLongEmail).toHaveLength(129);
    changeInput(container, 'email', tooLongEmail);
    changeInput(container, 'name', 'John Doe');
    changeInput(container, 'password', 'secret');
    changeInput(container, 'repeat', 'secret');

    const button = container.querySelector('#signupButton');
    expect(button.disabled).toBe(true);
    expect(container.textContent).toContain(messages.signupEmailLengthHelper);
    button.click();
    expect(signUp).not.toHaveBeenCalled();

    const maxLengthEmail = `${'a'.repeat(64)}@${'b'.repeat(59)}.com`;
    expect(maxLengthEmail).toHaveLength(128);
    changeInput(container, 'email', maxLengthEmail);
    expect(button.disabled).toBe(false);

    ['.john@example.com', 'john.@example.com', 'john..doe@example.com'].forEach((invalidEmail) => {
      changeInput(container, 'email', invalidEmail);
      expect(button.disabled).toBe(true);
      expect(container.textContent).toContain(messages.signupEmailDotPlacementHelper);
      button.click();
      expect(signUp).not.toHaveBeenCalled();
    });

    changeInput(container, 'email', 'john.doe@example.com');
    expect(button.disabled).toBe(false);

    signUp
      .mockRejectedValueOnce(new Error('signup failed'))
      .mockReturnValueOnce(new Promise(() => {}));
    await act(async () => {
      submitForm(container);
      await Promise.resolve();
    });

    expect(signUp).toHaveBeenCalledTimes(1);
    expect(button.disabled).toBe(false);

    act(() => submitForm(container));
    expect(signUp).toHaveBeenCalledTimes(2);
  });
});
