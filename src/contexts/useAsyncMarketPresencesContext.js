import { useContext } from 'react';
import { AsyncMarketPresencesContext } from './AsyncMarketPresencesContext';
import useAsyncMarketContext from './useAsyncMarketsContext';

function useAsyncMarketPresencesContext() {
  const { stateCache, refreshMarketPresence } = useContext(AsyncMarketPresencesContext);
  const { getCurrentUser } = useAsyncMarketContext();

  function getCurrentUserInvestment(investibleId, marketId) {
    return getCurrentUser().then((investingUser) => {
      if (investingUser) {
        const { usersPresenceList } = stateCache;
        const { id } = investingUser;
        const marketUsers = usersPresenceList[marketId];
        if (marketUsers) {
          const userPresence = marketUsers.find((marketUser) => marketUser.id === id);
          if (userPresence) {
            const { investments } = userPresence;
            // eslint-disable-next-line max-len
            const investibleInvestment = investments.find((investment) => investment.investible_id === investibleId);
            if (investibleInvestment) {
              const { quantity } = investibleInvestment;
              console.debug(`Quantity is ${quantity}`);
              return quantity;
            }
          }
        }
      }
      console.debug('Quantity undefined');
      return undefined;
    });
  }

  return {
    ...stateCache,
    refreshMarketPresence,
    getCurrentUserInvestment,
  };
}

export default useAsyncMarketPresencesContext;
