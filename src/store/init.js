import config from '../config'
import { isAuthorised } from 'uclusion-shell/lib/utils/auth'

export const initState = {
  auth: { isAuthorised: isAuthorised() },
  ...config.initial_state
}

export default initState
