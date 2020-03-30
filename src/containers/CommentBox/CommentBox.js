import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Grid } from '@material-ui/core';
import Comment from '../../components/Comments/Comment';

function findGreatestUpdatedAt(roots, comments, rootUpdatedAt) {
  let myRootUpdatedAt = rootUpdatedAt;
  if (_.isEmpty(roots)) {
    return rootUpdatedAt;
  }
  roots.forEach(reply => {
    if (!rootUpdatedAt || (rootUpdatedAt < reply.updated_at)) {
      myRootUpdatedAt = reply.updated_at;
    }
  });
  roots.forEach((reply) => {
    const replyReplies = comments.filter(
      comment => comment.reply_id === reply.id
    );
    myRootUpdatedAt = findGreatestUpdatedAt(replyReplies, comments, myRootUpdatedAt);
  });
  return myRootUpdatedAt;
}

function CommentBox(props) {
  const { comments, marketId } = props;

  const threadRoots = comments.filter(comment => !comment.reply_id);
  const withRootUpdatedAt = threadRoots.map((root) => {
    return { ...root, rootUpdatedAt: findGreatestUpdatedAt([root], comments) };
  });
  const sortedRoots = _.orderBy(withRootUpdatedAt, ['resolved', 'rootUpdatedAt'], ['asc', 'desc']);

  function getCommentCards() {
    return sortedRoots.map(comment => {
      const { id } = comment;
      return (
        <Grid item key={id} xs={12}>
          <div id={`c${id}`}>
            <Comment
              depth={0}
              marketId={marketId}
              comment={comment}
              comments={comments}
            />
          </div>
        </Grid>
      );
    });
  }

  return (
    <Grid container spacing={1}>
      {getCommentCards()}
    </Grid>
  );
}

CommentBox.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  comments: PropTypes.arrayOf(PropTypes.object).isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  marketId: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
};

export default CommentBox;
