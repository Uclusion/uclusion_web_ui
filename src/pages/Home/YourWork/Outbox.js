import WorkListItem from './WorkListItem'
import { Card, CardActions, Fab, Menu, Typography, useMediaQuery, useTheme } from '@material-ui/core'
import React, { useContext, useState } from 'react'
import styled from "styled-components";
import { FormattedMessage, useIntl } from 'react-intl'
import { Link } from '@material-ui/core'
import OutboxIcon from '../../../components/CustomChip/Outbox'
import {
  createTitle,
  formCommentLink,
  formInvestibleLink,
  navigate,
  preventDefaultAndProp
} from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { PLANNING_TYPE } from '../../../constants/markets'
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
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments'
import ChangeSuggstionIcon from '@material-ui/icons/ChangeHistory'
import IssueIcon from '@material-ui/icons/ReportProblem'
import { getInvestibleVoters } from '../../../utils/votingUtils'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'

const SectionTitle = styled("div")`
  width: auto;
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

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

function getMessageForComment(comment, market, labelId, Icon, intl, investibleState, marketStagesState) {
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
  if (comment.investible_id) {
    const investible = getInvestible(investibleState, comment.investible_id);
    const notDoingStage = getNotDoingStage(marketStagesState, market.id);
    const { market_infos } = investible;
    if (market_infos.find((info) => info.stage === notDoingStage.id)) {
      return null;
    }
    const furtherWork = getFurtherWorkStage(marketStagesState, market.id);
    if (market_infos.find((info) => info.stage === furtherWork.id)) {
      message.inActive = true;
    }
    message.investible = investible.investible.name;
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
  const { isJarDisplay = false } = props;
  const classes = useStyles();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const intl = useIntl();
  const history = useHistory();
  const [anchorEl, setAnchorEl] = useState(null);
  const [investibleState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentState] = useContext(CommentsContext);
  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const { messages: messagesUnsafe } = messagesState;
  const inboxMessages = messagesUnsafe || [];
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  const planningDetails = getMarketDetailsForType(myNotHiddenMarketsState, marketPresencesState, PLANNING_TYPE);

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
    return { market, inReviewInvestibles, inVotingInvestibles, questions, issues, suggestions };
  });

  const messages = [];
  workspacesData.forEach((workspacesData) => {
    const { market, inReviewInvestibles, inVotingInvestibles, questions, issues, suggestions } = workspacesData;
    inReviewInvestibles.forEach((investible) => {
      const outboxMessage = getMessageForInvestible(investible, market, 'planningInvestibleNextStageInReviewLabel',
        <RateReviewIcon style={{fontSize: 24, color: '#8f8f8f',}}/>, intl);
      const mySubmitted = inboxMessages.find((message) => {
        const { investible_id: msgInvestibleId, type: messageType } = message;
        return msgInvestibleId === investible.investible.id && messageType === 'INVESTIBLE_SUBMITTED';
      });
      if (mySubmitted) {
        // If message to finish Todos then no one owes you anything but you haven't moved out of in review either
        outboxMessage.inActive = true;
      }
      messages.push(outboxMessage);
    });
    inVotingInvestibles.forEach((investible) => {
      const message = getMessageForInvestible(investible, market, 'planningInvestibleToVotingLabel',
        <ThumbsUpDownIcon style={{fontSize: 24, color: '#8f8f8f',}}/>, intl);
      const { votes_required: votesRequired } = market;
      const marketPresences = getMarketPresences(marketPresencesState, market.id) || [];
      const votersForInvestible = getInvestibleVoters(marketPresences, investible.investible.id);
      const { market_infos: marketInfos } = investible;
      const marketInfo = marketInfos.find(info => info.market_id === market.id);
      const votersNotAssigned = votersForInvestible.filter((voter) => !_.includes(marketInfo.assigned, voter.id)) || [];
      const votesRequiredDisplay = votesRequired > 0 ? votesRequired : 1;
      if (votersNotAssigned.length >= votesRequiredDisplay) {
        message.inActive = true;
      }
      messages.push(message);
    });
    questions.forEach((comment) => {
      const message = getMessageForComment(comment, market, 'cardTypeLabelQuestion',
        <QuestionIcon style={{fontSize: 24, color: '#8f8f8f',}}/>, intl, investibleState, marketStagesState);
      if (message) {
        messages.push(message);
      }
    });
    issues.forEach((comment) => {
      const message = getMessageForComment(comment, market, 'cardTypeLabelIssue',
        <IssueIcon style={{fontSize: 24, color: '#8f8f8f',}}/>, intl, investibleState, marketStagesState);
      if (message) {
        messages.push(message);
      }
    });
    suggestions.forEach((comment) => {
      const message = getMessageForComment(comment, market, 'cardTypeLabelSuggestedChange',
        <ChangeSuggstionIcon style={{fontSize: 24, color: '#8f8f8f',}}/>, intl, investibleState, marketStagesState);
      if (message) {
        messages.push(message);
      }
    });
  })

  //TODO open dialogs and initiatives
  //TODO last activity
  // Stories - last activity is across votes and comments
  // Comments - last activity is across all descendents if regular and across descendents and the market if not
  // Markets - use already written last activity code

  //TODO need person column that is avatar plus initials and when required people or mentions need to create multiple
  // items if more than one

  const filteredForJar = messages.filter((message) => !message.inActive);
  const messagesFilteredForJar = isJarDisplay && !_.isEmpty(filteredForJar) ? filteredForJar : messages;
  const messagesOrdered = _.orderBy(messagesFilteredForJar, ['updatedAt'], ['asc']);

  const rows = messagesOrdered.map((message) => {
    const { id, market, investible, updatedAt, link, title, icon, comment, inActive } = message;
    const titleSize = mobileLayout ? 30 : 100;
    const item = {
      title,
      icon,
      market:createTitle(market, titleSize),
      read: !!inActive,
      isDeletable: false,
      description: '',
      date: intl.formatDate(updatedAt)
    }
    if (investible) {
      item.investible = createTitle(investible, titleSize);
    }
    if (comment) {
      const commentName = nameFromDescription(comment);
      if (commentName) {
        item.comment = createTitle(commentName, titleSize);
      }
    }
    return <Link href={link} style={{ width: '100%' }} onClick={
      (event) => {
        preventDefaultAndProp(event);
        setAnchorEl(null);
        navigate(history, link);
      }
    }><WorkListItem key={id} id={id} isJarDisplay={isJarDisplay} useSelect={false} {...item} /></Link>;
  })

  if (isJarDisplay) {
    const first = _.isEmpty(messagesFilteredForJar) ? undefined : messagesFilteredForJar[0];
    return (
      <>
        <div id='outboxNotification' key='outbox'
             onClick={(event) => setAnchorEl(event.currentTarget)}
             className={classes.bellButton}>
          <Badge badgeContent={filteredForJar.length} className={classes.chip} overlap="circle">
            <Fab id='notifications-fabInbox' className={classes.fab}>
              <OutboxIcon htmlColor='#8f8f8f' />
            </Fab>
          </Badge>
        </div>
        <Menu
          id="profile-menu"
          open={anchorEl !== null}
          onClose={() => setAnchorEl(null)}
          getContentAnchorEl={null}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          anchorEl={anchorEl}
          disableRestoreFocus
          style={{maxWidth: mobileLayout ? undefined : '50%'}}
        >
          {!_.isEmpty(first) && (
            <div style={{minWidth: '50vw'}}>
              { _.slice(rows, 0, 10) }
            </div>
          )}
          <Card>
            <CardActions style={{display: 'flex', justifyContent: 'center'}}>
              <Link href={'/outbox'} onClick={
                (event) => {
                  preventDefaultAndProp(event);
                  navigate(history, '/outbox');
                }
              }><FormattedMessage
                id="seeFullOutbox"
              /> </Link>
            </CardActions>
          </Card>
        </Menu>
      </>
    );
  }

  return (
    <div id="inbox">
      <SectionTitle>
        {<OutboxIcon htmlColor="#333333"/>}
        <Typography style={{marginLeft: '1rem'}} variant="h6">
          {intl.formatMessage({ id: 'outbox' })}
        </Typography>
      </SectionTitle>
      { rows }
    </div>
  );
}

export default Outbox;