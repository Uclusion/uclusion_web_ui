import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { TourContext } from '../../contexts/TourContext/TourContext';
import {
  getCurrentStep,
  isTourCompleted,
  setCurrentStep,
  completeTour
} from '../../contexts/TourContext/tourContextHelper';
import ReactJoyride from 'react-joyride';


function UclusionTour(props) {
  const {
    name,
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

  const ourStyles = {
    buttonNext: {
      display: 'none',
    }
  };

  const runTour = !hidden && shouldRun; //&& !isCompleted;
  const currentStep = getCurrentStep(tourState, name);
  const continuous = currentStep === 0;
  if (!runTour) {
    return <React.Fragment/>;
  }


  return (
    <ReactJoyride
      styles={ourStyles}
      run={runTour}
      stepIndex={currentStep}
      {...rest}
      callback={tourCallback}
      continuous={continuous}
      hideBackButton
    />
  );


}

UclusionTour.propTypes = {
  name: PropTypes.string.isRequired,
  shouldRun: PropTypes.bool,
  hidden: PropTypes.bool,
};

UclusionTour.defaultProps = {
  shouldRun: true,
  hidden: false,
};

export default UclusionTour;
