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
import CategoryListItem from './CategoryListItem'

const styles = (theme) => ({
  mainGrid: {
    flex: 1,
    display: 'flex',
    overflow: 'auto'
  }
})

class CategoryList extends Component {
  render () {
    const { intl, loading, categories, classes } = this.props
    if (loading > 0) {
      return (
        <Activity
          isLoading={categories === undefined}
          containerStyle={{ overflow: 'hidden' }}
          title={intl.formatMessage({ id: 'categoriesHeader' })}>
          <Typography>
            {intl.formatMessage({id: 'categoriesLoading'})}
          </Typography>
        </Activity>
      )
    }

    if (categories.length === 0) {
      return (
        <Activity
          isLoading={categories === undefined}
          containerStyle={{ overflow: 'hidden' }}
          title={intl.formatMessage({ id: 'categoriesHeader' })}>
          <Typography>
            {intl.formatMessage({ id: 'categoriesListNotFound' })}
          </Typography>
        </Activity>
      )
    }
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
    loading: getCategoriesFetching(state.marketsReducer),
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
)(injectIntl(CategoryList)))
