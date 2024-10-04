import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import { getCommentRoot } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { useIntl } from 'react-intl';
import JobDescription from '../JobDescription';

function DecidePromoteStep(props) {
  const { marketId, commentId, investibleId, commentMarketId } = props;
  const [commentState] = useContext(CommentsContext);
  const commentRoot = getCommentRoot(commentState, commentMarketId, commentId) || {id: 'fake'};
  const comments = (commentState[commentMarketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();
  const intl = useIntl();

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'DecidePromotionTitle'})}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Drag and drop to allow voting on an option or leave a comment explaining why it should not be promoted.
      </Typography>
      <JobDescription marketId={marketId} investibleId={commentRoot.investible_id} comments={comments}
                      showVoting commentMarketId={commentMarketId}
                      selectedInvestibleIdParent={investibleId}
      />
    </WizardStepContainer>
  );
}

DecidePromoteStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecidePromoteStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecidePromoteStep;