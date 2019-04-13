import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import {
  InputLabel,
  Input,
  Chip,
  withStyles,
} from '@material-ui/core';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import { getMarketCategories } from '../../store/Markets/reducer';

const styles = theme => ({
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  chip: {
    margin: theme.spacing.unit * 0.25,
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
    return categories.map((category, index) => (
      <MenuItem key={index} value={category.name}>{category.name}</MenuItem>
    ));
  }

  function getSelectList(categoryItems) {
    return (
      <FormControl fullWidth>
        <InputLabel htmlFor="categories-select">
          {intl.formatMessage({ id: 'investibleCategoriesLabel' })}
        </InputLabel>
        <Select
          multiple
          value={value}
          onChange={onChange}
          input={<Input id="categories-select" />}
          renderValue={selected => (
            <div className={classes.chips}>
              {selected.map(value => (
                <Chip key={value} label={value} className={classes.chip} />
              ))}
            </div>
          )}
        >
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
  intl: PropTypes.object.isRequired, //eslint-disable-line
  marketCategories: PropTypes.object.isRequired, //eslint-disable-line
  marketId: PropTypes.string,
  dispatch: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(
  withStyles(styles)(injectIntl(CategorySelectList)),
);
