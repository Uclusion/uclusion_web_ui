import _ from 'lodash';
import { findMessagesForInvestibleId } from './messageUtils';
import { getMarketInfo } from './userFunctions';

export function getNewMessages(inv, messagesState) {
  return findMessagesForInvestibleId(inv.investible.id, messagesState.messages)
    .filter((message) => message.is_highlighted);
}

export function isNew(inv, messagesState) {
  return !_.isEmpty(getNewMessages(inv, messagesState));
}

export function optionsInDisplayOrder(investibles, stage, marketId, presences, messagesState) {
  function countVoters(investibleId, isHuman) {
    return presences.filter((presence) => (isHuman === !_.isEmpty(presence.email)) &&
      presence.investments?.some((investment) => !investment.deleted && investment.quantity &&
        investment.investible_id === investibleId)).length;
  }
  const inStage = investibles.filter((inv) => {
    const info = getMarketInfo(inv, marketId);
    return info && info.stage === stage?.id && !info.deleted;
  });
  // New rows first, then human votes, AI votes and name (T-all-2301).
  return _.orderBy(inStage, [
    (inv) => isNew(inv, messagesState) ? 0 : 1,
    (inv) => countVoters(inv.investible.id, true),
    (inv) => countVoters(inv.investible.id, false),
    (inv) => inv.investible.name,
  ], ['asc', 'desc', 'desc', 'asc']);
}
