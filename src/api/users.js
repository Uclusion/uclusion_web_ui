import { getMarketClient } from './uclusionClient';

export function deleteMessage(message) {
  const { marketId, investibleId, aType } = message;
  const objectId = investibleId || marketId;
  return getMarketClient(marketId)
    .then((client) => client.users.removeNotification(objectId, aType));
}
