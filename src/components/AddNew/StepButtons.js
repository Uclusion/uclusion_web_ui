import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@material-ui/core';
import { useIntl } from 'react-intl';
import SpinningButton from '../SpinBlocking/SpinningButton';

function StepButtons (props) {
  const {
    onStartOver,
    previousStep,
    nextStep,
    totalSteps,
    currentStep,
    validForm,
    onNext,
    onSkip,
    onPrevious,
    onFinish,
    formData,
    showSkip,
    showGoBack,
    showNext,
    finishLabel,
    startOverLabel,
    showStartOver,
    startOverDestroysData,
    classes,
    spinOnClick,
  } = props;
  const intl = useIntl();
  const lastStep = currentStep === totalSteps - 1; //zero indexed
  const [spinning, setSpinning] = useState(false);

  function myOnPrevious () {
    if (spinOnClick) {
      setSpinning(true);
    }
    onPrevious();
    previousStep();
  }

  async function nextState(nextFunction) {
    if (spinOnClick) {
      setSpinning(true);
    }
    const nextReturn = nextFunction();
    const resolved = await Promise.resolve(nextReturn);
    nextStep();
    return resolved;
  }

  async function myOnNext () {
    return nextState(onNext);
  }

  async function myOnSkip () {
   return nextState(onSkip);
  }

  function myOnStartOver() {
    // TODO Pop A modal saying are you sure?
    onStartOver();
  }

  function myOnFinish() {
    if (spinOnClick) {
      setSpinning(true);
    }
    onFinish(formData);
  }

  const startOverClass = startOverDestroysData? classes.actionStartOver : classes.actionPrimary;
  return (
    <div className={classes.buttonContainer}>
      {showStartOver && (
        <div className={classes.startOverContainer}>
          <Button disabled={spinning} className={startOverClass} onClick={myOnStartOver}>{intl.formatMessage({ id: startOverLabel })}</Button>
        </div>
      )}

      <div className={classes.actionContainer}>
        {(currentStep > 0) && showGoBack && (
          <SpinningButton spinning={spinning} className={classes.actionSecondary} onClick={myOnPrevious}>{intl.formatMessage({ id: 'OnboardingWizardGoBack' })}</SpinningButton>
        )}
        {showSkip && (
          <SpinningButton spinning={spinning} className={classes.actionSkip} variant="outlined" onClick={myOnSkip}>{intl.formatMessage({ id: 'OnboardingWizardSkip' })}</SpinningButton>
        )}
        {lastStep && showNext && (
          <SpinningButton spinning={spinning} className={classes.actionPrimary} disabled={!validForm} onClick={myOnFinish}>{intl.formatMessage({ id: finishLabel })}</SpinningButton>
        )}
        {!lastStep && showNext && (
          <SpinningButton spinning={spinning} className={classes.actionPrimary} disabled={!validForm}
                  onClick={myOnNext}>{intl.formatMessage({ id: 'OnboardingWizardContinue' })}</SpinningButton>
        )}
      </div>
    </div>
  );
}

StepButtons.propTypes = {
  previousStep: PropTypes.func,
  nextStep: PropTypes.func,
  totalSteps: PropTypes.number,
  currentStep: PropTypes.number,
  validForm: PropTypes.bool,
  onStartOver: PropTypes.func,
  onNext: PropTypes.func,
  onSkip: PropTypes.func,
  showSkip: PropTypes.bool,
  showGoBack: PropTypes.bool,
  finishLabel: PropTypes.string,
  onFinish: PropTypes.func,
  formData: PropTypes.object,
  showStartOver: PropTypes.bool,
  startOverLabel: PropTypes.string,
  showNext: PropTypes.bool,
  startOverDestroysData: PropTypes.bool,
  spinOnClick: PropTypes.bool,
};
StepButtons.defaultProps = {
  onStartOver: () => {},
  previousStep: () => {},
  nextStep: () => {},
  onPrevious: () => {},
  onNext: () => {},
  onSkip: () => {},
  onFinish: () => {},
  formData: {},
  totalSteps: 0,
  currentStep: 0,
  validForm: true,
  showSkip: false,
  showGoBack: true,
  showNext: true,
  showStartOver: true,
  startOverDestroysData: true,
  finishLabel: 'OnboardingWizardFinish',
  startOverLabel: 'OnboardingWizardStartOver',
  spinOnClick: false,
};

export default StepButtons;
