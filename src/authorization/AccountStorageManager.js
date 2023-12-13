/**
 * It turns out the lifetime of the account data is pretty much tied to the
 * lifetime of your account data. Hence this class applies aspects of the token
 * storage manager to the storage of an account
 */

import LocalForageHelper from '../utils/LocalForageHelper';
import _ from 'lodash';
import { getTokenSecondsRemaining } from './tokenUtils';
import localforage from 'localforage';

export const STORAGE_KEYSPACE = 'ACCOUNT_STORAGE_MANAGER';

class AccountStorageManager {

  getKeyNamespace () {
    return 'ACCOUNT';
  }

  /**
   * Clears the entirety of token storage
   */
  clearAccountStorage () {
    return localforage.createInstance({ storeName: STORAGE_KEYSPACE }).clear();
  }

  /**
   * Returns a token from the system for the given type and item id
   * <i>regardless if it is valid</i>
   */
  getAccount() {
    return new LocalForageHelper(this.getKeyNamespace(), STORAGE_KEYSPACE)
      .getState()
      .catch((error) => {
        console.error('Got error getting account');
        console.error(error);
      });
  }

  /**
   * Returns an account from account storage that has an account token that has not expired yet
   * @returns the object form of the account, or null if it doesn't exist
   */
  getValidAccount() {
    return this.getAccount()
      .then((account) => {
        if (account && this.isAccountValid(account)) {
          return account;
        }
        return null;
      });
  }

  /**
   * Stores an account in the account storage, unless an account with exists,
   * @param accountData the response we want to store.
   */
  storeAccountData (accountData) {
    const key = this.getKeyNamespace();
    return new LocalForageHelper(key, STORAGE_KEYSPACE).setState(accountData);
  }

  /**
   * Takes a token string, decodes it, and determines if it's going to expire in the next
   * minute
   * @param accountData the login response
   * @returns if the token is valid and not expiring in the next minute
   */
  isAccountValid (accountData) {
    if (_.isEmpty(accountData)) {
      return false;
    }
    const { uclusion_token: accountToken } = accountData;
    const secondsRemaining = getTokenSecondsRemaining(accountToken);
    return secondsRemaining >= 60;
  }
}

export default AccountStorageManager;
