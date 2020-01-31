import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { TourContext } from '../../contexts/TourContext/TourContext';
import {
  completeTour,
  getCurrentStep,
  isTourCompleted,
  setCurrentStep
} from '../../contexts/TourContext/tourContextHelper';
import ReactJoyride from 'react-joyride';


function UclusionTour(props) {
  const {
    name,
    shouldRun,
    ...rest
  } = props;

  const [tourState, tourDispatch] = useContext(TourContext);

  const isCompleted = isTourCompleted(tourState, name);

  function tourCallback(state) {
    console.log(state);
    const {
      lifecycle,
      index,
      type,
    } = state;
    if (!isCompleted) {
      if (lifecycle === 'complete') {
        // the've finished, register complete
        console.log(`Tour ${name} is complete`);
        //completeTour(tourDispatch, name);
      }
      if (type === 'step:after') {
        setCurrentStep(tourDispatch, name, index + 1);
      }
    }
  }

  const ourStyles = {
    buttonNext: {
      display: 'none',
    }
  };

  const runTour = shouldRun && !isCompleted;
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
};

UclusionTour.defaultProps = {
  shouldRun: true,
};

export default UclusionTour;
