import React from 'react';
import { Typography, Paper } from '@material-ui/core';
import HtmlRichTextEditor from '../../TextEditors/HtmlRichTextEditor';
import { injectIntl } from "react-intl";
import CommentDelete from './CommentDelete'
import PropTypes from 'prop-types';


function CommentListItem(props) {

  function canDeleteComment(){
    const { created_by, user } = props;
    const { isAdmin } = user.market_presence.flagss;
    return isAdmin || (user.id === created_by);
  }


  const { created_by_name, created_at, body, intl, id, market_id, investible_id, is_official } = props;
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
      {is_official && <Typography color={'primary'}>{intl.formatMessage({id: 'officialCommentResponse'})}</Typography>}
      <Typography>{commentHeader}{canDeleteComment() && <CommentDelete marketId={market_id} investibleId={investible_id}  commentId={id} />}</Typography>
      <HtmlRichTextEditor value={body} readOnly={true}/>
    </Paper>
  );
}

CommentListItem.propTypes = {
  intl: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  investible_id: PropTypes.string.isRequired,
  market_id: PropTypes.string.isRequired,
  body: PropTypes.string.isRequired,
  created_by_name: PropTypes.string.isRequired,
  created_at: PropTypes.instanceOf(Date).isRequired,
  created_by: PropTypes.string.isRequired,
  is_official: PropTypes.bool.isRequired,
};

export default injectIntl(CommentListItem);
