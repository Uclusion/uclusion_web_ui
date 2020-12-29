import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';

import { Card, List, ListItem, Paper, Popper, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { useIntl } from 'react-intl';
import NotificationMessageDisplay from './NotificationMessageDisplay';

import { DECISION_TYPE, PLANNING_TYPE } from '../../constants/markets';
import GavelIcon from '@material-ui/icons/Gavel';
import AgilePlanIcon from '@material-ui/icons/PlaylistAdd';
import VotingIcon from '@material-ui/icons/Assessment';
import AssignmentIcon from '@material-ui/icons/Assignment';
import StarRateIcon from '@material-ui/icons/StarRate';
import NotificationImportantIcon from '@material-ui/icons/NotificationImportant';

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

function getNameIcon (message, linkType) {
  const { market_type: marketType } = message;
  switch (linkType) {
    case 'INVESTIBLE':
      return marketType === PLANNING_TYPE ? AssignmentIcon : StarRateIcon;
    case 'MARKET':
      return marketType === PLANNING_TYPE ? AgilePlanIcon : marketType === DECISION_TYPE
        ? GavelIcon : VotingIcon;
    default:
      return NotificationImportantIcon;
  }
}

function createMarketView(messages) {
  const markets = [];
  const marketsHash = {};
  messages.forEach((message) => {
    const {
      marketId,
      market_link: marketLink,
      market_type: marketType,
      market_name: marketName,
      investible_name: investibleName,
      investible_link: investibleLink
    } = message;
    if (!marketsHash[marketLink]) {
      if (!marketId) {
        const name = marketType === 'slack' ? 'Notification preferences' : 'Upgrade';
        markets.push({
          name, typeIcon: getNameIcon(message), investibles: [],
          items: [{ message }]
        });
      } else {
        const aMarket = {
          name: marketName, typeIcon: getNameIcon(message, 'MARKET'), investiblesHash: {},
          investibles: [], items: []
        };
        markets.push(aMarket);
        marketsHash[marketLink] = aMarket;
      }
    }
    const market = marketsHash[marketLink];
    if (investibleLink) {
      const investiblesHash = market.investiblesHash;
      if (!investiblesHash[investibleLink]) {
        const anInvestible = {
          name: investibleName, typeIcon: getNameIcon(message, 'INVESTIBLE'),
          items: []
        };
        investiblesHash[investibleLink] = anInvestible;
        market.investibles.push(anInvestible);
      }
      const investible = investiblesHash[investibleLink];
      investible.items.push({ message });
    } else if (market) {
      market.items.push({ message });
    }
  });
  return markets;
}

function DisplayNotifications (props) {
  const { open, setOpen, isRecent, messages, titleId } = props;
  const intl = useIntl();
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState(null);
  const anchorElementId = isRecent ? 'recent-notifications' : 'notifications-fab';

  useEffect(() => {
    if (_.isEmpty(anchorEl)) {
      setAnchorEl(document.getElementById(anchorElementId));
    }
  }, [setAnchorEl, anchorEl, anchorElementId]);

  function zeroResults () {
    setOpen(false);
  }

  const safeMessages = messages || [];

  function getItemResult(item) {
    const {
      link,
    } = item.message;
    return (
      <ListItem
        key={link}
        button
        onClick={zeroResults}
      >
        <NotificationMessageDisplay message={item.message}/>
      </ListItem>
    );
  }

  function getInvestibleResult (investible) {
    const IconComponent = investible.typeIcon;
    return (
      <>
        <Typography style={{ paddingLeft: '1rem', fontStyle: 'italic' }}>
          <IconComponent style={{ marginRight: '6px', height: '16px', width: '16px' }}/>{investible.name}</Typography>
        <div style={{ paddingLeft: '1rem' }}>
          {investible.items.map(investibleItem => getItemResult(investibleItem))}
        </div>
      </>
    );
  }

  function getMessageResults (toDisplay) {
    const markets = createMarketView(toDisplay);
    return markets.map((market) => {
      const IconComponent = market.typeIcon;
      return (
        <Card style={{ border: '1px solid' }}>
          <Typography style={{ paddingRight: '1rem', paddingLeft: '1rem', fontStyle: 'italic' }}>
            <IconComponent style={{ marginRight: '6px', height: '16px', width: '16px' }}/>{market.name}
          </Typography>
          <div style={{ paddingLeft: '1rem', paddingRight: '1rem' }}>
            {market.items.map((item) => getItemResult(item))}
            {market.investibles.map((investible) => getInvestibleResult(investible))}
          </div>
        </Card>
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
      <Paper className={classes.cardContainer}>
        <Typography align="center" className={classes.viewed}>
          {intl.formatMessage({ id: titleId })}
        </Typography>
        <List
          dense
        >
          {getMessageResults(safeMessages)}
        </List>
      </Paper>
    </Popper>
  );
}

DisplayNotifications.propTypes = {
  isRecent: PropTypes.bool,
  messages: PropTypes.arrayOf(PropTypes.object),
  titleId: PropTypes.string,
};

DisplayNotifications.defaultProps = {
  isRecent: false,
  messages: [],
  titleId: 'notifications',
};

export default DisplayNotifications;