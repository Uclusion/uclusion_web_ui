import Comment from '../../../components/Comments/Comment'
import React from 'react'
import _ from 'lodash'
import { getCommentRoot, getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper'
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper'

export function addExpansionPanel(item, commentState, marketState) {
  const { message } = item;
  const { type: messageType, market_id: marketId, comment_id: commentId, comment_market_id: commentMarketId,
    link_type: linkType } = message;

  if ((['UNREAD_REPLY', 'NEW_TODO', 'UNREAD_COMMENT', 'UNREAD_RESOLVED', 'ISSUE'].includes(messageType)) ||
    (['UNREAD_OPTION', 'UNREAD_VOTE', 'NOT_FULLY_VOTED', 'INVESTIBLE_SUBMITTED'].includes(messageType)
      && linkType.startsWith('INLINE')) || (messageType === 'UNASSIGNED' && linkType === 'MARKET_TODO')) {
    let useMarketId = commentMarketId || marketId;
    let useCommentId = commentId;
    if (!useCommentId) {
      const market = getMarket(marketState, marketId) || {};
      const { parent_comment_id: inlineParentCommentId, parent_comment_market_id: parentMarketId } = market;
      useMarketId = parentMarketId;
      useCommentId = inlineParentCommentId;
    }
    const rootComment = getCommentRoot(commentState, useMarketId, useCommentId);
    // Note passing all comments down instead of just related to the unread because otherwise confusing and also
    // have case of more than one reply being de-duped
    if (!_.isEmpty(rootComment)) {
      item.expansionPanel = <Comment
        depth={0}
        marketId={useMarketId}
        comment={rootComment}
        comments={getMarketComments(commentState, useMarketId)}
        allowedTypes={[]}
      />;
    }
  }
}