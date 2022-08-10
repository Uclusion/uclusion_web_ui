import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@material-ui/core';
import { useIntl } from 'react-intl';
import SpinningButton from '../SpinBlocking/SpinningButton';
import { WizardStylesContext } from './WizardStylesContext';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'

function StepButtons (props) {
  const {
    startOver,
    onPrevious,
    onNext,
    onSkip,
    previousStep,
    nextStep,
    finish,
    totalSteps,
    currentStep,
    validForm,
    showSkip,
    showGoBack,
    showNext,
    showFinish,
    finishLabel,
    startOverLabel,
    showStartOver,
    startOverDestroysData,
    spinOnClick,
    onFinish
  } = props;
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const lastStep = currentStep === totalSteps - 1; //zero indexed

  function myPrevious () {
    onPrevious();
    previousStep();
  }

  async function nextState(nextFunction) {
    const nextReturn = nextFunction();
    const resolved = await Promise.resolve(nextReturn);
    if (lastStep) {
      return finish(resolved);
    }else{
      setOperationRunning(false);
      nextStep();
    }
    return resolved;
  }

  async function myNext () {
    return nextState(onNext);
  }

  async function mySkip () {
    return nextState(onSkip);
  }

  async function myFinish() {
    if (onFinish) {
      const resolved = await Promise.resolve(onFinish());
      return finish(resolved);
    }
    return finish();
  }

  const nextLabel = lastStep ? finishLabel : 'OnboardingWizardContinue';

  const startOverClass = startOverDestroysData ? classes.actionStartOver : classes.actionPrimary;
  return (
    <div className={classes.buttonContainer}>
      {showStartOver && (
        <div className={classes.startOverContainer}>
          <Button disabled={operationRunning} className={startOverClass} onClick={startOver}>
            {intl.formatMessage({ id: startOverLabel })}
          </Button>
        </div>
      )}

      <div className={classes.actionContainer}>
        {(currentStep > 0) && showGoBack && (
          <SpinningButton className={classes.actionSecondary} doSpin={false} onClick={myPrevious}>
            {intl.formatMessage({ id: 'OnboardingWizardGoBack' })}
          </SpinningButton>
        )}
        {showSkip && (
          <SpinningButton id="OnboardingWizardSkip" className={classes.actionSkip} variant="outlined"
                          doSpin={spinOnClick} onClick={mySkip}>
            {intl.formatMessage({ id: 'OnboardingWizardSkip' })}
          </SpinningButton>
        )}
        {showNext && (
          <SpinningButton id="OnboardingWizardNext" className={classes.actionPrimary} disabled={!validForm}
                          onClick={myNext} doSpin={spinOnClick}>
            {intl.formatMessage({ id: nextLabel })}
          </SpinningButton>
        )}
        {showFinish && (
          <SpinningButton id="OnboardingWizardFinish" className={classes.actionPrimary} disabled={!validForm}
                          onClick={myFinish} doSpin={spinOnClick}>
            {intl.formatMessage({ id: finishLabel })}
          </SpinningButton>
        )}
      </div>
    </div>
  );
}

StepButtons.propTypes = {
  onPrevious: PropTypes.func,
  onNext: PropTypes.func,
  previousStep: PropTypes.func,
  nextStep: PropTypes.func,
  onSkip: PropTypes.func,
  totalSteps: PropTypes.number,
  currentStep: PropTypes.number,
  validForm: PropTypes.bool,
  startOver: PropTypes.func,
  showSkip: PropTypes.bool,
  showFinish: PropTypes.bool,
  showGoBack: PropTypes.bool,
  finishLabel: PropTypes.string,
  finish: PropTypes.func,
  onFinish: PropTypes.func,
  showStartOver: PropTypes.bool,
  startOverLabel: PropTypes.string,
  showNext: PropTypes.bool,
  startOverDestroysData: PropTypes.bool,
  spinOnClick: PropTypes.bool,
};
StepButtons.defaultProps = {
  startOver: () => {},
  onPrevious: () => {},
  onNext: () => {},
  onSkip: () => {},
  previousStep: () => {},
  nextStep: () => {},
  skipStep: () => {},
  onFinish: () => {},
  finish: () => {},
  formData: {},
  totalSteps: 0,
  currentStep: 0,
  validForm: true,
  showSkip: false,
  showFinish: true,
  showGoBack: true,
  showNext: true,
  showStartOver: true,
  startOverDestroysData: true,
  finishLabel: 'OnboardingWizardFinish',
  startOverLabel: 'OnboardingWizardStartOver',
  spinOnClick: true,
};

export default StepButtons;
