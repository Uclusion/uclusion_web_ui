import React, { useContext, useLayoutEffect } from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import { Button, Tooltip, makeStyles, useMediaQuery, useTheme } from '@material-ui/core';
import { ArrowBack, ArrowForward, ArrowUpward } from '@material-ui/icons';
import {
  ASSIGNED_HASH,
  formatGroupLinkWithSuffix,
  formCommentLink,
  formInboxItemLink,
  formInvestibleLink, formMarketLink,
  getCanonicalNavigationUrl, getJobBackOrigin, clearJobBackOrigin, rememberSeenNavigationUrl,
  navigate
} from '../../utils/marketIdPathFunctions';
import { useIntl } from 'react-intl';
import { useHistory, useLocation } from 'react-router';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import {
  dehighlightMessage, getInboxTarget,
  isInInbox, messageIsSynced
} from '../../contexts/NotificationsContext/notificationsContextHelper';
import { addNavigation, removeNavigation } from '../../contexts/NotificationsContext/notificationsContextReducer';
import _ from 'lodash';
import {
  getMarketDetailsForType,
  getNotHiddenMarketDetailsForUser,
  marketTokenLoaded
} from '../../contexts/MarketsContext/marketsContextHelper';
import { PLANNING_TYPE } from '../../constants/markets';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { useInitialSyncComplete } from '../../api/useInitialSyncComplete';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getWorkspaceData } from '../../pages/Home/YourWork/InboxExpansionPanel';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { addWorkspaceGroupAttribute } from '../../pages/Home/YourWork/InboxContext';
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext';
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext';
import { findMessagesForTypeObjectId } from '../../utils/messageUtils';
import { getOpenInvestibleComments } from '../../contexts/CommentsContext/commentsContextHelper';
import ReturnTop from '../../pages/Home/ReturnTop';
import { useHotkeys } from 'react-hotkeys-hook';
import { WARNING_COLOR } from '../Buttons/ButtonConstants';
import { getCurrentWorkspace, getGroupForInvestibleId } from '../../utils/redirectUtils';

const useStyles = makeStyles((theme) => ({
  magicButton: {
    textTransform: 'none',
    borderRadius: '999px',
    padding: '3px 12px',
    fontSize: '0.9rem',
    color: 'black',
    backgroundColor: theme.palette.background.actionButton,
    transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
    '@media (hover: hover)': {
      '&:hover': {
        backgroundColor: '#2F80ED',
        color: 'white',
        boxShadow: '0 2px 8px rgba(255, 255, 255, 0.15)'
      },
    },
    '@media (hover: none)': {
      '&:hover': {
        backgroundColor: theme.palette.background.actionButton,
      },
    },
    '&:disabled': {
      backgroundColor: theme.palette.background.actionButton,
      color: 'rgba(0, 0, 0, 0.38)',
      opacity: 0.45
    }
  }
}));

function isInboxNavigationUrl(url = '') {
  return url.startsWith('/inbox') || url.startsWith('/outbox') || url.startsWith('outbox/');
}

