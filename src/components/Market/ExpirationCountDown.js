import React, { useEffect, useState } from 'react';
import { Typography } from '@material-ui/core';

/***
 * Simple countdown component that either displays the date
 * of market expiration if more than one day left,
 * or the h:m:s remaining
 * @param props
 * @returns {*}
 * @constructor
 */
function ExpirationCountdown(props){

  const { expiration_minutes, created_at } = props;

  function getClockTimeRemaining(millisLeft) {
    const hours = Math.floor((millisLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((millisLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((millisLeft % (1000 * 60)) / 1000);
    return { hours, minutes, seconds };
  }

  // TODO: This is crap and Not I18n freindly. Fix it
  function convertMillisToTimeLeft(millisLeft) {
    const { hours, minutes, seconds } = getClockTimeRemaining(millisLeft);
    if (hours > 0 ) {
      return `${hours}h:${minutes}m`;
    }
    return `${minutes}m:${seconds}s`;
  }

  function getRenderPeriod(millisLeft) {
    const { hours } = getClockTimeRemaining(millisLeft);
    if (hours > 0) {
      return 60000; // 1 minute
    }
    return 1000; // 1 second
  }

  const [currentTime, setCurrentTime] = useState(new Date());

  console.debug(expiration_minutes);
  const usedExpiration = expiration_minutes || 0;
  const usedCreatedAt = created_at || new Date();

  const oneDayMillis = 86400000;
  const expirationMillis = usedExpiration * 60 * 1000;
  const expirationTimeMillis = (usedCreatedAt.getTime() + expirationMillis);
  const expirationDate = new Date(expirationTimeMillis);

  const millisRemaining = Math.max(0, expirationDate.getTime() - currentTime.getTime());
  const moreThanOneDayLeft = (millisRemaining >= oneDayMillis);
  const renderPeriod = moreThanOneDayLeft ? oneDayMillis : 1000;


  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), renderPeriod);
    return () => {
      clearInterval(timer);
    };
  });

  return (
    <Typography>
      {moreThanOneDayLeft && expirationDate.toUTCString()}
      {!moreThanOneDayLeft && convertMillisToTimeLeft(millisRemaining)}
    </Typography>
  );
}
export default ExpirationCountdown;