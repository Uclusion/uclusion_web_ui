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

  function convertMillisToTimeLeft(millisLeft) {
    const hours = Math.floor((millisLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((millisLeft % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((millisLeft % (1000 * 60)) / 1000);
    return `${hours}:${mins}:${secs}`;
  }

  const [currentTime, setCurrentTime] = useState(new Date());

  const { expiration_minutes, created_at } = props;
  const usedExpiration = expiration_minutes || 0;
  const usedCreatedAt = created_at || new Date();

  const oneDayMillis = 86400000;
  const expirationMillis = usedExpiration * 60 * 1000;
  const expirationTimeMillis = (usedCreatedAt.getTime() + expirationMillis);
  const expirationDate = new Date(expirationTimeMillis);

  const millisRemaining = expirationDate.getTime() - currentTime.getTime();
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