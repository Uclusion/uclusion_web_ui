import { getAccountClient, getMarketClient } from './uclusionClient';
import { fixupItemForStorage } from '../contexts/ContextUtils';
import { ERROR, sendIntlMessage } from '../utils/userMessage';

function fixupMarketForStorage(market) {
  const itemFixed = fixupItemForStorage(market);
  const { created_at: createdAt, expiration_minutes: expirationMinutes } = itemFixed;
  const expirationMillis = createdAt.getTime() + (60000 * expirationMinutes);
  return {
    ...itemFixed,
    expires_at: expirationMillis,
  };
}

export function getMarketDetails(marketId) {
  return getMarketClient(marketId)
    .then((client) => client.markets.get()
      .then((market) => fixupMarketForStorage(market))
      .then((market) => client.users.get()
        .then((user) => ({
          ...market,
          currentUser: user,
        }))));
}

export function updateMarket(marketId, name, description, uploaded_files) {
  const updateOptions = { name, description, uploaded_files };
  console.debug(`Updating market ${marketId}`);
  console.debug(updateOptions);
  return getMarketClient(marketId)
    .then((client) => client.markets.updateMarket(updateOptions));
}

export function createDecision(marketInfo) {
  return getAccountClient()
    .then((client) => client.markets.createMarket(marketInfo))
    .catch((error) => {
      sendIntlMessage(ERROR, 'errorDecisionAddFailed');
    });
}

export function viewed(marketId, isPresent, investibleId) {
  const viewPromise = getMarketClient(marketId);
  if (investibleId) {
    return viewPromise.then((client) => client.markets.viewedInvestible(investibleId, isPresent));
  }
  return viewPromise.then((client) => client.markets.viewed(isPresent));
}

export function getMarketUsers(marketId) {
  if(!marketId) {
    console.error('No marketId');
    throw new Error("NO MARKET ID");
  }
  return getMarketClient(marketId)
    .then((client) => {
      return client.users.get() // this is me
        .then((user) => {
          return client.markets.listUsers()
            .then((presences) => {
              return presences.map((presence) => {
                if (presence.id === user.id) {
                  return { ...presence, current_user: true };
                }
                return presence;
              });
            });
        });
    });
}

export function getMarketStages(marketId) {
  return getMarketClient(marketId)
    .then((client) => client.markets.listStages());
}
