import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { WORKSPACE_WIZARD_TYPE } from '../../../constants/markets';

// J-all-400: Connect AI is the first choice everywhere a workspace can be created; the demo
// button only shows for brand new users reaching this from onboarding
function AIChoiceStep(props) {
  const { isOnboarding, nextStep } = props;
  const classes = useContext(WizardStylesContext);
  const history = useHistory();

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText}>
        How do you want to start?
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Connect AI first walks you through naming your workspace and generating the commands
        that hook Uclusion up to your AI coding tools. The AI then helps with everything else,
        including view setup and collaborators.
      </Typography>
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        nextLabel='connectAIFirst'
        onNext={() => navigate(history, `/wizard#type=${WORKSPACE_WIZARD_TYPE.toLowerCase()}&startai=true`)}
        onNextDoAdvance={false}
        spinOnClick={false}
        showOtherNext={isOnboarding}
        otherNextLabel='seeDemoFirst'
        otherSpinOnClick={false}
        showTerminate
        terminateLabel={isOnboarding ? 'skipAIAndDemo' : 'skipAIOnly'}
        onTerminate={() => {
          if (isOnboarding) {
            navigate(history, `/wizard#type=${WORKSPACE_WIZARD_TYPE.toLowerCase()}&skipai=true`);
          } else {
            nextStep();
          }
        }}
      />
    </WizardStepContainer>
  );
}

AIChoiceStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
  isOnboarding: PropTypes.bool
};

export default AIChoiceStep;
