import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import { withStyles } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import queryString from 'query-string';
import { defaultTheme } from '../../config/themes';
import Drawer from '../Drawer';
import Markets from '../../pages/DecisionDialogs/Markets';
import Notifications from '../../pages/ActionCenter/Notifications';
import Market from '../../pages/DecisionDialog/Market';
import About from '../../pages/About/About';
import PageNotFound from '../../pages/PageNotFound/PageNotFound';
import {
  broadcastView, formMarketLink, getMarketId, navigate,
} from '../../utils/marketIdPathFunctions';
import { getAccountClient, getMarketClient } from '../../api/uclusionClient';
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
  console.debug('Root being rerendered');
  const history = useHistory();
  const { classes, appConfig } = props;

  const { location } = history;
  const { pathname, hash } = location;
  console.log(`pathname is ${pathname}`);
  const marketId = getMarketId(pathname);
  const marketType = pathname === '/newplan' ? 'PLANNING' : 'DECISION';
  const theme = defaultTheme;
  function hideNotifications() {
    return pathname !== '/notifications';
  }
  function hideMarkets() {
    return pathname && (pathname !== '/') && (pathname !== '/dialogs') && (pathname !== '/newplan');
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
    return pathname.startsWith('/invite') || pathname.startsWith('/slack');
  }
  const inviteMarketId = getMarketId(pathname, '/invite/');
  if (inviteMarketId) {
    console.log(`Logging into market ${inviteMarketId}`);
    getMarketClient(inviteMarketId).then(() => navigate(history, formMarketLink(inviteMarketId)))
      .catch((error) => {
        console.error(error);
        sendIntlMessage(ERROR, { id: 'marketFetchFailed' });
      });
  }
  if (hash) {
    const values = queryString.parse(hash);
    const { nonce } = values;
    if (nonce) {
      getAccountClient()
        .then((client) => client.users.register(nonce))
        .then(() => navigate(history, '/dialogs'))
        .catch((error) => {
          console.error(error);
          sendIntlMessage(ERROR, { id: 'slack_register_failed' });
        });
    }
  }

  useEffect(() => {
    function pegView(isEntry) {
      const currentHref = window.location.href;
      const hashStart = currentHref.indexOf('#');
      if (hashStart > -1) {
        const values = queryString.parse(currentHref.substring(hashStart));
        const { investible } = values;
        const path = currentHref.substring(currentHref.indexOf('/dialog/'), hashStart);
        const marketId = getMarketId(path);
        broadcastView(marketId, investible, isEntry);
      }
    }
    // Need this or won't see events where url doesn't change
    const focusListener = window.addEventListener('focus', () => {
      pegView(true);
    });
    const blurListener = window.addEventListener('blur', () => {
      pegView(false);
    });
    return () => {
      if (focusListener) {
        focusListener.remove();
      }
      if (blurListener) {
        blurListener.remove();
      }
    };
  }, []);

  return (
    <MuiThemeProvider theme={theme}>
      <div className={classes.body}>
        <div className={classes.root}>
          {!isInvite() && (<Drawer appConfig={appConfig} />)}
          <div className={isInvite() ? classes.hide : classes.content}>
            <Notifications hidden={hideNotifications()} />
            <Markets hidden={hideMarkets()} marketType={marketType} />
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
  classes: PropTypes.object.isRequired, // eslint-disable-line
};

export default withStyles(styles)(Root);
