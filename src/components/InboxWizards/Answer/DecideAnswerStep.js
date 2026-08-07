import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import { getCommentRoot, getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { useIntl } from 'react-intl';
import JobDescription from '../JobDescription';

function DecideAnswerStep(props) {
  const { marketId, commentId, message } = props;
  const [commentState] = useContext(CommentsContext);
  const [marketsState] = useContext(MarketsContext);
  // For a new option the message points at the inline decision market; the question is that market's parent comment.
  const { parent_comment_id: parentCommentId, parent_comment_market_id: parentCommentMarketId } =
    getMarket(marketsState, marketId) || {};
  const useParentQuestion = message.type === 'UNREAD_OPTION' && !!parentCommentId;
  const questionMarketId = useParentQuestion ? parentCommentMarketId : marketId;
  const questionCommentId = useParentQuestion ? parentCommentId : commentId;
  const commentRoot = getCommentRoot(commentState, questionMarketId, questionCommentId) || {id: 'fake'};
  const comments = getMarketComments(commentState, questionMarketId).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();
  const intl = useIntl();
  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'DecideAnswerTitle'})}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Approve an existing option or propose a new option. Use the mute
        button if you don't want further notifications on this vote.
      </Typography>
      <JobDescription marketId={questionMarketId} investibleId={commentRoot.investible_id} comments={comments}
                      showVoting
                      inboxMessageId={questionCommentId} />
      <div style={{marginBottom: '2rem'}}/>
    </WizardStepContainer>
  );
}

DecideAnswerStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

export default DecideAnswerStep;
