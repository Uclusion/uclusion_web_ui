import React, { useContext } from 'react'
import { SearchIndexContext } from '../../contexts/SearchIndexContext/SearchIndexContext'
import { InputAdornment, TextField } from '@material-ui/core'
import _ from 'lodash'
import SearchIcon from '@material-ui/icons/Search'
import { useIntl } from 'react-intl'
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext'
import { INDEX_COMMENT_TYPE } from '../../contexts/SearchIndexContext/searchIndexContextMessages'
import { getCommentRoot } from '../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import CloseIcon from '@material-ui/icons/Close';

function SearchBox (props) {
  const MAX_RESULTS = 15;
  const intl = useIntl();
  const [index] = useContext(SearchIndexContext);
  const [searchResults, setSearchResults] = useContext(SearchResultsContext);
  const [commentsState] = useContext(CommentsContext);

  function clearSearch () {
    setSearchResults({
      search: '',
      results: [],
    });
  }

  function isEqual(a, b) {
    if (a.type !== b.type) {
      return false;
    }
    if (a.type === INDEX_COMMENT_TYPE) {
      const commentRootA = getCommentRoot(commentsState, a.marketId, a.id);
      const commentRootB = getCommentRoot(commentsState, b.marketId, b.id);
      return _.isEqual(commentRootA, commentRootB);
    }
    return a.id === b.id && a.marketId === b.marketId;
  }
  function onSearchChange (event) {
    const { value } = event.target;
    const results = _.uniqWith(_.take(index.search(value), MAX_RESULTS), isEqual);
    setSearchResults({
      search: value,
      results
    });
  }

  const endAdornment = _.isEmpty(searchResults.search)? null : (
    <InputAdornment style={{cursor: 'pointer'}} onClick={clearSearch} position="end">
      <CloseIcon/>
    </InputAdornment>
  );

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
          endAdornment,
        }}
      />
    </div>
  );
}

export default SearchBox;