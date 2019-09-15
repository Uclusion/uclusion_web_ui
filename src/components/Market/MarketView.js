import React from 'react';
import { Card, CardContent } from '@material-ui/core';
import HtmlRichTextEditor from '../TextEditors/HtmlRichTextEditor';
import CommentBox from '../../containers/CommentBox/CommentBox';
import MarketEditButton from './MarketEditButton';

function MarketView(props) {

  const { market, comments, commentsHash, toggleEdit } = props;
  const { description, id } = market;

  return (
    <div>
    <Card>
      <CardContent>
        <MarketEditButton onClick={toggleEdit} />
        <HtmlRichTextEditor value={description} readOnly={true}/>
      </CardContent>
    </Card>
      <CommentBox marketId={id} comments={comments} commentsHash={commentsHash} depth={0}/>
    </div>
  );
}

export default MarketView;
