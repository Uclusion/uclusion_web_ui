import uclusion from 'uclusion_sdk'
import config from '../../config/config'
import { receiveUser } from '../Users/actions'

export const REQUEST_USER_TEAMS = 'REQUEST_USER_TEAMS';
export const RECEIVE_USER_TEAMS = 'RECEIVE_USER_TEAMS';


export const REQUEST_TEAM_USERS = 'REQUEST_TEAM_USERS';
export const RECEIVE_TEAM_USERS = 'RECEIVE_TEAM_USERS';

export const requestTeamUsers = (teamId) => ({
  type: REQUEST_TEAM_USERS,
  teamId
})

export const receiveTeamUsers = (teamAndUsers) => ({
  type: RECEIVE_TEAM_USERS,
  teamAndUsers
})

export const requestUserTeams = () => ({
  type: REQUEST_USER_TEAMS,
  userId
})

export const recieveUserTeams = (teams) => ({
  type: RECEIVE_USER_TEAMS,
  teams
})

export const fetchUserTeams = () => (dispatch) => {
  dispatch(requestUserTeams);
  uclusion.constructClient(config.api_configuration).then((client) => {
    return teams.list()
  }).then((teams) => {
    dispatch(recieveUserTeams(teams))
  }).catch((error) => {
    console.log(error)
    dispatch(receiveUseTeams([]))
  })
}

