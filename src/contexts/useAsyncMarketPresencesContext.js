import { useContext, useState } from 'react';
import { AsyncMarketPresencesContext } from './AsyncMarketPresencesContext';
import { getMarketUser } from '../api/markets';

function useAsyncMarketPresencesContext() {
  const { stateCache, refreshMarketPresence } = useContext(AsyncMarketPresencesContext);
  const [currentUser, setCurrentUser] = useState(undefined);

  function getCurrentUser(marketId) {
    if (currentUser) {
      return Promise.resolve(currentUser);
    }
    return getMarketUser(marketId)
      .then((user) => {
        setCurrentUser(user);
        return user;
      });
  }

  function getCurrentUserInvestment(investibleId, marketId) {
    return getCurrentUser(marketId).then((investingUser) => {
      const { usersPresenceList } = stateCache;
      const { id } = investingUser;
      const marketUsers = usersPresenceList[marketId];
      console.debug(marketUsers);
      if (marketUsers) {
        const userPresence = marketUsers.find((marketUser) => marketUser.id === id);
        if (userPresence) {
          const { investments } = userPresence;
          // eslint-disable-next-line max-len
          const investibleInvestment = investments.find((investment) => investment.investible_id === investibleId);
          if (investibleInvestment) {
            const { quantity } = investibleInvestment;
            return quantity;
          }
        }
      }
      return undefined;
    });
  }

  return {
    ...stateCache,
    refreshMarketPresence,
    getCurrentUser,
    getCurrentUserInvestment,
  };
}

export default useAsyncMarketPresencesContext;
