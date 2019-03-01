import React from 'react';
import { Typography, Paper } from '@material-ui/core';
import HtmlRichTextEditor from '../../TextEditors/HtmlRichTextEditor';
import { injectIntl } from "react-intl";
import { withUserAndPermissions } from '../../UserPermissions/UserPermissions';
import CommentDelete from './CommentDelete'
import PropTypes from 'prop-types';


function CommentListItem(props) {

  function canDeleteComment(){
    const { created_by, userPermissions, upUser, } = props;
    const { canDeleteOwnComments, canDeleteOthersComments, } = userPermissions;
    return canDeleteOthersComments || (canDeleteOwnComments && upUser.id === created_by);
  }


  const { created_by_name, created_at, body, intl, id, market_id, investible_id} = props;
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
    date: createdTimestamp,
  });
  return (
    <Paper>
      <Typography>{commentHeader}{canDeleteComment() && <CommentDelete marketId={market_id} investibleId={investible_id}  commentId={id} />}</Typography>
      <HtmlRichTextEditor value={body} readOnly={true}/>
    </Paper>
  );
}

CommentListItem.propTypes = {
  intl: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  investible_id: PropTypes.string.isRequired,
  market_id: PropTypes.string.isRequired,
  body: PropTypes.string.isRequired,
  created_by_name: PropTypes.string.isRequired,
  created_at: PropTypes.instanceOf(Date).isRequired,
  created_by: PropTypes.string.isRequired,
};

export default withUserAndPermissions(injectIntl(CommentListItem));
