import React, { useContext } from 'react';
import { ListItem, ListItemIcon, ListItemText, List, Badge } from '@material-ui/core';
import PropTypes from 'prop-types';
import ForumIcon from '@material-ui/icons/Forum';
import AnnouncementIcon from '@material-ui/icons/Announcement';
import DescriptionOutlinedIcon from '@material-ui/icons/DescriptionOutlined';
import LockIcon from '@material-ui/icons/Lock';
import ChatIcon from '@material-ui/icons/Chat';
import { LibraryAdd } from '@material-ui/icons';
import { injectIntl } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import { useHistory } from 'react-router';
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions';
import { getMarketDetailsForType } from '../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';

const styles = theme => ({
  listItemIcon: {
    marginRight: 0,
  },
});


function NavItems(props) {
  const history = useHistory();
  const [marketsState] = useContext(MarketsContext);
  const marketDetails = getMarketDetailsForType(marketsState, 'PLANNING');
  const { intl, classes } = props;
  const items = [
    {
      text: intl.formatMessage({ id: 'sidebarNavDialogs' }),
      icon: <ForumIcon />,
      name: 'dialogs',
      link: '/dialogs',
    },
    {
      text: intl.formatMessage({ id: 'sidebarNavNotifications' }),
      icon: <AnnouncementIcon />,
      name: 'notifications',
      link: '/notifications',
      badge: Badge,
      badgeProps: { variant: 'dot', color: 'secondary' },
    },
    {
      text: intl.formatMessage({ id: 'sidebarNavAbout' }),
      icon: <DescriptionOutlinedIcon />,
      name: 'about',
      link: '/about',
    },
    {
      text: intl.formatMessage({ id: 'sidebarNewPlanning' }),
      icon: <LibraryAdd />,
      name: 'plan',
      link: '/newplan',
    },
    {
      text: intl.formatMessage({ id: 'sideBarNavTempSignout' }),
      icon: <LockIcon />,
      name: 'tempSignout',
      onClick: () => { localStorage.clear(); },
    },
  ];

  function itemOnClick(item) {
    return () => {
      const { onClick, link } = item;
      if (onClick) {
        onClick();
      }
      if (link) {
        navigate(history, link);
      }
    };
  }

  function getItemDisplayContent(item) {
    const { icon, text } = item;
    return (
      <React.Fragment>
        <ListItemIcon className={classes.listItemIcon}>
          {icon}
        </ListItemIcon>
        <ListItemText primary={text} />
      </React.Fragment>
    );
  }


  function getListItems() {
    return items.map((item) => {
      const { name, badge, badgeProps } = item;
      const Wrapper = badge;
      return (
        <ListItem button key={name} component="nav" onClick={itemOnClick(item)}>
          { badge && (
            <Wrapper {...badgeProps}>
              {getItemDisplayContent(item)}
            </Wrapper>
          )}
          {!badge && getItemDisplayContent(item)}
        </ListItem>
      );
    });
  }

  function getPlanningMarkets() {
    return marketDetails.map((market) => {
      const { name, id } = market;
      const item = { icon: <ChatIcon />, text: name };
      return (
        <ListItem button key={id} component="nav" onClick={() => navigate(history, formMarketLink(id))}>
          {getItemDisplayContent(item)}
        </ListItem>
      );
    });
  }

  return (
    <List component="nav">
      {getListItems()}
      {getPlanningMarkets()}
    </List>
  );
}

NavItems.propTypes = {
  intl: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
};

export default injectIntl(withStyles(styles)(NavItems));
