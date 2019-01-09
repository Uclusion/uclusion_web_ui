import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withTheme } from '@material-ui/core/styles'
import { fetchCategoriesInvestibles } from '../../store/MarketInvestibles/actions'
import { getInvestiblesFetching, getInvestibles, investiblePropType } from '../../store/MarketInvestibles/reducer'
import { injectIntl } from 'react-intl'
import Activity from '../../containers/Activity/Activity'
import { getMarketsFetching, getCategoriesFetching, getMarketCategories, categoryPropType } from '../../store/Markets/reducer'
import { getUsersFetching, getCurrentUser } from '../../store/Users/reducer'
import InvestibleList from './InvestibleList'
import { withMarketId } from '../../components/PathProps/MarketId'

class Investibles extends Component {
  constructor (props) {
    super(props)
    // https://medium.freecodecamp.org/react-binding-patterns-5-approaches-for-handling-this-92c651b5af56
    // this.readTrendingInvestibles = this.readTrendingInvestibles.bind(this)
  }

  componentDidMount () {
    // console.log("Attempting to read trending investibles");
    // this.readTrendingInvestibles() This is PWA so we don't do this here
  }


  componentDidUpdate (prevProps) {
    // if (this.props.marketId !== prevProps.marketId) {
    //   this.readTrendingInvestibles() This is PWA so do this long before here
    // }
    // TODO flip return and branch below (see drawer example) to dedup Activity
  }

  // readTrendingInvestibles () {
  //   const { dispatch, user } = this.props
  //   if (!user) {
  //     return
  //   }
  //   const marketId = this.getMarketId()
  //   dispatch(fetchInvestibles({
  //     market_id: marketId,
  //     trending_window_date: '2015-01-22T03:23:26Z'
  //   }))
  // }

  readCategoriesInvestibles (page, categoryName) {
    const { dispatch, marketId } = this.props
    // toast("TEST!")
    dispatch(fetchCategoriesInvestibles({
      market_id: marketId,
      category: categoryName,
      page,
      per_page: 20
    }))
  }

  render () {
    const { intl, loading, investibles, categories, marketId, user } = this.props
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
    const teamId = user.default_team_id // TODO:  might change later, so keeping it separate
    return (

      <div style={{overflow: 'scroll'}}>

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
  loading: getInvestiblesFetching(state.investiblesReducer) + getMarketsFetching(state.marketsReducer) + getCategoriesFetching(state.marketsReducer) + getUsersFetching(state.usersReducer),
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
