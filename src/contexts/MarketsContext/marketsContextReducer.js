import _ from 'lodash';
import LocalForageHelper from '../LocalForageHelper';
import { convertDates } from '../ContextUtils';
import { MARKET_CONTEXT_NAMESPACE } from './MarketsContext';


const INITIALIZE_STATE = 'INITIALIZE_STATE';
const SWITCH_MARKET = 'SWITCH_MARKET';
const UPDATE_MARKET = 'UPDATE_MARKET';
const ADD_MARKET = 'ADD_MARKET';
const UPDATE_MARKETS_LIST = 'UPDATE_MARKETS_LIST';
const UPDATE_MARKET_DETAILS = 'UPDATE_MARKET_DETAILS';
const UPDATE_SINGLE_MARKET_DETAILS = 'UPDATE_SINGLE_MARKET_DETAILS';

/* Possible messages to the reducer */
export function initializeState(newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}

export function switchMarket(marketId) {
  return {
    type: SWITCH_MARKET,
    marketId,
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

export function updateMarketsList(markets) {
  return {
    type: UPDATE_MARKETS_LIST,
    markets,
  };
}

export function updateSingleMarketDetails(marketDetails) {
  return {
    type: UPDATE_SINGLE_MARKET_DETAILS,
    marketDetails,
  };
}

export function updateAllMarketDetails(marketDetails) {
  return {
    type: UPDATE_MARKET_DETAILS,
    marketDetails,
  };
}

/* Functions that mutate state */

function doSwitchMarket(state, action) {
  const { marketId } = action;
  const { markets } = state;
  console.debug(`Try switching market to ${marketId}`);
  if (!_.isEmpty(markets)) {
    const found = markets.find((market) => market.id === marketId);
    if (found) {
      console.debug(`Switching to ${marketId}`);
      return { ...state, currentMarket: found };
    }
  } else {
    console.debug('Empty markets in switch');
  }
  return state;
}

function storeMarket(state, action) {
  const { market } = action;
  console.debug(market);
  const { id } = market;

  const { marketDetails: oldDetails, markets: oldMarkets } = state;
  // update the name in the market list, or add if new
  const oldListItem = oldMarkets.find((item) => item.id === id);
  const newMarkets = (oldListItem)
    ? _.unionBy([{ ...oldListItem, name: market.name }], oldMarkets, 'id')
    : [...oldMarkets, market];
  // there's no token in the market above, and extra stuff, but name, etc lines up
  // it'll also be replaced at the next refresh
  const newDetails = _.unionBy([market], oldDetails, 'id');
  // lastly update the current market to the new data, or if it's not set, leave it alone
  const { currentMarket } = state;
  const newCurrentMarket = (!currentMarket) ? currentMarket
    : newMarkets.find((item) => item.id === currentMarket.id);

  return {
    ...state,
    markets: newMarkets,
    marketDetails: newDetails,
    currentMarket: newCurrentMarket,
  };
}

function doUpdateMarketsList(state, action) {
  const { markets } = action;
  return {
    ...state,
    markets,
  };
}

function doUpdateAllMarketDetails(state, action) {
  const { marketDetails } = action;
  return {
    ...state,
    marketDetails,
  };
}

function doUpdateSingleMarketDetails(state, action) {
  const { marketDetails } = action;
  const { marketDetails: oldMarketDetails } = state;
  const convertedMarket = convertDates(marketDetails);
  const newDetails = _.unionBy([convertedMarket], oldMarketDetails, 'id');
  return {
    ...state,
    marketDetails: newDetails,
  };
}

function computeNewState(state, action) {
  console.debug(`Computing state with type ${action.type}`);
  switch (action.type) {
    case SWITCH_MARKET:
      return doSwitchMarket(state, action);
    case UPDATE_MARKET:
    case ADD_MARKET:
      return storeMarket(state, action);
    case UPDATE_MARKETS_LIST:
      return doUpdateMarketsList(state, action);
    case UPDATE_MARKET_DETAILS:
      return doUpdateAllMarketDetails(state, action);
    case UPDATE_SINGLE_MARKET_DETAILS:
      return doUpdateSingleMarketDetails(state, action);
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
