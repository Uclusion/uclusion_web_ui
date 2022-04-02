import WorkListItem from './WorkListItem'
import { Box, Fab, IconButton, useMediaQuery, useTheme } from '@material-ui/core'
import React, { useContext } from 'react'
import { useIntl } from 'react-intl'
import {
  formCommentLink,
  formInvestibleLink,
  navigate,
  preventDefaultAndProp
} from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { DECISION_TYPE, PLANNING_TYPE } from '../../../constants/markets'
import {
  getInvestible,
  getMarketInvestibles
} from '../../../contexts/InvestibesContext/investiblesContextHelper'
import {
  getFurtherWorkStage,
  getInCurrentVotingStage,
  getInReviewStage, getNotDoingStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { nameFromDescription } from '../../../utils/stringFunctions'
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import _ from 'lodash'
import Badge from '@material-ui/core/Badge'
import { makeStyles } from '@material-ui/styles'
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown'
import RateReviewIcon from '@material-ui/icons/RateReview'
import QuestionIcon from '@material-ui/icons/ContactSupport'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import {
  getMarketDetailsForType,
  getNotHiddenMarketDetailsForUser
} from '../../../contexts/MarketsContext/marketsContextHelper'
import { getUserInvestibles } from '../../Dialog/Planning/userUtils'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import {
  ISSUE_TYPE,
  QUESTION_TYPE,
  REPORT_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE
} from '../../../constants/comments'
import ChangeSuggstionIcon from '@material-ui/icons/ChangeHistory'
import IssueIcon from '@material-ui/icons/ReportProblem'
import { getInvestibleVoters } from '../../../utils/votingUtils'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import { getMarketInfo } from '../../../utils/userFunctions'
import { AlarmOn, KeyboardArrowLeft, Weekend } from '@material-ui/icons'
import CommentPanel from './CommentPanel'
import { usePlanningInvestibleStyles } from '../../Investible/Planning/PlanningInvestible'
import InboxInvestible from './InboxInvestible'
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight'
import { getPaginatedItems } from '../../../utils/messageUtils'

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
      <CommentPanel marketId={market.id} commentId={commentId} marketType={market.market_type}
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

const useStyles = makeStyles(
  theme => {
    return {
      chip: {
        color: 'black',
        '& .MuiBadge-badge': {
          border: '0.5px solid grey',
          backgroundColor: '#fff',
        },
      },
      fab: {
        backgroundColor: '#fff',
        borderRadius: '50%',
        width: '48px',
        height: '48px',
        minHeight: '48px',
        [theme.breakpoints.down('sm')]: {
          width: '36px',
          height: '36px',
          minHeight: '36px'
        },
      },
      bellButton: {
        marginLeft: '0.5em',
        marginRight: '0.5em',
        marginTop: '0.5rem'
      }
    };
});

function Outbox(props) {
  const { isJarDisplay = false, isDisabled = false, expansionState, expansionDispatch, page, setPage } = props
  const classes = useStyles()
  const intl = useIntl();
  const history = useHistory();
  const planningClasses = usePlanningInvestibleStyles();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [investibleState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentState] = useContext(CommentsContext);
  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [messagesState] = useContext(NotificationsContext);
  const { messages: messagesUnsafe } = messagesState;
  const inboxMessages = messagesUnsafe || [];
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  const planningDetails = getMarketDetailsForType(myNotHiddenMarketsState, marketPresencesState, PLANNING_TYPE);
  const decisionDetails = getMarketDetailsForType(myNotHiddenMarketsState, marketPresencesState, DECISION_TYPE, true);

  const workspacesData = planningDetails.map((market) => {
    const marketPresences = getMarketPresences(marketPresencesState, market.id) || [];
    const myPresence = marketPresences.find((presence) => presence.current_user) || {};
    const investibles = getMarketInvestibles(investibleState, market.id);
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
    const comments = getMarketComments(commentState, market.id);
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
    const comments = getMarketComments(commentState, market.id);
    const myUnresolvedRoots = comments.filter((comment) => !comment.resolved &&
      comment.created_by === myPresence.id && !comment.reply_id);
    const questions = myUnresolvedRoots.filter((comment) => comment.comment_type === QUESTION_TYPE) || [];
    const issues = myUnresolvedRoots.filter((comment) => comment.comment_type === ISSUE_TYPE) || [];
    const suggestions = myUnresolvedRoots.filter((comment) => comment.comment_type === SUGGEST_CHANGE_TYPE) || [];
    questions.forEach((comment) => {
      const message = getMessageForComment(comment, market, 'cardTypeLabelQuestion',
        <QuestionIcon style={{ fontSize: 24, color: '#8f8f8f', }}/>, intl, investibleState, marketStagesState,
        comments, marketPresences, planningClasses, mobileLayout, expansionState)
      if (message) {
        messages.push(message);
      }
    });
    issues.forEach((comment) => {
      const message = getMessageForComment(comment, market, 'cardTypeLabelIssue',
        <IssueIcon style={{ fontSize: 24, color: '#8f8f8f', }}/>, intl, investibleState, marketStagesState,
        comments, marketPresences, planningClasses, mobileLayout, expansionState)
      if (message) {
        messages.push(message);
      }
    });
    suggestions.forEach((comment) => {
      const message = getMessageForComment(comment, market, 'cardTypeLabelSuggestedChange',
        <ChangeSuggstionIcon style={{ fontSize: 24, color: '#8f8f8f', }}/>, intl, investibleState, marketStagesState,
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
      const outboxMessage = getMessageForInvestible(investible, market, 'planningInvestibleNextStageInReviewLabel',
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
      const message = getMessageForInvestible(investible, market, 'planningInvestibleToVotingLabel',
        <ThumbsUpDownIcon style={{ fontSize: 24, color: '#8f8f8f', }}/>, intl)
      const expansionOpen = expansionState && !!expansionState[investibleId]
      if (expansionOpen) {
        message.expansionPanel = <InboxInvestible marketId={market.id} investibleId={investibleId}
                                                  messageType={'UNREAD_VOTE'}
                                                  planningClasses={planningClasses} marketType={PLANNING_TYPE}
                                                  mobileLayout={mobileLayout}/>
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
        <QuestionIcon style={{ fontSize: 24, color: '#8f8f8f', }}/>, intl, investibleState, marketStagesState,
        comments, marketPresences, planningClasses, mobileLayout, expansionState)
      if (message) {
        messages.push(message);
      }
    });
    issues.forEach((comment) => {
      const message = getMessageForComment(comment, market, 'cardTypeLabelIssue',
        <IssueIcon style={{ fontSize: 24, color: '#8f8f8f', }}/>, intl, investibleState, marketStagesState,
        comments, marketPresences, planningClasses, mobileLayout, expansionState)
      if (message) {
        messages.push(message);
      }
    });
    suggestions.forEach((comment) => {
      const message = getMessageForComment(comment, market, 'cardTypeLabelSuggestedChange',
        <ChangeSuggstionIcon style={{ fontSize: 24, color: '#8f8f8f', }}/>, intl, investibleState, marketStagesState,
        comments, marketPresences, planningClasses, mobileLayout, expansionState)
      if (message) {
        messages.push(message);
      }
    });
  });

  const messagesOrdered = isJarDisplay ? _.orderBy(messages, ['inActive', 'updatedAt'], ['desc', 'asc'])
    : _.orderBy(messages, ['updatedAt'], ['asc']);
  const filteredForJarCount = messages.filter((message) => !message.inActive);
  const goFullOutboxClick = (event) => {
    preventDefaultAndProp(event);
    navigate(history, '/outbox');
  };
  if (isJarDisplay) {
    return (
      <div id='outboxNotification' key='outbox' onClick={goFullOutboxClick} className={classes.bellButton}>
        <Badge badgeContent={filteredForJarCount.length} className={classes.chip} overlap="circular">
          <Fab id='notifications-fabInbox' className={classes.fab} disabled={isDisabled}>
            <AlarmOn htmlColor='black' />
          </Fab>
        </Badge>
      </div>
    );
  }

  let rows = messagesOrdered.map((message) => {
    const { id, investible, updatedAt, title, icon, comment, inActive, debtors, expansionPanel } = message;
    const item = {
      title,
      icon,
      read: !!inActive,
      isDeletable: false,
      people: debtors,
      date: intl.formatDate(updatedAt),
      expansionPanel,
      message
    }
    if (investible) {
      item.investible = investible;
    }
    if (comment) {
      const commentName = nameFromDescription(comment);
      if (commentName) {
        item.comment = commentName;
      }
    }
    return <WorkListItem key={`outboxRow${id}`} id={id} useSelect={false} {...item}
                         expansionDispatch={expansionDispatch} expansionOpen={!!expansionState[id]} />;
  });

  if (_.isEmpty(rows)) {
    const item = {
      title: intl.formatMessage({ id: 'enjoy' }),
      market: intl.formatMessage({ id: 'noPending' }),
      icon: <Weekend style={{ fontSize: 24, color: '#2D9CDB', }}/>,
      read: false,
      isDeletable: false,
      message: { link: '/inbox' }
    };
    rows = [<WorkListItem key="emptyOutbox" id="emptyOutbox" useSelect={false} {...item} />]
  }

  function changePage (byNum) {
    setPage(page + byNum)
  }

  const { first, last, data, hasMore, hasLess } = getPaginatedItems(rows, page)
  return (
    <div id="outbox">
      <Box fontSize={14} color="text.secondary">
        {first} - {last} of {_.size(messagesOrdered)}
        <IconButton disabled={!hasLess} onClick={() => changePage(-1)}>
          <KeyboardArrowLeft/>
        </IconButton>
        <IconButton disabled={!hasMore} onClick={() => changePage(1)}>
          <KeyboardArrowRight/>
        </IconButton>
      </Box>
      {data}
    </div>
  );
}

export default Outbox;