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
      badgeProps: {variant: 'dot', color: 'secondary' },
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
    },
  ];

  function itemOnClick(link) {
    return () => {
      history.push(link);
    };
  }

  function getItemDisplayContent(item) {
    const { icon, text } = item;
    return (
      <React.Fragment>
        <ListItemIcon>
          {icon}
        </ListItemIcon>
        <ListItemText primary={text} />
      </React.Fragment>
    );
  }


  function getListItems() {
    return items.map((item) => {
      const { link, name, badge, badgeProps } = item;
      const Wrapper = badge;
      return (
        <ListItem button key={name} component="nav" onClick={itemOnClick(link)}>
          { badge && (
            <Wrapper {...props} {...badgeProps} >
              {getItemDisplayContent(item)}
            </Wrapper>
          )}
          {!badge && getItemDisplayContent(item)}
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