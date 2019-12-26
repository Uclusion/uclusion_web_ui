import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Drawer, List } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import NotificationImportantIcon from '@material-ui/icons/NotificationImportant';
import { SidebarContext } from '../../contexts/SidebarContext';
import { DRAWER_WIDTH } from '../../constants/global';

const useStyles = makeStyles((theme) => {
  return {
    sidebarOpen: {
      width: DRAWER_WIDTH,
      backgroundColor: '#3F6B72',
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
      width: 0,
    },
    drawer: {
      width: DRAWER_WIDTH,
      flexShrink: 0,
      whiteSpace: 'nowrap',
    },
    sidebarContainer: {
      display: 'grid',
      gridTemplateRows: '135px 1fr 98px',
      height: '100vh',
    },
    sidebarLogo: {
      marginTop: '53px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start'
    },
    sidebarContent: {
      display: 'flex',
      justifyContent: 'center',
      flexDirection: 'column',
      paddingTop: "21px",
      paddingBottom: "33px",
      backgroundColor: 'rgba(0,0,0,0.19)',
    },
    sidebarNotification: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
    },
    notification: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '54px',
      height: '54px',
      borderRadius: '50%',
      background: '#fff',
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    },
    notificationIcon: {
      color: '#F29100',
      fontSize: 36,
    },
  };
});

function Sidebar(props) {
    const classes = useStyles();
    const { sidebarActions } = props;
    const [sidebarOpen, setSidebarOpen] = useContext(SidebarContext);

    function getSidebar() {
        return (
            <div className={classes.sidebarContainer}>
                <div className={classes.sidebarLogo}>
                <img src="/images/logo.svg" alt="Uclusion" />
                </div>
                <div>
                <List className={classes.sidebarContent} >
                    {sidebarActions}
                </List>
                </div>
                <div className={classes.sidebarNotification}>
                <div className={classes.notification}>
                    <NotificationImportantIcon className={classes.notificationIcon} />
                </div>
                </div>
            </div>
        );
    }

    return (
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
        {getSidebar()}
        </Drawer>
      );
}

Sidebar.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  sidebarActions: PropTypes.arrayOf(PropTypes.element),
};

Sidebar.defaultProps = {
  sidebarActions: [],
};

export default Sidebar;
