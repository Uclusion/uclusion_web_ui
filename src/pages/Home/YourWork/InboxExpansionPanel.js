import React from 'react'
import LinkMultiplePanel from './LinkMultiplePanel'
import CommentPanel from './CommentPanel'
import InboxInvestible from './InboxInvestible'
import { findMessageOfType } from '../../../utils/messageUtils'
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
import { ASSIGNED_INDEX, PENDING_INDEX, TEAM_INDEX } from './InboxContext'

export function usesExpansion(item, isMultiple) {
  if (isMultiple) {
    return true;
  }
  const { message, comment } = item;
  if (comment) {
    if (message) {
      return message.type !== 'NEW_TODO';
    }
    return true;
  }
  if (message && message.type) {
    return ['UNASSIGNED', 'UNREAD_DRAFT', 'UNREAD_VOTE', 'REPORT_REQUIRED', 'UNREAD_NAME', 'UNREAD_DESCRIPTION',
      'UNREAD_ATTACHMENT', 'UNREAD_LABEL', 'UNREAD_ESTIMATE', 'UNACCEPTED_ASSIGNMENT'].includes(message.type);
  }
  //Pending always expands
  return true;
}

export function addExpansionPanel(props) {
  const {item, planningClasses, mobileLayout, isMultiple, messagesState, isDeletable} = props;
  const { message } = item;
  const { type: messageType, market_id: marketId, comment_id: commentId, comment_market_id: commentMarketId,
    link_type: linkType, investible_id: investibleId, market_type: marketType, link_multiple: linkMultiple } = message;
  if (isMultiple) {
    item.expansionPanel = ( <LinkMultiplePanel linkMultiple={linkMultiple} marketId={commentMarketId || marketId}
                                               commentId={commentId} planningClasses={planningClasses} message={message}
                                               mobileLayout={mobileLayout} isDeletable={isDeletable}/> );
  } else if (linkType !== 'INVESTIBLE' && ((
    ['UNREAD_REPLY', 'UNREAD_COMMENT', 'UNREAD_RESOLVED', 'ISSUE', 'FULLY_VOTED'].includes(messageType)) ||
    (['UNREAD_OPTION', 'UNREAD_VOTE', 'NOT_FULLY_VOTED', 'INVESTIBLE_SUBMITTED'].includes(messageType)
      && linkType.startsWith('INLINE')) || (['UNREAD_REVIEWABLE', 'UNASSIGNED'].includes(messageType)
      && linkType === 'MARKET_TODO'))) {
    item.expansionPanel = ( <CommentPanel marketId={commentMarketId || marketId} commentId={commentId} message={message}
                                          marketType={marketType} messageType={messageType} isDeletable={isDeletable}
                                          planningClasses={planningClasses} mobileLayout={mobileLayout} /> );
  } else {
    item.expansionPanel = <InboxInvestible marketId={marketId} investibleId={investibleId} messageType={messageType}
                                           planningClasses={planningClasses} marketType={marketType}
                                           mobileLayout={mobileLayout} isDeletable={isDeletable} message={message}
                                           unacceptedAssignment={findMessageOfType('UNACCEPTED_ASSIGNMENT',
                                             investibleId, messagesState)} />;
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
        Your Unanswered tab is empty.<br/><br/> Your unanswered questions and suggestions will be shown here.
      </Typography>
    );
  }

  if (tabIndex === ASSIGNED_INDEX) {
    return (
      <Typography style={{marginTop: '2rem', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto'}}
                  variant="body1">
        Your Assigned tab is empty.<br/><br/> Assigned jobs, mentions, and required reviews and approvals
        will be shown here.
      </Typography>
    );
  }

  if (tabIndex === TEAM_INDEX) {
    return (
      <Typography style={{marginTop: '2rem', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto'}}
                  variant="body1">
        Your Team Unresolved tab is empty.<br/><br/> Unfinished team collaboration will be shown here.
      </Typography>
    );
  }

  if (loadingFromInvite && hasNoChannels(tokensHash)) {
    return <LoadingDisplay showMessage messageId="loadingMessage" noMargin />;
  }

  return (
    <Typography style={{marginTop: '2rem', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto'}}
                variant="body1">
      Your Unread tab is empty.<br/><br/> New messages will be shown here.
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
    link: formInvestibleLink(market.id, investibleId),
    isOutboxAccepted: investible.notAccepted,
    isOutboxType: true,
    isInvestibleType: true,
    messageType
  };
}

export function addOutboxExpansionPanel(message, expansionState, planningClasses, mobileLayout) {
  const { isInvestibleType, isCommentType, id, marketId, marketType, isOutboxType } = message;
  if (isOutboxType) {
    const expansionOpen = expansionState && !!expansionState[id];
    if (isInvestibleType) {
      if (expansionOpen) {
        message.expansionPanel = <InboxInvestible marketId={marketId} investibleId={id}
                                                  messageType={message.messageType} message={message}
                                                  planningClasses={planningClasses} marketType={PLANNING_TYPE}
                                                  mobileLayout={mobileLayout} isOutbox/>;
      }
    } else if (isCommentType) {
      if (expansionOpen) {
        message.expansionPanel =
          <CommentPanel marketId={marketId} commentId={id} marketType={marketType} message={message}
                        planningClasses={planningClasses} mobileLayout={mobileLayout} isOutbox/>
      }
    }
  }
}

function getMessageForComment(comment, market, labelId, Icon, intl, investibleState, marketStagesState,
  comments, marketPresences) {
  const commentId = comment.id
  const message = {
    id: commentId,
    marketType: market.market_type,
    icon: Icon,
    comment: comment.body,
    title: intl.formatMessage({ id: labelId }),
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
      const message = getMessageForComment(comment, market, 'cardTypeLabelQuestion',
        <QuestionIcon style={{ fontSize: 24, color: '#ffc61a', }}/>, intl, investiblesState, marketStagesState,
        comments, marketPresences)
      if (message) {
        messages.push(message);
      }
    });
    issues.forEach((comment) => {
      const message = getMessageForComment(comment, market, 'cardTypeLabelIssue',
        <IssueIcon style={{ fontSize: 24, color: '#E85757', }}/>, intl, investiblesState, marketStagesState,
        comments, marketPresences)
      if (message) {
        messages.push(message);
      }
    });
    suggestions.forEach((comment) => {
      const message = getMessageForComment(comment, market, 'cardTypeLabelSuggestedChange',
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
      const outboxMessage = getMessageForInvestible(investible, market, 'feedback',
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
      const label = notAccepted ? 'planningUnacceptedLabel' : 'inboxVotingLabel';
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
      const message = getMessageForComment(comment, market, 'cardTypeLabelQuestion',
        <QuestionIcon style={{ fontSize: 24, color: '#ffc61a', }}/>, intl, investiblesState, marketStagesState,
        comments, marketPresences)
      if (message) {
        messages.push(message);
      }
    });
    issues.forEach((comment) => {
      const message = getMessageForComment(comment, market, 'cardTypeLabelIssue',
        <IssueIcon style={{ fontSize: 24, color: '#E85757', }}/>, intl, investiblesState, marketStagesState,
        comments, marketPresences)
      if (message) {
        messages.push(message);
      }
    });
    suggestions.forEach((comment) => {
      const message = getMessageForComment(comment, market, 'cardTypeLabelSuggestedChange',
        <ChangeSuggstionIcon style={{ fontSize: 24, color: '#ffc61a', }}/>, intl, investiblesState, marketStagesState,
        comments, marketPresences)
      if (message) {
        messages.push(message);
      }
    });
  });

  return _.orderBy(messages, ['updatedAt'], ['asc']);
}