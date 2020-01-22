import { getMarketUsers } from '../../api/markets';
import { updateMarketPresence } from './marketPresencesContextReducer';

export function refreshMarketPresence(dispatch, marketId) {
  return getMarketUsers(marketId)
    .then((marketUsers) => dispatch(updateMarketPresence(marketId, marketUsers)));
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
