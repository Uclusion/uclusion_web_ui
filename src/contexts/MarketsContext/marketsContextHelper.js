import _ from 'lodash';
import { getMarketList } from '../../api/sso';
import { convertDates, getOutdatedObjectIds, removeDeletedObjects } from '../ContextUtils';
import { initializeState, updateAllMarketDetails, updateMarketsList } from './marketsContextReducer';
import { getMarketDetails } from '../../api/markets';
import { EMPTY_STATE, MARKET_CONTEXT_NAMESPACE } from './MarketsContext';
import LocalForageHelper from '../LocalForageHelper';

export function getCurrentMarket(state) {
  return state.currentMarket;
}

export function getCurrentUser(state) {
  const { marketDetails, currentMarket } = state;
  if (currentMarket) {
    const { id: marketId } = currentMarket;
    const currentMarketDetails = marketDetails.find((item) => item.id === marketId);
    if (currentMarketDetails) {
      const { currentUser } = currentMarketDetails;
      return currentUser;
    }
  }
  return undefined;
}

export function getAllMarketDetails(state) {
  return state.marketDetails;
}

export function getAllMarkets(state) {
  return state.marketsList;
}

export function refreshMarkets(dispatch) {
  const lfh = new LocalForageHelper(MARKET_CONTEXT_NAMESPACE);
  return lfh.getState((state) => {
    return getMarketList()
      .then((marketList) => {
        const filteredDetails = removeDeletedObjects(marketList, state.marketDetails);
        // console.debug(`Filtered Details ${filteredDetails}`);
        const outdated = getOutdatedObjectIds(marketList, state.marketsList);
        console.debug(`Outdated markets ${outdated}`);
        dispatch(updateMarketsList(marketList));
        const promises = outdated.map((marketId) => getMarketDetails(marketId));
        return Promise.all(promises)
          .then((markets) => {
            //  console.debug('Got new details');
            const dateConverted = markets.map((market) => convertDates(market));
            const newDetails = _.unionBy(dateConverted, filteredDetails, 'id');
            console.log(newDetails);
            dispatch(updateAllMarketDetails(newDetails));
          });
      });
  });
}

export function clearState(dispatch) {
  dispatch(initializeState(EMPTY_STATE));
}
