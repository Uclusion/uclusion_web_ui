import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { withTheme, withStyles } from '@material-ui/core/styles';
import elasticlunr from 'elasticlunr';
import {
  FormControl,
  Input,
  InputLabel,
  InputAdornment, FormHelperText,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import { updateSearchResults } from '../../store/ActiveSearches/actions';
import { getActiveInvestibleSearches } from '../../store/ActiveSearches/reducer';
import { getSerializedMarketIndexes } from '../../store/SearchIndexes/reducer';
import { withMarketId } from '../PathProps/MarketId';
import { injectIntl } from 'react-intl';

const styles = theme => ({
  root: {
    margin: theme.spacing.unit,
    marginTop: theme.spacing.unit * 2,
    maxWidth: 384,
  },
});

function InvestibleSearchBox(props) {
  const [searchQuery, setSearchQuery] = useState(undefined);
  const {
    dispatch,
    marketId,
    serializedIndexes,
    searches,
    classes,
    intl,
  } = props;

  const marketSearch = searches[marketId];
  const marketSearchQuery = marketSearch ? marketSearch.query : '';

  function doSearch(newQuery) {
    setSearchQuery(newQuery);
  }

  useEffect(() => {
    if (marketId && searchQuery !== undefined) {
      const serializedIndex = serializedIndexes[marketId];
      // if we don't have an index, there's nothing to search against
      if (serializedIndex) {
        const index = elasticlunr.Index.load(JSON.parse(serializedIndex));
        // Without this working around "we" returns nothing but "web" returns things - see https://github.com/olivernn/lunr.js/issues/38
        // However in that bug they removed stemmer and I am removing stopWordFilter
        // BUT STOP WORDS ARE STILL IN EFFECT
        // on the search results - this just removes the processing of stop words from the input
        index.pipeline._queue = index.pipeline._queue.filter(lunrPipeLineFunction => lunrPipeLineFunction.label !== 'stopWordFilter');
        const results = index.search(searchQuery, { expand: true });
        dispatch(updateSearchResults(searchQuery, results, marketId));
      }
    }
    return () => {};
  }, [marketId, searchQuery]);

  return (
    <FormControl className={classes.root}>
      <InputLabel htmlFor="adornment-search" shrink>{intl.formatMessage({ id: 'searchBoxLabel' })}</InputLabel>
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
      <FormHelperText>{intl.formatMessage({ id: 'searchBoxHelper' })}</FormHelperText>
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

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(withTheme()(withMarketId(injectIntl(InvestibleSearchBox)))));
