import _ from 'lodash';
import { PRODUCT_TIER_FREE } from '../../constants/billing';
import { accountRefresh, billingInfoRefresh } from './accountContextReducer';

export function canCreate(state) {
  if (_.isEmpty(state.account)) {
    return false;
  }
  const { tier } = state.account;
  return tier !== PRODUCT_TIER_FREE;
}

export function getTier(state) {
  if (_.isEmpty(state.account)) {
    return undefined;
  }
  return state.account.tier;
}

export function getId(state) {
  if (_.isEmpty(state.account)) {
    return undefined;
  }
  return state.account.id;
}

export function getCurrentBillingInfo(state) {
  if (_.isEmpty(state.billingInfo)){
    return undefined;
  }
  return state.billingInfo;
}


function fixDate (account, name) {
  const value = account[name];
  if (value) {
    return new Date(value);
  }
  return undefined;
}

function fixDates (account) {
  const fixedState = {
    ...account,
    billing_subscription_end: fixDate(account, 'billing_subscription_end'),
    created_at: fixDate(account, 'created_at'),
    updated_at: fixDate(account, 'updated_at'),
  };
  return fixedState;
}

export function updateBilling(dispatch, billingInfo) {
  dispatch(billingInfoRefresh(billingInfo));
}

export function updateAccount(dispatch, account) {
  const fixed = fixDates(account);
  dispatch(accountRefresh(fixed));
}