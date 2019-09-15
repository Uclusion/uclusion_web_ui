import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent } from '@material-ui/core';
import HtmlRichTextEditor from '../TextEditors/HtmlRichTextEditor';
import CommentBox from '../../containers/CommentBox/CommentBox';
import InvestibleEditButton from './InvestibleEditButton';

function InvestibleView(props) {

  const { investible, comments, commentsHash, editToggle } = props;

  const { description, market_id: marketId } = investible;
  return (
    <Card>
      <CardContent>
        <InvestibleEditButton onClick={editToggle} />
        <HtmlRichTextEditor style={{ minHeight: 'auto' }} value={description} readOnly/>
      </CardContent>
      <CommentBox marketId={marketId} comments={comments} depth={0} commentsHash={commentsHash}/>
    </Card>
  );
}

InvestibleView.propTypes = {
  investible: PropTypes.object.isRequired,
};

export default InvestibleView;
