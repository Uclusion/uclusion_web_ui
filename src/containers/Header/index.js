import React, { useContext, useRef } from 'react'
import { useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import _ from 'lodash'
import { AppBar, Breadcrumbs, IconButton, Link, Paper, Popper, Toolbar, Tooltip, Typography, } from '@material-ui/core'
import MenuOpenIcon from '@material-ui/icons/MenuOpen'
import { makeStyles } from '@material-ui/styles'
import { SidebarContext } from '../../contexts/SidebarContext'
import { createTitle } from '../../utils/marketIdPathFunctions'
import { DRAWER_WIDTH_CLOSED, DRAWER_WIDTH_OPENED, } from '../../constants/global'
import { OnlineStateContext } from '../../contexts/OnlineStateContext'
import Identity from '../Screen/Identity'
import SearchBox from '../../components/Search/SearchBox'
import SearchResults from '../../components/Search/SearchResults'
import Notifications from '../../components/Notifications/Notifications'

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
  };
});

function Header(props) {
  const classes = useStyles();
  const screenRef = useRef(null);
  const intl = useIntl();
  const [online] = useContext(OnlineStateContext);

  const {
    breadCrumbs, title, hidden, toolbarButtons,
  } = props;

  const [sidebarOpen, setSidebarOpen] = useContext(SidebarContext);

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
      {!hidden && screenRef.current && (
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
        position="relative"
        className={clsx(classes.appBar, {
          [classes.appBarShift]: sidebarOpen,
          [classes.appBarUnShift]: !sidebarOpen,
        })}
      >
        <div className={classes.topBar} />
        <Toolbar>
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
          {generateTitle()}
          {toolbarButtons}
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
};

Header.defaultProps = {
  breadCrumbs: [],
  toolbarButtons: [],
  title: '',
  hidden: false,
};

export default Header;
