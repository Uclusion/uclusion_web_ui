import React, { useState } from 'react';
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
  Divider,
  IconButton
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import Notifications from '../../components/Notifications/Notifications';
import CommentsSidebarActions from './CommentsSidebarActions';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import MenuIcon from '@material-ui/icons/Menu';


const useStyles = makeStyles((theme) => {
  let drawerWidth = 350;
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
      zIndex: theme.zIndex.drawer + 1
    },
    breadCrumbImage: {
      height: 40,
    },
    sideActionsOpen: {
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

    commentsSidebar,
    sidebarActions,
    sidebarOpen,
    marketId,
    investible,
  } = props;
  const [sideActionsOpen, setSideActionsOpen] = useState(sidebarOpen);
  const drawerEmpty = !sidebarActions && !commentsSidebar
  const drawerOpen = !drawerEmpty && sideActionsOpen;

  function generateTitle() {
    if (breadCrumbs) {
      return (
        <Breadcrumbs separator=">">
          {breadCrumbs.map((crumb, index) => {
            return (
              <Link key={index} color="inherit" href="#" onClick={crumb.onClick}>
                {crumb.image && <img src={crumb.image} alt={crumb.title} className={classes.breadCrumbImage}/>}
                {!crumb.image && crumb.title}
              </Link>
            );
          })}
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
          [classes.appBarShift]: drawerOpen,
        })}
        position="fixed"
        hidden={hidden}
      >
        <Toolbar>

          {generateTitle()}
          <div className={classes.grow}/>
          {toolbarButtons}
          <Notifications/>
          <IconButton
            aria-label="open drawer"
            onClick={() => setSideActionsOpen(true)}
            edge="start"
            disabled={drawerEmpty}
            className={clsx(classes.menuButton, drawerOpen && classes.hidden)}
          >
            <MenuIcon/>
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        anchor="right"
        className={clsx(classes.drawer, {
          [classes.sideActionsOpen]: drawerOpen,
          [classes.sideActionsClose]: !drawerOpen,
        })}
        classes={{
          paper: clsx({
            [classes.sideActionsOpen]: drawerOpen,
            [classes.sideActionsClose]: !drawerOpen,
          }),
        }}
        open={drawerOpen}
      >
        <div className={classes.toolbar}>
          {drawerOpen && (<IconButton onClick={() => setSideActionsOpen(false)}>
            <ChevronRightIcon/>
          </IconButton>)}
        </div>
        <Divider/>
        {sidebarActions &&
        React.cloneElement(sidebarActions, { amOpen: drawerOpen, setAmOpen: sideActionsOpen })
        }
        {marketId && commentsSidebar && (
          <CommentsSidebarActions
            amOpen={drawerOpen}
            setAmOpen={setSideActionsOpen}
            investible={investible}
            marketId={marketId}
          />
        )}
      </Drawer>
      <Toolbar/>
      <div className={clsx(classes.content, {
        [classes.contentShift]: drawerOpen,
      })}>
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
  sidebarActions: PropTypes.any,
  banner: PropTypes.string,
  commentsSidebar: PropTypes.bool,
  sidebarOpen: PropTypes.bool,

};

Screen.defaultProps = {
  breadCrumbs: [],
  title: '',
  hidden: false,
  toolbarButtons: [],
  banner: undefined,
  sidebarActions: undefined,
  commentsSidebar: false,
  sidebarOpen: false,
};

export default Screen;
