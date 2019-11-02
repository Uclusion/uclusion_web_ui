import _ from 'lodash';
import { getMarketList } from '../../api/sso';
import {
  fixupItemsForStorage,
  getOutdatedObjectIds,
  removeDeletedObjects
} from '../ContextUtils';
import { initializeState, updateAllMarketDetails, updateMarketsList } from './marketsContextReducer';
import { getMarketDetails } from '../../api/markets';
import { EMPTY_STATE, MARKET_CONTEXT_NAMESPACE } from './MarketsContext';
import LocalForageHelper from '../LocalForageHelper';

export function getMarket(state, marketId) {
  const { marketDetails } = state;
  const market = marketDetails.find((market) => market.id === marketId);
  return market;
}


export function getMyUserForMarket(state, marketId) {
  const market = getMarket(state, marketId);
  if (market) {
    const { currentUser } = market;
    return currentUser;
  }
  return undefined;
}

export function getMarketDetailsForType(state, marketType = 'DECISION') {
  if (state.marketDetails) {
    return state.marketDetails.filter((market) => market.market_type === marketType);
  }
  return null;
}


export function getAllMarketDetails(state) {
  return state.marketDetails;
}

export function getAllMarkets(state) {
  return state.markets;
}

export function refreshMarkets(dispatch) {
  const lfh = new LocalForageHelper(MARKET_CONTEXT_NAMESPACE);
  return lfh.getState().then((state) => {
    const usedState = state || EMPTY_STATE;
    return getMarketList()
      .then((marketList) => {
        console.debug(marketList);
        const filteredDetails = removeDeletedObjects(marketList, usedState.marketDetails);
        // console.debug(`Filtered Details ${filteredDetails}`);
        const outdated = getOutdatedObjectIds(marketList, usedState.markets);
        console.debug(`Outdated markets ${outdated}`);
        dispatch(updateMarketsList(marketList));
        const promises = outdated.map((marketId) => getMarketDetails(marketId));
        return Promise.all(promises)
          .then((markets) => {
            //  console.debug('Got new details');
            const fixedUp = fixupItemsForStorage(markets);
            const newDetails = _.unionBy(fixedUp, filteredDetails, 'id');
            console.log(newDetails);
            dispatch(updateAllMarketDetails(newDetails));
          });
      });
  });
}

export function clearState(dispatch) {
  dispatch(initializeState(EMPTY_STATE));
}
