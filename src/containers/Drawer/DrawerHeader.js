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

const styles = {
  paper: {
    borderRadius: 0,
    margin: 0,
    padding: 0,
  },


  logo: {
    marginLeft: 'auto',
    marginRight: 'auto',
    width: '75%',
    display: 'block',
  },
};

const DrawerHeader = (props) => {
  const {
    intl,
    classes,
    width,
  } = props;
  const headerHeight = (width === 'xs') ? 40 : 48;

  return (
    <div className={classes.paper}>
      <img className={classes.logo} src="/images/Uclusion_Wordmark_Drawer_Header.png" alt="logo" />
    </div>
  );
};

export default injectIntl(
  withWidth()(
    withAppConfigs(
      withStyles(styles)(
        DrawerHeader,
      ),
    ),
  ),
);
