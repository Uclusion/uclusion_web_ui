import locale from './locale/reducer';
import themeSource from './themeSource/reducer';
import drawer from './drawer/reducer';

import { initState } from './init';


export const appReducers = {
  locale,
  drawer,
  themeSource,
};

const myReducers = {
  ...appReducers,

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

  const newState = {};
  Object.keys(myReducers).forEach((key) => {
    const reducer = myReducers[key];
    newState[key] = reducer(currentState[key], action);
  });
  return newState;
}

export default mainReducer;// (state, action) => rootReducer(mainReducer, initState, state, action);
