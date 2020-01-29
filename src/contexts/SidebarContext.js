import React, { useState, useEffect } from 'react';
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../components/utils';

const SidebarContext = React.createContext([{}, () => {}]);

const SIDEBAR_CONTEXT_KEY = 'sidebar_context';

function SidebarProvider(props) {

  const { children } = props;
  const defaultValue = getUclusionLocalStorageItem(SIDEBAR_CONTEXT_KEY) || { open: true };
  const [state, setState] = useState(defaultValue);

  function mySetState(value) {
    setState({ open: value });
  }

  useEffect(() => {
    setUclusionLocalStorageItem(SIDEBAR_CONTEXT_KEY, state);
  }, [state]);

  return (
    <SidebarContext.Provider value={[state.open, mySetState]}>
      { children }
    </SidebarContext.Provider>
  );
}

export { SidebarContext, SidebarProvider };
