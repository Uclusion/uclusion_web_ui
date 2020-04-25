import React, { useContext, useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { AppBar, Link, Paper, Toolbar, Typography, } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { navigate } from '../../utils/marketIdPathFunctions'
import { OnlineStateContext } from '../../contexts/OnlineStateContext'
import Identity from '../Screen/Identity'
import SearchBox from '../../components/Search/SearchBox'
import SearchResults from '../../components/Search/SearchResults'
import Notifications from '../../components/Notifications/Notifications'
import { useHistory } from 'react-router'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'

const useStyles = makeStyles((theme) => {
  return {
    elevated: {
      zIndex: 1900,
    },
    grow: {
      flexGrow: 1,
    },
    appBar: {
      background: '#fff',
      zIndex: theme.zIndex.drawer + 1,
      boxShadow: 'none',
      height: `67px`,
    },
    appBarNoSidebar: {
      background: '#fff',
      boxShadow: 'none',
      height: `67px`,
    },
    breadcrumbs: {
      '& > .MuiBreadcrumbs-ol': {
        flexWrap: 'nowrap',
      },
      '& .MuiBreadcrumbs-li': {
        whiteSpace: 'nowrap',
      },
    },
    breadCrumbImage: {
      height: 40,
    },
    centerMe: {
      width: `100%`,
    },
    offlineStyle: {
      padding: '15px',
    },
    menuButton: {
      marginLeft: '-3px',
      marginRight: theme.spacing(2),
    },
    menuIcon: {
      width: '30px',
      height: '25px',
    },
    topBar: {
      width: '100%',
    },
    searchBox: {
      marginRight: '15px',
    },
    notification: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      background: '#fff',
      boxShadow: 'none'
    },
    sidebarLogo: {
      padding: '10px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start'
    },
    notificationBox: {
      marginLeft: '15px'
    }
  };
});

const DEFAULT_SIDEBAR_LOGO = 'dark_logo.svg';
const ALTERNATE_SIDEBAR_LOGO = 'Uclusion_Logo_Green_Micro.png';

function Header(props) {
  const classes = useStyles();
  const intl = useIntl();
  const [online] = useContext(OnlineStateContext);
  const history = useHistory();
  const {
    toolbarButtons, hasSidebar, appEnabled,
  } = props;

  const myAppClass = hasSidebar ? clsx(classes.appBar) : classes.appBarNoSidebar;

  const [operationRunning] = useContext(OperationInProgressContext);
  const [logoTimer, setLogoTimer] = useState(undefined);
  const [logoImage, setLogoImage] = useState(DEFAULT_SIDEBAR_LOGO);
  const [pegLogo, setPegLogo] = useState(false);

  useEffect(() => {
    if (appEnabled) {
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
    }
    return () => {
      if (logoTimer) {
        setLogoTimer(undefined);
        clearInterval(logoTimer);
        setPegLogo(false);
      }
    };
  }, [operationRunning, logoTimer, pegLogo, logoImage, appEnabled]);

  return (
    <>
      <AppBar
        position="fixed"
        className={myAppClass}
      >
        <div className={classes.topBar} />
        <Toolbar>
          {!hasSidebar && (
            <div className={classes.sidebarLogo}>
              <Link href="/" onClick={(event) => {
                event.preventDefault();
                navigate(history, '/');
              }} color="inherit">
              <img width="40" height="52" src={`/images/${logoImage}`} alt="Uclusion" />
              </Link>
            </div>
          )}
          {toolbarButtons}
          {!online && (
            <div className={classes.centerMe}>
              <Paper className={classes.offlineStyle}>
                <Typography variant="h5">
                  {intl.formatMessage({ id: 'warningOffline' })}
                </Typography>
              </Paper>
            </div>
          )}
          <div className={classes.grow} />
          <div className={classes.searchBox}>
            <SearchBox/>
          </div>
          <SearchResults/>
          <Identity/>
          <div id="notifications" className={classes.notificationBox}>
            <div  className={classes.notification}>
              <Notifications />
            </div>
          </div>
        </Toolbar>
      </AppBar>
    </>
  );
}

Header.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  breadCrumbs: PropTypes.arrayOf(PropTypes.object),
  toolbarButtons: PropTypes.arrayOf(PropTypes.any),
  title: PropTypes.any,
  hidden: PropTypes.bool,
  hasSidebar: PropTypes.bool.isRequired,
  appEnabled: PropTypes.bool.isRequired,
};

Header.defaultProps = {
  breadCrumbs: [],
  toolbarButtons: [],
  title: '',
  hidden: false,
};

export default Header;
