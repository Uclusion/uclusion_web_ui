import React, { useCallback, useContext, useEffect, useReducer } from 'react'
import _ from 'lodash'
import reducer, { initializeState } from './commentsContextReducer'
import LocalForageHelper from '../../utils/LocalForageHelper'
import beginListening from './commentsContextMessages'
import { INDEX_COMMENT_TYPE } from '../SearchIndexContext/searchIndexContextMessages'
import { DiffContext } from '../DiffContext/DiffContext'
import { SearchIndexContext } from '../SearchIndexContext/SearchIndexContext'
import { replaceIndexItems } from '../SearchIndexContext/searchIndexContextHelper'
import { replaceTicketItems, TicketIndexContext } from '../TicketContext/TicketIndexContext'
import { flushSync } from 'react-dom';

const COMMENTS_CHANNEL = 'comments';
const COMMENTS_CONTEXT_NAMESPACE = 'comments_context';
const EMPTY_STATE = {initializing: true};

const CommentsContext = React.createContext(EMPTY_STATE);

function replaceDerivedState(diskState, index, ticketsDispatch) {
  const comments = _.flatten(Object.values(diskState).filter(Array.isArray));
  if (index) {
    replaceIndexItems(index, INDEX_COMMENT_TYPE, comments);
  }
  const ticketCodeItems = [];
  comments.forEach((comment) => {
    const { market_id: marketId, id: commentId, group_id: groupId, investible_id: investibleId,
      ticket_code: ticketCode } = comment;
    if (ticketCode && !comment.deleted) {
      ticketCodeItems.push({ ticketCode, marketId, commentId, groupId, investibleId });
    }
  });
  ticketsDispatch(replaceTicketItems(ticketCodeItems, 'commentId'));
}

let commentsContextHack;
export { commentsContextHack };

function CommentsProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE, undefined);
  const [, diffDispatch] = useContext(DiffContext);
  const [index] = useContext(SearchIndexContext);
  const [, ticketsDispatch] = useContext(TicketIndexContext);

  const hydrateCommentsFromDisk = useCallback(() => {
    const lfg = new LocalForageHelper(COMMENTS_CONTEXT_NAMESPACE);
    return lfg.getStoredState().then((diskState) => {
      const hydratedState = diskState || {};
      flushSync(() => {
        replaceDerivedState(hydratedState, index, ticketsDispatch);
        dispatch(initializeState(hydratedState));
      });
      return hydratedState;
    });
  }, [index, ticketsDispatch]);

  useEffect(() => {
    beginListening(dispatch, diffDispatch);
    return () => {};
  }, [diffDispatch]);

  useEffect(() => {
    // load state from storage
    hydrateCommentsFromDisk()
      .catch((error) => console.warn('Unable to load comments from disk', error));
    return () => {};
  }, [hydrateCommentsFromDisk]);

  commentsContextHack = state;
  return (
    <CommentsContext.Provider value={[state, dispatch, hydrateCommentsFromDisk]} >
      {props.children}
    </CommentsContext.Provider>
  );
}

export { CommentsProvider, CommentsContext, EMPTY_STATE, COMMENTS_CONTEXT_NAMESPACE, COMMENTS_CHANNEL };
