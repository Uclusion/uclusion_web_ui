import React, { useContext, useEffect, useState } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { TourContext } from '../../contexts/TourContext/TourContext';
import {
  isTourFamilyRunning,
  getCurrentStep,
  isTourCompleted,
  setCurrentStep,
  completeTour
} from '../../contexts/TourContext/tourContextHelper';
import ReactJoyride from 'react-joyride';
import { AccountUserContext } from '../../contexts/AccountUserContext/AccountUserContext';
import { updateUiPreferences } from '../../api/account';
import { accountUserRefresh } from '../../contexts/AccountUserContext/accountUserContextReducer';
import { getUiPreferences, userIsLoaded } from '../../contexts/AccountUserContext/accountUserContextHelper';


function UclusionTour(props) {
  const {
    name,
    family,
    shouldRun,
    hidden,
    ...rest
  } = props;

  const [tourState, tourDispatch] = useContext(TourContext);
  const [userState, userDispatch] = useContext(AccountUserContext)
  const isCompleted = isTourCompleted(tourState, name);
  const hasUser = userIsLoaded(userState)
  const userPreferences = getUiPreferences(userState) || {};
  const tourPreferences = userPreferences.tours || {};
  const { completedTours } = tourPreferences;
  const safeCompletedTours = _.isArray(completedTours)? completedTours : [];
  function storeTourCompleteInBackend(tourName){
    const newCompleted = [...safeCompletedTours, tourName];
    const newTourPreferences = {
      ...tourPreferences,
      completedTours: newCompleted,
    };
    const newPrefs = {
      ...userPreferences,
      tours: newTourPreferences,
    };
    updateUiPreferences(newPrefs)
      .then((result) => {
        const { user } = result;
        userDispatch(accountUserRefresh(user));
      });
  }

  function tourCallback(state) {
    const {
      status,
      index,
      type,
      step,
    } = state;
    if (!isCompleted) {
      if (status === 'finished') {
        // the've finished, register complete
        // console.log(`Tour ${name} is complete`);
        completeTour(tourDispatch, name);
        storeTourCompleteInBackend(family);
      }
      if (type === 'step:after') {
        setCurrentStep(tourDispatch, name, index + 1);
        if (step && step.onClose) {
          step.onClose();
        }
      }
    }
  }

  const defaultLocale = { back: 'Back', close: 'Close', last: 'Close', next: 'Next', skip: 'Skip' };

  const ourStyles = {
    buttonClose: {
      display: 'none'
    },
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
    const uiPrefCantRun = !hasUser || safeCompletedTours.includes(family);
    const myTourFamlyActive = isTourFamilyRunning(tourState, family);
    const iCanRun = !hidden && myTourFamlyActive && shouldRun && !isCompleted && !uiPrefCantRun;
    setRunTour(iCanRun);
    return () => {
    };
  }, [hasUser, safeCompletedTours, hidden, tourState, family, shouldRun, isCompleted]);

  if (!runTour) {
    return <React.Fragment/>;
  }


  return (
    <ReactJoyride
      styles={ourStyles}
      run={runTour}
      stepIndex={currentStep}
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
  family: PropTypes.string.isRequired,
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