export default function NavigationChevrons(props) {
  const classes = useStyles();
  const history = useHistory();
  const intl = useIntl();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'));
  const { action, pathInvestibleId, defaultMarket, pathMarketIdRaw, hashInvestibleId, isArchivedWorkspace,
    useLink, typeObjectId } = props;
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [marketsState, , tokensHash] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [commentsState] = useContext(CommentsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [groupsState] = useContext(MarketGroupsContext);
  const [searchResults] = useContext(SearchResultsContext);
  const location = useLocation();
  const { search: searchText } = searchResults;
  const { pathname, search, hash } = location;
  const resource = `${pathname}${search}${hash}`;
  // B-all-570: dormant until the sync layer itself says the initial sync has converged -
  // the market-token gate alone opens while data is still chunking in, and this body
  // otherwise re-runs messageIsSynced over every message and getWorkspaceData over every
  // market on each context tick of the cold load, starving the sync of CPU
  const initialSyncComplete = useInitialSyncComplete('navigationChevrons');
  const myNotHiddenMarketsState = !initialSyncComplete ? {} : getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  const planningDetails = !initialSyncComplete ? {} : getMarketDetailsForType(myNotHiddenMarketsState, marketPresencesState, PLANNING_TYPE);
  const stillLoading = !initialSyncComplete || marketsState.initializing ||
    !_.isEmpty((myNotHiddenMarketsState.marketDetails || []).find((market) =>
      !marketTokenLoaded(market.id, tokensHash)));
  const { messages, navigations } = messagesState || {};
  // Just don't even consider going to a message that's not synced
  const allMessages = (stillLoading ? undefined : messages)?.filter((message) => isInInbox(message) &&
    messageIsSynced(message, marketsState, marketPresencesState,
    commentsState, investiblesState, groupsState)) || [];
  const highlightedMessages = allMessages.filter((message) => message.is_highlighted);
  const orderedNavigations = _.orderBy(navigations || [], ['time'], ['desc']);
  const workspacesData = stillLoading ? [] :
    getWorkspaceData(planningDetails, marketPresencesState, investiblesState, commentsState,
      marketStagesState);
  const inProgressCandidates = [];
  const backUrls = [];
  const isMac = window.navigator.userAgentData ? window.navigator.userAgentData.platform === 'macOS' 
  : /Mac/i.test(window.navigator.userAgent);

  function getCommentUseUrl(comment) {
    return formCommentLink(comment.market_id, comment.group_id, comment.investible_id, comment.root_comment_id || comment.id);
  }

  const queryGroupId = new URLSearchParams(search).get('groupId');
  const jobGroupId = pathInvestibleId && defaultMarket?.id
    ? getGroupForInvestibleId(pathInvestibleId, defaultMarket.id, investiblesState) : undefined;
  const viewGroupId = jobGroupId || queryGroupId;
  if (viewGroupId && defaultMarket?.id) {
    backUrls.push(formMarketLink(defaultMarket.id, viewGroupId));
  }
  workspacesData.forEach((workspaceData) => {
    const { market, approvedInvestibles, comments, inVotingInvestibles } = workspaceData;
    approvedInvestibles?.forEach((investible) => {
      const openInvestibleComments = getOpenInvestibleComments(investible.investible.id, comments);
      const inProgress = openInvestibleComments.find((comment) => comment.in_progress);
      const url = formInvestibleLink(market.id, investible.investible.id);
      if (inProgress) {
        const candidateMeta = navigations?.find((navigation) => navigation.url === url);
        inProgressCandidates.push({
          url,
          useUrl: getCommentUseUrl(inProgress),
          time: candidateMeta?.time || 0
        });
      }
      backUrls.push(url);
    });
    inVotingInvestibles?.forEach((investible) => {
      backUrls.push(formInvestibleLink(market.id, investible.investible.id));
    });
  });
  const currentNavUrl = getCanonicalNavigationUrl(pathname, search);
  const allExistingUrls = allMessages.map((message) => formInboxItemLink(message)).concat(backUrls);
  if (currentNavUrl && !allExistingUrls.includes(currentNavUrl)) {
    allExistingUrls.push(currentNavUrl);
  }
  const previous = _.find(orderedNavigations, (navigation) => {
    if (navigation.url === currentNavUrl) {
      return false;
    }
    if (isInboxNavigationUrl(navigation.url) && !allExistingUrls.includes(navigation.url)) {
      return false;
    }
    return true;
  });

  function firstInProgress(excludeUrl) {
    const ordered = _.orderBy(inProgressCandidates, ['time'], ['asc']);
    return _.find(ordered, (candidate) => candidate.url !== currentNavUrl && candidate.url !== excludeUrl);
  }

  function computeForward() {
    const isOnUnreadGroupNotification = resource.startsWith(`${getInboxTarget()}`) && resource.includes('UNREAD_GROUP_');
    const isMarketLoad = ['demo', 'invite'].includes(action);
    if (isMarketLoad) {
      const marketId = getCurrentWorkspace();
      if (marketId) {
        return { url: formMarketLink(marketId, marketId), kind: 'view' };
      }
    }
    if (isOnUnreadGroupNotification) {
      const [, , groupId] = resource.split('_');
      const groupMessage = findMessagesForTypeObjectId(`UNREAD_GROUP_${groupId}`, messagesState);
      if (groupMessage) {
        return {
          url: formatGroupLinkWithSuffix(ASSIGNED_HASH, groupMessage.market_id, groupId),
          message: groupMessage,
          kind: 'message'
        };
      }
    }
    const highlighted = highlightedMessages?.filter((message) => {
      const messageUrl = formInboxItemLink(message);
      return messageUrl !== resource && messageUrl !== currentNavUrl;
    }) || [];
    const highlightedMapped = addWorkspaceGroupAttribute(highlighted, groupsState);
    const highlightedOrdered = _.orderBy(highlightedMapped,
      [function isGroupInvite(msg) {
        return msg.type_object_id.includes('UNREAD_GROUP_');
      }, 'groupAttr', 'updated_at'],
      ['desc', 'asc', 'desc']);
    if (!_.isEmpty(highlightedOrdered)) {
      const message = highlightedOrdered[0];
      return { url: formInboxItemLink(message), message, kind: 'message' };
    }
    const onJob = action === 'dialog' && !_.isEmpty(pathInvestibleId);
    const onView = action === 'dialog' && _.isEmpty(pathInvestibleId);
    const currentJobUrl = onJob && defaultMarket?.id
      ? formInvestibleLink(defaultMarket.id, pathInvestibleId) : undefined;
    const thisJobHasInProgress = onJob && inProgressCandidates.some((candidate) => candidate.url === currentJobUrl);
    if (onJob && !thisJobHasInProgress) {
      const nextInProgress = firstInProgress(currentJobUrl);
      if (nextInProgress) {
        return { url: nextInProgress.url, useUrl: nextInProgress.useUrl, kind: 'inProgress' };
      }
    }
    if (onJob && jobGroupId && defaultMarket?.id) {
      return { url: formMarketLink(defaultMarket.id, jobGroupId), kind: 'view' };
    }
    if (onView) {
      const nextInProgress = firstInProgress();
      if (nextInProgress) {
        return { url: nextInProgress.url, useUrl: nextInProgress.useUrl, kind: 'inProgress' };
      }
    }
    return {};
  }

  const nextUrl = stillLoading ? {} : computeForward();
  const backDisabled = _.isEmpty(previous);
  const nextDisabled = _.isEmpty(nextUrl?.url);
  const nextHighlighted = nextUrl?.kind === 'message';

  function doPreviousNavigation() {
    const url = previous?.url;
    if (url) {
      if (_.find(navigations, (navigation) => navigation.url === currentNavUrl)) {
        // if you are currently on a navigation need to remove it so don't go back to it
        messagesDispatch(removeNavigation(currentNavUrl));
      }
      messagesDispatch(removeNavigation(url));
      navigate(history, url);
    }
  }

  function doNextNavigation() {
    if (nextUrl.kind === 'message') {
      // Record the streak origin only. Intermediate highlighted hops are not Back targets.
      if (!isInboxNavigationUrl(currentNavUrl) || _.isEmpty(previous)) {
        messagesDispatch(addNavigation(currentNavUrl, allExistingUrls));
      }
    } else {
      messagesDispatch(addNavigation(currentNavUrl, allExistingUrls));
      messagesDispatch(addNavigation(nextUrl.url, allExistingUrls));
    }
    if (nextUrl.message) {
      dehighlightMessage(nextUrl.message, messagesDispatch);
    }
    navigate(history, nextUrl.useUrl || nextUrl.url);
  }

  useLayoutEffect(() => {
    if (stillLoading) {
      return;
    }
    const fromUrl = getJobBackOrigin();
    const onJob = action === 'dialog' && !_.isEmpty(pathInvestibleId);
    if (onJob && fromUrl && fromUrl !== currentNavUrl) {
      messagesDispatch(addNavigation(fromUrl, allExistingUrls.concat(fromUrl)));
      clearJobBackOrigin();
    }
    rememberSeenNavigationUrl(currentNavUrl);
  }, [stillLoading, currentNavUrl, action, pathInvestibleId, allExistingUrls, messagesDispatch]);

  useHotkeys(isMac ? 'ctrl+option+arrowRight' : 'ctrl+arrowRight', doNextNavigation, {enabled: !nextDisabled, enableOnContentEditable: true},
    [history, nextUrl.message, nextUrl.url, nextUrl.useUrl, nextUrl.kind, currentNavUrl, previous?.url]);
  useHotkeys(isMac ? 'ctrl+option+arrowLeft' : 'ctrl+arrowLeft', doPreviousNavigation,
    {enabled: !backDisabled, enableOnContentEditable: true}, [history, previous?.url, currentNavUrl]);
  // B-all-570: invisible during loading (after all hooks so their order is stable)
  if (stillLoading) {
    return React.Fragment;
  }
  // To make up arrow navigation work
  const returnTop = <ReturnTop action={action} pathInvestibleId={pathInvestibleId} market={defaultMarket} isMac={isMac}
            isArchivedWorkspace={isArchivedWorkspace} useLink={useLink} typeObjectId={typeObjectId} isSearch={!_.isEmpty(searchText)}
            groupId={viewGroupId} pathMarketIdRaw={pathMarketIdRaw} hashInvestibleId={hashInvestibleId}/>;

  if (!_.isEmpty(searchText)) {
    // Otherwise too confusing and think next goes to next item found or something
    return returnTop;
  }

  const forwardKind = nextUrl?.kind;
  const forwardIconColor = nextDisabled ? 'disabled' : (nextHighlighted ? WARNING_COLOR : 'black');
  const forwardIcon = forwardKind === 'view'
    ? <ArrowUpward htmlColor={forwardIconColor} />
    : <ArrowForward htmlColor={forwardIconColor} />;
  const forwardLabelId = forwardKind === 'view' ? 'navView'
    : (forwardKind === 'inProgress' ? 'inProgress' : 'navNextMessage');
  const toolTipTitle = <div>
    <p>{intl.formatMessage({ id: isMac ? 'nextNavigationMac' : 'nextNavigation' })}</p>
    <p>{intl.formatMessage({ id: isMac ? 'previousNavigationMac' : 'previousNavigation' })}</p>
    <p>{intl.formatMessage({ id: isMac ? 'upNavigationMac' : 'upNavigation' })}</p>
    <p>{intl.formatMessage({ id: isMac ? 'unrespondedNavigationMac' : 'unrespondedNavigation' })}</p>
  </div>;
  const forwardButton = <Button
    variant="outlined"
    disabled={nextDisabled}
    id={action === 'demo' || action === 'invite' ? 'nextDisplayNavigation' : 'nextNavigation'}
    onClick={doNextNavigation}
    className={classes.magicButton}
    style={{ flexShrink: 0 }}
    endIcon={forwardIcon}
  >
    {intl.formatMessage({ id: forwardLabelId })}
  </Button>;
  const backButton = mobileLayout ? null : <Button
    variant="outlined"
    disabled={backDisabled}
    id="backNavigation"
    onClick={doPreviousNavigation}
    className={classes.magicButton}
    style={{ flexShrink: 0 }}
    startIcon={<ArrowBack htmlColor={backDisabled ? 'rgba(0, 0, 0, 0.38)' : 'black'} />}
  >
    {intl.formatMessage({ id: 'navBack' })}
  </Button>;
  return (
    <>
    <Toolbar style={{ gap: '0.5rem', minHeight: '48px', flexShrink: 0, flexWrap: 'nowrap' }}>
      {nextDisabled ? forwardButton : (
        <Tooltip title={toolTipTitle}>
          {forwardButton}
        </Tooltip>
      )}
      {!mobileLayout && (backDisabled ? backButton : (
        <Tooltip title={intl.formatMessage({ id: isMac ? 'previousNavigationMac' : 'previousNavigation' })}>
          {backButton}
        </Tooltip>
      ))}
    </Toolbar>
    {returnTop}
    </>
  );
}