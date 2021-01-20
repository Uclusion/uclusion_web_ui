import React, { useContext, useEffect, useState } from 'react';
import _ from 'lodash';
import CommentSearchResult from '../Search/CommentSearchResult';
import VotingVisitedResult from './VotingVisitedResult';
import InvestibleSearchResult from '../Search/InvestibleSearchResult';
import MarketSearchResult from '../Search/MarketSearchResult';
import { searchStyles } from '../Search/SearchResults';
import { ListItem, Paper, Popper, useTheme, List, Typography } from '@material-ui/core';
import { isTinyWindow } from '../../utils/windowUtils';
import { getCommentRoot } from '../../contexts/CommentsContext/commentsContextHelper';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { useIntl } from 'react-intl';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => {
  return {
    popper: {
      zIndex: 1500,
      maxHeight: '80%',
      overflow: 'auto',
      marginTop: '1rem'
    },
    cardContainer: {
      width: '400px',
    },
    link: {
      width: '100%'
    },
    viewed: {
      paddingTop: '1rem',
      fontWeight: 'bold'
    }
  };
});

function DisplayRecentlyVisited (props) {

  const { open, setOpen } = props;

  const intl = useIntl();
  const theme = useTheme();
  const classes = useStyles(theme);
  const searchClasses = searchStyles(theme);
  const [anchorEl, setAnchorEl] = useState(null);
  const [messagesState] = useContext(NotificationsContext);
  const [commentsState] = useContext(CommentsContext);
  const { recent } = messagesState;

  const anchorElementId = 'recent-notifications';

  useEffect(() => {
    if (_.isEmpty(anchorEl)) {
      setAnchorEl(document.getElementById(anchorElementId));
    }
  }, [setAnchorEl, anchorEl, anchorElementId]);

  function zeroResults () {
    setOpen(false);
  }

  const afterOnClick = isTinyWindow() ? zeroResults : () => {};

  function getSearchResult (item) {
    const {
      market_id: marketId,
      investible_id: investibleId,
      comment_id: commentId,
      associated_object_id: associatedUserId,
      investible_name: investibleName,
      market_name: marketName,
      link,
      link_type: linkType,
      name
    } = item;
    const parentName = (linkType === 'INLINE_STORY_INITIATIVE' || linkType === 'INLINE_STORY_INVESTIBLE')
      ? investibleName : undefined;
    if (linkType.includes('VOTE')) {
      return (<VotingVisitedResult marketId={marketId} containerName={investibleName || marketName}
                                   classes={searchClasses} userId={associatedUserId} afterOnClick={afterOnClick}
                                   link={link}/>);
    } else {
      if (commentId) {
        return (<CommentSearchResult marketId={marketId} commentId={commentId} classes={searchClasses}
                                     afterOnClick={afterOnClick} containerName={investibleName || marketName}
                                     link={link} defaultExcerpt={name}/>);
      }
      if (investibleId) {
        return (<InvestibleSearchResult investibleId={investibleId} classes={searchClasses} afterOnClick={afterOnClick}
                                        link={link} containerName={parentName || marketName}/>);
      }
      if (marketId) {
        return (<MarketSearchResult marketId={marketId} classes={searchClasses} afterOnClick={afterOnClick}
                                    link={link} containerName={marketName}/>);
      }
    }
  }


  // Show each market or investible once across preview and recently viewed lists
  // The email is the gateway to the app and so has full detail
  // Here we are just trying to get you to or back to a page
  const deDupe = {};

  function getRecentResults (toDisplay) {
    return (toDisplay || []).map((item) => {
      const {
        market_id: marketId,
        investible_id: investibleId,
        comment_id: commentId,
      } = item;
      const commentRoot = getCommentRoot(commentsState, marketId, commentId);
      const commentRootId = commentRoot ? commentRoot.id : commentId;
      const key = `${marketId}_${investibleId}_${commentRootId}`;
      if (key in deDupe) {
        return React.Fragment;
      }
      deDupe[key] = true;
      return (
        <ListItem
          key={key}
          button
          onClick={zeroResults}
        >
          {getSearchResult(item)}
        </ListItem>
      );
    });
  }

  return (
    <Popper
      open={open}
      id="search-results"
      anchorEl={anchorEl}
      placement="bottom"
      className={classes.popper}
    >
      <Paper className={classes.cardContainer}>
        {!_.isEmpty(recent) && (
          <>
            <Typography align="center" className={classes.viewed}>
              {intl.formatMessage({ id: 'notificationsRecent' })}
            </Typography>
            <List
              dense
            >
              {getRecentResults(recent)}
            </List>
          </>
        )}
      </Paper>
    </Popper>);
}

export default DisplayRecentlyVisited;