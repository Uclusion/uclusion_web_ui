import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { TourContext } from '../../contexts/TourContext/TourContext';
import { isTourCompleted } from '../../contexts/TourContext/tourContextHelper';
import ReactJoyride from 'react-joyride';


function UclusionTour(props) {
  const {
    name,
    shouldRun,
    ...rest
  } = props;

  function tourCallback(state) {
    const { lifecycle } = state;
    if (lifecycle === 'complete') {
      // the've finished, register complete
      console.log(`Tour ${name} is complete`);
      //TODO, save the state here
    }
  }

  const ourStyles = {
    buttonNext: {
      display: 'none',
    }
  };

  const [tourState] = useContext(TourContext);
  const runTour = shouldRun && !isTourCompleted(tourState, name);
  return (
    <ReactJoyride
      styles={ourStyles}
      run={runTour}
      {...rest}
      callback={tourCallback}
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
