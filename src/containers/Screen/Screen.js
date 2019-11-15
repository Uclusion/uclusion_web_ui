import React, { useState } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { AppBar, Toolbar, Typography, Link, Breadcrumbs, Container, Drawer } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import Notifications from '../../components/Notifications/Notifications';
import CommentsSidebarActions from './CommentsSidebarActions';

const drawerWidth = 300;

const useStyles = makeStyles((theme) => {
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
    caption: {
      textAlign: 'center',
      height: theme.spacing(2),
      padding: theme.spacing(0.5),
      backgroundColor: theme.palette.secondary.main,
      color: 'white',
    },
    sideActionsOpen: {
      width: drawerWidth,
      transition: theme.transitions.create('width', {
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
    toolbar: theme.mixins.toolbar,
    drawer: {},
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


  function generateTitle() {
    if (breadCrumbs) {
      return (
        <Breadcrumbs separator=">">
          {breadCrumbs.map((crumb, index) => {
            return (
              <Link key={index} color="inherit" href="#" onClick={crumb.onClick}>
                {crumb.image && <img src={crumb.image} alt={crumb.title} className={classes.breadCrumbImage} />}
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
        className={classes.appBar}
        position="fixed"
        hidden={hidden}
      >
        <Toolbar>
          {generateTitle()}
          <div className={classes.grow} />
          {toolbarButtons}
          <Notifications />
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        anchor="right"
        className={clsx(classes.drawer, {
          [classes.sideActionsOpen]: sideActionsOpen,
          [classes.sideActionsClose]: !sideActionsOpen,
        })}
        classes={{
          paper: clsx({
            [classes.sideActionsOpen]: sideActionsOpen,
            [classes.sideActionsClose]: !sideActionsOpen,
          }),
        }}
        open={sideActionsOpen}
      >
        <div className={classes.toolbar} />
        {sidebarActions &&
          React.cloneElement(sidebarActions, {amOpen: sideActionsOpen, setAmOpen: sideActionsOpen })
        }
        {commentsSidebar && (
          <CommentsSidebarActions
            amOpen={sideActionsOpen}
            setAmOpen={setSideActionsOpen}
            investible={investible}
            marketId={marketId}
          />
        )}
      </Drawer>
      <Toolbar />

      <Container>
        {children}
      </Container>
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
  title: PropTypes.any.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  children: PropTypes.any,
  // eslint-disable-next-line react/forbid-prop-types
  sidebarActions: PropTypes.arrayOf(PropTypes.any),
  banner: PropTypes.string,
  commentsSidebar: PropTypes.bool,
  sidebarOpen: PropTypes.bool,

};

Screen.defaultProps = {
  breadCrumbs: [],
  hidden: false,
  toolbarButtons: [],
  banner: undefined,
  sidebarActions: undefined,
  commentsSidebar: false,
  sidebarOpen: false,
};

export default Screen;
