import { getClient } from '../../config/uclusionClient'
import { sendIntlMessage, ERROR } from '../../utils/userMessage'

export const REQUEST_USER_TEAMS = 'REQUEST_USER_TEAMS'
export const RECEIVE_USER_TEAMS = 'RECEIVE_USER_TEAMS'

export const REQUEST_TEAM_MEMBERS = 'REQUEST_TEAM_MEMBERS'
export const RECEIVE_TEAM_MEMBERS = 'RECEIVE_TEAM_MEMBERS'

export const requestTeamMembers = (teamId) => ({
  type: REQUEST_TEAM_MEMBERS,
  teamId
})

export const receiveTeamMembers = (teamAndMembers) => ({
  type: RECEIVE_TEAM_MEMBERS,
  teamAndMembers
})

export const requestUserTeams = (userId) => ({
  type: REQUEST_USER_TEAMS,
  userId
})

export const receiveUserTeams = (teams) => ({
  type: RECEIVE_USER_TEAMS,
  teams
})

export const fetchTeamMembers = (teamId) => (dispatch) => {
  dispatch(requestTeamMembers(teamId))
  const clientPromise = getClient()
  return clientPromise.then((client) => {
    return client.getTeamMembers(teamId)
  }).then((teamAndMembers) => {
    dispatch(receiveTeamMembers(teamAndMembers))
  }).catch((error) => {
    console.log(error)
    sendIntlMessage(ERROR, {id: 'teamMemberLoadFailed'})
    dispatch(receiveTeamMembers({}))
  })
}

export const fetchUserTeams = () => (dispatch) => {
  dispatch(requestUserTeams)
  const clientPromise = getClient()
  return clientPromise.then((client) => {
    return client.teams.mine()
  }).then((teams) => {
    dispatch(receiveUserTeams(teams))
  }).catch((error) => {
    console.log(error)
    sendIntlMessage(ERROR, {id: 'teamsLoadFailed'})
    dispatch(receiveUserTeams([]))
  })
}
