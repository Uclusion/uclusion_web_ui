import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import JobDescription from '../JobDescription'
import { REPORT_TYPE } from '../../../constants/comments'


function JobDescriptionStatusStep(props) {
  const {marketId, investibleId, updateFormData} = props;
  const classes = useContext(WizardStylesContext);

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        How will you report status?
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId} />
      <WizardStepButtons
        {...props}
        nextLabel="StatusWizardEstimate"
        showOtherNext
        otherNextLabel="StatusWizardReport"
        onOtherNext={() => updateFormData({ commentType: REPORT_TYPE })}
        showTerminate={true}
        terminateLabel="ApproveWizardGotoJob"/>
    </div>
    </WizardStepContainer>
  );
}

JobDescriptionStatusStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

JobDescriptionStatusStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default JobDescriptionStatusStep;