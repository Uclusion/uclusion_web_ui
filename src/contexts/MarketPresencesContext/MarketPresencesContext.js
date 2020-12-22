import React, { useContext, useEffect, useReducer, useState } from 'react'
import beginListening from './marketPresencesMessages'
import reducer, { initializeState } from './marketPresencesContextReducer'
import LocalForageHelper from '../../utils/LocalForageHelper'
import { LeaderContext } from '../LeaderContext/LeaderContext'
import { BroadcastChannel } from 'broadcast-channel'
import { broadcastId } from '../../components/ContextHacks/BroadcastIdProvider'

const PRESENCE_CHANNEL = 'presence';
const MEMORY_MARKET_PRESENCES_CONTEXT_NAMESPACE = 'memory_market_presences';
const MARKET_PRESENCES_CONTEXT_NAMESPACE = 'market_presences';
const EMPTY_STATE = {initializing: true};
const MarketPresencesContext = React.createContext(EMPTY_STATE);

function MarketPresencesProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [, setChannel] = useState(undefined);
  const [leaderState] = useContext(LeaderContext);
  const { isLeader } = leaderState;

  useEffect(() => {
    const myChannel = new BroadcastChannel(PRESENCE_CHANNEL);
    myChannel.onmessage = (msg) => {
      if (msg !== broadcastId) {
        console.info(`Reloading on presence channel message ${msg} with ${broadcastId}`);
        const lfg = new LocalForageHelper(MEMORY_MARKET_PRESENCES_CONTEXT_NAMESPACE);
        lfg.getState()
          .then((diskState) => {
            if (diskState) {
              dispatch(initializeState({ ...diskState }));
            }
          });
      }
    }
    setChannel(myChannel);
    return () => {};
  }, []);

  useEffect(() => {
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
    return () => {};
  }, []);

  useEffect(() => {
    if (isLeader !== undefined && !isLeader) {
      console.info('Not leader so reloading from memory namespace');
      const lfg = new LocalForageHelper(MEMORY_MARKET_PRESENCES_CONTEXT_NAMESPACE);
      lfg.getState()
        .then((diskState) => {
          if (diskState) {
            dispatch(initializeState(diskState));
          }
        });
    }
    return () => {};
  }, [isLeader]);

  return (
    <MarketPresencesContext.Provider value={[state, dispatch]}>
      {props.children}
    </MarketPresencesContext.Provider>
  );
}

export { MarketPresencesProvider, MarketPresencesContext, EMPTY_STATE, MARKET_PRESENCES_CONTEXT_NAMESPACE,
  PRESENCE_CHANNEL, MEMORY_MARKET_PRESENCES_CONTEXT_NAMESPACE};
