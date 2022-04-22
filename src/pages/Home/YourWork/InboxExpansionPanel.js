import React from 'react'
import DialogManage from '../../Dialog/DialogManage'
import { UNASSIGNED_TYPE } from '../../../constants/notifications'
import LinkMultiplePanel from './LinkMultiplePanel'
import CommentPanel from './CommentPanel'
import InboxInvestible from './InboxInvestible'
import { findMessageOfType } from '../../../utils/messageUtils'
import NotificationDeletion from './NotificationDeletion'
import _ from 'lodash'
import {
  getMarketDetailsForType,
  getNotHiddenMarketDetailsForUser,
  hasNoChannels
} from '../../../contexts/MarketsContext/marketsContextHelper'
import LoadingDisplay from '../../../components/LoadingDisplay'
import { Assignment, Weekend } from '@material-ui/icons'
import InboxWelcomeExpansion from './InboxWelcomeExpansion'
import WorkListItem from './WorkListItem'
import { DECISION_TYPE, PLANNING_TYPE } from '../../../constants/markets'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { getInvestible, getMarketInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import {
  getFurtherWorkStage,
  getInCurrentVotingStage,
  getInReviewStage, getNotDoingStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { getUserInvestibles } from '../../Dialog/Planning/userUtils'
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
  } else if (['NOT_FULLY_VOTED', 'ASSIGNED_UNREVIEWABLE','UNREAD_REVIEWABLE', 'REVIEW_REQUIRED', 'REPORT_REQUIRED',
    'ISSUE_RESOLVED', 'UNACCEPTED_ASSIGNMENT', 'NEW_TODO', 'UNREAD_VOTE', UNASSIGNED_TYPE, 'UNREAD_DESCRIPTION',
    'UNREAD_NAME', 'UNREAD_ATTACHMENT', 'UNREAD_LABEL', 'UNREAD_ESTIMATE'].includes(messageType)) {
    item.expansionPanel = <InboxInvestible marketId={marketId} investibleId={investibleId} messageType={messageType}
                                           planningClasses={planningClasses} marketType={marketType}
                                           mobileLayout={mobileLayout} isDeletable={isDeletable} message={message}
                                           unacceptedAssignment={findMessageOfType('UNACCEPTED_ASSIGNMENT',
                                             investibleId, messagesState)} />;
  } else if (messageType === 'UNREAD_DRAFT') {
    item.expansionPanel = (
      <>
        <div style={{paddingLeft: '1.25rem', paddingTop: '1rem'}}>
          <NotificationDeletion message={message} />
        </div>
        <DialogManage marketId={marketId} isInbox />
      </>
    );
  }
}

export function createDefaultInboxRow(messagesOrdered, loadingFromInvite, messagesState, tokensHash, intl, determinate,
  determinateDispatch, checkAll, expansionState, expansionDispatch) {
  if (!_.isEmpty(messagesOrdered)) {
    return undefined;
  }
  const id = 'emptyInbox';
  const { messages } = (messagesState || {});
  const safeMessages = messages || [];
  const existingMessage = safeMessages.find((message) => message.type_object_id === id)
    || { is_highlighted: true };

  if (loadingFromInvite && hasNoChannels(tokensHash)) {
    return <LoadingDisplay showMessage messageId="loadingMessage" noMargin />;
  }

  if (hasNoChannels(tokensHash)) {
    const item = {
      title: intl.formatMessage({ id: 'welcome' }),
      market: intl.formatMessage({ id: 'aboutInbox' }),
      icon: <Assignment style={{fontSize: 24, color: '#2D9CDB',}}/>,
      read: !existingMessage.is_highlighted,
      message: {type_object_id: id},
      expansionPanel: <InboxWelcomeExpansion />,
      moreDescription: intl.formatMessage({ id: 'demonstratesInbox' }),
      date: intl.formatDate(new Date())
    };
    const determinateChecked = determinate[id];
    const checked = determinateChecked !== undefined ? determinateChecked : checkAll;
    return <WorkListItem key={id} id={id} expansionOpen={!!expansionState[id]}
                                    checked={checked} {...item}
                                    determinateDispatch={determinateDispatch} expansionDispatch={expansionDispatch}
    />;
  }

  return <WorkListItem key={id} id={id} useSelect={false} {...{
      title: intl.formatMessage({ id: 'enjoy' }),
      market: intl.formatMessage({ id: 'noNew' }),
      icon: <Weekend style={{fontSize: 24, color: '#2D9CDB',}}/>,
      read: false,
      date: intl.formatDate(new Date()),
      message: {link: '/outbox'}
  }} />;
}

function getMessageForInvestible (investible, market, labelId, Icon, intl) {
  const investibleId = investible.investible.id
  return {
    id: investibleId,
    market: market.name,
    icon: Icon,
    investible: investible.investible.name,
    title: intl.formatMessage({ id: labelId }),
    updatedAt: investible.investible.updated_at,
    link: formInvestibleLink(market.id, investibleId)
  };
}

