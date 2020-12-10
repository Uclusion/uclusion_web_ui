import React, { useContext, useEffect, useState } from 'react';
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext';
import _ from 'lodash';
import {
  INDEX_COMMENT_TYPE,
  INDEX_INVESTIBLE_TYPE,
  INDEX_MARKET_TYPE
} from '../../contexts/SearchIndexContext/searchIndexContextMessages';
import CommentSearchResult from './CommentSearchResult';
import InvestibleSearchResult from './InvestibleSearchResult';
import MarketSearchResult from './MarketSearchResult';
import { List, ListItem, Paper, Popper, Typography, useTheme } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { isTinyWindow } from '../../utils/windowUtils';
import { useIntl } from 'react-intl';
import Button from '@material-ui/core/Button';

export const searchStyles = makeStyles((theme) => {
  return {
    popper: {
      zIndex: 1500,
      maxHeight: '90%',
      overflow: 'auto',
      marginTop: '1rem'
    },
    cardContainer: {
      width: '400px',
    },
    link: {
      width: '100%'
    },
    searchResultHeader: {},
    marketSearchName: {
      fontWeight: 'bold',
      fontStyle: 'italic',
    },
    investibleSearchTitle: {},
    investibleSearchName: {
      fontWeight: 'bold',
      fontStyle: 'italic',
    },
    marketCard: {
      border: '1px solid',
      padding: theme.spacing(1),
    },
    investibleCard: {
      border: '1px solid',
      padding: theme.spacing(1),
    },
    issueCard: {
      border: '1px solid',
      backgroundColor: '#E85757',
      color: '#ffffff',
      padding: theme.spacing(1),
    },
    questionCard: {
      border: '1px solid',
      backgroundColor: '#2F80ED',
      color: '#ffffff',
      padding: theme.spacing(1),
    },
    suggestionCard: {
      border: '1px solid',
      backgroundColor: '#e6e969',
      padding: theme.spacing(1),
    },
    todoCard: {
      border: '1px solid',
      backgroundColor: '#F29100',
      color: '#ffffff',
      padding: theme.spacing(1),
    },
    reportCard: {
      border: '1px solid',
      backgroundColor: '#73B76C',
      color: '#ffffff',
      padding: theme.spacing(1),
    },
    justifyCard: {
      border: '1px solid',
      backgroundColor: '#9B51E0',
      padding: theme.spacing(1),
      color: '#ffffff',
    },
    commentSearchTitle: {},
    commentSearchName: {
      fontWeight: 'bold',
    },
    commentSearchExcerpt: {
      fontStyle: 'italic',
    },
    searchUIContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'baseline',
      width: '100%',
    },
    searchUIMiddle: {
      display: 'block',
      textAlign: 'center',
      flexGrow: 1,
    }
  };
});

// 10 is a good balance of useability and screen size
const PAGE_SIZE = 10;

function SearchResults () {
  const [searchResults, setSearchResults] = useContext(SearchResultsContext);
  const [open, setOpen] = useState(false);
  const { results, page, search } = searchResults;
  const intl = useIntl();
  const theme = useTheme();
  const classes = searchStyles(theme);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    if (_.isEmpty(anchorEl)) {
      setAnchorEl(document.getElementById('search-box'));
    }
    const shouldBeOpen = !_.isEmpty(results);
    setOpen(shouldBeOpen);

  }, [setAnchorEl, anchorEl, results]);


  function nextPage() {
    setSearchResults({
      search,
      results,
      page: page + 1,
    });
  }
  function previousPage() {
    setSearchResults({
      search,
      results,
      page: page - 1,
    });
  }

  function zeroResults () {
    setSearchResults({
      search: '',
      results: [],
      page: 0,
    });
  }

  const afterOnClick = isTinyWindow() ? zeroResults : () => {};

  function getSearchResult (item) {
    const { id, type, marketId } = item;
    if (type === INDEX_COMMENT_TYPE) {
      return (<CommentSearchResult marketId={marketId} commentId={id} classes={classes} afterOnClick={afterOnClick}/>);
    }
    if (type === INDEX_INVESTIBLE_TYPE) {
      return (<InvestibleSearchResult investibleId={id} classes={classes} afterOnClick={afterOnClick}/>);
    }
    if (type === INDEX_MARKET_TYPE) {
      return (<MarketSearchResult marketId={id} classes={classes} afterOnClick={afterOnClick}/>);
    }
  }

  function createSearchNavigation () {
    const pageStart = page * PAGE_SIZE;
    const pageEnd = Math.min((pageStart + PAGE_SIZE), results.length);
    // how many pages do we have?
    const pages = Math.ceil((results.length * 1.0) / PAGE_SIZE);
    // do I need to display the pagination menu?
    const firstPage = pageStart === 0;
    const resultsRemaining = pageEnd < results.length;
    const needPagenation = pages > 1;
    // no pages in results? No UI needed
    if (!needPagenation) {
      return <React.Fragment key="nullItem"/>;
    }
    return (
      <ListItem
        key="overflow"
        dense
      >
        <div className={classes.searchUIContainer}>
          {<Button dense disabled={firstPage} onClick={previousPage}>{intl.formatMessage({id: 'SearchResultsPrevious'})}</Button>}
          {<Typography className={classes.searchUIMiddle}>{intl.formatMessage({ id: 'SearchResultsOverflow' }, { page: (page + 1), pages })}</Typography>}
          {<Button disabled={!resultsRemaining} onClick={nextPage}>{intl.formatMessage({id: 'SearchResultsNext'})}</Button>}
        </div>
      </ListItem>
    );
  }

  function getResults () {
    const pageStart = page * PAGE_SIZE;
    const pageEnd = Math.min((pageStart + PAGE_SIZE), results.length);
    //_.range does NOT include the end, so this is safe
    const pageIndexes = _.range(pageStart, pageEnd);

    const resultUIElements = pageIndexes.map((index) => {
      const item = results[index];
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
    // add our nav ui
    resultUIElements.push(createSearchNavigation());
    return resultUIElements;
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
      <Paper className={classes.cardContainer}>
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