import { useContext } from 'react';
import { AsyncInvestiblesContext } from './AsyncInvestiblesContext';

function useAsyncInvestiblesContext() {
  const {
    stateCache, getState, updateInvestibles,
    refreshInvestibles,
  } = useContext(AsyncInvestiblesContext);

  function updateInvestibleLocally(investible) {
    const { id } = investible.investible;
    return getState()
      .then((state) => updateInvestibles(state, { [id]: investible }));
  }

  function addInvestibleLocally(investible) {
    // since it's a full investible, we can just do the same thing as
    // updateInvestibleLocally
    return updateInvestibleLocally(investible);
  }

  function getCachedInvestibles(marketId) {
    const { investibles } = stateCache;

    const values = Object.values(investibles);
    const found = values.filter((inv) => {
      const { market_infos } = inv;
      return market_infos.find((info) => info.market_id === marketId);
    });
    return found;
  }

  return {
    refreshInvestibles,
    getCachedInvestibles,
    updateInvestibleLocally,
    addInvestibleLocally,
    ...stateCache,
  };
}

export default useAsyncInvestiblesContext;
