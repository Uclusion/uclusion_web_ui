import React, { useContext, useEffect } from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { CssBaseline } from '@material-ui/core'
import { useHistory, useLocation } from 'react-router'
import Market from '../../pages/Dialog/Dialog'
import Support from '../../pages/About/Support'
import PageNotFound from '../../pages/PageNotFound/PageNotFound'
import { broadcastView, decomposeMarketPath, navigate, } from '../../utils/marketIdPathFunctions'
import Home from '../../pages/Home/Home'
import Investible from '../../pages/Investible/Investible'
import DialogArchives from '../../pages/DialogArchives/DialogArchives'
import Archives from '../../pages/Archives/Archives'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { OnlineStateContext } from '../../contexts/OnlineStateContext'
import InvestibleEdit from '../../pages/Investible/InvestibleEdit'
import InvestibleAdd from '../../pages/Dialog/InvestibleAdd'
import DialogAdd from '../../pages/DialogAdd/DialogAdd'
import DialogEdit from '../../pages/Dialog/DialogEdit'
import DialogManage from '../../pages/Dialog/DialogManage'
import MarketInvite from '../../pages/Invites/MarketInvite'
import SlackInvite from '../../pages/Invites/SlackInvite'
import ChangePassword from '../../pages/Authentication/ChangePassword'
import ChangeNotificationPreferences from '../../pages/About/ChangeNotificationPreferences'
import BillingHome from '../../pages/Payments/BillingHome'
import { refreshNotifications, refreshVersions } from '../../contexts/VersionsContext/versionsContextHelper'
import { AccountUserContext } from '../../contexts/AccountUserContext/AccountUserContext'
import { isNewUser } from '../../contexts/AccountUserContext/accountUserContextHelper'
import { registerMarketTokenListeners } from '../../authorization/tokenUtils';
import ECPInvite from '../../pages/Invites/ECPInvite'
import { getUtm } from '../../utils/redirectUtils'

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
  const history = useHistory();
  const location = useLocation();
  const classes = useStyles();
  const { pathname } = location;
  const { marketId, investibleId, action } = decomposeMarketPath(pathname);
  const [, setOperationsLocked] = useContext(OperationInProgressContext);
  const [, setOnline] = useContext(OnlineStateContext);
  const [userState] = useContext(AccountUserContext) || {};
  const myAction = isNewUser(userState) && action !== 'invite' && action !== 'dialog' ? 'onboarding' : action;
  const utm = getUtm();

  if (myAction === 'onboarding' && myAction !== action) {
    navigate(history, '/onboarding');
  }

  function hideHome() {
    return !pathname || pathname !== '/';
  }

  function hideOnboarding() {
    return myAction !== 'onboarding';
  }

  function hideSupport() {
    return myAction !== 'support';
  }

  function hideChangePassword() {
    return myAction !== 'changePassword';
  }

  function hideChangeNotification() {
    return myAction !== 'notificationPreferences';
  }

  function hideAddMarket() {
    return myAction !== 'dialogAdd';
  }

  function hideMarket() {
    return myAction !== 'dialog' || (!marketId) || (!!marketId && !!investibleId);
  }

  function hideInvestible() {
    return (myAction !== 'dialog') || !investibleId;
  }

  function hideInvestibleEdit() {
    return (myAction !== 'investibleEdit') || !investibleId;
  }

  function hideInvestibleAdd() {
    return (myAction !== 'investibleAdd') || !marketId;
  }

  function hideDialogEdit() {
    return (myAction !== 'marketEdit') || !marketId;
  }

  function hideDialogManage() {
    return (myAction !== 'marketManage') || !marketId;
  }

  function hideDialogArchives() {
    return (myAction !== 'dialogArchives');
  }

  function hideArchvies() {
    return (myAction !== 'archives');
  }

  function hideSlackInvite() {
    return myAction !== 'slack';
  }

  function hideMarketInvite() {
    return myAction !== 'invite' || !marketId;
  }

  function hideBillingHome() {
    return myAction !== 'billing';
  }

  const hidePNF = !(hideMarket() && hideSupport() && hideHome() && hideInvestible()
    && hideDialogArchives() && hideArchvies() && hideInvestibleEdit() && hideInvestibleAdd()
    && hideAddMarket() && hideDialogEdit() && hideDialogManage() && hideMarketInvite()
    && hideSlackInvite() && hideChangePassword() && hideChangeNotification()
    && hideBillingHome() && hideOnboarding());

  useEffect(() => {
    function pegView(isEntry) {
      const currentPath = window.location.pathname;
      const { action, marketId, investibleId } = decomposeMarketPath(currentPath);
      broadcastView(marketId, investibleId, isEntry, action);
    }

    if (!window.myListenerMarker) {
      window.myListenerMarker = true;
      console.info('Reloading from versions API');
      // A push could have been missed and then have to rely on the user to refresh
      refreshVersions(true);
      refreshNotifications();
      // console.debug('Adding listeners');
      window.addEventListener('load', () => {
        // console.debug('Load listener');
        pegView(true);
      });
      window.addEventListener('focus', () => {
        // console.debug('Focus listener');
        pegView(true);
      });
      window.addEventListener('blur', () => {
        // console.debug('Blur listener');
        pegView(false);
      });
      window.addEventListener('online', () => {
        // console.debug('Back Online listener');
        setOnline(true);
        setOperationsLocked(false);
        pegView(true);
      });
      window.addEventListener('offline', () => {
        // console.debug('Offline listener');
        setOnline(false);
        pegView(false);
      });
      window.addEventListener('popstate', () => {
        // console.debug('Popstate');
        pegView(true);
      });
      document.addEventListener('visibilitychange', () => {
        // console.debug('Visibility change listener');
        const isEntry = document.visibilityState === 'visible';
        pegView(isEntry);
      });
    //  window.onanimationiteration = console.debug;
      registerMarketTokenListeners();
    }
  },  [history, setOnline, setOperationsLocked, location]);

  return (
    <div>
      <CssBaseline/>
      <div className={classes.body}>
        <div className={classes.root}>
          <div className={classes.content}>
            <ECPInvite hidden={hideOnboarding()} utm={utm} />
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
