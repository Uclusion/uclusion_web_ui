import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Grid } from '@material-ui/core';
import Comment from '../../components/Comments/Comment';


function CommentBox(props) {

  const { comments, marketId } = props;
  const commentsHash = _.keyBy(comments, 'id');

  const threadRoots = comments.filter((comment) => !comment.reply_id);

  function getCommentCards() {
    return threadRoots.map((comment) => {
      return (
        <Grid
          item
          key={comment.id}
          xs={12}
        >
          <Comment
            depth={0}
            marketId={marketId}
            comment={comment}
            commentsHash={commentsHash}
          />
        </Grid>
      );
    });
  }


  return (
    <Grid
      container
    >
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
