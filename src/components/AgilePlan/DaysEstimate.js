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
import { formInboxItemLink, navigate } from '../../utils/marketIdPathFunctions';
import { dehighlightMessage } from '../../contexts/NotificationsContext/notificationsContextHelper';
import TooltipIconButton from '../Buttons/TooltipIconButton';
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';
import { Notifications } from '@material-ui/icons';
import { useButtonColors } from '../Buttons/ButtonConstants';

export function DaysEstimate(props) {
  const { value, onChange, isAssigned, estimateMessage, messagesDispatch } = props;
  const classes = usePlanFormStyles();
  const intl = useIntl();
  const history = useHistory();
  const [anchorEl, setAnchorEl] = useState(null);
  const { warningColor } = useButtonColors();

  function handleDateChange (date) {
    setAnchorEl(null);
    onChange(date);
  }

  const openPopover = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const datePickerOpen = Boolean(anchorEl);
  const dueDate = value ? new Date(value) : undefined;
  const overDue = dueDate && new Date() > dueDate;

  function getDueText () {
    if (estimateMessage) {
      return (
        <TooltipIconButton
          marginRight='1rem'
          marginTop='0.15rem'
          onClick={() => {
            dehighlightMessage(estimateMessage, messagesDispatch);
            navigate(history, formInboxItemLink(estimateMessage));
          }}
          icon={<Notifications fontSize='small' 
            htmlColor={estimateMessage.is_highlighted ? warningColor : undefined} />}
          size='small'
          translationId='messagePresentComment'
        />
      );
    }
    if (_.isEmpty(value)) {
      return (
        <Typography style={{marginRight: '0.5rem', marginTop: '0.3rem'}}>
          {intl.formatMessage({ id: 'missingEstimatedCompletion' })}
        </Typography>
      );
    }
    return (
      <Typography style={{marginRight: '0.5rem', color: overDue ? 'red': undefined, marginTop: '0.3rem'}}>
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
