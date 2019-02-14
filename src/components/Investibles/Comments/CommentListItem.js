import React from 'react';
import { Typography, Paper } from '@material-ui/core';
import HtmlRichTextEditor from "../../TextEditors/HtmlRichTextEditor";
import { injectIntl } from "react-intl";

function CommentListItem(props) {
  const { created_by_name, created_at, body, intl } = props;
  const dateFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  };
  const createdTimestamp = intl.formatDate(created_at, dateFormatOptions);
  const commentHeader = intl.formatMessage({ id: 'commentHeaderFormat' }, {
    name: created_by_name,
    date: createdTimestamp
  });
  return (
    <Paper>
      <Typography>{commentHeader}</Typography>
      <HtmlRichTextEditor value={body} readOnly={true}/>
    </Paper>
  );
}

export default injectIntl(CommentListItem);
