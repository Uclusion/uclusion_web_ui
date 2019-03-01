import { combineReducers } from 'redux';
import filterReducer from 'material-ui-filter/lib/store/reducer';
import { initState } from './init';
import rootReducer from './rootReducer';
import investiblesReducer from './MarketInvestibles/reducer';
import marketsReducer from './Markets/reducer';
import usersReducer from './Users/reducer';
import locale from './locale/reducer';
import persistentValues from './persistentValues/reducer';
import simpleValues from './simpleValues/reducer';
import themeSource from './themeSource/reducer';
import drawer from './drawer/reducer';
import commentsReducer from './Comments/reducer';
import activeSearches from './ActiveSearches/reducer';
import searchReducer from './SearchIndexes/reducer';

export const appReducers = {
  filters: filterReducer,
  locale,
  persistentValues,
  simpleValues,
  drawer,
  themeSource,
};

/**
 * Wraps the investible and comments reducer and packs them into the action.
 * This is a bit of a hack, but allows the state to be recomputed based on values
 * in the other reducers
 * @param state
 * @param action
 */
const searchIndexes = (state, action) => {
  const actionPacket = { ...action, investiblesReducer, commentsReducer };
  return searchReducer(state, actionPacket);
};

const appReducer = combineReducers({
  ...appReducers,
  investiblesReducer,
  marketsReducer,
  usersReducer,
  commentsReducer,
  activeSearches,
  searchIndexes,
});


export default (state, action) => rootReducer(appReducer, initState, state, action);
