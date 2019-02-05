import React, { Component } from 'react'
import { bindActionCreators, compose } from 'redux'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { injectIntl } from 'react-intl'
import Activity from '../../containers/Activity/Activity'
import { getMarketCategories } from '../../store/Markets/reducer'
import { withStyles } from '@material-ui/core/styles/index'
import withWidth from '@material-ui/core/withWidth/index'
import CategoryListItem from './CategoryListItem'
import CategoryAdd from './CategoryAdd'
import { withMarketId } from '../../components/PathProps/MarketId'

const styles = (theme) => ({
  mainGrid: {
    flex: 1,
    display: 'flex',
    overflow: 'auto'
  }
})

class CategoryList extends Component {
  render () {
    const { intl, categories, classes, marketId } = this.props
    const categoryLists = categories.map(element =>
      <CategoryListItem
        key={element.name}
        id={element.name}
        name={element.name}
        investiblesIn={element.investibles_in}
      />
    )
    return (
      <Activity
        isLoading={categories === undefined}
        containerStyle={{ overflow: 'hidden' }}
        title={intl.formatMessage({ id: 'categoriesHeader' })}>
        <CategoryAdd key='quickadd' marketId={marketId} />
        <div className={classes.mainGrid}>
          {categoryLists}
        </div>
      </Activity>
    )
  }
}

CategoryList.propTypes = {
  dispatch: PropTypes.func.isRequired,
  loading: PropTypes.number.isRequired,
  categories: PropTypes.arrayOf(PropTypes.object).isRequired
}

function mapStateToProps (state) {
  return {
    categories: getMarketCategories(state.marketsReducer)
  }
}

function mapDispatchToProps (dispatch) {
  return Object.assign({ dispatch }, bindActionCreators({ getMarketCategories }, dispatch))
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(compose(
  withWidth(),
  withStyles(styles, {withTheme: true})
)(injectIntl(withMarketId(CategoryList))))
