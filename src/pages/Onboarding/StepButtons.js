import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@material-ui/core';
import { useIntl } from 'react-intl';
import _ from 'lodash';

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
    showSkip,
    showGoBack,
    finishLabel,
    classes
  } = props;
  const intl = useIntl();
  const lastStep = currentStep === totalSteps - 1; //zero indexed

  const finishKey = _.isEmpty(finishLabel) ? 'OnboardingWizardFinish' : finishLabel;

  function myOnPrevious () {
    onPrevious();
    previousStep();
  }

  function myOnNext () {
    onNext();
    nextStep();
  }

  function myOnSkip () {
    onSkip();
    nextStep();
  }

  function myOnStartOver() {
    // TODO Pop A modal saying are you sure?
    onStartOver();
  }

  function myOnFinish() {
    onFinish();
  }

  return (
    <div className={classes.buttonContainer}>
      <div className={classes.startOverContainer}>
        <Button className={classes.actionStartOver} onClick={myOnStartOver}>{intl.formatMessage({ id: 'OnboardingWizardStartOver'})}</Button>
      </div>

      <div className={classes.actionContainer}>
        {(currentStep > 0) && showGoBack && (
          <Button className={classes.actionSecondary} onClick={myOnPrevious}>{intl.formatMessage({ id: 'OnboardingWizardGoBack' })}</Button>
        )}
        {showSkip && (
          <Button className={classes.actionSkip} variant="outlined" onClick={myOnSkip}>{intl.formatMessage({ id: 'OnboardingWizardSkip' })}</Button>
        )}
        {lastStep && (
          <Button className={classes.actionPrimary} disabled={!validForm} onClick={myOnFinish}>{intl.formatMessage({ id: finishKey })}</Button>
        )}
        {!lastStep && (
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
};
StepButtons.defaultProps = {
  onStartOver: () => {},
  previousStep: () => {},
  nextStep: () => {},
  onPrevious: () => {},
  onNext: () => {},
  onSkip: () => {},
  onFinish: () => {},
  totalSteps: 0,
  currentStep: 0,
  validForm: true,
  showSkip: false,
  showGoBack: true,
  finishLabel: '',
};

export default StepButtons;
