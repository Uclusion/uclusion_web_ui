import React, { useContext, useEffect, useState } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { TourContext } from '../../contexts/TourContext/TourContext';
import {
  getCurrentStep,
  isTourCompleted,
  setCurrentStep,
  completeTour, isTourFamilyRunning
} from '../../contexts/TourContext/tourContextHelper';
import ReactJoyride from 'react-joyride';
import { getTourSequence } from './tourSequences';


function UclusionTour(props) {
  const {
    name,
    family,
    shouldRun,
    hidden,
    ...rest
  } = props;

  const [tourState, tourDispatch] = useContext(TourContext);

  const isCompleted = isTourCompleted(tourState, name);

  function tourCallback(state) {
    console.log(state);
    const {
      status,
      index,
      type,
      step,
    } = state;
    if (!isCompleted) {
      if (status === 'finished') {
        // the've finished, register complete
        console.log(`Tour ${name} is complete`);
        completeTour(tourDispatch, name);
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

  // Override close to next if we're not the last in the sequence
  function getLocale() {
    const sequence = getTourSequence(family);
    const last = _.last(sequence);
    if (last !== name) {
      return {
        ...defaultLocale,
        close: 'Next',
      };
    }
    return defaultLocale;
  }

  const ourStyles = {
    buttonNext: {
      backgroundColor: '#3f6b72',
      color: '#fff'
    },
  };

  const currentStep = getCurrentStep(tourState, name);
  const continuous = currentStep === 0;
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    const myTourFamlyActive = isTourFamilyRunning(tourState, family);
    console.log(`Tour family active ${myTourFamlyActive}`);
    const iCanRun = !hidden && myTourFamlyActive && shouldRun && !isCompleted;
    console.log(`I can run ${iCanRun}`);
    setRunTour(iCanRun);
    return () => {
    };
  }, [hidden, tourState, family, shouldRun, isCompleted]);

  if (!runTour) {
    return <React.Fragment/>;
  }


  return (
    <ReactJoyride
      styles={ourStyles}
      run={runTour}
      stepIndex={currentStep}
      locale={getLocale()}
      {...rest}
      callback={tourCallback}
      continuous={continuous}
      hideBackButton
    />
  );


}

UclusionTour.propTypes = {
  name: PropTypes.string.isRequired,
  family: PropTypes.string.isRequired,
  shouldRun: PropTypes.bool,
  hidden: PropTypes.bool,
};

UclusionTour.defaultProps = {
  shouldRun: true,
  hidden: false,
};

export default UclusionTour;
