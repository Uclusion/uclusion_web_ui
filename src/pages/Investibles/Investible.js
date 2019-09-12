import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent } from '@material-ui/core';
import HtmlRichTextEditor from '../../components/TextEditors/HtmlRichTextEditor';
import CommentBox from '../../containers/CommentBox/CommentBox';


function Investible(props) {

  const { investible, comments, commentsHash } = props;

  const { description, marketId } = investible;
  return (
    <Card>
      <CardContent>
        Test
        <HtmlRichTextEditor style={{ minHeight: 'auto' }} value={description} readOnly/>
      </CardContent>
      <CommentBox marketId={marketId} comments={comments} depth={0} commentsHash={commentsHash} />
    </Card>
  );
}

Investible.propTypes = {
  investible: PropTypes.object.isRequired,
};

export default Investible;
