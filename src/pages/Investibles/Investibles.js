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
import { fetchInvestibleList } from '../../store/MarketInvestibles/actions'
import LoginModal from '../Login/LoginModal'

const pollRate = 5400000 // 90 mins = 5400 seconds * 1000 for millis

class Investibles extends Component {
  constructor (props) {
    super(props)
    this.state = {
      lastFetched: undefined
    }
  }
  componentDidMount () {
    this.getItems() // Initial fetch
    this.timer = setInterval(() => this.getItems(), pollRate)
  }

  componentWillUnmount () {
    clearInterval(this.timer)
  }

  getItems () {
    const { investibles, marketId, dispatch,
      history: { location: { pathname } } } = this.props
    const showLogin = /(.+)\/login/.test(pathname.toLowerCase())
    if (!showLogin && investibles && investibles.length > 0 && (!this.state.lastFetched || (Date.now() - this.state.lastFetched > pollRate))) {
      console.log('Fetching investibles from polling with last fetched ' + this.state.lastFetched)
      this.setState({lastFetched: Date.now()})
      dispatch(fetchInvestibleList({marketId: marketId, currentInvestibleList: investibles}))
    }
  }
  render () {
    const {
      intl,
      investibles,
      categories,
      marketId,
      user,
      dispatch,
      history: { location: { pathname } }
    } = this.props

    const showLogin = /(.+)\/login/.test(pathname.toLowerCase())

    if (!showLogin && investibles && investibles.length === 0 && (!this.state.lastFetched || (Date.now() - this.state.lastFetched > pollRate))) {
      console.log('Fetching investibles')
      this.setState({lastFetched: Date.now()})
      dispatch(fetchInvestibleList({marketId: marketId, currentInvestibleList: investibles}))
    }
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

        <LoginModal
          open={showLogin}
        />
      </div>

    )
  }
}

Investibles.propTypes = {
  dispatch: PropTypes.func.isRequired,
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
