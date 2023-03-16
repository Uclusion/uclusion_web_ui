import React from 'react';
import PropTypes from 'prop-types';
import * as moment from 'moment';
import { useIntl } from 'react-intl';

function ExpiresDisplay(props) {
  const intl = useIntl();
  const { createdAt, expirationMinutes } = props;
  const expiresDurationMillis = expirationMinutes * 60000;
  const createdAtMillis = createdAt.getTime();
  const expiresMillis = createdAtMillis + expiresDurationMillis;
  const nowMillis = (new Date()).getTime();
  const remainingMillis = expiresMillis - nowMillis;
  const remaining = moment.duration(remainingMillis);

  const daysRemaining = remaining.days();
  const hoursRemaining = remaining.hours();
  const minutesRemaining = remaining.minutes();

  if (daysRemaining > 0) {
    return (
      <div style={{whiteSpace: 'nowrap'}}>
        {intl.formatMessage({ id: 'expiresIn' })} {daysRemaining}{((hoursRemaining > 0) || (minutesRemaining > 0) ) && '+'} {intl.formatMessage({ id: 'daysLeft' })}
      </div>
    );
  }
  if (hoursRemaining > 0) {
    return (
      <div style={{whiteSpace: 'nowrap'}}>
        {intl.formatMessage({ id: 'expiresIn' })} {hoursRemaining}{minutesRemaining > 0 && '+'} {intl.formatMessage({ id: 'hoursLeft' })}
      </div>
    );
  }
  if (minutesRemaining > 0) {
    return (
      <div style={{whiteSpace: 'nowrap'}}>
        {intl.formatMessage({ id: 'expiresIn' })} {minutesRemaining} {intl.formatMessage({ id: 'minutesLeft' })}
      </div>
    );
  }
  return (
    <div> {intl.formatMessage({ id: 'expiring' })}</div>
  );
}

ExpiresDisplay.propTypes = {
  expirationMinutes: PropTypes.number.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  createdAt: PropTypes.object.isRequired,
};

export default ExpiresDisplay;
