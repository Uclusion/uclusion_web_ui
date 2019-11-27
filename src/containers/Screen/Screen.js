import React, { useContext } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import {
  AppBar,
  Toolbar,
  Typography,
  Link,
  Breadcrumbs,
  Container,
  Drawer,
  List,
  Divider,
  IconButton,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import MenuIcon from '@material-ui/icons/Menu';
import Notifications from '../../components/Notifications/Notifications';
import { SidebarContext } from '../../contexts/SidebarContext';

const useStyles = makeStyles((theme) => {
  const drawerWidth = 240;
  return {
    // grow is used to eat up all the space until the right
    grow: {
      flexGrow: 1,
    },
    hidden: {
      display: 'none',
    },
    root: {
      display: 'flex',
      flexDirection: 'column',
    },
    appBar: {
      background: '#ffffff',
      zIndex: theme.zIndex.drawer + 1,
    },
    breadCrumbImage: {
      height: 40,
    },
    sidebarOpen: {
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
    appBarShift: {
      marginRight: drawerWidth,
      width: `calc(100% - ${drawerWidth}px)`,
      transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
    sideActionsClose: {
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      overflowX: 'hidden',
      width: theme.spacing(7) + 1,
      [theme.breakpoints.up('sm')]: {
        width: theme.spacing(9) + 1,
      },
    },
    contentShift: {
      marginRight: drawerWidth,
      width: `calc(100% - ${drawerWidth}px)`,
    },
    content: {},
    toolbar: theme.mixins.toolbar,
    drawer: {
      width: drawerWidth,
      flexShrink: 0,
      whiteSpace: 'nowrap',
    },
    drawerHeader: {
      display: 'flex',
      alignItems: 'center',
      padding: theme.spacing(0, 1),
      ...theme.mixins.toolbar,
      justifyContent: 'flex-start',
    },
  };
});

function Screen(props) {
  const classes = useStyles();

  const {
    breadCrumbs,
    hidden,
    title,
    children,
    toolbarButtons,
    sidebarActions,
  } = props;

  const [sidebarOpen, setSidebarOpen] = useContext(SidebarContext);

  function getSidebar() {
    return (
      <List>
        {sidebarActions}
      </List>
    );
  }

  function generateTitle() {
    if (breadCrumbs) {
      return (
        <Breadcrumbs separator=">">
          {breadCrumbs.map((crumb, index) => (
            <Link key={index} href="#" onClick={crumb.onClick} underline="always" color="primary">
              {crumb.image && <img src={crumb.image} alt={crumb.title} className={classes.breadCrumbImage} />}
              {!crumb.image && crumb.title}
            </Link>
          ))}
          <Typography color="textPrimary">{title}</Typography>
        </Breadcrumbs>
      );
    }
    return (<Typography color="textPrimary">{title}</Typography>);
  }

  return (
    <div className={hidden ? classes.hidden : classes.root}>
      <AppBar
        className={clsx(classes.appBar, {
          [classes.appBarShift]: sidebarOpen,
        })}
        position="fixed"
        hidden={hidden}
      >
        <Toolbar>

          {generateTitle()}
          <div className={classes.grow} />
          {toolbarButtons}
          <Notifications />
          <IconButton
            aria-label="open drawer"
            onClick={() => setSidebarOpen(true)}
            edge="start"
            className={clsx(classes.menuButton, sidebarOpen && classes.hidden)}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        anchor="right"
        className={clsx(classes.drawer, {
          [classes.sidebarOpen]: sidebarOpen,
          [classes.sideActionsClose]: !sidebarOpen,
        })}
        classes={{
          paper: clsx({
            [classes.sidebarOpen]: sidebarOpen,
            [classes.sideActionsClose]: !sidebarOpen,
          }),
        }}
        open={sidebarOpen}
      >
        <div className={classes.toolbar}>
          {sidebarOpen && (
            <IconButton onClick={() => setSidebarOpen(false)}>
              <ChevronRightIcon />
            </IconButton>
          )}
        </div>
        <Divider />
        {getSidebar()}
      </Drawer>
      <Toolbar />
      <div className={clsx(classes.content, {
        [classes.contentShift]: sidebarOpen,
      })}
      >
        <Container>
          {children}
        </Container>
      </div>
    </div>
  );
}

Screen.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  breadCrumbs: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  toolbarButtons: PropTypes.arrayOf(PropTypes.any),
  hidden: PropTypes.bool,
  // eslint-disable-next-line react/forbid-prop-types
  title: PropTypes.any,
  // eslint-disable-next-line react/forbid-prop-types
  children: PropTypes.any,
  // eslint-disable-next-line react/forbid-prop-types
  sidebarActions: PropTypes.arrayOf(PropTypes.element),
  banner: PropTypes.string,
};

Screen.defaultProps = {
  breadCrumbs: [],
  title: '',
  hidden: false,
  toolbarButtons: [],
  banner: undefined,
  sidebarActions: [],
};

export default Screen;
