import React, { useEffect } from 'react';
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
import { fetchMarketCategories } from '../../store/Markets/actions';

const styles = theme => ({
  gridContainer: {
    padding: theme.spacing.unit,
  },
});

function CategoryList(props) {
  const {
    intl,
    categories,
    classes,
    marketId,
    dispatch,
  } = props;
  useEffect(() => {
    // Otherwise categories can be missing or cardinality can be wrong
    dispatch(fetchMarketCategories({ marketId }));
    return () => {};
  }, [marketId]);
  return (
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
}

CategoryList.propTypes = {
  dispatch: PropTypes.func.isRequired,
  intl: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  categories: PropTypes.arrayOf(PropTypes.object).isRequired,
  marketId: PropTypes.string.isRequired,
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
