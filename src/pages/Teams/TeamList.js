import React, { Component } from 'react'
import { bindActionCreators, compose } from 'redux'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { injectIntl } from 'react-intl'
import Activity from '../../containers/Activity/Activity'
import { Typography } from '@material-ui/core'
import { getCategoriesFetching, getMarketCategories } from '../../store/Markets/reducer'
import { withStyles } from '@material-ui/core/styles/index'
import withWidth from '@material-ui/core/withWidth/index'
import TeamListItem from './TeamListItem'
import { withMarketId } from '../../components/PathProps/MarketId'

const styles = (theme) => ({
  mainGrid: {
    flex: 1,
    display: 'flex',
    overflow: 'auto'
  }
})

class TeamList extends Component {
  render () {
    const { intl, loading, teams, classes, marketId } = this.props
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
            {intl.formatMessage({ id: 'teamsListNotFound' })}
          </Typography>
        </Activity>
      )
    }
    const teamLists = teams.map(element =>
      <TeamListItem
        key={element.name}
        id={element.name}
        name={element.name}
        investiblesIn={element.investibles_in}
      />
    )
    return (
      <Activity
        isLoading={teams === undefined}
        containerStyle={{ overflow: 'hidden' }}
        title={intl.formatMessage({ id: 'teamsHeader' })}>
        <div className={classes.mainGrid}>
          {teamLists}
        </div>
      </Activity>
    )
  }
}

TeamList.propTypes = {
  dispatch: PropTypes.func.isRequired,
  loading: PropTypes.number.isRequired,
  teams: PropTypes.arrayOf(PropTypes.object).isRequired
}

function mapStateToProps (state) {
  return {
    loading: getTeamsFetching(state.marketsReducer),
    teams: fetchMarketTeams(state.marketsReducer)
  }
}

function mapDispatchToProps (dispatch) {
  return Object.assign({ dispatch }, bindActionCreators({ getMarketTeams }, dispatch))
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(compose(
  withWidth(),
  withStyles(styles, {withTheme: true})
)(injectIntl(withMarketId(TeamList))))
