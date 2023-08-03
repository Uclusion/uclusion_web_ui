import { addPresenceToMarket, getMarketPresences } from '../MarketPresencesContext/marketPresencesHelper'
import _ from 'lodash'
import { updateMarketDetails, versionsUpdateDetails } from './marketsContextReducer'
import { fixupItemForStorage } from '../ContextUtils'
import { pushMessage } from '../../utils/MessageBusUtils'
import { ACTIVE_STAGE } from '../../constants/markets'
import { ADD_PRESENCE } from '../MarketPresencesContext/marketPresencesMessages'
import { PUSH_PRESENCE_CHANNEL, PUSH_STAGE_CHANNEL, VERSIONS_EVENT } from '../../api/versionedFetchUtils'

export function getMarket(state, marketId) {
  const { marketDetails } = state;
  const usedDetails = marketDetails || [];
  return usedDetails.find((market) => market?.id === marketId);
}

export function getFailedSignatures(state) {
  const { failedSignatures } = state || {};
  return failedSignatures;
}

export function marketTokenLoaded(marketId, tokensHash) {
  return tokensHash && tokensHash[`MARKET_${marketId}`];
}

export function hasNoChannels(tokensHash) {
  // To have a channel must have the account plus support market plus one market
  return _.size(tokensHash) < 3;
}

export function getMarketDetailsForType(state, marketPresencesState, marketType = 'DECISION',
  allowInline=false) {
  if (state.marketDetails) {
    return state.marketDetails.filter((market) => {
      const { market_stage: marketStage, id } = market;
      if (marketStage !== ACTIVE_STAGE) {
        return false;
      }
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

export function x(state, marketPresenceState, searchResults = {}) {
  const { marketDetails } = state;
  const { results, parentResults, search } = searchResults;
  if (marketDetails) {
    return marketDetails.filter((market) => {
      if(!market){
        return false;
      }
      const { id, market_stage: marketStage, market_sub_type: marketSubType } = market;
      const marketPresences = getMarketPresences(marketPresenceState, id) || [];
      const myPresence = marketPresences.find((presence) => presence.current_user) || {};
      if (myPresence.market_banned || 'SUPPORT' === marketSubType) {
        return false;
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

export function addMarket(result, marketDispatch, presenceDispatch) {
  const {
    market,
    presence,
    stages
  } = result;
  const { id: marketId } = market;
  addMarketToStorage(marketDispatch, market);
  if (stages) {
    pushMessage(PUSH_STAGE_CHANNEL, { event: VERSIONS_EVENT, stageDetails: { [marketId]: stages } });
  }
  if (presence) {
    if (presenceDispatch) {
      addPresenceToMarket(presenceDispatch, marketId, presence);
    } else {
      pushMessage(PUSH_PRESENCE_CHANNEL, { event: ADD_PRESENCE, marketId, presence });
    }
  }
}

/**
 *
 * @param dispatch
 * @param marketDetails
 */
export function addMarketToStorage(dispatch, marketDetails) {
  if (!marketDetails.currentUserId) {
    marketDetails.currentUserId = marketDetails.current_user_id;
  }
  const fixed = fixupItemForStorage(marketDetails);
  dispatch(updateMarketDetails(fixed));
}

export function addMarketsToStorage(dispatch, marketDetails) {
  dispatch(versionsUpdateDetails(marketDetails));
}

export function getNotHiddenMarketDetailsForUser(state, marketPresencesState) {
  if (state.marketDetails) {
    const newMarketDetails = state.marketDetails.filter((market) => {
      if(!market){
        return false;
      }
      const marketPresences = getMarketPresences(marketPresencesState, market?.id);
      const myPresence = marketPresences?.find((presence) => presence.current_user);
      if (myPresence?.market_banned) {
        return false;
      }
      const { market_sub_type } = market;
      return 'SUPPORT' !== market_sub_type;
    });
    return { marketDetails: newMarketDetails };
  }
  return state;
}
