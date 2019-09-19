import React from 'react';
import { injectIntl } from 'react-intl';
import Slider from '@material-ui/core/Slider';

function ExpirationSelector(props) {

  const DAY_IN_MINUTES = 1440;
  const { intl, onChange, value } = props;


  function createDaysOption(numDays) {
    const value = numDays * DAY_IN_MINUTES;
   /* const label = (numDays === 1)
      ? intl.formatMessage({ id: 'expirationSelectorOneDay' })
      : intl.formatMessage({ id: 'expirationSelectorXDays' }, { x: numDays });
    */
   const label = numDays;
    return { value, label };
  }


  const options = [1, 2, 3, 5, 7, 10, 14].map((numDays) => createDaysOption(numDays));

  // Sliders don't handle values the same way as every other input components, so we're
  // going to make it look like they do, so we can just drop it in
  function myOnChange(event, value) {
    const upperLevelObject = { target: { value: value } };
    onChange(upperLevelObject);
  }

  return (
    <Slider defaultValue={1440}
            value={value}
            marks={options}
            onChange={myOnChange}
            min={1440}
            max={20160}
            step={null}
            />

  );
}

export default injectIntl(ExpirationSelector);
