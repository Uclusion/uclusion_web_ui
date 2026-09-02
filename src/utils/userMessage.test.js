import LogRocket from 'logrocket';
import { toast } from 'react-toastify';
import { requestFreshness } from '../api/crossTabFreshness';
import { intl } from '../components/ContextHacks/IntlGlobalProvider';
import { setOperationInProgress } from '../components/ContextHacks/OperationInProgressGlobalProvider';
import { isSignedOut } from './logoutState';
import {
  ERROR,
  INFO,
  errorAndThrow,
  sendIntlMessage,
  sendIntlMessageBase,
  toastError,
  toastErrorAndThrow,
} from './userMessage';

jest.mock('./logoutState', () => ({
  isSignedOut: jest.fn(),
}));
jest.mock('../api/crossTabFreshness', () => ({
  requestFreshness: jest.fn(),
}));
jest.mock('../components/ContextHacks/IntlGlobalProvider', () => ({
  intl: { formatMessage: jest.fn(() => 'localized') },
}));
jest.mock('../components/ContextHacks/OperationInProgressGlobalProvider', () => ({
  setOperationInProgress: jest.fn(),
}));
jest.mock('logrocket', () => ({
  __esModule: true,
  default: { captureException: jest.fn() },
}));
jest.mock('react-toastify', () => {
  const toast = jest.fn();
  toast.info = jest.fn();
  toast.warn = jest.fn();
  toast.error = jest.fn();
  toast.success = jest.fn();
  toast.isActive = jest.fn();
  return { toast };
});

function captureThrown(callback) {
  try {
    callback();
  } catch (error) {
    return error;
  }
  throw new Error('Expected callback to throw');
}

function expectNoErrorReporting() {
  expect(intl.formatMessage).not.toHaveBeenCalled();
  expect(toast).not.toHaveBeenCalled();
  expect(toast.info).not.toHaveBeenCalled();
  expect(toast.warn).not.toHaveBeenCalled();
  expect(toast.error).not.toHaveBeenCalled();
  expect(toast.success).not.toHaveBeenCalled();
  expect(console.info).not.toHaveBeenCalled();
  expect(console.warn).not.toHaveBeenCalled();
  expect(console.error).not.toHaveBeenCalled();
  expect(LogRocket.captureException).not.toHaveBeenCalled();
}

describe('userMessage logout reporting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isSignedOut.mockReturnValue(true);
    requestFreshness.mockResolvedValue();
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rethrows the exact error and clears progress without reporting', () => {
    const error = new Error('cancelled');

    expect(captureThrown(() => errorAndThrow(error, 'errorKey'))).toBe(error);

    expect(setOperationInProgress).toHaveBeenCalledWith(false);
    expectNoErrorReporting();
  });

  it('keeps the throwing toast helper contract without reporting', () => {
    const error = new Error('cancelled');

    expect(captureThrown(() => toastErrorAndThrow(error, 'errorKey'))).toBe(error);

    expect(setOperationInProgress).toHaveBeenCalledWith(false);
    expectNoErrorReporting();
  });

  it('keeps the nonthrowing toast helper contract without reporting', () => {
    const error = new Error('cancelled');

    expect(toastError(error, 'errorKey')).toBeUndefined();

    expect(setOperationInProgress).toHaveBeenCalledWith(false);
    expectNoErrorReporting();
  });

  it.each([
    ['successful', false],
    ['failed', true],
  ])('keeps the fulfilled 208 recovery chain after a %s refresh', async (_name, rejects) => {
    const error = Object.assign(new Error('duplicate'), { status: 208 });
    if (rejects) {
      requestFreshness.mockRejectedValueOnce(new Error('refresh failed'));
    }

    const result = toastErrorAndThrow(error, 'errorKey');

    expect(typeof result.then).toBe('function');
    await expect(result).resolves.toBeUndefined();
    expect(requestFreshness).toHaveBeenCalledWith({ reason: 'serverResponse' });
    expect(setOperationInProgress).toHaveBeenCalledWith(false);
    expectNoErrorReporting();
  });

  it('rechecks the marker before deferred 208 reporting', async () => {
    let resolveFreshness;
    const freshness = new Promise((resolve) => {
      resolveFreshness = resolve;
    });
    const error = Object.assign(new Error('duplicate'), { status: 208 });
    isSignedOut.mockReturnValue(false);
    requestFreshness.mockReturnValue(freshness);

    const result = toastErrorAndThrow(error, 'errorKey');
    expect(console.info).toHaveBeenCalledWith('Api gateway duplicate 208 received');
    isSignedOut.mockReturnValue(true);
    resolveFreshness();

    await expect(result).resolves.toBeUndefined();
    expect(console.warn).not.toHaveBeenCalled();
    expect(isSignedOut).toHaveBeenCalledTimes(3);
  });

  it('keeps the 410 no-op without reporting', () => {
    const error = Object.assign(new Error('gone'), { status: 410 });

    expect(toastErrorAndThrow(error, 'errorKey')).toBeUndefined();

    expect(requestFreshness).not.toHaveBeenCalled();
    expect(setOperationInProgress).toHaveBeenCalledWith(false);
    expectNoErrorReporting();
  });

  it('resumes ordinary reporting for all three helpers after sign-in', () => {
    const firstError = new Error('first api failed');
    const secondError = new Error('second api failed');
    const thirdError = new Error('third api failed');
    isSignedOut.mockReturnValue(false);

    expect(captureThrown(() => errorAndThrow(firstError, 'firstError'))).toBe(firstError);
    expect(captureThrown(() => toastErrorAndThrow(secondError, 'secondError'))).toBe(secondError);
    expect(toastError(thirdError, 'thirdError')).toBeUndefined();

    expect(intl.formatMessage).toHaveBeenCalledTimes(3);
    expect(toast.error).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenNthCalledWith(1, firstError);
    expect(console.error).toHaveBeenNthCalledWith(2, secondError);
    expect(LogRocket.captureException).toHaveBeenCalledTimes(3);
    expect(setOperationInProgress).toHaveBeenCalledTimes(3);
  });

  it('preserves all helper contracts when the logout marker cannot be read', () => {
    const markerError = new Error('invalid marker storage');
    const firstError = new Error('first api failed');
    const secondError = new Error('second api failed');
    const thirdError = new Error('third api failed');
    isSignedOut.mockImplementation(() => {
      throw markerError;
    });

    expect(captureThrown(() => errorAndThrow(firstError, 'firstError'))).toBe(firstError);
    expect(captureThrown(() => toastErrorAndThrow(secondError, 'secondError'))).toBe(secondError);
    expect(toastError(thirdError, 'thirdError')).toBeUndefined();

    expect(LogRocket.captureException).toHaveBeenCalledTimes(3);
    expect(setOperationInProgress).toHaveBeenCalledTimes(3);
  });

  it('does not suppress the general message helpers while signed out', () => {
    const directIntl = { formatMessage: jest.fn(() => 'direct') };

    sendIntlMessage(INFO, 'infoKey');
    sendIntlMessageBase(directIntl, ERROR, 'errorKey');

    expect(intl.formatMessage).toHaveBeenCalledWith({ id: 'infoKey' }, undefined);
    expect(directIntl.formatMessage).toHaveBeenCalledWith({ id: 'errorKey' }, undefined);
    expect(toast.info).toHaveBeenCalledWith('localized');
    expect(toast.error).toHaveBeenCalledWith('direct');
  });
});
