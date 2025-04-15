import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import WizardStepButtons from '../WizardStepButtons';
import { navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { onSignOut } from '../../../utils/userFunctions';
import { WizardStylesContext } from '../WizardStylesContext';

function SignOutWarningStep(props) {
  const history = useHistory();
  const classes = useContext(WizardStylesContext);

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        Are you sure you want to sign out?
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Reloading after a sign out takes time and email and Slack alerts are only sent for high priority.
      </Typography>
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        focus
        nextLabel="signOutButton"
        onNext={onSignOut}
        showTerminate
        onTerminate={() => navigate(history)}
        terminateLabel="OnboardingWizardGoBack"
      />
    </WizardStepContainer>
  );
}

SignOutWarningStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

SignOutWarningStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default SignOutWarningStep;