import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withTheme } from '@material-ui/core/styles'
import { getInvestibles, investiblePropType } from '../../store/MarketInvestibles/reducer'
import { injectIntl } from 'react-intl'
import Activity from '../../containers/Activity/Activity'
import { getMarketCategories, categoryPropType } from '../../store/Markets/reducer'
import { getCurrentUser } from '../../store/Users/reducer'
import InvestibleList from '../../components/Investibles/InvestibleList'
import { withMarketId } from '../../components/PathProps/MarketId'

class Investibles extends Component {
  render () {
    const { intl, investibles, categories, marketId, user } = this.props
    // Can't rely just on loading as their could be an attempt to load this page before loading even begins
    if (!investibles || (!user || !user.market_presence)) {
      return (
        <Activity
          isLoading={investibles === undefined}
          containerStyle={{ overflow: 'hidden' }}
          title={intl.formatMessage({ id: 'investibles' })}>
          <div>
          Loading
          </div>
        </Activity>
      )
    }
    const teamId = user.default_team_id // TODO:  might change later, so keeping it separate
    return (

      <div>

        <Activity
          isLoading={investibles === undefined}
          containerStyle={{ overflow: 'hidden' }}
          title={intl.formatMessage({ id: 'investibles' })}>

          {investibles && <InvestibleList teamId={teamId} user={user} marketId={marketId} investibles={investibles} categories={categories} />}
        </Activity>
      </div>

    )
  }
}

Investibles.propTypes = {
  dispatch: PropTypes.func.isRequired,
  loading: PropTypes.number.isRequired,
  investibles: PropTypes.arrayOf(investiblePropType),
  categories: PropTypes.arrayOf(categoryPropType),
  marketId: PropTypes.string,
  user: PropTypes.object
}

const mapStateToProps = (state) => ({
  investibles: getInvestibles(state.investiblesReducer),
  categories: getMarketCategories(state.marketsReducer),
  user: getCurrentUser(state.usersReducer)
})

function mapDispatchToProps (dispatch) {
  return { dispatch }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(injectIntl(withTheme()(withMarketId(Investibles))))
