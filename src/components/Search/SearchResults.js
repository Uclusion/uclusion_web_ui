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
import { List, ListItem, Popper, ListItemText } from '@material-ui/core';

function SearchResults () {
  const [searchResults, setSearchResults] = useContext(SearchResultsContext);
  const [open, setOpen] = useState(false);
  const { results } = searchResults;

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
          onClick={zeroResults}
        >
          <ListItemText>
            {getSearchResult(item)}
          </ListItemText>
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
    >
      <div>
        <List>
          {getResults()}
        </List>
      </div>
    </Popper>
  );
}

export default SearchResults;