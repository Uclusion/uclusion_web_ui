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
    showSkip,
    showGoBack,
    finishLabel,
  } = props;
  const intl = useIntl();
  const lastStep = currentStep === totalSteps;

  const finishKey = _.isEmpty(finishLabel) ? 'OnboardingWizardFinish' : finishLabel;

  function myOnNext () {
    onNext();
    nextStep();
  }

  function myOnSkip () {
    onSkip();
    nextStep();
  }

  return (
    <div>
      {(currentStep > 1) && showGoBack && (
        <Button onClick={previousStep}>{intl.formatMessage({ id: 'OnboardingWizardGoBack' })}</Button>
      )}
      {showSkip && (
        <Button onClick={myOnSkip}>{intl.formatMessage({ id: 'OnboardingWizardSkip' })}</Button>
      )}
      {lastStep && (
        <Button disabled={!validForm} onClick={myOnNext}>{intl.formatMessage({ id: finishKey })}</Button>
      )}
      {!lastStep && (
        <Button disabled={!validForm}
                onClick={myOnNext}>{intl.formatMessage({ id: 'OnboardingWizardContinue' })}</Button>
      )}
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
