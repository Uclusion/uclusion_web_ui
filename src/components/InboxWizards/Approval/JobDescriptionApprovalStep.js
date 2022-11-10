import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import JobDescription from './JobDescription'


function JobDescriptionStep (props) {
  const {marketId, investibleId, updateFormData} = props;
  const classes = useContext(WizardStylesContext);

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        Is the job clear and complete?
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId} />
      <WizardStepButtons
        {...props}
        nextLabel="ApprovalWizardYes"
        showOtherNext
        otherNextLabel="ApprovalWizardNo"
        onOtherNext={() => updateFormData({ isClear: false })}
        onNext={() => updateFormData({ isClear: true })}
        showTerminate={true}
        terminateLabel="JobWizardGotoJob"/>
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