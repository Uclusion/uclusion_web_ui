import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@material-ui/core';
import { useIntl } from 'react-intl';

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
    classes
  } = props;
  const intl = useIntl();
  const lastStep = currentStep === totalSteps - 1; //zero indexed

  function myOnPrevious () {
    onPrevious();
    previousStep();
  }

  async function myOnNext () {
    // if our next is a promise, we'll advance our state forward
    // and make sure we return it's resolved value afterwards.
    // it's a little odd we advance first, but it's safe if instantaneous
    // and a promise would have advanced anyways
    const nextReturn = onNext();
    //advance the state
    nextStep();
    const resolved = await Promise.resolve(nextReturn);
    return resolved;
  }

  async function myOnSkip () {
    // same basic logic as onNext
    const skipReturn  = onSkip();
    nextStep();
    const resolved = await Promise.resolve(skipReturn);
    return resolved;
  }

  function myOnStartOver() {
    // TODO Pop A modal saying are you sure?
    onStartOver();
  }

  function myOnFinish() {
    onFinish(formData);
  }

  const startOverClass = startOverDestroysData? classes.actionStartOver : classes.actionPrimary;
  return (
    <div className={classes.buttonContainer}>
      {showStartOver && (
        <div className={classes.startOverContainer}>
          <Button className={startOverClass} onClick={myOnStartOver}>{intl.formatMessage({ id: startOverLabel })}</Button>
        </div>
      )}

      <div className={classes.actionContainer}>
        {(currentStep > 0) && showGoBack && (
          <Button className={classes.actionSecondary} onClick={myOnPrevious}>{intl.formatMessage({ id: 'OnboardingWizardGoBack' })}</Button>
        )}
        {showSkip && (
          <Button className={classes.actionSkip} variant="outlined" onClick={myOnSkip}>{intl.formatMessage({ id: 'OnboardingWizardSkip' })}</Button>
        )}
        {lastStep && showNext && (
          <Button className={classes.actionPrimary} disabled={!validForm} onClick={myOnFinish}>{intl.formatMessage({ id: finishLabel })}</Button>
        )}
        {!lastStep && showNext && (
          <Button className={classes.actionPrimary} disabled={!validForm}
                  onClick={myOnNext}>{intl.formatMessage({ id: 'OnboardingWizardContinue' })}</Button>
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
  startOverDestroysData: PropTypes.bool
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
};

export default StepButtons;
