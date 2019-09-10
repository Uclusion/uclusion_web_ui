import React from 'react';
import { Card } from '@material-ui/core';
import HtmlRichTextEditor from '../TextEditors/HtmlRichTextEditor';

function Comment(props) {

  const { comment, commentsHash } = props;
  const { body, children } = comment;

  function getChildComments() {
    if (children) {
      return children.map((childId) => {
        const child = commentsHash[childId];
        return <Comment comment={child} commentsHash={commentsHash} />;
      });
    }
    return <div/>;
  }

  return (
    <Card>
      <HtmlRichTextEditor value={comment.body}/>
      {getChildComments()}
    </Card>
  );
}

export default Comment