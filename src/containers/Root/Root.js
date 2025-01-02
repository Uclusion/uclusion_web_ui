import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import { CssBaseline } from '@material-ui/core';
import { useHistory, useLocation } from 'react-router';
import Market from '../../pages/Dialog/Dialog';
import Support from '../../pages/About/Support';
import PageNotFound from '../../pages/PageNotFound/PageNotFound';
import {
  broadcastView,
  decomposeMarketPath, formMarketLink,
  getUrlForTicketPath,
  navigate,
} from '../../utils/marketIdPathFunctions';
import Investible from '../../pages/Investible/Investible';
import { OnlineStateContext } from '../../contexts/OnlineStateContext';
import SlackInvite from '../../pages/Invites/SlackInvite';
import AccountPreferences from '../../pages/Authentication/AccountPreferences';
import IntegrationPreferences from '../../pages/About/IntegrationPreferences';
import BillingHome from '../../pages/Payments/BillingHome';
import { registerMarketTokenListeners } from '../../authorization/tokenUtils';
import Wizard from '../../pages/Home/Wizard';
import InboxFull from '../../pages/Home/YourWork/InboxFull';
import CommentReplyEdit from '../../pages/Comment/CommentReplyEdit';
import PlanningMarketEdit from '../../pages/Dialog/Planning/PlanningMarketEdit';
import { isTicketPath } from '../../contexts/TicketContext/ticketIndexContextHelper';
import { TicketIndexContext } from '../../contexts/TicketContext/TicketIndexContext';
import { setOperationInProgress } from '../../components/ContextHacks/OperationInProgressGlobalProvider';
import GroupEdit from '../../pages/DialogSettings/GroupEdit';
import DialogArchives from '../../pages/DialogArchives/DialogArchives';
import { refreshVersions } from '../../api/versionedFetchUtils';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { OnboardingState, userIsLoaded } from '../../contexts/AccountContext/accountUserContextHelper';
import Screen from '../Screen/Screen';
import { useIntl } from 'react-intl';
import { DEMO_TYPE, PLANNING_TYPE } from '../../constants/markets';
import _ from 'lodash';
import {
  getNotHiddenMarketDetailsForUser,
  getSortedMarkets
} from '../../contexts/MarketsContext/marketsContextHelper';
import PlanningMarketLoad from '../../pages/Dialog/Planning/PlanningMarketLoad';
import DemoMarketLoad from '../../pages/Dialog/Planning/DemoMarketLoad';
import { getCurrentWorkspace, getFirstWorkspace } from '../../utils/redirectUtils';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getInboxTarget } from '../../contexts/NotificationsContext/notificationsContextHelper';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { findMessagesForTypeObjectId } from '../../utils/messageUtils';

