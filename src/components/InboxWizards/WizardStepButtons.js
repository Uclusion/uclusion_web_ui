import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import SpinningButton from '../SpinBlocking/SpinningButton';
import { wizardStyles } from './WizardStylesContext'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { scrollToElement } from '../../contexts/ScrollContext';
import { ChevronRight } from '@material-ui/icons';

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
    onOtherNextDoAdvance,
    otherNextValid,
    isFinal,
    isOtherFinal
  } = props;
  const intl = useIntl();
  const classes = wizardStyles();
  const { parentElementId } = formData;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const lastStep = currentStep === totalSteps - 1; //zero indexed

  function onTerminate() {
    startOver();
    if (onFinish) {
      onFinish();
    }
  }

  async function nextState(nextFunction, isOtherNext=false) {
    const nextReturn = nextFunction();
    const doAdvance = (!isOtherNext && onNextDoAdvance)||(isOtherNext && onOtherNextDoAdvance);
    if (doAdvance) {
      if (lastStep) {
        const resolved = await Promise.resolve(nextReturn);
        return finish(resolved);
      }
      nextStep();
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

  const nextIsDisabled = !validForm || nextDisabled;
  const otherDisabled = !validForm && !otherNextValid;
  const nextClass = isFinal || nextIsDisabled ? classes.actionPrimary : classes.actionNext;
  const nextOtherClass = isOtherFinal === undefined ? nextClass :
    ((isOtherFinal || otherDisabled) ? classes.actionPrimary : classes.actionNext);
  const isNextNext = nextClass === classes.actionNext;
  const isOtherNextNext = nextOtherClass === classes.actionNext;
  return (
    <div className={classes.buttonContainer}>
      {showNext && (
        <SpinningButton id="OnboardingWizardNext" className={nextClass} disabled={nextIsDisabled} onClick={myNext}
                        endIcon={isNextNext ? ChevronRight : undefined} iconColor="black" doSpin={spinOnClick}>
          {intl.formatMessage({ id: nextLabel })}
        </SpinningButton>
      )}

      <div className={classes.actionContainer}>
        {showOtherNext && (
          <SpinningButton id="OnboardingWizardOtherNext" className={nextOtherClass} disabled={otherDisabled}
                          endIcon={isOtherNextNext ? ChevronRight : undefined} iconColor="black"
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
  onOtherNextDoAdvance: PropTypes.bool,
  otherNextValid: PropTypes.bool,
  isFinal: PropTypes.bool,
  isOtherFinal: PropTypes.bool
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
  otherNextValid: false,
  nextDisabled: false,
  showSkip: false,
  showNext: true,
  showTerminate: false,
  spinOnClick: true,
  otherSpinOnClick: true,
  terminateSpinOnClick: false,
  nextLabel: 'OnboardingWizardContinue',
  onNextDoAdvance: true,
  onOtherNextDoAdvance: true,
  isFinal: true
};

export default WizardStepButtons;
