import _ from 'lodash'
import { updateStorableInvestibles, versionsUpdateInvestibles } from './investiblesContextReducer'
import { fixupItemForStorage } from '../ContextUtils'
import { addContents } from '../DiffContext/diffContextReducer'
import { pushMessage } from '../../utils/MessageBusUtils'
import {
  INDEX_INVESTIBLE_TYPE,
  INDEX_UPDATE,
  SEARCH_INDEX_CHANNEL
} from '../SearchIndexContext/searchIndexContextMessages'
import { TICKET_INDEX_CHANNEL } from '../TicketContext/ticketIndexContextMessages'
import { getMarketInfo } from '../../utils/userFunctions'

export function getMarketInvestibles(state, marketId, searchResults={}, isInbox=false) {
  const { results, parentResults, search } = searchResults;
  const values = Object.values(state);
  return values.filter((inv) => {
    const { investible } = inv;
    const marketInfo = getMarketInfo(inv, marketId);
    if ((!_.isEmpty(search) && !isInbox) && !(results.find((item) => item.id === investible.id) ||
      parentResults.find((id) => id === investible.id))) {
      return false;
    }
    return !_.isEmpty(marketInfo);
  });
}

export function getMarketLabels(state, marketId) {
  const investibles = getMarketInvestibles(state, marketId);
  let labels = [];
  investibles.forEach((inv) => {
    const { investible: { label_list: labelList } } = inv;
    labels = _.union(labels, labelList);
  });
  return labels;
}

export function getInvestible(state, investibleId) {
  return state[investibleId];
}

export function getInvestibleName(investibleState, investibleId) {
  const inv = getInvestible(investibleState, investibleId);
  if (!inv) {
    return undefined;
  }
  const { investible } = inv;
  const { name } = investible;
  return name;
}

export function getInvestiblesInStage(investibles, stageId, marketId) {
  return investibles.filter((inv) => {
    const marketInfo = getMarketInfo(inv, marketId) || {};
    return marketInfo.stage === stageId;
  });
}

export function addInvestible(dispatch, diffDispatch, inv) {
  const { investible: myInvestible } = inv;
  const { id } = myInvestible;
  if (!id) {
    console.error('Attempting to store a corrupted investible');
    return;
  }
  return refreshInvestibles(dispatch, diffDispatch, [inv]);
}

export function refreshInvestibles(dispatch, diffDispatch, investibles, fromNetwork) {
  if (_.isEmpty(investibles)) {
    return;
  }
  let malformed = false;
  investibles.forEach((inv) => {
    if (_.isEmpty(inv) || _.isEmpty(inv.investible)) {
      malformed = true;
    }
  });
  if (malformed) {
    return;
  }
  pushMessage(SEARCH_INDEX_CHANNEL, { event: INDEX_UPDATE, itemType: INDEX_INVESTIBLE_TYPE, items: investibles});
  const fixed = investibles.map((item) => {
    const { investible, market_infos, updated_by_you } = item;
    const fixedInvestible = fixupItemForStorage(investible);
    return { investible: fixedInvestible, market_infos, updated_by_you };
  });
  const ticketCodeItems = [];
  investibles.forEach((inv) => {
    const { market_infos: marketInfos, investible } = inv;
    marketInfos.forEach((item) => {
      const {market_id: marketId, ticket_code: ticketCode} = item;
      if (ticketCode) {
        ticketCodeItems.push({ ticketCode, marketId, investibleId: investible.id });
      }
    });
  });
  pushMessage(TICKET_INDEX_CHANNEL, ticketCodeItems);
  const diffInvestibles = fixed.map((inv) => {
    const { investible, updated_by_you } = inv;
    return { ...investible, updated_by_you };
  });
  diffDispatch(addContents(diffInvestibles));
  if (fromNetwork) {
    dispatch(versionsUpdateInvestibles(fixed));
  }
  else {
    dispatch(updateStorableInvestibles(fixed));
  }
}

