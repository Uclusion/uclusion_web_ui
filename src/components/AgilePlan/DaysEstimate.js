import { useIntl } from 'react-intl';
import EventIcon from '@material-ui/icons/Event';
import { Popover, Typography } from '@material-ui/core';
import * as React from 'react';
import { useState } from 'react';
import UsefulRelativeTime from '../TextFields/UseRelativeTime';
import _ from 'lodash';
import DatePicker from 'react-datepicker';
import { usePlanFormStyles } from './index';
import SpinningIconLabelButton from '../Buttons/SpinningIconLabelButton';

export function DaysEstimate(props) {
  const { value, onChange, isAssigned } = props;
  const classes = usePlanFormStyles();
  const intl = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);

  function handleDateChange (date) {
    setAnchorEl(null);
    onChange(date);
  }

  const openPopover = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const datePickerOpen = Boolean(anchorEl);
  const dueDate = value ? new Date(value) : undefined;

  function getDueText () {
    if (_.isEmpty(value)) {
      return (
        <Typography style={{marginRight: '0.5rem'}}>
          {intl.formatMessage({ id: 'missingEstimatedCompletion' })}
        </Typography>
      );
    }
    return (
      <Typography style={{marginRight: '0.5rem'}}>
        {intl.formatMessage({ id: 'estimatedCompletionToday' })} <UsefulRelativeTime value={dueDate}/>
      </Typography>
    );
  }

  // we're editing this, so show the date picker
  return (
    <div className={classes.daysEstimationContainer}>
      {getDueText()}
      <SpinningIconLabelButton
        icon={EventIcon}
        iconOnly
        disabled={!isAssigned}
        doSpin={false}
        id='changeCompletionDate'
        whiteBackground
        onClick={openPopover}
      />
      <Popover
        id="estimatedCompletionPopper"
        open={datePickerOpen}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
      >
        <DatePicker
          placeholderText={intl.formatMessage({ id: "selectDate" })}
          selected={dueDate}
          inline
          onChange={handleDateChange}
          minDate={new Date()}
        />
      </Popover>
    </div>

  );
}
