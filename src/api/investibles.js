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

export { updateInvestible, addInvestible };
