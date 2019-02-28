import React from 'react';
import { connect } from 'react-redux';
import { withTheme, withStyles } from '@material-ui/core/styles';
import elasticlunr from 'elasticlunr';
import {
  FormControl,
  Input,
  InputLabel,
  InputAdornment,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';

import { updateSearchResults } from '../../store/ActiveSearches/actions';

import { getActiveInvestibleSearches } from '../../store/ActiveSearches/reducer';
import { getSerializedMarketIndexes } from '../../store/SearchIndexes/reducer';
import { withMarketId } from '../PathProps/MarketId';

const styles = theme => ({
  root: {
    margin: theme.spacing.unit,
    marginTop: theme.spacing.unit * 2,
    maxWidth: 384,
  },
});

function InvestibleSearchBox(props) {
  const {
    dispatch,
    marketId,
    serializedIndexes,
    searches,
    classes,
  } = props;

  const marketSearch = searches[marketId];
  const marketSearchQuery = marketSearch ? marketSearch.query : '';

  function doSearch(newQuery) {
    const serializedIndex = serializedIndexes[marketId];
    // if we don't have an index, there's nothing to search against
    if (serializedIndex) {
      const index = elasticlunr.Index.load(serializedIndex);
      const results = index.search(newQuery, { expand: true });
      dispatch(updateSearchResults(newQuery, results, marketId));
    }
  }

  return (
    <FormControl className={classes.root}>
      <InputLabel htmlFor="adornment-search" shrink>Search Investibles</InputLabel>
      <Input
        id="adornment-search"
        type="text"
        value={marketSearchQuery}
        onChange={event => doSearch(event.target.value)}
        endAdornment={(
          <InputAdornment position="end">
            <SearchIcon />
          </InputAdornment>
        )}
      />
    </FormControl>
  );
}

function mapStateToProps(state) {
  const searches = getActiveInvestibleSearches(state.activeSearches);
  const serializedIndexes = getSerializedMarketIndexes(state.searchIndexes);

  return {
    searches,
    serializedIndexes,
  };
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(withTheme()(withMarketId(InvestibleSearchBox))));
