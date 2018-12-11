/**
 Helper class for notifying the user that takes care of all the i18n and message formatting for us
 **/
import { intl } from '../components/IntlComponents/IntlGlobalProvider'
import { toast } from 'react-toastify'

export const INFO = 'info'
export const WARN = 'warn'
export const ERROR = 'error'
export const SUCCESS = 'success'


/**
 * Accepts a message level of type INFO, WARN, ERROR, and SUCCESS
 * @param level
 * @param i18nMessage
 */
export function sendIntlMessage (level, i18nMessageDescription, ii18nMessageVales) {
  const message = intl.formatMessage(i18nMessageDescription, ii18nMessageVales)
  // it's expected this function will bet more complex as we customize toasts
  switch(level){
    case INFO:
      toast.info(message)
      break;
    case WARN:
      toast.warn(message)
      break
    case ERROR:
      toast.error(message)
      break
    case SUCCESS:
      toast.success(message)
      break
    default:
      toast(message)
  }
}
