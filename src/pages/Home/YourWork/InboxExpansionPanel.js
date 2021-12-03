import Comment from '../../../components/Comments/Comment'
import React from 'react'
import _ from 'lodash'
import { getComment, getCommentRoot } from '../../../contexts/CommentsContext/commentsContextHelper'

function getCommentPartialThread(state, marketId, commentId, comments) {
  const comment = getComment(state, marketId, commentId);
  if (_.isEmpty(comment)) {
    return undefined;
  }
  if (comment.deleted) {
    return undefined;
  }
  comments.push(comment);
  if (!_.isEmpty(comment.reply_id)) {
    getCommentPartialThread(state, marketId, comment.reply_id, comments);
  }
}

export function addExpansionPanel(item, commentState) {
  const { message } = item;
  const { type: messageType, market_id: marketId, comment_id: commentId, comment_market_id: commentMarketId } = message;

  if (messageType === 'UNREAD_REPLY') {
    const useMarketId = commentMarketId ? commentMarketId : marketId;
    const rootComment = getCommentRoot(commentState, useMarketId, commentId);
    const comments = [];
    getCommentPartialThread(commentState, marketId, commentId, comments);
    if (!_.isEmpty(rootComment) && !_.isEmpty(comments)) {
      item.expansionPanel = <Comment
        depth={0}
        marketId={useMarketId}
        comment={rootComment}
        comments={comments}
        allowedTypes={[]}
      />;
    }
  }
}