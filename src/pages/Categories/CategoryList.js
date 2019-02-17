import React from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators, compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { Grid } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import withWidth from '@material-ui/core/withWidth';
import Activity from '../../containers/Activity/Activity';
import { withMarketId } from '../../components/PathProps/MarketId';
import { getMarketCategories } from '../../store/Markets/reducer';
import CategoryListItem from './CategoryListItem';
import CategoryAdd from './CategoryAdd';

const styles = theme => ({
  gridContainer: {
    padding: theme.spacing.unit,
  },
});

const CategoryList = ({
  intl,
  categories,
  classes,
  marketId,
}) => (
  <Activity
    isLoading={marketId === undefined}
    containerStyle={{ overflow: 'hidden' }}
    title={intl.formatMessage({ id: 'categoriesHeader' })}
  >
    <CategoryAdd marketId={marketId} />
    {categories && categories.length > 0
    && (
      <Grid container className={classes.gridContainer}>
        {categories.map(category => (
          <CategoryListItem
            key={category.name}
            id={category.name}
            name={category.name}
            investiblesIn={category.investibles_in}
          />
        ))}
      </Grid>
    )}
  </Activity>
);

CategoryList.propTypes = {
  dispatch: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(PropTypes.object).isRequired,
};

function mapStateToProps(state) {
  return {
    categories: getMarketCategories(state.marketsReducer),
  };
}

function mapDispatchToProps(dispatch) {
  return Object.assign({ dispatch }, bindActionCreators({ getMarketCategories }, dispatch));
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(compose(
  withWidth(),
  withStyles(styles, { withTheme: true }),
)(injectIntl(withMarketId(CategoryList))));
