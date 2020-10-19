import React, { useContext, useEffect, useState } from 'react'
import _ from 'lodash'
import InvestibleSearchResult from '../Search/InvestibleSearchResult'
import MarketSearchResult from '../Search/MarketSearchResult'
import { List, ListItem, Paper, Popper, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { isTinyWindow } from '../../utils/windowUtils';
import { getFullLink } from './Notifications'
import { USER_POKED_TYPE } from '../../constants/notifications'
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'
import { useIntl } from 'react-intl'

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

function DisplayNotifications(props) {
  const { results, open, setOpen } = props;
  const intl = useIntl();
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState(null);
  const [messagesState] = useContext(NotificationsContext);
  const { recent } = messagesState;

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
      pokeType,
    } = item;
    const link = getFullLink(item);
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

  // Show each market or investible once across preview and recently viewed lists
  // The email is the gateway to the app and so has full detail
  // Here we are just trying to get you to or back to a page
  const deDupe = {}

  function getResults(toDisplay) {
    return (toDisplay || []).map((item) => {
      const {
        marketId,
        investibleId,
      } = item;
      const key = `${marketId}_${investibleId}`;
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
        {!_.isEmpty(results) && (
          <List
            dense
          >
            {getResults(results)}
          </List>
        )}
        {!_.isEmpty(recent) && (
          <>
            <Typography align="center">
              {intl.formatMessage({ id: 'notificationsRecent' })}
            </Typography>
            <List
              dense
            >
              {getResults(recent)}
            </List>
          </>
        )}
      </Paper>
    </Popper>
  );
}

export default DisplayNotifications;