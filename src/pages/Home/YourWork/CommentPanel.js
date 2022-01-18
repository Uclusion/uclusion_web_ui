import React, { useContext } from 'react'
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import { getCommentRoot, getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper'
import _ from 'lodash'
import Comment from '../../../components/Comments/Comment'
import { PLANNING_TYPE } from '../../../constants/markets'
import { TODO_TYPE } from '../../../constants/comments'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import LoadingDisplay from '../../../components/LoadingDisplay'
import InboxInvestible from './InboxInvestible'
import { Typography } from '@material-ui/core'
import PropTypes from 'prop-types'

function CommentPanel(props) {
  const { commentId, marketId, marketType, messageType, planningClasses, mobileLayout } = props;
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
      <>
        {investibleId && (
          <div style={{overflowY: 'auto', maxHeight: '15rem'}}>
            <InboxInvestible marketId={marketId} investibleId={investibleId}
                             planningClasses={planningClasses} marketType={marketType}
                             mobileLayout={mobileLayout} />
          </div>
        )}
        {!investibleId && (
          <Typography variant="h6" style={{paddingTop: '1rem', paddingLeft: '1rem', paddingRight: '1rem'}}>
            {market.name}
          </Typography>
        )}
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
      </>
    );
  } else {
    return (
      <LoadingDisplay showMessage messageId="loadingMessage" noMargin />
    );
  }
}

CommentPanel.propTypes = {
  messageType: PropTypes.string,
  marketId: PropTypes.string.isRequired,
};

CommentPanel.defaultProps = {
  messageType: '',
};

export default CommentPanel;