import React, { useState } from 'react';
import { Button, Card, CardActions, CardContent } from '@material-ui/core';
import { injectIntl } from 'react-intl';
import Comment from '../../components/Comments/Comment';
import PropTypes from 'prop-types';

function CommentBox(props) {

  const { comments, commentsHash, marketId, issueBox, intl } = props;
  const [addOpen, setAddOpen] = useState(false);
  const threadRoots = comments.filter(comment => !comment.reply_id);
  const addLabel = issueBox? 'commentBoxAddIssue' : 'commentBoxAddComment';


  function getCommentCards() {
    return threadRoots.map((comment) => {
      return (
        <Card key={comment.id}>
          <Comment marketId={marketId} comment={comment} commentsHash={commentsHash}/>
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
          {intl.formatMessage({ id: addLabel })}
        </Button>
      </CardActions>
      <CardContent>
        {addOpen && {}}
        {getCommentCards()}
      </CardContent>
    </Card>
  );
}

CommentBox.propTypes = {
  issueBox: PropTypes.bool,
  comments: PropTypes.arrayOf(PropTypes.object).isRequired,
  commentsHash: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  intl: PropTypes.object.isRequired,
};

export default injectIntl(CommentBox);
