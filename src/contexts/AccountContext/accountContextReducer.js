import { setUclusionLocalStorageItem } from '../../components/localStorageUtils'
import { OnboardingState } from './accountUserContextHelper';

const REFRESH_ACCOUNT = 'REFRESH_ACCOUNT';
const CLEAR_ACCOUNT = 'CLEAR_ACCOUNT';
const REFRESH_ACCOUNT_USER = 'REFRESH_ACCOUNT_USER';
const QUICK_JOIN_ACCOUNT_USER = 'QUICK_JOIN_ACCOUNT_USER';
const REFRESH_ACCOUNT_AND_USER = 'REFRESH_ACCOUNT_AND_USER';
export const ACCOUNT_CONTEXT_KEY = 'account_context';

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

function doAccountClear(state, action) {
  return {initializing: true};
}

export function accountUserRefresh(user) {
  return {
    type: REFRESH_ACCOUNT_USER,
    user,
  };
}

export function accountUserJoinedMarket() {
  return {
    type: QUICK_JOIN_ACCOUNT_USER
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
  try {
    parsed = JSON.parse(uiPrefString);
  } catch(e) {
    // some users had garbage in their preferences from previous versions
    // so we just ingore it and say we don't have preferences
    parsed = {};
  }
  return { ...user, ui_preferences: parsed };
}

function doAccountAndUserRefresh(state, action) {
  const { account, user } = action;
  const { user: oldUser } = state;
  if (oldUser?.version > user.version) {
    return state;
  }
  return {
    ...state,
    initializing: false,
    account,
    user: convertUserUiPreferences(user)
  };
}

function doAccountUserRefresh(state, action) {
  const { user } = action;
  const { user: oldUser } = state;
  if (oldUser?.version > user.version) {
    return state;
  }
  return {
    ...state,
    user: convertUserUiPreferences(user)
  };
}

function doAccountUserQuickJoin(state) {
  const { user } = state;
  if (user.onboarding_state === OnboardingState.FirstMarketJoined) {
    return state;
  }
  return  {
    ...state,
    user: {...user, onboarding_state: OnboardingState.FirstMarketJoined}
  };
}

export function reducer(state, action) {
  function calculateState () {
    const { type } = action;
    switch (type) {
      case REFRESH_ACCOUNT_USER:
        return doAccountUserRefresh(state, action);
      case REFRESH_ACCOUNT:
        return doAccountRefresh(state, action);
      case CLEAR_ACCOUNT:
        return doAccountClear(state, action);
      case REFRESH_ACCOUNT_AND_USER:
        return doAccountAndUserRefresh(state, action);
      case QUICK_JOIN_ACCOUNT_USER:
        return doAccountUserQuickJoin(state);
      default:
        return state;
    }
  }

  const newState = calculateState();
  setUclusionLocalStorageItem(ACCOUNT_CONTEXT_KEY, newState);
  return newState;
}