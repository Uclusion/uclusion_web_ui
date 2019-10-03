import React from 'react';
import PropTypes from 'prop-types';
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import { withStyles } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import { defaultTheme } from '../../config/themes';
import Drawer from '../Drawer';
import Markets from '../../pages/DecisionDialogs/Markets';
import Notifications from '../../pages/ActionCenter/Notifications';
import Market from '../../pages/DecisionDialog/Market';
import About from '../../pages/About/About';
import PageNotFound from '../../pages/PageNotFound/PageNotFound';
import { getMarketId } from '../../utils/marketIdPathFunctions';
import { getMarketClient } from '../../api/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';

const styles = {
  body: {
    height: '100%',
  },
  root: {
    flexGrow: 1,
    zIndex: 1,
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    width: '100%',
  },
  content: {
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
  },
  hide: {
    display: 'none',
  },
};

function Root(props) {
  const history = useHistory();
  const { classes, appConfig } = props;

  const { location } = history;
  const { pathname } = location;
  console.log(`pathname is ${pathname}`);
  const marketId = getMarketId(pathname);
  const theme = defaultTheme;
  function hideNotifications() {
    return pathname !== '/notifications';
  }
  function hideMarkets() {
    return pathname && (pathname !== '/') && (pathname !== '/dialogs');
  }
  function hideAbout() {
    if (!pathname) {
      return true;
    }
    return !pathname.startsWith('/about');
  }
  function hideMarket() {
    return marketId === null;
  }
  function isInvite() {
    if (!pathname) {
      return false;
    }
    return pathname.startsWith('/invite');
  }
  const inviteMarketId = getMarketId(pathname, '/invite/');
  if (inviteMarketId) {
    console.log(`Logging into market ${inviteMarketId}`);
    getMarketClient(inviteMarketId).then(() => history.push(`/dialog/${inviteMarketId}`))
      .catch((error) => {
        console.error(error);
        sendIntlMessage(ERROR, { id: 'marketFetchFailed' });
      });
  }
  return (
    <MuiThemeProvider theme={theme}>
      <div className={classes.body}>
        <div className={classes.root}>
          {!isInvite() && (<Drawer appConfig={appConfig} />)}
          <div className={isInvite() ? classes.hide : classes.content}>
            <Notifications hidden={hideNotifications()} />
            <Markets hidden={hideMarkets()} />
            <Market hidden={hideMarket()} />
            <About hidden={hideAbout()} />
            <PageNotFound hidden={!(hideNotifications() && hideMarkets() && hideMarket()
              && hideAbout())}
            />
          </div>
        </div>
      </div>
    </MuiThemeProvider>
  );
}

Root.propTypes = {
  appConfig: PropTypes.object.isRequired, // eslint-disable-line
};

export default withStyles(styles)(Root);
