import React from 'react'
import PropTypes from 'prop-types'
import { FormattedRelativeTime } from 'react-intl'
import { useMediaQuery, useTheme } from '@material-ui/core'

/**
 * Convenience wrapper around FormattedRelativeTime for displaying how long ago something was created
 */
function UsefulRelativeTime (props) {
  const { value: timeGiven, milliSecondsGiven, ...other } = props;
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const milliseconds = milliSecondsGiven || timeGiven - Date.now();
  const seconds = Math.trunc(milliseconds / 1000)
  const useSeconds = seconds >= 0 ? -1 : seconds;
  const minutes = Math.trunc(seconds / 60)
  const hours = Math.trunc(minutes / 60)
  const days = Math.trunc(hours / 24)

  if (minutes === 0) {
    return <FormattedRelativeTime {...other} unit="second" value={useSeconds}
                                  style={mobileLayout ? 'short' : 'long'}/>
  }
  if (hours === 0) {
    return <FormattedRelativeTime {...other} unit="minute" value={minutes}
                                  style={mobileLayout ? 'short' : 'long'}/>
  }
  if (days === 0) {
    return <FormattedRelativeTime {...other} unit="hour" value={hours}
                                  style={mobileLayout ? 'short' : 'long'}/>
  }
  return <FormattedRelativeTime {...other} unit="day" value={days} style={mobileLayout ? 'short' : 'long'}/>
}

UsefulRelativeTime.propTypes = {
  value: PropTypes.instanceOf(Date),
  milliSecondsGiven: PropTypes.number
}

export default UsefulRelativeTime