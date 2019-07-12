import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import classNames from 'classnames';
import { withTheme, withStyles, MuiThemeProvider } from '@material-ui/core/styles';
import withWidth, { isWidthDown } from '@material-ui/core/withWidth';
import Drawer from '@material-ui/core/Drawer';
import DrawerContent from './DrawerContent';
import DrawerHeader from './DrawerHeader';
import Scrollbar from '../../components/Scrollbar';
import withAppConfigs from '../../utils/withAppConfigs';
import drawerActions from '../../store/drawer/actions';
import { sideBarTheme } from '../../config/themes';
import { getCurrentUser } from '../../store/Users/reducer';

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


export class DrawerLayout extends Component {
  handleDrawerToggle = () => {
    const { setDrawerOpen, drawerOpen } = this.props;
    setDrawerOpen(!drawerOpen);
  };


  render() {
    const {
      history,
      appConfig,
      classes,
      theme,
      width,
      drawerOpen,
      user,
    } = this.props;

    const smDown = isWidthDown('sm', width);
    const path = history.location.pathname;
    const Header = appConfig.drawerHeader ? appConfig.drawerHeader : DrawerHeader;

    return (
      <MuiThemeProvider theme={sideBarTheme}>
      <Drawer
        variant={smDown ? 'temporary' : 'permanent'}
        onClose={this.handleDrawerToggle}
        anchor={smDown ? undefined : (theme.direction === 'rtl' ? 'right' : 'left')}
        classes={{
          paper: smDown
            ? classes.drawerPaper
            : classNames(
              classes.drawerPaperOpen,
              !drawerOpen && classes.drawerPaperClose,
              !drawerOpen && classes.hide,
            ),
        }}
        open={drawerOpen}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
      >
        <Header user={user}/>
        <Scrollbar>
          <DrawerContent path={path} history={history} />
        </Scrollbar>
      </Drawer>
      </MuiThemeProvider>
    );
  }
}

const mapStateToProps = state => ({
  drawerOpen: state.drawer.open,
  user: getCurrentUser(state.usersReducer),
});

export default connect(mapStateToProps, drawerActions)(
  withRouter(
    withAppConfigs(
      withWidth()(
        withTheme()(
          withStyles(styles, { withTheme: true })(DrawerLayout),
        ),
      ),
    ),
  ),
);
