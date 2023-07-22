import React from 'react';
import _ from 'lodash';
import {
  getMarketDetailsForType,
  getNotHiddenMarketDetailsForUser,
  hasNoChannels
} from '../../../contexts/MarketsContext/marketsContextHelper';
import LoadingDisplay from '../../../components/LoadingDisplay';
import { Assignment, Block, PersonAddOutlined } from '@material-ui/icons';
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../../constants/markets';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { getInvestible, getMarketInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import {
  getFurtherWorkStage,
  getInCurrentVotingStage,
  getNotDoingStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { getUserInvestibles, getUserPendingAcceptanceInvestibles } from '../../Dialog/Planning/userUtils';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments';
import QuestionIcon from '@material-ui/icons/ContactSupport';
import { getMarketInfo } from '../../../utils/userFunctions';
import { useInvestibleVoters } from '../../../utils/votingUtils';
import { formCommentLink, formInvestibleLink } from '../../../utils/marketIdPathFunctions';
import { Typography } from '@material-ui/core';
import { PENDING_INDEX, TEAM_INDEX } from './InboxContext';
import ApprovalWizard from '../../../components/InboxWizards/Approval/ApprovalWizard';
import StatusWizard from '../../../components/InboxWizards/Status/StatusWizard';
import AnswerWizard from '../../../components/InboxWizards/Answer/AnswerWizard';
import VoteWizard from '../../../components/InboxWizards/Vote/VoteWizard';
import AcceptRejectWizard from '../../../components/InboxWizards/AcceptReject/AcceptRejectWizard';
import StartWizard from '../../../components/InboxWizards/Start/StartWizard';
import ResolveWizard from '../../../components/InboxWizards/Resolve/ResolveWizard';
import AssignWizard from '../../../components/InboxWizards/Assign/AssignWizard';
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
import { findMessagesForInvestibleId } from '../../../utils/messageUtils';
import ReplyResolveWizard from '../../../components/InboxWizards/ReplyResolve/ReplyResolveWizard';
import NewGroupWizard from '../../../components/InboxWizards/NewGroup/NewGroupWizard';
import RespondInOptionWizard from '../../../components/InboxWizards/OptionResponse/RespondInOptionWizard';
import LightbulbOutlined from '../../../components/CustomChip/LightbulbOutlined';

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
    decision_investible_id: decisionInvestibleId } = message;
  if (messageType === 'USER_POKED') {
    setItem(item, openExpansion, <UpgradeWizard message={message} />,
      'DecidePayTitle', intl);
  } else if (messageType === 'UNREAD_GROUP') {
    setItem(item, openExpansion, <NewGroupWizard message={message} />,
      'GroupWelcome', intl);
  }
  else if (isOutboxAccepted) {
    setItem(item, openExpansion, <AssignToOtherWizard investibleId={message.id} marketId={message.marketId}
                                               rowId={message.id} />,
      'DecideAssignTitle', intl);
  } else if (!messageType) {
    if (message.isWaitingStart) {
      setItem(item, openExpansion, <StageWizard investibleId={message.id} marketId={message.marketId}
                                                rowId={message.id} />,
        'finishApprovalQ', intl);
    } else if (message.isOutboxType) {
      if (message.isAssigned) {
        setItem(item, openExpansion, <StageWizard investibleId={message.id} marketId={message.marketId}
                                                  rowId={message.id} />,
          undefined, intl);
      } else {
        setItem(item, openExpansion, <WaitingAssistanceWizard commentId={message.id} marketId={message.marketId}
                                                              rowId={message.id} />,
        undefined, intl);
      }
    }
  } else if (messageType === 'NOT_FULLY_VOTED') {
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
        'AssignmentApprovalRowTitle', intl);
    }
  } else if (messageType === 'INVESTIBLE_SUBMITTED') {
    setItem(item, openExpansion, <OptionSubmittedWizard marketId={marketId} investibleId={decisionInvestibleId}
                                                        commentId={commentId} commentMarketId={commentMarketId}
                                                        message={message} />,
      'DecidePromotionTitle', intl);
  } else if (messageType === 'REPORT_REQUIRED') {
    setItem(item, openExpansion, <StatusWizard investibleId={investibleId} marketId={marketId} message={message} />,
      'JobStatusTitle', intl);
  } else if (['ISSUE', 'UNREAD_COMMENT'].includes(messageType)) {
    if (['INVESTIBLE_SUGGESTION', 'MARKET_SUGGESTION'].includes(linkType)) {
      if (isAssigned) {
        setItem(item, openExpansion, <AcceptRejectWizard commentId={commentId} marketId={marketId} message={message}/>,
          'DecideAcceptRejectTitle', intl);
      } else {
        setItem(item, openExpansion, <ReplyResolveWizard commentId={commentId} marketId={marketId} message={message}/>,
          'DecideResponseTitle', intl);
      }
    } else if ('INLINE_STORY_COMMENT' === linkType) {
      setItem(item, openExpansion, <RespondInOptionWizard marketId={commentMarketId || marketId} commentId={commentId}
                                                 message={message} />,
        'DecideResponseTitle', intl);
    } else if (['INVESTIBLE_QUESTION', 'MARKET_QUESTION'].includes(linkType)) {
      setItem(item, openExpansion, <AnswerWizard marketId={commentMarketId || marketId} commentId={commentId}
                                                 message={message} />,
        'DecideAnswerTitle', intl);
    } else {
      setItem(item, openExpansion, <BlockedWizard marketId={commentMarketId || marketId} commentId={commentId}
                                                  message={message} />,
        'DecideUnblockTitle', intl);
    }
  } else if (messageType === 'UNREAD_REPLY') {
    setItem(item, openExpansion, <ReplyWizard commentId={commentId} marketId={commentMarketId || marketId}
                                                message={message} />,
      'unreadReply', intl);
  }else if (['FULLY_VOTED', 'UNREAD_RESOLVED', 'UNREAD_VOTE'].includes(messageType)) {
    if (linkType === 'INVESTIBLE_VOTE') {
      setItem(item, openExpansion, <FeedbackWizard marketId={marketId} investibleId={investibleId} message={message} />,
        'startJobQ', intl);
    } else {
      setItem(item, openExpansion, <ResolveWizard commentId={commentId} marketId={commentMarketId || marketId}
                                                  message={message} />,
        messageType === 'UNREAD_RESOLVED' ? 'DecideResolveReopenTitle' : 'DecideResolveTitle', intl);
    }
  } else if (['UNREAD_REVIEWABLE', 'UNASSIGNED', 'REVIEW_REQUIRED'].includes(messageType)) {
    if (linkType === 'MARKET_TODO') {
      setItem(item, openExpansion, item.expansionPanel = <StartWizard commentId={commentId} marketId={marketId}
                                                                      message={message} />,
      'DecideStartTitle', intl);
    } else if (linkType === 'INVESTIBLE_REVIEW') {
      setItem(item, openExpansion, <ReviewWizard investibleId={investibleId} marketId={marketId} message={message} />,
        'DecideReviewTitle', intl);
    } else {
      setItem(item, openExpansion, <AssignWizard investibleId={investibleId} marketId={marketId} message={message} />,
        'DecideAssignmentTitle', intl);
    }
  } else if (messageType === 'UNREAD_ESTIMATE') {
    setItem(item, openExpansion,
      item.expansionPanel = <EstimateChangeWizard investibleId={investibleId} marketId={marketId}
                                                  message={message} />,
      undefined, intl);
  }
}

