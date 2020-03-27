import React, { useContext } from 'react';
import { SearchIndexContext } from '../../contexts/SearchIndexContext/SearchIndexContext';
import { TextField, InputAdornment } from '@material-ui/core';
import _ from 'lodash';
import SearchIcon from '@material-ui/icons/Search';
import { useIntl } from 'react-intl';
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext';

function SearchBox (props) {
  const MAX_RESULTS = 15;
  const intl = useIntl();
  const [index] = useContext(SearchIndexContext);
  const [searchResults, setSearchResults] = useContext(SearchResultsContext);


  function onSearchChange (event) {
    const { value } = event.target;
    // return the first 15 results
    const results = _.take(index.search(value), MAX_RESULTS);
    setSearchResults({
      search: value,
      results
    });
  }

  return (
    <div id='search-box'>
      <TextField
        onChange={onSearchChange}
        value={searchResults.search}
        placeholder={intl.formatMessage({ id: 'searchBoxPlaceholder' })}
        variant="outlined"
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
    </div>
  );
}

export default SearchBox;