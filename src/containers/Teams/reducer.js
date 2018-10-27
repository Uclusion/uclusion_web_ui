import { combineReducers } from 'redux'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { RECEIVE_USER_TEAMS, REQUEST_USER_TEAMS} from './actions'
import { RECEIVE_USER, REQUEST_USER } from '../Users/actions'


export const teamPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  created_at: PropTypes.instanceOf(Date).isRequired,
  updated_at: PropTypes.instanceOf(Date).isRequired
})

export const userTeams = (state, action) => {
  switch (action.type) {
    case RECEIVE_USER_TEAMS:
      const teams = action.teams;
      return teams;
    default:
      return state;
  }
}


export const isTeamFetching = (state = 0, action) => {
  switch (action.type) {
    case REQUEST_USER_TEAMS:
      return state + 1;
    default:
      return state;
  }
}



export default combineReducers({
  userTeams,
  isTeamFetching
})


