import React from 'react'
import PropTypes from 'prop-types'
import {
  makeStyles, Tooltip
} from '@material-ui/core'
import { useIntl } from 'react-intl'
import Chip from '@material-ui/core/Chip'
import WarningIcon from '@material-ui/icons/Warning'
import HourglassFullIcon from '@material-ui/icons/HourglassFull'


const useStyles = makeStyles(() => ({
  criticalStyle: {
    marginLeft: '0.5rem',
    color: '#ffffff',
    backgroundColor: '#E85757'
  },
  delayableStyle: {
    marginLeft: '0.5rem',
    backgroundColor: '#e6e969',
    color: '#ffffff'
  },
  iconStyle: {
    color: '#ffffff'
  }
}));

function NotificationCountChips(props) {
  const {
    id,
    criticalNotifications,
    delayableNotifications
  } = props;

  const classes = useStyles();
  const intl = useIntl();

  return (
    <>
      {criticalNotifications > 0 && (
        <Tooltip key={`tipcrit${id}`}
                 title={intl.formatMessage({ id: 'redNotificationCountExplanation' })}>
          <Chip component="span" icon={<WarningIcon className={classes.iconStyle}/>} label={`${criticalNotifications}`}
                size='small' className={classes.criticalStyle}/>
        </Tooltip>
      )}
      {delayableNotifications > 0 && (
        <Tooltip key={`tipdel${id}`}
                 title={intl.formatMessage({ id: 'yellowNotificationCountExplanation' })}>
          <Chip component="span" icon={<HourglassFullIcon className={classes.iconStyle}/>}
                label={`${delayableNotifications}`} size='small' className={classes.delayableStyle}/>
        </Tooltip>
      )}
    </>
  );
}

NotificationCountChips.propTypes = {
  id: PropTypes.string.isRequired,
  criticalNotifications: PropTypes.number,
  delayableNotifications: PropTypes.number,
};

NotificationCountChips.defaultProps = {
  criticalNotifications: 0,
  delayableNotifications: 0,
};

export default NotificationCountChips;
