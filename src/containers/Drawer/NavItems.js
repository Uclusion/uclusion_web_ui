import React from 'react';
import { ListItem, ListItemIcon, ListItemText, List, Badge } from '@material-ui/core';
import PropTypes from 'prop-types';
import ForumIcon from '@material-ui/icons/Forum';
import NotificationsIcon from '@material-ui/icons/Notifications';
import DescriptionOutlinedIcon from '@material-ui/icons/DescriptionOutlined';
import { injectIntl } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  listItemIcon: {
    marginRight: 0,
  },
});


function NavItems(props) {
  const { history, intl, classes } = props;

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
        <ListItemIcon className={classes.listItemIcon}>
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
  classes: PropTypes.object.isRequired,
};

export default injectIntl(withStyles(styles)(NavItems));
