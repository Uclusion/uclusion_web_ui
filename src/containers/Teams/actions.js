

import GlobalState from 'uclusion-shell/lib/utils/GlobalState'

export const REQUEST_USER_TEAMS = 'REQUEST_USER_TEAMS'
export const RECEIVE_USER_TEAMS = 'RECEIVE_USER_TEAMS'

export const REQUEST_TEAM_USERS = 'REQUEST_TEAM_USERS'
export const RECEIVE_TEAM_USERS = 'RECEIVE_TEAM_USERS'

export const requestTeamUsers = (teamId) => ({
  type: REQUEST_TEAM_USERS,
  teamId
})

export const receiveTeamUsers = (teamAndUsers) => ({
  type: RECEIVE_TEAM_USERS,
  teamAndUsers
})

export const requestUserTeams = (userId) => ({
  type: REQUEST_USER_TEAMS,
  userId
})

export const receiveUserTeams = (teams) => ({
  type: RECEIVE_USER_TEAMS,
  teams
})

export const fetchUserTeams = () => (dispatch) => {
  dispatch(requestUserTeams)
  const client = GlobalState.uclusionClient
  return client.teams.list().then((teams) => {
    dispatch(receiveUserTeams(teams))
  }).catch((error) => {
    console.log(error)
    dispatch(receiveUserTeams([]))
  })
}
