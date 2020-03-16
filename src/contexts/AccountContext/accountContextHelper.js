import _ from 'lodash';
import { PRODUCT_TIER_FREE, SUBSCRIPTION_STATUS_ACTIVE, SUBSCRIPTION_STATUS_TRIAL } from '../../constants/billing';
import { accountRefresh, billingInfoRefresh, invoicesRefresh } from './accountContextReducer';

export function canCreate(state) {
  if (_.isEmpty(state.account)) {
    return false;
  }
  const { tier } = state.account;
  return tier !== PRODUCT_TIER_FREE;
}

export function getAccount(state) {
  return state.account || {};
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

export function subscriptionCancellable(state) {
  const account = getAccount(state);
  const { billing_subscription_status: subStatus } = account;
  return subStatus === SUBSCRIPTION_STATUS_ACTIVE || subStatus === SUBSCRIPTION_STATUS_TRIAL;
}

export function getCurrentBillingInfo(state) {
  if (_.isEmpty(state.billingInfo)){
    return undefined;
  }
  return state.billingInfo;
}

export function getCurrentInvoices(state) {
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
  const fixedState = {
    ...account,
    billing_subscription_end: fixDate(account, 'billing_subscription_end'),
    created_at: fixDate(account, 'created_at'),
    updated_at: fixDate(account, 'updated_at'),
  };
  return fixedState;
}

export function updateInvoices(dispatch, invoices) {
  dispatch(invoicesRefresh(invoices));
}

export function updateBilling(dispatch, billingInfo) {
  dispatch(billingInfoRefresh(billingInfo));
}

export function updateAccount(dispatch, account) {
  const fixed = fixDates(account);
  dispatch(accountRefresh(fixed));
}