import React, { useContext, useEffect, useReducer, useState } from 'react'
import reducer, { initializeState } from './marketGroupsContextReducer'
import LocalForageHelper from '../../utils/LocalForageHelper'
import beginListening from './marketGroupsContextMessages'
import { BroadcastChannel } from 'broadcast-channel'
import { broadcastId } from '../../components/ContextHacks/BroadcastIdProvider'
import { isSignedOut } from '../../utils/userFunctions'
import { clearUclusionLocalStorage } from '../../components/localStorageUtils'
import { pushIndexItems } from './marketGroupsContextHelper'
import { DiffContext } from '../DiffContext/DiffContext'

const MARKET_GROUPS_CONTEXT_NAMESPACE = 'market_groups';
const GROUPS_CHANNEL = 'groups';
const EMPTY_STATE = { initializing: true };

const MarketGroupsContext = React.createContext(EMPTY_STATE);

function MarketGroupsProvider (props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [, diffDispatch] = useContext(DiffContext);
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
                pushIndexItems(diskState);
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
            pushIndexItems(state);
            dispatch(initializeState(state));
          } else {
            dispatch(initializeState({}));
          }
        });
      beginListening(dispatch, diffDispatch);
    } else {
      console.info('Clearing storage from market groups context');
      clearUclusionLocalStorage(false);
    }
    return () => {};
  }, [diffDispatch]);

  return (
    <MarketGroupsContext.Provider value={[state, dispatch]}>
      {props.children}
    </MarketGroupsContext.Provider>
  );
}

export { MarketGroupsProvider, MarketGroupsContext, EMPTY_STATE, MARKET_GROUPS_CONTEXT_NAMESPACE, GROUPS_CHANNEL   };

