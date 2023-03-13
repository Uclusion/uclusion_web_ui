import React from 'react';
import PropTypes from 'prop-types';
import * as moment from 'moment';
import { useIntl } from 'react-intl';

function ExpiresDisplayBar(props) {
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

  function getDisplayText() {
    if (daysRemaining > 0) {
      return (
        <React.Fragment>
          {daysRemaining}{((hoursRemaining > 0) || (minutesRemaining > 0) ) && '+'}
          <span> {intl.formatMessage({ id: 'daysLeft' })}</span>
        </React.Fragment>
      );
    }
    if (hoursRemaining > 0) {
      return (
      <React.Fragment>
        {hoursRemaining}{minutesRemaining > 0 && '+'}
        <span> {intl.formatMessage({ id: 'hoursLeft' })}</span>
      </React.Fragment>
      );
    }
    if (minutesRemaining > 0) {
      return (
        <React.Fragment>
          {minutesRemaining}
          <span> {intl.formatMessage({ id: 'minutesLeft' })}</span>
        </React.Fragment>
      );
    }
    return <span> {intl.formatMessage({ id: 'expiring' })}</span>
  }

  return (
    <div>
      {getDisplayText()}
    </div>
  );
}

ExpiresDisplayBar.propTypes = {
  expirationMinutes: PropTypes.number.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  createdAt: PropTypes.object.isRequired,
};

export default ExpiresDisplayBar;
