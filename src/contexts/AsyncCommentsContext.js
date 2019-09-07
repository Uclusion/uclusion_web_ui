import React, { useState } from 'react';
import { createCachedAsyncContext } from './CachedAsyncContextCreator';

const emptyState = {
  comments: {},
  commentsList: {},
};

const contextPackage = createCachedAsyncContext('async_investibles', emptyState);

const { context, addStateCache } = contextPackage;

const AsyncCommentsContext = context;

function AsyncCommentsProvider(props) {

  const [state, setState] = useState({});
  // set the new state cache to something we control, so that our
  // provider descendants will pick up changes to it
  addStateCache(state, setState);
  // the provider value needs the new state cache object in order to allert
  // provider descendants to changes
  const providerState = { ...contextPackage, stateCache: state };

  return (
    <AsyncCommentsContext.Provider value={providerState}>
      {props.children}
    </AsyncCommentsContext.Provider>
  );
}

export { AsyncCommentsProvider, AsyncCommentsContext };
