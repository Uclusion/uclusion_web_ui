import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import SpinningButton from '../SpinBlocking/SpinningButton';
import { WizardStylesContext } from './WizardStylesContext';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import WorkspaceInviteLinker from '../../pages/Home/WorkspaceInviteLinker'
import { ChevronRight } from '@material-ui/icons';
import EditIcon from '@material-ui/icons/Edit';

function WizardStepButtons (props) {
  const {
    formData,
    onNext,
    onSkip,
    nextStep,
    finish,
    onTerminate,
    totalSteps,
    currentStep,
    validForm,
    showSkip,
    showNext,
    showTerminate,
    showLink,
    spinOnClick,
    otherSpinOnClick,
    terminateLabel,
    nextLabel,
    showOtherNext,
    otherNextLabel,
    onOtherNext,
    marketToken,
    onOtherDoAdvance,
    skipNextStep,
    onIncrement,
    onNextDoAdvance,
    terminateSpinOnClick,
    onNextSkipStep,
    isFinal,
    isOtherFinal,
    otherNextValid,
    otherNextShowEdit,
    focus
  } = props;
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const lastStep = currentStep === totalSteps - 1; //zero indexed


  async function nextState(nextFunction, isOther) {
    const nextReturn = nextFunction();
    const resolved = await Promise.resolve(nextReturn);
    const isAdvance = (isOther && onOtherDoAdvance)||(!isOther && onNextDoAdvance);
    if (lastStep && isAdvance) {
      return finish(resolved);
    } else {
      setOperationRunning(false);
      if (onIncrement) {
        onIncrement(resolved);
      } else {
        if (isAdvance) {
          if (skipNextStep || (!isOther && onNextSkipStep)) {
            nextStep(2);
          } else {
            nextStep();
          }
        }
      }
    }
    return resolved;
  }

  async function myNext () {
    return nextState(onNext);
  }

  async function myOtherNext () {
    return nextState(onOtherNext, true);
  }

  async function mySkip () {
    return nextState(onSkip);
  }

  const nextClass = isFinal || !validForm ? classes.actionPrimary : classes.actionNext;
  const nextOtherClass = isOtherFinal === undefined ? nextClass :
    (isOtherFinal || !validForm ? classes.actionPrimary : classes.actionNext);
  const isNextNext = nextClass === classes.actionNext;
  const isOtherNextNext = nextOtherClass === classes.actionNext;
  const otherDisabled = !validForm && !otherNextValid;
  return (
    <div className={classes.buttonContainer}>
      {showNext && (
        <SpinningButton id="OnboardingWizardNext" className={nextClass} disabled={!validForm} focus={focus}
                        endIcon={isNextNext ? ChevronRight : undefined} iconColor="black" onClick={myNext}
                        doSpin={spinOnClick}>
          {intl.formatMessage({ id: nextLabel })}
        </SpinningButton>
      )}

      <div className={classes.actionContainer}>
        {showOtherNext && (
          <SpinningButton id="OnboardingWizardOtherNext" className={nextOtherClass} disabled={otherDisabled}
                          endIcon={otherNextShowEdit ? EditIcon : (isOtherNextNext ? ChevronRight : undefined)}
                          iconColor={isOtherNextNext ? 'black' : 'white'}
                          doSpin={otherSpinOnClick} onClick={myOtherNext}>
            {intl.formatMessage({ id: otherNextLabel })}
          </SpinningButton>
        )}
      </div>

      {showLink && (
        <WorkspaceInviteLinker marketToken={marketToken || formData.marketToken}/>
      )}

      {showSkip && (
        <div className={classes.actionContainer}>
            <SpinningButton id="OnboardingWizardSkip" className={classes.actionSkip} variant="text"
                            doSpin={false} onClick={mySkip}>
              {intl.formatMessage({ id: 'OnboardingWizardSkip' })}
            </SpinningButton>
        </div>
      )}

      <div className={classes.actionContainer}>
        {showTerminate && (
          <SpinningButton id="OnboardingWizardTerminate" className={classes.actionSkip} variant="text"
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
  previousStep: PropTypes.func,
  nextStep: PropTypes.func,
  onOtherNext: PropTypes.func,
  onSkip: PropTypes.func,
  totalSteps: PropTypes.number,
  currentStep: PropTypes.number,
  validForm: PropTypes.bool,
  startOver: PropTypes.func,
  showSkip: PropTypes.bool,
  terminateLabel: PropTypes.string,
  finish: PropTypes.func,
  onTerminate: PropTypes.func,
  onIncrement: PropTypes.func,
  showTerminate: PropTypes.bool,
  startOverLabel: PropTypes.string,
  showNext: PropTypes.bool,
  showLink: PropTypes.bool,
  startOverDestroysData: PropTypes.bool,
  spinOnClick: PropTypes.bool,
  otherSpinOnClick: PropTypes.bool,
  onOtherDoAdvance: PropTypes.bool,
  nextLabel: PropTypes.string,
  onNextDoAdvance: PropTypes.bool,
  terminateSpinOnClick: PropTypes.bool,
  onNextSkipStep: PropTypes.bool,
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
  showSkip: false,
  showNext: true,
  showTerminate: false,
  spinOnClick: true,
  otherSpinOnClick: true,
  onOtherDoAdvance: true,
  onNextDoAdvance: true,
  nextLabel: 'OnboardingWizardContinue',
  terminateSpinOnClick: false,
  onNextSkipStep: false,
  isFinal: true,
};

export default WizardStepButtons;
