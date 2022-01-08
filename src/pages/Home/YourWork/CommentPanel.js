import React, { useContext } from 'react'
import { useIntl } from 'react-intl'
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import { getCommentRoot, getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper'
import _ from 'lodash'
import Comment from '../../../components/Comments/Comment'
import { PLANNING_TYPE } from '../../../constants/markets'
import { TODO_TYPE } from '../../../constants/comments'
import Screen from '../../../containers/Screen/Screen'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'

function CommentPanel(props) {
  const { commentId, marketId, marketType, messageType } = props;
  const intl = useIntl();
  const [marketState] = useContext(MarketsContext);
  const [commentState] = useContext(CommentsContext);
  let useMarketId = marketId;
  let useCommentId = commentId;
  const market = getMarket(marketState, marketId) || {};
  const { parent_comment_id: inlineParentCommentId, parent_comment_market_id: parentMarketId } = market;
  if (inlineParentCommentId) {
    // If there is a top level question always display it instead of lower level comments
    useMarketId = parentMarketId;
    useCommentId = inlineParentCommentId;
  }
  const rootComment = getCommentRoot(commentState, useMarketId, useCommentId);
  // Note passing all comments down instead of just related to the unread because otherwise confusing and also
  // have case of more than one reply being de-duped
  // Note - checking resolved here because can be race condition with message removal and comment resolution
  if (!_.isEmpty(rootComment) && (messageType === 'UNREAD_RESOLVED' || !rootComment.resolved)) {
    const { comment_type: commentType, investible_id: investibleId } = rootComment;
    return (
      <div style={{paddingLeft: '1rem', paddingRight: '1rem', paddingBottom: '0.5rem'}}>
        <Comment
          depth={0}
          marketId={useMarketId}
          comment={rootComment}
          comments={getMarketComments(commentState, useMarketId)}
          defaultShowDiff
          allowedTypes={[]}
          noAuthor={marketType === PLANNING_TYPE && commentType === TODO_TYPE && !investibleId}
        />
      </div>
    );
  } else {
    return (
      <Screen
        hidden={false}
        loading={true}
        title={intl.formatMessage({ id: 'loadingMessage' })}
      >
        <div />
      </Screen>
    );
  }
}

export default CommentPanel;