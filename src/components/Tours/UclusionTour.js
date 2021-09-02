import React, { useContext, useEffect, useState } from 'react'
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
import { AccountUserContext } from '../../contexts/AccountUserContext/AccountUserContext'
import { updateUiPreferences } from '../../api/account'
import { accountUserRefresh } from '../../contexts/AccountUserContext/accountUserContextReducer'
import { getUiPreferences, userIsLoaded } from '../../contexts/AccountUserContext/accountUserContextHelper'

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
    shouldRun,
    hidden,
    ...rest
  } = props;

  const [tourState, tourDispatch] = useContext(TourContext);
  const [userState, userDispatch] = useContext(AccountUserContext)
  const isCompleted = isTourCompleted(tourState, name)
  const hasUser = userIsLoaded(userState)

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

  const currentStep = getCurrentStep(tourState, name);
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    const userPreferences = getUiPreferences(userState) || {}
    const tourPreferences = userPreferences.tours || {}
    const { completedTours } = tourPreferences
    const safeCompletedTours = _.isArray(completedTours) ? completedTours : []
    const uiPrefCantRun = !hasUser || safeCompletedTours.includes(name)
    const tourActive = isTourRunning(tourState, name)
    const iCanRun = !hidden && shouldRun && tourActive && !isCompleted && !uiPrefCantRun
    setRunTour(iCanRun)
    return () => {
    }
  }, [hasUser, userState, hidden, tourState, shouldRun, isCompleted, name]);
  if (!runTour) {
    return <React.Fragment/>;
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
  shouldRun: PropTypes.bool,
  hidden: PropTypes.bool,
  continuous: PropTypes.bool,
  hideBackButton: PropTypes.bool,
};

UclusionTour.defaultProps = {
  shouldRun: true,
  hidden: false,
  hideBackButton: true,
  continuous: true,
};

export default UclusionTour;
