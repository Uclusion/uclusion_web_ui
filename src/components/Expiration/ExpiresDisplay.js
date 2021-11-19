import React, { useEffect, useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import * as moment from 'moment'
import { useIntl } from 'react-intl'
import { Tooltip } from '@material-ui/core'
import ExpiredDisplay from './ExpiredDisplay'

const ONE_MINUTE = 60000;
const THIRTY_MINUTES = 1800000;
const ONE_HOUR = 36000000;


const useStyles = makeStyles((theme) => ({
  countdownWrapper: {
    display: 'flex',
  },

  countdownItem: {
    color: theme.palette.dark,
    fontSize: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    lineHeight: '30px',
    margin: '10px',
    paddingTop: '10px',
    position: 'relative',
    width: '100px',
    height: '100px',
  },

  countdownItemSpan: {
    fontSize: 12,
    fontWeight: '600',
  },

  countdownSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100px',
    height: '100px',
  },
}));

// From StackOverflow: https://stackoverflow.com/questions/5736398/how-to-calculate-the-svg-path-for-an-arc-of-a-circle

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(' ');
}

function ExpiresDisplay(props) {
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
  const consumedDegrees = (consumedRatio >= 1) ? 359.9 : (consumedRatio * 359.9);

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
          <span className={classes.countdownItemSpan}>{intl.formatMessage({ id: 'daysLeft' })}</span>
        </React.Fragment>
      );
    }
    if (hoursRemaining > 0) {
      return (
      <React.Fragment>
        {hoursRemaining}{minutesRemaining > 0 && '+'}
        <span className={classes.countdownItemSpan}>{intl.formatMessage({ id: 'hoursLeft' })}</span>
      </React.Fragment>
      );
    }
    if (minutesRemaining > 0) {
      return (
        <React.Fragment>
          {minutesRemaining}
          <span className={classes.countdownItemSpan}>{intl.formatMessage({ id: 'minutesLeft' })}</span>
        </React.Fragment>
      );
    }

  }
  const shouldDisplay = daysRemaining > 0 || hoursRemaining > 0 || minutesRemaining > 0;

  return (
    <>
      {shouldDisplay && (
        <Tooltip
          title={intl.formatMessage({ id: 'dialogExpiresLabel' })}
        >
          <div
            className={classes.countdownItem}
          >
            <svg className={classes.countdownSvg}>
              <path
                fill="none"
                stroke="#3F6B72"
                strokeWidth="4"
                d={describeArc(50, 50, 48, 0, 359.9)}
              />
              <path
                fill="none"
                stroke="#ca2828"
                strokeWidth="4"
                d={describeArc(50, 50, 48, 0, consumedDegrees)}
              />
            </svg>
              {getDisplayText()}
          </div>
        </Tooltip>
      )}
      {!shouldDisplay && (
        <ExpiredDisplay expiresDate={new Date()} />
      )}
    </>
  );
}

ExpiresDisplay.propTypes = {
  onClick: PropTypes.func,
  expirationMinutes: PropTypes.number.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  createdAt: PropTypes.object.isRequired,
};

ExpiresDisplay.defaultProps = {
  onClick: () => {},
};

export default ExpiresDisplay;
