import { addMarketPresence, patchInvestment } from './marketPresencesContextReducer'
import _ from 'lodash'
import { isEveryoneGroup } from '../GroupMembersContext/groupMembersHelper'

export function addPresenceToMarket(dispatch, marketId, presence) {
  dispatch(addMarketPresence(marketId, presence));
}

export function getMarketUnits (intl) {
  return [intl.formatMessage({ id: 'hours' }), intl.formatMessage({ id: 'days' }),
    intl.formatMessage({ id: 'points' }), intl.formatMessage({ id: 'currency' })]
}

export function removeInvestibleInvestments(state, dispatch, marketId, investibleId) {
  const presences = state[marketId] || [];
  presences.forEach((presence) => {
    const { investments: oldInvestments } = presence;
    let modified = false;
    const investments = oldInvestments.map((investment) => {
      const { investible_id: myInvestibleId, deleted } = investment;
      if (myInvestibleId !== investibleId || deleted) {
        return investment;
      }
      modified = true;
      return { ...investment, deleted: true };
    });
    if (modified) {
      const newPresence = {
        ...presence,
      };
      newPresence.investments = investments;
      dispatch(addMarketPresence(marketId, newPresence));
    }
  });
}

export function getMarketPresences(state, marketId, excludeExpired) {
  const presences = state[marketId] || []
  return presences.map((presence) => {
    const { investments, current_user: isCurrentUser } = presence;
    if (isCurrentUser && !excludeExpired) {
      // Need to show expired investments for planning investible
      return presence;
    }
    const filteredInvestments = (investments || []).filter((investment) => !investment.deleted);
    return { ...presence, investments: filteredInvestments };
  });
}

export function getGroupPresences(presences, groupMembersState, marketId, groupId) {
  const presencesFiltered = presences.filter((presence) => !presence.market_banned);
  const groupCapabilities = groupMembersState[groupId] || [];
  const groupPresences = (isEveryoneGroup(groupId, marketId) || _.isEmpty(groupId)) ? presencesFiltered
    : presencesFiltered.filter((presence) => groupCapabilities.find((groupCapability) => !groupCapability.deleted
      && groupCapability.id === presence.id));
  return groupPresences.map((presence) => {
    const { investments } = presence;
    const filteredInvestments = (investments || []).filter((investment) => !investment.deleted);
    return { ...presence, investments: filteredInvestments };
  });
}

export function getMarketPresence(state, marketId, userId) {
  const presences = getMarketPresences(state, marketId) || [];
  return presences.find((presence) => presence.id === userId);
}

export function getPresenceMap(presences) {
  return presences.reduce((acc, element) => {
    const { id } = element;
    return {
      ...acc,
      [id]: element,
    };
  }, {});
}

export function changeMyPresence(state, dispatch, marketId, newValues) {
  const marketPresences = getMarketPresences(state, marketId);
  if (!marketPresences) {
    return;
  }
  const myPresence = marketPresences.find((presence) => presence.current_user);
  if (!myPresence) {
    return;
  }
  const newPresence = {
    ...myPresence,
    ...newValues
  };
  dispatch(addMarketPresence(marketId, newPresence));
}

export function changeBanStatus(state, dispatch, marketId, userId, isBanned) {
  const presence = getMarketPresence(state, marketId, userId);
  const newPresence = {
    ...presence,
    market_banned: isBanned,
  };
  dispatch(addMarketPresence(marketId, newPresence));
}

export function changeObserverStatus(state, dispatch, marketId, isObserver) {
  const newValues = {
    following: !isObserver,
  };
  changeMyPresence(state, dispatch, marketId, newValues);
}

/** Used for quick add. Updates our investment with what data we know.
 * Has to be filled in later with an actual versions call
 */
export function partialUpdateInvestment(dispatch, investmentPatch, allowMultiVote) {
  dispatch(patchInvestment(investmentPatch, allowMultiVote))
}