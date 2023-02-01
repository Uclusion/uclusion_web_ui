import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { CssBaseline } from '@material-ui/core'
import { useHistory, useLocation } from 'react-router'
import Market from '../../pages/Dialog/Dialog'
import Support from '../../pages/About/Support'
import PageNotFound from '../../pages/PageNotFound/PageNotFound'
import {
  broadcastView,
  decomposeMarketPath, formCommentLink,
  formInvestibleLink, formMarketLink,
  navigate,
} from '../../utils/marketIdPathFunctions'
import Home from '../../pages/Home/Home'
import Investible from '../../pages/Investible/Investible'
import { OnlineStateContext } from '../../contexts/OnlineStateContext'
import SlackInvite from '../../pages/Invites/SlackInvite'
import ChangePassword from '../../pages/Authentication/ChangePassword'
import ChangeNotificationPreferences from '../../pages/About/ChangeNotificationPreferences'
import BillingHome from '../../pages/Payments/BillingHome'
import { registerMarketTokenListeners } from '../../authorization/tokenUtils';
import Wizard from '../../pages/Home/Wizard'
import InboxFull from '../../pages/Home/YourWork/InboxFull'
import CommentReplyEdit from '../../pages/Comment/CommentReplyEdit'
import PlanningMarketEdit from '../../pages/Dialog/Planning/PlanningMarketEdit'
import { getTicket, isJobTicket, isTicketPath } from '../../contexts/TicketContext/ticketIndexContextHelper';
import { TicketIndexContext } from '../../contexts/TicketContext/TicketIndexContext'
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import Onboarding from '../../pages/Onboarding/Onboarding';
import { IS_INVITED } from '../../utils/redirectUtils'
import { getUclusionLocalStorageItem } from '../../components/localStorageUtils'
import { setOperationInProgress } from '../../components/ContextHacks/OperationInProgressGlobalProvider';

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
  const [accountState] = useContext(AccountContext);
  const { marketId, investibleId, action } = decomposeMarketPath(pathname);
  const [, setOnline] = useContext(OnlineStateContext);
  const [ticketState] = useContext(TicketIndexContext);

  const [inOnboarding, setInOnboarding] = useState(undefined);

  function hideHome() {
    return !pathname || pathname !== '/';
  }

  function hideInbox() {
    return action !== 'inbox';
  }

  function hideWorkspaceWizard() {
    return action !== 'wizard';
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

  function hideMarket() {
    if (action === 'invite') {
      return false;
    }
    return (action !== 'dialog') || (!marketId) || (!!marketId && !!investibleId);
  }

  function hideInvestible() {
    if (pathname && pathname.startsWith('/U-')) {
      return false;
    }
    return (action !== 'dialog') || !investibleId;
  }

  function hideCommentReplyEdit() {
    return (action !== 'comment');
  }

  function hideTodoAdd() {
    return (action !== 'todoAdd');
  }

  function hideSlackInvite() {
    return action !== 'slack';
  }

  function hideBillingHome() {
    return action !== 'billing';
  }

  function hideMarketEdit() {
    return action !== 'marketEdit';
  }

  const isShortLink = pathname && (pathname.startsWith('/J-') || pathname.startsWith('/B-'));

  // Page Not Found
  const hidePNF = !(hideMarket() && hideSupport() && hideHome() && hideInvestible() && hideWorkspaceWizard() && hideInbox()
    && hideSlackInvite() && hideChangePassword() && hideMarketEdit()
    && hideChangeNotification() && hideBillingHome() && hideTodoAdd() && hideCommentReplyEdit() && !isShortLink);

  useEffect(() => {
    if (isTicketPath(pathname)) {
      const ticket = getTicket(ticketState, pathname.substring(1));
      if (ticket) {
        if (isJobTicket(pathname)) {
          const { marketId, investibleId } = ticket;
          navigate(history, formInvestibleLink(marketId, investibleId), true);
        } else {
          const { marketId, commentId, groupId } = ticket;
          navigate(history, formCommentLink(marketId, groupId, undefined, commentId), true);
        }
      }
    }
  },  [pathname, history, ticketState]);

  useEffect(() => {
    function pegView(isEntry) {
      const currentPath = window.location.pathname;
      const { action, marketId, investibleId } = decomposeMarketPath(currentPath);
      broadcastView(marketId, investibleId, isEntry, action);
    }

    if (!window.myListenerMarker) {
      window.myListenerMarker = true;
      // console.debug('Adding listeners');
      window.addEventListener('load', () => {
        // console.debug('Load listener');
        pegView(true)
      }, { passive: true })
      window.addEventListener('focus', () => {
        // console.debug('Focus listener');
        pegView(true)
      }, { passive: true })
      // window.addEventListener('blur', () => {
      //   console.debug('Blur listener');
      //   pegView(false);
      // });
      window.addEventListener('online', () => {
        // console.debug('Back Online listener');
        setOnline(true)
        setOperationInProgress(false)
      }, { passive: true })
      window.addEventListener('offline', () => {
        // console.debug('Offline listener');
        setOnline(false)
      }, { passive: true })
      // window.addEventListener('popstate', () => {
      //   console.debug('Popstate');
      //   pegView(true);
      // });
      document.addEventListener('visibilitychange', () => {
        // console.debug('Visibility change listener');
        const isEntry = document.visibilityState === 'visible'
        pegView(isEntry)
      }, { passive: true })
    //  window.onanimationiteration = console.debug;
      registerMarketTokenListeners();
    }
  },  [history, setOnline, location]);
  // onboarding overrides _EVERYTHING_ except invited
  const {user} = accountState;
  const {needs_onboarding: needsOnboarding} = user;
  const isInvited = getUclusionLocalStorageItem(IS_INVITED);
  if (isInvited !== true && (needsOnboarding || inOnboarding === true)) {
    return (
      <div>
        <CssBaseline/>
        <div className={classes.body}>
          <div className={classes.root}>
            <div className={classes.content}>
              <Onboarding onFinish={(formData) => {
                setInOnboarding(false);
                const { marketId, groupId } = formData || {};
                if (marketId && groupId) {
                  navigate(history, formMarketLink(marketId, groupId));
                }
              }} onStartOnboarding={() => setInOnboarding(true)}/>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Home - no content to prepare and we don't want its useEffects even around when not hidden
  // PlanningMarketEdit - if preserve state then when come back can have stale data
  return (
    <div>
      <CssBaseline/>
      <div className={classes.body}>
        <div className={classes.root}>
          <div className={classes.content}>
            {!hideHome() && (
              <Home />
            )}
            <Wizard hidden={hideWorkspaceWizard()} />
            <InboxFull hidden={hideInbox()} />
            <Market hidden={hideMarket()}/>
            <Support hidden={hideSupport()}/>
            <BillingHome hidden={hideBillingHome()}/>
            <Investible hidden={hideInvestible()}/>
            <CommentReplyEdit hidden={hideCommentReplyEdit()} />
            <SlackInvite hidden={hideSlackInvite()}/>
            <ChangePassword hidden={hideChangePassword()}/>
            <ChangeNotificationPreferences hidden={hideChangeNotification()}/>
            {!hideMarketEdit() && (
              <PlanningMarketEdit />
            )}
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
