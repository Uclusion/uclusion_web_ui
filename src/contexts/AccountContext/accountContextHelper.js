import _ from 'lodash';
import config from '../../config';
import {
  SUBSCRIPTION_STATUS_CANCELED,
  SUBSCRIPTION_STATUS_UNSUBSCRIBED
} from '../../constants/billing'
import { accountRefresh } from './accountContextReducer';


/**
 * Returns whether or not the user can create new markets
 * @param state
 * @returns {boolean}
 */
export function canCreate (state) {
  // if payments are turned off we can always create
  if (!config.payments || !config.payments.enabled) {
    return true;
  }
  if (_.isEmpty(state.account)) {
    return true;
  }
  const {
    billing_subscription_status: subStatus,
  } = state.account;
  if (subStatus === SUBSCRIPTION_STATUS_CANCELED) {
    return false;
  }
  return subStatus !== SUBSCRIPTION_STATUS_UNSUBSCRIBED;
}

export function getAccount (state) {
  return state.account || {};
}

function fixDate (account, name) {
  const value = account[name];
  if (value) {
    return new Date(value);
  }
  return undefined;
}

export function fixDates(account) {
  return {
    ...account,
    billing_subscription_end: fixDate(account, 'billing_subscription_end'),
    created_at: fixDate(account, 'created_at'),
    updated_at: fixDate(account, 'updated_at'),
  };
}

export function updateAccount (dispatch, account) {
  const fixed = fixDates(account);
  dispatch(accountRefresh(fixed));
}

export function getUnusedFullPromotions (state) {
  const account = getAccount(state);
  if (_.isEmpty(account) || _.isEmpty(account.billing_promotions)) {
    return [];
  }
  const { billing_promotions: promos } = account;
 // console.error(promos);
  // check if we have any promo's we haven't used
  const totallyUnused = promos.filter((promo) => promo.percent_off === 100.0 && !promo.consumed);
  // now check if we're not done with a promo we have used
  const partiallyUsed = promos.filter((promo) => {
    const { usable, percent_off } = promo;
    if (percent_off !== 100.0) {
      return false;
    }
    return usable
  });
  return [...totallyUnused, ...partiallyUsed];
}