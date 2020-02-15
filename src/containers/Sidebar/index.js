import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Drawer, Link, List } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import Notifications from '../../components/Notifications/Notifications';
import { SidebarContext } from '../../contexts/SidebarContext';
import { DRAWER_WIDTH_CLOSED, DRAWER_WIDTH_OPENED } from '../../constants/global';
import { navigate } from '../../utils/marketIdPathFunctions';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';

const useStyles = makeStyles((theme) => ({
  sidebarOpen: {
    width: DRAWER_WIDTH_OPENED,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  sidebarClose: {
    width: DRAWER_WIDTH_CLOSED,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  drawer: {
    flexShrink: 0,
    whiteSpace: 'nowrap',
    backgroundColor: '#3F6B72',
    overflowX: 'hidden',
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
    alignItems: 'flex-start',
  },
  sidebarContent: {
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    paddingTop: '0',
    paddingBottom: '0',
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
}));

const DEFAULT_SIDEBAR_LOGO = 'logo.svg';
const ALTERNATE_SIDEBAR_LOGO = 'Uclusion_Logo_White_Micro.png';

function Sidebar(props) {
  const classes = useStyles();
  const { sidebarActions } = props;
  const history = useHistory();
  const [sidebarOpen] = useContext(SidebarContext);
  const [operationRunning] = useContext(OperationInProgressContext);
  const [logoTimer, setLogoTimer] = useState(undefined);
  const [logoImage, setLogoImage] = useState(DEFAULT_SIDEBAR_LOGO);
  const [pegLogo, setPegLogo] = useState(false);

  useEffect(() => {
    if (operationRunning && !logoTimer) {
      setLogoTimer(setInterval(() => {
        setPegLogo(true);
      }, 250));
    }
    if (!operationRunning && logoTimer) {
      setLogoTimer(undefined);
      clearInterval(logoTimer);
      setPegLogo(false);
      setLogoImage(DEFAULT_SIDEBAR_LOGO);
    }
    if (pegLogo) {
      setPegLogo(false);
      if (logoImage === DEFAULT_SIDEBAR_LOGO) {
        setLogoImage(ALTERNATE_SIDEBAR_LOGO);
      } else {
        setLogoImage(DEFAULT_SIDEBAR_LOGO);
      }
    }
    return () => {
      if (logoTimer) {
        setLogoTimer(undefined);
        clearInterval(logoTimer);
        setPegLogo(false);
      }
    };
  }, [operationRunning, logoTimer, pegLogo, logoImage]);

  function getSidebar() {
    return (
      <div className={classes.sidebarContainer}>
        <div className={classes.sidebarLogo}>
          <Link href="#" onClick={() => navigate(history, '/')} color="inherit">
            <img width="40" height="52" src={`/images/${logoImage}`} alt="Uclusion" />
          </Link>
        </div>
        <div>
          <List className={classes.sidebarContent}>
            {sidebarActions}
          </List>
        </div>
        <div id="notifications" className={classes.sidebarNotification}>
          <div  className={classes.notification}>
            <Notifications />
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
        [classes.sidebarClose]: !sidebarOpen,
      })}
      classes={{
        paper: clsx(classes.drawer, {
          [classes.sidebarOpen]: sidebarOpen,
          [classes.sidebarClose]: !sidebarOpen,
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
