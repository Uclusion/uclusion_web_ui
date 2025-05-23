import { removeInitializing } from '../../components/localStorageUtils'
import { addByIdAndVersion } from '../ContextUtils'
import { leaderContextHack } from '../LeaderContext/LeaderContext';
import LocalForageHelper from '../../utils/LocalForageHelper';
import { MARKET_CONTEXT_NAMESPACE } from './MarketsContext';

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const UPDATE_MARKET_DETAILS = 'UPDATE_MARKET_DETAILS';
const REMOVE_MARKET_DETAILS = 'REMOVE_MARKET_DETAILS';
const UPDATE_FROM_VERSIONS = 'UPDATE_FROM_VERSIONS';

/* Possible messages to the reducer */
export function initializeState(newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}

export function updateMarketDetails(marketDetail) {
  return {
    type: UPDATE_MARKET_DETAILS,
    marketDetail,
  };
}

export function versionsUpdateDetails(marketDetails) {
  return {
    type: UPDATE_FROM_VERSIONS,
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

function doUpdateMarketDetails(state, action) {
  const { marketDetail } = action;
  const { marketDetails: oldMarketDetails } = state;
  const newDetails = addByIdAndVersion([marketDetail], oldMarketDetails)
  return {
    ...removeInitializing(state),
    marketDetails: newDetails,
  };
}

function doUpdateMarketsDetails(state, action) {
  const { marketDetails } = action;
  const { marketDetails: oldMarketDetails } = state;
  //From network fix up for storage already at API level
  const newDetails = addByIdAndVersion(marketDetails, oldMarketDetails)
  return {
    ...removeInitializing(state),
    marketDetails: newDetails,
  };
}

function removeStoredMarkets(state, action) {
  const { marketIds } = action;
  const { marketDetails } = state;
  const newMarketDetails = marketDetails.filter((market) => (!marketIds.includes(market.id)));
  return {
    ...state,
    marketDetails: newMarketDetails,
  };
}

function computeNewState(state, action) {
  // console.debug(`Computing state with type ${action.type}`);
  switch (action.type) {
    case UPDATE_MARKET_DETAILS:
      return doUpdateMarketDetails(state, action);
    case UPDATE_FROM_VERSIONS:
      return doUpdateMarketsDetails(state, action);
    case REMOVE_MARKET_DETAILS:
      return removeStoredMarkets(state, action);
    case INITIALIZE_STATE:
      return action.newState;
    default:
      return state;
  }
}

let marketsStoragePromiseChain = Promise.resolve(true);

function reducer(state, action) {
  const newState = computeNewState(state, action);
  if (action.type !== INITIALIZE_STATE) {
    const { isLeader } = leaderContextHack;
    if (isLeader) {
      const lfh = new LocalForageHelper(MARKET_CONTEXT_NAMESPACE);
      marketsStoragePromiseChain = marketsStoragePromiseChain.then(() => {
        return lfh.setState(newState).then(() => {
          console.info('Updated market context storage.');
        });
      });
    }
  }
  return newState;
}

export default reducer;
