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
import { TicketIndexContext } from '../../contexts/TicketContext/TicketIndexContext'
import { getTicket } from '../../contexts/TicketContext/ticketIndexContextHelper'
import { formInvestibleLink, navigate } from '../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'

const MAX_ALLOWABLE_RESULTS = 75;

function SearchBox (props) {
  const intl = useIntl();
  const history = useHistory();
  const [index] = useContext(SearchIndexContext);
  const [searchResults, setSearchResults] = useContext(SearchResultsContext);
  const [ticketState] = useContext(TicketIndexContext);
  const [commentsState] = useContext(CommentsContext);

  function clearSearch () {
    setSearchResults({
      search: '',
      results: [],
      resultsFound: 0,
    });
  }

  function isEqualWithComment(a, b) {
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

  function updateIndex(searchQuery){
    // query the index
    const foundResults = index.search(searchQuery);
    // cap the max results we'll consider at 100 for perf reasons
    const limitedResults = _.take(foundResults, MAX_ALLOWABLE_RESULTS);
    //dedup by id
    const results = _.uniqWith(limitedResults, isEqualWithComment);
    setSearchResults({
      search: searchQuery,
      results,
      page: 0,
    });
  }

  function onSearchChange (event) {
    const { value } = event.target;
    const ticket = getTicket(ticketState, value);
    if (ticket) {
      const { marketId, investibleId } = ticket;
      navigate(history, formInvestibleLink(marketId, investibleId));
    } else {
      updateIndex(value);
    }
  }

  return (
    <div id='search-box'>
      <TextField
        style={{backgroundColor: "white", maxWidth: "13rem"}}
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
          endAdornment: (
            <InputAdornment style={{cursor: 'pointer'}}
                            onClick={clearSearch} position="end">
              <CloseIcon style={{color: _.isEmpty(searchResults.search) ? 'white': 'black'}}/>
            </InputAdornment>
          ),
        }}
      />
    </div>
  );
}

export default SearchBox;