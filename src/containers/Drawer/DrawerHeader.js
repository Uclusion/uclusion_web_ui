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

const styles = theme => ({
  paper: {
    backgroundColor: theme.palette.primary.dark,
    borderRadius: 0,
    margin: 0,
    padding: 0,
  },
  listItem: {
    color: theme.palette.primary.contrastText,
  },
  icon: {
    color: theme.palette.primary.contrastText,
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
  const { canInvest } = user.market_presence.flags;
  const headerHeight = (width === 'xs') ? 40 : 48;

  return (
    <Paper className={classes.paper}>
      <List>
        <ListItem style={{ height: headerHeight }}>
          {!canInvest && (<img className={classes.logo} src="/images/logo-white.svg" alt="logo" />)}
          {!canInvest && (<ListItemText classes={{ primary: classes.listItem }} primary={intl.formatMessage({ id: 'app_name' })} />)}
          <Hidden smDown implementation="css">
            <ListItemSecondaryAction>
              <IconButton className={classes.button} onClick={() => { setDrawerOpen(false); }}>

                {theme.direction === 'rtl' && <ChevronRight classes={{ root: classes.icon }} />}
                {theme.direction !== 'rtl' && <ChevronLeft classes={{ root: classes.icon }} />}

              </IconButton>
            </ListItemSecondaryAction>
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
