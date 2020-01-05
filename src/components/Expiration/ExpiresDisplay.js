import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import * as moment from 'moment';
import { useIntl } from 'react-intl';

const ONE_MINUTE = 60000;
const THIRTY_MINUTES = 1800000;
const ONE_HOUR = 36000000;


const useStyles = makeStyles((theme) => ({
  countdownWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
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

// From StackOverflow: https://stackoverflow.com/questions/10756313/javascript-jquery-map-a-range-of-numbers-to-another-range-of-numbers

function mapNumber(number, inMin, inMax, outMin, outMax) {
  return (
    ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
  );
}

function ExpiresDisplay(props) {
  const classes = useStyles();
  const intl = useIntl();
  const { createdAt, expirationMinutes } = props;
  const [now, setNow] = useState(new Date());
  const expiresDurationMillis = expirationMinutes * 60000;
  const expiresDuration = moment.duration(expiresDurationMillis);
  const expiresMillis = createdAt.getTime() + expiresDurationMillis;
  const diffMillis = expiresMillis - now.getTime();
  const diff = moment.duration(diffMillis);

  const daysRemaining = diff.days();
  const hoursRemaining = diff.hours();
  const minutesRemaining = diff.minutes();
  const updateInterval = (daysRemaining > 0) ? ONE_HOUR : (hoursRemaining > 1)? THIRTY_MINUTES : ONE_MINUTE;


  // Mapping the date values to radius values
  const daysRadius = mapNumber(daysRemaining, expiresDuration.days(), 0, 0, 360);
  const hoursRadius = mapNumber(hoursRemaining, 24, 0, 0, 360);
  const minutesRadius = mapNumber(minutesRemaining, 60, 0, 0, 360);

  useEffect(() => {
    const timeOut = setTimeout(() => {
      setNow(new Date());
    }, updateInterval);
    return () => clearTimeout(timeOut);
  }, [now]);

  return (
    <div className={classes.countdownWrapper}>
      {daysRemaining > 0 && (
        <div className={classes.countdownItem}>
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
              d={describeArc(50, 50, 48, 0, daysRadius)}
            />
          </svg>
          {daysRemaining}
          <span className={classes.countdownItemSpan}>{intl.formatMessage({ id: 'daysLeft' })}</span>
        </div>
      )}
      {daysRemaining === 0 && hoursRemaining > 0 && (
        <div className={classes.countdownItem}>
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
              d={describeArc(50, 50, 48, 0, hoursRadius)}
            />
          </svg>
          {hoursRemaining}
          <span className={classes.countdownItemSpan}>{intl.formatMessage({ id: 'hoursLeft' })}</span>
        </div>
      )}
      {daysRemaining === 0 && hoursRemaining === 0 && minutesRemaining >= 0 && (
        <div className={classes.countdownItem}>
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
              d={describeArc(50, 50, 48, 0, minutesRadius)}
            />
          </svg>
          {minutesRemaining}
          <span className={classes.countdownItemSpan}>{intl.formatMessage({ id: 'minutesLeft' })}</span>
        </div>
      )}

    </div>
  );
}

ExpiresDisplay.propTypes = {
  expirationMinutes: PropTypes.number.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  createdAt: PropTypes.object.isRequired,
};

export default ExpiresDisplay;
