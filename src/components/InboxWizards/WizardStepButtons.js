import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import SpinningButton from '../SpinBlocking/SpinningButton';
import { wizardStyles } from './WizardStylesContext'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { scrollToElement } from '../../contexts/ScrollContext';

function WizardStepButtons(props) {
  const {
    formData,
    onNext,
    onOtherNext,
    nextStep,
    finish,
    onFinish,
    totalSteps,
    currentStep,
    validForm,
    showOtherNext,
    showNext,
    showTerminate,
    otherNextLabel,
    spinOnClick,
    otherSpinOnClick,
    terminateLabel,
    nextLabel,
    startOver
  } = props;
  const intl = useIntl();
  const classes = wizardStyles();
  const { parentElementId } = formData;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const lastStep = currentStep === totalSteps - 1; //zero indexed

  function onTerminate() {
    startOver();
    onFinish();
  }

  async function nextState(nextFunction) {
    const nextReturn = nextFunction();
    if (lastStep) {
      const resolved = await Promise.resolve(nextReturn);
      return finish(resolved);
    }else{
      setOperationRunning(false);
      nextStep();
    }
    if (nextReturn) {
      return nextReturn.then(() => {
        const item = document.getElementById(`workListItem${parentElementId}`);
        if (item) {
          scrollToElement(item);
        }
      });
    }
    const item = document.getElementById(`workListItem${parentElementId}`);
    if (item) {
      scrollToElement(item);
    }
  }

  async function myNext () {
    return nextState(onNext);
  }

  async function myOtherNext () {
    return nextState(onOtherNext);
  }

  return (
    <div className={classes.buttonContainer}>
      {showNext && (
        <SpinningButton id="OnboardingWizardNext" className={classes.actionPrimary} disabled={!validForm}
                        onClick={myNext} doSpin={spinOnClick}>
          {intl.formatMessage({ id: nextLabel })}
        </SpinningButton>
      )}

      <div className={classes.actionContainer}>
        {showOtherNext && (
          <SpinningButton id="OnboardingWizardOtherNext" className={classes.actionPrimary} disabled={!validForm}
                          doSpin={otherSpinOnClick} onClick={myOtherNext}>
            {intl.formatMessage({ id: otherNextLabel })}
          </SpinningButton>
        )}
      </div>
      <div className={classes.actionContainer}>
        {showTerminate && (
          <SpinningButton id="OnboardingWizardSkip" className={classes.actionSkip} variant="text"
                          doSpin={false} onClick={onTerminate}>
            {intl.formatMessage({ id: terminateLabel })}
          </SpinningButton>
        )}
      </div>
    </div>
  );
}

WizardStepButtons.propTypes = {
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
  terminateLabel: PropTypes.string,
  finish: PropTypes.func,
  onTerminate: PropTypes.func,
  showTerminate: PropTypes.bool,
  startOverLabel: PropTypes.string,
  showNext: PropTypes.bool,
  spinOnClick: PropTypes.bool,
  otherSpinOnClick: PropTypes.bool,
  nextLabel: PropTypes.string,
};
WizardStepButtons.defaultProps = {
  onNext: () => {},
  onSkip: () => {},
  onLink: () => {},
  nextStep: () => {},
  skipStep: () => {},
  onTerminate: () => {},
  finish: () => {},
  formData: {},
  totalSteps: 0,
  currentStep: 0,
  validForm: true,
  showSkip: false,
  showNext: true,
  showTerminate: false,
  spinOnClick: true,
  otherSpinOnClick: true,
  nextLabel: 'OnboardingWizardContinue',
};

export default WizardStepButtons;
