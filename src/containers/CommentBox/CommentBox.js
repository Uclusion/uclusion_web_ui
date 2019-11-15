import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Card, CardActions, CardContent } from '@material-ui/core';
import { QUESTION_TYPE, ISSUE_TYPE, SUGGEST_CHANGE_TYPE, REPLY_TYPE } from '../../constants/comments';
import Comment from '../../components/Comments/Comment';
import Issue from '../../components/Issues/Issue';
import CommentAdd from '../../components/Comments/CommentAdd';



const TYPES = [QUESTION_TYPE, ISSUE_TYPE, SUGGEST_CHANGE_TYPE, REPLY_TYPE];

function CommentBox(props) {

  const { comments, commentsHash, marketId, investible } = props;
  const [addOpen, setAddOpen] = useState(true);

  const threadRoots = comments.filter(comment => !comment.reply_id);

  function getCommentCards() {
    return threadRoots.map((comment) => {
      const isIssue = comment.comment_type === ISSUE_TYPE;
      const RenderedComment = (isIssue) ? Issue : Comment;
      return (
        <Card key={comment.id}>
          <RenderedComment depth={0} marketId={marketId} comment={comment} commentsHash={commentsHash} />
        </Card>
      );
    });
  }

  function toggleAdd(newType) {
    return () => {
      const newAddOpen = {};
      TYPES.forEach((possibleType) => {
        if (possibleType !== newType) {
          newAddOpen[possibleType] = false;
        } else {
          newAddOpen[possibleType] = !addOpen[possibleType];
        }
      });
      setAddOpen(newAddOpen);
    };
  }



  return (
    <Card>
      <CardActions>

      </CardActions>
      <CardContent>
        {addOpen[QUESTION_TYPE] &&
        <CommentAdd type={QUESTION_TYPE} investible={investible} marketId={marketId} onSave={toggleAdd(QUESTION_TYPE)}
                    onCancel={toggleAdd(QUESTION_TYPE)} />}
        {addOpen[ISSUE_TYPE] &&
        <CommentAdd type={ISSUE_TYPE} investible={investible} marketId={marketId} onSave={toggleAdd(ISSUE_TYPE)}
                    onCancel={toggleAdd(ISSUE_TYPE)} />}
        {addOpen[SUGGEST_CHANGE_TYPE] &&
        <CommentAdd type={SUGGEST_CHANGE_TYPE} investible={investible} marketId={marketId}
                    onSave={toggleAdd(SUGGEST_CHANGE_TYPE)} onCancel={toggleAdd(SUGGEST_CHANGE_TYPE)} />}
        {getCommentCards()}
      </CardContent>
    </Card>
  );
}

CommentBox.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  comments: PropTypes.arrayOf(PropTypes.object).isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  commentsHash: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  investible: PropTypes.object,
  // eslint-disable-next-line react/forbid-prop-types
};

export default CommentBox;
