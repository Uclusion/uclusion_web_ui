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
  chipStyle: {
    marginLeft: '0.5rem',
    color: 'black',
    backgroundColor: '#ffffff',
    paddingBottom: '0.3rem'
  },
  chipStyleNoMargin: {
    color: 'black',
    backgroundColor: '#ffffff',
    paddingBottom: '0.3rem'
  },
  iconYellow: {
    color: '#e6e969'
  },
  iconRed: {
    color: '#E85757'
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
          <Chip component="span" icon={<WarningIcon className={classes.iconRed}/>} label={`${criticalNotifications}`}
                size='small' className={classes.chipStyle}/>
        </Tooltip>
      )}
      {delayableNotifications > 0 && (
        <Tooltip key={`tipdel${id}`}
                 title={intl.formatMessage({ id: 'yellowNotificationCountExplanation' })}>
          <Chip component="span" icon={<HourglassFullIcon className={classes.iconYellow}/>}
                label={`${delayableNotifications}`} size='small' className={classes.chipStyleNoMargin}/>
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
