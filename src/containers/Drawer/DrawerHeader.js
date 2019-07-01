import React from 'react';
import { connect } from 'react-redux';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  IconButton,
  Hidden,
  withWidth,
} from '@material-ui/core';
import { withTheme, withStyles } from '@material-ui/core/styles';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ChevronRight from '@material-ui/icons/ChevronRight';
import { injectIntl } from 'react-intl';
import withAppConfigs from '../../utils/withAppConfigs';
import drawerActions from '../../store/drawer/actions';
import { getFlags } from '../../utils/userFunctions'

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
    theme,
    intl,
    classes,
    setDrawerOpen,
    width,
    user,
  } = props;
  const { canInvest } = getFlags(user);
  const headerHeight = (width === 'xs') ? 40 : 48;

  return (
    <Paper className={classes.paper}>
      <List>
        <ListItem style={{ height: headerHeight }}>
          <img className={classes.logo} src="/images/logo-color.svg" alt="logo" />
          <ListItemText classes={{ primary: classes.listItem }} primary={intl.formatMessage({ id: 'app_name' })} />
          <Hidden smDown implementation="css">
          </Hidden>
        </ListItem>
      </List>
    </Paper>
  );
};

export default connect(null, drawerActions)(
  injectIntl(
    withWidth()(
      withTheme()(
        withAppConfigs(
          withStyles(styles, { withTheme: true })(
            DrawerHeader,
          ),
        ),
      ),
    ),
  ),
);
