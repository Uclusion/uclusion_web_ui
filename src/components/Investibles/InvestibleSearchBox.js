import React from 'react';
import { connect } from 'react-redux';
import elasticlunr from 'elasticlunr';
import { TextField } from '@material-ui/core';

import { updateSearchResults } from '../../store/ActiveSearches/actions';

import { getActiveInvestibleSearches } from '../../store/ActiveSearches/reducer';
import { getSerializedMarketIndexes } from '../../store/SearchIndexes/reducer';
import { withMarketId } from '../PathProps/MarketId';

function InvestibleSearchBox(props) {
  const { dispatch, marketId, serializedIndexes, searches} = props;
  const marketSearch = searches[marketId];
  const marketSearchQuery = marketSearch? marketSearch.query : '';

  function doSearch(newQuery){
    const serializedIndex = serializedIndexes[marketId];
    // if we don't have an index, there's nothing to search against
    if (serializedIndex) {
      const index = elasticlunr.Index.load(serializedIndex);
      const results = index.search(newQuery, { expand: true });
      dispatch(updateSearchResults(newQuery, results, marketId));
    }
  }

  return (
    <TextField value={marketSearchQuery} onChange={event => doSearch(event.target.value)}/>
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

export default connect(mapStateToProps, mapDispatchToProps)(withMarketId(InvestibleSearchBox));
