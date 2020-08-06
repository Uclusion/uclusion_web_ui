import React from 'react'
import PropTypes from 'prop-types'
import { FormattedRelativeTime } from 'react-intl'

/**
 * Convenience wrapper around FormattedRelativeTime that automatically
 * uses to biggest possible unit so that the value is >= 1
 */
function UsefulRelativeTime (props) {
  const { value: miliseconds, ...other } = props
  const seconds = Math.trunc(miliseconds / 1000)
  const minutes = Math.trunc(seconds / 60)
  const hours = Math.trunc(minutes / 60)
  const days = Math.trunc(hours / 24)

  if (minutes === 0) {
    return <FormattedRelativeTime {...other} unit="second" value={seconds}
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
  value: PropTypes.number.isRequired,
}

export default UsefulRelativeTime