import React, { useContext } from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import {
  ArrowBack,
  ArrowForward
} from '@material-ui/icons';
import {
  formInboxItemLink,
  formInvestibleLink,
  navigate
} from '../../utils/marketIdPathFunctions';
import TooltipIconButton from '../Buttons/TooltipIconButton';
import { useHistory, useLocation } from 'react-router';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import {
  dehighlightMessage,
  isInInbox
} from '../../contexts/NotificationsContext/notificationsContextHelper';
import { addNavigation, removeNavigation } from '../../contexts/NotificationsContext/notificationsContextReducer';
import _ from 'lodash';
import {
  getMarketDetailsForType,
  getNotHiddenMarketDetailsForUser
} from '../../contexts/MarketsContext/marketsContextHelper';
import { DECISION_TYPE, PLANNING_TYPE } from '../../constants/markets';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getDecisionData, getWorkspaceData } from '../../pages/Home/YourWork/InboxExpansionPanel';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { addWorkspaceGroupAttribute } from '../../pages/Home/YourWork/InboxContext';
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext';
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext';

function getInvestibleCandidate(investible, market, navigations, isOutbox=false) {
  const candidate = {url: isOutbox ? formInboxItemLink(investible.investible.id)  :
      formInvestibleLink(market.id, investible.investible.id)};
  const candidateMeta = navigations?.find((navigation) => navigation.url === candidate.url);
  if (candidateMeta) {
    candidate.time = candidateMeta.time;
  }
  return candidate;
}

function getCommentCandidate(comment, market, navigations) {
  const candidate = {url: formInboxItemLink(comment.id)};
  const candidateMeta = navigations?.find((navigation) => navigation.url === candidate.url);
  if (candidateMeta) {
    candidate.time = candidateMeta.time;
  }
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
  const [searchResults] = useContext(SearchResultsContext);
  const location = useLocation();
  const { search: searchText } = searchResults;
  const { pathname, search, hash } = location;
  const resource = `${pathname}${search}${hash}`;
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  const planningDetails = getMarketDetailsForType(myNotHiddenMarketsState, marketPresencesState, PLANNING_TYPE);
  const { messages, navigations } = messagesState || {};
  const allMessages = messages?.filter((message) => isInInbox(message)) || [];
  const highlightedMessages = allMessages.filter((message) => message.is_highlighted);
  const orderedNavigations = _.orderBy(navigations || [], ['time'], ['desc']);
  const workspacesData = getWorkspaceData(planningDetails, marketPresencesState, investiblesState, commentsState,
    marketStagesState);
  const decisionDetails = getMarketDetailsForType(myNotHiddenMarketsState, marketPresencesState, DECISION_TYPE,
    true);
  const approvedCandidates = [];
  const outboxCandidates = [];
  workspacesData.forEach((workspaceData) => {
    const { market, approvedInvestibles, inVotingInvestibles, questions, issues, suggestions, bugs } = workspaceData;
    approvedInvestibles?.forEach((investible) => {
      const candidate = getInvestibleCandidate(investible, market, navigations);
      approvedCandidates.push(candidate);
    });
    inVotingInvestibles?.forEach((investible) => {
      const candidate = getInvestibleCandidate(investible, market, navigations, true);
      outboxCandidates.push(candidate);
    });
    const openPlanningComments = questions?.concat(issues).concat(suggestions).concat(bugs);
    openPlanningComments?.forEach((comment) => {
      const candidate = getCommentCandidate(comment, market, navigations);
      outboxCandidates.push(candidate);
    });
  });
  decisionDetails.forEach((market) => {
    const { questions, issues, suggestions } = getDecisionData(market, marketPresencesState, commentsState);
    const openDecisionComments = questions?.concat(issues).concat(suggestions);
    openDecisionComments?.forEach((comment) => {
      const candidate = getCommentCandidate(comment, market, navigations);
      outboxCandidates.push(candidate);
    });
  });
  let allExistingUrls = allMessages.map((message) => formInboxItemLink(message.type_object_id));
  allExistingUrls = allExistingUrls.concat(approvedCandidates.map((candidate) => candidate.url));
  allExistingUrls = allExistingUrls.concat(outboxCandidates.map((candidate) => candidate.url));
  const previous = _.find(orderedNavigations, (navigation) =>
    allExistingUrls.includes(navigation.url) && navigation.url !== resource);

  function computeNext() {
    const highlighted = highlightedMessages?.filter((message) =>
      formInboxItemLink(message.type_object_id) !== resource) || [];
    const highlightedMapped = addWorkspaceGroupAttribute(highlighted, groupsState);
    const highlightedOrdered =  _.orderBy(highlightedMapped, ['groupAttr', 'updated_at'],
      ['asc', 'desc']);
    if (!_.isEmpty(highlightedOrdered)) {
      const message = highlightedOrdered[0];
      return {url: formInboxItemLink(message.type_object_id), message};
    }
    // next flips through approved assignments if more than one or through the one approved assignment and outbox
    if (!_.isEmpty(approvedCandidates)&&(_.size(approvedCandidates) > 1 || _.isEmpty(outboxCandidates))) {
      const orderedApprovedCandidates = _.orderBy(approvedCandidates, ['time'], ['desc']);
      const approvedNext = _.find(orderedApprovedCandidates, (candidate) => candidate.url !== resource &&
        candidate.url !== previous?.url);
      if (approvedNext) {
        return {url: approvedNext.url};
      }
    }
    if (!_.isEmpty(outboxCandidates)) {
      let candidates = outboxCandidates;
      if (!_.isEmpty(approvedCandidates)) {
        candidates = outboxCandidates.concat(approvedCandidates);
      }
      const orderedCandidates = _.orderBy(candidates, ['time'], ['desc']);
      const candidateNext = _.find(orderedCandidates, (candidate) => candidate.url !== resource &&
        candidate.url !== previous?.url);
      if (candidateNext) {
        return {url: candidateNext.url};
      }
    }
    return {};
  }

  const nextUrl = computeNext();
  const backDisabled = _.isEmpty(previous);
  const nextDisabled = _.isEmpty(nextUrl);

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
    navigate(history, nextUrl.url);
  }

  if (!_.isEmpty(searchText)) {
    // Otherwise too confusing and think next goes to next item found or something
    return React.Fragment;
  }

  return (
        <Toolbar>
          <TooltipIconButton disabled={backDisabled}
                             icon={<ArrowBack htmlColor={backDisabled ? 'disabled' : 'white'} />}
                             onClick={doPreviousNavigation} translationId="previousNavigation" />
          <div style={{marginLeft: '0.5rem'}}/>
          <TooltipIconButton disabled={nextDisabled}
                             icon={<ArrowForward htmlColor={nextDisabled ? 'disabled' : 'white'} />}
                             onClick={doNextNavigation}
                             translationId="nextNavigation" />
        </Toolbar>

  );
}