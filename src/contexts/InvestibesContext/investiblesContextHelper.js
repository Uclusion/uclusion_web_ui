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

export function getMarketInvestibles(state, marketId) {
  const values = Object.values(state);
  return values.filter((inv) => {
    const { market_infos } = inv;
    if (!market_infos) {
      return false;
    }
    return market_infos.find((info) => info.market_id === marketId);
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

export function getInvestiblesInStage(investibles, stageId) {
  return investibles.filter((inv) => {
    const { market_infos } = inv;
    if (!market_infos) {
      return false;
    }
    return market_infos.find((info) => info.stage === stageId);
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
  const fixed = investibles.map((item) => {
    const { investible, market_infos } = item;
    const fixedInvestible = fixupItemForStorage(investible);
    return { investible: fixedInvestible, market_infos };
  });
  const diffInvestibles = fixed.map((inv) => inv.investible);
  pushMessage(SEARCH_INDEX_CHANNEL, { event: INDEX_UPDATE, itemType: INDEX_INVESTIBLE_TYPE, items: diffInvestibles});
  diffDispatch(addContents(diffInvestibles));
  const investibleHash = _.keyBy(fixed, (item) => item.investible.id);
  // // console.debug(investibleHash);
  if (fromNetwork) {
    dispatch(versionsUpdateInvestibles(investibleHash));
  }
  else {
    dispatch(updateStorableInvestibles(investibleHash));
  }
}

