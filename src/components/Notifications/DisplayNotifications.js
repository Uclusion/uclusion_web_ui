import React from 'react';
import PropTypes from 'prop-types';
import { Card, List, ListItem, Popper, Typography } from '@material-ui/core';
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
import { BLUE_LEVEL, RED_LEVEL, YELLOW_LEVEL } from '../../constants/notifications';

const useStyles = makeStyles((theme) => {
  return {
    popper: {
      zIndex: 1500,
      maxHeight: '80%',
      overflow: 'auto',
      marginTop: '1rem'
    },
    cardContainer: {
      width: '400px'
    },
    itemContainers: {
      width: '100%',
      paddingLeft: 15,
      paddingRight: 15,
      paddingBottom: 10,
      paddingTop: 10,
      overflowWrap: "break-word"
    },
    titleText: {
      fontWeight: 'bold',
    },
    link: {
      width: '100%'
    },
    messageItem: {
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(1),
    },
    criticalTitleBar: {
      height: '3rem',
      backgroundColor: '#E85757',
      borderRadius: '3px 3px 0px 0px',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    delayableTitleBar: {
      height: '3rem',
      backgroundColor: '#e6e969',
      borderRadius: '3px 3px 0px 0px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    informationalTitleBar: {
      height: '3rem',
      backgroundColor: '#2D9CDB',
      fontWeight: 'bold',
      borderRadius: '3px 3px 0px 0px',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    wrapNicely: {
      overflowWrap: 'break-word'
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

function processDuplicates (page) {
  const { linkMultipleHash, items } = page;
  if (linkMultipleHash) {
    Object.values(linkMultipleHash).forEach((duplicates) => {
      const lenDuplicates = duplicates.length;
      const first = duplicates[0];
      if (lenDuplicates === 1) {
        items.push(first);
      } else {
        const { link_type: linkType, link: firstLink, link_multiple: linkMultiple, type } = first;
        let link = firstLink;
        if (linkType === 'INVESTIBLE' || linkType === 'INLINE_WORKSPACE_INVESTIBLE'
          || linkType === 'INLINE_STORY_INVESTIBLE') {
          // Do not go inside the investible for new options, votes needed or reviews as you won't see the others
          link = linkMultiple;
        }
        const item = { ...first, link, lenDuplicates };
        if (type === 'UNREAD_VOTE') {
          item.dismissMessages = duplicates;
        }
        items.push(item);
      }
    });
  }
}

function createMarketView (messages) {
  const markets = [];
  const marketsHash = {};
  messages.forEach((message) => {
    const {
      market_link: marketLink,
      market_type: marketType,
      market_name: marketName,
      investible_name: investibleName,
      investible_link: investibleLink,
      link_multiple: linkMultiple
    } = message;
    if (!marketsHash[marketLink]) {
      if (marketType === 'slack' || marketType === 'upgrade') {
        const name = marketType === 'slack' ? 'Notification preferences' : 'Upgrade';
        markets.push({
          name, typeIcon: getNameIcon(message), investibles: [],
          items: [message]
        });
      } else {
        const aMarket = {
          name: marketName, typeIcon: getNameIcon(message, 'MARKET'), investiblesHash: {},
          investibles: [], items: [], linkMultipleHash: {}
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
          items: [], linkMultipleHash: {}
        };
        investiblesHash[investibleLink] = anInvestible;
        market.investibles.push(anInvestible);
      }
      const investible = investiblesHash[investibleLink];
      if (!linkMultiple) {
        investible.items.push(message);
      } else {
        if (!investible.linkMultipleHash[linkMultiple]) {
          investible.linkMultipleHash[linkMultiple] = [];
        }
        investible.linkMultipleHash[linkMultiple].push(message);
      }
    } else if (market) {
      if (!linkMultiple) {
        market.items.push(message);
      } else {
        if (!market.linkMultipleHash[linkMultiple]) {
          market.linkMultipleHash[linkMultiple] = [];
        }
        market.linkMultipleHash[linkMultiple].push(message);
      }
    }
  });
  markets.forEach((market) => {
    processDuplicates(market);
    market.investibles.forEach((investible) => processDuplicates(investible));
  });
  return markets;
}

function DisplayNotifications (props) {
  const { open, setOpen, messages, titleId, level, anchorEl } = props;
  const intl = useIntl();
  const classes = useStyles();

  function zeroResults () {
    setOpen(false);
  }

  const safeMessages = messages || [];

  function getItemResult (item) {
    const {
      link,
    } = item;
    return (
      <ListItem
        key={link}
      >
        <NotificationMessageDisplay onLinkClick={zeroResults} message={item}/>
      </ListItem>
    );
  }

  function getInvestibleResult (investible, index) {
    const IconComponent = investible.typeIcon;
    if (!investible.name) {
      return React.Fragment;
    }
    return (
      <React.Fragment key={`${index}${investible.name}`}>
        <Typography style={{ paddingLeft: '1rem', fontStyle: 'italic' }}>
          <IconComponent style={{ marginRight: '6px', height: '16px', width: '16px' }}/>
          {investible.name}
        </Typography>
        <div style={{ paddingLeft: '1rem' }}>
          {investible.items.map(investibleItem => getItemResult(investibleItem))}
        </div>
      </React.Fragment>
    );
  }

  function getMessageResults (toDisplay) {
    const markets = createMarketView(toDisplay);
    return markets.map((market, index) => {
      const IconComponent = market.typeIcon;
      return (
        <Card
          raised
          key={`${index}${level}`}
          className={classes.messageItem}
        >
          <Typography style={{ paddingRight: '1rem', paddingLeft: '1rem', fontStyle: 'italic' }}>
            <IconComponent style={{ marginRight: '6px', height: '16px', width: '16px' }}/>
            {market.name}
          </Typography>
          <div style={{ paddingLeft: '1rem', paddingRight: '1rem' }}>
            {market.items.map((item) => getItemResult(item))}
            {market.investibles.map((investible) => getInvestibleResult(investible, index))}
          </div>
        </Card>
      );
    });
  }

  function getTitleClass () {
    switch (level) {
      case RED_LEVEL:
        return classes.criticalTitleBar;
      case YELLOW_LEVEL:
        return classes.delayableTitleBar;
      case BLUE_LEVEL:
        return classes.informationalTitleBar;
      default:
        return classes.criticalTitleBar;
    }
  }

  return (
    <Popper
      open={open}
      id="search-results"
      anchorEl={anchorEl}
      placement="bottom"
      className={classes.popper}
    >
      <Card
        className={classes.cardContainer}
        variant="outlined"
      >
        <div
          className={getTitleClass()}
        >
          <Typography
            align="center"
            className={classes.titleText}
          >
            {intl.formatMessage({ id: titleId })}
          </Typography>
        </div>
        <div
          className={classes.itemContainers}
        >
          <List
            dense
          >
            {getMessageResults(safeMessages)}
          </List>
        </div>
      </Card>
    </Popper>
  );
}

DisplayNotifications.propTypes = {
  isRecent: PropTypes.bool,
  messages: PropTypes.arrayOf(PropTypes.object),
  titleId: PropTypes.string,
  level: PropTypes.string,
};

DisplayNotifications.defaultProps = {
  isRecent: false,
  messages: [],
  level: '',
  titleId: 'notifications',
};

export default DisplayNotifications;