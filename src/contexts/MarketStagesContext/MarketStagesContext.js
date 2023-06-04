import React, { useEffect, useReducer, useState } from 'react'
import reducer, { initializeState } from './marketStagesContextReducer'
import LocalForageHelper from '../../utils/LocalForageHelper'
import beginListening from './marketStagesContextMessages'
import { BroadcastChannel } from 'broadcast-channel'
import { broadcastId } from '../../components/ContextHacks/BroadcastIdProvider'

const MARKET_STAGES_CONTEXT_NAMESPACE = 'market_stages';
const STAGES_CHANNEL = 'stages';
const EMPTY_STATE = { initializing: true };

const MarketStagesContext = React.createContext(EMPTY_STATE);

function MarketStagesProvider (props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [, setChannel] = useState(undefined);

  useEffect(() => {
    const myChannel = new BroadcastChannel(STAGES_CHANNEL);
    myChannel.onmessage = (msg) => {
      if (msg !== broadcastId) {
        const lfg = new LocalForageHelper(MARKET_STAGES_CONTEXT_NAMESPACE);
        lfg.getState()
          .then((diskState) => {
            if (diskState) {
              console.info(`Reloading on stages channel message ${msg} with ${broadcastId}`);
              dispatch(initializeState(diskState));
            }
          });
      }
    }
    setChannel(myChannel);
    return () => {};
  }, []);

  useEffect(() => {
    // set the new state cache to something we control, so that our
    // provider descendants will pick up changes to it
    // load state from storage
    const lfg = new LocalForageHelper(MARKET_STAGES_CONTEXT_NAMESPACE);
    lfg.getState()
      .then((state) => {
        if (state) {
          dispatch(initializeState(state));
        } else {
          dispatch(initializeState({}));
        }
      });
    beginListening(dispatch);
    return () => {};
  }, []);

  return (
    <MarketStagesContext.Provider value={[state, dispatch]}>
      {props.children}
    </MarketStagesContext.Provider>
  );
}

export { MarketStagesProvider, MarketStagesContext, EMPTY_STATE, MARKET_STAGES_CONTEXT_NAMESPACE, STAGES_CHANNEL };

