const REFRESH_ACCOUNT = 'REFRESH_ACCOUNT';
const CLEAR_ACCOUNT = 'CLEAR_ACCOUNT';
const REFRESH_BILLING_INFO = 'REFRESH_BILLING_INFO';
const REFRESH_INVOICES = 'REFRESH_INVOICES';

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

// functions that mutate the state;
function doAccountRefresh(state, action) {
  const { account } = action;
  return {
    ...state,
    account,
  };
}

function doAccountClear(state, action) {
  return {};
}

function doBillingInfoRefresh(state, action) {
  const { billingInfo } = action;
  return {
    ...state,
    billingInfo,
  };
}

function doInvoicesRefresh(state, action) {
  const { invoices } = action;
  return {
    ...state,
    invoices,
  };
}

export function reducer(state, action) {
  const { type } = action;
  switch(type) {
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