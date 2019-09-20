import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent } from '@material-ui/core';
import HtmlRichTextEditor from '../TextEditors/HtmlRichTextEditor';
import CommentBox from '../../containers/CommentBox/CommentBox';
import MarketEditButton from './MarketEditButton';

function MarketView(props) {

  const { market, comments, commentsHash, editToggle } = props;
  const { description, id } = market;
  const issues = comments.filter((comment) => comment.isOpenIssue);

  return (
    <div>
      <Card>
        <CardContent>
          <MarketEditButton onClick={editToggle}/>
          <HtmlRichTextEditor value={description} readOnly={true}/>
        </CardContent>
      </Card>
      <CommentBox marketId={id}
                  comments={issues}
                  commentsHash={commentsHash}
                  issueBox={true}
                  depth={0}/>
      <CommentBox marketId={id}
                  comments={comments}
                  commentsHash={commentsHash}
                  depth={0}/>
    </div>
  );
}

MarketView.propTypes = {
  market: PropTypes.object.isRequired,
  comments: PropTypes.arrayOf(PropTypes.object),
  commentsHash: PropTypes.object,
  editToggle: PropTypes.func.isRequired,
};

export default MarketView;
