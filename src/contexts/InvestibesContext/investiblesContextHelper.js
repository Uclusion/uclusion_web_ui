import _ from 'lodash';
import { updateStorableInvestibles } from './investiblesContextReducer'
import { fixupItemForStorage } from '../ContextUtils';
import { addContents } from '../DiffContext/diffContextReducer'

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

export function getInvestible(state, investibleId) {
  // console.debug(state);
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

export function refreshInvestibles(dispatch, diffDispatch, investibles) {
  const fixed = investibles.map((item) => {
    const { investible, market_infos } = item;
    const fixedInvestible = fixupItemForStorage(investible);
    return { investible: fixedInvestible, market_infos };
  });
  const diffInvestibles = fixed.map((inv) => inv.investible);
  diffDispatch(addContents(diffInvestibles));
  const investibleHash = _.keyBy(fixed, (item) => item.investible.id);
  // console.debug(investibleHash);
  dispatch(updateStorableInvestibles(investibleHash));
}

