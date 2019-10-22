import { getMarketUsers } from '../../api/markets';
import { updateMarketPresence } from './marketPresencesContextReducer';

export function refreshMarketPresence(dispatch, marketId) {
  return getMarketUsers(marketId)
    .then((marketUsers) => {
      dispatch(updateMarketPresence(marketId, marketUsers));
    });
}

export function getCurrentUserInvestment(state, investibleId, marketId, investingUser) {
  if (investingUser) {
    const { id } = investingUser;
    const marketUsers = state[marketId];
    if (marketUsers) {
      const userPresence = marketUsers.find((marketUser) => marketUser.id === id);
      if (userPresence) {
        const { investments } = userPresence;
        // eslint-disable-next-line max-len
        const investibleInvestment = investments.find((investment) => investment.investible_id === investibleId);
        if (investibleInvestment) {
          const { quantity } = investibleInvestment;
          console.debug(`Rerendered quantity is ${quantity}`);
          return quantity;
        }
      }
    }
  }
  console.debug('Quantity undefined');
  return undefined;
}
