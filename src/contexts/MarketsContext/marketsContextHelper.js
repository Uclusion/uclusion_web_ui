import { addPresenceToMarket, getMarketPresences } from '../MarketPresencesContext/marketPresencesHelper'
import { addContents } from '../DiffContext/diffContextReducer'
import _ from 'lodash'
import { updateMarketDetails, versionsUpdateDetails } from './marketsContextReducer'
import { fixupItemForStorage } from '../ContextUtils'
import { pushMessage } from '../../utils/MessageBusUtils'
import { INDEX_MARKET_TYPE, INDEX_UPDATE, SEARCH_INDEX_CHANNEL } from '../SearchIndexContext/searchIndexContextMessages'
import { ACTIVE_STAGE } from '../../constants/markets'
import { PUSH_PRESENCE_CHANNEL, PUSH_STAGE_CHANNEL, VERSIONS_EVENT } from '../VersionsContext/versionsContextHelper'
import { ADD_PRESENCE } from '../MarketPresencesContext/marketPresencesMessages'

export function getMarket(state, marketId) {
  const { marketDetails } = state;
  const usedDetails = marketDetails || [];
  return usedDetails.find((market) => market.id === marketId);
}

export function marketTokenLoaded(marketId, tokensHash) {
  return tokensHash && tokensHash[`MARKET_${marketId}`];
}

export function getMyUserForMarket(state, marketId) {
  const market = getMarket(state, marketId);
  if (market) {
    const { currentUserId } = market;
    return currentUserId;
  }
  return undefined;
}

export function getMarketDetailsForType(state, marketPresencesState, marketType = 'DECISION', allowInline=false) {
  if (state.marketDetails) {
    return state.marketDetails.filter((market) => {
      const { id } = market;
      const marketPresences = getMarketPresences(marketPresencesState, id) || [];
      const myPresence = marketPresences.find((presence) => presence.current_user) || {};
      if (myPresence.market_banned) {
        return false;
      }
      return market.market_type === marketType && (allowInline || !market.parent_comment_id);
    });
  }
  return null;
}

export function getHiddenMarketDetailsForUser(state, marketPresenceState, searchResults = {}) {
  const { marketDetails } = state;
  const { results, parentResults, search } = searchResults;
  if (marketDetails) {
    return marketDetails.filter((market) => {
      const { id, market_stage: marketStage } = market;
      const marketPresences = getMarketPresences(marketPresenceState, id) || [];
      const myPresence = marketPresences.find((presence) => presence.current_user) || {};
      if (myPresence.market_banned) {
        return false; // banned markets don't show up in the archives
      }
      const shown = marketStage !== ACTIVE_STAGE || !myPresence.following;
      if (_.isEmpty(search)) {
        return shown;
      }
      return shown && (results.find((item) => item.id === id) || parentResults.find((parentId) => parentId === id));
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
  if (presenceDispatch) {
    addPresenceToMarket(presenceDispatch, marketId, presence);
  } else {
    pushMessage(PUSH_PRESENCE_CHANNEL, { event: ADD_PRESENCE, marketId, presence });
  }
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

export function getNotHiddenMarketDetailsForUser(state, marketPresencesState, searchResults={}) {
  const { results, parentResults, search } = searchResults;
  if (state.marketDetails) {
    const newMarketDetails = state.marketDetails.filter((market) => {
      const marketPresences = getMarketPresences(marketPresencesState, market.id) || [];
      const myPresence = marketPresences.find((presence) => presence.current_user) || {};
      const { following } = myPresence;
      const { market_stage: marketStage } = market;
      const marketShown = marketStage === ACTIVE_STAGE && following;
      if (_.isEmpty(search)) {
        return marketShown;
      }
      return marketShown && (results.find((item) => (item.id === market.id)||(item.marketId === market.id))
        || parentResults.find((parentId) => parentId === market.id));
    });
    return { marketDetails: newMarketDetails };
  }
  return state;
}
