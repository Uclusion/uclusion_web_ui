import React from 'react';
import { Typography, Paper } from '@material-ui/core';
import HtmlRichTextEditor from "../../TextEditors/HtmlRichTextEditor";
import { injectIntl } from "react-intl";
import { withUserAndPermissions } from '../../UserPermissions/UserPermissions';
import CommentDelete from './CommentDelete'


function CommentListItem(props) {

  function canDeleteComment(){
    const { created_by, userPermissions, upUser, } = props;
    const { canDeleteOwnComments, canDeleteOthersComments, } = userPermissions;
    return canDeleteOthersComments || (canDeleteOwnComments && upUser.id === created_by);
  }


  const { created_by_name, created_at, body, intl, id, investible_id} = props;
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
      <Typography>{commentHeader}{canDeleteComment() && <CommentDelete commentId={id} investibleId={investible_id}/>}</Typography>
      <HtmlRichTextEditor value={body} readOnly={true}/>
    </Paper>
  );
}

export default withUserAndPermissions(injectIntl(CommentListItem));
