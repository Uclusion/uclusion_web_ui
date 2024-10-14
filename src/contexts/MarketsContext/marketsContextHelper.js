import { addPresenceToMarket, getMarketPresences } from '../MarketPresencesContext/marketPresencesHelper'
import { updateMarketDetails, versionsUpdateDetails } from './marketsContextReducer'
import { fixupItemForStorage } from '../ContextUtils'
import { pushMessage } from '../../utils/MessageBusUtils'
import { ACTIVE_STAGE, SUPPORT_SUB_TYPE } from '../../constants/markets';
import { ADD_PRESENCE } from '../MarketPresencesContext/marketPresencesMessages'
import { PUSH_PRESENCE_CHANNEL, PUSH_STAGE_CHANNEL, VERSIONS_EVENT } from '../../api/versionedFetchUtils'
import _ from 'lodash';

export function getMarket(state, marketId) {
  const { marketDetails } = state;
  const usedDetails = marketDetails || [];
  return usedDetails.find((market) => market?.id === marketId);
}

export function marketIsDemo(market) {
  return market?.object_type === 'DEMO';
}

export function marketTokenLoaded(marketId, tokensHash) {
  return tokensHash && tokensHash[`MARKET_${marketId}`];
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

export function getSortedMarkets(filtered) {
  return _.sortBy(filtered, (market) => market.market_stage !== 'Active',
    (market) => market.market_sub_type === SUPPORT_SUB_TYPE, 'name');
}

export function getNotHiddenMarketDetailsForUser(state, marketPresencesState) {
  if (state.marketDetails) {
    const newMarketDetails = state.marketDetails.filter((market) => {
      if(!market){
        return false;
      }
      const marketPresences = getMarketPresences(marketPresencesState, market?.id);
      const myPresence = marketPresences?.find((presence) => presence.current_user);
      return !myPresence?.market_banned;
    });
    return { marketDetails: newMarketDetails };
  }
  return state;
}
