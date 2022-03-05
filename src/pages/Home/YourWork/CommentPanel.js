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
import { getLabelList } from '../../../utils/messageUtils'
import { useIntl } from 'react-intl'
import NotificationDeletion from './NotificationDeletion'

function CommentPanel(props) {
  const { commentId, marketId, marketType, messageType, planningClasses, mobileLayout, messagesFull,
    isDeletable, message} = props;
  const [marketState] = useContext(MarketsContext);
  const [commentState] = useContext(CommentsContext);
  const intl = useIntl();
  let useMarketId = marketId;
  let useCommentId = commentId;
  const market = getMarket(marketState, marketId) || {}
  let useMarketName = market.name
  const { parent_comment_id: inlineParentCommentId, parent_comment_market_id: parentMarketId } = market
  if (inlineParentCommentId) {
    // If there is a top level question always display it instead of lower level comments
    useMarketId = parentMarketId
    useCommentId = inlineParentCommentId
    const parentMarket = getMarket(marketState, parentMarketId) || {}
    useMarketName = parentMarket.name
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
            <InboxInvestible marketId={marketId} investibleId={investibleId} isDeletable={isDeletable}
                             planningClasses={planningClasses} marketType={marketType} message={message}
                             mobileLayout={mobileLayout} messagesFull={messagesFull} />
          </div>
        )}
        {!investibleId && (
          <div style={{display: mobileLayout ? undefined : 'flex'}}>
            {isDeletable && !investibleId && (
              <div style={{marginLeft: '1rem', marginTop: '1rem'}}>
                <NotificationDeletion message={message} />
              </div>
            )}
            <Typography variant="h6" style={{paddingTop: '1rem', paddingLeft: '1rem', paddingRight: '1rem'}}>
              {useMarketName}
            </Typography>
            {!_.isEmpty(messagesFull) && (
              <>
                {!mobileLayout && (
                  <>
                    <div style={{flexGrow: 1}} />
                    <Typography variant="body1" style={{paddingTop: '0.5rem', paddingRight: '0.5rem'}}>
                      {intl.formatMessage({ id: 'notificationsListHeader' },
                        { x: getLabelList(messagesFull, intl, mobileLayout) })}
                    </Typography>
                  </>
                )}
                {mobileLayout && (
                  <div style={{paddingLeft: '0.5rem', paddingRight: '0.5rem', paddingTop: '0.3rem'}}>
                    {intl.formatMessage({ id: 'notificationsListHeader' },
                      { x: getLabelList(messagesFull, intl, mobileLayout) })}
                  </div>
                )}
              </>
            )}
          </div>
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
            isInbox
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