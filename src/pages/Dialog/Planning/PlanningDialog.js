/**
 * A component that renders a single group's view of a planning market
 */
import React, { useContext, useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router';
import { FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Grid, Link, useMediaQuery, useTheme } from '@material-ui/core';
import Screen from '../../../containers/Screen/Screen';
import {
  ISSUE_TYPE,
  QUESTION_TYPE,
  REPLY_TYPE,
  REPORT_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE
} from '../../../constants/comments';
import CommentBox, { getSortedRoots } from '../../../containers/CommentBox/CommentBox';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import {
  getGroupPresences,
  getMarketPresences,
  getPresenceMap, isAutonomousGroup
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import DismissableText from '../../../components/Notifications/DismissableText';
import ArchiveInvestbiles from '../../DialogArchives/ArchiveInvestibles';
import { getInvestible, getInvestiblesInStage } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import MarketTodos from './MarketTodos';
import {
  getFullStage, getFurtherWorkStage,
  isAcceptedStage,
  isBlockedStage,
  isFurtherWorkStage,
  isInReviewStage,
  isRequiredInputStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext';
import { getPageReducerPage, usePageStateReducer } from '../../../components/PageState/pageStateHooks';
import AssignmentIcon from '@material-ui/icons/Assignment';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import { getGroup } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper';
import { GmailTabItem, GmailTabs } from '../../../containers/Tab/Inbox';
import { AssignmentInd, BugReport } from '@material-ui/icons';
import Backlog from './Backlog';
import InvestiblesByPerson from './InvestiblesByPerson';
import { SECTION_TYPE_SECONDARY_WARNING } from '../../../constants/global';
import SubSection from '../../../containers/SubSection/SubSection';
import {
  addMarketComments,
  filterToRoot,
  getInvestibleComments,
  getMarketComments
} from '../../../contexts/CommentsContext/commentsContextHelper';
import {
  ASSIGNED_HASH,
  BACKLOG_HASH,
  DISCUSSION_HASH,
  formArchiveCommentLink,
  formGroupArchiveLink,
  formGroupEditLink, formGroupManageLink,
  formMarketAddCommentLink, formMarketAddInvestibleLink, formWizardLink,
  navigate
} from '../../../utils/marketIdPathFunctions';
import { DISCUSSION_WIZARD_TYPE, JOB_STAGE_WIZARD_TYPE } from '../../../constants/markets';
import DialogOutset from './DialogOutset';
import SettingsIcon from '@material-ui/icons/Settings';
import MenuBookIcon from '@material-ui/icons/MenuBook';
import SpinningButton from '../../../components/SpinBlocking/SpinningButton';
import { wizardStyles } from '../../../components/AddNewWizards/WizardStylesContext';
import AddIcon from '@material-ui/icons/Add';
import { stageChangeInvestible } from '../../../api/investibles';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import SwimlanesOnboardingBanner from '../../../components/Banners/SwimlanesOnboardingBanner';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { getMarket, marketIsDemo } from '../../../contexts/MarketsContext/marketsContextHelper';
import EditIcon from '@material-ui/icons/Edit';
import { hasDiscussionComment } from '../../../components/AddNewWizards/Discussion/AddCommentStep';
import { useHotkeys } from 'react-hotkeys-hook';
import { findMessagesForCommentIds, findMessagesForInvestibleIds } from '../../../utils/messageUtils';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { isInInbox } from '../../../contexts/NotificationsContext/notificationsContextHelper';
import { RED_LEVEL } from '../../../constants/notifications';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import { calculateInvestibleVoters } from '../../../utils/votingUtils';
import { getSwimlaneInvestiblesForStage } from './userUtils';
import LightbulbOutlined from '../../../components/CustomChip/LightbulbOutlined';

function getAnchorId(tabIndex) {
  switch (tabIndex) {
    case 0:
      return 'storiesSection';
    case 1:
      return 'backlogSection';
    case 2:
      return 'marketTodos'
    case 3:
      return 'discussionSection';
    default:
      return 'storiesSection';
  }
}

function PlanningDialog(props) {
  const {
    marketInvestibles,
    marketStages,
    hidden,
    myPresence,
    banner,
    marketId,
    groupId
  } = props;
  const [searchResults] = useContext(SearchResultsContext);
  const { results, parentResults, search } = searchResults;
  const history = useHistory();
  const location = useLocation();
  const { hash } = location;
  const intl = useIntl();
  const wizardClasses = wizardStyles();
  const theme = useTheme();
  const refToTop = useRef();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'));
  const [investibleState, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [groupState] = useContext(MarketGroupsContext);
  const [marketsState] = useContext(MarketsContext);
  const [messagesState] = useContext(NotificationsContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const [, diffDispatch] = useContext(DiffContext);
  const market = getMarket(marketsState, marketId) || {};
  const group = getGroup(groupState, marketId, groupId);
  const { name: groupName } = group || {};
  const marketComments = getMarketComments(commentsState, marketId) || [];
  const unResolvedGroupComments = marketComments.filter(comment => !comment.investible_id &&
    !comment.resolved && comment.group_id === groupId) || [];
  // There is no link to a reply so including them should be okay
  const notTodoGroupComments = unResolvedGroupComments.filter(comment =>
    [QUESTION_TYPE, SUGGEST_CHANGE_TYPE, REPORT_TYPE, REPLY_TYPE].includes(comment.comment_type)) || [];
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [pageStateFull, pageDispatch] = usePageStateReducer('group');
  const [pageState, updatePageState] = getPageReducerPage(pageStateFull, pageDispatch, groupId,
    {sectionOpen: 'storiesSection', tabIndex: 0 });
  const {
    sectionOpen,
    tabIndex
  } = pageState;
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const groupPresences = getGroupPresences(marketPresences, groupPresencesState, marketId, groupId) || [];
  const isSingleUser = groupPresences?.length === 1;
  const isAutonomous = isAutonomousGroup(groupPresences, group);
  const furtherWorkStage = marketStages.find((stage) => isFurtherWorkStage(stage)) || {};
  const investiblesFullAssist = marketInvestibles.filter((investible) => {
    const marketInfo = getMarketInfo(investible, marketId);
    const { group_id: otherGroupId, investible_id: investibleId } = marketInfo;
    const otherGroupPresences = getGroupPresences(marketPresences, groupPresencesState, marketId, otherGroupId) || [];
    const thisGroupPresenceId = isAutonomous ? groupPresences[0].id : undefined;
    const isGroupMember = !_.isEmpty(otherGroupPresences.find((aPresence) =>
      aPresence.id === thisGroupPresenceId));
    const investedOrAddressed = calculateInvestibleVoters(investibleId, marketId, marketsState, investibleState,
      marketPresences, true, true);
    const isSubscribed = !_.isEmpty(investedOrAddressed.find((investor) => !investor.abstain &&
      investor.id === thisGroupPresenceId));
    return otherGroupId === groupId || (isAutonomous && marketInfo.assigned?.includes(thisGroupPresenceId))
      || (isAutonomous && marketInfo.stage === furtherWorkStage.id && (isGroupMember || isSubscribed));
  });
  const investiblesViewOnly = marketInvestibles.filter((investible) => {
    const marketInfo = getMarketInfo(investible, marketId);
    return marketInfo.group_id === groupId;
  });
  const acceptedStage = marketStages.find(stage => isAcceptedStage(stage)) || {};
  const inDialogStage = marketStages.find(stage => stage.allows_investment) || {};
  const inReviewStage = marketStages.find(stage => isInReviewStage(stage)) || {};
  const inBlockingStage = marketStages.find(stage => isBlockedStage(stage)) || {};
  const visibleStages = marketStages.filter((stage) => stage.appears_in_context) || [];
  const requiresInputStage = marketStages.find((stage) => isRequiredInputStage(stage)) || {};
  const furtherWorkInvestiblesFullAssist = getInvestiblesInStage(investiblesFullAssist, furtherWorkStage.id,
    marketId) || [];
  const furtherWorkReadyToStartFullAssist = _.remove(furtherWorkInvestiblesFullAssist, (investible) => {
    const marketInfo = getMarketInfo(investible, marketId);
    const { open_for_investment: openForInvestment } = marketInfo;
    return openForInvestment;
  });
  const furtherWorkNotReadyFullAssist = furtherWorkInvestiblesFullAssist.filter((investible) => {
    const investibleComments = getInvestibleComments(investible.investible.id, marketId, commentsState);
    return !_.isEmpty(investibleComments.find((comment) => !comment.resolved &&
      [QUESTION_TYPE, SUGGEST_CHANGE_TYPE, ISSUE_TYPE].includes(comment.comment_type)));
  });
  const requiresInputInvestiblesFullAssist = getInvestiblesInStage(investiblesFullAssist, requiresInputStage.id,
    marketId);
  const blockedInvestiblesFullAssist = getInvestiblesInStage(investiblesFullAssist, inBlockingStage.id, marketId);
  const blockedOrRequiresInputOrReadyInvestiblesFullAssist = blockedInvestiblesFullAssist
    .concat(requiresInputInvestiblesFullAssist).concat(furtherWorkReadyToStartFullAssist)
    .concat(furtherWorkNotReadyFullAssist);
  const swimlaneInvestibles = investiblesFullAssist.filter((inv) => {
    const marketInfo = getMarketInfo(inv, marketId) || {};
    const stage = marketStages.find((stage) => stage.id === marketInfo.stage);
    return stage && stage.appears_in_context && stage.allows_tasks;
  });
  const swimlaneCompleteInvestibles = getSwimlaneInvestiblesForStage(investiblesFullAssist, inReviewStage,
    marketId, marketComments, messagesState)
  const activeInvestibles = swimlaneInvestibles.filter((inv) => {
    const marketInfo = getMarketInfo(inv, marketId) || {};
    return marketInfo.assigned?.includes(myPresence.id);
  });
  const presenceMap = getPresenceMap(marketPresences);
  const isDemo = marketIsDemo(market);
  const myGroupPresence = groupPresences.find((presence) => presence.id === myPresence.id);

  function isSectionOpen(section) {
    return sectionOpen === section || (!sectionOpen && section === 'storiesSection');
  }

  useHotkeys('ctrl+a', () => navigate(history, formMarketAddInvestibleLink(marketId, groupId)),
    {enabled: !hidden && (isSectionOpen('backlogSection')||isSectionOpen('storiesSection'))},
    [history, groupId, marketId]);
  useHotkeys('ctrl+q', () => navigate(history,
      formMarketAddCommentLink(DISCUSSION_WIZARD_TYPE, marketId, groupId, QUESTION_TYPE)),
    {enabled: !hidden}, [history, groupId, marketId]);
  useHotkeys('ctrl+alt+s', () => navigate(history,
      formMarketAddCommentLink(DISCUSSION_WIZARD_TYPE, marketId, groupId, SUGGEST_CHANGE_TYPE)),
    {enabled: !hidden}, [history, groupId, marketId]);
  useHotkeys('ctrl+alt+n', () => navigate(history,
      formMarketAddCommentLink(DISCUSSION_WIZARD_TYPE, marketId, groupId, REPORT_TYPE)),
    {enabled: !hidden}, [history, groupId, marketId]);

  useEffect(() => {
    if (hash && !hidden) {
      const element = document.getElementById(hash.substring(1, hash.length));
      if (!element) {
        if (hash.includes('option')||hash.includes(DISCUSSION_HASH)) {
          updatePageState({ sectionOpen: 'discussionSection', tabIndex: 3 });
        } else if (hash.includes(ASSIGNED_HASH)) {
          updatePageState({ sectionOpen: 'storiesSection', tabIndex: 0 });
        } else if (hash.includes(BACKLOG_HASH)) {
          updatePageState({ sectionOpen: 'backlogSection', tabIndex: 1 });
        } else {
          const comments = getMarketComments(commentsState, marketId) || [];
          const found = comments.find((comment) => hash.includes(comment.id));
          if (!_.isEmpty(found)) {
            const rootComment = filterToRoot(comments, found.id);
            if (_.isEmpty(rootComment.investible_id)) {
              if (!rootComment.resolved) {
                if (rootComment.comment_type !== TODO_TYPE) {
                  // TO DO TYPE handled by MarketTodos so is no op here
                  updatePageState({ sectionOpen: 'discussionSection', tabIndex: 3 });
                }
              } else {
                // send over to the archives
                navigate(history, formArchiveCommentLink(marketId, groupId, found.id), true);
              }
            }
          }
        }
      }
    }
  }, [commentsState, groupId, hash, hidden, history, marketId, updatePageState]);

  function openSubSection(subSection) {
    updatePageState({sectionOpen: subSection});
  }

  const sortedGroupRoots = getSortedRoots(notTodoGroupComments, searchResults);
  const questionSuggestionGroupComments = sortedGroupRoots.filter((comment) =>
    [QUESTION_TYPE, SUGGEST_CHANGE_TYPE].includes(comment.comment_type));
  const todoGroupComments = unResolvedGroupComments.filter((comment) => {
    if (_.isEmpty(search)) {
      return comment.comment_type === TODO_TYPE;
    }
    return comment.comment_type === TODO_TYPE && (results.find((item) => item.id === comment.id)
      || parentResults.find((id) => id === comment.id));
  });
  const criticalTodoGroupComments = todoGroupComments.filter((comment) =>
    comment.notification_type === RED_LEVEL);
  const archiveInvestibles = investiblesViewOnly.filter((inv) => {
    const marketInfo = getMarketInfo(inv, marketId) || {};
    const stage = marketStages.find((stage) => stage.id === marketInfo.stage);
    const archived = stage && stage.close_comments_on_entrance;
    if (_.isEmpty(search)) {
      return archived;
    }
    return archived && (results.find((item) => item.id === inv.investible.id)
      || parentResults.find((id) => id === inv.investible.id));
  });
  const resolvedGroupComments = marketComments.filter((comment) => {
    if (comment.group_id !== groupId) {
      return false;
    }
    if (_.isEmpty(search)) {
      return !comment.investible_id && comment.resolved;
    }
    return !comment.investible_id && comment.resolved && (results.find((item) => item.id === comment.id)
      || parentResults.find((id) => id === comment.id));
  });
  const archivedSize = _.isEmpty(search) ? undefined :
    _.size(archiveInvestibles) + _.size(resolvedGroupComments);
  const jobsSearchResults = _.size(requiresInputInvestiblesFullAssist) + _.size(blockedInvestiblesFullAssist)
    + _.size(swimlaneInvestibles);
  const furtherWorkInvestibles = getInvestiblesInStage(investiblesViewOnly, furtherWorkStage.id,
    marketId) || [];
  const furtherWorkReadyToStart = _.remove(furtherWorkInvestibles, (investible) => {
    const marketInfo = getMarketInfo(investible, marketId);
    const { open_for_investment: openForInvestment } = marketInfo;
    return openForInvestment;
  });
  const backlogSearchResults = _.size(furtherWorkReadyToStart) + _.size(furtherWorkInvestibles);
  let navListItemTextArray = undefined;
  if (mobileLayout) {
    navListItemTextArray = [
      {icon: SettingsIcon, text: intl.formatMessage({id: 'settings'}),
        target: formGroupEditLink(marketId, groupId), num: 0, isBold: false},
      {icon: MenuBookIcon, text: intl.formatMessage({id: 'planningDialogViewArchivesLabel'}),
        target: formGroupArchiveLink(marketId, groupId), num: archivedSize, isBold: false},
      {icon: PersonAddIcon, text: intl.formatMessage({id: 'manageMembers'}),
        target: formGroupManageLink(marketId, groupId), num: 0, isBold: false}
    ];
  }

  function resetFunction(tabIndex) {
    updatePageState({tabIndex});
    const anchorId = getAnchorId(tabIndex);
    openSubSection(anchorId);
    refToTop.current?.scrollIntoView({ block: "end" });
  }

  function onDropBug(id, isAssigned) {
    let bugBaseUrl = `${formMarketAddInvestibleLink(marketId, groupId)}&fromCommentId=${id}&isAssigned=${isAssigned}`;
    if (!isAssigned) {
      bugBaseUrl += "&jobType=0";
    }
    navigate(history, bugBaseUrl);
  }

  function changeInvestibleReady(id, stage, openForInvestment, resolveCommentIds) {
    const moveInfo = {
      marketId,
      investibleId: id,
      stageInfo: {
        current_stage_id: stage,
        stage_id: furtherWorkStage.id,
        open_for_investment: openForInvestment
      },
    };
    if (resolveCommentIds) {
      moveInfo.stageInfo.resolve_comment_ids = resolveCommentIds;
    }
    setOperationRunning(true);
    return stageChangeInvestible(moveInfo)
      .then((response) => {
        let newInv;
        if (resolveCommentIds) {
          const {full_investible: fullInvestible, comments: resolvedComments } = response;
          newInv = fullInvestible;
          addMarketComments(commentsDispatch, marketId, resolvedComments);
        } else {
          newInv = response;
        }
        onInvestibleStageChange(furtherWorkStage.id, newInv, id, marketId, commentsState,
          commentsDispatch, investiblesDispatch, () => {}, marketStagesState, undefined,
          getFullStage(marketStagesState, marketId, stage), marketPresencesDispatch);
        setOperationRunning(false);
      });
  }

  function getAssistCommentIds(investibleId) {
    const allAssistComments = marketComments.filter((comment) => comment.investible_id === investibleId
      && !comment.resolved && [ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE].includes(comment.comment_type));
    if (_.isEmpty(allAssistComments)) {
      return undefined;
    }
    return allAssistComments.map((comment) => comment.id);
  }

  function onDropJob(id, isAssigned) {
    if (isAssigned) {
      if (isAutonomous) {
        // If autonomous and you are not in the group then this is a no op
        const inv = getInvestible(investibleState, id);
        const marketInfo = getMarketInfo(inv, marketId) || {};
        if (marketInfo.stage !== acceptedStage.id) {
          const moveInfo = {
            marketId,
            investibleId: id,
            stageInfo: {
              current_stage_id: marketInfo.stage,
              stage_id: !_.isEmpty(myGroupPresence) ? acceptedStage.id : inDialogStage.id,
              assignments: [myGroupPresence.id]
            },
          };
          setOperationRunning(true);
          return stageChangeInvestible(moveInfo)
            .then((newInv) => {
              onInvestibleStageChange(furtherWorkStage.id, newInv, id, marketId, commentsState,
                commentsDispatch, investiblesDispatch, () => {}, marketStagesState, undefined,
                getFullStage(marketStagesState, marketId, marketInfo.stage), marketPresencesDispatch);
              setOperationRunning(false);
            });
        }
      } else {
        navigate(history, `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId, id)}&isAssign=${isAssigned}`);
      }
    } else {
      const inv = getInvestible(investibleState, id);
      const marketInfo = getMarketInfo(inv, marketId) || {};
      const { stage, group_id: currentGroupId } = marketInfo;
      // For now do nothing silently if dragging another view's job to an autonomous backlog
      if (currentGroupId === groupId) {
        if (stage !== furtherWorkStage.id) {
          // A job dragged from swimlanes to backlog is Not Ready, or it would be dragged to Next instead
          // A job in Next / Assist and dragged to backlog means the user doesn't want it in Next / Assist anymore
          // Silently resolve any comments that keep it in assist cause otherwise the job stays and is too confusing
          return changeInvestibleReady(id, stage, false, getAssistCommentIds(id));
        } else {
          const { open_for_investment: openForInvestment } = marketInfo;
          if (openForInvestment) {
            // Same thing here need to close anything that would keep it in assist
            return changeInvestibleReady(id, stage, false, getAssistCommentIds(id));
          } else {
            // We can't say for certain what is desired here so just go to wizard
            navigate(history, `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId, id)}&stageId=${furtherWorkStage.id}`);
          }
        }
      }
    }
  }

  function onDropAssigned(event) {
    const id = event.dataTransfer.getData('text');
    const notificationType = event.dataTransfer.getData('notificationType');
    if (notificationType) {
      onDropBug(id, true);
    } else {
      onDropJob(id, true);
    }
  }

  function onDropBacklog(event) {
    const id = event.dataTransfer.getData('text');
    const notificationType = event.dataTransfer.getData('notificationType');
    if (notificationType) {
      onDropBug(id, false);
    } else {
      onDropJob(id, false);
    }
  }

  const tabTitle = `${groupName} ${intl.formatMessage({id: 'tabGroupAppend'})}`;
  const swimlaneEmptyPreText = 'There are no in progress jobs.';
  function getTabCount(tabIndex) {
    if (!_.isEmpty(search)) {
      return undefined;
    }
    if (tabIndex === 0) {
      let investibleIds = (blockedOrRequiresInputOrReadyInvestiblesFullAssist || []).map((investible) =>
        investible.investible.id);
      investibleIds = investibleIds.concat((swimlaneInvestibles||[]).map((investible)=>investible.investible.id));
      const numNewMessagesRaw = findMessagesForInvestibleIds(investibleIds, messagesState, true)||[];
      const numNewMessages = numNewMessagesRaw.filter((message) => isInInbox(message));
      if (!_.isEmpty(numNewMessages)) {
        return `${_.size(numNewMessages)}`;
      }
    }
    if (tabIndex === 1) {
      let investibleIds = (furtherWorkReadyToStart || []).map((investible)=>investible.investible.id);
      investibleIds = investibleIds.concat((furtherWorkInvestibles||[]).map((investible)=>investible.investible.id));
      const numNewMessagesRaw = findMessagesForInvestibleIds(investibleIds, messagesState, true)||[];
      const numNewMessages = numNewMessagesRaw.filter((message) => isInInbox(message));
      if (!_.isEmpty(numNewMessages)) {
        return `${_.size(numNewMessages)}`;
      }
    }
    if (tabIndex === 2) {
      const commentIds = (todoGroupComments || []).map((comment) => comment.id);
      const numNewMessagesRaw = findMessagesForCommentIds(commentIds, messagesState, !isAutonomous);
      const numNewMessages = numNewMessagesRaw.filter((message) => isInInbox(message));
      if ((isAutonomous && !_.isEmpty(criticalTodoGroupComments))||!_.isEmpty(numNewMessages)) {
        return isAutonomous ? `${_.size(criticalTodoGroupComments)}` : `${_.size(numNewMessages)}`;
      }
    }
    if (tabIndex === 3) {
      const commentIds = (questionSuggestionGroupComments || []).map((comment) => comment.id);
      const numNewMessagesRaw = findMessagesForCommentIds(commentIds, messagesState, true);
      const numNewMessages = numNewMessagesRaw.filter((message) => isInInbox(message));
      if (!_.isEmpty(numNewMessages)) {
        return `${_.size(numNewMessages)}`;
      }
    }
    return undefined;
  }
  function getTagLabel(tabCount, tabIndex) {
    if (tabCount) {
      if (isAutonomous && tabIndex === 2) {
        return intl.formatMessage({ id: 'immediateLower' });
      }
      return intl.formatMessage({ id: 'new' });
    }
    return undefined;
  }
  const tabCount0 = getTabCount(0);
  const tabCount1 = getTabCount(1);
  const tabCount2 = getTabCount(2);
  const tabCount3 = getTabCount(3);

  function onDragOverNext(event) {
    event.dataTransfer.dropEffect = 'move';
    event.preventDefault();
  }

  function onDropNext(event) {
    const currentStageId = event.dataTransfer.getData('stageId');
    const fullStage = getFullStage(marketStagesState, marketId, currentStageId);
    if (isBlockedStage(fullStage) || isRequiredInputStage(fullStage)||isFurtherWorkStage(fullStage)) {
      // No op - already in this stage
      return;
    }
    const investibleId = event.dataTransfer.getData('text');
    if (!operationRunning) {
      const targetStageId = getFurtherWorkStage(marketStagesState, marketId)?.id;
      const moveInfo = {
        marketId,
        investibleId,
        stageInfo: {
          current_stage_id: currentStageId,
          stage_id: targetStageId,
          open_for_investment: true
        },
      };
      setOperationRunning(true);
      return stageChangeInvestible(moveInfo)
        .then((inv) => {
          onInvestibleStageChange(targetStageId, inv, investibleId, marketId, commentsState, commentsDispatch,
            investiblesDispatch, diffDispatch, marketStagesState, undefined, fullStage,
            marketPresencesDispatch);
        }).finally(() => {
          setOperationRunning(false);
        });
    }
  }

  return (
    <Screen
      title={groupName}
      hidden={hidden}
      tabTitle={tabTitle}
      banner={banner}
      isKeptInMemory
      noPadDesktop
      showBanner={banner != null}
      openMenuItems={navListItemTextArray}
      navigationOptions={{useHoverFunctions: !mobileLayout, resetFunction: () => resetFunction(0)}}
    >
      <div style={{ paddingBottom: '0.25rem' }}>
        <SwimlanesOnboardingBanner group={group} sectionOpen={sectionOpen} isDemo={isDemo} isAutonomous={isAutonomous}/>
        <GmailTabs
          value={tabIndex}
          addPaddingLeft='2rem'
          id='dialog-header'
          onChange={(event, value) => {
            resetFunction(value);
          }}
          indicatorColors={['#00008B', '#00008B', '#00008B', '#00008B']}>
          <GmailTabItem icon={<AssignmentInd />} onDrop={onDropAssigned} tagLabel={getTagLabel(tabCount0)}
                        onDragOver={(event)=>event.preventDefault()} toolTipId='statusJobsToolTip' tagColor='#E85757'
                        label={intl.formatMessage({id: 'planningDialogNavStoriesLabel'})}
                        tag={_.isEmpty(search) || jobsSearchResults === 0 ? tabCount0 : `${jobsSearchResults}`} />
          <GmailTabItem icon={<AssignmentIcon />} onDrop={onDropBacklog} tagLabel={getTagLabel(tabCount1)}
                        onDragOver={(event)=>event.preventDefault()} toolTipId='backlogJobsToolTip' tagColor='#E85757'
                        label={intl.formatMessage({id: 'planningDialogBacklog'})}
                        tag={_.isEmpty(search) || backlogSearchResults === 0 ? tabCount1 : `${backlogSearchResults}`} />
          <GmailTabItem icon={<BugReport />} label={intl.formatMessage({id: 'todoSection'})}
                        toolTipId='bugsToolTip' tagLabel={getTagLabel(tabCount2, 2)} tagColor='#E85757'
                        tag={_.isEmpty(search) || _.isEmpty(todoGroupComments) ? tabCount2 : `${_.size(todoGroupComments)}` } />
          <GmailTabItem icon={<LightbulbOutlined />} toolTipId='discussionToolTip' tagLabel={getTagLabel(tabCount3)}
                        label={intl.formatMessage({id: 'planningDialogDiscussionLabel'})} tagColor='#E85757'
                        tag={_.isEmpty(search) || _.isEmpty(questionSuggestionGroupComments) ? tabCount3 :
                          `${_.size(questionSuggestionGroupComments)}`} />
        </GmailTabs>
      </div>
      <div style={{display: 'flex', overflow: 'hidden'}}>
        <DialogOutset marketPresences={marketPresences} marketId={marketId} groupId={groupId} hidden={hidden}
                      archivedSize={archivedSize} />
      <div style={{paddingTop: '1rem', width: '96%', marginLeft: 'auto', marginRight: 'auto', overflow: 'hidden'}}>
        <div ref={refToTop}></div>
        {isSectionOpen('discussionSection') && (
          <div id="discussionSection">
            <Grid item id="discussionAddArea" xs={12}>
              {_.isEmpty(search) && marketId && !hidden && (
                <>
                  <div style={{display: 'flex', marginBottom: '1.5rem', marginLeft: '0.5rem'}}>
                    <SpinningButton id="newMarketReport"
                                    icon={hasDiscussionComment(groupId, REPORT_TYPE) ? EditIcon : AddIcon}
                                    iconColor="black"
                                    className={wizardClasses.actionNext}
                                    style={{display: "flex", marginTop: '1rem',
                                      marginRight: mobileLayout ? undefined : '2rem'}}
                                    variant="text" doSpin={false} toolTipId='hotKeyREPORT'
                                    onClick={() => navigate(history,
                                      formMarketAddCommentLink(DISCUSSION_WIZARD_TYPE, marketId, groupId,
                                        REPORT_TYPE))}>
                      <FormattedMessage id='createNote'/>
                    </SpinningButton>
                    <SpinningButton id="newMarketQuestion"
                                    icon={hasDiscussionComment(groupId, QUESTION_TYPE) ? EditIcon : AddIcon}
                                    iconColor="black"
                                    className={wizardClasses.actionNext}
                                    style={{display: "flex", marginTop: '1rem',
                                      marginRight: mobileLayout ? undefined : '2rem'}}
                                    variant="text" doSpin={false} toolTipId='hotKeyQUESTION'
                                    onClick={() => navigate(history,
                                      formMarketAddCommentLink(DISCUSSION_WIZARD_TYPE, marketId, groupId,
                                        QUESTION_TYPE))}>
                      <FormattedMessage id='createQuestion'/>
                    </SpinningButton>
                    <SpinningButton id="createSuggestion"
                                    icon={hasDiscussionComment(groupId, SUGGEST_CHANGE_TYPE) ? EditIcon : AddIcon}
                                    iconColor="black"
                                    className={wizardClasses.actionNext}
                                    style={{display: "flex", marginTop: '1rem'}}
                                    variant="text" doSpin={false} toolTipId='hotKeySUGGEST'
                                    onClick={() => navigate(history,
                                      formMarketAddCommentLink(DISCUSSION_WIZARD_TYPE, marketId, groupId,
                                        SUGGEST_CHANGE_TYPE))}>
                      <FormattedMessage id='createSuggestion'/>
                    </SpinningButton>
                  </div>
                  <DismissableText textId="workspaceCommentHelp" display={_.isEmpty(questionSuggestionGroupComments)}
                                   noPad text={
                    <div>
                      <Link href="https://documentation.uclusion.com/structured-comments" target="_blank">Questions and suggestions</Link> can
                      be used at the view level and later moved to a job.
                    </div>
                  }/>
                </>
              )}
              <CommentBox comments={notTodoGroupComments} marketId={marketId} />
            </Grid>
          </div>
        )}
        {isSectionOpen('storiesSection') && (
          <div id="storiesSection" style={{overflowX: 'hidden'}}>
            <div style={{display: mobileLayout ? undefined : 'flex'}}>
              <SpinningButton id="addJob"
                              className={wizardClasses.actionNext}
                              icon={AddIcon} iconColor="black"
                              variant="text" doSpin={false}
                              style={{marginTop: '1rem', marginBottom: '1rem'}}
                              toolTipId='hotKeyJob'
                              onClick={() => navigate(history, formMarketAddInvestibleLink(marketId, groupId))}>
                <FormattedMessage id='addStoryLabel'/>
              </SpinningButton>
              <div style={{width: '100%'}} onDrop={onDropNext} onDragOver={onDragOverNext}>
                <SubSection
                  type={SECTION_TYPE_SECONDARY_WARNING}
                  bolder
                  title={intl.formatMessage({ id: 'blockedHeader' })}
                  helpLink='https://documentation.uclusion.com/views/jobs/stages/#next--assistance'
                  id="blocked"
                >
                  <DismissableText textId="assistanceHelp"
                                   display={_.isEmpty(blockedOrRequiresInputOrReadyInvestiblesFullAssist)&&!isAutonomous}
                                   text={
                                     <div>
                                       This section shows all jobs in this view needing assignment or help.
                                     </div>
                                   }/>
                  <DismissableText textId="autonomousAssistanceHelp"
                                   display={_.isEmpty(blockedOrRequiresInputOrReadyInvestiblesFullAssist)&&isAutonomous}
                                   text={
                                     <div>
                                       This section shows jobs in all views you are a member of that need assignment or help.
                                     </div>
                                   }/>
                  {!_.isEmpty(blockedOrRequiresInputOrReadyInvestiblesFullAssist) && (
                    <ArchiveInvestbiles
                      comments={marketComments}
                      marketId={marketId}
                      presenceMap={presenceMap}
                      investibles={blockedOrRequiresInputOrReadyInvestiblesFullAssist}
                      allowDragDrop
                      isAutonomous={isAutonomous}
                      viewGroupId={groupId}
                    />
                  )}
                </SubSection>
              </div>
            </div>
              <div style={{ paddingBottom: '2rem' }}/>
            <InvestiblesByPerson
              comments={marketComments}
              investibles={investiblesFullAssist}
              visibleStages={visibleStages}
              acceptedStage={acceptedStage}
              inDialogStage={inDialogStage}
              inBlockingStage={inBlockingStage}
              inReviewStage={inReviewStage}
              requiresInputStage={requiresInputStage}
              group={group}
              isAutonomous={isAutonomous}
              mobileLayout={mobileLayout}
              pageState={pageState} updatePageState={updatePageState}
            />
            <DismissableText textId="notificationHelp"
                             display={_.isEmpty(swimlaneInvestibles)&&_.isEmpty(swimlaneCompleteInvestibles)}
                             text={
                               isSingleUser ?
                                   <div>
                                     {swimlaneEmptyPreText} Use the "Add job" button above to start a new job.
                                   </div>
                                : (market?.market_sub_type === 'SUPPORT' ?
                                  <div>
                                    {swimlaneEmptyPreText} The "Add job" button above creates a job
                                    and sends a <Link href="https://documentation.uclusion.com/notifications"
                                                    target="_blank">notification</Link> to Uclusion support.
                                  </div>
                                  :
                                 <div>
                                   {swimlaneEmptyPreText} The "Add job" button above creates a job
                                   and sends <Link href="https://documentation.uclusion.com/notifications"
                                             target="_blank">notifications</Link> to members of this view.
                                 </div>
                              )
                             }/>
          </div>
        )}
        <div id="backlogSection" style={{overflowX: 'hidden'}}>
          <Backlog group={group} marketPresences={marketPresences} hidden={!isSectionOpen('backlogSection')}
                   furtherWorkReadyToStart={furtherWorkReadyToStart} furtherWorkInvestibles={furtherWorkInvestibles}
                   comments={marketComments} myGroupPresence={myGroupPresence} inDialogStageId={inDialogStage?.id}
                   acceptedStageId={acceptedStage?.id} singleUser={isSingleUser ? groupPresences[0] : undefined} />
        </div>
        <MarketTodos comments={unResolvedGroupComments} marketId={marketId} groupId={groupId}
                     sectionOpen={isSectionOpen('marketTodos')}
                     hidden={hidden} activeInvestibles={activeInvestibles}
                     setSectionOpen={() => {
                       updatePageState({sectionOpen: 'marketTodos', tabIndex: 2});
                     }} group={group} />
      </div>
      </div>
    </Screen>
  );
}

PlanningDialog.propTypes = {
  marketId: PropTypes.string.isRequired,
  marketInvestibles: PropTypes.arrayOf(PropTypes.object),
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  marketStages: PropTypes.arrayOf(PropTypes.object),
  hidden: PropTypes.bool,
  comments: PropTypes.arrayOf(PropTypes.object),
  myPresence: PropTypes.object.isRequired,
};

PlanningDialog.defaultProps = {
  investibles: [],
  marketPresences: [],
  marketStages: [],
  hidden: false,
  comments: []
};

export default PlanningDialog;
