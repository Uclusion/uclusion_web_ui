import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import SpinningButton from '../../SpinBlocking/SpinningButton';
import { WizardStylesContext } from '../WizardStylesContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import InviteLinker from '../../../pages/Dialog/InviteLinker';

function WorkspaceStepButtons (props) {
  const {
    formData,
    onNext,
    onSkip,
    nextStep,
    finish,
    totalSteps,
    currentStep,
    validForm,
    showSkip,
    showNext,
    showLink,
    spinOnClick,
  } = props;
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const lastStep = currentStep === totalSteps - 1; //zero indexed


  async function nextState(nextFunction) {
    const nextReturn = nextFunction();
    const resolved = await Promise.resolve(nextReturn);
    if (lastStep) {
      return finish(resolved);
    }else{
      setOperationRunning(false);
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


  const nextLabel = 'OnboardingWizardContinue';

  return (
    <div className={classes.buttonContainer}>
      {showNext && (
        <SpinningButton id="OnboardingWizardNext" className={classes.actionPrimary} disabled={!validForm}
                        onClick={myNext} doSpin={spinOnClick}>
          {intl.formatMessage({ id: nextLabel })}
        </SpinningButton>
      )}

      {showLink && (
        <InviteLinker marketId={formData.marketId}/>
      )}

      <div className={classes.actionContainer}>
        {showSkip && (
          <SpinningButton id="OnboardingWizardSkip" className={classes.actionSkip} variant="text"
                          doSpin={spinOnClick} onClick={mySkip}>
            {intl.formatMessage({ id: 'OnboardingWizardSkip' })}
          </SpinningButton>
        )}
      </div>
    </div>
  );
}

WorkspaceStepButtons.propTypes = {
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
  finishLabel: PropTypes.string,
  finish: PropTypes.func,
  onFinish: PropTypes.func,
  startOverLabel: PropTypes.string,
  showNext: PropTypes.bool,
  showLink: PropTypes.bool,
  startOverDestroysData: PropTypes.bool,
  spinOnClick: PropTypes.bool,
};
WorkspaceStepButtons.defaultProps = {
  onNext: () => {},
  onSkip: () => {},
  onLink: () => {},
  nextStep: () => {},
  skipStep: () => {},
  finish: () => {},
  formData: {},
  totalSteps: 0,
  currentStep: 0,
  validForm: true,
  showSkip: false,
  showNext: true,
  spinOnClick: true,
};

export default WorkspaceStepButtons;
