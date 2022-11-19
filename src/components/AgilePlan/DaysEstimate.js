import { useIntl } from 'react-intl';
import EventIcon from '@material-ui/icons/Event';
import { Typography, Popover} from '@material-ui/core';
import { useState } from 'react';
import { isInPast } from '../../utils/timerUtils';
import UsefulRelativeTime from '../TextFields/UseRelativeTime';
import _ from 'lodash';
import * as React from 'react';
import DatePicker from 'react-datepicker';
import { usePlanFormStyles } from './index';
import EditMarketButton from '../../pages/Dialog/EditMarketButton';
import { ACTION_BUTTON_COLOR } from '../Buttons/ButtonConstants';

export function DaysEstimate(props) {
  const { marketId, value, onChange } = props;
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
  const dueDate = new Date(value);

  function getDueText () {
    if (isInPast(dueDate)) {
      return (
        <Typography className={myClassName}>
          {intl.formatMessage({ id: 'estimatedCompletionToday' })} <UsefulRelativeTime value={dueDate}/>
        </Typography>
      );
    }
    if (_.isEmpty(value)) {
      return (
        <Typography className={myClassName}>
          {intl.formatMessage({ id: 'missingEstimatedCompletion' })}
        </Typography>
      );
    }
    return (
      <Typography className={myClassName}>
        {intl.formatMessage({ id: 'planningEstimatedCompletion' })} {intl.formatDate(value)}
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
        icon={<EventIcon htmlColor={ACTION_BUTTON_COLOR} />}
      />
      {getDueText()}
      <Popover
        id="estimatedCompletionPopper"
        open={datePickerOpen}
        anchorEl={anchorEl}
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
