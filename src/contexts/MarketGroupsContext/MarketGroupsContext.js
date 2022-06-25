import React, { useEffect, useReducer, useState } from 'react'
import reducer, { initializeState } from './marketGroupsContextReducer'
import LocalForageHelper from '../../utils/LocalForageHelper'
import beginListening from './marketGroupsContextMessages'
import { BroadcastChannel } from 'broadcast-channel'
import { broadcastId } from '../../components/ContextHacks/BroadcastIdProvider'
import { isSignedOut } from '../../utils/userFunctions'
import { clearUclusionLocalStorage } from '../../components/localStorageUtils'

const MARKET_GROUPS_CONTEXT_NAMESPACE = 'market_groups';
const GROUPS_CHANNEL = 'groups';
const EMPTY_STATE = { initializing: true };

const MarketGroupsContext = React.createContext(EMPTY_STATE);

function MarketStagesProvider (props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [, setChannel] = useState(undefined);

  useEffect(() => {
    if (!isSignedOut()) {
      const myChannel = new BroadcastChannel(GROUPS_CHANNEL);
      myChannel.onmessage = (msg) => {
        if (msg !== broadcastId) {
          const lfg = new LocalForageHelper(MARKET_GROUPS_CONTEXT_NAMESPACE);
          lfg.getState()
            .then((diskState) => {
              if (diskState) {
                console.info(`Reloading on groups channel message ${msg} with ${broadcastId}`);
                dispatch(initializeState(diskState));
              }
            });
        }
      }
      setChannel(myChannel);
    }
    return () => {};
  }, []);

  useEffect(() => {
    if (!isSignedOut()) {
      // set the new state cache to something we control, so that our
      // provider descendants will pick up changes to it
      // load state from storage
      const lfg = new LocalForageHelper(MARKET_GROUPS_CONTEXT_NAMESPACE);
      lfg.getState()
        .then((state) => {
          if (state) {
            dispatch(initializeState(state));
          } else {
            dispatch(initializeState({}));
          }
        });
      beginListening(dispatch);
    } else {
      console.info('Clearing storage from market groups context');
      clearUclusionLocalStorage(false);
    }
    return () => {};
  }, []);

  return (
    <MarketGroupsContext.Provider value={[state, dispatch]}>
      {props.children}
    </MarketGroupsContext.Provider>
  );
}

export { MarketStagesProvider, MarketGroupsContext, EMPTY_STATE, MARKET_GROUPS_CONTEXT_NAMESPACE, GROUPS_CHANNEL   };

