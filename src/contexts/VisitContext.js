import React, { useState, useEffect } from 'react';
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../components/utils';
import useAsyncMarketContext from './useAsyncMarketsContext';
import useAsyncInvestiblesContext from './useAsyncInvestiblesContext';

const VisitContext = React.createContext([{}, () => {}]);

const VISIT_CONTEXT_KEY = 'visit_context';


function VisitProvider(props) {

  const { children } = props;
  const defaultValue = getUclusionLocalStorageItem(VISIT_CONTEXT_KEY) || {};
  const [state, setState] = useState(defaultValue);
  const { markets } = useAsyncMarketContext();
  useEffect(() => {
    setUclusionLocalStorageItem(VISIT_CONTEXT_KEY, state);
  }, [state]);

  return (
    <VisitContext.Provider value={[state, setState]}>
      { children }
    </VisitContext.Provider>
  );
}

export { VisitContext, VisitProvider };