export function createDefaultInboxRow(messagesOrdered, loadingFromInvite, messagesState, tokensHash, intl, determinate,
  determinateDispatch, checkAll, tabIndex) {
  if (!_.isEmpty(messagesOrdered)) {
    return undefined;
  }


  if (tabIndex === PENDING_INDEX) {
    return (
      <Typography style={{marginTop: '2rem', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto'}}
                  variant="body1">
        Your From You tab is empty.<br/><br/> Your unanswered questions and suggestions display here.
      </Typography>
    );
  }

  if (tabIndex === TEAM_INDEX) {
    return (
      <Typography style={{marginTop: '2rem', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto'}}
                  variant="body1">
        Your Snoozed tab is empty.<br/><br/> Snoozed items return as unread after a day or when poked.
      </Typography>
    );
  }

  if (loadingFromInvite && hasNoChannels(tokensHash)) {
    return <LoadingDisplay showMessage messageId="loadingMessage" noMargin />;
  }

  return (
    <Typography style={{marginTop: '2rem', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto'}}
                variant="body1">
      Your Primary tab is empty.<br/><br/> New or done snoozing messages display here.
    </Typography>
  );
}

function getMessageForInvestible(investible, market, labelId, Icon, intl, messageType) {
  const investibleId = investible.investible.id
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
    messageType
  };
}

function getMessageForComment(comment, market, type, Icon, intl, investibleState, marketStagesState,
  comments, marketPresences) {
  const commentId = comment.id
  const message = {
    id: commentId,
    marketType: market.market_type,
    marketId: market.id,
    icon: Icon,
    comment: comment.body,
    title: `Done with this
        ${type === QUESTION_TYPE ? ' question' : (type === SUGGEST_CHANGE_TYPE ? ' suggestion' : ' issue')}?`,
    updatedAt: comment.updated_at,
    link: formCommentLink(market.id, comment.group_id, comment.investible_id, commentId),
    inFurtherWork: false,
    isOutboxType: true,
    isCommentType: true
  }
  if (comment.investible_id) {
    const investible = getInvestible(investibleState, comment.investible_id)
    const notDoingStage = getNotDoingStage(marketStagesState, market.id) || {};
    const backlogStage = getFurtherWorkStage(marketStagesState, market.id) || {};
    const marketInfo = getMarketInfo(investible, market.id) || {};
    if ([notDoingStage.id, backlogStage.id].includes(marketInfo.stage)) {
      return null;
    }
    if (investible && investible.investible && investible.investible.name) {
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

export function getOutboxMessages(props) {
  const { messagesState, marketsState, marketPresencesState, investiblesState, marketStagesState, commentsState,
    intl } = props;
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  const planningDetails = getMarketDetailsForType(myNotHiddenMarketsState, marketPresencesState, PLANNING_TYPE);
  const decisionDetails = getMarketDetailsForType(myNotHiddenMarketsState, marketPresencesState, DECISION_TYPE,
    true);

  const workspacesData = planningDetails.map((market) => {
    const marketPresences = getMarketPresences(marketPresencesState, market.id) || [];
    const myPresence = marketPresences.find((presence) => presence.current_user) || {};
    const investibles = getMarketInvestibles(investiblesState, market.id);
    const inVotingStage = getInCurrentVotingStage(marketStagesState, market.id) || {};
    const inVotingInvestibles = getUserInvestibles(myPresence.id, market.id, investibles,
      [inVotingStage]) || [];
    const inVotingNotAccepted = getUserPendingAcceptanceInvestibles(myPresence.id, market.id, investibles,
      [inVotingStage]) || [];
    const inVotingNotAcceptedMarked = inVotingNotAccepted.map((investible) => {
      return {...investible, notAccepted: true};
    });
    const comments = getMarketComments(commentsState, market.id);
    const myUnresolvedRoots = comments.filter((comment) => !comment.resolved &&
      comment.created_by === myPresence.id && !comment.reply_id);
    const questions = myUnresolvedRoots.filter((comment) => comment.comment_type === QUESTION_TYPE) || [];
    const issues = myUnresolvedRoots.filter((comment) => comment.comment_type === ISSUE_TYPE) || [];
    const suggestions = myUnresolvedRoots.filter((comment) => comment.comment_type === SUGGEST_CHANGE_TYPE) || [];
    return { market, comments, inVotingInvestibles: inVotingInvestibles.concat(inVotingNotAcceptedMarked), questions,
      issues, suggestions};
  });

  const messages = [];

  decisionDetails.forEach((market) => {
    const marketPresences = getMarketPresences(marketPresencesState, market.id) || [];
    const myPresence = marketPresences.find((presence) => presence.current_user) || {};
    const comments = getMarketComments(commentsState, market.id);
    const myUnresolvedRoots = comments.filter((comment) => !comment.resolved &&
      comment.created_by === myPresence.id && !comment.reply_id);
    const questions = myUnresolvedRoots.filter((comment) => comment.comment_type === QUESTION_TYPE) || [];
    const issues = myUnresolvedRoots.filter((comment) => comment.comment_type === ISSUE_TYPE) || [];
    const suggestions = myUnresolvedRoots.filter((comment) => comment.comment_type === SUGGEST_CHANGE_TYPE) || [];
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
  });

  workspacesData.forEach((workspacesData) => {
    const { market, comments, inVotingInvestibles, questions, issues, suggestions } = workspacesData;
    const marketPresences = getMarketPresences(marketPresencesState, market.id) || [];
    inVotingInvestibles.forEach((investible) => {
      const investibleId = investible.investible.id;
      const notAccepted = investible.notAccepted;
      const label = notAccepted ? 'planningUnacceptedLabel' : 'startJobQ';
      const messageIcon = notAccepted ? <PersonAddOutlined style={{ fontSize: 24, color: '#ffc61a', }}/> :
        <Assignment style={{ fontSize: 24, color: '#ffc61a', }}/>;
      const message = getMessageForInvestible(investible, market, label, messageIcon, intl,
        notAccepted ? 'UNASSIGNED' : 'UNREAD_VOTE')
      const { votes_required: votesRequired } = market
      const votersForInvestible = useInvestibleVoters(marketPresences, investibleId, market.id)
      const marketInfo = getMarketInfo(investible, market.id)
      const votersNotAssigned = votersForInvestible.filter((voter) => !_.includes(marketInfo.assigned, voter.id)) || []
      const votesRequiredDisplay = votesRequired > 0 ? votesRequired : 1
      if (!notAccepted) {
        message.isWaitingStart = true;
        message.inActive = votersNotAssigned.length >= votesRequiredDisplay;
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
      const myMessages = findMessagesForInvestibleId(investibleId, messagesState) || [];
      // Don't display vote for investible and move stage in same tab
      if (_.isEmpty(myMessages.find((myMessage) => myMessage.type === 'NOT_FULLY_VOTED' && myMessage.is_highlighted)))
      {
        messages.push(message);
      }
    });
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
  });

  return _.orderBy(messages, ['updatedAt'], ['asc']);
}