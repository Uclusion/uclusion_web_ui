import { getMarketClient } from './uclusionClient';

function updateInvestible(marketId, investibleId, name, description, uploadedFiles) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.update(investibleId, name,
      description, undefined, uploadedFiles));
}

function addInvestible(marketId, name, description, uploadedFiles) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.create(name, description, uploadedFiles));
}

function lockInvestibleForEdit(marketId, investibleId, breakLock) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.lock(investibleId, breakLock));
}

function realeaseInvestibleEditLock(marketId, investibleId) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.unlock(investibleId));
}

export { updateInvestible, addInvestible, realeaseInvestibleEditLock, lockInvestibleForEdit };
