import React, { useState } from 'react';
import { createCachedAsyncContext } from './CachedAsyncContextCreator';

const contextPackage = createCachedAsyncContext('async_investibles', {});

const { context, addStateCache } = contextPackage;

const AsyncInvestiblesContext = context;

function AsyncInvestiblesProvider(props) {

  const [state, setState] = useState({});
  // set the new state cache to something we control, so that our
  // provider descendants will pick up changes to it
  addStateCache(state, setState);
  // the provider value needs the new state cache object in order to allert
  // provider descendants to changes
  const providerState = { ...contextPackage, stateCache: state };

  return (
    <AsyncInvestiblesContext.Provider value={providerState}>
      {props.children}
    </AsyncInvestiblesContext.Provider>
  );
}

export { AsyncInvestiblesContext, AsyncInvestiblesProvider };
