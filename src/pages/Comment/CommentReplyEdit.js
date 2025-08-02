import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import React, { useContext, useState } from 'react';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { marketTokenLoaded } from '../../contexts/MarketsContext/marketsContextHelper';
import Screen from '../../containers/Screen/Screen';
import { useLocation } from 'react-router';
import { decomposeMarketPath } from '../../utils/marketIdPathFunctions';
import CommentBox from '../../containers/CommentBox/CommentBox';
import { ISSUE_TYPE, QUESTION_TYPE, REPORT_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../constants/comments';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { getComment, getCommentRoot } from '../../contexts/CommentsContext/commentsContextHelper';

function CommentReplyEdit(props) {
  const { hidden } = props;
  const location = useLocation();
  const { pathname } = location;
  const { marketId, investibleId: commentId } = decomposeMarketPath(pathname);
  const intl = useIntl();
  const [marketsState, , tokensHash] = useContext(MarketsContext);
  const [commentsState] = useContext(CommentsContext);
  const [useCompression, setUseCompression] = useState(true);
  const comment = getComment(commentsState, marketId, commentId) || {};
  const comments = [comment];
  const rootComment = getCommentRoot(commentsState, marketId, commentId);
  const isSubTask = rootComment?.id !== commentId && rootComment?.comment_type === TODO_TYPE && rootComment?.investible_id 
  && comment.created_by === rootComment?.created_by;
  const loading = !marketId || marketsState.initializing || !marketTokenLoaded(marketId, tokensHash);
  if (loading) {
    // Cannot allow Quill to try to display a picture without a market token
    return (
      <Screen
        hidden={hidden}
        loading={loading}
        loadingMessageId='loadingMessage'
        title={intl.formatMessage({ id: 'loadingMessage' })}
      >
        <div />
      </Screen>
    );
  }

  return (
    <Screen
      title={intl.formatMessage({id: 'commentReplyEdit'})}
      tabTitle={intl.formatMessage({id: 'commentReplyEdit'})}
      hidden={hidden}
    >
      {isSubTask && !hidden && (
        <div style={{paddingLeft: '3%', paddingRight: '3%', marginTop: '2rem'}}>
          <CommentBox comments={[rootComment]} marketId={marketId} removeActions usePadding={false}
                    toggleCompression={() => setUseCompression(!useCompression)}
                    useCompression={useCompression}
                    allowedTypes={[QUESTION_TYPE, REPORT_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE, ISSUE_TYPE]}/>
        </div>
      )}
      {!hidden && (
        <div style={{paddingLeft: '3%', paddingRight: '3%', marginTop: isSubTask ? undefined : '2rem'}}>
          <CommentBox comments={comments} marketId={marketId} replyEditId={commentId} displayRepliesAsTop
                      allowedTypes={[QUESTION_TYPE, REPORT_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE, ISSUE_TYPE]}/>
        </div>
      )}
    </Screen>
  );
}

CommentReplyEdit.propTypes = {
  hidden: PropTypes.bool.isRequired
}

export default CommentReplyEdit;