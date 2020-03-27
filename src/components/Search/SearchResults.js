import React, { useContext, useEffect, useState } from 'react';
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext';
import _ from 'lodash';
import {
  INDEX_COMMENT_TYPE,
  INDEX_INVESTIBLE_TYPE, INDEX_MARKET_TYPE
} from '../../contexts/SearchIndexContext/searchIndexContextMessages';
import CommentSearchResult from './CommentSearchResult';
import InvestibleSearchResult from './InvestibleSearchResult';
import MarketSearchResult from './MarketSearchResult';
import { List, ListItem, Popper, Paper } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles((theme) => {
  return {
    popper: {
      zIndex: 1500,
    }
  };
});

function SearchResults () {
  const [searchResults, setSearchResults] = useContext(SearchResultsContext);
  const [open, setOpen] = useState(false);
  const { results } = searchResults;
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    if (_.isEmpty(anchorEl)) {
      setAnchorEl(document.getElementById('search-box'));
    }
    const shouldBeOpen = !_.isEmpty(results);
    console.log(shouldBeOpen);
    setOpen(shouldBeOpen);

  }, [setAnchorEl, anchorEl, results]);

  function zeroResults () {
    setSearchResults({
      search: '',
      results: []
    });
  }

  function getSearchResult (item) {
    const { id, type, marketId } = item;
    if (type === INDEX_COMMENT_TYPE) {
      return (<CommentSearchResult marketId={marketId} commentId={id}/>);
    }
    if (type === INDEX_INVESTIBLE_TYPE) {
      return (<InvestibleSearchResult investibleId={id}/>);
    }
    if (type === INDEX_MARKET_TYPE) {
      return (<MarketSearchResult marketId={id}/>);
    }
  }

  function getResults () {
    return results.map((item) => {
      const { id } = item;
      return (
        <ListItem
          key={id}
          button
          onClick={zeroResults}
        >
            {getSearchResult(item)}
        </ListItem>
      );
    });
  }

  const placement = 'bottom';

  return (
    <Popper
      open={open}
      id="search-results"
      anchorEl={anchorEl}
      placement={placement}
      className={classes.popper}
    >
      <Paper>
        <List
          dense
        >
          {getResults()}
        </List>
      </Paper>
    </Popper>
  );
}

export default SearchResults;