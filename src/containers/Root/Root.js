import React, { useContext, useEffect } from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { CssBaseline } from '@material-ui/core'
import { useHistory, useLocation } from 'react-router'
import Market from '../../pages/Dialog/Dialog'
import Support from '../../pages/About/Support'
import PageNotFound from '../../pages/PageNotFound/PageNotFound'
import { broadcastView, decomposeMarketPath, } from '../../utils/marketIdPathFunctions'
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
import SlackInvite from '../../pages/Invites/SlackInvite'
import ChangePassword from '../../pages/Authentication/ChangePassword'
import ChangeNotificationPreferences from '../../pages/About/ChangeNotificationPreferences'
import BillingHome from '../../pages/Payments/BillingHome'
import { refreshNotifications, refreshVersions } from '../../contexts/VersionsContext/versionsContextHelper'
import { registerMarketTokenListeners } from '../../authorization/tokenUtils';
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
  const utm = getUtm();

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
    if (action === 'invite') {
      return false;
    }
    return (action !== 'dialog') || (!marketId) || (!!marketId && !!investibleId);
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

  function hideDialogArchives() {
    return (action !== 'dialogArchives');
  }

  function hideArchvies() {
    return (action !== 'archives');
  }

  function hideSlackInvite() {
    return action !== 'slack';
  }

  function hideBillingHome() {
    return action !== 'billing';
  }

  const hidePNF = !(hideMarket() && hideSupport() && hideHome() && hideInvestible()
    && hideDialogArchives() && hideArchvies() && hideInvestibleEdit() && hideInvestibleAdd()
    && hideAddMarket() && hideDialogEdit() && hideSlackInvite() && hideChangePassword() && hideChangeNotification()
    && hideBillingHome());

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
      refreshVersions(true).then(() => console.info('Refreshing from root'));
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
            <Home hidden={hideHome()} utm={utm}/>
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
