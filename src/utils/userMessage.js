/**
 Helper class for notifying the user that takes care of all the i18n and message formatting for us
 * */
import { toast } from 'react-toastify';
import { intl } from '../components/IntlComponents/IntlGlobalProvider';

export const INFO = 'info';
export const WARN = 'warn';
export const ERROR = 'error';
export const SUCCESS = 'success';


/**
 * Accepts a message level of type INFO, WARN, ERROR, and SUCCESS
 * @param level
 * @param i18nMessageId the id in translati bunndles to display
 * @param ii18nMessageValues any key/values the message requires
 */
export function sendIntlMessage(level, i18nMessageId, ii18nMessageValues) {
  const message = intl.formatMessage({ id: i18nMessageId }, ii18nMessageValues);
  // it's expected this function will bet more complex as we customize toasts
  switch (level) {
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

/**
 * Sends an info level user message that does not automatically go away
 * @param i18nMessageDescription the i18n key of the message
 * @param i18nMessageValues the i18n values for any variable in the message
 * @param onClose a handler that can be called when the message closes
 */
export function sendInfoPersistent(i18nMessageDescription, i18nMessageValues, onClose){
  const message = intl.formatMessage(i18nMessageDescription, i18nMessageValues);
  toast.info(message, { autoClose: false, onClose });
}