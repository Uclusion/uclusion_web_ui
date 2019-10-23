import React, { useState } from 'react';
import { injectIntl } from 'react-intl';
import { Paper, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import QuillEditor from '../TextEditors/QuillEditor';
import CommentAdd from './CommentAdd';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3, 2),
  },
}));

function Comment(props) {
  const {
    comment, commentsHash, depth, intl, marketId,
  } = props;
  const classes = useStyles();

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
            intl={intl}
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
      <QuillEditor readOnly value={comment.body} />
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
      />
      )}
      {getChildComments()}
    </Paper>
  );
}

export default injectIntl(Comment);
