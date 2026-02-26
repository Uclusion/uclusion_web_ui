import React, { useContext } from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import { Button, IconButton, Tooltip, makeStyles, useMediaQuery, useTheme } from '@material-ui/core';
import { ArrowForward } from '@material-ui/icons';
import {
  ASSIGNED_HASH,
  formatGroupLinkWithSuffix,
  formCommentLink,
  formInboxItemLink,
  formInvestibleLink, formMarketLink,
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
import { WARNING_COLOR } from '../Buttons/ButtonConstants';
import { GroupMembersContext } from '../../contexts/GroupMembersContext/GroupMembersContext';
import { getGroupPresences, getMarketPresences, isAutonomousGroup } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import ReturnTop from '../../pages/Home/ReturnTop';
import { getCurrentWorkspace } from '../../utils/redirectUtils';
import { getMarketInfo } from '../../utils/userFunctions';
import { getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper';

const useStyles = makeStyles((theme) => ({
  magicButton: {
    textTransform: 'none',
    borderRadius: '8px',
    padding: '6px 16px',
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
    '&:disabled': {
      backgroundColor: 'transparent'
    }
  }
}));

function getInvestibleCandidate(investible, market, navigations) {
  const candidate = {url: formInvestibleLink(market.id, investible.investible.id), title: 'job'};
  const candidateMeta = navigations?.find((navigation) => navigation.url === candidate.url);
  candidate.time = candidateMeta?.time || 0;
  return candidate;
}

function getGroupCandidate(group, market, navigations) {
  const candidate = {url: formMarketLink(market.id, group.id), useUrl: formatGroupLinkWithSuffix(ASSIGNED_HASH, market.id, group.id), title: 'view'};
  const candidateMeta = navigations?.find((navigation) => navigation.url === candidate.url);
  candidate.time = candidateMeta?.time || 0;
  return candidate;
}

export default function NavigationChevrons(props) {
  const classes = useStyles();
  const history = useHistory();
  const intl = useIntl();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const { action, pathInvestibleId, defaultMarket, chosenGroup, pathMarketIdRaw, hashInvestibleId, isArchivedWorkspace,
    useLink, typeObjectId } = props;
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
  const inProgressCandidates = [];
  const assistantanceCandidates = [];
  const inVotingCandidates = [];
  const groupCandidates = [];

  function getCommentUseUrl(comment) {
    return formCommentLink(comment.market_id, comment.group_id, comment.investible_id, comment.root_comment_id || comment.id);
  }

  function processComment(comment, market) {
    if (comment.investible_id) {
      const investible = getInvestible(investiblesState, market.id, comment.investible_id);
      const marketInfo = getMarketInfo(investible, market.id);
      const isAssigned = marketInfo?.assigned?.includes(comment.created_by);
      if (isAssigned) {
        const candidate = getInvestibleCandidate(investible, market, navigations);
        // Use root comment id if it exists as you can't go to a reply directly
        candidate.useUrl = getCommentUseUrl(comment);
        assistantanceCandidates.push(candidate);
      }
    }
  }

  function getCandidates() {
    if (!_.isEmpty(inProgressCandidates)) {
      return inProgressCandidates;
    }
    if (!_.isEmpty(approvedCandidates)) {
      return approvedCandidates;
    }
    if (!_.isEmpty(assistantanceCandidates)) {
      return assistantanceCandidates;
    }
    if (!_.isEmpty(inVotingCandidates)) {
      return inVotingCandidates;
    }
    return [];
  }
  // Don't need outbox or read inbox as have poke button on comments and notification icons in swimlanes
  workspacesData.forEach((workspaceData) => {
    const { market, approvedInvestibles, comments, questions, issues, suggestions, 
      inVotingInvestibles  } = workspaceData;
    if (market.market_sub_type !== SUPPORT_SUB_TYPE) {
      const marketPresences = getMarketPresences(marketPresencesState, market.id) || [];
      const myPresence = marketPresences.find((presence) => presence.current_user) || {};
      let hasAutonomousGroup = undefined;
      const groups = groupsState[market.id]?.filter((group) => {
        const groupPresences = getGroupPresences(marketPresences, groupPresencesState, market.id, group.id) || [];
        const isMember = !_.isEmpty(groupPresences?.find((presence) => presence.id === myPresence.id))
        if (isAutonomousGroup(groupPresences, group) && isMember) {
          hasAutonomousGroup = group;
        }
        return isMember;
      });
      if (hasAutonomousGroup) {
        const candidate = getGroupCandidate(hasAutonomousGroup, market, navigations);
        groupCandidates.push(candidate);
      } else {
        groups?.forEach((group) => {
          const candidate = getGroupCandidate(group, market, navigations);
          groupCandidates.push(candidate);
        });
      }
    }
    approvedInvestibles?.forEach((investible) => {
      const openInvestibleComments = getOpenInvestibleComments(investible.investible.id, comments);
      const inProgress = openInvestibleComments.find((comment) => comment.in_progress);
      const candidate = getInvestibleCandidate(investible, market, navigations);
      // Only interested in in progress because if want not in progress choose it from swimlanes
      if (inProgress) {
        candidate.useUrl = getCommentUseUrl(inProgress);
        candidate.title = 'task';
        inProgressCandidates.push(candidate);
      } else {
        candidate.title = 'job';
        approvedCandidates.push(candidate);
      }
    });
    questions?.forEach((question) => {
      processComment(question, market);
    });
    issues?.forEach((issue) => {
      processComment(issue, market);
    });
    suggestions?.forEach((suggestion) => {
      processComment(suggestion, market);
    });
    inVotingInvestibles?.forEach((investible) => {
      const candidate = getInvestibleCandidate(investible, market, navigations);
      inVotingCandidates.push(candidate);
    });
  });
  let allExistingUrls = allMessages.map((message) => formInboxItemLink(message));
  allExistingUrls = allExistingUrls.concat(getCandidates().concat(groupCandidates).map((candidate) => candidate.url));
  const previous = _.find(orderedNavigations, (navigation) =>
    allExistingUrls.includes(navigation.url) && navigation.url !== resource);

  function computeNext() {
    const isOnUreadGroupNotification = resource.startsWith(`${getInboxTarget()}`)&&resource.includes('UNREAD_GROUP_');
    const isMarketLoad = ['demo', 'invite'].includes(action);
    if (isMarketLoad) {
      const marketId = getCurrentWorkspace();
      if (marketId) {
        return {url: formMarketLink(marketId, marketId), message: undefined, isHighlighted: true, title: 'view'};
      }
    }
    if (isOnUreadGroupNotification) {
      // Next from a new group message is that groups swimlanes
      const [, ,groupId] = resource.split('_');
      const groupMessage = findMessagesForTypeObjectId(`UNREAD_GROUP_${groupId}`, messagesState);
      if (groupMessage) {
        return {
          url: formatGroupLinkWithSuffix(ASSIGNED_HASH, groupMessage.market_id, groupId), message: groupMessage, title: 'view',
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
      return {url: formInboxItemLink(message), message, isHighlighted: true, title: 'message'};
    }
    const candidates = getCandidates();
    if (!_.isEmpty(candidates)) {
      const candidatesExtended = candidates.concat(groupCandidates);
      // Time as a long gets larger so smallest would be oldest
      const orderedCandidates = _.orderBy(candidatesExtended, ['time'], ['asc']);
      // Allowed to go to previous here so can cycle through candidates
      const next = _.find(orderedCandidates, (candidate) => candidate.url !== resource);
      if (next) {
        return {url: next.url, useUrl: next.useUrl, title: next.title};
      }
    }

    if (!_.isEmpty(allMessages)) {
      // Just go to inbox for them to choose a message
      return {url: getInboxTarget(allMessages[0]), isHighlighted: false, title: 'message'};
    }
    // Don't know what to do so disable next - alternatively could go to compose button but that's not great
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
    // Add the current resource so that it can be matched with a candidate for time and previous can return to it
    messagesDispatch(addNavigation(resource, allExistingUrls));
    messagesDispatch(addNavigation(nextUrl.url, allExistingUrls));
    if (nextUrl.message) {
      dehighlightMessage(nextUrl.message, messagesDispatch);
    }
    navigate(history, nextUrl.useUrl || nextUrl.url);
  }

  useHotkeys('ctrl+arrowRight', doNextNavigation, {enabled: !nextDisabled, enableOnContentEditable: true},
    [history, nextUrl.message, nextUrl.url]);
  useHotkeys('ctrl+arrowLeft', doPreviousNavigation,
    {enabled: !backDisabled, enableOnContentEditable: true}, [history, previous?.url]);
  // To make up arrow navigation work
  const returnTop = <ReturnTop action={action} pathInvestibleId={pathInvestibleId} market={defaultMarket}
            isArchivedWorkspace={isArchivedWorkspace} useLink={useLink} typeObjectId={typeObjectId} isSearch={!_.isEmpty(searchText)}
            groupId={chosenGroup} pathMarketIdRaw={pathMarketIdRaw} hashInvestibleId={hashInvestibleId}/>;

  if (!_.isEmpty(searchText)) {
    // Otherwise too confusing and think next goes to next item found or something
    return returnTop;
  }

  if (mobileLayout) {
    return (
      <Toolbar>
        <IconButton
          disabled={nextDisabled}
          className={classes.magicButton}
          onClick={doNextNavigation}
        > <ArrowForward htmlColor={nextDisabled ? 'disabled' :
          (nextHighlighted ? WARNING_COLOR : 'black')} />
        </IconButton>
      </Toolbar>
    );
  }

  const toolTipTitle = <div><p>{intl.formatMessage({ id: 'nextNavigation' })}</p>
  <p>{intl.formatMessage({ id: 'previousNavigation' })}</p>
  <p>{intl.formatMessage({ id: 'upNavigation' })}</p></div>;
  const buttonContent = <Button
    variant="outlined"
    disabled={nextDisabled}
    id={action === 'demo' || action === 'invite' ? 'nextDisplayNavigation' : 'nextNavigation'}
    onClick={doNextNavigation}
    className={classes.magicButton}
    endIcon={<ArrowForward htmlColor={nextDisabled ? 'disabled' :
      (nextHighlighted ? WARNING_COLOR : 'black')} />}
  >
    Next {nextUrl?.title || ''}
  </Button>;
  return (
    <>
    <Toolbar>
      {nextDisabled ? buttonContent : (
        <Tooltip title={toolTipTitle}>
          {buttonContent}
        </Tooltip>
      )}
    </Toolbar>
    {returnTop}
    </>
  );
}