import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Grid } from '@material-ui/core';
import Comment from '../../components/Comments/Comment';

function CommentBox(props) {

  const { comments, marketId } = props;

  const threadRoots = comments.filter((comment) => !comment.reply_id);
  const sortedRoots = _.sortBy(threadRoots, 'resolved', 'created_at');

  function getCommentCards() {
    return sortedRoots.map((comment) => {
      const { id } = comment;
      return (
        <Grid
          item
          key={id}
          xs={12}
        >
          <div id={id}>
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
