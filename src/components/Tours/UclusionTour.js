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

  const isCompleted = isTourCompleted(tourState, name);
  function tourCallback(state) {
    const {
      lifecycle,
      index,
      type,
    } = state;
    if (lifecycle === 'complete' && !isCompleted) {
      // the've finished, register complete
      console.log(`Tour ${name} is complete`);
      //TODO, save the state here
    }
    if (type === 'step:after' && !isCompleted) {
     console.log('firng step after');
     console.log(state);
      //setCurrentStep(tourDispatch, name, index + 1);
    }
  }

  const ourStyles = {
    buttonNext: {
      display: 'none',
    }
  };

  const runTour = false; //shouldRun && !isCompleted;
  const currentStep = getCurrentStep(tourState, name);
  const continuous = currentStep === 0;
  console.log(`name: ${name}, currentStep: ${currentStep}, shouldRun ${shouldRun}`);
  console.log(props.steps[currentStep]);
  if (!runTour) {
    return <React.Fragment/>
  }


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
