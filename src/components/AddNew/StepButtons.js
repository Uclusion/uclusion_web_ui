import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@material-ui/core';
import { useIntl } from 'react-intl';
import SpinningButton from '../SpinBlocking/SpinningButton';
import { WizardStylesContext } from './WizardStylesContext';

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
  const lastStep = currentStep === totalSteps - 1; //zero indexed
  const [spinning, setSpinning] = useState(false);

  function myPrevious () {
    if (spinOnClick) {
      setSpinning(true);
    }
    onPrevious();
    previousStep();
  }

  async function nextState (nextFunction) {
    if (spinOnClick) {
      setSpinning(true);
    }
    const nextReturn = nextFunction();
    const resolved = await Promise.resolve(nextReturn);
    if (lastStep) {
      return finish(resolved);
    }else{
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
    if (spinOnClick) {
      setSpinning(true);
    }
    const resolved = await Promise.resolve(onFinish());
    return finish(resolved);
  }

  const nextLabel = lastStep ? finishLabel : 'OnboardingWizardContinue';

  const startOverClass = startOverDestroysData ? classes.actionStartOver : classes.actionPrimary;
  return (
    <div className={classes.buttonContainer}>
      {showStartOver && (
        <div className={classes.startOverContainer}>
          <Button disabled={spinning} className={startOverClass}
                  onClick={startOver}>{intl.formatMessage({ id: startOverLabel })}</Button>
        </div>
      )}

      <div className={classes.actionContainer}>
        {(currentStep > 0) && showGoBack && (
          <SpinningButton spinning={spinning} className={classes.actionSecondary}
                          onClick={myPrevious}>{intl.formatMessage({ id: 'OnboardingWizardGoBack' })}</SpinningButton>
        )}
        {showSkip && (
          <SpinningButton spinning={spinning} className={classes.actionSkip} variant="outlined"
                          onClick={mySkip}>{intl.formatMessage({ id: 'OnboardingWizardSkip' })}</SpinningButton>
        )}
        {showNext && (
          <SpinningButton spinning={spinning} className={classes.actionPrimary} disabled={!validForm}
                          onClick={myNext}>{intl.formatMessage({ id: nextLabel })}</SpinningButton>
        )}
        {showFinish && (
          <SpinningButton spinning={spinning} className={classes.actionPrimary} disabled={!validForm}
                          onClick={myFinish}>{intl.formatMessage({ id: finishLabel })}</SpinningButton>
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
