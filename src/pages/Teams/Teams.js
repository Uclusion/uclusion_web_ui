import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import _ from 'lodash'
import { withTheme } from '@material-ui/core/styles'
import { fetchTeams } from '../../containers/Markets/actions'
import { getInvestiblesFetching, getInvestibles, investiblePropType } from '../../containers/Investibles/reducer'
import { injectIntl } from 'react-intl'
import { Activity } from 'uclusion-shell'
import { getCurrentMarketId, getMarketsFetching } from '../../containers/Markets/reducer'
import { getUsersFetching, getCurrentUser } from '../../containers/Users/reducer';
import TeamsList from './TeamsList'

class Tems extends Component {
  constructor (props) {
    super(props)
    // https://medium.freecodecamp.org/react-binding-patterns-5-approaches-for-handling-this-92c651b5af56
    this.readTrendingInvestibles = this.readTrendingInvestibles.bind(this)
  }

  componentDidMount () {
    this.read()
  }

  componentDidUpdate (prevProps) {
    if (this.props.marketId !== prevProps.marketId) {
      this.readTrendingInvestibles()
    }
    // TODO flip return and branch below (see drawer example) to dedup Activity
  }



  readTeams (page, ) {
    const { dispatch, marketId } = this.props
    dispatch(fetchTeams({
      market_id: marketId,
    }))
  }

  render () {
    const { intl, loading, teams, marketId, user } = this.props


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

    if (investibles.length === 0) {
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
        isLoading={investibles === undefined}
        containerStyle={{ overflow: 'hidden' }}
        title={intl.formatMessage({ id: 'teamsLoading' })}>
        <TeamList user={user} marketId={marketId} teams={teams}/>
      </Activity>
    )
  }
}

Teams.propTypes = {
  dispatch: PropTypes.func.isRequired,
  loading: PropTypes.number.isRequired,
  Teams: PropTypes.arrayOf(teamsPropType).isRequired,
  marketId: PropTypes.string.isRequired
}

const mapStateToProps = (state) => ({
  loading: getInvestiblesFetching(state.investiblesReducer) + getMarketsFetching(state.marketsReducer) + getUsersFetching(state.usersReducer),
  investibles: getInvestibles(state.investiblesReducer),
  marketId: getCurrentMarketId(state.marketsReducer),
  user: getCurrentUser(state.usersReducer)
})

function mapDispatchToProps (dispatch) {
  return Object.assign({ dispatch }, bindActionCreators({ fetchInvestibles }, dispatch))
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(injectIntl(withTheme()(Investibles)))
