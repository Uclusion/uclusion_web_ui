import AppBar from '@material-ui/core/AppBar'

import Icon from '@material-ui/core/Icon'
import IconButton from '@material-ui/core/IconButton'
import LinearProgress from '@material-ui/core/LinearProgress'
import MenuIcon from '@material-ui/icons/Menu'
import PropTypes from 'prop-types'
import React from 'react'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import classNames from 'classnames'
import drawerActions from '../../store/drawer/actions'
import withWidth, { isWidthDown } from '@material-ui/core/withWidth'
import { Helmet } from 'react-helmet'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { injectIntl } from 'react-intl'
import { withStyles } from '@material-ui/core/styles'
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import { withMarketId } from '../../components/PathProps/MarketId'
import { getCurrentUser } from '../../store/Users/reducer'
import { fetchMarket } from '../../store/Markets/actions'
import { fetchUser } from '../../store/Users/actions'
import { getDifferentMarketLink } from '../../utils/marketIdPathFunctions'

const drawerWidth = 240;

const styles = theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh'
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
    //marginLeft: drawerWidth,
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
  formControl: {
    marginRight: 50,
    minWidth: 1,
  },
  selectEmpty: {
    marginTop: 5,
  },
});

class Activity extends React.Component {
  constructor (props) {
    super(props)
    this.state = {}
  }

  handleDrawerToggle = () => {
    const { setDrawerMobileOpen, drawer } = this.props
    setDrawerMobileOpen(!drawer.mobileOpen)
  };

  handleDrawerOpen = () => {
    const { setDrawerOpen } = this.props
    setDrawerOpen(true)
  };

  handleDrawerClose = () => {
    const { setDrawerOpen } = this.props
    setDrawerOpen(false)
  };

  handleMarketChange = event => {
    const newMarketId = event.target.value
    if (newMarketId !== this.props.marketId) {
      this.props.dispatch(fetchMarket({market_id: newMarketId, isSelected: true}))
      // We have the user already from login but not the market presences which this fetch user will retrieve
      this.props.dispatch(fetchUser({marketId: newMarketId, user: this.props.user}))
      let market = this.state.markets.find(function (market) {
        return market.id = newMarketId;
      })
      window.location = getDifferentMarketLink(market, 'investibles')
    }
  };

  render() {
    const { classes, theme, children, drawer, intl, title, pageTitle, width, appBarContent, isLoading, onBackClick, isOffline, marketId, user } = this.props;
    let marketChoices;
    if (user && user.team_presences) {
      let team_presence = user.team_presences.find(function (team) {
        return team.team_id = user.default_team_id;
      })
      let markets = team_presence.market_list
      this.state.markets = markets
      marketChoices = markets.map((market) => {
        return <MenuItem value={market.id}>{market.name}</MenuItem>
      });
    }
    let headerTitle = ''

    if (typeof title === 'string' || title instanceof String) {
      headerTitle = title
    }

    if (pageTitle) {
      headerTitle = pageTitle
    }

    //const smDown = width === 'sm' || width === 'xs'
    const smDown = isWidthDown('sm', width)

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
          position={(width !== 'sm' && width !== 'xs') ? "absolute" : undefined}
          className={appBarClassName}
        >
          <Toolbar disableGutters={true} >
            {true && <LinearProgress />}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={!drawer.open ? this.handleDrawerOpen : this.handleDrawerToggle}
              className={classNames(!smDown && classes.menuButton, drawer.open && !smDown && classes.hide, onBackClick && classes.hide)}
            >
              <MenuIcon />
            </IconButton>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={onBackClick}
              className={classNames(!smDown && classes.menuButton, !onBackClick && classes.hide)}
            >
              <Icon >chevron_left</Icon>
            </IconButton>
            {!onBackClick && drawer.open && <div style={{ marginRight: 32 }} />}
            {marketChoices && <form autoComplete="off">
              <FormControl className={classes.formControl}>
                <InputLabel htmlFor="market-switch-helper">Market</InputLabel>
                <Select
                  value={marketId}
                  onChange={this.handleMarketChange}
                  input={<Input name="market" id="market-switch" />}
                >
                  {marketChoices}
                </Select>
                <FormHelperText>Choose the market to display</FormHelperText>
              </FormControl>
            </form>}
            <Typography variant="title" color="inherit" noWrap >
              {headerTitle}
            </Typography>
            <div className={classes.grow} />
            {appBarContent}

          </Toolbar>
        </AppBar>
        <div className={classes.toolbar} />
        {isLoading && <LinearProgress />}
        {isOffline && <div style={{ display: 'flex', justifyContent: 'center', width: '100%', height: 15, backgroundColor: theme.palette.secondary.main }}>
          <Typography variant="caption" color="textSecondary" noWrap >
            {intl.formatMessage({ id: 'offline' })}
          </Typography>
        </div>}
        <main className={contentClassName}>
          {children}
        </main>
      </div >
    );
  }
}

Activity.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  drawer: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => {
  const { drawer, connection } = state

  return {
    drawer,
    isOffline: connection ? !connection.isConnected : false,
    user: getCurrentUser(state.usersReducer)
  }
}

export default compose(
  connect(mapStateToProps, { ...drawerActions }),
  withWidth(),
  withStyles(styles, { withTheme: true }),
  injectIntl
)(withMarketId(Activity))

