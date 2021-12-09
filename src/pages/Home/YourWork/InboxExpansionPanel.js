import Comment from '../../../components/Comments/Comment'
import React from 'react'
import _ from 'lodash'
import {
  getCommentRoot,
  getMarketComments,
  getUnresolvedInvestibleComments
} from '../../../contexts/CommentsContext/commentsContextHelper'
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import { REPORT_TYPE, TODO_TYPE } from '../../../constants/comments'
import InvestibleStatus from './InvestibleStatus'
import DescriptionOrDiff from '../../../components/Descriptions/DescriptionOrDiff'
import RaisedCard from '../../../components/Cards/RaisedCard'
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { getDiff } from '../../../contexts/DiffContext/diffContextHelper'
import { PLANNING_TYPE } from '../../../constants/markets'

export function addExpansionPanel(item, commentState, marketState, investiblesState, diffState) {
  const { message } = item;
  const { type: messageType, market_id: marketId, comment_id: commentId, comment_market_id: commentMarketId,
    link_type: linkType, investible_id: investibleId, market_type: marketType } = message;

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
      const { comment_type: commentType, investible_id: investibleId } = rootComment;
      item.expansionPanel = <Comment
        depth={0}
        marketId={useMarketId}
        comment={rootComment}
        comments={getMarketComments(commentState, useMarketId)}
        defaultShowDiff
        allowedTypes={[]}
        noAuthor={marketType === PLANNING_TYPE && commentType === TODO_TYPE && !investibleId}
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
  } else if (messageType === 'UNREAD_DESCRIPTION') {
    if (!_.isEmpty(investibleId)) {
      const diff = getDiff(diffState, investibleId);
      if (diff) {
        const fullInvestible = getInvestible(investiblesState, investibleId) || {};
        const { investible: myInvestible } = fullInvestible;
        const { description } = myInvestible || {};
        item.expansionPanel = (
          <RaisedCard elevation={3}>
            <div style={{padding: '1.25rem'}}>
              <DescriptionOrDiff id={investibleId} description={description} showDiff={true}/>
            </div>
          </RaisedCard>
        );
      }
    } else {
      const diff = getDiff(diffState, marketId);
      if (diff) {
        const market = getMarket(marketState, marketId) || {};
        const { description } = market;
        item.expansionPanel = (
          <RaisedCard elevation={3}>
            <div style={{padding: '1.25rem'}}>
              <DescriptionOrDiff id={marketId} description={description} showDiff={true}/>
            </div>
          </RaisedCard>
        );
      }
    }
  }
}