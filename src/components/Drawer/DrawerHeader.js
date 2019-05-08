import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Paper from '@material-ui/core/Paper';
import React from 'react';
import { withTheme, withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import IconButton from '@material-ui/core/IconButton';
import Hidden from '@material-ui/core/Hidden';
import withWidth from '@material-ui/core/withWidth';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ChevronRight from '@material-ui/icons/ChevronRight';
import withAppConfigs from '../../utils/withAppConfigs';
import { withUserAndPermissions } from '../UserPermissions/UserPermissions';

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

export const DrawerHeader = (props) => {
  const {
    theme,
    intl,

    classes,
    userPermissions,
    setDrawerUseMinified,
    width,
  } = props;
  const { canInvest } = userPermissions;
  const headerHeight = (width === 'xs') ? 40 : 48;

  return (
    <Paper className={classes.paper}>
      <List>
        <ListItem style={{ height: headerHeight }}>
          {!canInvest && (<img className={classes.logo} src="/images/logo-white.svg" alt="logo" />)}
          {!canInvest && (<ListItemText classes={{ primary: classes.listItem }} primary={intl.formatMessage({ id: 'app_name' })} />)}
          <Hidden smDown implementation="css">
            <ListItemSecondaryAction>
              <IconButton className={classes.button} onClick={() => { setDrawerUseMinified(false); }}>

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

export default injectIntl(withWidth()(withTheme()(withAppConfigs(withStyles(styles, { withTheme: true })(withUserAndPermissions(DrawerHeader))))));
