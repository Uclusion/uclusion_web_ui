import _ from 'lodash';
import config from '../../config';
import {
  PRODUCT_TIER_FREE, PRODUCT_TIER_STANDARD,
  SUBSCRIPTION_STATUS_ACTIVE,
  SUBSCRIPTION_STATUS_CANCELED,
  SUBSCRIPTION_STATUS_TRIAL, SUBSCRIPTION_STATUS_UNSUBSCRIBED
} from '../../constants/billing'
import { accountRefresh, billingInfoRefresh, invoicesRefresh } from './accountContextReducer';


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
    billing_subscription_end: subEnd,
  } = state.account;
  const tier = [SUBSCRIPTION_STATUS_TRIAL, SUBSCRIPTION_STATUS_ACTIVE].includes(subStatus) ? PRODUCT_TIER_STANDARD
    : PRODUCT_TIER_FREE;
  if (tier === PRODUCT_TIER_FREE) {
    return false;
  }
  if (subStatus === SUBSCRIPTION_STATUS_CANCELED && (_.isEmpty(subEnd) || subEnd < Date.now())) {
    return false;
  }
  return subStatus !== SUBSCRIPTION_STATUS_UNSUBSCRIBED;

}

export function getAccount (state) {
  return state.account || {};
}

export function getTier (state) {
  if (_.isEmpty(state.account)) {
    return undefined;
  }
  return state.account.tier;
}

export function getId (state) {
  if (_.isEmpty(state.account)) {
    return undefined;
  }
  return state.account.id;
}

export function subscriptionCancellable (state) {
  const account = getAccount(state);
  const { billing_subscription_status: subStatus } = account;
  return subStatus === SUBSCRIPTION_STATUS_ACTIVE || subStatus === SUBSCRIPTION_STATUS_TRIAL;
}

export function getCurrentBillingCardInfo (state) {
  if (_.isEmpty(state.billingInfo)) {
    return undefined;
  }
  return state.billingInfo;
}

export function getCurrentInvoices (state) {
  if (_.isEmpty(state.invoices)) {
    return undefined;
  }
  return state.invoices;
}

function fixDate (account, name) {
  const value = account[name];
  if (value) {
    return new Date(value);
  }
  return undefined;
}

function fixDates (account) {
  return {
    ...account,
    billing_subscription_end: fixDate(account, 'billing_subscription_end'),
    created_at: fixDate(account, 'created_at'),
    updated_at: fixDate(account, 'updated_at'),
  };
}

export function updateInvoices (dispatch, invoices) {
  dispatch(invoicesRefresh(invoices));
}

export function updateBilling (dispatch, billingInfo) {
  dispatch(billingInfoRefresh(billingInfo));
}

export function updateAccount (dispatch, account) {
  const fixed = fixDates(account);
  dispatch(accountRefresh(fixed));
}

function getUnusedFullPromotions (state) {
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

export function subscriptionNeedsPayment (state) {
  if (_.isEmpty(state)) {
    return true;
  }
  const unusedFullPromotions = getUnusedFullPromotions(state);
 // console.error(unusedFullPromotions);
  return _.isEmpty(state.billingInfo) && _.isEmpty(unusedFullPromotions);
}