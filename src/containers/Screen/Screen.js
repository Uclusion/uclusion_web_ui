import React, { useContext, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
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
  Paper,
  Popper,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import MenuIcon from '@material-ui/icons/Menu';
import { useHistory } from 'react-router';
import Notifications from '../../components/Notifications/Notifications';
import { SidebarContext } from '../../contexts/SidebarContext';
import { createTitle } from '../../utils/marketIdPathFunctions';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { OnlineStateContext } from '../../contexts/OnlineStateContext';
import { useIntl } from 'react-intl';

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
    container: {
      background: '#ffffff',
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
    menuButton: {
      marginRight: theme.spacing(2),
    },
    appBarShift: {
      marginLeft: drawerWidth,
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
      marginLeft: drawerWidth,
      width: `calc(100% - ${drawerWidth}px)`,
    },
    content: {},
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
      justifyContent: 'flex-end',
    },
    elevated: {
      zIndex: 99,
    }
  };
});

function scroller(location) {
  const { hash } = location;
  if (hash) {
    const target = hash.substring(1, hash.length);
    if (target) {
      const element = document.getElementById(target);
      if (element) {
        element.scrollIntoView();
      }
    }
  }
}

function Screen(props) {
  const classes = useStyles();
  // enable scrolling based on hash
  const history = useHistory();
  const [messagesState] = useContext(NotificationsContext);
  const { location } = history;
  // console.log(history);
  history.listen(scroller);
  const screenRef = useRef(null);

  const intl = useIntl();

  const {
    breadCrumbs,
    hidden,
    title,
    children,
    toolbarButtons,
    sidebarActions,
    tabTitle,
  } = props;
  let prePendWarning = '';
  if (messagesState) {
    const { messages } = messagesState;
    let hasYellow = false;
    messages.forEach((message) => {
      const { level } = message;
      if (level === 'RED') {
        prePendWarning += '*';
      } else {
        hasYellow = true;
      }
    });
    if (prePendWarning.length === 0 && hasYellow) {
      prePendWarning = '*';
    }
  }

  const [firstRender, setFirstRender] = useState(true);

  useEffect(() => {
    if (firstRender) {
      scroller(location);
      setFirstRender(false);
    }
    return () => {
    };
  }, [firstRender, location]);

  const [sidebarOpen, setSidebarOpen] = useContext(SidebarContext);
  const [online] = useContext(OnlineStateContext);

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
              {crumb.image && <img src={crumb.image} alt={crumb.title} className={classes.breadCrumbImage}/>}
              {!crumb.image && createTitle(crumb.title, 25)}
            </Link>
          ))}
          <Typography color="textPrimary">{createTitle(title, 25)}</Typography>
        </Breadcrumbs>
      );
    }
    return (<Typography color="textPrimary">{createTitle(title, 30)}</Typography>);
  }

  return (
    <div
         className={hidden ? classes.hidden : classes.root}
    >
      {!hidden && (
        <Helmet>
          <title>{`${prePendWarning}Uclusion | ${createTitle(tabTitle, 11)}`}</title>
        </Helmet>
      )}
      {!hidden && (
        <Popper
          className={classes.elevated}
          open={!online}
          anchorEl={screenRef.current}
          placement="top"
          modifiers={{
            flip: {
              enabled: true,
            },
            preventOverflow: {
              enabled: true,
              boundariesElement: 'window',
            },
          }}
        >
          <Paper>
            <Typography>
              {intl.formatMessage({ id: 'warningOffline' })}
            </Typography>
          </Paper>
        </Popper>
      )}

      <AppBar
        ref={screenRef}
        className={clsx(classes.appBar, {
          [classes.appBarShift]: sidebarOpen,
        })}
        position="fixed"
        hidden={hidden}
      >
        <Toolbar>
          <IconButton
            aria-label="open drawer"
            onClick={() => setSidebarOpen(true)}
            edge="start"
            className={clsx(classes.menuButton, sidebarOpen && classes.hidden)}
          >
            <MenuIcon/>
          </IconButton>
          {generateTitle()}
          <div className={classes.grow}/>
          {toolbarButtons}
          <Notifications/>

        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        anchor="left"
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
        <div className={classes.drawerHeader}>
          {sidebarOpen && (
            <IconButton onClick={() => setSidebarOpen(false)}>
              <ChevronLeftIcon/>
            </IconButton>
          )}
        </div>
        <Divider/>
        {getSidebar()}
      </Drawer>
      <Toolbar/>
      <div className={clsx(classes.content, {
        [classes.contentShift]: sidebarOpen,
      })}
      >
        <Container
          className={classes.container}
        >
          {title && title.substring && (
            <AppBar
              className={classes.subHeader}
              position="static"
            >
              <Toolbar>
                <Typography>
                  {title}
                </Typography>
              </Toolbar>
            </AppBar>
          )}
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
  tabTitle: PropTypes.string.isRequired,
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
