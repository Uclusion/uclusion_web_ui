import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import JobDescription from './JobDescription'
import { ISSUE_TYPE } from '../../CardType'


function JobDescriptionStep (props) {
  const {marketId, investibleId, updateFormData} = props;
  const classes = useContext(WizardStylesContext);

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        Should this job be done now?
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId} />
      <WizardStepButtons
        {...props}
        nextLabel="ApprovalWizardApprove"
        showOtherNext
        otherNextLabel="ApprovalWizardBlock"
        onOtherNext={() => updateFormData({ commentType: ISSUE_TYPE })}
        onNext={() => updateFormData({ isApprove: true, investibleId })}
        showTerminate={true}
        terminateLabel="ApproveWizardGotoJob"/>
    </div>
    </WizardStepContainer>
  );
}

JobDescriptionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

JobDescriptionStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default JobDescriptionStep;