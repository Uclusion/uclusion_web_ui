import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import WizardStepButtons from '../WizardStepButtons';
import { WizardStylesContext } from '../WizardStylesContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { formCommentLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { updateComment } from '../../../api/comments';
import { addCommentToMarket } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';

function RemoveInProgressStep (props) {
  const { otherInProgress, comment, formData, updateFormData } = props;
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const classes = useContext(WizardStylesContext);
  const history = useHistory();
  const { useCompression } = formData;

  function removeInProgress() {
    const promises = [];
    // Should be very small number of these so okay to blast
    otherInProgress.forEach((aComment) => {
      const promise = updateComment({marketId: aComment.market_id, commentId: aComment.id, inProgress: false})
        .then((modifiedComment) => {
        addCommentToMarket(modifiedComment, commentsState, commentsDispatch);
      });
      promises.push(promise);
    })
    return Promise.all(promises).then(() => {
      setOperationRunning(false);
      navigate(history, formCommentLink(comment.market_id, comment.group_id, comment.investible_id, comment.id));
    });
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText} variant="h6">
        Remove others from in progress?
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        If the task just put in progress is the only one active, then turn off in progress for the rest.
      </Typography>
      <div className={classes.wizardCommentBoxDiv}>
        <CommentBox
          comments={otherInProgress}
          marketId={comment.market_id}
          allowedTypes={[]}
          isInbox
          removeActions
          compressAll
          displayRepliesAsTop
          toggleCompression={() => updateFormData({ useCompression: !useCompression })}
          useCompression={useCompression}
        />
      </div>
      <WizardStepButtons
        {...props}
        focus
        nextLabel='removeInProgress'
        onNext={removeInProgress}
        showTerminate
        onTerminate={() => navigate(history, formCommentLink(comment.market_id, comment.group_id,
          comment.investible_id, comment.id))}
        terminateLabel="OnboardingWizardGoBack"
      />
    </WizardStepContainer>
)
}

RemoveInProgressStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
}

RemoveInProgressStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
}

export default RemoveInProgressStep