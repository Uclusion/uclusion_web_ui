import { useIntl } from 'react-intl';
import EventIcon from '@material-ui/icons/Event';
import { Typography, Popover} from '@material-ui/core';
import { useState } from 'react';
import UsefulRelativeTime from '../TextFields/UseRelativeTime';
import _ from 'lodash';
import * as React from 'react';
import DatePicker from 'react-datepicker';
import { usePlanFormStyles } from './index';
import EditMarketButton from '../../pages/Dialog/EditMarketButton';
import { ACTION_BUTTON_COLOR } from '../Buttons/ButtonConstants';

export function DaysEstimate(props) {
  const { marketId, value, onChange, isAssigned } = props;
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

  const myClassName = classes.daysEstimation;
  const dueDate = value ? new Date(value) : undefined;

  function getDueText () {
    if (_.isEmpty(value)) {
      return (
        <Typography className={myClassName}>
          {intl.formatMessage({ id: 'missingEstimatedCompletion' })}
        </Typography>
      );
    }
    return (
      <Typography className={myClassName}>
        {intl.formatMessage({ id: 'estimatedCompletionToday' })} <UsefulRelativeTime value={dueDate}/>
      </Typography>
    );
  }

  // we're editing this, so show the date picker
  return (
    <div className={classes.daysEstimationContainer}>
      <EditMarketButton
        labelId="changeCompletionDate"
        marketId={marketId}
        onClick={openPopover}
        isDisabled={!isAssigned}
        icon={<EventIcon htmlColor={ACTION_BUTTON_COLOR} />}
      />
      {getDueText()}
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
