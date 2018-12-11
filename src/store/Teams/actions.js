import { getClient } from '../../config/uclusionClient'
import { sendIntlMessage, ERROR } from '../../utils/userMessage'

export const REQUEST_USER_TEAMS


= 'REQUEST_USER_TEAMS'
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
  const clientPromise = getClient()
  return clientPromise.then((client) => {
    return client.teams.list()
  }).then((teams) => {
    dispatch(receiveUserTeams(teams))
  }).catch((error) => {
    console.log(error)
    sendIntlMessage(ERROR, {id: 'teamsLoadFailed'})
    dispatch(receiveUserTeams([]))
  })
}
