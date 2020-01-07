import { getAccountClient, getMarketClient } from './uclusionClient';
import { toastErrorAndThrow } from '../utils/userMessage';

export function deleteMessage(message) {
  const { marketId, type_object_id: typeObjectId, aType } = message;
  const objectId = typeObjectId.split('_').pop();
  return getMarketClient(marketId)
    .then((client) => client.users.removeNotification(objectId, aType));
}

export function addParticipants(marketId, participants) {
  return getMarketClient(marketId)
    .then((client) => client.users.addUsers(participants))
    .catch((error) => toastErrorAndThrow(error, 'errorAddParticipantsFailed'));
}

export function updateUser(userOptions) {
  return getAccountClient().then((client) => client.users.update(userOptions))
    .catch((error) => toastErrorAndThrow(error, 'errorUpdateUserFailed'));
}
