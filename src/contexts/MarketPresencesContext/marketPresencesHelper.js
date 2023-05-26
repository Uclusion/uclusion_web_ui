import { addMarketPresence, patchInvestment } from './marketPresencesContextReducer'
import _ from 'lodash'
import { isEveryoneGroup } from '../GroupMembersContext/groupMembersHelper'
import { useContext } from 'react';
import { MarketPresencesContext } from './MarketPresencesContext';

export function addPresenceToMarket(dispatch, marketId, presence) {
  dispatch(addMarketPresence(marketId, presence));
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

export function getReasonForVote(vote, marketComments) {
  return marketComments.find((comment) => comment.id === vote?.comment_id) || {};
}

export function getGroupPresences(presences, groupMembersState, marketId, groupId, includeDeleted=false) {
  const presencesFiltered = presences.filter((presence) => !presence.market_banned);
  const groupCapabilities = groupMembersState[groupId] || [];
  const groupPresences = (isEveryoneGroup(groupId, marketId) || _.isEmpty(groupId)) ? presencesFiltered
    : presencesFiltered.filter((presence) => groupCapabilities.find((groupCapability) =>
      (!groupCapability.deleted || includeDeleted) && groupCapability.id === presence.id));
  if (includeDeleted) {
    return groupPresences.map((presence) => {
      const groupMember = groupCapabilities.find((groupCapability) => (groupCapability.id === presence.id));
      return { ...presence, deleted: groupMember.deleted };
    });
  }
  return groupPresences;
}

export function usePresences(marketId) {
  const [presencesState] = useContext(MarketPresencesContext);
  return getMarketPresences(presencesState, marketId) || [];
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

export function changePresence(presence, dispatch, marketId, newValues) {
  if (!presence) {
    return;
  }
  const newPresence = {
    ...presence,
    ...newValues
  };
  dispatch(addMarketPresence(marketId, newPresence));
}

export function changeMyPresence(state, dispatch, marketId, newValues) {
  const marketPresences = getMarketPresences(state, marketId);
  if (!marketPresences) {
    return;
  }
  const myPresence = marketPresences.find((presence) => presence.current_user);
  changePresence(myPresence, dispatch, marketId, newValues);
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