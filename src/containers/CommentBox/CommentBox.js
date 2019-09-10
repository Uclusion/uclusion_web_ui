import React from 'react';
import { Card } from '@material-ui/core';
import Comment from '../../components/Comments/Comment';

function CommentBox(props) {

  const { comments, commentsHash } = props;
  const threadRoots = comments.filter(comment => !comment.reply_id);

  function getCommentCards() {
    return threadRoots.map((comment) => {
      return (
        <Card>
          <Comment comment={comment} commentsHash={commentsHash} />
        </Card>
      );
    });
  }

  return (
    <Card>
      {getCommentCards()}
    </Card>
  );
}

export default CommentBox;
