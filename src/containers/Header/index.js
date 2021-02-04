import React, { useContext, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { AppBar, Breadcrumbs, Link, Paper, Toolbar, Tooltip, Typography, } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { createTitle, navigate, openInNewTab } from '../../utils/marketIdPathFunctions';
import { OnlineStateContext } from '../../contexts/OnlineStateContext';
import Identity from '../Screen/Identity';
import SearchBox from '../../components/Search/SearchBox';
import SearchResults from '../../components/Search/SearchResults';
import { useHistory } from 'react-router';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import config from '../../config';
import NotificationsContainer from '../../components/Notifications/NotificationsContainer';

export const headerStyles = makeStyles((theme) => {
  return {
    elevated: {
      zIndex: 1900,
    },
    grow: {
      flexGrow: 1,
    },
    appBar: {
      background: '#fff',
      height: '67px',
    },
    appBarNoSidebar: {
      background: '#fff',
      height: `67px`,
    },

    breadcrumbs: {
      flex: 3,
      '& > .MuiBreadcrumbs-ol': {
        flexWrap: 'nowrap',
      },
      '& .MuiBreadcrumbs-li': {
        whiteSpace: 'nowrap',
      },
      [theme.breakpoints.down('sm')]: {
        display: 'none'
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
      [theme.breakpoints.down('sm')]: {
        paddingLeft: 0
      },
    },
    searchBox: {
      paddingLeft: '1rem',
    },
    notification: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '48px',
      borderRadius: '50%',
      background: '#fff',
      boxShadow: 'none',
    },
    sidebarLogo: {
      padding: '10px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      width: '100%',
      flex: 3,
      '& svg': {
        '& path': {
          transition: 'fill 250ms ease'
        },
        '& rect': {
          transition: 'fill 250ms ease'
        }
      },
      [theme.breakpoints.down('sm')]: {
        padding: 0
      },
    },

  };
});

export function restoreHeader () {
  const headerEl = document.getElementById('app-header-control');
  if (headerEl) {
    headerEl.style.display = 'block';
  }
}

const NORMAL_LOGO = '#3F6B72';
const ALT_LOGO = '#F29100';

function Header (props) {
  const classes = headerStyles();
  const intl = useIntl();
  const [online] = useContext(OnlineStateContext);
  const history = useHistory();
  const {
    breadCrumbs, toolbarButtons, appEnabled, hidden, title, logoLinkDisabled, hideTools
  } = props;

  const [operationRunning] = useContext(OperationInProgressContext);
  const [logoTimer, setLogoTimer] = useState(undefined);
  const [logoImage, setLogoImage] = useState(NORMAL_LOGO);
  const [pegLogo, setPegLogo] = useState(false);

  useEffect(() => {
    if (appEnabled) {
      if (operationRunning && !logoTimer) {
        setLogoTimer(setInterval(() => {
          setPegLogo(true);
        }, 500));
      }
      if (!operationRunning && logoTimer) {
        setLogoTimer(undefined);
        clearInterval(logoTimer);
        setPegLogo(false);
        setLogoImage(NORMAL_LOGO);
      }
      if (pegLogo) {
        setPegLogo(false);
        if (logoImage === NORMAL_LOGO) {
          setLogoImage(ALT_LOGO);
        } else {
          setLogoImage(NORMAL_LOGO);
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

  function generateTitle () {
    if (breadCrumbs && !hidden) {
      return (
        <Breadcrumbs className={classes.breadcrumbs} separator="/">
          {breadCrumbs.map((crumb, index) => {
            const { id, onClick, link, image, title } = crumb;
            const href = _.isEmpty(link) ? '#' : link;
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
            );
          })}
          <Typography color="textPrimary">{createTitle(title, 25)}</Typography>
        </Breadcrumbs>
      );
    }
    return (
      <div className={classes.breadcrumbs}>
        <Typography color="textPrimary">{createTitle(title, 30)}</Typography>
      </div>
    );
  }

  return (
    <div id="app-header-control">
      <AppBar
        position="fixed"
        id="app-header"
        className={classes.appBar}
        onDragOver={(event) => {
          const headerEl = document.getElementById('app-header-control');
          if (headerEl) {
            headerEl.style.display = 'none';
          }
        }}
      >
        <Toolbar className={classes.topBar}>
          {!hideTools && generateTitle()}
          <div className={classes.sidebarLogo}>
            <Link href="/" onClick={(event) => {
              event.preventDefault();
              if (!logoLinkDisabled) {
                navigate(history, '/');
              }
            }} color="inherit">
              <svg style={{ width: '120px', verticalAlign: 'middle', transition: 'all 125ms linear' }}
                   xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600">
                <path fill="#fff"
                      d="M888.67,328.66a43,43,0,0,1-34.38,42.12v43.84l-43-43H174.05a62.72,62.72,0,0,1-62.72-62.72V228.36a43,43,0,0,1,43-43H845.69a43,43,0,0,1,43,43Z"/>
                <path
                  d="M139.92,284.31V214.08h29v69.47c0,21.45,10.72,32.55,28.4,32.55s28.41-10.73,28.41-31.61V214.08h29v69.29c0,39.87-22.39,59.44-57.75,59.44S139.92,323.06,139.92,284.31Z"/>
                <path fill={logoImage}
                      d="M265.85,290.81v-.38c0-28.78,22-52.48,52.86-52.48,19,0,30.85,6.4,40.25,16.93l-17.49,18.81c-6.39-6.77-12.79-11.1-23-11.1-14.29,0-24.45,12.61-24.45,27.47v.37c0,15.43,10,27.84,25.58,27.84,9.59,0,16.18-4.14,23.14-10.72l16.74,16.93c-9.78,10.72-21.07,18.43-41.2,18.43C288.05,342.91,265.85,319.59,265.85,290.81Z"/>
                <path fill={logoImage} d="M368.18,209.86h28.59v130.8H368.18Z"/>
                <path fill={logoImage}
                      d="M410.92,305.1V242.7h28.59v53.38c0,13.54,6.39,20.5,17.3,20.5s17.87-7,17.87-20.5V242.7h28.6v98h-28.6v-14.3c-6.58,8.46-15,16.18-29.53,16.18C423.52,342.54,410.92,328.24,410.92,305.1Z"/>
                <path fill={logoImage}
                      d="M509.67,327.3l12.23-18.81c10.91,7.9,22.38,12,31.79,12,8.27,0,12-3,12-7.52v-.38c0-6.21-9.78-8.28-20.87-11.66-14.11-4.14-30.1-10.73-30.1-30.29v-.37c0-20.51,16.55-32,36.87-32A69.74,69.74,0,0,1,589.24,250l-10.91,19.75c-10-5.83-19.94-9.4-27.28-9.4-7,0-10.53,3-10.53,7v.37c0,5.65,9.59,8.28,20.5,12,14.11,4.7,30.47,11.48,30.47,29.91V310c0,22.38-16.74,32.54-38.56,32.54A70.67,70.67,0,0,1,509.67,327.3Z"/>
                <path fill={logoImage} d="M602,242.7h28.59v98H602Z"/>
                <path fill={logoImage}
                      d="M641.34,290.81v-.38c0-29,23.33-52.48,54.74-52.48,31.22,0,54.36,23.14,54.36,52.11v.37c0,29-23.32,52.48-54.74,52.48C664.48,342.91,641.34,319.78,641.34,290.81Zm80.89,0v-.38c0-14.86-10.73-27.84-26.53-27.84-16.36,0-26.14,12.61-26.14,27.47v.37c0,14.86,10.72,27.84,26.52,27.84C712.44,318.27,722.23,305.67,722.23,290.81Z"/>
                <path fill={logoImage}
                      d="M759.85,242.7h28.59v11.43C795,245.66,803.49,238,818,238c21.63,0,34.23,14.3,34.23,37.43v65.28H823.61V284.41c0-13.54-6.39-20.5-17.3-20.5s-17.87,7-17.87,20.5v56.25H759.85Z"/>
                <rect fill={logoImage} x="601.28" y="209.51" width="30.1" height="25.24"/>
                <path fill={logoImage}
                      d="M845.69,171.05H154.31A57.38,57.38,0,0,0,97,228.36v80.56A77.06,77.06,0,0,0,174.05,386H805.37l38.78,38.78a14.32,14.32,0,0,0,24.46-10.13V381.17A57.4,57.4,0,0,0,903,328.66V228.36A57.38,57.38,0,0,0,845.69,171.05Zm43,157.61a43,43,0,0,1-34.38,42.12v43.84l-43-43H174.05a62.72,62.72,0,0,1-62.72-62.72V228.36a43,43,0,0,1,43-43H845.69a43,43,0,0,1,43,43Z"/>
              </svg>
            </Link>
          </div>
          {!hideTools && toolbarButtons}
          {!online && (
            <div className={classes.centerMe}>
              <Paper className={classes.offlineStyle}>
                <Typography variant="h5">
                  {intl.formatMessage({ id: 'warningOffline' })}
                </Typography>
              </Paper>
            </div>
          )}

          {!hideTools &&
          (
            <React.Fragment>
              <div className={classes.grow}/>
              <div className={classes.notification}>
                <NotificationsContainer/>
              </div>
              <div className={classes.searchBox}>
                <SearchBox/>
              </div>
              <SearchResults/>
              {window.outerWidth > 600 && (
                <Tooltip title={<FormattedMessage id="help"/>}>
                  <HelpOutlineIcon color="primary" style={{ cursor: 'pointer', marginLeft: '1rem' }}
                                   onClick={() => openInNewTab(config.helpLink)}/>
                </Tooltip>
              )}
              <Identity />
            </React.Fragment>
          )}
        </Toolbar>
      </AppBar>
    </div>
  );
}

Header.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  breadCrumbs: PropTypes.arrayOf(PropTypes.object),
  toolbarButtons: PropTypes.arrayOf(PropTypes.any),
  title: PropTypes.any,
  hidden: PropTypes.bool,
  appEnabled: PropTypes.bool.isRequired,
  logoLinkDisabled: PropTypes.bool,
  hideTools: PropTypes.bool,
};

Header.defaultProps = {
  breadCrumbs: [],
  toolbarButtons: [],
  title: '',
  hidden: false,
  logoLinkDisabled: false,
  hideTools: false,
};

export default Header;
