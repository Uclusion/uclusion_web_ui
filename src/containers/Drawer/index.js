import React from 'react';

import classNames from 'classnames';
import { withStyles, MuiThemeProvider } from '@material-ui/core/styles';
import withWidth, { isWidthDown } from '@material-ui/core/withWidth';
import Drawer from '@material-ui/core/Drawer';
import DrawerContent from './DrawerContent';
import DrawerHeader from './DrawerHeader';
import Scrollbar from '../../components/Scrollbar';

import { sideBarTheme } from '../../config/themes';
import useDrawerContext from '../../contexts/useDrawerContext';


const drawerWidth = 240;

const styles = theme => ({
  drawerPaper: {
    height: '100vh',
    width: drawerWidth,
    [theme.breakpoints.up('md')]: {
      position: 'relative',
    },
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerPaperOpen: {
    height: '100vh',
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerPaperClose: {
    height: '100vh',
    overflowX: 'hidden',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: theme.spacing.unit * 7,
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing.unit * 9,
    },
  },
  hide: {
    display: 'none',
  },
});

function DrawerLayout(props) {
  const {
    appConfig,
    classes,
    theme,
    width,
    user,
  } = props;

  const { open, toggleDrawerOpen } = useDrawerContext();

  const smDown = isWidthDown('sm', width);
  const Header = appConfig.drawerHeader ? appConfig.drawerHeader : DrawerHeader;

  return (
    <MuiThemeProvider theme={sideBarTheme}>
      <Drawer
        variant={smDown ? 'temporary' : 'permanent'}
        onClose={toggleDrawerOpen}
        anchor={smDown ? undefined : (theme.direction === 'rtl' ? 'right' : 'left')}
        classes={{
          paper: smDown
            ? classes.drawerPaper
            : classNames(
              classes.drawerPaperOpen,
              !open && classes.drawerPaperClose,
              !open && classes.hide,
            ),
        }}
        open={open}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
      >
        <Header user={user}/>
        <Scrollbar>
          <DrawerContent/>
        </Scrollbar>
      </Drawer>
    </MuiThemeProvider>
  );

}

export default withWidth()(withStyles(styles, {withTheme: true} )(DrawerLayout));
