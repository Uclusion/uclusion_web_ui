import { getMarketClient } from './marketLogin'
import { toastErrorAndThrow } from '../utils/userMessage'
import _ from 'lodash'
import { removeWorkListItem } from '../pages/Home/YourWork/WorkListItem'
import { dehighlightMessages } from '../contexts/NotificationsContext/notificationsContextReducer';
import { getAccountClient } from './homeAccount';

export function unbanUser(marketId, userId) {
  return getMarketClient(marketId)
    .then((client) => client.users.banUser(userId, false))
    .catch((error) => toastErrorAndThrow(error, 'errorUnbanUserFailed'));
}

export function banUser(marketId, userId) {
  return getMarketClient(marketId)
    .then((client) => client.users.banUser(userId, true))
    .catch((error) => toastErrorAndThrow(error, 'errorBanUserFailed'));
}

export function newSecret(marketId) {
  return getMarketClient(marketId).then((client) => client.users.newSecret())
    .catch((error) => toastErrorAndThrow(error, 'errorNewSecretFailed'));
}

export function getSecret(marketId) {
  return getMarketClient(marketId).then((client) => client.users.getSecret())
    .catch((error) => toastErrorAndThrow(error, 'errorSecretFailed'));
}

export function pokeComment(marketId, commentId) {
  return getMarketClient(marketId)
    .then((client) => client.users.pokeComment(commentId))
    .catch((error) => toastErrorAndThrow(error, 'errorPokeFailed'));
}

export function pokeInvestible(marketId, investibleId) {
  return getMarketClient(marketId)
    .then((client) => client.users.pokeInvestible(investibleId))
    .catch((error) => toastErrorAndThrow(error, 'errorPokeFailed'));
}

export function deleteOrDehilightMessages(messages, messagesDispatch, doRemove=true,
  highlightOnly=false) {
  const useMarketIds = {};
  messages.forEach((message) => {
    const { market_id: marketId, type_object_id: typeObjectId } = message;
    let typeObjectIds;
    if (useMarketIds[marketId]){
      typeObjectIds = useMarketIds[marketId];
    } else {
      typeObjectIds = [];
      useMarketIds[marketId] = typeObjectIds;
    }
    typeObjectIds.push(typeObjectId);
    if (!highlightOnly && typeObjectId.startsWith('UNREAD')) {
      removeWorkListItem(message, messagesDispatch);
    } else {
      messagesDispatch(dehighlightMessages([typeObjectId]));
    }
  });
  let promiseChain = Promise.resolve(true);
  if (!_.isEmpty(useMarketIds) && doRemove) {
    Object.keys(useMarketIds).forEach((key) => {
      promiseChain = promiseChain.then(() => getMarketClient(key)
        .then((client) => {
          if (highlightOnly) {
            return client.users.dehighlightNotifications(useMarketIds[key]);
          }
          return client.users.removeNotifications(useMarketIds[key]);
        }));
    });
  }
  return promiseChain;
}

export function applyPromoCode(promoCode) {
  return getAccountClient()
    .then((client) => client.users.addPromoToSubscription(promoCode))
    .catch((error) => {
      const { status } = error;
      // status 409 means they're reusing the code so no toast needed
      if (status === 409) {
        throw error;
      }else {
        return toastErrorAndThrow(error, 'errorPromoApplyFailed')
      }
    });
}

export function validatePromoCode(promoCode) {
  return getAccountClient()
    .then((client) => client.users.validatePromoCode(promoCode))
    .catch((error) => toastErrorAndThrow(error, 'errorPromoValidateFailed'));
}

export function endSubscription() {
  return getAccountClient()
    .then((client) => client.users.cancelSubscription())
    .catch((error) => toastErrorAndThrow(error, 'errorCancelSubFailed'));
}

export function updatePaymentInfo(paymentId) {
  return getAccountClient()
    .then((client) => client.users.updatePaymentInfo(paymentId))
    .catch((error) => toastErrorAndThrow(error, 'errorUpdatePaymentFailed'));
}

export function getInvoices() {
  return getAccountClient()
    .then((client) => client.users.getInvoices());
}

export function getSubscriptionInfo() {
  return getAccountClient()
    .then((client) => client.users.getSubscriptionInfo());
}

export function addParticipants(marketId, participants) {
  return getMarketClient(marketId)
    .then((client) => client.users.addUsers(participants))
    .catch((error) => toastErrorAndThrow(error, 'errorAddParticipantsFailed'));
}

export function inviteParticipants(marketId, participants, groupId) {
  return getMarketClient(marketId)
    .then((client) => client.users.inviteUsers(participants, groupId))
    .catch((error) => toastErrorAndThrow(error, 'errorInviteParticipantsFailed'));
}

export function updateUser(userOptions) {
  return getAccountClient().then((client) => client.users.update(userOptions))
    .catch((error) => toastErrorAndThrow(error, 'errorUpdateUserFailed'));
}
