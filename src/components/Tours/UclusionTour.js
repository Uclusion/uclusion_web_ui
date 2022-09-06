import React, { useContext } from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'
import { TourContext } from '../../contexts/TourContext/TourContext'
import {
  completeTour,
  getCurrentStep,
  getTourFamily,
  isTourCompleted,
  isTourRunning,
  setCurrentStep
} from '../../contexts/TourContext/tourContextHelper'
import ReactJoyride, { ACTIONS } from 'react-joyride'
import { updateUiPreferences } from '../../api/account'
import { getUiPreferences } from '../../contexts/AccountContext/accountUserContextHelper'
import { accountUserRefresh } from '../../contexts/AccountContext/accountContextReducer'
import { AccountContext } from '../../contexts/AccountContext/AccountContext'

export function storeTourCompleteInBackend (tourName, userState, userDispatch) {
  const userPreferences = getUiPreferences(userState) || {}
  const tourPreferences = userPreferences.tours || {}
  const { completedTours } = tourPreferences
  const safeCompletedTours = _.isArray(completedTours) ? completedTours : []
  const newCompleted = [...safeCompletedTours, ...getTourFamily(tourName)]
  const newTourPreferences = {
    ...tourPreferences,
    completedTours: newCompleted,
  }
  const newPrefs = {
    ...userPreferences,
    tours: newTourPreferences,
  }
  updateUiPreferences(newPrefs)
    .then((result) => {
      const { user } = result;
      userDispatch(accountUserRefresh(user));
    });
}

function UclusionTour(props) {
  const {
    name,
    hidden,
    autoStart,
    ...rest
  } = props;

  const [tourState, tourDispatch] = useContext(TourContext);
  const [userState, userDispatch] = useContext(AccountContext);
  const isCompleted = isTourCompleted(tourState, name);
  const userPreferences = getUiPreferences(userState);
  const tourPreferences = (userPreferences || {}).tours || {};
  const { completedTours } = tourPreferences;
  const safeCompletedTours = _.isArray(completedTours) ? completedTours : [];
  const uiPrefCantRun = userPreferences === undefined || safeCompletedTours.includes(name);
  const tourActive = autoStart || isTourRunning(tourState, name);
  const runTour = !hidden && tourActive && !isCompleted && !uiPrefCantRun;
  const currentStep = getCurrentStep(tourState, name);

  function tourCallback(state) {
    const {
      status,
      index,
      type,
      step,
      action
    } = state;
    if (!isCompleted) {
      if (status === 'finished' || action === ACTIONS.CLOSE) {
        // the've finished, register complete
        // console.log(`Tour ${name} is complete`);
        completeTour(tourDispatch, name)
        storeTourCompleteInBackend(name, userState, userDispatch)
      }
      if (type === 'step:after') {
        setCurrentStep(tourDispatch, name, index + 1)
        if (step && step.onClose) {
          step.onClose()
        }
      }
    }
  }

  const defaultLocale = { back: 'Back', close: 'Close', last: 'Close', next: 'Next', skip: 'Skip' };

  const ourStyles = {
    buttonNext: {
      backgroundColor: '#2D9CDB',
      color: 'white',
      textTransform: 'unset',
      fontWeight: 'bold',
      lineHeight: 'normal',
      outline: 'None',
      '&:hover': {
        backgroundColor: '#2D9CDB'
      },
      '&:disabled': {
        color: 'white',
        backgroundColor: 'rgba(45, 156, 219, .6)'
      }
    },
  };

  if (!runTour) {
    return <React.Fragment/>;
  } else {
    console.info(`Starting tour for ${name}`);
  }


  return (
    <ReactJoyride
      styles={ourStyles}
      run={runTour}
      stepIndex={currentStep}
      showProgress={true}
      locale={defaultLocale}
      {...rest}
      callback={tourCallback}
      disableOverlayClose
      hideBackButton
    />
  );


}

UclusionTour.propTypes = {
  name: PropTypes.string.isRequired,
  hidden: PropTypes.bool,
  continuous: PropTypes.bool,
  hideBackButton: PropTypes.bool,
  autoStart: PropTypes.bool,
};

UclusionTour.defaultProps = {
  hidden: false,
  hideBackButton: true,
  continuous: true,
  autoStart: false
};

export default UclusionTour;
