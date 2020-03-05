const REFRESH_ACCOUNT = 'REFRESH_ACCOUNT';
const CLEAR_ACCOUNT = 'CLEAR_ACCOUNT';

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

// functions that mutate the state;
function doAccountRefresh(state, action) {
  const { account } = action;
  return account;
}

function doAccountClear(state, action) {
  return {};
}

export function reducer(state, action) {
  const { type } = action;
  switch(type) {
    case REFRESH_ACCOUNT:
      return doAccountRefresh(state, action);
    case CLEAR_ACCOUNT:
      return doAccountClear(state, action);
    default:
      return state;
  }
}