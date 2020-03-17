import { addMarketPresence, patchInvestment } from './marketPresencesContextReducer';

export function addPresenceToMarket(dispatch, marketId, presence) {
  dispatch(addMarketPresence(marketId, presence));
}

export function getMarketPresences(state, marketId) {
  return state[marketId];
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

export function changeMarketHidden(state, dispatch, marketId, hidden) {
  const newValues = {
    market_hidden: hidden
  };
  changeMyPresence(state, dispatch, marketId, newValues);
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
export function partialUpdateInvestment(dispatch, investmentPatch) {
  dispatch(patchInvestment(investmentPatch))
}

export function marketHasOnlyCurrentUser(state, marketId){
  const presences = getMarketPresences(state, marketId);
  if (!presences) {
    return false;
  }
  // if you can get the market presences, you're guaranteed that there's at least one, and it contains you
  // hence if you have more than one, then you have somebody else.
  return presences.length === 1;
}