function getMessageForComment (comment, market, labelId, Icon, intl, investibleState, marketStagesState,
  comments, marketPresences, planningClasses, mobileLayout, expansionState) {
  const commentId = comment.id
  const message = {
    id: commentId,
    market: market.name,
    icon: Icon,
    comment: comment.body,
    title: intl.formatMessage({ id: labelId }),
    updatedAt: comment.updated_at,
    link: formCommentLink(market.id, comment.investible_id, commentId),
    inFurtherWork: false
  }
  const expansionOpen = expansionState && !!expansionState[commentId]
  if (expansionOpen) {
    message.expansionPanel =
      <CommentPanel marketId={market.id} commentId={commentId} marketType={market.market_type} message={message}
                    planningClasses={planningClasses} mobileLayout={mobileLayout} isOutbox />
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
  const { messagesState, marketState, marketPresencesState, investiblesState, marketStagesState, commentsState,
    planningClasses, mobileLayout, expansionState, intl } = props;
  const { messages: messagesUnsafe } = messagesState;
  const inboxMessages = messagesUnsafe || [];
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketState, marketPresencesState);
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
    const comments = getMarketComments(commentsState, market.id);
    const myUnresolvedRoots = comments.filter((comment) => !comment.resolved &&
      comment.created_by === myPresence.id && !comment.reply_id);
    const questions = myUnresolvedRoots.filter((comment) => comment.comment_type === QUESTION_TYPE) || [];
    const issues = myUnresolvedRoots.filter((comment) => comment.comment_type === ISSUE_TYPE) || [];
    const suggestions = myUnresolvedRoots.filter((comment) => comment.comment_type === SUGGEST_CHANGE_TYPE) || [];
    return { market, comments, inReviewInvestibles, inVotingInvestibles, questions, issues, suggestions};
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
        <QuestionIcon style={{ fontSize: 24, color: '#8f8f8f', }}/>, intl, investiblesState, marketStagesState,
        comments, marketPresences, planningClasses, mobileLayout, expansionState)
      if (message) {
        messages.push(message);
      }
    });
    issues.forEach((comment) => {
      const message = getMessageForComment(comment, market, 'cardTypeLabelIssue',
        <IssueIcon style={{ fontSize: 24, color: '#8f8f8f', }}/>, intl, investiblesState, marketStagesState,
        comments, marketPresences, planningClasses, mobileLayout, expansionState)
      if (message) {
        messages.push(message);
      }
    });
    suggestions.forEach((comment) => {
      const message = getMessageForComment(comment, market, 'cardTypeLabelSuggestedChange',
        <ChangeSuggstionIcon style={{ fontSize: 24, color: '#8f8f8f', }}/>, intl, investiblesState, marketStagesState,
        comments, marketPresences, planningClasses, mobileLayout, expansionState)
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
      const outboxMessage = getMessageForInvestible(investible, market, 'planningInvestibleMobileInReviewLabel',
        <RateReviewIcon style={{ fontSize: 24, color: '#8f8f8f', }}/>, intl);
      const expansionOpen = expansionState && !!expansionState[investibleId];
      if (expansionOpen) {
        outboxMessage.expansionPanel = <InboxInvestible marketId={market.id} investibleId={investibleId}
                                                        messageType={'UNREAD_REVIEWABLE'}
                                                        planningClasses={planningClasses} marketType={PLANNING_TYPE}
                                                        mobileLayout={mobileLayout} isOutbox/>;
      }
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
      const investibleId = investible.investible.id
      const message = getMessageForInvestible(investible, market, 'planningMobileToVotingLabel',
        <ThumbsUpDownIcon style={{ fontSize: 24, color: '#8f8f8f', }}/>, intl)
      const expansionOpen = expansionState && !!expansionState[investibleId]
      if (expansionOpen) {
        message.expansionPanel = <InboxInvestible marketId={market.id} investibleId={investibleId}
                                                  messageType={'UNREAD_VOTE'}
                                                  planningClasses={planningClasses} marketType={PLANNING_TYPE}
                                                  mobileLayout={mobileLayout} isOutbox />
      }
      const { votes_required: votesRequired } = market
      const votersForInvestible = getInvestibleVoters(marketPresences, investibleId)
      const marketInfo = getMarketInfo(investible, market.id)
      const votersNotAssigned = votersForInvestible.filter((voter) => !_.includes(marketInfo.assigned, voter.id)) || []
      const votesRequiredDisplay = votesRequired > 0 ? votesRequired : 1
      if (votersNotAssigned.length >= votesRequiredDisplay) {
        message.inActive = true
      }
      if (!_.isEmpty(marketInfo.required_approvers)) {
        //add required approvers that have not voted or commented
        const debtors = [];
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
        if (!_.isEmpty(debtors)) {
          message.debtors = debtors;
        }
      }
      messages.push(message);
    });
    questions.forEach((comment) => {
      const message = getMessageForComment(comment, market, 'cardTypeLabelQuestion',
        <QuestionIcon style={{ fontSize: 24, color: '#8f8f8f', }}/>, intl, investiblesState, marketStagesState,
        comments, marketPresences, planningClasses, mobileLayout, expansionState)
      if (message) {
        messages.push(message);
      }
    });
    issues.forEach((comment) => {
      const message = getMessageForComment(comment, market, 'cardTypeLabelIssue',
        <IssueIcon style={{ fontSize: 24, color: '#8f8f8f', }}/>, intl, investiblesState, marketStagesState,
        comments, marketPresences, planningClasses, mobileLayout, expansionState)
      if (message) {
        messages.push(message);
      }
    });
    suggestions.forEach((comment) => {
      const message = getMessageForComment(comment, market, 'cardTypeLabelSuggestedChange',
        <ChangeSuggstionIcon style={{ fontSize: 24, color: '#8f8f8f', }}/>, intl, investiblesState, marketStagesState,
        comments, marketPresences, planningClasses, mobileLayout, expansionState)
      if (message) {
        messages.push(message);
      }
    });
  });

  return _.orderBy(messages, ['updatedAt'], ['asc']);
}