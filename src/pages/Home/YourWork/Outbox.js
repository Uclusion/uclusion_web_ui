import WorkListItem from './WorkListItem'
import { Fab } from '@material-ui/core'
import React, { useContext } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import {
  formCommentLink,
  formInvestibleLink, formMarketLink,
  navigate,
  preventDefaultAndProp
} from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../../constants/markets'
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
  getMarketDetailsForType, getMyUserForMarket,
  getNotHiddenMarketDetailsForUser
} from '../../../contexts/MarketsContext/marketsContextHelper'
import { getUserInvestibles } from '../../Dialog/Planning/userUtils'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import {
  ISSUE_TYPE,
  JUSTIFY_TYPE,
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
import VotingIcon from '@material-ui/icons/Assessment'
import GavelIcon from '@material-ui/icons/Gavel'
import { AlarmOn, Weekend } from '@material-ui/icons'
import Comment from '../../../components/Comments/Comment'
import Voting from '../../Investible/Decision/Voting'
import { getPageReducerPage, usePageStateReducer } from '../../../components/PageState/pageStateHooks'
import RaisedCard from '../../../components/Cards/RaisedCard'

function getMessageForInvestible(investible, market, labelId, Icon, intl) {
  const investibleId = investible.investible.id;
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

function getMessageForComment(comment, market, labelId, Icon, intl, investibleState, marketStagesState,
  comments, marketPresences) {
  const commentId = comment.id;
  const message = {
    id: commentId,
    market: market.name,
    icon: Icon,
    comment: comment.body,
    title: intl.formatMessage({ id: labelId }),
    updatedAt: comment.updated_at,
    link: formCommentLink(market.id, comment.investible_id, commentId),
    inFurtherWork: false
  };
  message.expansionPanel = <Comment
    depth={0}
    marketId={market.id}
    comment={comment}
    comments={comments}
    defaultShowDiff
    allowedTypes={[]}
  />;
  if (comment.investible_id) {
    const investible = getInvestible(investibleState, comment.investible_id);
    const notDoingStage = getNotDoingStage(marketStagesState, market.id) || {};
    const marketInfo = getMarketInfo(investible, market.id) || {};
    if (marketInfo.stage === notDoingStage.id) {
      return null;
    }
    const furtherWork = getFurtherWorkStage(marketStagesState, market.id) || {};
    if (marketInfo.stage === furtherWork.id) {
      message.inActive = true;
    }
    message.investible = investible.investible.name;
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

function processMessageForDialogOrInitiative(message, market, marketPresencesState) {
  const debtors = [];
  const marketPresences = getMarketPresences(marketPresencesState, market.id) || [];
  marketPresences.forEach((presence) => {
    const { following, market_banned: banned, investments, current_user: isCurrentUser } = presence;
    if (following && !banned && !isCurrentUser) {
      const investment = (investments || []).find((investment) => !investment.deleted);
      if (!investment) {
        debtors.push(presence);
      }
    }
  });
  if (_.isEmpty(debtors)) {
    message.inActive = true;
  } else {
    message.debtors = debtors;
  }
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
  const { isJarDisplay = false, isDisabled = false } = props;
  const classes = useStyles();
  const intl = useIntl();
  const history = useHistory();
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
  const initiativeDetails = getMarketDetailsForType(myNotHiddenMarketsState, marketPresencesState, INITIATIVE_TYPE);
  const dialogDetails = getMarketDetailsForType(myNotHiddenMarketsState, marketPresencesState, DECISION_TYPE);
  const [votingPageStateFull, votingPageDispatch] = usePageStateReducer('voting');
  const [workListItemFull, workListItemDispatch] = usePageStateReducer('outboxListItem');

  const workspacesData = planningDetails.map((market) => {
    const marketPresences = getMarketPresences(marketPresencesState, market.id) || [];
    const myPresence = marketPresences.find((presence) => presence.current_user) || {};
    const investibles = getMarketInvestibles(investibleState, market.id);
    // Not filtering by whether in Inbox or not because users should deal with Inbox before worry about Outbox
    const inReviewStage = getInReviewStage(marketStagesState, market.id) || {};
    const inReviewInvestibles = getUserInvestibles(myPresence.id, market.id, investibles,
      [inReviewStage.id]) || [];
    const inVotingStage = getInCurrentVotingStage(marketStagesState, market.id) || {};
    const inVotingInvestibles = getUserInvestibles(myPresence.id, market.id, investibles,
      [inVotingStage.id]) || [];
    const comments = getMarketComments(commentState, market.id);
    const myUnresolvedRoots = comments.filter((comment) => !comment.resolved &&
      comment.created_by === myPresence.id && !comment.reply_id);
    const questions = myUnresolvedRoots.filter((comment) => comment.comment_type === QUESTION_TYPE) || [];
    const issues = myUnresolvedRoots.filter((comment) => comment.comment_type === ISSUE_TYPE) || [];
    const suggestions = myUnresolvedRoots.filter((comment) => comment.comment_type === SUGGEST_CHANGE_TYPE) || [];
    const reports = myUnresolvedRoots.filter((comment) => comment.comment_type === REPORT_TYPE) || [];
    const reasons = myUnresolvedRoots.filter((comment) => comment.comment_type === JUSTIFY_TYPE) || [];
    return { market, comments, inReviewInvestibles, inVotingInvestibles, questions, issues, suggestions, reports,
    reasons, inVotingStage, myPresence};
  });

  const messages = [];
  initiativeDetails.forEach((market) => {
    if (market.created_by === getMyUserForMarket(marketsState, market.id)) {
      const investibles = getMarketInvestibles(investibleState, market.id) || [];
      if (investibles.length > 0) {
        const investible = investibles[0];
        const message = getMessageForInvestible(investible, market, 'MarketSearchResultInitiative',
          <VotingIcon style={{ fontSize: 24, color: '#8f8f8f', }}/>, intl);
        processMessageForDialogOrInitiative(message, market, marketPresencesState);
        messages.push(message);
      }
    }
  });

  dialogDetails.forEach((market) => {
    if (market.created_by === getMyUserForMarket(marketsState, market.id)) {
      const message = {
        id: market.id,
        market: market.name,
        icon: <GavelIcon style={{ fontSize: 24, color: '#8f8f8f', }}/>,
        title: intl.formatMessage({ id: 'MarketSearchResultDialog' }),
        updatedAt: market.updated_at,
        link: formMarketLink(market.id)
      };
      processMessageForDialogOrInitiative(message, market, marketPresencesState);
      messages.push(message);
    }
  });

  workspacesData.forEach((workspacesData) => {
    const { market, comments, inReviewInvestibles, inVotingInvestibles, questions, issues, suggestions, reports,
    reasons, inVotingStage, myPresence } = workspacesData;
    const marketPresences = getMarketPresences(marketPresencesState, market.id) || [];
    inReviewInvestibles.forEach((investible) => {
      const investibleId = investible.investible.id;
      const outboxMessage = getMessageForInvestible(investible, market, 'planningInvestibleNextStageInReviewLabel',
        <RateReviewIcon style={{fontSize: 24, color: '#8f8f8f',}}/>, intl);
      const report = reports.find((comment) => comment.investible_id === investibleId && comment.creator_assigned);
      if (report) {
        outboxMessage.expansionPanel = <Comment
          depth={0}
          marketId={market.id}
          comment={report}
          comments={comments}
          defaultShowDiff
          allowedTypes={[]}
        />;
      }
      const mySubmitted = inboxMessages.find((message) => {
        const { investible_id: msgInvestibleId, type: messageType } = message;
        return msgInvestibleId === investibleId && messageType === 'INVESTIBLE_SUBMITTED';
      });
      if (mySubmitted) {
        // If message to finish Todos then no one owes you anything but you haven't moved out of in review either
        outboxMessage.inActive = true;
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
      const investibleId = investible.investible.id;
      const [votingPageState, updateVotingPageState, votingPageStateReset] =
        getPageReducerPage(votingPageStateFull, votingPageDispatch, investibleId);
      const message = getMessageForInvestible(investible, market, 'planningInvestibleToVotingLabel',
        <ThumbsUpDownIcon style={{fontSize: 24, color: '#8f8f8f',}}/>, intl);
      const { votes_required: votesRequired } = market;
      const votersForInvestible = getInvestibleVoters(marketPresences, investibleId);
      const marketInfo = getMarketInfo(investible, market.id);
      const votersNotAssigned = votersForInvestible.filter((voter) => !_.includes(marketInfo.assigned, voter.id)) || [];
      const votesRequiredDisplay = votesRequired > 0 ? votesRequired : 1;
      if (votersNotAssigned.length >= votesRequiredDisplay) {
        message.inActive = true;
      }
      message.expansionPanel = <RaisedCard elevation={3}>
        <div style={{paddingLeft: '1.25rem', paddingBottom: '1.25rem'}}>
          <h2 id="approvals" style={{paddingTop: 0}}>
            <FormattedMessage id="decisionInvestibleOthersVoting" />
          </h2>
          <Voting
            investibleId={investibleId}
            marketPresences={marketPresences}
            investmentReasons={reasons}
            showExpiration={inVotingStage.has_expiration}
            expirationMinutes={market.investment_expiration * 1440}
            votingPageState={votingPageState}
            updateVotingPageState={updateVotingPageState}
            votingPageStateReset={votingPageStateReset}
            votingAllowed={market.assigned_can_approve}
            yourPresence={myPresence}
            market={market}
            isAssigned
          />
        </div>
      </RaisedCard>
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
        <QuestionIcon style={{fontSize: 24, color: '#8f8f8f',}}/>, intl, investibleState, marketStagesState,
        comments, marketPresences);
      if (message) {
        messages.push(message);
      }
    });
    issues.forEach((comment) => {
      const message = getMessageForComment(comment, market, 'cardTypeLabelIssue',
        <IssueIcon style={{fontSize: 24, color: '#8f8f8f',}}/>, intl, investibleState, marketStagesState,
        comments, marketPresences);
      if (message) {
        messages.push(message);
      }
    });
    suggestions.forEach((comment) => {
      const message = getMessageForComment(comment, market, 'cardTypeLabelSuggestedChange',
        <ChangeSuggstionIcon style={{fontSize: 24, color: '#8f8f8f',}}/>, intl, investibleState, marketStagesState,
        comments, marketPresences);
      if (message) {
        messages.push(message);
      }
    });
  })

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
    return <WorkListItem key={`outboxRow${id}`} id={id} useSelect={false}
                         workListItemFull={workListItemFull} workListItemDispatch={workListItemDispatch} {...item} />;
  });

  if (_.isEmpty(rows)) {
    const item = {
      title: intl.formatMessage({ id: 'enjoy' }),
      market: intl.formatMessage({ id: 'noPending' }),
      icon: <Weekend style={{fontSize: 24, color: '#2D9CDB',}}/>,
      read: false,
      isDeletable: false,
      message: {link: '/inbox'}
    };
    rows = [<WorkListItem key='emptyOutbox' id='emptyOutbox' workListItemFull={workListItemFull}
                          workListItemDispatch={workListItemDispatch} useSelect={false} {...item} />];
  }

  return (
    <div id="inbox">
      { rows }
    </div>
  );
}

export default Outbox;