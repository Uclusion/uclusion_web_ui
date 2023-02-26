import React from 'react'
import _ from 'lodash'
import {
  getMarketDetailsForType,
  getNotHiddenMarketDetailsForUser,
  hasNoChannels
} from '../../../contexts/MarketsContext/marketsContextHelper'
import LoadingDisplay from '../../../components/LoadingDisplay'
import { PersonAddOutlined } from '@material-ui/icons'
import { DECISION_TYPE, PLANNING_TYPE } from '../../../constants/markets'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { getInvestible, getMarketInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import {
  getFurtherWorkStage,
  getInCurrentVotingStage,
  getInReviewStage, getNotDoingStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { getUserInvestibles, getUserPendingAcceptanceInvestibles } from '../../Dialog/Planning/userUtils'
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper'
import { ISSUE_TYPE, QUESTION_TYPE, REPORT_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments'
import QuestionIcon from '@material-ui/icons/ContactSupport'
import IssueIcon from '@material-ui/icons/ReportProblem'
import ChangeSuggstionIcon from '@material-ui/icons/ChangeHistory'
import RateReviewIcon from '@material-ui/icons/RateReview'
import { getMarketInfo } from '../../../utils/userFunctions'
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown'
import { getInvestibleVoters } from '../../../utils/votingUtils'
import { formCommentLink, formInvestibleLink } from '../../../utils/marketIdPathFunctions'
import { Typography } from '@material-ui/core'
import { PENDING_INDEX, TEAM_INDEX } from './InboxContext'
import ApprovalWizard from '../../../components/InboxWizards/Approval/ApprovalWizard'
import StatusWizard from '../../../components/InboxWizards/Status/StatusWizard'
import AnswerWizard from '../../../components/InboxWizards/Answer/AnswerWizard'
import VoteWizard from '../../../components/InboxWizards/Vote/VoteWizard'
import AcceptRejectWizard from '../../../components/InboxWizards/AcceptReject/AcceptRejectWizard'
import StartWizard from '../../../components/InboxWizards/Start/StartWizard'
import ResolveWizard from '../../../components/InboxWizards/Resolve/ResolveWizard'
import AssignWizard from '../../../components/InboxWizards/Assign/AssignWizard'
import ReviewWizard from '../../../components/InboxWizards/Review/ReviewWizard'
import BlockedWizard from '../../../components/InboxWizards/Unblock/BlockedWizard'
import StageWizard from '../../../components/InboxWizards/Stage/StageWizard';
import WaitingAssistanceWizard from '../../../components/InboxWizards/WaitingAssistance/WaitingAssistanceWizard';
import AssignToOtherWizard from '../../../components/InboxWizards/AssignToOther/AssignToOtherWizard';
import { getCommentsSortedByType } from '../../../utils/commentFunctions';

export function usesExpansion(item) {
  const { message } = item;
  if (message) {
    if (message.type) {
      if (message.type === 'UNREAD_REVIEWABLE') {
        const { link_type: linkType } = message;
        // No wizard for someone adds a comment to an investible assigned to you
        return linkType !== 'INVESTIBLE_COMMENT';
      }
      // Skipping UNREAD_REPLY - everyone already knows how to reply and a wizard would just be confusing
      // Skipping UNREAD_VOTE - need to inform but not very actionable
      return ['UNASSIGNED', 'REPORT_REQUIRED', 'UNREAD_RESOLVED', 'FULLY_VOTED', 'NOT_FULLY_VOTED', 'ISSUE',
        'REVIEW_REQUIRED', 'ASSIGNED_UNREVIEWABLE'].includes(message.type);
    }
    if (message.isOutboxAccepted) {
      return true;
    }
    //Other pending just clicks through if not assigned or needs assistance
    return message.isOutboxType && (message.isAssigned || (message.isCommentType && !_.isEmpty(message.investible)));
  }
  return false;
}

function setItem(item, isOpen, panel, titleId, intl) {
  if (isOpen) {
    item.expansionPanel = panel;
  }
  if (usesExpansion(item) && titleId) {
    item.title = intl.formatMessage({ id: titleId });
  }
}

export function calculateTitleExpansionPanel(props) {
  const { item, inboxDispatch, openExpansion, intl } = props;
  const { message } = item;
  const { type: messageType, market_id: marketId, comment_id: commentId, comment_market_id: commentMarketId,
    link_type: linkType, investible_id: investibleId, market_type: marketType, isOutboxAccepted,
    type_object_id: typeObjectId } = message;
  if (isOutboxAccepted) {
    setItem(item, openExpansion, <AssignToOtherWizard investibleId={message.id} marketId={message.marketId}
                                               rowId={message.id} inboxDispatch={inboxDispatch} />,
      'DecideAssignTitle', intl);
  } else if (!messageType || messageType === 'ASSIGNED_UNREVIEWABLE') {
    if (messageType === 'ASSIGNED_UNREVIEWABLE') {
      setItem(item, openExpansion, <StageWizard investibleId={investibleId} marketId={marketId}
                                                inboxDispatch={inboxDispatch} rowId={typeObjectId} />,
        'reviewJobQ', intl);
    } else if (message.isOutboxType) {
      if (message.isAssigned) {
        setItem(item, openExpansion, <StageWizard investibleId={message.id} marketId={message.marketId}
                                                  rowId={message.id} inboxDispatch={inboxDispatch}/>,
          undefined, intl);
      } else {
        setItem(item, openExpansion, <WaitingAssistanceWizard commentId={message.id} marketId={message.marketId}
                                                              rowId={message.id} inboxDispatch={inboxDispatch} />,
        undefined, intl);
      }
    }
  } else if (messageType === 'NOT_FULLY_VOTED') {
    if (marketType === PLANNING_TYPE) {
      setItem(item, openExpansion, <ApprovalWizard investibleId={investibleId} marketId={marketId} message={message}
                                                   inboxDispatch={inboxDispatch}/>, 'JobApprovalTitle', intl);
    } else if (marketType === DECISION_TYPE) {
      setItem(item, openExpansion, <AnswerWizard marketId={commentMarketId || marketId} commentId={commentId}
                                          message={message} inboxDispatch={inboxDispatch}/>,
        'DecideAnswerTitle', intl);
    } else {
      setItem(item, openExpansion, <VoteWizard marketId={commentMarketId || marketId} commentId={commentId}
                                               message={message} inboxDispatch={inboxDispatch}/>,
        'DecideVoteTitle', intl);
    }
  } else if (messageType === 'REPORT_REQUIRED') {
    setItem(item, openExpansion, <StatusWizard investibleId={investibleId} marketId={marketId} message={message}
                                               inboxDispatch={inboxDispatch} />, 'JobStatusTitle', intl);
  } else if (messageType === 'ISSUE') {
    if (linkType === 'INVESTIBLE_SUGGESTION') {
      setItem(item, openExpansion, <AcceptRejectWizard commentId={commentId} marketId={marketId} message={message}
                                                       inboxDispatch={inboxDispatch}/>,
        'DecideAcceptRejectTitle', intl);
    } else if (linkType === 'INVESTIBLE_QUESTION') {
      setItem(item, openExpansion, <AnswerWizard marketId={commentMarketId || marketId} commentId={commentId}
                                                 message={message} inboxDispatch={inboxDispatch}/>,
        'DecideAnswerTitle', intl);
    } else {
      setItem(item, openExpansion, <BlockedWizard marketId={commentMarketId || marketId} commentId={commentId}
                                                  message={message} inboxDispatch={inboxDispatch}/>,
        'DecideUnblockTitle', intl);
    }
  } else if (['FULLY_VOTED', 'UNREAD_RESOLVED'].includes(messageType)) {
    setItem(item, openExpansion, <ResolveWizard commentId={commentId} marketId={commentMarketId || marketId}
                                                message={message} inboxDispatch={inboxDispatch}/>,
      messageType === 'UNREAD_RESOLVED' ? 'DecideResolveReopenTitle' : 'DecideResolveTitle', intl);
  } else if (['UNREAD_REVIEWABLE', 'UNASSIGNED', 'REVIEW_REQUIRED'].includes(messageType)) {
    if (linkType === 'MARKET_TODO') {
      setItem(item, openExpansion, item.expansionPanel = <StartWizard commentId={commentId} marketId={marketId}
                                                                      message={message} inboxDispatch={inboxDispatch}/>,
      'DecideStartTitle', intl);
    } else if (linkType === 'INVESTIBLE_REVIEW') {
      setItem(item, openExpansion, <ReviewWizard investibleId={investibleId} marketId={marketId} message={message}
                                                 inboxDispatch={inboxDispatch}/>, 'DecideReviewTitle', intl);
    } else {
      setItem(item, openExpansion, <AssignWizard investibleId={investibleId} marketId={marketId} message={message}
                                                 inboxDispatch={inboxDispatch}/>, 'DecideAssignmentTitle', intl);
    }
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
        Your From You tab is empty.<br/><br/> Your unanswered questions and suggestions will be shown here.
      </Typography>
    );
  }

  if (tabIndex === TEAM_INDEX) {
    return (
      <Typography style={{marginTop: '2rem', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto'}}
                  variant="body1">
        Your Deferred tab is empty.<br/><br/> Unfinished team collaboration will be shown here.
      </Typography>
    );
  }

  if (loadingFromInvite && hasNoChannels(tokensHash)) {
    return <LoadingDisplay showMessage messageId="loadingMessage" noMargin />;
  }

  return (
    <Typography style={{marginTop: '2rem', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto'}}
                variant="body1">
      Your Primary tab is empty.<br/><br/> New messages and assigned jobs will be shown here.
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
        ${type === QUESTION_TYPE ? ' question' : (type === SUGGEST_CHANGE_TYPE ? ' suggestion' : ' blocking issue')}?`,
    updatedAt: comment.updated_at,
    link: formCommentLink(market.id, comment.group_id, comment.investible_id, commentId),
    inFurtherWork: false,
    isOutboxType: true,
    isCommentType: true
  }
  if (comment.investible_id) {
    const investible = getInvestible(investibleState, comment.investible_id)
    const notDoingStage = getNotDoingStage(marketStagesState, market.id) || {}
    const marketInfo = getMarketInfo(investible, market.id) || {}
    if (marketInfo.stage === notDoingStage.id) {
      return null
    }
    const furtherWork = getFurtherWorkStage(marketStagesState, market.id) || {}
    if (marketInfo.stage === furtherWork.id) {
      message.inActive = true
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
  const { messages: messagesUnsafe } = messagesState;
  const inboxMessages = messagesUnsafe || [];
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState);
  const planningDetails = getMarketDetailsForType(myNotHiddenMarketsState, marketPresencesState, PLANNING_TYPE);
  const decisionDetails = getMarketDetailsForType(myNotHiddenMarketsState, marketPresencesState, DECISION_TYPE, true);

  const workspacesData = planningDetails.map((market) => {
    const marketPresences = getMarketPresences(marketPresencesState, market.id) || [];
    const myPresence = marketPresences.find((presence) => presence.current_user) || {};
    const investibles = getMarketInvestibles(investiblesState, market.id);
    // Not filtering by whether in Inbox or not because users should deal with Inbox before worry about Outbox
    const inReviewStage = getInReviewStage(marketStagesState, market.id) || {};
    const inReviewInvestiblesFull = getUserInvestibles(myPresence.id, market.id, investibles,
      [inReviewStage]) || [];
    const inReviewInvestibles = inReviewInvestiblesFull.filter((investible) => {
      const investibleId = investible.investible.id;
      const mySubmitted = inboxMessages.find((message) => {
        const { investible_id: msgInvestibleId, type: messageType } = message;
        return msgInvestibleId === investibleId && messageType === 'NEW_TODO';
      })
      // If message to finish Todos then no one owes you anything
      return _.isEmpty(mySubmitted);
    })
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
    return { market, comments, inReviewInvestibles,
      inVotingInvestibles: inVotingInvestibles.concat(inVotingNotAcceptedMarked), questions, issues, suggestions};
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
        <IssueIcon style={{ fontSize: 24, color: '#E85757', }}/>, intl, investiblesState, marketStagesState,
        comments, marketPresences)
      if (message) {
        messages.push(message);
      }
    });
    suggestions.forEach((comment) => {
      const message = getMessageForComment(comment, market, SUGGEST_CHANGE_TYPE,
        <ChangeSuggstionIcon style={{ fontSize: 24, color: '#ffc61a', }}/>, intl, investiblesState, marketStagesState,
        comments, marketPresences)
      if (message) {
        messages.push(message);
      }
    });
  });

  workspacesData.forEach((workspacesData) => {
    const { market, comments, inReviewInvestibles, inVotingInvestibles, questions, issues,
      suggestions } = workspacesData;
    const marketPresences = getMarketPresences(marketPresencesState, market.id) || [];
    inReviewInvestibles.forEach((investible) => {
      const investibleId = investible.investible.id;
      const investibleComments = getCommentsSortedByType(comments, investibleId, false);
      const outboxMessage = getMessageForInvestible(investible, market,
        _.isEmpty(investibleComments) ? 'finishJobQ' : 'restartJobQ',
        <RateReviewIcon style={{ fontSize: 24, color: '#ffc61a', }}/>, intl, 'UNREAD_REVIEWABLE');
      const marketInfo = getMarketInfo(investible, market.id);
      if (!_.isEmpty(marketInfo.required_reviews)) {
        //add required reviewers with no comment
        const debtors = [];
        marketInfo.required_reviews.forEach((userId) => {
          const aComment = comments.find((comment) => !comment.resolved && comment.investible_id === investibleId &&
            comment.created_by === userId &&
            [TODO_TYPE, REPORT_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE].includes(comment.comment_type));
          if (!aComment) {
            const user = marketPresences.find((presence) => presence.id === userId);
            if (user) {
              debtors.push(user);
            }
          }
        });
        if (!_.isEmpty(debtors)) {
          outboxMessage.debtors = debtors;
        }
      }
      messages.push(outboxMessage);
    });
    inVotingInvestibles.forEach((investible) => {
      const investibleId = investible.investible.id;
      const notAccepted = investible.notAccepted;
      const label = notAccepted ? 'planningUnacceptedLabel' : 'startJobQ';
      const messageIcon = notAccepted ? <PersonAddOutlined style={{ fontSize: 24, color: '#ffc61a', }}/> :
        <ThumbsUpDownIcon style={{ fontSize: 24, color: '#ffc61a', }}/>;
      const message = getMessageForInvestible(investible, market, label, messageIcon, intl,
        notAccepted ? 'UNASSIGNED' : 'UNREAD_VOTE')
      const { votes_required: votesRequired } = market
      const votersForInvestible = getInvestibleVoters(marketPresences, investibleId)
      const marketInfo = getMarketInfo(investible, market.id)
      const votersNotAssigned = votersForInvestible.filter((voter) => !_.includes(marketInfo.assigned, voter.id)) || []
      const votesRequiredDisplay = votesRequired > 0 ? votesRequired : 1
      if (!notAccepted && votersNotAssigned.length >= votesRequiredDisplay) {
        message.inActive = true
      }
      let debtors = [];
      if (notAccepted) {
        debtors = marketPresences.filter((presence) => marketInfo.assigned.includes(presence.id));
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
        <IssueIcon style={{ fontSize: 24, color: '#E85757', }}/>, intl, investiblesState, marketStagesState,
        comments, marketPresences)
      if (message) {
        messages.push(message);
      }
    });
    suggestions.forEach((comment) => {
      const message = getMessageForComment(comment, market, SUGGEST_CHANGE_TYPE,
        <ChangeSuggstionIcon style={{ fontSize: 24, color: '#ffc61a', }}/>, intl, investiblesState, marketStagesState,
        comments, marketPresences)
      if (message) {
        messages.push(message);
      }
    });
  });

  return _.orderBy(messages, ['updatedAt'], ['asc']);
}