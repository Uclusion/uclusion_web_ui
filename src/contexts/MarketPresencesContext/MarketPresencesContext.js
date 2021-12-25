import React, { useEffect, useReducer, useState } from 'react'
import beginListening from './marketPresencesMessages'
import reducer, { initializeState } from './marketPresencesContextReducer'
import LocalForageHelper from '../../utils/LocalForageHelper'
import { BroadcastChannel } from 'broadcast-channel'
import { broadcastId } from '../../components/ContextHacks/BroadcastIdProvider'
import { isSignedOut } from '../../utils/userFunctions'
import { clearUclusionLocalStorage } from '../../components/localStorageUtils'

const PRESENCE_CHANNEL = 'presence';
const MARKET_PRESENCES_CONTEXT_NAMESPACE = 'market_presences';
const EMPTY_STATE = {initializing: true};
const MarketPresencesContext = React.createContext(EMPTY_STATE);

function MarketPresencesProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [, setChannel] = useState(undefined);

  useEffect(() => {
    if (!isSignedOut()) {
      const myChannel = new BroadcastChannel(PRESENCE_CHANNEL);
      myChannel.onmessage = (msg) => {
        if (msg !== broadcastId) {
          console.info(`Reloading on presence channel message ${msg} with ${broadcastId}`);
          const lfg = new LocalForageHelper(MARKET_PRESENCES_CONTEXT_NAMESPACE);
          lfg.getState()
            .then((diskState) => {
              if (diskState) {
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
      const lfh = new LocalForageHelper(MARKET_PRESENCES_CONTEXT_NAMESPACE);
      lfh.getState()
        .then((diskState) => {
          if (diskState) {
            dispatch(initializeState(diskState));
          } else {
            dispatch(initializeState({}));
          }
        });
      beginListening(dispatch);
    } else {
      clearUclusionLocalStorage(false);
    }
    return () => {};
  }, []);

  return (
    <MarketPresencesContext.Provider value={[state, dispatch]}>
      {props.children}
    </MarketPresencesContext.Provider>
  );
}

export { MarketPresencesProvider, MarketPresencesContext, EMPTY_STATE, MARKET_PRESENCES_CONTEXT_NAMESPACE,
  PRESENCE_CHANNEL };
