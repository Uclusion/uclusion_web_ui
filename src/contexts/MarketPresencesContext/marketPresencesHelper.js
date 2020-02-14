import { addMarketPresence } from './marketPresencesContextReducer';

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

export function marketHasOnlyCurrentUser(state, marketId){
  const presences = getMarketPresences(state, marketId);
  if (!presences) {
    return false;
  }
  // if you can get the market presences, you're guaranteed that there's at least one, and it contains you
  // hence if you have more than one, then you have somebody else.
  return presences.length === 1;
}