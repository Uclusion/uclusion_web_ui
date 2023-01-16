import React, { useContext } from 'react'
import { SearchIndexContext } from '../../contexts/SearchIndexContext/SearchIndexContext'
import { InputAdornment, TextField } from '@material-ui/core'
import _ from 'lodash'
import SearchIcon from '@material-ui/icons/Search'
import { useIntl } from 'react-intl'
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext'
import {
  INDEX_COMMENT_TYPE,
  INDEX_INVESTIBLE_TYPE,
} from '../../contexts/SearchIndexContext/searchIndexContextMessages'
import { getComment, getCommentRoot } from '../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import CloseIcon from '@material-ui/icons/Close';
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'

function SearchBox () {
  const intl = useIntl();
  const [index] = useContext(SearchIndexContext);
  const [searchResults, setSearchResults] = useContext(SearchResultsContext);
  const [commentsState] = useContext(CommentsContext);
  const [marketsState] = useContext(MarketsContext);
  const inputRef = React.useRef(null);

  function getInvestibleParents(result) {
    const parentResults = [];
    const parentMarket = getMarket(marketsState, result.marketId) || {}; //Protect against corrupt or loading
    const { parent_comment_id: inlineParentCommentId, parent_comment_market_id: parentMarketId } = parentMarket;
    if (inlineParentCommentId) {
      const comment = getComment(commentsState, parentMarketId, inlineParentCommentId);
      if (!comment) {
        // Parent comment was deleted
        return parentResults;
      }
      // Need to push this market because it is not in the results
      parentResults.push(parentMarketId);
      parentResults.push(inlineParentCommentId);
      if (comment.investible_id) {
        parentResults.push(comment.investible_id);
      }
    }
    return parentResults;
  }

  function getCommentParents(result) {
    const parentResults = [];
    const rootComment = getCommentRoot(commentsState, result.marketId, result.id);
    if (!rootComment) {
      // Somewhere on path to root a parent was deleted
      return undefined;
    }
    if (rootComment.id !== result.id) {
      parentResults.push(rootComment.id);
    }
    if (rootComment.investible_id) {
      parentResults.push(rootComment.investible_id);
      parentResults.push(...getInvestibleParents({id: rootComment.investible_id, marketId: result.marketId}));
    }
    return parentResults;
  }

  function getParentResults(results) {
    const parentResults = [];
    const removed = [];
    results.forEach((result) => {
      if (result.type === INDEX_COMMENT_TYPE) {
        const parents = getCommentParents(result);
        if (!parents) {
          removed.push(result);
        } else {
          parentResults.push(...parents);
        }
      } else if (result.type === INDEX_INVESTIBLE_TYPE) {
        parentResults.push(...getInvestibleParents(result));
      }
    });
    return {parentResults, removed};
  }

  function updateIndex(searchQuery){
    // query the index
    const rawResults = index.search(searchQuery) || [];
    // parents in a different hash so they can appear on the page but not be counted as results
    const {parentResults, removed} = getParentResults(rawResults);
    const results = rawResults.filter((result) => !removed.find((item) => item.id === result.id));
    setSearchResults({
      search: searchQuery,
      results,
      parentResults
    });
  }

  let timeout;

  function onSearchChange (event) {
    const { value } = event.target;
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(function () {
      updateIndex(value);
    }, 2000);
  }

  function clearSearch() {
    if (timeout) {
      clearTimeout(timeout);
    }
    inputRef.current.value = '';
    setSearchResults({
      search: '',
      results: [],
      parentResults: [],
    });
  }

  return (
    <div id='search-box' onClick={(event) => event.stopPropagation()} style={{flex: 1}}>
      <TextField
        style={{backgroundColor: '#e5edee', width: '100%', minWidth: '10rem'}}
        onChange={onSearchChange}
        onKeyPress={(ev) => {
          if (ev.key === 'Enter') {
            // Do code here
            updateIndex(ev.target.value);
            ev.preventDefault();
          }
        }}
        inputRef={inputRef}
        placeholder={intl.formatMessage({ id: 'searchBoxPlaceholder' })}
        variant="outlined"
        size="small"
        defaultValue={searchResults.search}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: (
            _.isEmpty(searchResults.search) ? undefined :
            <InputAdornment style={{cursor: 'pointer'}}
                            onClick={clearSearch} position="end">
              <CloseIcon htmlColor='black' />
            </InputAdornment>
          ),
        }}
      />
    </div>
  );
}

export default SearchBox;