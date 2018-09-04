import config from '../config'

export const initState = {
  auth: { isAuthorised: config.api_configuration.authorizer.isAuthorized() },
  ...config.initial_state
}

export default initState
