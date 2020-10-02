import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import Slider from '@material-ui/core/Slider';

function ExpirationSelector(props) {

  const DAY_IN_MINUTES = 1440;
  const { onChange, value, valueLabelDisplay, id } = props;

  function createDaysOption(numDays) {
    const value = numDays * DAY_IN_MINUTES;
    return { value, label: numDays };
  }

  const options = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((numDays) => createDaysOption(numDays));

  // Sliders don't handle values the same way as every other input components, so we're
  // going to make it look like they do, so we can just drop it in
  function myOnChange(event, newValue) {
    // sliders propegate a storm of events, this only sends one when we change
    if (newValue !== value) {
      const upperLevelObject = { target: { value: newValue } };
      onChange(upperLevelObject);
    }
  }

  return (
    <Slider
      id={id}
      defaultValue={1440}
      value={value}
      marks={options}
      onChange={myOnChange}
      min={1440}
      max={20160}
      step={null}
      valueLabelDisplay={valueLabelDisplay}
      valueLabelFormat={(value) => Math.floor(value / 1440)}
    />

  );
}

ExpirationSelector.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.number.isRequired,
  valueLabelDisplay: PropTypes.string,
  id: PropTypes.string,
};

ExpirationSelector.defaultProps = {
  onChange: () => {},
  valueLabelDisplay: 'auto',
  id: undefined,
};

export default injectIntl(ExpirationSelector);
