import LogRocket from 'logrocket'
import config from './config/config'

// See https://docs.logrocket.com/docs/troubleshooting-sessions but the config loading above still violates first
LogRocket.init(config.logRocketInstance)