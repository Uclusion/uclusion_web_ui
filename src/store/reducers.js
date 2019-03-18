import filterReducer from 'material-ui-filter/lib/store/reducer';
import investiblesReducer from './MarketInvestibles/reducer';
import marketsReducer from './Markets/reducer';
import usersReducer from './Users/reducer';
import locale from './locale/reducer';
import themeSource from './themeSource/reducer';
import drawer from './drawer/reducer';
import commentsReducer from './Comments/reducer';
import activeSearches from './ActiveSearches/reducer';
import searchReducer from './SearchIndexes/reducer';
import detailReducer from './Detail/reducer';

export const appReducers = {
  filters: filterReducer,
  locale,
  drawer,
  themeSource,
  detail: detailReducer,
};

const myReducers = {
  ...appReducers,
  investiblesReducer,
  marketsReducer,
  usersReducer,
  commentsReducer,
  activeSearches,
};

// give the search reducer the comments and the investibles,
// so we have our own custom combineReducers
function mainReducer(state, action) {
  if (state === undefined) {
    return state;
  }
  const newState = {};
  Object.keys(myReducers).forEach((key) => {
    const reducer = myReducers[key];
    newState[key] = reducer(state[key], action);
  });
  newState.searchIndexes = searchReducer(state.searchIndexes,
    {
      ...action,
      investiblesReducer: state.investiblesReducer,
      commentsReducer: state.commentsReducer,
    });
  return newState;
}

export default mainReducer;// (state, action) => rootReducer(mainReducer, initState, state, action);
