import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { getCommentThreads } from '../../../contexts/CommentsContext/commentsContextHelper';

function DecideWhereStep (props) {
  const { marketId, updateFormData, fromCommentIds, marketComments } = props;
  const classes = useContext(WizardStylesContext);
  const roots = (fromCommentIds || []).map((fromCommentId) =>
    marketComments.find((comment) => comment.id === fromCommentId) || {id: 'notFound'});
  const comments = getCommentThreads(roots, marketComments);

  if (comments.find((comment) => comment.id === 'notFound')) {
    return React.Fragment;
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        Where do you want to move?
      </Typography>
      <div className={classes.wizardCommentBoxDiv}>
        <CommentBox
          comments={comments}
          marketId={marketId}
          allowedTypes={[]}
          isInbox
          removeActions
        />
      </div>
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        nextLabel="JobWizardNewJob"
        spinOnClick={false}
        showOtherNext
        otherNextLabel="JobWizardExistingJob"
        onOtherNext={() => updateFormData({ isMoveExisting: true })}
        otherSpinOnClick={false}
        showTerminate={false}
      />
    </div>
    </WizardStepContainer>
  );
}

DecideWhereStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideWhereStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideWhereStep;