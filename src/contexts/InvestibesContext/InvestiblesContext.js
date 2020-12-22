import React, { useContext, useEffect, useReducer, useState } from 'react'
import reducer, { initializeState } from './investiblesContextReducer'
import LocalForageHelper from '../../utils/LocalForageHelper'
import beginListening from './investiblesContextMessages'
import { DiffContext } from '../DiffContext/DiffContext'
import { pushMessage } from '../../utils/MessageBusUtils'
import {
  INDEX_INVESTIBLE_TYPE,
  INDEX_UPDATE,
  SEARCH_INDEX_CHANNEL
} from '../SearchIndexContext/searchIndexContextMessages'
import { LeaderContext } from '../LeaderContext/LeaderContext'
import { BroadcastChannel } from 'broadcast-channel'
import { broadcastId } from '../../components/ContextHacks/BroadcastIdProvider'

const INVESTIBLES_CHANNEL = 'investibles';
const INVESTIBLES_CONTEXT_NAMESPACE = 'investibles';
const MEMORY_INVESTIBLES_CONTEXT_NAMESPACE = 'memory_investibles';
const EMPTY_STATE = {initializing: true};

const InvestiblesContext = React.createContext(EMPTY_STATE);

function pushIndexItems(diskState) {
  const investibles = Object.values(diskState).filter((item) => item.investible) || [];
  const indexItems = investibles.map((item) => item.investible);
  const indexMessage = { event: INDEX_UPDATE, itemType: INDEX_INVESTIBLE_TYPE, items: indexItems };
  pushMessage(SEARCH_INDEX_CHANNEL, indexMessage);
}

function InvestiblesProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [, diffDispatch] = useContext(DiffContext);
  const [, setChannel] = useState(undefined);
  const [leaderState] = useContext(LeaderContext);
  const { isLeader } = leaderState;

  useEffect(() => {
    const myChannel = new BroadcastChannel(INVESTIBLES_CHANNEL);
    myChannel.onmessage = (msg) => {
      if (msg !== broadcastId) {
        console.info(`Reloading on investibles channel message ${msg} with ${broadcastId}`);
        const lfg = new LocalForageHelper(MEMORY_INVESTIBLES_CONTEXT_NAMESPACE);
        lfg.getState()
          .then((diskState) => {
            if (diskState) {
              pushIndexItems(diskState);
              dispatch(initializeState({ ...diskState }));
            }
          });
      }
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
      const lfg = new LocalForageHelper(MEMORY_INVESTIBLES_CONTEXT_NAMESPACE);
      lfg.getState()
        .then((diskState) => {
          if (diskState) {
            pushIndexItems(diskState);
            dispatch(initializeState(diskState));
          }
        });
    }
    return () => {};
  }, [isLeader]);

  useEffect(() => {
    // load state from storage
    const lfg = new LocalForageHelper(INVESTIBLES_CONTEXT_NAMESPACE);
    lfg.getState()
      .then((state) => {
        if (state) {
          pushIndexItems(state);
          dispatch(initializeState(state));
        } else {
          dispatch(initializeState({}));
        }
      });
    return () => {};
  }, []);

  // console.debug('Investibles context being rerendered');

  return (
    <InvestiblesContext.Provider value={[state, dispatch]}>
      {props.children}
    </InvestiblesContext.Provider>
  );
}

export { InvestiblesProvider, InvestiblesContext, EMPTY_STATE, INVESTIBLES_CONTEXT_NAMESPACE, INVESTIBLES_CHANNEL,
  MEMORY_INVESTIBLES_CONTEXT_NAMESPACE };
