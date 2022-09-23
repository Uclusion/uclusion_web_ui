import { setUclusionLocalStorageItem } from '../../components/localStorageUtils'

const REFRESH_ACCOUNT = 'REFRESH_ACCOUNT';
const CLEAR_ACCOUNT = 'CLEAR_ACCOUNT';
const REFRESH_BILLING_INFO = 'REFRESH_BILLING_INFO';
const REFRESH_INVOICES = 'REFRESH_INVOICES';
const REFRESH_ACCOUNT_USER = 'REFRESH_ACCOUNT_USER';
const REFRESH_ACCOUNT_AND_USER = 'REFRESH_ACCOUNT_AND_USER';
export const ACCOUNT_CONTEXT_KEY = 'account_context';

export function billingInfoRefresh(billingInfo) {
  return {
    type: REFRESH_BILLING_INFO,
    billingInfo,
  }
}

export function accountAndUserRefresh(account, user) {
  return {
    type: REFRESH_ACCOUNT_AND_USER,
    account,
    user
  };
}

export function accountRefresh(account) {
  return {
    type: REFRESH_ACCOUNT,
    account,
  };
}

export function clearAccount() {
  return {
    type: CLEAR_ACCOUNT,
  };
}

export function invoicesRefresh(invoices) {
  return {
    type: REFRESH_INVOICES,
    invoices,
  };
}

function doAccountClear(state, action) {
  return {initializing: false};
}

function doBillingInfoRefresh(state, action) {
  const { billingInfo } = action;
  return {
    ...state,
    initializing: false,
    billingInfo,
  };
}

function doInvoicesRefresh(state, action) {
  const { invoices } = action;
  return {
    ...state,
    intializing: false,
    invoices,
  };
}

export function accountUserRefresh(user) {
  return {
    type: REFRESH_ACCOUNT_USER,
    user,
  };
}

function doAccountRefresh(state, action) {
  const { account } = action;
  return {
    ...state,
    initializing: false,
    account,
  };
}

function convertUserUiPreferences(user) {
  const uiPrefString = user.ui_preferences || '';
  let parsed;
  console.debug('got here')
  try {
    parsed = JSON.parse(uiPrefString);
    console.debug(parsed)
  } catch(e) {
    // some users had garbage in their preferences from previous versions
    // so we just ingore it and say we don't have preferences
    parsed = {};
  }
  return { ...user, ui_preferences: parsed };
}

function doAccountAndUserRefresh(state, action) {
  const { account, user } = action;
  return {
    ...state,
    initializing: false,
    account,
    user: convertUserUiPreferences(user)
  };
}

function doAccountUserRefresh(state, action) {
  const { user } = action;
  return {
    ...state,
    user: convertUserUiPreferences(user)
  };
}

export function reducer(state, action) {
  function calculateState () {
    const { type } = action
    switch (type) {
      case REFRESH_ACCOUNT_USER:
        return doAccountUserRefresh(state, action)
      case REFRESH_ACCOUNT:
        return doAccountRefresh(state, action)
      case CLEAR_ACCOUNT:
        return doAccountClear(state, action)
      case REFRESH_BILLING_INFO:
        return doBillingInfoRefresh(state, action)
      case REFRESH_INVOICES:
        return doInvoicesRefresh(state, action)
      case REFRESH_ACCOUNT_AND_USER:
        return doAccountAndUserRefresh(state, action)
      default:
        return state
    }
  }

  const newState = calculateState();
  setUclusionLocalStorageItem(ACCOUNT_CONTEXT_KEY, newState);
  return newState;
}