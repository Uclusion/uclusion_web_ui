import React, { useState } from 'react';
import { Button, Card, CardActions, CardContent } from '@material-ui/core';
import { injectIntl } from 'react-intl';
import Comment from '../../components/Comments/Comment';
import Issue from '../../components/Issues/Issue';
import PropTypes from 'prop-types';
import CommentAdd from '../../components/Comments/CommentAdd';

function CommentBox(props) {

  const { comments, commentsHash, marketId, intl, investible } = props;
  const [addOpen, setAddOpen] = useState(false);
  const threadRoots = comments.filter(comment => !comment.reply_id);

  function getCommentCards() {
    return threadRoots.map((comment) => {
      const isIssue = comment.comment_type === 'ISSUE';
      const RenderedComment = (isIssue) ? Issue : Comment;
      return (
        <Card key={comment.id}>
          <RenderedComment marketId={marketId} comment={comment} commentsHash={commentsHash} />
        </Card>
      );
    });
  }

  function toggleAdd() {
    setAddOpen(!addOpen);
  }

  return (
    <Card>
      <CardActions>
        <Button onClick={toggleAdd}>
          {intl.formatMessage({ id: 'commentBoxAddComment' })}
        </Button>
      </CardActions>
      <CardContent>
        {addOpen && <CommentAdd investible={investible} marketId={marketId} onSave={toggleAdd} onCancel={toggleAdd} />}
        {getCommentCards()}
      </CardContent>
    </Card>
  );
}

CommentBox.propTypes = {
  issueBox: PropTypes.bool,
  comments: PropTypes.arrayOf(PropTypes.object).isRequired,
  commentsHash: PropTypes.object.isRequired,
  marketId: PropTypes.string,
  intl: PropTypes.object.isRequired,
};

export default injectIntl(CommentBox);
