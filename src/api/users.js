import { getMarketClient } from './uclusionClient';

export function deleteMessage(message) {
  const { marketId, type_object_id: typeObjectId, aType } = message;
  const objectId = typeObjectId.split('_').pop();
  return getMarketClient(marketId)
    .then((client) => client.users.removeNotification(objectId, aType));
}
