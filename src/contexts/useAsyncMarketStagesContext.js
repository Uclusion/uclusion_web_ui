import { useContext } from 'react';
import { AsyncMarketStagesContext } from './AsyncMarketStagesContext';

function useAsyncMarketStagesContext() {
  const { stateCache, refreshStages } = useContext(AsyncMarketStagesContext);

  function getCachedStages(marketId) {
    const { stagesList } = stateCache;
    return stagesList[marketId] || [];
  }

  return {
    ...stateCache,
    refreshStages,
    getCachedStages,
  };
}

export default useAsyncMarketStagesContext;
