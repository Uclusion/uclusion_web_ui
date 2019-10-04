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

  return {
    ...stateCache,
    refreshMarketPresence,
    getCurrentUser,
  };
}

export default useAsyncMarketPresencesContext;
