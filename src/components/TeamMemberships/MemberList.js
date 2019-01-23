import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'
import { getTeamMembers } from '../../store/Teams/reducer'
import { fetchTeamMembers } from '../../store/Teams/actions'
import MemberListCategory  from './MemberListCategory'
class MemberList extends React.Component{

  componentDidMount () {
    this.readCurrentUsers()
  }

  readCurrentUsers() {
    const { dispatch, teamId } = this.props
    dispatch(fetchTeamMembers(teamId))
  }

  render() {
    const { teamMembers, teamId } = this.props
    const thisTeamsMembers = teamMembers[teamId]
    if (!thisTeamsMembers){
      return null
    }
    const { users } = thisTeamsMembers
    return (
      <MemberListCategory members={users}/>
    )
  }
}

function mapStateToProps (state) {
  return { teamMembers: getTeamMembers(state.teamsReducer) }
}

function mapDispatchToProps (dispatch) {
  return { dispatch }
}

MemberList.propTypes = {
  teamMembers: PropTypes.object.isRequired,
  teamId: PropTypes.string.isRequired
};

export default connect(mapStateToProps, mapDispatchToProps)(MemberList)