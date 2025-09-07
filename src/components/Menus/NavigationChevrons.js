import React, { useContext } from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import {
  ArrowBack,
  ArrowForward
} from '@material-ui/icons';
import {
  ASSIGNED_HASH,
  formatGroupLinkWithSuffix,
  formCommentLink,
  formInboxItemLink,
  formInvestibleLink, formMarketLink,
  navigate
} from '../../utils/marketIdPathFunctions';
import TooltipIconButton from '../Buttons/TooltipIconButton';
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
  getNotHiddenMarketDetailsForUser
} from '../../contexts/MarketsContext/marketsContextHelper';
import { PLANNING_TYPE, SUPPORT_SUB_TYPE } from '../../constants/markets';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
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
import { useHotkeys } from 'react-hotkeys-hook';
import { ACTION_BUTTON_COLOR, WARNING_COLOR } from '../Buttons/ButtonConstants';
import { GroupMembersContext } from '../../contexts/GroupMembersContext/GroupMembersContext';
import { REPLY_TYPE } from '../../constants/comments';
import { getGroupPresences, getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';

function getInvestibleCandidate(investible, market, navigations, isOutbox=false) {
  const candidate = {url: formInvestibleLink(market.id, investible.investible.id)};
  const candidateMeta = navigations?.find((navigation) => navigation.url === candidate.url);
  candidate.time = candidateMeta?.time || 0;
  return candidate;
}

function getGroupCandidate(group, market, navigations) {
  const candidate = {url: formatGroupLinkWithSuffix(ASSIGNED_HASH, market.id, group.id)};
  const candidateMeta = navigations?.find((navigation) => navigation.url === candidate.url);
  candidate.time = candidateMeta?.time || 0;
  return candidate;
}

export default function NavigationChevrons() {
  const history = useHistory();
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [commentsState] = useContext(CommentsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [groupsState] = useContext(MarketGroupsContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const [searchResults] = useContext(SearchResultsContext);
  const location = useLocation();
  const { search: searchText } = searchResults;
  const { pathname, search, hash } = location;
  const resource = `${pathname}${search}${hash}`;
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  const planningDetails = getMarketDetailsForType(myNotHiddenMarketsState, marketPresencesState, PLANNING_TYPE);
  const { messages, navigations } = messagesState || {};
  // Just don't even consider going to a message that's not synced
  const allMessages = messages?.filter((message) => isInInbox(message) && messageIsSynced(message, marketsState, marketPresencesState, 
    commentsState, investiblesState, groupsState)) || [];
  const highlightedMessages = allMessages.filter((message) => message.is_highlighted);
  const orderedNavigations = _.orderBy(navigations || [], ['time'], ['desc']);
  const workspacesData = getWorkspaceData(planningDetails, marketPresencesState, investiblesState, commentsState,
    marketStagesState);
  const approvedCandidates = [];
  // Don't need outbox or read inbox as have poke button on comments and notification icons in swimlanes
  workspacesData.forEach((workspaceData) => {
    const { market, approvedInvestibles, comments } = workspaceData;
    if (market.market_sub_type !== SUPPORT_SUB_TYPE) {
      const marketPresences = getMarketPresences(marketPresencesState, market.id) || [];
      const myPresence = marketPresences.find((presence) => presence.current_user) || {};
      const groups = groupsState[market.id].filter((group) => {
        const groupPresences = getGroupPresences(marketPresences, groupPresencesState, market.id, group.id) || [];
        return !_.isEmpty(groupPresences.find((presence) => presence.id === myPresence.id));
      });
      groups?.forEach((group) => {
        const candidate = getGroupCandidate(group, market, navigations);
        approvedCandidates.push(candidate);
    });
    }
    approvedInvestibles?.forEach((investible) => {
      const openInvestibleComments = getOpenInvestibleComments(investible.investible.id, comments);
      const inProgress = openInvestibleComments.find((comment) => comment.in_progress &&
        comment.comment_type !== REPLY_TYPE);
      const candidate = getInvestibleCandidate(investible, market, navigations);
      // Only interested in in progress because if want not in progress choose it from swimlanes
      if (inProgress) {
        candidate.useUrl = formCommentLink(market.id, inProgress.group_id, inProgress.investible_id, inProgress.id);
        approvedCandidates.push(candidate);
      }
    });
  });
  let allExistingUrls = allMessages.map((message) => formInboxItemLink(message));
  allExistingUrls = allExistingUrls.concat(approvedCandidates.map((candidate) => candidate.url));
  const previous = _.find(orderedNavigations, (navigation) =>
    allExistingUrls.includes(navigation.url) && navigation.url !== resource);

  function computeNext() {
    if (resource.startsWith(`${getInboxTarget()}`)&&resource.includes('UNREAD_GROUP_')) {
      // Next from a new group message is that groups swimlanes
      const [, ,groupId] = resource.split('_');
      const groupMessage = findMessagesForTypeObjectId(`UNREAD_GROUP_${groupId}`, messagesState);
      if (groupMessage) {
        return {
          url: formMarketLink(groupMessage.market_id, groupId), message: groupMessage,
          isHighlighted: groupMessage.is_highlighted
        };
      }
    }
    const highlighted = highlightedMessages?.filter((message) => formInboxItemLink(message) !== resource) || [];
    const highlightedMapped = addWorkspaceGroupAttribute(highlighted, groupsState);
    const highlightedOrdered =  _.orderBy(highlightedMapped,
      [function isGroupInvite(msg) {
        return msg.type_object_id.includes('UNREAD_GROUP_');
      }, 'groupAttr', 'updated_at'],
      ['desc', 'asc', 'desc']);
    if (!_.isEmpty(highlightedOrdered)) {
      const message = highlightedOrdered[0];
      return {url: formInboxItemLink(message), message, isHighlighted: true};
    }

    const notHighlightedMessagesCritical = allMessages.filter((message) => !message.is_highlighted &&
      message.type === 'UNASSIGNED');
    // special case return any critical bug unhighlighted notification here
    if (!_.isEmpty(notHighlightedMessagesCritical)) {
      const criticalNext = _.find(notHighlightedMessagesCritical, (message) =>
        formInboxItemLink(message) !== resource);
      if (criticalNext) {
        const criticalNextCandidate = {url: formInboxItemLink(criticalNext)};
        const candidateMeta = navigations?.find((navigation) => navigation.url === criticalNextCandidate.url);
        criticalNextCandidate.time = candidateMeta?.time || 0;
        approvedCandidates.push(criticalNextCandidate);
      }
    }
    if (!_.isEmpty(approvedCandidates)) {
      // Time as a long gets larger so smallest would be oldest
      const orderedApprovedCandidates = _.orderBy(approvedCandidates, ['time'], ['asc']);
      // Allowed to go to previous here so can cycle through in progress assignments
      const approvedNext = _.find(orderedApprovedCandidates, (candidate) => candidate.url !== resource);
      if (approvedNext) {
        return {url: approvedNext.url, useUrl: approvedNext.useUrl};
      }
    }
    return {};
  }

  const nextUrl = computeNext();
  const backDisabled = _.isEmpty(previous);
  const nextDisabled = _.isEmpty(nextUrl);
  const nextHighlighted = nextUrl?.isHighlighted;

  function doPreviousNavigation() {
    const url = previous?.url;
    if (url) {
      if (_.find(navigations, (navigation) => navigation.url === resource)) {
        // if you are currently on a navigation need to remove it so don't go back to it
        messagesDispatch(removeNavigation(resource));
      }
      messagesDispatch(removeNavigation(url));
      navigate(history, url);
    }
  }

  function doNextNavigation() {
    if (nextUrl.message) {
      dehighlightMessage(nextUrl.message, messagesDispatch);
    }
    messagesDispatch(addNavigation(nextUrl.url, allExistingUrls));
    navigate(history, nextUrl.useUrl || nextUrl.url);
  }

  useHotkeys('ctrl+arrowRight', doNextNavigation, {enabled: !nextDisabled, enableOnContentEditable: true},
    [history, nextUrl.message, nextUrl.url]);
  useHotkeys('ctrl+arrowLeft', doPreviousNavigation,
    {enabled: !backDisabled, enableOnContentEditable: true}, [history, previous?.url]);

  if (!_.isEmpty(searchText)) {
    // Otherwise too confusing and think next goes to next item found or something
    return React.Fragment;
  }

  return (
        <Toolbar>
          <TooltipIconButton disabled={backDisabled}
                             icon={<ArrowBack htmlColor={backDisabled ? 'disabled' : ACTION_BUTTON_COLOR} />}
                             onClick={doPreviousNavigation} translationId="previousNavigation" />
          <div style={{marginLeft: '0.5rem'}}/>
          <TooltipIconButton disabled={nextDisabled}
                             icon={<ArrowForward htmlColor={nextDisabled ? 'disabled' :
                               (nextHighlighted ? WARNING_COLOR : ACTION_BUTTON_COLOR)} />}
                             onClick={doNextNavigation}
                             translationId="nextNavigation" />
        </Toolbar>

  );
}