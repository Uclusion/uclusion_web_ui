import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { makeStyles, ThemeProvider } from '@material-ui/core/styles';
import { CssBaseline } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import queryString from 'query-string';
import { defaultTheme } from '../../config/themes';
import Market from '../../pages/Dialog/Dialog';
import About from '../../pages/About/About';
import PageNotFound from '../../pages/PageNotFound/PageNotFound';
import {
  broadcastView, decomposeMarketPath, formMarketLink, navigate,
} from '../../utils/marketIdPathFunctions';
import { getAccountClient, getMarketClient } from '../../api/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';
import Home from '../../pages/Home/Home';
import Investible from '../../pages/Investible/Investible';

const useStyles = makeStyles({
  body: {
    height: '100%',
  },
  root: {
    flexGrow: 1,
    zIndex: 1,
    overflow: 'auto',
    position: 'relative',
    display: 'flex',
    width: '100%',
  },
  content: {
    width: '100%',
    height: '100vh',
  },
  hide: {
    display: 'none',
  },
});

function Root(props) {
  console.debug('Root being rerendered');
  const history = useHistory();
  const classes = useStyles();
  const { location } = history;
  const { pathname, hash } = location;
  console.debug(`pathname is ${pathname}`);
  const { marketId, investibleId, action } = decomposeMarketPath(pathname);
  function hideHome() {
    return !pathname || pathname !== '/';
  }

  function hideAbout() {
    if (!pathname) {
      return true;
    }
    return action !== 'about';
  }
  function hideMarket() {
    return action !== 'dialog' || (!marketId) || (!!marketId && !!investibleId);
  }

  function hideInvestible() {
    return (action !== 'dialog') || !investibleId;
  }

  function isInvite() {
    if (!pathname) {
      return false;
    }
    return action === 'invite' || action === 'slack';
  }
  if (action === 'invite' && marketId) {
    console.debug(`Logging into market ${marketId}`);
    getMarketClient(marketId).then(() => navigate(history, formMarketLink(marketId)))
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
      const currentPath = window.location.pathname;
      const { marketId, investibleId } = decomposeMarketPath(currentPath);
      if (marketId && investibleId ) {
        broadcastView(marketId, investibleId, isEntry);
      }
    }
    // Need this or won't see events where url doesn't change
    const focusListener = window.addEventListener('focus', () => {
      pegView(true);
    });
    const blurListener = window.addEventListener('blur', () => {
      pegView(false);
    });
    window.onanimationiteration = console.debug;
    return () => {
      if (focusListener) {
        focusListener.remove();
      }
      if (blurListener) {
        blurListener.remove();
      }
    };
  }, []);

  console.log(`Hide Home ${hideHome()}`);
  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline />
      <div className={classes.body}>
        <div className={classes.root}>
          <div className={isInvite() ? classes.hide : classes.content}>
            <Home hidden={hideHome()} />
            <Market hidden={hideMarket()} />
            <About hidden={hideAbout()} />
            <Investible hidden={hideInvestible()} />
            <PageNotFound hidden={!(hideMarket() && hideAbout() && hideHome() && hideInvestible())}
            />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

Root.propTypes = {
  appConfig: PropTypes.object.isRequired, // eslint-disable-line
};

export default Root;
