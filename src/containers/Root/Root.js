import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { makeStyles, ThemeProvider } from '@material-ui/core/styles';
import { CssBaseline } from '@material-ui/core';
import { useHistory } from 'react-router';
import { defaultTheme } from '../../config/themes';
import Market from '../../pages/Dialog/Dialog';
import Support from '../../pages/About/Support';
import PageNotFound from '../../pages/PageNotFound/PageNotFound';
import {
  broadcastView, decomposeMarketPath,
} from '../../utils/marketIdPathFunctions';
import Home from '../../pages/Home/Home';
import Investible from '../../pages/Investible/Investible';
import DialogArchives from '../../pages/DialogArchives/DialogArchives';
import Archives from '../../pages/Archives/Archives';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext';
import { OnlineStateContext } from '../../contexts/OnlineStateContext';
import { getAndClearRedirect, redirectToPath } from '../../utils/redirectUtils';
import InvestibleEdit from '../../pages/Investible/InvestibleEdit';
import InvestibleAdd from '../../pages/Dialog/InvestibleAdd';
import DialogAdd from '../../pages/DialogAdd/DialogAdd';
import DialogEdit from '../../pages/Dialog/DialogEdit';
import DialogManage from '../../pages/Dialog/DialogManage';
import MarketInvite from '../../pages/Invites/MarketInvite';
import SlackInvite from '../../pages/Invites/SlackInvite';
import ChangePassword from '../../pages/Authentication/ChangePassword';
import ChangeNotificationPreferences from '../../pages/About/ChangeNotificationPreferences';

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
    height: '100%',
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

  function hideSupport() {
    return action !== 'support';
  }

  function hideChangePassword() {
    return action !== 'changePassword';
  }

  function hideChangeNotification() {
    return action !== 'notificationPreferences';
  }

  function hideAddMarket() {
    return action !== 'dialogAdd';
  }

  function hideMarket() {
    return action !== 'dialog' || (!marketId) || (!!marketId && !!investibleId);
  }

  function hideInvestible() {
    return (action !== 'dialog') || !investibleId;
  }

  function hideInvestibleEdit() {
    return (action !== 'investibleEdit') || !investibleId;
  }

  function hideInvestibleAdd() {
    return (action !== 'investibleAdd') || !marketId;
  }

  function hideDialogEdit() {
    return (action !== 'marketEdit') || !marketId;
  }

  function hideDialogManage() {
    return (action !== 'marketManage') || !marketId;
  }

  function hideDialogArchives() {
    return (action !== 'dialogArchives');
  }

  function hideArchvies() {
    return (action !== 'archives');
  }

  function hideSlackInvite() {
    return action !== 'slack' || !hash;
  }

  function hideMarketInvite() {
    return action !== 'invite' || !marketId;
  }

  const hidePNF = !(hideMarket() && hideSupport() && hideHome() && hideInvestible()
    && hideDialogArchives() && hideArchvies() && hideInvestibleEdit() && hideInvestibleAdd()
    && hideAddMarket() && hideDialogEdit() && hideDialogManage() && hideMarketInvite()
    && hideSlackInvite() && hideChangePassword() && hideChangeNotification());

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
          <div className={classes.content}>
            <Home hidden={hideHome()} />
            <Market hidden={hideMarket()} />
            <Support hidden={hideSupport()} />
            <Investible hidden={hideInvestible()} />
            <InvestibleEdit hidden={hideInvestibleEdit()} />
            <Archives hidden={hideArchvies()} />
            <DialogArchives hidden={hideDialogArchives()} />
            <InvestibleAdd hidden={hideInvestibleAdd()} />
            <DialogAdd hidden={hideAddMarket()} />
            <DialogEdit hidden={hideDialogEdit()} />
            <DialogManage hidden={hideDialogManage()} />
            <MarketInvite hidden={hideMarketInvite()} />
            <SlackInvite hidden={hideSlackInvite()} />
            <ChangePassword hidden={hideChangePassword()} />
            <ChangeNotificationPreferences hidden={hideChangeNotification()} />
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
