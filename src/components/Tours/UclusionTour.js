import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { TourContext } from '../../contexts/TourContext/TourContext';
import { getCurrentStep, isTourCompleted, setCurrentStep } from '../../contexts/TourContext/tourContextHelper';
import ReactJoyride from 'react-joyride';


function UclusionTour(props) {
  const {
    name,
    shouldRun,
    ...rest
  } = props;

  const [tourState, tourDispatch] = useContext(TourContext);


  function tourCallback(state) {
    const {
      lifecycle,
      index,
      type,
    } = state;
    console.log(state);
    if (lifecycle === 'complete') {
      // the've finished, register complete
      console.log(`Tour ${name} is complete`);
      //TODO, save the state here
    }
    if (type === 'step:after') {
      setCurrentStep(tourDispatch, name, index + 1);
    }
  }

  const ourStyles = {
    buttonNext: {
      display: 'none',
    }
  };

  const runTour = shouldRun && !isTourCompleted(tourState, name);
  const currentStep = getCurrentStep(tourState, name);
  const continuous = currentStep === 0;
  return (
    <ReactJoyride
      styles={ourStyles}
      run={runTour}
      stepIndex={currentStep}
      {...rest}
      callback={tourCallback}
      continuous={continuous}
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
