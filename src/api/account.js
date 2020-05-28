import { getAccountClient } from './uclusionClient';
import { toastErrorAndThrow } from '../utils/userMessage';

/** Updates the logged in identity's home user account UI preferences
 * to be what's passed in. It's a _total_ replacement
  * @param newPreferences
 * @returns {*}
 */
export function updateUiPreferences(newPreferences){
  const stringData = JSON.stringify(newPreferences);
  return getAccountClient()
    .then((client) => client.users.update({ uiPreferences: stringData}))
    .catch((error) => toastErrorAndThrow(error, 'errorPreferenceUpdateFailed'));
}