const useStyles = makeStyles({
  body: {
    height: '100%',
  },
  root: {
    flexGrow: 1,
    zIndex: 1,
    overflowY: 'auto',
    position: 'relative',
    display: 'flex',
    width: '100%',
    overflowX: 'hidden',
    scrollBehavior: 'smooth'
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
  const intl = useIntl();
  const classes = useStyles();
  const { pathname } = location;
  const { marketId, investibleId, action } = decomposeMarketPath(pathname);
  const [userState] = useContext(AccountContext);
  const [, setOnline] = useContext(OnlineStateContext);
  const [ticketState] = useContext(TicketIndexContext);
  const [marketsState] = useContext(MarketsContext);
  const [commentsState] = useContext(CommentsContext);
  const [messagesState, , initialized] = useContext(NotificationsContext);
  const { marketDetails } = marketsState;
  const supportMarket = marketDetails?.find((market) => market.market_sub_type === 'SUPPORT') || {};
  const marketLink = supportMarket.id ? formMarketLink(supportMarket.id, supportMarket.id) : undefined;
  const demo = marketDetails?.find((market) => market.market_type === PLANNING_TYPE &&
    market.object_type === DEMO_TYPE);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  let markets = [];
  if (myNotHiddenMarketsState.marketDetails) {
    const filtered = myNotHiddenMarketsState.marketDetails.filter((market) =>
      market.market_type === PLANNING_TYPE);
    markets = getSortedMarkets(filtered);
  }
  const isRootPath = pathname === '/';
  const currentWorkspace = getCurrentWorkspace();
  const defaultMarket = getFirstWorkspace(markets, marketId, !isRootPath);
  const defaultMarketId = defaultMarket?.id;
  const workspaceMessage = findMessagesForTypeObjectId(`UNREAD_GROUP_${defaultMarketId}`,
    messagesState);
  const workspaceMessagePath = `${getInboxTarget()}/UNREAD_GROUP_${defaultMarketId}`;
  const defaultMarketLink = defaultMarketId ? (workspaceMessage ? workspaceMessagePath :
    formMarketLink(defaultMarketId, defaultMarketId)) : undefined;
  const isDemoUser = [OnboardingState.DemoCreated, OnboardingState.NeedsOnboarding]
    .includes(userState?.user?.onboarding_state);
  const demoCreatedUser = userState?.user?.onboarding_state === OnboardingState.DemoCreated;
  const firstMarketJoinedUser = userState?.user?.onboarding_state === OnboardingState.FirstMarketJoined;
  const isArchivedWorkspace = defaultMarket?.market_stage !== 'Active';

  function hideInbox() {
    return action !== 'inbox';
  }

  function hideWorkspaceWizard() {
    return action !== 'wizard';
  }

  function hideSupport() {
    return action !== 'support';
  }

  function hideAccountPreferences() {
    return action !== 'userPreferences';
  }

  function hideIntegrationPreferences() {
    return action !== 'integrationPreferences';
  }

  function hideMarket() {
    return (action !== 'dialog') || (!marketId) || (!!marketId && !!investibleId);
  }

  function hideDemoLoad() {
    // if notifications are loaded and no demo message then let useEffect redirect
    return !isDemoUser || !isRootPath || (initialized && !workspaceMessage)||!_.isEmpty(currentWorkspace);
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

  function hideMarketLoad() {
    return action !== 'invite';
  }

  function hideGroupSettings() {
    return action !== 'groupEdit';
  }

  function hideGroupArchive() {
    return action !== 'groupArchive';
  }

  // Page Not Found
  const hidePNF = isRootPath || !(hideMarket() && hideSupport() && hideInvestible() && hideWorkspaceWizard() &&
    hideInbox() && hideSlackInvite() && hideAccountPreferences() && hideMarketEdit() && hideGroupSettings() &&
    hideMarketLoad() && hideGroupArchive() && hideIntegrationPreferences() && hideBillingHome() && hideTodoAdd() &&
    hideCommentReplyEdit() && hideDemoLoad() && !isTicketPath(pathname));

  const isUserLoaded = userIsLoaded(userState);

  useEffect(() => {
    if (isTicketPath(pathname)) {
      const url = getUrlForTicketPath(pathname, ticketState, marketsState, commentsState);
      if (url) {
        navigate(history, url, true);
      }
    }
  },  [pathname, history, ticketState, marketsState, commentsState]);

  useEffect(() => {
    if (action === 'supportWorkspace') {
      if (marketLink) {
        navigate(history, marketLink, true);
      }
    }
  },  [action, history, marketLink]);

  useEffect(() => {
    if (isRootPath) {
      if (demoCreatedUser) {
        if (!_.isEmpty(demo)&&initialized) {
          if (!workspaceMessage) {
            // Workspace intro message gone so just navigate to market normally
            navigate(history, defaultMarketLink, true);
          } else {
            // Should be loading market already so just need url correct
            window.history.replaceState(null, '', defaultMarketLink);
          }
        }
      } else if (firstMarketJoinedUser) {
        if (!_.isEmpty(defaultMarketLink)) {
          navigate(history, defaultMarketLink, true);
        }
      }
    }
  },  [demo, history, isRootPath, demoCreatedUser, defaultMarketLink, firstMarketJoinedUser,
    initialized, workspaceMessage]);

  useEffect(() => {
    function handleViewChange(isEntry) {
      const currentPath = window.location.pathname;
      const { action, marketId, investibleId } = decomposeMarketPath(currentPath);
      broadcastView(marketId, investibleId, isEntry, action);
      if (isEntry && marketId && marketId === defaultMarketId) {
        // refresh our versions if we're entering, on a market, and not busy loading it
        refreshVersions().catch(() => console.warn('Error refreshing'));
      }
    }

    if (!window.myListenerMarker && isUserLoaded) {
      window.myListenerMarker = true;
      // console.debug('Adding listeners');
      window.addEventListener('load', () => {
        // console.debug('Load listener');
        handleViewChange(true)
      }, { passive: true })
      window.addEventListener('focus', () => {
        // console.debug('Focus listener');
        handleViewChange(true)
      }, { passive: true })
      // window.addEventListener('blur', () => {
      //   console.debug('Blur listener');
      //   handleViewChange(false);
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
      //   handleViewChange(true);
      // });
      document.addEventListener('visibilitychange', () => {
        // console.debug('Visibility change listener');
        const isEntry = document.visibilityState === 'visible'
        handleViewChange(isEntry)
      }, { passive: true })
    //  window.onanimationiteration = console.debug;
      registerMarketTokenListeners();
    }
  },  [history, setOnline, location, isUserLoaded, defaultMarketId]);

  if (action === 'supportWorkspace' || (isRootPath && firstMarketJoinedUser && _.isEmpty(defaultMarketLink))) {
    return (
      <Screen
        hidden={false}
        loading
        title={intl.formatMessage({ id: 'loadingMessage' })}
      >
        <div />
      </Screen>
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
            <Wizard hidden={hideWorkspaceWizard()} />
            <InboxFull hidden={hideInbox()} />
            <Market hidden={hideMarket()||isArchivedWorkspace}/>
            <Support hidden={hideSupport()}/>
            <BillingHome hidden={hideBillingHome()}/>
            <Investible hidden={hideInvestible()}/>
            <CommentReplyEdit hidden={hideCommentReplyEdit()} />
            <SlackInvite hidden={hideSlackInvite()}/>
            <AccountPreferences hidden={hideAccountPreferences()}/>
            <IntegrationPreferences hidden={hideIntegrationPreferences()}/>
            {(!hideMarketEdit()||(isArchivedWorkspace && !hideMarket())) && (
              <PlanningMarketEdit />
            )}
            {!hideMarketLoad() && (
              <PlanningMarketLoad />
            )}
            {!hideDemoLoad() && (
              <DemoMarketLoad onboardingState={userState?.user?.onboarding_state} demo={demo}
                              demoMessage={workspaceMessage} />
            )}
            {!hideGroupSettings() && (
              <GroupEdit />
            )}
            {!hideGroupArchive() && (
              <DialogArchives />
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
