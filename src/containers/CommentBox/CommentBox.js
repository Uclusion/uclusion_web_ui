import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { ISSUE_TYPE } from '../../constants/comments';
import Comment from '../../components/Comments/Comment';
import Issue from '../../components/Issues/Issue';
import { Grid } from '@material-ui/core';


function CommentBox(props) {

  const { comments, marketId } = props;
  const commentsHash = _.keyBy(comments, 'id');

  const threadRoots = comments.filter((comment) => !comment.reply_id);

  function getCommentCards() {
    return threadRoots.map((comment) => {
      const isIssue = comment.comment_type === ISSUE_TYPE;
      const RenderedComment = (isIssue) ? Issue : Comment;
      return (
        <Grid
          item
          key={comment.id}
          xs={12}
        >
          <RenderedComment
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
