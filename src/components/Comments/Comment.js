import React from 'react';
import { Paper } from '@material-ui/core';
import HtmlRichTextEditor from '../TextEditors/HtmlRichTextEditor';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3, 2),
  },
}));

function Comment(props) {

  const classes = useStyles();
  const { comment, commentsHash, depth } = props;
  const { body, children } = comment;

  function getChildComments() {
    if (children) {
      return children.map((childId) => {
        const child = commentsHash[childId];
        const childDepth = depth + 1;
        return <Comment comment={child} depth={childDepth} commentsHash={commentsHash} />;
      });
    }
    return <div/>;
  }

  return (
    <Paper className={classes.root}>
      <HtmlRichTextEditor readOnly={true} value={comment.body}/>
      {getChildComments()}
    </Paper>
  );
}

export default Comment;
