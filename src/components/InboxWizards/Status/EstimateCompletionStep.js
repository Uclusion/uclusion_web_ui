import React from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext'
import InvestibleStatus from '../../../pages/Home/YourWork/InvestibleStatus'

function EstimateCompletionStep(props) {
  const { marketId, investibleId, message } = props;
  const classes = wizardStyles();

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText} style={{marginBottom: 'unset'}}>
        When is your estimated completion?
      </Typography>
      <InvestibleStatus investibleId={investibleId} message={message} marketId={marketId} wizardProps={props} />
    </div>
    </WizardStepContainer>
  );
}

EstimateCompletionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

EstimateCompletionStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default EstimateCompletionStep;