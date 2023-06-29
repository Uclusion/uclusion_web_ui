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
    startOver,
    nextDisabled,
    terminateSpinOnClick,
    onNextDoAdvance,
    onOtherNextDoAdvance
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

  async function nextState(nextFunction, isOtherNext=false) {
    const nextReturn = nextFunction();
    if (lastStep) {
      const resolved = await Promise.resolve(nextReturn);
      return finish(resolved);
    } else {
      if ((!isOtherNext && onNextDoAdvance)||(isOtherNext && onOtherNextDoAdvance)) {
        nextStep();
      }
    }
    if (nextReturn) {
      return nextReturn.then(() => {
        setOperationRunning(false);
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
    return nextState(onOtherNext, true);
  }

  return (
    <div className={classes.buttonContainer}>
      {showNext && (
        <SpinningButton id="OnboardingWizardNext" className={classes.actionPrimary}
                        disabled={!validForm || nextDisabled}
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
                          doSpin={terminateSpinOnClick} onClick={onTerminate}>
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
  onOtherNext: PropTypes.func,
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
  nextDisabled: PropTypes.bool,
  terminateSpinOnClick: PropTypes.bool,
  onNextDoAdvance: PropTypes.bool,
  onOtherNextDoAdvance: PropTypes.bool
};
WizardStepButtons.defaultProps = {
  onNext: () => {},
  onOtherNext: () => {},
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
  nextDisabled: false,
  showSkip: false,
  showNext: true,
  showTerminate: false,
  spinOnClick: true,
  otherSpinOnClick: true,
  terminateSpinOnClick: false,
  nextLabel: 'OnboardingWizardContinue',
  onNextDoAdvance: true,
  onOtherNextDoAdvance: true
};

export default WizardStepButtons;
