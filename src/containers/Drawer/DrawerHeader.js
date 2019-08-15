import React from 'react';

import {
  List,
  ListItem,
  ListItemText,
// ListItemSecondaryAction,
//  Paper,
// IconButton,
  Hidden,
  withWidth,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import withAppConfigs from '../../utils/withAppConfigs';

const styles = theme => ({
  paper: {
    borderRadius: 0,
    margin: 0,
    padding: 0,
  },

  button: {
    // width: 15
  },
  logo: {
    width: 40,
    height: 40,
  },
});

const DrawerHeader = (props) => {
  const {
    intl,
    classes,
    width,
  } = props;
  const headerHeight = (width === 'xs') ? 40 : 48;

  return (
    <div className={classes.paper}>
      <List>
        <ListItem style={{ height: headerHeight }}>
          <img className={classes.logo} src="/images/logo-white.svg" alt="logo"/>
          <ListItemText classes={{ primary: classes.listItem }} primary={intl.formatMessage({ id: 'app_name' })}/>
          <Hidden smDown implementation="css">
          </Hidden>
        </ListItem>
      </List>
    </div>
  );
};

export default injectIntl(
  withWidth()(
    withAppConfigs(
      withStyles(styles, { withTheme: true })(
        DrawerHeader,
      ),
    ),
  ),
);
