import _ from 'lodash';
import LocalForageHelper from '../LocalForageHelper';
import { MARKET_CONTEXT_NAMESPACE } from './MarketsContext';


const INITIALIZE_STATE = 'INITIALIZE_STATE';
const UPDATE_MARKET = 'UPDATE_MARKET';
const ADD_MARKET = 'ADD_MARKET';
const UPDATE_MARKET_DETAILS = 'UPDATE_MARKET_DETAILS';
const REMOVE_MARKET_DETAILS = 'REMOVE_MARKET_DETAILS';

/* Possible messages to the reducer */
export function initializeState(newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}

export function updateMarket(market) {
  return {
    type: UPDATE_MARKET,
    market,
  };
}

export function addMarket(market) {
  return {
    type: ADD_MARKET,
    market,
  };
}

export function updateMarketDetails(marketDetails) {
  return {
    type: UPDATE_MARKET_DETAILS,
    marketDetails,
  };
}

export function removeMarketDetails(marketIds) {
  return {
    type: REMOVE_MARKET_DETAILS,
    marketIds,
  };
}

/* Functions that mutate state */

function storeMarket(state, action) {
  const { market } = action;
  console.debug(market);

  const { marketDetails: oldDetails } = state;
  const newDetails = _.unionBy([market], oldDetails, 'id');

  return {
    ...state,
    marketDetails: newDetails,
  };
}

function doUpdateMarketDetails(state, action) {
  const { marketDetails } = action;
  const { marketDetails: oldMarketDetails } = state;
  const newDetails = _.unionBy(marketDetails, oldMarketDetails, 'id');
  return {
    ...state,
    marketDetails: newDetails,
  };
}

function removeStoredMarkets(state, action) {
  const { marketIds } = action;
  const { marketDetails } = state;
  const newMarketDetails = marketDetails.filter((market) => (!(market.marketId in marketIds)));
  return {
    ...state,
    marketDetails: newMarketDetails,
  };
}

function computeNewState(state, action) {
  console.debug(`Computing state with type ${action.type}`);
  switch (action.type) {
    case UPDATE_MARKET:
    case ADD_MARKET:
      return storeMarket(state, action);
    case UPDATE_MARKET_DETAILS:
      return doUpdateMarketDetails(state, action);
    case REMOVE_MARKET_DETAILS:
      return removeStoredMarkets(state, action);
    case INITIALIZE_STATE:
      return action.newState;
    default:
      return state;
  }
}

function reducer(state, action) {
  const newState = computeNewState(state, action);
  const lfh = new LocalForageHelper(MARKET_CONTEXT_NAMESPACE);
  lfh.setState(newState);
  return newState;
}

export default reducer;
