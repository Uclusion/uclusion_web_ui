import React, { useState } from 'react';
import _ from 'lodash';
import { Hub } from '@aws-amplify/core';
import { createCachedAsyncContext } from './CachedAsyncContextCreator';
import { fetchInvestibleList, fetchInvestibles } from '../api/marketInvestibles';
import { MESSAGES_EVENT, PUSH_INVESTIBLES_CHANNEL, VIEW_EVENT } from './WebSocketContext';

const EMPTY_STATE = { investibles: {} };
const contextPackage = createCachedAsyncContext('async_investibles', EMPTY_STATE);

const {
  context, addStateCache, loadingWrapper, setStateValues, getState,
} = contextPackage;

function updateInvestibles(state, updateHash) {
  const { investibles } = state;
  const newInvestibles = { ...investibles, ...updateHash };
  return setStateValues({ investibles: newInvestibles });
}

function refreshInvestibles(marketId) {
  // the loading wrapper can't pass arguments, so we
  // need to bind market id with a closure
  const refreshMarketInvestibles = () => fetchInvestibleList(marketId)
    .then((investibleList) => {
      console.debug(investibleList);
      if (_.isEmpty(investibleList)) {
        return Promise.resolve([]);
      }
      const idList = investibleList.map((investible) => investible.id);
      return fetchInvestibles(idList, marketId);
    }).then((investibles) => {
      console.debug(investibles);
      const investibleHash = _.keyBy(investibles, (item) => item.investible.id);
      console.debug(investibleHash);
      return getState()
        .then((state) => updateInvestibles(state, investibleHash));
    });
  return loadingWrapper(refreshMarketInvestibles);
}

function handleViewEvent(message) {
  const { investibleIdOrContext: investibleId, isEntry } = message;
  getState().then((state) => {
    const investible = state.investibles.find((investible) => investible.id === investibleId);
    let viewedInvestible;
    if (isEntry) {
      const { updated_at } = investible;
      viewedInvestible = { ...investible, lastPresentDate: updated_at };
    } else {
      viewedInvestible = { ...investible, lastPresentDate: null };
    }
    const newInvestibles = _.unionBy([viewedInvestible], state.investibles, 'id');
    return true;
    // return setStateValues({ investibles: newInvestibles });
  });
}

const AsyncInvestiblesContext = context;

function AsyncInvestiblesProvider(props) {
  const [state, setState] = useState(EMPTY_STATE);
  // set the new state cache to something we control, so that our
  // provider descendants will pick up changes to it
  addStateCache(state, setState);
  // the provider value needs the new state cache object in order to allert
  // provider descendants to changes
  const providerState = {
    ...contextPackage,
    stateCache: state,
    refreshInvestibles,
    updateInvestibles,
  };

  Hub.listen(PUSH_INVESTIBLES_CHANNEL, (data) => {
    const { payload: { event, message } } = data;

    switch (event) {
      case MESSAGES_EVENT:
        refreshInvestibles(message.indirect_object_id);
        break;
      case VIEW_EVENT:
        handleViewEvent(message);
        break;
      default:
        console.debug(`Ignoring push event ${event}`);
    }
  });

  return (
    <AsyncInvestiblesContext.Provider value={providerState}>
      {props.children}
    </AsyncInvestiblesContext.Provider>
  );
}

export { AsyncInvestiblesProvider, AsyncInvestiblesContext };
