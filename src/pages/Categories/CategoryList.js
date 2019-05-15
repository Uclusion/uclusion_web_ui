/* eslint-disable react/forbid-prop-types */
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
import HelpMovie from '../../components/ModalMovie/HelpMovie';

const styles = theme => ({
  content: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  gridContainer: {
    flex: 1,
    overflow: 'auto',
    padding: theme.spacing.unit,
  },
});

function CategoryList(props) {
  const {
    intl,
    allCategories,
    classes,
    marketId,
    dispatch,
  } = props;
  useEffect(() => {
    // Otherwise categories can be missing or cardinality can be wrong
    dispatch(fetchMarketCategories({ marketId }));
    return () => {};
  }, [marketId]);

  function getCurrentMarketCategories(categories, currentMarketId){
    return currentMarketId ? categories[currentMarketId] : [];
  }

  const categories = getCurrentMarketCategories(allCategories, marketId);

  return (
    <div>
      <Activity
        isLoading={marketId === undefined}
        containerStyle={{ overflow: 'hidden' }}
        title={intl.formatMessage({ id: 'marketCategoriesMenu' })}
      >
        <div className={classes.content}>
          <HelpMovie name="categoriesIntro" />
          <CategoryAdd marketId={marketId} />
          {categories && categories.length > 0 && (
            <div className={classes.gridContainer}>
              <Grid container>
                {categories.map(category => (
                  <CategoryListItem
                    key={category.name}
                    id={category.name}
                    name={category.name}
                    investiblesIn={category.investibles_in}
                  />
                ))}
              </Grid>
            </div>
          )}
        </div>
      </Activity>
    </div>
  );
}

CategoryList.propTypes = {
  dispatch: PropTypes.func.isRequired,
  intl: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  allCategories: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
};


function mapStateToProps(state) {
  return {
    allCategories: getMarketCategories(state.marketsReducer),
  };
}

function mapDispatchToProps(dispatch) {
  return Object.assign({ dispatch }, bindActionCreators(dispatch));
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(compose(
  withWidth(),
  withStyles(styles, { withTheme: true }),
)(injectIntl(withMarketId(CategoryList))));
