/* eslint-disable react/forbid-prop-types */
import AppBar from '@material-ui/core/AppBar';
import IconButton from '@material-ui/core/IconButton';
import LinearProgress from '@material-ui/core/LinearProgress';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames';
import withWidth, { isWidthDown } from '@material-ui/core/withWidth';
import { Helmet } from 'react-helmet';
import { compose, bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import { withRouter } from 'react-router-dom';
import drawerActions from '../../store/drawer/actions';
import { getMarketClient } from '../../api/uclusionClient';
import { getCurrentUser } from '../../store/Users/reducer';
import { getFlags } from '../../utils/userFunctions'

const drawerWidth = 240;

const styles = theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  menuButton: {
    marginLeft: 12,
    marginRight: 12,
  },
  toolbar: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    ...theme.mixins.toolbar,
  },
  availableShares: {
    paddingRight: theme.spacing.unit * 4,
  },
  content: {
    flex: 1,
    backgroundColor: theme.palette.background.default,
    overflow: 'hidden',
  },
  contentShift: {
    // width: `calc(100% - ${drawerWidth}px)`,
    // transition: theme.transitions.create(['width', 'margin'], {
    //   easing: theme.transitions.easing.sharp,
    //   duration: theme.transitions.duration.enteringScreen,
    // }),
  },
  appBarShift: {
    // marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  hide: {
    display: 'none',
  },
  grow: {
    flex: '1 1 auto',
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: theme.spacing.unit * 2,
  },
  marketSelect: {
    color: 'inherit',
    fontSize: 20,
  },
  form: {
    display: 'flex',
    alignItems: 'center',
    paddingRight: 20,
  },
  formLabel: {
    color: 'inherit',
    position: 'relative',
    top: -1,
    marginRight: theme.spacing.unit,
    fontSize: 20,
  },
  formControl: {
    minWidth: 1,
  },
  selectArrow: {
    position: 'absolute',
    pointerEvents: 'none',
    top: 'calc(50% - 12px)',
    right: 0,
  },
  selectEmpty: {
    marginTop: 5,
  },
  offline: {
    textAlign: 'center',
    height: theme.spacing.unit * 2,
    padding: theme.spacing.unit * 0.5,
    backgroundColor: theme.palette.secondary.main,
    color: 'white',
  },
});

function Activity(props) {
  const [offline, setOffline] = useState(!navigator.onLine);

  function handleDrawerToggle() {
    const { setDrawerOpen, drawer } = props;
    setDrawerOpen(!drawer.open);
  }

  function handleConnectionStatusChange() {
    setOffline(!navigator.onLine);
  }

  window.addEventListener('online', handleConnectionStatusChange);
  window.addEventListener('offline', handleConnectionStatusChange);

  const {
    classes,
    theme,
    children,
    drawer,
    intl,
    title,
    pageTitle,
    width,
    appBarContent,
    isLoading,
    onBackClick,
    titleButtons,
    user,
    containerStyle,
  } = props;
  const { canInvest } = getFlags(user);
  let headerTitle = '';

  if (typeof title === 'string' || title instanceof String) {
    headerTitle = title;
  }

  if (pageTitle) {
    headerTitle = pageTitle;
  }

  // const smDown = width === 'sm' || width === 'xs'
  const smDown = isWidthDown('sm', width);

  const appBarClassName = (width !== 'sm' && width !== 'xs')
    ? classNames(classes.appBar, drawer.open && classes.appBarShift)
    : classes.appBar;
  const contentClassName = (width !== 'sm' && width !== 'xs')
    ? classNames(classes.content, drawer.open && classes.contentShift)
    : classes.content;

  return (
    <div className={classes.root}>
      <Helmet>
        <meta name="theme-color" content={theme.palette.primary.main} />
        <meta name="apple-mobile-web-app-status-bar-style" content={theme.palette.primary.main} />
        <meta name="msapplication-navbutton-color" content={theme.palette.primary.main} />
        <title>{headerTitle}</title>
      </Helmet>

      <AppBar
        position={(width !== 'sm' && width !== 'xs') ? 'absolute' : undefined}
        className={appBarClassName}
        color='default'
      >
        <Toolbar disableGutters>
          <LinearProgress />
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            className={classNames(!smDown && classes.menuButton,
              drawer.open && !smDown && classes.hide, onBackClick && classes.hide)}
          >
            <MenuIcon />
          </IconButton>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={onBackClick}
            className={classNames(!smDown && classes.menuButton, !onBackClick && classes.hide)}
          >
            <ChevronLeftIcon />
          </IconButton>
          {!onBackClick && drawer.open && <div style={{ marginRight: 32 }} />}
          {!drawer.open && !canInvest && <img className={classes.logo} src="/images/logo-white.svg" alt="logo" />}
          <Typography variant="h6" color="inherit" noWrap>
            {headerTitle}
          </Typography>
          {titleButtons}
          {appBarContent}
          <div className={classes.grow} />
          {user && user.market_presence && user.market_presence.quantity >= 0 && (
            <Typography variant="h6" color="inherit" noWrap className={classes.availableShares}>
              {canInvest && (intl.formatMessage({ id: 'availableSharesToInvest' }, { shares: user.market_presence.quantity }))}
            </Typography>
          )}
        </Toolbar>
      </AppBar>
      <div className={classes.toolbar} />
      {isLoading && <LinearProgress />}
      {offline && (
        <Typography
          variant="caption"
          className={classes.offline}
          noWrap
        >
          {intl.formatMessage({ id: 'offline' })}
        </Typography>
      )}
      <main className={contentClassName} style={containerStyle}>
        {children}
      </main>
    </div>
  );
}

Activity.propTypes = {
  setDrawerOpen: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  drawer: PropTypes.object.isRequired,
  children: PropTypes.object,
  intl: PropTypes.object.isRequired,
  title: PropTypes.string,
  pageTitle: PropTypes.string,
  width: PropTypes.string.isRequired,
  appBarContent: PropTypes.object,
  isLoading: PropTypes.bool,
  onBackClick: PropTypes.object,
  user: PropTypes.object,
  dispatch: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
  containerStyle: PropTypes.object,
};

const mapStateToProps = (state) => {
  const { drawer } = state;

  return {
    drawer,
    user: getCurrentUser(state.usersReducer),
  };
};

function mapDispatchToProps(dispatch) {
  const boundCreators = bindActionCreators({ ...drawerActions }, dispatch);
  return { ...boundCreators, dispatch };
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withWidth(),
  withStyles(styles, { withTheme: true }),
  injectIntl,
)(withRouter(React.memo(Activity)));
