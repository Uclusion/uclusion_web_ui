import { ACTIVE_STAGE, ARCHIVED_STAGE } from '../../constants/markets';
import { getMarketPresences } from '../MarketPresencesContext/marketPresencesHelper';

export function getMarket(state, marketId) {
  const { marketDetails } = state;
  return marketDetails.find((market) => market.id === marketId);
}

export function getMyUserForMarket(state, marketId) {
  const market = getMarket(state, marketId);
  if (market) {
    const { currentUser } = market;
    return currentUser;
  }
  return undefined;
}

export function getActiveMarketDetailsForType(state, marketType = 'DECISION') {
  if (state.marketDetails) {
    // eslint-disable-next-line max-len
    return state.marketDetails.filter((market) => market.market_type === marketType && market.market_stage === ACTIVE_STAGE);
  }
  return null;
}

export function getNotHiddenMarketDetailsForUser(state, marketPresencesState) {
  if (state.marketDetails) {
    const newMarketDetails = state.marketDetails.filter((market) => {
      const marketPresences = getMarketPresences(marketPresencesState, market.id) || [];
      const myPresence = marketPresences.find((presence) => presence.current_user) || {};
      const { market_hidden: marketHidden } = myPresence;
      return marketHidden === undefined || !marketHidden;
    });
    return { marketDetails: newMarketDetails };
  }
  return state;
}

export function getArchivedMarketDetailsForType(state, marketType = 'DECISION') {
  if (state.marketDetails) {
    // eslint-disable-next-line max-len
    return state.marketDetails.filter((market) => market.market_type === marketType && market.market_stage === ARCHIVED_STAGE);
  }
  return null;
}


export function getAllMarketDetails(state) {
  return state.marketDetails;
}
