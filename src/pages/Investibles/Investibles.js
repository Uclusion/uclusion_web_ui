import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withTheme } from '@material-ui/core/styles'
import { fetchInvestibles, fetchCategoriesInvestibles } from '../../containers/Investibles/actions'
import { getInvestiblesFetching, getInvestibles, investiblePropType } from '../../containers/Investibles/reducer'
import { injectIntl } from 'react-intl'
import { Activity } from 'uclusion-shell'
import { getCurrentMarketId, getMarketsFetching } from '../../containers/Markets/reducer'
import { getUsersFetching, getCurrentUser } from '../../containers/Users/reducer';
import InvestibleList from './InvestibleList'

class Investibles extends Component {
  constructor (props) {
    super(props)
    // https://medium.freecodecamp.org/react-binding-patterns-5-approaches-for-handling-this-92c651b5af56
    this.readTrendingInvestibles = this.readTrendingInvestibles.bind(this)
  }

  componentDidMount () {
    this.readTrendingInvestibles()
  }

  componentDidUpdate (prevProps) {
    if (this.props.marketId !== prevProps.marketId) {
      this.readTrendingInvestibles()
    }
    // TODO flip return and branch below (see drawer example) to dedup Activity
  }

  readTrendingInvestibles () {
    const { dispatch, marketId } = this.props
    dispatch(fetchInvestibles({
      market_id: marketId,
      trending_window_date: '2015-01-22T03:23:26Z'
    }))
  }

  readCategoriesInvestibles (page, categoryName) {
    const { dispatch, marketId } = this.props
    dispatch(fetchCategoriesInvestibles({
      market_id: marketId,
      category: categoryName,
      page,
      per_page: 20
    }))
  }

  render () {
    const { intl, loading, investibles, marketId, user } = this.props


    if (loading > 0 && investibles.length === 0) {
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

    if (investibles.length === 0) {
      return (
        <Activity
          isLoading={investibles === undefined}
          containerStyle={{ overflow: 'hidden' }}
          title={intl.formatMessage({ id: 'investibles' })}>
          <div><p>{intl.formatMessage({ id: 'investibleListNotFound'})}</p></div>
        </Activity>
      )
    }

    return (
      <Activity
        isLoading={investibles === undefined}
        containerStyle={{ overflow: 'hidden' }}
        title={intl.formatMessage({ id: 'investibles' })}>
        <InvestibleList user={user} marketId={marketId} investibles={investibles}/>
      </Activity>
    )
  }
}

Investibles.propTypes = {
  dispatch: PropTypes.func.isRequired,
  loading: PropTypes.number.isRequired,
  investibles: PropTypes.arrayOf(investiblePropType).isRequired,
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
