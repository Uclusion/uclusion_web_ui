import React, { useState } from 'react';
import { createCachedAsyncContext } from './CachedAsyncContextCreator';

const EMPTY_STATE = { investibles:{} };
const contextPackage = createCachedAsyncContext('async_investibles', EMPTY_STATE);

const { context, addStateCache } = contextPackage;

const AsyncInvestiblesContext = context;

function AsyncInvestiblesProvider(props) {

  const [state, setState] = useState(EMPTY_STATE);
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

export { AsyncInvestiblesProvider, AsyncInvestiblesContext };
