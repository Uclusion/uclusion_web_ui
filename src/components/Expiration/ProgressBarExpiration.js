import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import * as moment from 'moment';
import { useIntl } from 'react-intl';
import { Tooltip, LinearProgress } from '@material-ui/core'

const ONE_MINUTE = 60000;
const THIRTY_MINUTES = 1800000;
const ONE_HOUR = 36000000;


const useStyles = makeStyles((theme) => ({
   runningOut: {
    borderRadius: '8px',
    height: '8px',
    transform: 'rotate(270deg)',
    width: '4rem',
    backgroundColor: 'rgb(232, 232, 232);',
    '&>div': {
      backgroundColor: 'red'
    }
  },
  stillTime: {
    borderRadius: '8px',
    height: '8px',
    transform: 'rotate(270deg)',
    width: '4rem',
    backgroundColor: 'rgb(232, 232, 232);',
    '&>div': {
      backgroundColor: 'green'
    },
    [theme.breakpoints.down('sm')]: {
      width: '8rem',
      position: 'relative',
      left: '-55px'

    },

  }
}));

function ExpiresDisplayBar(props) {
  const classes = useStyles();
  const intl = useIntl();
  const { createdAt, expirationMinutes } = props;
  const [now, setNow] = useState(new Date());
  const expiresDurationMillis = expirationMinutes * 60000;
  const createdAtMillis = createdAt.getTime();
  const expiresMillis = createdAtMillis + expiresDurationMillis;
  const nowMillis = now.getTime();
  const remainingMillis = expiresMillis - nowMillis;
  const consumedMillis = nowMillis - createdAtMillis;
  const remaining = moment.duration(remainingMillis);

  const daysRemaining = remaining.days();
  const hoursRemaining = remaining.hours();
  const minutesRemaining = remaining.minutes();

  const updateInterval = (daysRemaining > 0) ? ONE_HOUR : (hoursRemaining > 1) ? THIRTY_MINUTES : ONE_MINUTE;

  const consumedRatio = (consumedMillis / expiresDurationMillis);
  
  const barValue = 100 - (consumedRatio * 100);
  
  useEffect(() => {
    const timeOut = setTimeout(() => {
      setNow(new Date());
    }, updateInterval);
    return () => clearTimeout(timeOut);
  }, [now, updateInterval]);


  function getDisplayText() {
    if (daysRemaining > 0) {
      return (
        <React.Fragment>
          {daysRemaining}{((hoursRemaining > 0) || (minutesRemaining > 0) ) && '+'}
          <span className={classes.countdownItemSpan}> {intl.formatMessage({ id: 'daysLeft' })}</span>
        </React.Fragment>
      );
    }
    if (hoursRemaining > 0) {
      return (
      <React.Fragment>
        {hoursRemaining}{minutesRemaining > 0 && '+'}
        <span className={classes.countdownItemSpan}> {intl.formatMessage({ id: 'hoursLeft' })}</span>
      </React.Fragment>
      );
    }
    if (minutesRemaining > 0) {
      return (
        <React.Fragment>
          {minutesRemaining}
          <span className={classes.countdownItemSpan}> {intl.formatMessage({ id: 'minutesLeft' })}</span>
        </React.Fragment>
      );
    }

  }
  const shouldDisplay = daysRemaining > 0 || hoursRemaining > 0 || minutesRemaining > 0;

  return (
    <div className={classes.countdownWrapper}>
      {shouldDisplay &&
        <Tooltip
        title={getDisplayText()}
        >
          <LinearProgress variant="determinate" value={barValue} className={barValue > 50 ? classes.stillTime : classes.runningOut}></LinearProgress>
        </Tooltip>
      }
    </div>
  );
}

ExpiresDisplayBar.propTypes = {
  onClick: PropTypes.func,
  expirationMinutes: PropTypes.number.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  createdAt: PropTypes.object.isRequired,
};

ExpiresDisplayBar.defaultProps = {
  onClick: () => {},
};

export default ExpiresDisplayBar;
