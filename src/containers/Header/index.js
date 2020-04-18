import React, { useContext, useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import _ from 'lodash'
import { AppBar, Breadcrumbs, IconButton, Link, Paper, Toolbar, Tooltip, Typography, } from '@material-ui/core'
import MenuOpenIcon from '@material-ui/icons/MenuOpen'
import { makeStyles } from '@material-ui/styles'
import { SidebarContext } from '../../contexts/SidebarContext'
import { createTitle, navigate } from '../../utils/marketIdPathFunctions'
import { DRAWER_WIDTH_CLOSED, DRAWER_WIDTH_OPENED, } from '../../constants/global'
import { OnlineStateContext } from '../../contexts/OnlineStateContext'
import Identity from '../Screen/Identity'
import SearchBox from '../../components/Search/SearchBox'
import SearchResults from '../../components/Search/SearchResults'
import Notifications from '../../components/Notifications/Notifications'
import { useHistory } from 'react-router'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'

const useStyles = makeStyles((theme) => {
  const BREADCRUMBS_HEIGHT = 67;
  const TOPBAR_HEIGHT = 25;
  return {
    elevated: {
      zIndex: 1900,
    },
    grow: {
      flexGrow: 1,
    },
    appBar: {
      background: '#efefef',
      zIndex: theme.zIndex.drawer + 1,
      boxShadow: 'none',
      height: `${BREADCRUMBS_HEIGHT + TOPBAR_HEIGHT}px`,
    },
    appBarNoSidebar: {
      background: '#efefef',
      boxShadow: 'none',
      height: `${BREADCRUMBS_HEIGHT + TOPBAR_HEIGHT}px`,
    },
    appBarShift: {
      marginLeft: DRAWER_WIDTH_OPENED,
      width: `calc(100% - ${DRAWER_WIDTH_OPENED}px)`,
      transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
    appBarUnShift: {
      marginLeft: DRAWER_WIDTH_CLOSED,
      width: `calc(100% - ${DRAWER_WIDTH_CLOSED}px)`,
      transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
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
      width: `calc(100% - ${DRAWER_WIDTH_OPENED}px)`,
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
      paddingBottom: '25px',
      background: '#DFE5E7',
    },
    searchBox: {
      marginRight: '15px',
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
    sidebarLogo: {
      padding: '10px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      backgroundColor: '#3F6B72',
    },
  };
});

const DEFAULT_SIDEBAR_LOGO = 'logo.svg';
const ALTERNATE_SIDEBAR_LOGO = 'Uclusion_Logo_White_Micro.png';

function Header(props) {
  const classes = useStyles();
  const intl = useIntl();
  const [online] = useContext(OnlineStateContext);
  const history = useHistory();
  const {
    breadCrumbs, title, hidden, toolbarButtons, hasSidebar, appEnabled,
  } = props;

  const [sidebarOpen, setSidebarOpen] = useContext(SidebarContext);
  const myAppClass = hasSidebar ? clsx(classes.appBar, {
    [classes.appBarShift]: sidebarOpen,
    [classes.appBarUnShift]: !sidebarOpen,
  }) : classes.appBarNoSidebar;

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

  function generateTitle() {
    if (breadCrumbs && !hidden) {
      return (
        <Breadcrumbs className={classes.breadcrumbs} separator="/">
          {breadCrumbs.map((crumb, index) => {
            const { id, onClick, link, image, title } = crumb;
            const href = _.isEmpty(link)? '#' : link;
            return (
              <Link id={id} key={index} href={href} onClick={onClick} color="inherit">
                {image && (
                  <img
                    src={image}
                    alt={title}
                    className={classes.breadCrumbImage}
                  />
                )}
                {!crumb.image && createTitle(title, 25)}
              </Link>
            )
          })}
          <Typography color="textPrimary">{createTitle(title, 25)}</Typography>
        </Breadcrumbs>
      );
    }
    return (
      <Typography color="textPrimary">{createTitle(title, 30)}</Typography>
    );
  }

  return (
    <>
      <AppBar
        position="fixed"
        className={myAppClass}
      >
        <div className={classes.topBar} />
        <Toolbar>
          {hasSidebar && (
            <Tooltip title={intl.formatMessage({ id: 'openDrawer' })}>
              <IconButton
                aria-label="open drawer"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                edge="start"
                className={classes.menuButton}
              >
                <MenuOpenIcon className={classes.menuIcon} />
              </IconButton>
            </Tooltip>
          )}
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
          {generateTitle()}
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
          <div id="notifications" className={classes.searchBox}>
            <div  className={classes.notification}>
              <Notifications />
            </div>
          </div>
          <div className={classes.searchBox}>
            <SearchBox/>
          </div>
          <SearchResults/>
          <Identity/>
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
