import Comment from '../../../components/Comments/Comment'
import React from 'react'
import _ from 'lodash'
import {
  getCommentRoot,
  getMarketComments,
  getUnresolvedInvestibleComments
} from '../../../contexts/CommentsContext/commentsContextHelper'
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import { REPORT_TYPE } from '../../../constants/comments'
import InvestibleStatus from './InvestibleStatus'

export function addExpansionPanel(item, commentState, marketState) {
  const { message } = item;
  const { type: messageType, market_id: marketId, comment_id: commentId, comment_market_id: commentMarketId,
    link_type: linkType, investible_id: investibleId } = message;

  if ((['UNREAD_REPLY', 'NEW_TODO', 'UNREAD_COMMENT', 'UNREAD_RESOLVED', 'ISSUE', 'UNREAD_REVIEWABLE',
      'REVIEW_REQUIRED'].includes(messageType)) ||
    (['UNREAD_OPTION', 'UNREAD_VOTE', 'NOT_FULLY_VOTED', 'INVESTIBLE_SUBMITTED'].includes(messageType)
      && linkType.startsWith('INLINE')) || (messageType === 'UNASSIGNED' && linkType === 'MARKET_TODO')) {
    let useMarketId = commentMarketId || marketId;
    let useCommentId = commentId;
    if (!useCommentId) {
      const market = getMarket(marketState, marketId) || {};
      const { parent_comment_id: inlineParentCommentId, parent_comment_market_id: parentMarketId } = market;
      if (inlineParentCommentId) {
        useMarketId = parentMarketId;
        useCommentId = inlineParentCommentId;
      }
    }
    if (!useCommentId && investibleId) {
      const investibleComments = getUnresolvedInvestibleComments(investibleId, marketId, commentState);
      const report = investibleComments.find((comment) => comment.comment_type === REPORT_TYPE
        && comment.creator_assigned) || {};
      useCommentId = report.id;
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
  } else if (messageType === 'REPORT_REQUIRED') {
    if (!_.isEmpty(investibleId)) {
      item.expansionPanel = <InvestibleStatus
        investibleId={investibleId}
        message={message}
        marketId={marketId}
      />;
    }
  }
}