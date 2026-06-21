import React, { useContext } from 'react';
import { Dialog, DialogContent, IconButton, makeStyles } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import _ from 'lodash';
import { useIntl } from 'react-intl';
import { EditCommentContext } from '../../contexts/EditCommentContext/EditCommentContext';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarket, marketTokenLoaded } from '../../contexts/MarketsContext/marketsContextHelper';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { getComment, getCommentRoot } from '../../contexts/CommentsContext/commentsContextHelper';
import CommentBox from '../../containers/CommentBox/CommentBox';
import { ISSUE_TYPE, QUESTION_TYPE, REPORT_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../constants/comments';
import { PLANNING_TYPE } from '../../constants/markets';
import { BLUE_LEVEL } from '../../constants/notifications';

const useStyles = makeStyles(() => ({
  paper: {
    // Hug the 680px composer rather than the wide default dialog, and let Quill's
    // toolbar pickers overflow instead of being clipped by the dialog.
    width: '95%',
    maxWidth: 760,
    overflow: 'visible',
  },
  content: {
    paddingTop: '1.5rem',
    overflow: 'visible',
  },
  closeButton: {
    position: 'absolute',
    right: 6,
    top: 6,
    zIndex: 1,
  },
}), { name: 'EditCommentModal' });

/**
 * T-all-2209 (Q-all-156 O-2): the edit-comment screen as a top-level modal. It is
 * driven by EditCommentContext (set by the comment's edit action) rather than by
 * the comment's place in a list, and resolves the comment by id from
 * CommentsContext - so the dialog stays open and on-screen even if the task is
 * moved to a different job mid-edit. Mirrors the lookup that the standalone
 * /comment route page (CommentReplyEdit) does, just rendered as an overlay.
 */
function EditCommentModal() {
  const intl = useIntl();
  const classes = useStyles();
  const { editComment, closeEditComment } = useContext(EditCommentContext);
  const [marketsState, , tokensHash] = useContext(MarketsContext);
  const [commentsState] = useContext(CommentsContext);

  if (_.isEmpty(editComment)) {
    return null;
  }
  const { marketId, commentId } = editComment;
  const comment = getComment(commentsState, marketId, commentId);
  const loading = !marketId || marketsState.initializing || !marketTokenLoaded(marketId, tokensHash);
  if (loading || _.isEmpty(comment)) {
    // Cannot allow Quill to display a picture without a market token; just don't
    // open a broken dialog (this should not normally happen since edit is opened
    // from an already-loaded comment).
    return null;
  }
  const rootComment = getCommentRoot(commentsState, marketId, commentId);
  const market = getMarket(marketsState, marketId);
  const isPlanning = market?.market_type === PLANNING_TYPE;
  const isSubTask = rootComment?.id !== commentId && rootComment?.comment_type === TODO_TYPE
    && rootComment?.investible_id
    && (comment.created_by === rootComment?.created_by || comment.notification_type === BLUE_LEVEL) && isPlanning;
  const allowedTypes = [QUESTION_TYPE, REPORT_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE, ISSUE_TYPE];

  return (
    <Dialog
      open
      onClose={closeEditComment}
      maxWidth={false}
      scroll="body"
      classes={{ paper: classes.paper }}
      aria-label={intl.formatMessage({ id: 'commentReplyEdit' })}
    >
      <IconButton size="small" className={classes.closeButton} onClick={closeEditComment}
                  aria-label={intl.formatMessage({ id: 'cancel' })}>
        <CloseIcon />
      </IconButton>
      <DialogContent className={classes.content}>
        {isSubTask && (
          <div style={{ marginBottom: '1.5rem' }}>
            <CommentBox comments={[rootComment]} marketId={marketId} removeActions usePadding={false}
                        allowedTypes={allowedTypes} />
          </div>
        )}
        <CommentBox comments={[comment]} marketId={marketId} replyEditId={commentId} displayRepliesAsTop
                    allowedTypes={allowedTypes} />
      </DialogContent>
    </Dialog>
  );
}

export default EditCommentModal;
