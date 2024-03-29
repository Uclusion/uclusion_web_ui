import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { formCommentLink, formMarketAddInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';

function BugDecisionStep(props) {
  const { marketId, comment, comments, updateFormData, formData } = props;
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const { useCompression } = formData;

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText}>
        Do you want to move to a bug or job?
      </Typography>
      <CommentBox
        comments={comments}
        marketId={marketId}
        allowedTypes={[]}
        isInbox
        removeActions
        toggleCompression={() => updateFormData({useCompression: !useCompression})}
        useCompression={useCompression}
      />
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        nextLabel="BugWizardMoveToBug"
        showOtherNext
        isFinal={false}
        otherNextLabel="BugWizardMoveToJob"
        onOtherNext={() => navigate(history,
          `${formMarketAddInvestibleLink(marketId, comment.group_id)}&fromCommentId=${comment.id}`)}
        otherSpinOnClick={false}
        showTerminate
        terminateLabel="OnboardingWizardGoBack"
        onTerminate={() => navigate(history, formCommentLink(marketId, comment.group_id, comment.investible_id,
          comment.id))}
      />
    </WizardStepContainer>
  );
}

BugDecisionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

BugDecisionStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default BugDecisionStep;