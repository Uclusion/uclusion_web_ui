import { getAccountClient, getMarketClient } from './uclusionClient'
import { toastErrorAndThrow } from '../utils/userMessage'
import { dehighlightMessage } from '../contexts/NotificationsContext/notificationsContextReducer'
import _ from 'lodash'
import { removeWorkListItem } from '../pages/Home/YourWork/WorkListItem'

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

export function deleteOrDehilightMessages(messages, messagesDispatch, removeClass, doRemove=true,
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
      removeWorkListItem(message, removeClass, messagesDispatch);
    } else {
      messagesDispatch(dehighlightMessage(message));
    }
  });
  let promiseChain = Promise.resolve(true);
  if (!_.isEmpty(useMarketIds) && doRemove) {
    Object.keys(useMarketIds).forEach((key) => {
      promiseChain = promiseChain.then(() => getMarketClient(key)
        .then((client) => client.users.removeNotifications(useMarketIds[key])));
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
        toastErrorAndThrow(error, 'errorPromoApplyFailed')
      }
    });
}

export function validatePromoCode(promoCode) {
  return getAccountClient()
    .then((client) => client.users.validatePromoCode(promoCode))
    .catch((error) => toastErrorAndThrow(error, 'errorPromoValidateFailed'));
}

export function startSubscription(paymentId, tier) {
  return getAccountClient()
    .then((client) => client.users.startSubscription(paymentId, tier))
    .catch((error) => toastErrorAndThrow(error, 'errorStartSubFailed'));
}

export function endSubscription() {
  return getAccountClient()
    .then((client) => client.users.cancelSubscription())
    .catch((error) => toastErrorAndThrow(error, 'errorCancelSubFailed'));
}

export function restartSubscription(paymentId) {
  return getAccountClient()
    .then((client) => client.users.restartSubscription(paymentId))
    .catch((error) => toastErrorAndThrow(error, 'errorRestartSubFailed'));
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

export function getPaymentInfo() {
  return getAccountClient()
    .then((client) => client.users.getPaymentInfo());
}

export function addParticipants(marketId, participants) {
  return getMarketClient(marketId)
    .then((client) => client.users.addUsers(participants))
    .catch((error) => toastErrorAndThrow(error, 'errorAddParticipantsFailed'));
}

export function inviteParticipants(marketId, participants) {
  return getMarketClient(marketId)
    .then((client) => client.users.inviteUsers(participants))
    .catch((error) => toastErrorAndThrow(error, 'errorInviteParticipantsFailed'));
}

export function updateUser(userOptions) {
  return getAccountClient().then((client) => client.users.update(userOptions))
    .catch((error) => toastErrorAndThrow(error, 'errorUpdateUserFailed'));
}
