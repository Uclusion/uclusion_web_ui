import investiblesReducer from './MarketInvestibles/reducer';

import locale from './locale/reducer';
import themeSource from './themeSource/reducer';
import drawer from './drawer/reducer';
import commentsReducer from './Comments/reducer';
import detailReducer from './Detail/reducer';
import { initState } from './init';
import * as authTypes from './auth/types';

export const appReducers = {
  locale,
  drawer,
  themeSource,
  detail: detailReducer,
};

const myReducers = {
  ...appReducers,
  investiblesReducer,
  commentsReducer,
};

// give the search reducer the comments and the investibles,
// so we have our own custom combineReducers
function mainReducer(state, action) {
  if (state === undefined) {
    return state;
  }
  // we want to be able to reset the used state to the reducers to the init
  // state on logout
  let currentState = state;
  if (action.type === authTypes.USER_LOGOUT) {
    currentState = { ...initState };
  }
  const newState = {};
  Object.keys(myReducers).forEach((key) => {
    const reducer = myReducers[key];
    newState[key] = reducer(currentState[key], action);
  });
  return newState;
}

export default mainReducer;// (state, action) => rootReducer(mainReducer, initState, state, action);
