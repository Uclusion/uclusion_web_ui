import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withTheme } from '@material-ui/core/styles'
import { injectIntl } from 'react-intl'
import Activity  from '../../containers/Activity/Activity'
import { fetchUserTeams } from '../../store/Teams/actions'
import { getTeamsFetching, getUserTeams} from '../../store/Teams/reducer'
import { getUsersFetching, getCurrentUser } from '../../store/Users/reducer';
import TeamsList from './UserTeamsList'

class UserTeams extends Component {
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


    if (loading > 0 && teams.length === 0) {
      return (
        <Activity
          isLoading={teams === undefined}
          containerStyle={{ overflow: 'hidden' }}
          title={intl.formatMessage({ id: 'teamsLoading' })}>
          <div>
            Loading
          </div>
        </Activity>
      )
    }

    if (teams.length === 0) {
      return (
        <Activity
          isLoading={teams === undefined}
          containerStyle={{ overflow: 'hidden' }}
          title={intl.formatMessage({ id: 'teamsLoading' })}>
          <div><p>{intl.formatMessage({ id: 'teamsListNotFound'})}</p></div>
        </Activity>
      )
    }

    return (
      <Activity
        isLoading={teams === undefined}
        containerStyle={{ overflow: 'hidden' }}
        title={intl.formatMessage({ id: 'teamsLoading' })}>
        <TeamsList user={user} teams={teams}/>
      </Activity>
    )
  }
}

UserTeams.propTypes = {
  dispatch: PropTypes.func.isRequired,
  loading: PropTypes.number.isRequired,
  teams: PropTypes.arrayOf(PropTypes.object).isRequired
}

const mapStateToProps = (state) => ({
  loading: getTeamsFetching(state.teamsReducer) + getUsersFetching(state.usersReducer),
  teams: getUserTeams(state.teamsReducer),
  user: getCurrentUser(state.usersReducer)
})

function mapDispatchToProps (dispatch) {
  return Object.assign({ dispatch }, bindActionCreators({ fetchUserTeams }, dispatch))
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(injectIntl(withTheme()(UserTeams)))
