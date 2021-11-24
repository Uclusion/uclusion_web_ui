import LocalForageHelper from '../../utils/LocalForageHelper'
import { MARKET_CONTEXT_NAMESPACE, MARKETS_CHANNEL } from './MarketsContext'
import { BroadcastChannel } from 'broadcast-channel'
import { broadcastId } from '../../components/ContextHacks/BroadcastIdProvider'
import { removeInitializing } from '../../components/localStorageUtils'
import { addByIdAndVersion } from '../ContextUtils'
import { getMarket } from './marketsContextHelper'
import { ACTIVE_STAGE, PLANNING_TYPE } from '../../constants/markets'
import { setCurrentWorkspace } from '../../utils/redirectUtils'

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const UPDATE_MARKET_DETAILS = 'UPDATE_MARKET_DETAILS';
const REMOVE_MARKET_DETAILS = 'REMOVE_MARKET_DETAILS';
const UPDATE_FROM_VERSIONS = 'UPDATE_FROM_VERSIONS';
const MARKET_CHANGE = 'MARKET_CHANGE';

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

export function versionsUpdateDetails(marketDetail) {
  return {
    type: UPDATE_FROM_VERSIONS,
    marketDetail,
  };
}

export function marketChange(marketId) {
  return {
    type: MARKET_CHANGE,
    marketId
  }
}

export function removeMarketDetails(marketIds) {
  return {
    type: REMOVE_MARKET_DETAILS,
    marketIds,
  };
}

function changeMarketOnNavigate(state, action) {
  const { marketId } = action;
  const market = getMarket(state, marketId) || {};
  const { market_stage: marketStage, market_type: marketType } = market;
  if (marketStage === ACTIVE_STAGE && marketType === PLANNING_TYPE) {
    setCurrentWorkspace(marketId);
  }
  return state;
}

/* Functions that mutate state */

function doUpdateMarketDetails(state, action, isQuickAdd) {
  const { marketDetail } = action;
  const { marketDetails: oldMarketDetails } = state;
  const transformedMarketDetails = isQuickAdd ? [{ ...marketDetail, fromQuickAdd: true }] : [marketDetail]
  const newDetails = addByIdAndVersion(transformedMarketDetails, oldMarketDetails)
  return {
    ...removeInitializing(state, isQuickAdd),
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
      return doUpdateMarketDetails(state, action, true);
    case UPDATE_FROM_VERSIONS:
      return doUpdateMarketDetails(state, action);
    case REMOVE_MARKET_DETAILS:
      return removeStoredMarkets(state, action);
    case INITIALIZE_STATE:
      return action.newState;
    case MARKET_CHANGE:
      return changeMarketOnNavigate(state, action);
    default:
      return state;
  }
}

let marketsStoragePromiseChain = Promise.resolve(true);

function reducer(state, action) {
  const newState = computeNewState(state, action);
  if (action.type !== INITIALIZE_STATE) {
    const lfh = new LocalForageHelper(MARKET_CONTEXT_NAMESPACE);
    marketsStoragePromiseChain = marketsStoragePromiseChain.then(() => {
        lfh.setState(newState).then(() => {
          const myChannel = new BroadcastChannel(MARKETS_CHANNEL);
          return myChannel.postMessage(broadcastId || 'markets').then(() => myChannel.close())
            .then(() => console.info('Update market context sent.'));
        });
    });
  }
  return newState;
}

export default reducer;
