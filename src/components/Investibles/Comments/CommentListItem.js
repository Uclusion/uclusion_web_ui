import React from 'react';
import { Typography, Paper } from '@material-ui/core';


function CommentListItem(props) {
  const { created_by_name, body } = props;
  return (
    <Paper>
      <Typography>{created_by_name}:</Typography>
      <Typography>{body}</Typography>
    </Paper>
  );
}

export default CommentListItem;
