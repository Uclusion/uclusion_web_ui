/**
 Helper class for notifying the user that takes care of all the i18n and message formatting for us
 * */
import { toast } from 'react-toastify'
import { intl } from '../components/ContextHacks/IntlGlobalProvider'
import { setOperationInProgress } from '../components/ContextHacks/OperationInProgressGlobalProvider'
import { refreshVersions } from '../contexts/VersionsContext/versionsContextHelper'

export const DEBUG = 'debug';
export const INFO = 'info';
export const WARN = 'warn';
export const ERROR = 'error';
export const SUCCESS = 'success';


/**
 * Accepts a message level of type INFO, WARN, ERROR, and SUCCESS
 * @param level
 * @param i18nMessageId the id in translation bunndles to display
 * @param ii18nMessageValues any key/values the message requires
 */
export function sendIntlMessage(level, i18nMessageId, ii18nMessageValues) {
  sendIntlMessageBase(intl, level, i18nMessageId, ii18nMessageValues)
}

export function sendIntlMessageBase(intl, level, i18nMessageId, ii18nMessageValues) {
  const message = intl.formatMessage({ id: i18nMessageId }, ii18nMessageValues);
  // it's expected this function will bet more complex as we customize toasts
  switch (level) {
    case DEBUG:
      console.info(message);
      break;
    case INFO:
      toast.info(message);
      break;
    case WARN:
      toast.warn(message);
      break;
    case ERROR:
      toast.error(message);
      break;
    case SUCCESS:
      toast.success(message);
      break;
    default:
      toast(message);
  }
}

export function errorAndThrow(error, messageKey) {
  sendIntlMessage(DEBUG, messageKey);
  console.error(error);
  if (setOperationInProgress) {
    setOperationInProgress(false);
  }
  throw error;
}

/**
 * Pops an error toast and rethrows the error, halting any operation in progress
 * @param error the error we need to rethrow
 * @param messageKey the id in the translation bundles to display
 */
export function toastErrorAndThrow(error, messageKey) {
  if (setOperationInProgress) {
    setOperationInProgress(false);
  }
  if (error && error.status === 208) {
    console.info('Api gateway duplicate 208 received');
    return refreshVersions().then(() => {
      console.warn(error);
      throw error;
    });
  } else {
    sendIntlMessage(ERROR, messageKey);
    console.error(error);
    throw error;
  }
}

/**
 * Pops a toast and halts any operation in progress. Does not retjrow the error
 * @param messageKey
 */
export function toastError(messageKey) {
  sendIntlMessage(ERROR, messageKey);
  if (setOperationInProgress) {
    setOperationInProgress(false);
  }
}

/**
 * Sends an info level user message that does not automatically go away
 * @param i18nMessageDescription the i18n key of the message
 * @param i18nMessageValues the i18n values for any variable in the message
 * @param onClose a handler that can be called when the message closes
 */
export function sendInfoPersistent(i18nMessageDescription, i18nMessageValues, onClose) {
  const message = intl.formatMessage(i18nMessageDescription, i18nMessageValues);
  if (!toast.isActive(message)) {
    toast.info(message, { autoClose: false, onClose, toastId: message });
  }
}
