import React from 'react';
import PropTypes from 'prop-types';
import { Card, List, ListItem, ListItemText, Menu, Typography } from '@material-ui/core'
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
import _ from 'lodash'

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
      overflowWrap: "break-word",
      [theme.breakpoints.down('sm')]: {
        maxWidth: '340px'
      },
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
    displayGroupHeader: {
      fontWeight: 'bold'
    },
    criticalTitleBar: {
      marginTop: theme.spacing(1),
      color: '#E85757'
    },
    delayableTitleBar: {
      marginTop: theme.spacing(1),
      color: 'grey'
    },
    informationalTitleBar: {
      marginTop: theme.spacing(1),
      color: 'grey'
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

function processDuplicates(page) {
  const { linkMultipleHash, items } = page;
  if (linkMultipleHash) {
    Object.values(linkMultipleHash).forEach((duplicates) => {
      const lenDuplicates = duplicates.length;
      const sortedDuplicates = _.orderBy(duplicates, [function (o) {
        const { updated_at: updatedAt } = o;
        return Date.parse(updatedAt);
      }], ['desc']);
      const first = sortedDuplicates[0];
      if (lenDuplicates === 1) {
        items.push(first);
      } else {
        const { link_type: linkType, link: firstLink, link_multiple: linkMultiple, type } = first;
        let link = firstLink;
        if (linkType === 'INVESTIBLE' || linkType === 'INLINE_WORKSPACE_INVESTIBLE'
          || linkType === 'INLINE_STORY_INVESTIBLE' || linkType === 'MARKET_TODO') {
          // Do not go inside the investible for new options, votes needed or reviews as you won't see the others
          link = linkMultiple;
        }
        const item = { ...first, link, lenDuplicates };
        if (type === 'UNREAD_VOTE' || (type === 'UNREAD' && linkType === 'MARKET_TODO')) {
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
    market.items = _.orderBy(market.items, [function (o) {
      const { updated_at: updatedAt } = o;
      return Date.parse(updatedAt);
    }], ['desc']);
    market.investibles.forEach((investible) => {
      processDuplicates(investible);
      investible.items = _.orderBy(investible.items, [function (o) {
        const { updated_at: updatedAt } = o;
        return Date.parse(updatedAt);
      }], ['desc']);
    });
    market.investibles = _.orderBy(market.investibles, [function (o) {
      const { updated_at: updatedAt } = o.items[0];
      return Date.parse(updatedAt);
    }], ['desc']);
  });
  //sort the markets by the newer of first item or first investible item
  return _.orderBy(markets, [function (o) {
    let itemDate;
    if (!_.isEmpty(o.items)) {
      const { updated_at: updatedAt } = o.items[0];
      itemDate = Date.parse(updatedAt);
    }
    let investibleDate;
    if (!_.isEmpty(o.investibles)) {
      const { updated_at: updatedAt } = o.investibles[0].items[0];
      investibleDate = Date.parse(updatedAt);
    }
    if (itemDate > investibleDate) {
      return itemDate;
    }
    return investibleDate;
  }], ['desc']);
}

function DisplayNotifications (props) {
  const { open, setClosed, messages, titleId, level, anchorEl } = props;
  const intl = useIntl();
  const classes = useStyles();

  const safeMessages = messages || [];

  function getItemResult (item, index) {
    const { link } = item

    return (
      <ListItem key={`${index}${link}`} style={{ paddingBottom: '0.5rem' }}>
        <NotificationMessageDisplay onLinkClick={setClosed} message={item}/>
      </ListItem>
    )
  }

  function getInvestibleResult (investible, index) {
    const IconComponent = investible.typeIcon
    if (!investible.name) {
      return React.Fragment
    }
    const listItemKey = !_.isEmpty(investible.linkMultipleHash) ?
      Object.values(investible.linkMultipleHash)[0].link_multiple : investible.name
    return (
      <React.Fragment key={`investible${index}${listItemKey}`}>
        <ListItem key={`${index}${listItemKey}`} style={{ paddingBottom: 0 }}>
          <IconComponent style={{ marginRight: '6px', height: '16px', width: '16px' }}/>
          <ListItemText primary={investible.name} style={{ fontStyle: 'italic' }}/>
        </ListItem>
        {investible.items.map((investibleItem, itemIndex) =>
          getItemResult(investibleItem, `${index}${itemIndex}${listItemKey}`))}
      </React.Fragment>
    )
  }

  function getMessageResults (toDisplay) {
    const markets = createMarketView(toDisplay);
    return markets.map((market, index) => {
      const IconComponent = market.typeIcon;
      return (
        <Card
          key={`${index}${level}${market.id}`}
          className={classes.messageItem}
        >
          <List>
            <ListItem key={market.id} style={{ paddingBottom: 0 }}>
              <IconComponent style={{ marginRight: '6px', height: '16px', width: '16px' }}/>
              <ListItemText primary={market.name} primaryTypographyProps={{ className: classes.displayGroupHeader }}/>
            </ListItem>
            {market.items.map((item, itemIndex) => getItemResult(item, `${index}${itemIndex}${level}`))}
            {market.investibles.map((investible, investibleIndex) =>
              getInvestibleResult(investible, `${index}${investibleIndex}${level}`))}
          </List>
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
    <Menu
      id="profile-menu"
      open={open}
      onClose={setClosed}
      getContentAnchorEl={null}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      anchorEl={anchorEl}
      disableRestoreFocus
    >
      <Card
        className={classes.cardContainer}
        elevation={0}
      >
        <Typography align="center" className={getTitleClass()} variant="h6">
          {intl.formatMessage({ id: titleId })}
        </Typography>
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
    </Menu>
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