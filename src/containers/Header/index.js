import React, { useContext, useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import _ from 'lodash'
import { AppBar, Breadcrumbs, Link, Paper, Toolbar, Tooltip, Typography, } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles'
import { createTitle, navigate } from '../../utils/marketIdPathFunctions'
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

const NORMAL_LOGO = '#3F6B72';
const ALT_LOGO = '#F29100';

function Header(props) {
  const classes = useStyles();
  const intl = useIntl();
  const [online] = useContext(OnlineStateContext);
  const history = useHistory();
  const {
    breadCrumbs, toolbarButtons, appEnabled, hidden, title
  } = props;

  const myAppClass = clsx(classes.appBar);

  const [operationRunning] = useContext(OperationInProgressContext);
  const [logoTimer, setLogoTimer] = useState(undefined);
  const [logoImage, setLogoImage] = useState(NORMAL_LOGO);
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
          <div className={classes.sidebarLogo}>
            <Link href="/" onClick={(event) => {
              event.preventDefault();
              navigate(history, '/');
            }} color="inherit">
              <Tooltip title={intl.formatMessage({id: 'homeBreadCrumb'})}>
                <svg style={{verticalAlign: 'middle'}} width="40" height="52" viewBox="0 0 40 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M28.5685 0H11.4271C8.39752 0.00351981 5.49304 1.20857 3.35081 3.35081C1.20857 5.49304 0.00351981 8.39752 0 11.4271V27.4853C0 31.5612 1.61914 35.4701 4.50122 38.3522C7.38331 41.2343 11.2923 42.8535 15.3681 42.8535H21.6779L29.4108 50.5878C29.8105 50.9866 30.3195 51.2581 30.8734 51.3679C31.4273 51.4778 32.0013 51.4211 32.523 51.205C33.0447 50.9889 33.4907 50.623 33.8047 50.1537C34.1187 49.6843 34.2866 49.1324 34.2872 48.5677V39.9897C36.0608 38.6602 37.5004 36.9359 38.492 34.9535C39.4836 32.9711 39.9999 30.785 40 28.5685V11.4271C39.9965 8.39675 38.7908 5.4916 36.6476 3.34924C34.5044 1.20688 31.5988 0.00234645 28.5685 0ZM37.1392 28.5685C37.1408 30.5754 36.6134 32.5472 35.6102 34.2854C34.607 36.0235 33.1634 37.4666 31.4249 38.4691V48.5736L22.8542 40.003H15.3622C13.7189 40.003 12.0918 39.6791 10.5737 39.0499C9.05567 38.4207 7.67652 37.4984 6.51509 36.3359C5.35366 35.1734 4.43274 33.7934 3.80496 32.2747C3.17718 30.7561 2.85485 29.1286 2.8564 27.4853V11.4271C2.8564 9.15401 3.75939 6.97402 5.3667 5.3667C6.97402 3.75939 9.15401 2.8564 11.4271 2.8564H28.5685C30.8416 2.8564 33.0216 3.75939 34.6289 5.3667C36.2362 6.97402 37.1392 9.15401 37.1392 11.4271V28.5685Z" fill={logoImage}/>
                 <path d="M8.55737 22.5822V8.57947H14.3337V22.433C14.3337 26.708 16.472 28.9216 19.9978 28.9216C23.5236 28.9216 25.6618 26.7833 25.6618 22.6206V8.58242H31.4382V22.3975C31.4382 30.349 26.974 34.2502 19.9224 34.2502C12.8708 34.2502 8.55737 30.3091 8.55737 22.5822Z" fill="#3F6B72"/>
                </svg>
              </Tooltip>
            </Link>
          </div>
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
  appEnabled: PropTypes.bool.isRequired,
};

Header.defaultProps = {
  breadCrumbs: [],
  toolbarButtons: [],
  title: '',
  hidden: false,
};

export default Header;
