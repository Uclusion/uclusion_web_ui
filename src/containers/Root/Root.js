import React, { useContext, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { CssBaseline } from '@material-ui/core';
import { useHistory, useLocation } from 'react-router';
import Market from '../../pages/Dialog/Dialog';
import Support from '../../pages/About/Support';
import PageNotFound from '../../pages/PageNotFound/PageNotFound';
import {
  broadcastView,
  decomposeMarketPath,
  formMarketLink,
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
import { EditCommentContext } from '../../contexts/EditCommentContext/EditCommentContext';
import EditCommentModal from '../../components/Comments/EditCommentModal';
import PlanningMarketEdit from '../../pages/Dialog/Planning/PlanningMarketEdit';
import { getTicket, isTicketPath } from '../../contexts/TicketContext/ticketIndexContextHelper';
import { TicketIndexContext } from '../../contexts/TicketContext/TicketIndexContext';
import { setOperationInProgress } from '../../components/ContextHacks/OperationInProgressGlobalProvider';
import GroupEdit from '../../pages/DialogSettings/GroupEdit';
import DialogArchives from '../../pages/DialogArchives/DialogArchives';
import { doVersionRefresh, refreshVersions } from '../../api/versionedFetchUtils';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { OnboardingState, userIsLoaded } from '../../contexts/AccountContext/accountUserContextHelper';
import Screen from '../Screen/Screen';
import { useIntl } from 'react-intl';
import { DEMO_TYPE, PLANNING_TYPE, SUPPORT_SUB_TYPE, WORKSPACE_WIZARD_TYPE } from '../../constants/markets';
import queryString from 'query-string';
import _ from 'lodash';
import { getNotHiddenMarketDetailsForUser, getSortedMarkets } from '../../contexts/MarketsContext/marketsContextHelper';
import PlanningMarketLoad from '../../pages/Dialog/Planning/PlanningMarketLoad';
import DemoMarketLoad from '../../pages/Dialog/Planning/DemoMarketLoad';
import { getFirstWorkspace } from '../../utils/redirectUtils';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import GroupManage from '../../pages/DialogSettings/GroupManage';
import ManageMarketUsers from '../../pages/Dialog/UserManagement/ManageMarketUsers';
import DemoFull from '../../pages/Dialog/Planning/DemoFull';
import { useButtonColors } from '../../components/Buttons/ButtonConstants';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext';
import { getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { getComment } from '../../contexts/CommentsContext/commentsContextHelper';
import { getGroup } from '../../contexts/MarketGroupsContext/marketGroupsContextHelper';

// T-all-2154 poll fast while a URL references data not yet local, then back off so a tab
// parked on a dead link does not hit the API every two seconds indefinitely
const DATA_POLL_FAST_MS = 2000;
const DATA_POLL_SLOW_MS = 30000;
const DATA_POLL_FAST_CUTOFF_MS = 60000;
// Focus/visibility/online triggered refreshes are speculative - skip them when a sync
// succeeded this recently (websocket pushes and the drift runner cover real changes).
const VIEW_CHANGE_REFRESH_STALENESS_MS = 30000;

function Root(props) {
  const { authState } = props;
  const history = useHistory();
  const location = useLocation();
  const intl = useIntl();
  const { pathname, search, hash } = location;
  const { marketId, investibleId, action } = decomposeMarketPath(pathname);
  const [userState] = useContext(AccountContext);
  const { lightBlueColor } = useButtonColors();
  const [, setOnline, , setShowOfflineMessage] = useContext(OnlineStateContext);
  const [ticketState] = useContext(TicketIndexContext);
  const [marketsState] = useContext(MarketsContext);
  const [commentsState] = useContext(CommentsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [groupsState] = useContext(MarketGroupsContext);
  // A ref, not state: the window listeners below are registered exactly once, so they
  // must read the current timer through a stable ref. When this was state, the 'online'
  // listener's stale closure forced re-registering all listeners while the timer was set
  // (the old `|| offlineTimer` guard escape), which piled up duplicate listeners on every
  // wifi flap and multiplied sync cycles on bad internet (C-all-1066).
  const offlineTimerRef = useRef(undefined);
  // T-all-2209 (Q-all-156 O-2): top-level edit-comment modal state, keyed by
  // comment id so it survives the comment's row unmounting when a task is moved.
  const [editComment, setEditComment] = useState(undefined);
  const editCommentValue = {
    editComment,
    openEditComment: (editMarketId, editCommentId) => setEditComment({ marketId: editMarketId, commentId: editCommentId }),
    closeEditComment: () => setEditComment(undefined),
  };
  const values = queryString.parse(search || '') || {};
  const { utm_campaign: utm } = values;
  const { marketDetails } = marketsState;
  const supportMarket = marketDetails?.find((market) => market.market_sub_type === SUPPORT_SUB_TYPE) || {};
  const marketLink = supportMarket.id ? formMarketLink(supportMarket.id, supportMarket.id) : undefined;
  const teamDemo = marketDetails?.find((market) => market.market_type === PLANNING_TYPE &&
    market.object_type === DEMO_TYPE && market.name.includes('team'));
  const soloDemo = marketDetails?.find((market) => market.market_type === PLANNING_TYPE &&
    market.object_type === DEMO_TYPE && market.name.includes('solo'));
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  let markets = [];
  if (myNotHiddenMarketsState.marketDetails) {
    const filtered = myNotHiddenMarketsState.marketDetails.filter((market) =>
      market.market_type === PLANNING_TYPE);
    markets = getSortedMarkets(filtered);
  }
  const isRootPath = pathname === '/';
  // Disallow support market when going to root path as it is not "Home"
  const defaultMarket = getFirstWorkspace(markets, marketId, !isRootPath, !isRootPath);
  const defaultMarketId = defaultMarket?.id;
  const defaultMarketLink = defaultMarketId ? formMarketLink(defaultMarketId, defaultMarketId) :
    undefined;
  const marketJoinedUser = userState?.user?.onboarding_state !== OnboardingState.NeedsOnboarding;
  const isArchivedWorkspace = defaultMarket?.market_stage !== 'Active';
  const isDemoWorkspace = defaultMarket?.market_type === PLANNING_TYPE && defaultMarket?.object_type === DEMO_TYPE;

  function hideInbox() {
    return action !== 'inbox';
  }

  function hideOutbox() {
    return action !== 'outbox';
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
    return action !== 'demo' || (_.isEmpty(utm)&&!_.isEmpty(teamDemo)&&!_.isEmpty(soloDemo));
  }

  function hideDemosFull() {
    // If there is a utm then will just end up going to intro page for that demo
    return action !== 'demo' || !_.isEmpty(utm) || _.isEmpty(teamDemo) || _.isEmpty(soloDemo);
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

  function hideManageUsers() {
    return action !== 'manageUsers';
  }

  function hideMarketLoad() {
    return action !== 'invite';
  }

  function hideGroupSettings() {
    return action !== 'groupEdit';
  }

  function hideGroupManage() {
    return action !== 'groupManage';
  }

  function hideGroupArchive() {
    return action !== 'groupArchive';
  }

  // Page Not Found
  const hidePNF = isRootPath || !(hideMarket() && hideSupport() && hideInvestible() && hideWorkspaceWizard() && hideDemosFull() &&
    hideInbox() && hideOutbox() && hideSlackInvite() && hideAccountPreferences() && hideMarketEdit() && hideManageUsers() && 
    hideGroupSettings() && hideMarketLoad() && hideGroupArchive() && hideIntegrationPreferences() && hideBillingHome() && 
    hideTodoAdd() && hideCommentReplyEdit() && hideDemoLoad() && hideGroupManage() && !isTicketPath(pathname));

  const isUserLoaded = userIsLoaded(userState, marketsState);
  const dataPollTimerRef = useRef(null);

  useEffect(() => {
    function clearDataPoll() {
      if (dataPollTimerRef.current) {
        clearTimeout(dataPollTimerRef.current);
        dataPollTimerRef.current = null;
      }
    }
    function startDataPoll() {
      if (dataPollTimerRef.current) {
        return;
      }
      const startedAt = Date.now();
      const poll = () => {
        doVersionRefresh().catch(() => console.warn('Error refreshing for missing data'));
        const delay = Date.now() - startedAt > DATA_POLL_FAST_CUTOFF_MS ? DATA_POLL_SLOW_MS : DATA_POLL_FAST_MS;
        dataPollTimerRef.current = setTimeout(poll, delay);
      };
      dataPollTimerRef.current = setTimeout(poll, DATA_POLL_FAST_MS);
    }
    function isMissingDialogData() {
      if (action !== 'dialog' || _.isEmpty(marketId)) {
        return false;
      }
      if (marketsState.initializing || commentsState.initializing || investiblesState.initializing ||
        groupsState.initializing) {
        // Cannot tell what is missing until local storage loads
        return false;
      }
      if (!_.isEmpty(investibleId) && _.isEmpty(getInvestible(investiblesState, investibleId)) &&
        _.isEmpty(getGroup(groupsState, marketId, investibleId))) {
        // The third path token is an investible on job URLs and a group on group URLs
        return true;
      }
      if (hash && hash.startsWith('#c') && !hash.startsWith('#cv')) {
        const commentId = hash.substring(2);
        return _.isEmpty(getComment(commentsState, marketId, commentId));
      }
      return false;
    }
    if (isTicketPath(pathname)) {
      const url = getUrlForTicketPath(pathname, ticketState, marketsState, commentsState);
      if (url) {
        clearDataPoll();
        navigate(history, url, true);
      } else {
        // Poll until we have enough data locally to resolve the ticket path to a URL.
        // Each refresh dispatches into the ticket/markets/comments contexts, which re-runs this
        // effect and gives us another chance to resolve the URL.
        startDataPoll();
      }
    } else if (isMissingDialogData()) {
      // T-all-2154 dialog URLs can also reference data not yet local, e.g. a new job or comment
      startDataPoll();
    } else {
      clearDataPoll();
    }
  },  [pathname, hash, action, marketId, investibleId, history, ticketState, marketsState, commentsState,
    investiblesState, groupsState]);

  useEffect(() => {
    if (authState !== 'signedIn' && dataPollTimerRef.current) {
      clearTimeout(dataPollTimerRef.current);
      dataPollTimerRef.current = null;
    }
  },  [authState]);

  useEffect(() => {
    if (action === 'supportWorkspace') {
      if (marketLink) {
        navigate(history, marketLink, true);
      }
    }
  },  [action, history, marketLink]);

  useEffect(() => {
    if (isRootPath) {
      if (isDemoWorkspace) {
        console.info('Navigating to create workspace with default demo market');
        navigate(history, `/wizard#type=${WORKSPACE_WIZARD_TYPE.toLowerCase()}`);
      } else if (!_.isEmpty(defaultMarketLink)) {
        console.info('Navigating on root path to default market');
        navigate(history, defaultMarketLink, true);
      }
    }
  },  [history, isRootPath, defaultMarketLink, isDemoWorkspace]);

  useEffect(() => {
    function handleViewChange(isEntry) {
      const currentPath = window.location.pathname;
      const { action, marketId, investibleId } = decomposeMarketPath(currentPath);
      broadcastView(marketId, investibleId, isEntry, action);
      if (isEntry) {
        console.info('Refresh versions in view change');
        // refresh if entering - lock will prevent concurrent refresh
        // Concurrent market load is something already happening potentially from leader context
        // However, should not be anything to get until invite or demo api called
        // Speculative refresh: skip when a refresh is in flight or one succeeded recently,
        // so focus + visibilitychange both firing on a tab return costs one cycle, not two,
        // and rapid tab flipping on bad internet does not queue endless syncs (C-all-1066).
        refreshVersions(undefined, VIEW_CHANGE_REFRESH_STALENESS_MS)
          .catch(() => console.warn('Error refreshing'));
      }
    }

    // Register exactly once per page load. Everything mutable the listeners touch is a
    // ref or a stable setter, so there is no stale-closure reason to ever re-register
    // (the old offlineTimer escape hatch duplicated listeners on every wifi flap).
    if (!window.myListenerMarker && isUserLoaded) {
      window.myListenerMarker = true;

      window.addEventListener('load', () => {
        console.info('Load listener');
        handleViewChange(true)
      }, { passive: true })
      window.addEventListener('focus', () => {
        console.info('Focus listener');
        handleViewChange(true)
      }, { passive: true })
      window.addEventListener('online', () => {
        console.info('Online listener');
        setOnline(true);
        clearTimeout(offlineTimerRef.current);
        offlineTimerRef.current = undefined;
        setShowOfflineMessage(false);
        setOperationInProgress(false);
        // Connectivity is back - sync now instead of waiting for the next interval tick,
        // with the same staleness guard so a flapping connection cannot cause churn.
        refreshVersions(undefined, VIEW_CHANGE_REFRESH_STALENESS_MS)
          .catch(() => console.warn('Error refreshing'));
      }, { passive: true })
      window.addEventListener('offline', () => {
        console.info('Offline listener');
        setOnline(false);
        clearTimeout(offlineTimerRef.current);
        offlineTimerRef.current = setTimeout(() => {
          setShowOfflineMessage(true);
        }, 5000);
      }, { passive: true })
      document.addEventListener('visibilitychange', () => {
        console.info('Visibility change listener');
        const isEntry = document.visibilityState === 'visible'
        handleViewChange(isEntry)
      }, { passive: true })
    //  window.onanimationiteration = console.debug;
      registerMarketTokenListeners();
    }
  },  [history, setOnline, isUserLoaded, setShowOfflineMessage]);

  if (authState !== 'signedIn' || action === 'supportWorkspace' || (action === 'demo' && marketsState.initializing) || 
    (isRootPath && marketJoinedUser && _.isEmpty(defaultMarketLink))||(isTicketPath(pathname)&&!getTicket(ticketState, pathname.substring(1)))) {
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
  // BillingHome - try remove from memory when not in use but Stripe does stuff with own Javascript VM anyway
  // InboxFull and Market - reduce churn by keeping out of existance until first market loaded
  return (
    <EditCommentContext.Provider value={editCommentValue}>
    <div>
      <CssBaseline/>
        <EditCommentModal />
        <div style={{ width: '100%', height: '100%',
          backgroundColor: (hideMarket() && hideInvestible() && hideInbox() && hideOutbox() && hideDemoLoad() && hideDemosFull()
          && hideMarketLoad() && hideWorkspaceWizard() && hideCommentReplyEdit()) ? undefined : lightBlueColor}}>
          <Wizard hidden={hideWorkspaceWizard()} />
          <DemoFull hidden={hideDemosFull()} />
          {marketJoinedUser && (
            <InboxFull hidden={hideInbox()&&hideOutbox()} isInbox={!hideInbox()} />
          )}
          {marketJoinedUser && (
            <Market hidden={hideMarket()||isArchivedWorkspace}/>
          )}
          <Support hidden={hideSupport()}/>
          {!hideBillingHome() && (
            <BillingHome />
          )}
          <Investible hidden={hideInvestible()}/>
          <CommentReplyEdit hidden={hideCommentReplyEdit()} />
          <SlackInvite hidden={hideSlackInvite()}/>
          <AccountPreferences hidden={hideAccountPreferences()}/>
          <IntegrationPreferences hidden={hideIntegrationPreferences()}/>
          {(!hideMarketEdit()||(isArchivedWorkspace && !hideMarket())) && (
            <PlanningMarketEdit />
          )}
          {!hideManageUsers() && !_.isEmpty(defaultMarket) && (
            <ManageMarketUsers market={defaultMarket}/>
          )}
          {!hideMarketLoad() && (
            <PlanningMarketLoad />
          )}
          {!hideDemoLoad() && (
            <DemoMarketLoad soloDemo={soloDemo} teamDemo={teamDemo} />
          )}
          {!hideGroupSettings() && (
            <GroupEdit />
          )}
          {!hideGroupManage() && (
            <GroupManage />
          )}
          {!hideGroupArchive() && (
            <DialogArchives />
          )}
          <PageNotFound hidden={hidePNF}/>
        </div>
    </div>
    </EditCommentContext.Provider>
  );
}

Root.propTypes = {
  appConfig: PropTypes.object.isRequired, // eslint-disable-line
};

export default Root;
