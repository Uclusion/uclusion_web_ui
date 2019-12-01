import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import * as moment from 'moment';
import { useIntl } from 'react-intl';

const useStyles = makeStyles((theme) => ({
  countdownWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },

  countdownItem: {
    color: theme.palette.dark,
    fontSize: '40px',
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
    fontSize: '12px',
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
  const { value, createdAt } = props;
  const then = moment(createdAt);
  const now = moment();
  const diff = moment.duration(now - then);
  // eslint-disable-next-line new-cap
  const countdown = new moment.duration(value);
  const days = diff.days();
  const hours = diff.hours();
  const minutes = diff.minutes();
  const daysRemaining = countdown.days() - days;
  const hoursRemaining = countdown.hours() - hours;
  const minutesRemaining = countdown.minutes() - minutes;
  // Mapping the date values to radius values
  const daysRadius = mapNumber(daysRemaining, countdown.days(), 0, 0, 360);
  const hoursRadius = mapNumber(hoursRemaining, countdown.hours(), 0, 0, 360);
  const minutesRadius = mapNumber(minutesRemaining, countdown.minutes(), 0, 0, 360);

  return (
    <div className={classes.countdownWrapper}>
      {daysRemaining > 0 && (
        <div className={classes.countdownItem}>
          <svg className={classes.countdownSvg}>
            <path
              fill="none"
              stroke="#333"
              strokeWidth="4"
              d={describeArc(50, 50, 48, 0, daysRadius)}
            />
          </svg>
          {daysRemaining}
          <span className={classes.countdownItemSpan}>{intl.formatMessage({ id: 'days' })}</span>
        </div>
      )}
      {daysRemaining <= 0 && hoursRemaining > 0 && (
        <div className={classes.countdownItem}>
          <svg className={classes.countdownSvg}>
            <path
              fill="none"
              stroke="#333"
              strokeWidth="4"
              d={describeArc(50, 50, 48, 0, hoursRadius)}
            />
          </svg>
          {hoursRemaining}
          <span className={classes.countdownItemSpan}>{intl.formatMessage({ id: 'hours' })}</span>
        </div>
      )}
      {daysRemaining <= 0 && hoursRemaining <= 0 && minutesRemaining >= 0 && (
        <div className={classes.countdownItem}>
          <svg className={classes.countdownSvg}>
            <path
              fill="none"
              stroke="#333"
              strokeWidth="4"
              d={describeArc(50, 50, 48, 0, minutesRadius)}
            />
          </svg>
          {minutesRemaining}
          <span className={classes.countdownItemSpan}>{intl.formatMessage({ id: 'minutes' })}</span>
        </div>
      )}
    </div>
  );
}

ExpiresDisplay.propTypes = {
  value: PropTypes.number.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  createdAt: PropTypes.object.isRequired,
};

export default ExpiresDisplay;
