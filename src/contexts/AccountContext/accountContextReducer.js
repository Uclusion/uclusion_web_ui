
const REFRESH_ACCOUNT = 'REFRESH_ACCOUNT';
const CLEAR_ACCOUNT = 'CLEAR_ACCOUNT';
const REFRESH_BILLING_INFO = 'REFRESH_BILLING_INFO';
const REFRESH_INVOICES = 'REFRESH_INVOICES';
const REFRESH_ACCOUNT_USER = 'REFRESH_ACCOUNT_USER';

export function billingInfoRefresh(billingInfo) {
  return {
    type: REFRESH_BILLING_INFO,
    billingInfo,
  }
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

function doAccountUserRefresh(state, action) {
  const { user } = action;
  const uiPrefString = user.ui_preferences || '';
  let parsed = undefined;
  // some users had garbage in their preferences from previous versions
  // so we just ingore it and say we don't have preferences
  try {
    parsed = JSON.parse(uiPrefString)
  }catch(e) {
    parsed = {};
  }
  return {
    ...state,
    user: {
      ...user,
      ui_preferences: parsed
    }
  };
}

export function reducer(state, action) {
  const { type } = action;
  switch (type) {
    case REFRESH_ACCOUNT_USER:
      return doAccountUserRefresh(state, action);
    case REFRESH_ACCOUNT:
      return doAccountRefresh(state, action);
    case CLEAR_ACCOUNT:
      return doAccountClear(state, action);
    case REFRESH_BILLING_INFO:
      return doBillingInfoRefresh(state, action);
    case REFRESH_INVOICES:
      return doInvoicesRefresh(state, action);
    default:
      return state;
  }
}