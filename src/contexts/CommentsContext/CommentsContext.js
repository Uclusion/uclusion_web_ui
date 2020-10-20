import React, { useContext, useEffect, useReducer, useState } from 'react'
import _ from 'lodash'
import reducer, { initializeState } from './commentsContextReducer'
import LocalForageHelper from '../../utils/LocalForageHelper'
import beginListening from './commentsContextMessages'
import { pushMessage } from '../../utils/MessageBusUtils'
import {
  INDEX_COMMENT_TYPE,
  INDEX_UPDATE,
  SEARCH_INDEX_CHANNEL
} from '../SearchIndexContext/searchIndexContextMessages'
import { LeaderContext } from '../LeaderContext/LeaderContext'
import { BroadcastChannel } from 'broadcast-channel'

const COMMENTS_CHANNEL = 'comments';
const MEMORY_COMMENTS_CONTEXT_NAMESPACE = 'memory_comments_context';
const COMMENTS_CONTEXT_NAMESPACE = 'comments_context';
const EMPTY_STATE = {initializing: true};

const CommentsContext = React.createContext(EMPTY_STATE);

function CommentsProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [, setChannel] = useState(undefined);
  const [leaderState] = useContext(LeaderContext);
  const { isLeader } = leaderState;

  useEffect(() => {
    const myChannel = new BroadcastChannel(COMMENTS_CHANNEL);
    myChannel.onmessage = () => {
      console.info('Reloading on comments channel message');
      const lfg = new LocalForageHelper(MEMORY_COMMENTS_CONTEXT_NAMESPACE);
      lfg.getState()
        .then((diskState) => {
          if (diskState) {
            const indexItems = _.flatten(Object.values(diskState));
            const indexMessage = {event: INDEX_UPDATE, itemType: INDEX_COMMENT_TYPE, items: indexItems};
            pushMessage(SEARCH_INDEX_CHANNEL, indexMessage);
            dispatch(initializeState(diskState));
          }
        });
    }
    setChannel(myChannel);
    return () => {};
  }, []);

  useEffect(() => {
    if (isLeader !== undefined && !isLeader) {
      console.info('Not leader so reloading from memory namespace');
      const lfg = new LocalForageHelper(MEMORY_COMMENTS_CONTEXT_NAMESPACE);
      lfg.getState()
        .then((diskState) => {
          if (diskState) {
            const indexItems = _.flatten(Object.values(diskState));
            const indexMessage = {event: INDEX_UPDATE, itemType: INDEX_COMMENT_TYPE, items: indexItems};
            pushMessage(SEARCH_INDEX_CHANNEL, indexMessage);
            dispatch(initializeState(diskState));
          }
        });
    }
    return () => {};
  }, [isLeader]);

  useEffect(() => {
    // set the new state cache to something we control, so that our
    // provider descendants will pick up changes to it
    // load state from storage
    const lfg = new LocalForageHelper(COMMENTS_CONTEXT_NAMESPACE);
    lfg.getState()
      .then((state) => {
        // // console.debug(`Found comments ${state}`);
        // // console.debug(state);
        if (state) {
          const indexItems = _.flatten(Object.values(state));
          const indexMessage = {event: INDEX_UPDATE, itemType: INDEX_COMMENT_TYPE, items: indexItems};
          pushMessage(SEARCH_INDEX_CHANNEL, indexMessage);
          dispatch(initializeState(state));
        } else {
          dispatch(initializeState({}));
        }
      });
    beginListening(dispatch);
    return () => {};
  }, []);

  return (
    <CommentsContext.Provider value={[state, dispatch]} >
      {props.children}
    </CommentsContext.Provider>
  );
}

export { CommentsProvider, CommentsContext, EMPTY_STATE, COMMENTS_CONTEXT_NAMESPACE, COMMENTS_CHANNEL,
  MEMORY_COMMENTS_CONTEXT_NAMESPACE };
