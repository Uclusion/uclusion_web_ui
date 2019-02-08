import { combineReducers } from 'redux';
import PropTypes from 'prop-types';
import { RECEIVE_USER_TEAMS, RECEIVE_TEAM_MEMBERS } from './actions';

export const teamPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  created_at: PropTypes.instanceOf(Date).isRequired,
  updated_at: PropTypes.instanceOf(Date).isRequired,
});

const userTeams = (state = [], action) => {
  switch (action.type) {
    case RECEIVE_USER_TEAMS:
      return action.teams;
    default:
      return state;
  }
};

const teamMembers = (state = {}, action) => {
  switch (action.type) {
    case RECEIVE_TEAM_MEMBERS:
      const { team, users } = action.teamAndMembers;
      team.num_users = users.length;
      const { id } = team;
      const newState = { ...state };
      newState[id] = { team, users };
      return newState;
    default:
      return state;
  }
};

export const getUserTeams = state => state.userTeams;

export const getTeamMembers = state => state.teamMembers;

export default combineReducers({
  userTeams,
  teamMembers,
});
