import React from 'react';
import { ListItem, ListItemIcon, ListItemText, List, Badge } from '@material-ui/core';
import PropTypes from 'prop-types';
import ForumIcon from '@material-ui/icons/Forum';
import DirectionsRunIcon from '@material-ui/icons/DirectionsRun';
import NotificationsIcon from '@material-ui/icons/Notifications';
import DescriptionOutlinedIcon from '@material-ui/icons/DescriptionOutlined';
import { injectIntl } from 'react-intl';

function NavItems(props) {
  const { history, intl } = props;

  const items = [
    {
      text: intl.formatMessage({ id: 'sidebarNavDialogs' }),
      icon: <ForumIcon />,
      name: 'dialogs',
      link: '/dialogs',
      badge: Badge,
    },
    {
      text: intl.formatMessage({ id: 'sidebarNavActionItems' }),
      icon: <DirectionsRunIcon />,
      name: 'action_items',
      link: '/actionItems',
      badge: Badge,
    },
    {
      text: intl.formatMessage({ id: 'sidebarNavNotifications' }),
      icon: <NotificationsIcon />,
      name: 'notifications',
      link: '/notifications',
      badge: Badge,
    },
    {
      text: intl.formatMessage({ id: 'sidebarNavTemplates' }),
      icon: <DescriptionOutlinedIcon />,
      name: 'templates',
      link: '/templates',
      badge: Badge,
    },
  ];

  function itemOnClick(link) {
    return () => {
      history.push(link);
    };
  }

  function getListItems() {
    return items.map((item) => {
      const { icon, name, text, link, badge } = item;
      const NotificationBadge = badge;
      return (
        <ListItem button key={name} component="nav" onClick={itemOnClick(link)}>
          <NotificationBadge>
            <ListItemIcon>
              {icon}
            </ListItemIcon>
            <ListItemText primary={text} />
          </NotificationBadge>
        </ListItem>
      );
    });
  }

  return (
    <List component="nav">
      {getListItems()}
    </List>
  );
}

NavItems.propTypes = {
  history: PropTypes.object.isRequired,
  intl: PropTypes.object.isRequired,
};

export default injectIntl(NavItems);