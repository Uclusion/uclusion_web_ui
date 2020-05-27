import { EMPTY_STATE } from './AccountUserContext';

const REFRESH_ACCOUNT_USER = 'REFRESH_ACCOUNT_USER';
const RESET_STATE = 'RESET_STATE';

export function accountUserRefresh(user) {
  return {
    type: REFRESH_ACCOUNT_USER,
    user,
  };
}

export function resetState() {
  return {
    type: RESET_STATE,
  }
}

/*** Functions that modify data ***/

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
    case RESET_STATE:
      return EMPTY_STATE;
    default:
      return state;
  }
}