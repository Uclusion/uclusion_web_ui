import { addMarketPresence, patchInvestment } from './marketPresencesContextReducer'
import _ from 'lodash'

export function addPresenceToMarket(dispatch, marketId, presence) {
  dispatch(addMarketPresence(marketId, presence));
}

export function getMarketUnits(state, marketId) {
  const { investments } = getMarketPresences(state, marketId);
  let units = [];
  (investments || []).forEach((investment) => {
    const { max_budget_unit: unit } = investment;
    units = _.union(units, unit);
  });
  return units;
}

export function getMarketPresences(state, marketId) {
  const presences = state[marketId] || []
  return presences.map((presence) => {
    const { investments, current_user: isCurrentUser } = presence;
    if (isCurrentUser) {
      // Need to show expired investments for planning investible
      return presence;
    }
    const filteredInvestments = (investments || []).filter((investment) => !investment.deleted);
    return { ...presence, investments: filteredInvestments };
  });
}

export function getMarketPresence(state, marketId, userId) {
  const presences = getMarketPresences(state, marketId) || [];
  return presences.find((presence) => presence.id === userId);
}

export function getPresenceMap(state, marketId) {
  const presences = getMarketPresences(state, marketId) || [];
  return presences.reduce((acc, element) => {
    const { id } = element;
    return {
      ...acc,
      [id]: element,
    };
  }, {});
}

function changeMyPresence(state, dispatch, marketId, newValues) {
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

export function marketHasOnlyCurrentUser(state, marketId){
  const presences = getMarketPresences(state, marketId);
  if (!presences) {
    return false;
  }
  const filtered = presences.filter((presence) => !presence.market_banned);
  // if you can get the market presences, you're guaranteed that there's at least one, and it contains you
  // hence if you have more than one, then you have somebody else.
  return filtered.length === 1;
}
