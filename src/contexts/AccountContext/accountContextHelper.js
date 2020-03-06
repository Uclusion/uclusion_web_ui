import _ from 'lodash';
import { PRODUCT_TIER_FREE } from '../../constants/billing';
import { accountRefresh } from './accountContextReducer';

export function canCreate(state) {
  if (_.isEmpty(state)) {
    return false;
  }
  const { tier } = state;
  return tier !== PRODUCT_TIER_FREE;
}

export function getTier(state) {
  if (_.isEmpty(state)) {
    return undefined;
  }
  return state.tier;
}

export function getId(state) {
  if (_.isEmpty(state)) {
    return undefined;
  }
  return state.id;
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

export function updateAccount(dispatch, account) {
  const fixed = fixDates(account);
  dispatch(accountRefresh(fixed));
}