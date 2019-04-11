import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { withStyles } from '@material-ui/core';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import { getMarketCategories } from '../../store/Markets/reducer';

const styles = theme => ({
  root: {
    flex: 1,
  },
});

function CategorySelectList(props) {
  const {
    marketCategories,
    intl,
    marketId,
    classes,
    onChange,
    value,
  } = props;

  function convertCategoriesToItems(categories) {
    //console.log(categories);
    return categories.map((category, index) => (
      <MenuItem key={index} value={category.name}>{category.name}</MenuItem>
    ));
  }



  function getSelectList(categoryItems) {

    return (
      <FormControl className={classes.root}>
        <Select multiple id="adornment-stage" value={value} onChange={onChange}>
          <MenuItem value="helper" disabled>
            {intl.formatMessage({ id: 'investibleEditCategoriesHelper' })}
          </MenuItem>
          {categoryItems}
        </Select>
      </FormControl>
    );
  }
  const categories = (marketCategories && marketCategories[marketId]) || [];
  const categoryItems = convertCategoriesToItems(categories);
  return getSelectList(categoryItems);
}

function mapStateToProps(state) {
  return {
    marketCategories: getMarketCategories(state.marketsReducer),
  };
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

CategorySelectList.propTypes = {
  intl: PropTypes.object.isRequired,
  marketCategories: PropTypes.object.isRequired,  //eslint-disable-line
  marketId: PropTypes.string,
  dispatch: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(
  withStyles(styles)(injectIntl(CategorySelectList)),
);
