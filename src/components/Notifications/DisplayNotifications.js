import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import CommentSearchResult from '../Search/CommentSearchResult'
import InvestibleSearchResult from '../Search/InvestibleSearchResult'
import MarketSearchResult from '../Search/MarketSearchResult'
import { List, ListItem, Paper, Popper } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { isTinyWindow } from '../../utils/windowUtils';
import { getFullLink } from './Notifications'
import { USER_POKED_TYPE } from '../../constants/notifications'

const useStyles = makeStyles(() => {
  return {
    popper: {
      zIndex: 1500,
      maxHeight: '80%',
      overflow: 'auto',
      marginTop: '1rem'
    },
    link: {
      width: '100%'
    }
  };
});

/**
 * Can add 'double click to go to' the hover text on the notification jar.
 * In addition to results displays after title 'Recent' from a new context which holds notifications from last day.
 * When you get recent notifications you tell the context to remove older than a day.
 * Will need to customize the search results below to for high lighting red (stored in item)
 * and expose remove X borrowed from dismiss text you can click to remove without going there.
 * @param props
 * @returns {JSX.Element}
 * @constructor
 */
function DisplayNotifications(props) {
  const { results, open, setOpen } = props;
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    if (_.isEmpty(anchorEl)) {
      setAnchorEl(document.getElementById('notifications-fab'));
    }
  }, [setAnchorEl, anchorEl]);

  function zeroResults () {
    setOpen(false);
  }

  const afterOnClick = isTinyWindow()? zeroResults : () => {}

  function getSearchResult (item) {
    const {
      marketId,
      investibleId,
      aType,
      commentId,
      pokeType,
    } = item;
    const link = getFullLink(item);
    if (commentId) {
      return (<CommentSearchResult marketId={marketId} commentId={commentId} classes={classes}
                                   afterOnClick={afterOnClick} link={link}/>);
    }
    if (investibleId) {
      return (<InvestibleSearchResult investibleId={investibleId} classes={classes} afterOnClick={afterOnClick}
                                      link={link}/>);
    }
    if (marketId) {
      return (<MarketSearchResult marketId={marketId} classes={classes} afterOnClick={afterOnClick}
                                  link={link}/>);
    }
    if (aType === USER_POKED_TYPE) {
      //TODO handle poke type
      if (pokeType === 'slack_reminder') {

      }
      else if (pokeType === 'upgrade_reminder') {

      }
    }
  }

  function getResults () {
    return (results || []).map((item) => {
      const {
        marketId,
        investibleId,
        userId,
        aType,
        commentId,
        associatedUserId,
        pokeType,
      } = item;
      return (
        <ListItem
          key={`${aType}_${marketId}_${investibleId}_${commentId}_${userId}_${associatedUserId}_${pokeType}`}
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

export default DisplayNotifications;