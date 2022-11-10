import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import JobDescription from './JobDescription'
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments'

function ChooseActionApprovalStep(props) {
  const {marketId, investibleId, updateFormData, formData} = props;
  const classes = useContext(WizardStylesContext);
  const { isClear } = formData;

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        {isClear ? "Should this job be approved?" : "What's confusing or missing?"}
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId} />
      <WizardStepButtons
        {...props}
        nextLabel={isClear ? "ApprovalWizardApprove" : "ApprovalWizardQuestion"}
        showOtherNext
        otherNextLabel={isClear ? "ApprovalWizardBlock" : "ApprovalWizardSuggestion"}
        onOtherNext={() => updateFormData(isClear ? { commentType: ISSUE_TYPE } : { commentType: SUGGEST_CHANGE_TYPE })}
        onNext={() => updateFormData(isClear ? { isApprove: true, investibleId } : { commentType: QUESTION_TYPE })}
        showTerminate={true}
        terminateLabel="JobWizardGotoJob"/>
    </div>
    </WizardStepContainer>
  );
}

ChooseActionApprovalStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

ChooseActionApprovalStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default ChooseActionApprovalStep;