import React, { useState } from 'react';
import { injectIntl } from 'react-intl';
import { Paper, Button, MuiThemeProvider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import QuillEditor from '../TextEditors/QuillEditor';
import CommentReply from '../Comments/CommentReply';
import Comment from '../Comments/Comment';
import { issueTheme } from '../../config/themes';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3, 2),

  },
}));

function Issue(props) {
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

  function resolve() {

  }

  function toggleReply() {
    setReplyOpen(!replyOpen);
  }

  return (
    <MuiThemeProvider theme={issueTheme}>
      <Paper className={classes.root}>
        <QuillEditor readOnly value={comment.body} />
        <Button onClick={toggleReply}>
          {intl.formatMessage({ id: 'issueReplyLabel' })}
        </Button>
        <Button onClick={resolve}>
          {intl.formatMessage({ id: 'issueResolveLabel' })}
        </Button>
        {replyOpen && <CommentReply marketId={marketId} parent={comment} onSave={toggleReply} />}
        {getChildComments()}
      </Paper>
    </MuiThemeProvider>
  );
}

export default injectIntl(Issue);
