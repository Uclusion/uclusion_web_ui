import { getMarketClient } from './uclusionClient';

export function updateInvestible(marketId, investibleId, name, description, uploadedFiles) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.update(investibleId, name,
      description, undefined, uploadedFiles));
}

export function changeInvestibleStage(marketId, investibleId, stageInfo) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.stateChange(investibleId, stageInfo));
}

export function addInvestible(marketId, name, description, uploadedFiles) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.create(name, description, uploadedFiles));
}

export function lockInvestibleForEdit(marketId, investibleId, breakLock) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.lock(investibleId, breakLock));
}

export function realeaseInvestibleEditLock(marketId, investibleId) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.unlock(investibleId));
}
