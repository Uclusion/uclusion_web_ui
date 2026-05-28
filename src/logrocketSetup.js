import LogRocket from 'logrocket'
import config from './config/config'

// LogRocket wraps console.* and collapses every dev log to its own bundle, so skip it on localhost; set REACT_APP_LOGROCKET_LOCAL=true to opt in when testing a LogRocket change in dev.
const { hostname } = window.location
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
const enableLocally = process.env.REACT_APP_LOGROCKET_LOCAL === 'true'

if (!isLocalhost || enableLocally) {
  LogRocket.init(config.logRocketInstance)
}
