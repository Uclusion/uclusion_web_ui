import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { injectIntl } from 'react-intl'
import Activity  from '../../containers/Activity/Activity'
import { fetchUserTeams } from '../../store/Teams/actions'
import { getTeamsFetching, getUserTeams} from '../../store/Teams/reducer'
import { getCurrentUser } from '../../store/Users/reducer';
import UserMembershipsList from '../../components/TeamMemberships/UserMembershipsList'
import { Typography } from '@material-ui/core'

class UserMemberships extends Component {
  constructor (props) {
    super(props)
    this.readUserTeams = this.readUserTeams.bind(this)
  }

  componentDidMount () {
    this.readUserTeams(1)
  }

  readUserTeams () {
    const { dispatch } = this.props
    dispatch(fetchUserTeams())
  }

  render () {
    const { intl, loading, teams, user } = this.props


    if (loading > 0) {
      return (
        <Activity
          isLoading={teams === undefined}
          containerStyle={{ overflow: 'hidden' }}
          title={intl.formatMessage({ id: 'teamsHeader' })}>
          <Typography>
            {intl.formatMessage({id: 'teamsLoading'})}
          </Typography>
        </Activity>
      )
    }

    if (teams.length === 0) {
      return (
        <Activity
          isLoading={teams === undefined}
          containerStyle={{ overflow: 'hidden' }}
          title={intl.formatMessage({ id: 'teamsHeader' })}>
          <Typography>
            {intl.formatMessage({ id: 'teamsListNotFound'})}
          </Typography>
        </Activity>
      )
    }

    return (
      <Activity
        isLoading={teams === undefined}
        containerStyle={{ overflow: 'hidden' }}
        title={intl.formatMessage({ id: 'teamsHeader' })}>
        <UserMembershipsList user={user} teams={teams} />
      </Activity>
    )
  }
}

UserMemberships.propTypes = {
  dispatch: PropTypes.func.isRequired,
  loading: PropTypes.number.isRequired,
  teams: PropTypes.arrayOf(PropTypes.object).isRequired
}

function mapStateToProps (state) {
  return {
    loading: getTeamsFetching(state.teamsReducer),
    teams: getUserTeams(state.teamsReducer),
    user: getCurrentUser(state.usersReducer)
  }
}

function mapDispatchToProps (dispatch) {
  return Object.assign({ dispatch }, bindActionCreators({ fetchUserTeams }, dispatch))
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(injectIntl(UserMemberships))
