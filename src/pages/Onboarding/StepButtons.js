import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@material-ui/core';
import { useIntl } from 'react-intl';
import _ from 'lodash';

function StepButtons (props) {
  const {
    previousStep,
    nextStep,
    totalSteps,
    currentStep,
    validForm,
    onNext,
    onSkip,
    onPrevious,
    showSkip,
    showGoBack,
    finishLabel,
    classes
  } = props;
  const intl = useIntl();
  const lastStep = currentStep === totalSteps;

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

  return (
    <div className={classes.buttonContainer}>
      <div className={classes.backContainer}>
        {(currentStep > 0) && showGoBack && (
          <Button className={classes.actionSecondary} onClick={myOnPrevious}>{intl.formatMessage({ id: 'OnboardingWizardGoBack' })}</Button>
        )}
      </div>
      <div className={classes.actionContainer}>
        {showSkip && (
          <Button className={classes.actionSkip} variant="outlined" onClick={myOnSkip}>{intl.formatMessage({ id: 'OnboardingWizardSkip' })}</Button>
        )}
        {lastStep && (
          <Button className={classes.actionPrimary} disabled={!validForm} onClick={myOnNext}>{intl.formatMessage({ id: finishKey })}</Button>
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
  onNext: PropTypes.func,
  onSkip: PropTypes.func,
  showSkip: PropTypes.bool,
  showGoBack: PropTypes.bool,
  finishLabel: PropTypes.string,
};
StepButtons.defaultProps = {
  previousStep: () => {},
  nextStep: () => {},
  onPrevious: () => {},
  onNext: () => {},
  onSkip: () => {},
  totalSteps: 0,
  currentStep: 0,
  validForm: true,
  showSkip: false,
  showGoBack: true,
  finishLabel: '',
};

export default StepButtons;
