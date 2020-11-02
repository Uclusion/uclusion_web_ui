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
import { List, ListItem, Paper, Popper, useTheme } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { isTinyWindow } from '../../utils/windowUtils';
import { useIntl } from 'react-intl';

export const searchStyles = makeStyles((theme) => {
  return {
    popper: {
      zIndex: 1500,
      maxHeight: '90%',
      overflow: 'auto',
      marginTop: '1rem'
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
    }

  };
});

function SearchResults () {
  const [searchResults, setSearchResults] = useContext(SearchResultsContext);
  const [open, setOpen] = useState(false);
  const { results, resultsFound } = searchResults;
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

  function zeroResults () {
    setSearchResults({
      search: '',
      results: [],
      resultsFound: 0,
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

  function getResults () {
    const overflow = resultsFound - results.length;
    const resultUIElements = results.map((item) => {
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
    //did we have results that we can't display?
    console.error(overflow);
    if (overflow > 0) {
      resultUIElements.push((
        <ListItem
          key="overflow"
          dense
          disabled
        >
          {intl.formatMessage({ id: 'SearchResultsOverflow' }, { overflow })}
        </ListItem>
      ));
    }
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