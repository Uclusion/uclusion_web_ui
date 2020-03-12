import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import { CssBaseline } from '@material-ui/core';
import { useHistory } from 'react-router';
import Market from '../../pages/Dialog/Dialog';
import Support from '../../pages/About/Support';
import PageNotFound from '../../pages/PageNotFound/PageNotFound';
import _ from 'lodash';
import {
  broadcastView, decomposeMarketPath,
} from '../../utils/marketIdPathFunctions';
import Home from '../../pages/Home/Home';
import Investible from '../../pages/Investible/Investible';
import DialogArchives from '../../pages/DialogArchives/DialogArchives';
import Archives from '../../pages/Archives/Archives';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
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
import BillingHome from '../../pages/Payments/BillingHome';
import { refreshNotifications, refreshVersions } from '../../contexts/VersionsContext/versionsContextHelper'

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
    return action !== 'slack';
  }

  function hideMarketInvite() {
    return action !== 'invite' || !marketId;
  }

  function hideBillingHome() {
    return action !== 'billing';
  }

  const hidePNF = !(hideMarket() && hideSupport() && hideHome() && hideInvestible()
    && hideDialogArchives() && hideArchvies() && hideInvestibleEdit() && hideInvestibleAdd()
    && hideAddMarket() && hideDialogEdit() && hideDialogManage() && hideMarketInvite()
    && hideSlackInvite() && hideChangePassword() && hideChangeNotification()
    && hideBillingHome());

  useEffect(() => {
    const redirect = getAndClearRedirect();
    if (!_.isEmpty(redirect)) {
      console.log(`Root Redirecting you to ${redirect}`);
      redirectToPath(history, redirect);
    }

    function pegView(isEntry) {
      const currentPath = window.location.pathname;
      const { action, marketId, investibleId } = decomposeMarketPath(currentPath);
      broadcastView(marketId, investibleId, isEntry, action);
    }

    const perfEntries = performance.getEntriesByType("navigation");

    let reloaded = false;
    for (let i = 0; i < perfEntries.length; i++) {
      reloaded = perfEntries[i].type === 1;
      if (reloaded) {
        break;
      }
    }
    if (reloaded) {
      // A push could have been missed and then have to rely on the user to refresh
      refreshVersions();
      refreshNotifications();
    }

    if (!window.myListenerMarker) {
      window.myListenerMarker = true;
      console.debug('Adding listeners');
      window.addEventListener('load', () => {
        console.debug('Load listener');
        pegView(true);
      });
      window.addEventListener('focus', () => {
        console.debug('Focus listener');
        pegView(true);
      });
      window.addEventListener('blur', () => {
        console.debug('Blur listener');
        pegView(false);
      });
      window.addEventListener('online', () => {
        console.debug('Back Online listener');
        setOnline(true);
        setOperationsLocked(false);
        pegView(true);
      });
      window.addEventListener('offline', () => {
        console.debug('Offline listener');
        setOnline(false);
        pegView(false);
      });
      document.addEventListener('visibilitychange', () => {
        console.debug('Visibility change listener');
        const isEntry = document.visibilityState === 'visible';
        pegView(isEntry);
      });
      window.onanimationiteration = console.debug;
    }
  },  [history, setOnline, setOperationsLocked, location]);

  return (
    <div>
      <CssBaseline/>
      <div className={classes.body}>
        <div className={classes.root}>
          <div className={classes.content}>
            <Home hidden={hideHome()}/>
            <Market hidden={hideMarket()}/>
            <Support hidden={hideSupport()}/>
            <BillingHome hidden={hideBillingHome()}/>
            <Investible hidden={hideInvestible()}/>
            <InvestibleEdit hidden={hideInvestibleEdit()}/>
            <Archives hidden={hideArchvies()}/>
            <DialogArchives hidden={hideDialogArchives()}/>
            <InvestibleAdd hidden={hideInvestibleAdd()}/>
            <DialogAdd hidden={hideAddMarket()}/>
            <DialogEdit hidden={hideDialogEdit()}/>
            <DialogManage hidden={hideDialogManage()}/>
            <MarketInvite hidden={hideMarketInvite()}/>
            <SlackInvite hidden={hideSlackInvite()}/>
            <ChangePassword hidden={hideChangePassword()}/>
            <ChangeNotificationPreferences hidden={hideChangeNotification()}/>
            <PageNotFound hidden={hidePNF}/>
          </div>
        </div>
      </div>
    </div>
  );
}

Root.propTypes = {
  appConfig: PropTypes.object.isRequired, // eslint-disable-line
};

export default Root;
