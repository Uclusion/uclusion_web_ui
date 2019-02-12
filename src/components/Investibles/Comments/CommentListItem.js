import React from 'react';
import { Typography, Paper } from '@material-ui/core';
import HtmlRichTextEditor from "../../TextEditors/HtmlRichTextEditor";


function CommentListItem(props) {
  const { created_by_name, body } = props;
  return (
    <Paper>
      <Typography>{created_by_name}</Typography>
      <HtmlRichTextEditor value={body} readOnly={true} />
    </Paper>
  );
}

export default CommentListItem;
