import React, { useContext, useEffect, useReducer, useState } from 'react'
import beginListening from './marketsContextMessages'
import reducer, { initializeState, replaceState } from './marketsContextReducer'
import LocalForageHelper from '../../utils/LocalForageHelper'
import { DiffContext } from '../DiffContext/DiffContext'
import { INDEX_MARKET_TYPE, INDEX_UPDATE, SEARCH_INDEX_CHANNEL } from '../SearchIndexContext/searchIndexContextMessages'
import { pushMessage } from '../../utils/MessageBusUtils'
import { BroadcastChannel } from 'broadcast-channel'
import { LeaderContext } from '../LeaderContext/LeaderContext'

const MEMORY_MARKET_CONTEXT_NAMESPACE = 'memory_market_context';
const MARKET_CONTEXT_NAMESPACE = 'market_context';
const EMPTY_STATE = {
  initializing: true,
  marketDetails: [],
};
const MARKETS_CHANNEL = 'markets';
const MarketsContext = React.createContext(EMPTY_STATE);

function MarketsProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [, diffDispatch] = useContext(DiffContext);
  const [, setChannel] = useState(undefined);
  const [leaderState] = useContext(LeaderContext);
  const { isLeader } = leaderState;

  useEffect(() => {
    const myChannel = new BroadcastChannel(MARKETS_CHANNEL);
    myChannel.onmessage = () => {
      console.info('Reloading on markets channel message');
      const lfg = new LocalForageHelper(MEMORY_MARKET_CONTEXT_NAMESPACE);
      lfg.getState()
        .then((diskState) => {
          if (diskState) {
            const { marketDetails } = diskState;
            const indexMessage = { event: INDEX_UPDATE, itemType: INDEX_MARKET_TYPE, items: marketDetails};
            pushMessage(SEARCH_INDEX_CHANNEL, indexMessage);
            dispatch(replaceState(diskState));
          }
        });
    }
    setChannel(myChannel);
    return () => {};
  }, []);

  useEffect(() => {
    beginListening(dispatch, diffDispatch);
    return () => {};
  }, [diffDispatch]);

  useEffect(() => {
    if (isLeader !== undefined && !isLeader) {
      console.info('Not leader so reloading from memory namespace');
      const lfg = new LocalForageHelper(MEMORY_MARKET_CONTEXT_NAMESPACE);
      lfg.getState()
        .then((diskState) => {
          if (diskState) {
            const { marketDetails } = diskState;
            const indexMessage = { event: INDEX_UPDATE, itemType: INDEX_MARKET_TYPE, items: marketDetails };
            pushMessage(SEARCH_INDEX_CHANNEL, indexMessage);
            dispatch(replaceState(diskState));
          }
        });
    }
    return () => {};
  }, [isLeader]);

  useEffect(() => {
    // load state from storage
    const lfg = new LocalForageHelper(MARKET_CONTEXT_NAMESPACE);
    lfg.getState()
      .then((diskState) => {
        if (diskState) {
          const { marketDetails } = diskState;
          const indexMessage = { event: INDEX_UPDATE, itemType: INDEX_MARKET_TYPE, items: marketDetails};
          pushMessage(SEARCH_INDEX_CHANNEL, indexMessage);
          dispatch(initializeState(diskState));
        } else {
          dispatch(initializeState({
            marketDetails: [],
          }));
        }
      });
    return () => {};
  }, []);

  return (
    <MarketsContext.Provider value={[state, dispatch]}>
      {props.children}
    </MarketsContext.Provider>
  );
}

export { MarketsProvider, MarketsContext, MARKET_CONTEXT_NAMESPACE, MEMORY_MARKET_CONTEXT_NAMESPACE, MARKETS_CHANNEL,
  EMPTY_STATE };
