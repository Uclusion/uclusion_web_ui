import { addPresenceToMarket, getMarketPresences } from '../MarketPresencesContext/marketPresencesHelper'
import { addContents } from '../DiffContext/diffContextReducer'
import { updateMarketDetails, versionsUpdateDetails } from './marketsContextReducer'
import { fixupItemForStorage } from '../ContextUtils'
import { pushMessage } from '../../utils/MessageBusUtils'
import { INDEX_MARKET_TYPE, INDEX_UPDATE, SEARCH_INDEX_CHANNEL } from '../SearchIndexContext/searchIndexContextMessages'
import { ACTIVE_STAGE } from '../../constants/markets'
import { PUSH_STAGE_CHANNEL, VERSIONS_EVENT } from '../VersionsContext/versionsContextHelper'

export function getMarket(state, marketId) {
  const { marketDetails } = state;
  const usedDetails = marketDetails || [];
  return usedDetails.find((market) => market.id === marketId);
}

export function getMyUserForMarket(state, marketId) {
  const market = getMarket(state, marketId);
  if (market) {
    const { currentUserId } = market;
    return currentUserId;
  }
  return undefined;
}

export function getMarketDetailsForType(state, marketPresencesState, marketType = 'DECISION') {
  if (state.marketDetails) {
    // eslint-disable-next-line max-len
    return state.marketDetails.filter((market) => {
      const { id } = market;
      const marketPresences = getMarketPresences(marketPresencesState, id) || [];
      const myPresence = marketPresences.find((presence) => presence.current_user) || {};
      if (myPresence.market_banned) {
        return false;
      }
      return market.market_type === marketType && !market.parent_comment_id;
    });
  }
  return null;
}

export function getHiddenMarketDetailsForUser(state, marketPresenceState) {
  const { marketDetails } = state;
  if (marketDetails) {
    return marketDetails.filter((market) => {
      const { id, market_stage: marketStage } = market;
      if (marketStage !== ACTIVE_STAGE) {
        return true;
      }
      const marketPresences = getMarketPresences(marketPresenceState, id) || [];

      const myPresence = marketPresences.find((presence) => presence.current_user) || {};
      if (myPresence.market_banned) {
        return false; // banned markets don't show up in the archives
      }
      return !myPresence.following;
    });
  }
  return [];
}

export function addMarket(result, marketDispatch, diffDispatch, presenceDispatch) {
  const {
    market,
    presence,
    stages
  } = result;
  const { id: marketId } = market;
  addMarketToStorage(marketDispatch, diffDispatch, market);
  pushMessage(PUSH_STAGE_CHANNEL, { event: VERSIONS_EVENT, marketId, stages });
  addPresenceToMarket(presenceDispatch, marketId, presence);
}

/**
 *
 * @param dispatch
 * @param diffDispatch
 * @param marketDetails
 * @param fromNetwork whether this is from versios or quick add
 */
export function addMarketToStorage(dispatch, diffDispatch, marketDetails, fromNetwork) {
  if (!marketDetails.currentUserId) {
    marketDetails.currentUserId = marketDetails.current_user_id;
  }
  const fixed = fixupItemForStorage(marketDetails);
  if (diffDispatch) {
    diffDispatch(addContents([fixed]));
  }
  pushMessage(SEARCH_INDEX_CHANNEL, { event: INDEX_UPDATE, itemType: INDEX_MARKET_TYPE, items: [fixed]});
  if (fromNetwork) {
    dispatch(versionsUpdateDetails(fixed));
  } else {
    dispatch(updateMarketDetails(fixed));
  }
}

export function getNotHiddenMarketDetailsForUser(state, marketPresencesState) {
  if (state.marketDetails) {
    const newMarketDetails = state.marketDetails.filter((market) => {
      const marketPresences = getMarketPresences(marketPresencesState, market.id) || [];
      const myPresence = marketPresences.find((presence) => presence.current_user) || {};
      const { following } = myPresence;
      const { market_stage: marketStage } = market;
      return marketStage === ACTIVE_STAGE && following;
    });
    return { marketDetails: newMarketDetails };
  }
  return state;
}
