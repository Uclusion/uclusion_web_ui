import { removeMarketsComments, updateCommentsFromVersions } from './commentsContextReducer';
import { pushMessage, registerListener } from '../../utils/MessageBusUtils'
import { addContents } from '../DiffContext/diffContextReducer'
import {
  INDEX_COMMENT_TYPE,
  INDEX_UPDATE,
  SEARCH_INDEX_CHANNEL
} from '../SearchIndexContext/searchIndexContextMessages';
import {
  PUSH_COMMENTS_CHANNEL,
  REMOVED_MARKETS_CHANNEL,
  VERSIONS_EVENT
} from '../../api/versionedFetchUtils';
import { TICKET_INDEX_CHANNEL } from '../TicketContext/ticketIndexContextMessages'
import _ from 'lodash'
import { addToIndex } from '../SearchIndexContext/searchIndexContextHelper';

export function addCommentsOther(commentsDispatch, diffDispatch, index, ticketDispatch, comments) {
  addToIndex(index, INDEX_COMMENT_TYPE, comments);
  const ticketCodeItems = [];
  let commentsMarketId = undefined;
  comments.forEach((comment) => {
    const { market_id: marketId, id: commentId, group_id: groupId, ticket_code: ticketCode,
      investible_id: investibleId } = comment;
    if (!commentsMarketId) {
      commentsMarketId = marketId;
    }
    if (ticketCode) {
      ticketCodeItems.push({ ticketCode, marketId, commentId, groupId, investibleId });
    }
  });
  if (!_.isEmpty(ticketCodeItems)) {
    ticketDispatch({items: ticketCodeItems});
  }
  console.info('Dispatching comment diff')
  diffDispatch(addContents(comments, 'comment'));
}

function beginListening(dispatch, diffDispatch) {
  registerListener(REMOVED_MARKETS_CHANNEL, 'commentsRemovedMarketStart', (data) => {
    const { payload: { event, message } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        dispatch(removeMarketsComments(message));
        break;
      default:
        // console.debug(`Ignoring identity event ${event}`);
    }
  });
  registerListener(PUSH_COMMENTS_CHANNEL, 'commentsPushStart', (data) => {
    const { payload: { event, commentDetails, existingCommentIds } } = data;
    let allComments = [];
    Object.values(commentDetails).forEach((comments) => allComments = allComments.concat(comments));
    const indexMessage = { event: INDEX_UPDATE, itemType: INDEX_COMMENT_TYPE, items: allComments };
    pushMessage(SEARCH_INDEX_CHANNEL, indexMessage);
    const ticketCodeItems = [];
    allComments.forEach((comment) => {
      const { market_id: marketId, id: commentId, group_id: groupId, ticket_code: ticketCode,
        investible_id: investibleId } = comment;
      if (ticketCode) {
        ticketCodeItems.push({ ticketCode, marketId, commentId, groupId, investibleId });
      }
    });
    if (!_.isEmpty(ticketCodeItems)) {
      pushMessage(TICKET_INDEX_CHANNEL, ticketCodeItems);
    }
    switch (event) {
      case VERSIONS_EVENT:
        diffDispatch(addContents(allComments, 'comment'));
        dispatch(updateCommentsFromVersions(commentDetails, existingCommentIds));
        break;
      default:
        // console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;
