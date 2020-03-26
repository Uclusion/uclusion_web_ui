import React, { useContext, useState } from 'react';
import { SearchIndexContext } from '../../contexts/SearchIndexContext/SearchIndexContext';
import { TextField, Card, Typography } from '@material-ui/core';
import {
  INDEX_COMMENT_TYPE,
  INDEX_INVESTIBLE_TYPE, INDEX_MARKET_TYPE
} from '../../contexts/SearchIndexContext/searchIndexContextMessages';
import _ from 'lodash';
import CommentSearchResult from './CommentSearchResult';
import InvestibleSearchResult from './InvestibleSearchResult';
import MarketSearchResult from './MarketSearchResult';

function SearchBox (props) {
  const MAX_RESULTS = 15;
  const [index] = useContext(SearchIndexContext);
  const [currentSearch, setCurrentSearch] = useState('');
  const [currentResults, setCurrentResults] = useState([]);

  function onSearchChange (event) {
    const { value } = event.target;
    setCurrentSearch(value);
    // return the first 15 results
    const results = _.take(index.search(value), MAX_RESULTS);
    setCurrentResults(results);
  }

  function getResults () {
    return currentResults.map((item) => {
      const { id, type, marketId } = item;
      if (type === INDEX_COMMENT_TYPE) {
        return (<CommentSearchResult key={id} marketId={marketId} commentId={id}/>)
      }
      if (type === INDEX_INVESTIBLE_TYPE) {
        return (<InvestibleSearchResult key={id} investibleId={id}/>);
      }
      if (type === INDEX_MARKET_TYPE) {
        return (<MarketSearchResult key={id} marketId={id}/>)
      }
      return (
        <Card key={id}>
          <Typography>{id}</Typography>
          <Typography>{type}</Typography>
        </Card>
      );
    });
  }

  return (
    <div>
      <TextField
        onChange={onSearchChange}
        value={currentSearch}
      />
      {getResults()}
    </div>
  );
}

export default SearchBox;