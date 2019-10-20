import { useContext } from 'react';
import { AsyncMarketPresencesContext } from './AsyncMarketPresencesContext';

function useAsyncMarketPresencesContext() {
  const { stateCache, refreshMarketPresence } = useContext(AsyncMarketPresencesContext);

  console.debug('Use market presences being rerendered');

  return {
    ...stateCache,
    refreshMarketPresence,
  };
}

export default useAsyncMarketPresencesContext;
