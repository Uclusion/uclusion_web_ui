import React, { useContext, useEffect } from 'react';
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
import { getNotHiddenMarketDetailsForUser, getSortedMarkets } from '../../contexts/MarketsContext/marketsContextHelper';
import PlanningMarketLoad from '../../pages/Dialog/Planning/PlanningMarketLoad';
import DemoMarketLoad from '../../pages/Dialog/Planning/DemoMarketLoad';
import { getFirstWorkspace } from '../../utils/redirectUtils';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import GroupManage from '../../pages/DialogSettings/GroupManage';

function Root(props) {
  const { authState } = props;
  const history = useHistory();
  const location = useLocation();
  const intl = useIntl();
  const { pathname } = location;
  const { marketId, investibleId, action } = decomposeMarketPath(pathname);
  const [userState] = useContext(AccountContext);
  const [, setOnline] = useContext(OnlineStateContext);
  const [ticketState] = useContext(TicketIndexContext);
  const [marketsState] = useContext(MarketsContext);
  const [commentsState] = useContext(CommentsContext);
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
  // Disallow support market when going to root path as it is not "Home"
  const defaultMarket = getFirstWorkspace(markets, marketId, !isRootPath, !isRootPath);
  const defaultMarketId = defaultMarket?.id;
  const defaultMarketLink = defaultMarketId ? formMarketLink(defaultMarketId, defaultMarketId) :
    undefined;
  const marketJoinedUser = userState?.user?.onboarding_state !== OnboardingState.NeedsOnboarding;
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
    return action !== 'demo';
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

  function hideGroupManage() {
    return action !== 'groupManage';
  }

  function hideGroupArchive() {
    return action !== 'groupArchive';
  }

  // Page Not Found
  const hidePNF = isRootPath || !(hideMarket() && hideSupport() && hideInvestible() && hideWorkspaceWizard() &&
    hideInbox() && hideSlackInvite() && hideAccountPreferences() && hideMarketEdit() && hideGroupSettings() &&
    hideMarketLoad() && hideGroupArchive() && hideIntegrationPreferences() && hideBillingHome() && hideTodoAdd() &&
    hideCommentReplyEdit() && hideDemoLoad() && hideGroupManage() && !isTicketPath(pathname));

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
    if (isRootPath && !_.isEmpty(defaultMarketLink)) {
      console.info('Navigating on root path to default market');
      navigate(history, defaultMarketLink, true);
    }
  },  [history, isRootPath, defaultMarketLink]);

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
        refreshVersions().catch(() => console.warn('Error refreshing'));
      }
    }

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
        setOnline(true)
        setOperationInProgress(false)
      }, { passive: true })
      window.addEventListener('offline', () => {
        console.info('Offline listener');
        setOnline(false)
      }, { passive: true })
      document.addEventListener('visibilitychange', () => {
        console.info('Visibility change listener');
        const isEntry = document.visibilityState === 'visible'
        handleViewChange(isEntry)
      }, { passive: true })
    //  window.onanimationiteration = console.debug;
      registerMarketTokenListeners();
    }
  },  [history, setOnline, location, isUserLoaded]);

  if (authState !== 'signedIn' || action === 'supportWorkspace' || (isRootPath && marketJoinedUser
    && _.isEmpty(defaultMarketLink))) {
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
        <div style={{ width: '100%', height: '100%',
          backgroundColor: (hideMarket() && hideInvestible() && hideInbox()) ? undefined : '#EDF7F8'}}>
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
            <DemoMarketLoad onboardingState={userState?.user?.onboarding_state} demo={demo} />
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
  );
}

Root.propTypes = {
  appConfig: PropTypes.object.isRequired, // eslint-disable-line
};

export default Root;
