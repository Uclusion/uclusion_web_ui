import React, { useState, useEffect } from 'react';
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../components/utils';


const DrawerContext = React.createContext([{open:true}, () => {}]);

const DRAWER_CONTEXT_KEY = 'drawer_context';

function DrawerProvider(props) {

  const { children } = props;
  const defaultValue = getUclusionLocalStorageItem(DRAWER_CONTEXT_KEY) || {};
  const [state, setState] = useState(defaultValue);

  useEffect(() => {
    setUclusionLocalStorageItem(DRAWER_CONTEXT_KEY, state);
  }, [state]);

  return (
    <DrawerContext.Provider value={[state, setState]}>
      { children }
    </DrawerContext.Provider>
  );
}

export { DrawerContext, DrawerProvider };
