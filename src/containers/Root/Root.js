import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { makeStyles, ThemeProvider } from '@material-ui/core/styles';
import { CssBaseline } from '@material-ui/core';
import { useHistory } from 'react-router';
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
import DialogArchives from '../../pages/DialogArchives/DialogArchives';
import Archives from '../../pages/Archives/Archives';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext';
import { OnlineStateContext } from '../../contexts/OnlineStateContext';
import { getAndClearRedirect, redirectToPath } from '../../utils/redirectUtils';

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
    height: 'calc(100vh - 67px)',
  },
  hide: {
    display: 'none',
  },
});

function Root() {
  console.debug('Root being rerendered');
  const history = useHistory();
  const classes = useStyles();
  const { location } = history;
  const { pathname, hash } = location;
  console.debug(`pathname is ${pathname}`);
  const { marketId, investibleId, action } = decomposeMarketPath(pathname);
  const [, setOperationsLocked] = useContext(OperationInProgressContext);
  const [, setOnline] = useContext(OnlineStateContext);
  function hideHome() {
    return !pathname || pathname !== '/';
  }

  const redirect = getAndClearRedirect();
  if (redirect) {
    redirectToPath(history, redirect);
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

  function hideDialogArchives() {
    return (action !== 'dialogArchives');
  }

  function hideArchvies() {
    return (action !== 'archives');
  }

  function isInvite() {
    if (!pathname) {
      return false;
    }
    return action === 'invite' || action === 'slack';
  }

  if (action === 'invite' && marketId) {
    console.debug(`Logging into market ${marketId}`);
    getMarketClient(marketId).then(() => {
      console.log(`Redirecting us to market ${marketId}`);
      return navigate(history, formMarketLink(marketId));
    })
      .catch((error) => {
        console.error(error);
        sendIntlMessage(ERROR, { id: 'marketFetchFailed' });
      });
  }

  let hidePNF = !(hideMarket() && hideAbout() && hideHome() && hideInvestible()
    && hideDialogArchives() && hideArchvies());
  if (hash) {
    const values = queryString.parse(hash);
    const { nonce } = values;
    if (nonce) {
      hidePNF = true;
      getAccountClient()
        .then((client) => client.users.register(nonce))
        .then(() => navigate(history, '/'))
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
      broadcastView(marketId, investibleId, isEntry);
    }
    // Need this or won't see events where url doesn't change
    const focusListener = window.addEventListener('focus', () => {
      pegView(true);
    });
    const blurListener = window.addEventListener('blur', () => {
      pegView(false);
    });
    const onlineListener = window.addEventListener('online', () => {
      console.debug('Back Online');
      setOnline(true);
      setOperationsLocked(false);
      pegView(true);
    });
    const offlineListener = window.addEventListener('offline', () => {
      console.debug('Offline');
      // setOperationsLocked(true);
      setOnline(false);
      pegView(false);
    });
    const visibilityChange = document.addEventListener('visibilitychange', () => {
      const isEntry = document.visibilityState === 'visible';
      pegView(isEntry);
    });
    window.onanimationiteration = console.debug;
    return () => {
      if (focusListener) {
        focusListener.remove();
      }
      if (blurListener) {
        blurListener.remove();
      }
      if (onlineListener) {
        onlineListener.remove();
      }
      if (offlineListener) {
        offlineListener.remove();
      }
      if (visibilityChange) {
        visibilityChange.remove();
      }
    };
  });

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
            <Archives hidden={hideArchvies()} />
            <DialogArchives hidden={hideDialogArchives()} />
            <PageNotFound hidden={hidePNF} />
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
