import React, { useState } from 'react';

import { Paper, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import QuillEditor from '../TextEditors/QuillEditor';
import CommentAdd from './CommentAdd';
import { REPLY_TYPE } from '../../constants/comments';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3, 2),
  },
}));

function Comment(props) {
  const {
    comment, commentsHash, depth, marketId,
  } = props;
  const classes = useStyles();
  const intl = useIntl();
  const { children } = comment;

  const [replyOpen, setReplyOpen] = useState(false);

  function getChildComments() {
    if (children) {
      return children.map((childId) => {
        const child = commentsHash[childId];
        const childDepth = depth + 1;
        // we are rendering ourselves, so we don't get the injection automagically
        return (
          <Comment
            key={childId}
            comment={child}
            depth={childDepth}
            marketId={marketId}
            commentsHash={commentsHash}
          />
        );
      });
    }
    return <div />;
  }

  function toggleReply() {
    setReplyOpen(!replyOpen);
  }

  return (
    <Paper className={classes.root}>
      <QuillEditor marketId={marketId} readOnly value={comment.body} />
      <Button onClick={toggleReply}>
        {intl.formatMessage({ id: 'commentReplyLabel' })}
      </Button>
      {replyOpen
      && (
      <CommentAdd
        marketId={marketId}
        parent={comment}
        onSave={toggleReply}
        onCancel={toggleReply}
        type={REPLY_TYPE}
      />
      )}
      {getChildComments()}
    </Paper>
  );
}
Comment.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  comment: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  commentsHash: PropTypes.object.isRequired,
  depth: PropTypes.number.isRequired,
  marketId: PropTypes.string.isRequired,
};

export default Comment;
