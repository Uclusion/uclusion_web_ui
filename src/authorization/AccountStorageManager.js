/**
 * It turns out the lifetime of the account data is pretty much tied to the
 * lifetime of your account data. Hence this class applies aspects of the token
 * storage manager to the storage of an account
 */

import LocalForageHelper from '../utils/LocalForageHelper';
import _ from 'lodash';
import { getTokenSecondsRemaining } from './tokenUtils';
import localforage from 'localforage';
import { AllSequentialMap } from '../utils/PromiseUtils';
import { pushMessage } from '../utils/MessageBusUtils'

export const STORAGE_KEYSPACE = 'ACCOUNT_STORAGE_MANAGER';
export const ACCOUNT_NAMESPACE = 'ACCOUNT';

class AccountStorageManager {

  getKeyNamespace (accountId) {
    return `ACCOUNT_${accounId}`;
  }

  getItemIdFromKey (key) {
    const underscore = key.indexOf('_');
    return key.substring(underscore + 1);
  }

  /**
   * Clears the entirety of token storage
   */
  clearTokenStorage () {
    return localforage.createInstance({ storeName: STORAGE_KEYSPACE }).clear();
  }

  /**
   * Returns a token from the system for the given type and item id
   * <i>regardless if it is valid</i>
   * @param accouunt the id of the account we want
   */
  getAccount (accountId) {
    return new LocalForageHelper(this.getKeyNamespace(accountId), STORAGE_KEYSPACE)
      .getState()
      .catch((error) => {
        console.error('Got error getting account');
        console.error(error);
      });
  }

  /**
   * Returns an account from account storage that has an account token that has not expired yet
   * @param itemId the id of the item we want the token for
   * @returns the object form of the account, or null if it doesn't exist
   */
  getValidAccount (accountId) {
    return this.getAccount(accountId)
      .then((account) => {
        if (account && this.isAccountValid(account)) {
          return account;
        }
        return null;
      });
  }

  /**
   * Stores an account in the account storage, unless an account with exists,
   * @param account the token we want to store.
   */
  storeAccount (account) {
    const key = this.getKeyNamespace(account.id);
    return new LocalForageHelper(key, STORAGE_KEYSPACE).setState(account);
  }

  /**
   * Takes a token string, decodes it, and determines if it's going to expire in the next
   * minute
   * @param tokenString the string form of the token
   * @returns if the token is valid and not expiring in the next minute
   */
  isAccountValid (account) {
    if (_.isEmpty(account)) {
      return false;
    }
    const { uclusion_token: accountToken } = account;
    const secondsRemaining = getTokenSecondsRemaining(accountToken);
    return secondsRemaining >= 60;
  }
}

export default AccountStorageManager;
