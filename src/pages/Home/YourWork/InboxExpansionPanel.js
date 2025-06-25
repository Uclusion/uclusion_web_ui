import React from 'react';
import _ from 'lodash';
import {
  getMarketDetailsForType,
  getNotHiddenMarketDetailsForUser
} from '../../../contexts/MarketsContext/marketsContextHelper';
import { Assignment, Block, BugReportOutlined, PersonAddOutlined } from '@material-ui/icons';
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../../constants/markets';
import {
  getGroupPresences,
  getMarketPresences,
  isAutonomousGroup
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { getInvestible, getMarketInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import {
  getAcceptedStage,
  getInCurrentVotingStage,
  getNotDoingStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { getUserInvestibles, getUserPendingAcceptanceInvestibles } from '../../Dialog/Planning/userUtils';
import { getComment, getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments';
import QuestionIcon from '@material-ui/icons/ContactSupport';
import { getMarketInfo } from '../../../utils/userFunctions';
import { calculateInvestibleVoters } from '../../../utils/votingUtils';
import { formCommentLink, formInvestibleLink } from '../../../utils/marketIdPathFunctions';
import { Typography } from '@material-ui/core';
import { PENDING_INDEX } from './InboxContext';
import ApprovalWizard from '../../../components/InboxWizards/Approval/ApprovalWizard';
import StatusWizard from '../../../components/InboxWizards/Status/StatusWizard';
import AnswerWizard from '../../../components/InboxWizards/Answer/AnswerWizard';
import VoteWizard from '../../../components/InboxWizards/Vote/VoteWizard';
import AcceptRejectWizard from '../../../components/InboxWizards/AcceptReject/AcceptRejectWizard';
import StartWizard from '../../../components/InboxWizards/Start/StartWizard';
import ResolveWizard from '../../../components/InboxWizards/Resolve/ResolveWizard';
import ReviewWizard from '../../../components/InboxWizards/Review/ReviewWizard';
import BlockedWizard from '../../../components/InboxWizards/Unblock/BlockedWizard';
import StageWizard from '../../../components/InboxWizards/Stage/StageWizard';
import WaitingAssistanceWizard from '../../../components/InboxWizards/WaitingAssistance/WaitingAssistanceWizard';
import AssignToOtherWizard from '../../../components/InboxWizards/AssignToOther/AssignToOtherWizard';
import EstimateChangeWizard from '../../../components/InboxWizards/Monitor/EstimateChangeWizard';
import ReplyWizard from '../../../components/InboxWizards/Reply/ReplyWizard';
import OptionSubmittedWizard from '../../../components/InboxWizards/Submission/OptionSubmittedWizard';
import FeedbackWizard from '../../../components/InboxWizards/Feedback/FeedbackWizard';
import UpgradeWizard from '../../../components/InboxWizards/Upgrade/UpgradeWizard';
import ReplyResolveWizard from '../../../components/InboxWizards/ReplyResolve/ReplyResolveWizard';
import NewGroupWizard from '../../../components/InboxWizards/NewGroup/NewGroupWizard';
import RespondInOptionWizard from '../../../components/InboxWizards/OptionResponse/RespondInOptionWizard';
import LightbulbOutlined from '../../../components/CustomChip/LightbulbOutlined';
import TaskedWizard from '../../../components/InboxWizards/ReviewNewTask/TaskedWizard';
import { NOT_FULLY_VOTED_TYPE, RED_LEVEL, UNREAD_JOB_APPROVAL_REQUEST } from '../../../constants/notifications';
import TriageWizard from '../../../components/InboxWizards/Triage/TriageWizard';
import InvestibleEditedWizard from '../../../components/InboxWizards/JobEdited/InvestibleEditedWizard';
import Approval from '../../../components/CustomChip/Approval';
import { getGroup } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper';

function setItem(item, isOpen, panel, titleId, intl) {
  if (isOpen) {
    item.expansionPanel = panel;
  }
  if (titleId) {
    item.title = intl.formatMessage({ id: titleId });
  }
}

export function calculateTitleExpansionPanel(props) {
  const { item, openExpansion, intl } = props;
  const { message, isAssigned } = item;
  const { type: messageType, market_id: marketId, comment_id: commentId, comment_market_id: commentMarketId,
    link_type: linkType, investible_id: investibleId, market_type: marketType, isOutboxAccepted,
    decision_investible_id: decisionInvestibleId, comment_list: commentList } = message;
  if (messageType === 'USER_POKED') {
    setItem(item, openExpansion, <UpgradeWizard message={message} />,
      'DecidePayTitle', intl);
  } else if (messageType === 'UNREAD_GROUP') {
    setItem(item, openExpansion, <NewGroupWizard message={message} />, 'GroupWelcome', intl);
  }
  else if (isOutboxAccepted) {
    setItem(item, openExpansion, <AssignToOtherWizard investibleId={message.id} marketId={message.marketId}
                                               rowId={message.id} typeObjectId={message.type_object_id}/>,
      'DecideAssignTitle', intl);
  } else if (!messageType) {
    if (message.isWaitingStart) {
      setItem(item, openExpansion, <StageWizard investibleId={message.id} marketId={message.marketId}
                                                rowId={message.id} typeObjectId={message.id} />,
        'finishApprovalQ', intl);
    } else if (message.isOutboxType) {
      setItem(item, openExpansion, <WaitingAssistanceWizard commentId={message.id} marketId={message.marketId}
                                                            rowId={message.id} />,
      undefined, intl);
    }
  } else if ([NOT_FULLY_VOTED_TYPE, UNREAD_JOB_APPROVAL_REQUEST].includes(messageType)) {
    if (marketType === INITIATIVE_TYPE) {
      setItem(item, openExpansion, <VoteWizard marketId={commentMarketId || marketId} commentId={commentId}
                                               message={message} />,
        'DecideVoteTitle', intl);
    } else if (marketType === DECISION_TYPE || decisionInvestibleId) {
      setItem(item, openExpansion, <AnswerWizard marketId={commentMarketId || marketId} commentId={commentId}
                                                 message={message} />,
        'DecideAnswerTitle', intl);
    } else if (marketType === PLANNING_TYPE) {
      setItem(item, openExpansion, <ApprovalWizard investibleId={investibleId} marketId={marketId} message={message}
                                                   isAssigned={isAssigned}/>,
        isAssigned ? 'ApproveOwnAssignmentTitle' : 'AssignmentApprovalRowTitle', intl);
    }
  } else if (messageType === 'INVESTIBLE_SUBMITTED') {
    setItem(item, openExpansion, <OptionSubmittedWizard marketId={marketId}
                                                        investibleId={decisionInvestibleId || investibleId}
                                                        commentId={commentId} commentMarketId={commentMarketId}
                                                        message={message} />,
      'DecidePromotionTitle', intl);
  } else if (['REPORT_REQUIRED', 'UNREAD_MOVE_REPORT'].includes(messageType)) {
    setItem(item, openExpansion, <StatusWizard investibleId={investibleId} marketId={marketId} message={message} />,
      messageType === 'REPORT_REQUIRED' ? 'JobStatusTitle' : 'JobMovedTitle', intl);
  } else if (['ISSUE', 'UNREAD_COMMENT'].includes(messageType)) {
    if (['INVESTIBLE_SUGGESTION', 'MARKET_SUGGESTION'].includes(linkType)) {
      if (isAssigned) {
        setItem(item, openExpansion, <AcceptRejectWizard commentId={commentId} marketId={marketId} message={message}/>,
          'DecideAcceptRejectTitle', intl);
      } else {
        setItem(item, openExpansion, <ReplyResolveWizard commentId={commentId} marketId={marketId} message={message}/>,
          'DecideIdeaTitle', intl);
      }
    } else if (['INLINE_STORY_COMMENT', 'INLINE_WORKSPACE_COMMENT'].includes(linkType)) {
      setItem(item, openExpansion, <RespondInOptionWizard marketId={commentMarketId || marketId} commentId={commentId}
                                                 message={message} />,
        'DecideResponseTitle', intl);
    } else if (['INVESTIBLE_QUESTION', 'MARKET_QUESTION'].includes(linkType)) {
      setItem(item, openExpansion, <AnswerWizard marketId={commentMarketId || marketId} commentId={commentId}
                                                 message={message} />,
        'DecideAnswerTitle', intl);
    } else if ('INVESTIBLE_REVIEW' === linkType) {
      const isMultiple = !_.isEmpty(commentList?.find((aCommentId) => aCommentId !== commentId));
      setItem(item, openExpansion, <TaskedWizard marketId={marketId} message={message} />,
        isMultiple ? 'NewTasksTitle' : 'NewTaskTitle', intl);
    } else {
      setItem(item, openExpansion, <BlockedWizard marketId={commentMarketId || marketId} commentId={commentId}
                                                  message={message} />,
        'DecideUnblockTitle', intl);
    }
  } else if (['UNREAD_REPLY', 'REPLY_MENTION'].includes(messageType)) {
    setItem(item, openExpansion, <ReplyWizard commentId={commentId} marketId={commentMarketId || marketId}
                                                message={message} />,
      messageType === 'REPLY_MENTION' ? 'unreadMention' : 'unreadReply', intl);
  }else if (messageType === 'UNREAD_VOTE' && linkType === 'INVESTIBLE_VOTE') {
      setItem(item, openExpansion, <FeedbackWizard marketId={marketId} investibleId={investibleId} message={message} />,
        'startJobQ', intl);
  } else if (['UNREAD_RESOLVED', 'UNREAD_VOTE'].includes(messageType)) {
    setItem(item, openExpansion, <ResolveWizard commentId={commentId} marketId={commentMarketId || marketId}
                                                message={message} />,
      messageType === 'UNREAD_RESOLVED' ? 'DecideResolveReopenTitle' : 'DecideResolveTitle', intl);
  } else if (['UNREAD_REVIEWABLE', 'UNASSIGNED', 'REVIEW_REQUIRED'].includes(messageType)) {
    if (linkType === 'MARKET_TODO') {
      if (messageType === 'UNASSIGNED') {
        setItem(item, openExpansion, item.expansionPanel = <TriageWizard commentId={commentId}
                                                                         marketId={marketId} message={message}/>,
          'CriticalBugTitle', intl);
      } else {
        setItem(item, openExpansion, item.expansionPanel = <StartWizard commentId={commentId} marketId={marketId}
                                                                        message={message}/>,
          'DecideStartTitle', intl);
      }
    } else if (linkType === 'INVESTIBLE_REVIEW') {
      setItem(item, openExpansion, <ReviewWizard commentId={commentId} marketId={marketId} message={message} />,
        'DecideReviewTitle', intl);
    }
  } else if (messageType === 'UNREAD_ESTIMATE') {
    setItem(item, openExpansion,
      item.expansionPanel = <EstimateChangeWizard investibleId={investibleId} marketId={marketId}
                                                  message={message} />,
      undefined, intl);
  } else if (['UNREAD_DESCRIPTION', 'UNREAD_NAME', 'UNREAD_ATTACHMENT'].includes(messageType)) {
    setItem(item, openExpansion, <InvestibleEditedWizard investibleId={investibleId} marketId={marketId}
                                                         message={message} />,
      'unreadJobEdit', intl);
  }
}

export function createDefaultInboxRow(messagesOrdered, tabIndex) {
  if (!_.isEmpty(messagesOrdered)) {
    return undefined;
  }


  if (tabIndex === PENDING_INDEX) {
    return (
      <Typography style={{marginTop: '2rem', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto'}}
                  variant="body1">
        Your From You tab is empty.<br/><br/> Process or poke your anything waiting on others here.
      </Typography>
    );
  }

  return (
    <Typography style={{marginTop: '2rem', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto'}}
                variant="body1">
      Your For You tab is empty.<br/><br/> Notifications from others display here.
    </Typography>
  );
}

function getMessageForInvestible(investible, market, labelId, Icon, intl) {
  const investibleId = investible.investible.id;
  const marketInfo = getMarketInfo(investible, market.id) || {};
  const groupId = marketInfo.group_id;
  return {
    id: investibleId,
    marketId: market.id,
    icon: Icon,
    investible: investible.investible.name,
    title: intl.formatMessage({ id: labelId }),
    updatedAt: investible.investible.updated_at,
    updated_at: investible.investible.updated_at,
    link: formInvestibleLink(market.id, investibleId),
    isOutboxAccepted: investible.notAccepted,
    isOutboxType: true,
    isInvestibleType: true,
    group_id: groupId,
    groupAttr: `${market.id}_${groupId}`
  };
}

function getMessageForComment(comment, market, type, Icon, intl, investibleState, marketStagesState,
  comments, marketPresences) {
  const commentId = comment.id;
  const groupId = comment.group_id;
  const message = {
    id: commentId,
    marketType: market.market_type,
    marketId: market.id,
    icon: Icon,
    comment: comment.body,
    title: `Done with this
        ${type === QUESTION_TYPE ? ' question' : (type === SUGGEST_CHANGE_TYPE ? ' suggestion' : 
      (type === TODO_TYPE ? ' bug' : ' issue'))}?`,
    updatedAt: comment.updated_at,
    link: formCommentLink(market.id, groupId, comment.investible_id, commentId),
    inFurtherWork: false,
    isOutboxType: true,
    isCommentType: true,
    group_id: groupId,
    groupAttr: `${market.id}_${groupId}`
  }
  if (comment.investible_id) {
    const investible = getInvestible(investibleState, comment.investible_id)
    const notDoingStage = getNotDoingStage(marketStagesState, market.id) || {};
    const marketInfo = getMarketInfo(investible, market.id) || {};
    if (notDoingStage.id === marketInfo.stage) {
      return null;
    }
    if (investible?.investible?.name) {
      message.investible = investible.investible.name;
    }
  }
  if (!_.isEmpty(comment.mentions)) {
    // add mentioned with no reply in the thread - could extend to inline activity but parent is still unresolved
    const debtors = [];
    comment.mentions.forEach((mention) => {
      const { user_id: userId } = mention;
      const aComment = comments.find((aComment) => aComment.root_comment_id === comment.id &&
        aComment.created_by === userId);
      if (!aComment) {
        const user = marketPresences.find((presence) => presence.id === userId);
        if (user) {
          debtors.push(user);
        }
      }
    });
    if (!_.isEmpty(debtors)) {
      message.debtors = debtors;
    }
  }
  return message;
}

export function getWorkspaceData(planningDetailsRaw, marketPresencesState, investiblesState, commentsState,
  marketStagesState) {
  const planningDetails = planningDetailsRaw.filter((market) => market.market_stage === 'Active');
  return planningDetails.map((market) => {
    const marketPresences = getMarketPresences(marketPresencesState, market.id) || [];
    const myPresence = marketPresences.find((presence) => presence.current_user) || {};
    const investibles = getMarketInvestibles(investiblesState, market.id);
    const inVotingStage = getInCurrentVotingStage(marketStagesState, market.id) || {};
    const approvedStage = getAcceptedStage(marketStagesState, market.id) || {};
    const inVotingInvestibles = getUserInvestibles(myPresence.id, market.id, investibles,
      [inVotingStage]) || [];
    const inVotingNotAccepted = getUserPendingAcceptanceInvestibles(myPresence.id, market.id, investibles,
      [inVotingStage]) || [];
    const inVotingNotAcceptedMarked = inVotingNotAccepted.map((investible) => {
      return {...investible, notAccepted: true};
    });
    const approvedInvestibles = getUserInvestibles(myPresence.id, market.id, investibles,
      [approvedStage]) || [];
    const comments = getMarketComments(commentsState, market.id);
    const inProgressTasks = comments.filter((comment) => !comment.resolved && comment.in_progress);
    investibles.forEach((investible) => {
      if (!approvedInvestibles.find((anInvestible) =>
        investible.investible.id === anInvestible.investible.id)) {
        const marketInfo = getMarketInfo(investible, market.id);
        const { assigned, stage } = marketInfo;
        if ([inVotingStage.id, approvedStage.id].includes(stage)&&(assigned || []).includes(myPresence.id)) {
          if (!_.isEmpty(inProgressTasks.find((aComment) =>
            aComment.investible_id === investible.investible.id))) {
            approvedInvestibles.push(investible);
          }
        }
      }
    });
    const myUnresolvedRoots = comments.filter((comment) => !comment.resolved &&
      comment.created_by === myPresence.id && !comment.reply_id);
    const questions = myUnresolvedRoots.filter((comment) => comment.comment_type === QUESTION_TYPE);
    const issues = myUnresolvedRoots.filter((comment) => comment.comment_type === ISSUE_TYPE);
    const suggestions = myUnresolvedRoots.filter((comment) => comment.comment_type === SUGGEST_CHANGE_TYPE);
    const bugs = myUnresolvedRoots.filter((comment) => comment.comment_type === TODO_TYPE && !comment.investible_id &&
      comment.notification_type === RED_LEVEL);
    return { market, comments, inVotingInvestibles: inVotingInvestibles.concat(inVotingNotAcceptedMarked), questions,
      issues, suggestions, bugs, approvedInvestibles};
  });
}

export function getDecisionData(market, marketPresencesState, commentsState) {
  const marketPresences = getMarketPresences(marketPresencesState, market.id) || [];
  const myPresence = marketPresences.find((presence) => presence.current_user) || {};
  const comments = getMarketComments(commentsState, market.id);
  const myUnresolvedRoots = comments.filter((comment) => !comment.resolved &&
    comment.created_by === myPresence.id && !comment.reply_id);
  const questions = myUnresolvedRoots.filter((comment) => comment.comment_type === QUESTION_TYPE) || [];
  const issues = myUnresolvedRoots.filter((comment) => comment.comment_type === ISSUE_TYPE) || [];
  const suggestions = myUnresolvedRoots.filter((comment) => comment.comment_type === SUGGEST_CHANGE_TYPE) || [];
  return { questions, issues, suggestions, comments, marketPresences }
}

function isAutonomousComment(comment, marketPresences, groupPresencesState, marketId, groupsState) {
  const groupPresences = getGroupPresences(marketPresences, groupPresencesState, marketId,
    comment.group_id) || [];
  const group = getGroup(groupsState, marketId, comment.group_id);
  return isAutonomousGroup(groupPresences, group) && _.isEmpty(comment.mentions);
}

export function getOutboxMessages(props) {
  const { marketsState, marketPresencesState,groupPresencesState, groupsState, investiblesState, marketStagesState,
    commentsState, intl } = props;
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  const planningDetails = getMarketDetailsForType(myNotHiddenMarketsState, marketPresencesState, PLANNING_TYPE);
  const decisionDetails = getMarketDetailsForType(myNotHiddenMarketsState, marketPresencesState, DECISION_TYPE,
    true);

  const workspacesData = getWorkspaceData(planningDetails, marketPresencesState, investiblesState, commentsState,
    marketStagesState);

  const messages = [];

  decisionDetails.forEach((market) => {
    const comment = getComment(commentsState, market.parent_comment_market_id, market.parent_comment_id);
    const marketPresences = getMarketPresences(marketPresencesState, market.parent_comment_market_id) || [];
    if (!_.isEmpty(comment) && !isAutonomousComment(comment, marketPresences, groupPresencesState,
      market.parent_comment_market_id, groupsState)) {
      const { questions, issues, suggestions, comments, marketPresences } =
        getDecisionData(market, marketPresencesState, commentsState);
      questions.forEach((comment) => {
        const message = getMessageForComment(comment, market, QUESTION_TYPE,
          <QuestionIcon style={{ fontSize: 24, color: '#ffc61a', }}/>, intl, investiblesState, marketStagesState,
          comments, marketPresences)
        if (message) {
          messages.push(message);
        }
      });
      issues.forEach((comment) => {
        const message = getMessageForComment(comment, market, ISSUE_TYPE,
          <Block style={{ fontSize: 24, color: '#E85757', }}/>, intl, investiblesState, marketStagesState,
          comments, marketPresences)
        if (message) {
          messages.push(message);
        }
      });
      suggestions.forEach((comment) => {
        const message = getMessageForComment(comment, market, SUGGEST_CHANGE_TYPE,
          <LightbulbOutlined style={{ fontSize: 24, color: '#ffc61a', }}/>, intl, investiblesState, marketStagesState,
          comments, marketPresences)
        if (message) {
          messages.push(message);
        }
      });
    }
  });

  workspacesData.forEach((workspaceData) => {
    const { market, comments, inVotingInvestibles, questions, issues, suggestions, bugs } = workspaceData;
    const marketPresences = getMarketPresences(marketPresencesState, market.id) || [];
    inVotingInvestibles.forEach((investible) => {
      const marketInfo = getMarketInfo(investible, market.id);
      const groupPresences = getGroupPresences(marketPresences, groupPresencesState, market.id,
        marketInfo.group_id) || [];
      const group = getGroup(groupsState, market.id, marketInfo.group_id);
      const isAutonomous = isAutonomousGroup(groupPresences, group);
      if (!isAutonomous || !_.isEmpty(marketInfo.required_approvers)) {
        const investibleId = investible.investible.id;
        const notAccepted = investible.notAccepted;
        const label = notAccepted ? 'planningUnacceptedLabel' : 'startJobQ';
        let messageIcon = notAccepted ? <PersonAddOutlined style={{ fontSize: 24, color: '#ffc61a', }}/> :
          <Assignment style={{ fontSize: 24, color: '#ffc61a', }}/>;
        const message = getMessageForInvestible(investible, market, label, messageIcon, intl)
        const votersForInvestibleRaw = calculateInvestibleVoters(investibleId, market.id, marketsState,
          investiblesState, marketPresences, true);
        const votersForInvestible = votersForInvestibleRaw.filter((voter) => !voter.isExpired && !voter.deleted);
        if (!notAccepted) {
          message.isWaitingStart = true;
          message.icon = <Approval style={{ fontSize: 24, color: '#ffc61a', }}/>;
        }
        let debtors = [];
        if (notAccepted) {
          debtors = marketPresences.filter((presence) => marketInfo.assigned?.includes(presence.id));
        } else if (!_.isEmpty(marketInfo.required_approvers)) {
          //add required approvers that have not voted or commented
          marketInfo.required_approvers.forEach((userId) => {
            const aComment = comments.find((comment) => !comment.resolved && comment.investible_id === investibleId &&
              comment.created_by === userId && [QUESTION_TYPE, SUGGEST_CHANGE_TYPE].includes(comment.comment_type));
            if (!aComment && !votersForInvestible.includes(userId)) {
              const user = marketPresences.find((presence) => presence.id === userId);
              if (user) {
                debtors.push(user);
              }
            }
          });
        }
        if (!_.isEmpty(debtors)) {
          message.debtors = debtors;
        }

        messages.push(message);
      }
    });
    questions.forEach((comment) => {
      if (!isAutonomousComment(comment, marketPresences, groupPresencesState, market.id, groupsState)) {
        const message = getMessageForComment(comment, market, QUESTION_TYPE,
          <QuestionIcon style={{ fontSize: 24, color: '#ffc61a', }}/>, intl, investiblesState, marketStagesState,
          comments, marketPresences)
        if (message) {
          messages.push(message);
        }
      }
    });
    issues.forEach((comment) => {
      if (!isAutonomousComment(comment, marketPresences, groupPresencesState, market.id, groupsState)) {
        const message = getMessageForComment(comment, market, ISSUE_TYPE,
          <Block style={{ fontSize: 24, color: '#E85757', }}/>, intl, investiblesState, marketStagesState,
          comments, marketPresences)
        if (message) {
          messages.push(message);
        }
      }
    });
    suggestions.forEach((comment) => {
      if (!isAutonomousComment(comment, marketPresences, groupPresencesState, market.id, groupsState)) {
        const message = getMessageForComment(comment, market, SUGGEST_CHANGE_TYPE,
          <LightbulbOutlined style={{ fontSize: 24, color: '#ffc61a', }}/>, intl, investiblesState, marketStagesState,
          comments, marketPresences)
        if (message) {
          messages.push(message);
        }
      }
    });
    bugs.forEach((comment) => {
      if (!isAutonomousComment(comment, marketPresences, groupPresencesState, market.id, groupsState)) {
        const message = getMessageForComment(comment, market, TODO_TYPE,
          <BugReportOutlined style={{ fontSize: 24, color: '#E85757', }}/>, intl, investiblesState, marketStagesState,
          comments, marketPresences)
        if (message) {
          messages.push(message);
        }
      }
    });
  });

  return _.orderBy(messages, ['updatedAt'], ['asc']);
}