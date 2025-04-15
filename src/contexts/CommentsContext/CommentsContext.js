import React, { useContext, useEffect, useReducer } from 'react'
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
import { DiffContext } from '../DiffContext/DiffContext'
import { TICKET_INDEX_CHANNEL } from '../TicketContext/ticketIndexContextMessages'

const COMMENTS_CHANNEL = 'comments';
const COMMENTS_CONTEXT_NAMESPACE = 'comments_context';
const EMPTY_STATE = {initializing: true};

const CommentsContext = React.createContext(EMPTY_STATE);

function pushIndexItems(diskState) {
  const indexItems = _.flatten(Object.values(diskState));
  const indexMessage = { event: INDEX_UPDATE, itemType: INDEX_COMMENT_TYPE, items: indexItems };
  pushMessage(SEARCH_INDEX_CHANNEL, indexMessage);
  const ticketCodeItems = [];
  (indexItems || []).forEach((comment) => {
    const { market_id: marketId, id: commentId, group_id: groupId, investible_id: investibleId,
      ticket_code: ticketCode } = comment;
    if (ticketCode) {
      ticketCodeItems.push({ ticketCode, marketId, commentId, groupId, investibleId });
    }
  });
  if (!_.isEmpty(ticketCodeItems)) {
    pushMessage(TICKET_INDEX_CHANNEL, ticketCodeItems);
  }
}

let commentsContextHack;
export { commentsContextHack };

function CommentsProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE, undefined);
  const [, diffDispatch] = useContext(DiffContext);

  useEffect(() => {
    beginListening(dispatch, diffDispatch);
    return () => {};
  }, [diffDispatch]);

  useEffect(() => {
    // load state from storage
    const lfg = new LocalForageHelper(COMMENTS_CONTEXT_NAMESPACE);
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

  commentsContextHack = state;
  return (
    <CommentsContext.Provider value={[state, dispatch]} >
      {props.children}
    </CommentsContext.Provider>
  );
}

export { CommentsProvider, CommentsContext, EMPTY_STATE, COMMENTS_CONTEXT_NAMESPACE, COMMENTS_CHANNEL };
