/* eslint-disable react/forbid-prop-types */
import AppBar from '@material-ui/core/AppBar';
import Icon from '@material-ui/core/Icon';
import IconButton from '@material-ui/core/IconButton';
import ArrowDropdown from '@material-ui/icons/ArrowDropDown';
import LinearProgress from '@material-ui/core/LinearProgress';
import MenuIcon from '@material-ui/icons/Menu';
import PropTypes from 'prop-types';
import React from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames';
import withWidth, { isWidthDown } from '@material-ui/core/withWidth';
import { Helmet } from 'react-helmet';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import Input from '@material-ui/core/Input';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import { withRouter } from 'react-router-dom';
import drawerActions from '../../store/drawer/actions';
import { withMarketId } from '../../components/PathProps/MarketId';
import { getCurrentUser } from '../../store/Users/reducer';
import { getDifferentMarketLink } from '../../utils/marketIdPathFunctions';
import { getClient } from '../../config/uclusionClient';
import { withBackgroundProcesses } from '../../components/BackgroundProcesses/BackgroundProcessWrapper';
import { postAuthTasks } from '../../utils/fetchFunctions';

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
  content: {
    flex: 1,
    backgroundColor: theme.palette.background.default,
    overflow: 'auto',
  },
  contentShift: {
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
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
  marketSelect: {
    color: 'inherit',
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
});

const extractMarkets = (user) => {
  const teamPresence = user.team_presences.find(team => team.team_id === user.default_team_id);
  return teamPresence.market_list;
};

function Activity(props) {
  function handleDrawerToggle() {
    const { setDrawerMobileOpen, drawer } = props;
    setDrawerMobileOpen(!drawer.mobileOpen);
  }

  function handleDrawerOpen() {
    const { setDrawerOpen } = props;
    setDrawerOpen(true);
  }

  function handleMarketChange(event) {
    const newMarketId = event.target.value;
    const {
      webSocket, marketId, user, dispatch, history,
    } = props;
    if (newMarketId !== marketId) {
      postAuthTasks(null, null, dispatch, marketId, user, webSocket);
      const markets = extractMarkets(user);
      const newMarket = markets.find(market => market.id === newMarketId);
      history.push(getDifferentMarketLink(newMarket, 'investibles'));
    }
  }

  const showLogin = /(.+)\/login/.test(window.location.href.toLowerCase());
  if (!showLogin) {
    getClient(); // Will verify the token
  }

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
    isOffline,
    marketId,
    user,
  } = props;
  let marketChoices;

  if (user && user.team_presences) {
    const markets = extractMarkets(user);
    marketChoices = markets.map(
    // eslint-disable-next-line comma-dangle
      market => <MenuItem key={market.name} value={market.id}>{market.name}</MenuItem>
    );
  }
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
      >
        <Toolbar disableGutters>
          <LinearProgress />
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={!drawer.open ? handleDrawerOpen : handleDrawerToggle}
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
            <Icon>chevron_left</Icon>
          </IconButton>
          {!onBackClick && drawer.open && <div style={{ marginRight: 32 }} />}
          {marketChoices && (
            <form className={classes.form} autoComplete="off">
              <Typography className={classes.formLabel}>Market:</Typography>
              <FormControl className={classes.formControl}>
                <Select
                  className={classes.marketSelect}
                  disableUnderline
                  value={marketId}
                  onChange={handleMarketChange}
                  IconComponent={() => <ArrowDropdown className={classes.selectArrow} />}
                  input={<Input name="market" id="market-switch" />}
                >
                  {marketChoices}
                </Select>
              </FormControl>
            </form>
          )}
          <Typography variant="h6" color="inherit" noWrap>
            {headerTitle}
          </Typography>
          <div className={classes.grow} />
          {appBarContent}

        </Toolbar>
      </AppBar>
      <div className={classes.toolbar} />
      {isLoading && <LinearProgress />}
      {isOffline && (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        height: 15,
        backgroundColor: theme.palette.secondary.main,
      }}
      >
        <Typography variant="caption" color="textSecondary" noWrap>
          {intl.formatMessage({ id: 'offline' })}
        </Typography>
      </div>
      )}
      <main className={contentClassName}>
        {children}
      </main>
    </div>
  );
}

Activity.propTypes = {
  setDrawerMobileOpen: PropTypes.func.isRequired,
  setDrawerOpen: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  drawer: PropTypes.object.isRequired,
  children: PropTypes.object,
  intl: PropTypes.object.isRequired,
  title: PropTypes.string.isRequired,
  pageTitle: PropTypes.string,
  width: PropTypes.string.isRequired,
  appBarContent: PropTypes.object,
  isLoading: PropTypes.bool.isRequired,
  onBackClick: PropTypes.object,
  isOffline: PropTypes.bool.isRequired,
  webSocket: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  user: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => {
  const { drawer, connection } = state;

  return {
    drawer,
    isOffline: connection ? !connection.isConnected : false,
    user: getCurrentUser(state.usersReducer),
  };
};

export default withBackgroundProcesses(compose(
  connect(mapStateToProps, { ...drawerActions }),
  withWidth(),
  withStyles(styles, { withTheme: true }),
  injectIntl,
)(withRouter(withMarketId(Activity))));
