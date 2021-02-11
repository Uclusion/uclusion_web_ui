import React from 'react'
import PropTypes from 'prop-types'
import { FormattedRelativeTime } from 'react-intl'

/**
 * Convenience wrapper around FormattedRelativeTime for displaying how long ago something was created
 */
function UsefulRelativeTime (props) {
  const { value: timeGiven, ...other } = props;
  const milliseconds = timeGiven - Date.now();
  const seconds = Math.trunc(milliseconds / 1000)
  const useSeconds = seconds >= 0 ? -1 : seconds;
  const minutes = Math.trunc(seconds / 60)
  const hours = Math.trunc(minutes / 60)
  const days = Math.trunc(hours / 24)

  if (minutes === 0) {
    return <FormattedRelativeTime {...other} unit="second" value={useSeconds}
                                  style={window.outerWidth < 600 ? 'short' : 'long'}/>
  }
  if (hours === 0) {
    return <FormattedRelativeTime {...other} unit="minute" value={minutes}
                                  style={window.outerWidth < 600 ? 'short' : 'long'}/>
  }
  if (days === 0) {
    return <FormattedRelativeTime {...other} unit="hour" value={hours}
                                  style={window.outerWidth < 600 ? 'short' : 'long'}/>
  }
  return <FormattedRelativeTime {...other} unit="day" value={days} style={window.outerWidth < 600 ? 'short' : 'long'}/>
}

UsefulRelativeTime.propTypes = {
  value: PropTypes.instanceOf(Date).isRequired,
}

export default UsefulRelativeTime