import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import Slider from '@material-ui/core/Slider';

function ExpirationSelector(props) {

  const DAY_IN_MINUTES = 1440;
  const { onChange, value, valueLabelDisplay } = props;

  function createDaysOption(numDays) {
    const value = numDays * DAY_IN_MINUTES;
    /* const label = (numDays === 1)
       ? intl.formatMessage({ id: 'expirationSelectorOneDay' })
       : intl.formatMessage({ id: 'expirationSelectorXDays' }, { x: numDays });
     */
    return { value, numDays };
  }

  const options = [1, 2, 3, 5, 7, 10, 14].map((numDays) => createDaysOption(numDays));

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
};

ExpirationSelector.defaultProps = {
  onChange: () => {},
  valueLabelDisplay: 'auto',
};

export default injectIntl(ExpirationSelector);
