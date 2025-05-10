import { titleText } from '../../../utils/messageUtils';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { getComment, getCommentRoot } from '../../../contexts/CommentsContext/commentsContextHelper';
import { stripHTML } from '../../../utils/stringFunctions';
import { calculateTitleExpansionPanel } from './InboxExpansionPanel';
import WorkListItem from './WorkListItem';
import React, { useContext } from 'react';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import {
  Assignment,
  Block,
  CalendarToday,
  Done,
  PersonAddOutlined,
  ReportOutlined,
  Schedule
} from '@material-ui/icons';
import Quiz from '../../../components/CustomChip/Quiz';
import { useIntl } from 'react-intl';
import { useMediaQuery, useTheme } from '@material-ui/core';
import { getFullStage, } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { getMessageId, messageIsSynced } from '../../../contexts/NotificationsContext/notificationsContextHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown';
import QuestionIcon from '@material-ui/icons/ContactSupport';
import RateReviewIcon from '@material-ui/icons/RateReview';
import LightbulbOutlined from '../../../components/CustomChip/LightbulbOutlined';
import { DECISION_TYPE, INITIATIVE_TYPE } from '../../../constants/markets';
import ReplyIcon from '@material-ui/icons/Reply';
import ListAltIcon from '@material-ui/icons/ListAlt';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { NOT_FULLY_VOTED_TYPE, POKED, UNREAD_JOB_APPROVAL_REQUEST } from '../../../constants/notifications';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import _ from 'lodash';
import Approval from '../../../components/CustomChip/Approval';
import EditNote from '../../../components/CustomChip/EditNote';

function getPriorityIcon(message, isAssigned, isMentioned) {
  const { level, link_type: linkType, is_highlighted: isHighlighted, decision_investible_id: decisionInvestibleId,
    market_type: marketType, alert_type: alertType, poked_list: pokedList } = message;
  let Icon = Quiz;
  if (!_.isEmpty(message.edit_list)) {
    Icon = EditNote;
  }
  if (message.type === 'UNREAD_VOTE') {
    Icon = Done;
  }
  if (isAssigned) {
    Icon = Assignment;
  }
  if (message.type?.includes('REVIEW') && !isAssigned) {
    Icon = RateReviewIcon;
  }
  if (['UNREAD_MOVE_REPORT', 'REPORT_REQUIRED'].includes(message.type)) {
    Icon = Schedule;
  }
  if (['UNASSIGNED', 'UNREAD_GROUP'].includes(message.type) || (message.type === 'UNREAD_REVIEWABLE'
      && 'MARKET_TODO' === linkType)) {
    Icon = PersonAddOutlined;
  }
  if (message.type === 'INVESTIBLE_SUBMITTED') {
    Icon = ThumbsUpDownIcon;
  }
  if ([NOT_FULLY_VOTED_TYPE, UNREAD_JOB_APPROVAL_REQUEST].includes(message.type)) {
    if (marketType === INITIATIVE_TYPE) {
      Icon = LightbulbOutlined;
    } else if (marketType === DECISION_TYPE || decisionInvestibleId) {
      Icon = QuestionIcon;
    } else {
      Icon = Approval;
    }
  }
  if (['ISSUE', 'UNREAD_COMMENT'].includes(message.type)) {
    if (linkType.includes('QUESTION')) {
      Icon = QuestionIcon;
    } else if (linkType.includes('SUGGEST')) {
      Icon = LightbulbOutlined;
    } else if ('INVESTIBLE_REVIEW' === linkType) {
      Icon = ListAltIcon;
    } else {
      Icon = Block;
    }
  }
  if (message.type === 'UNREAD_REPLY') {
    Icon = ReplyIcon;
  }

  if (message.type === 'REPLY_MENTION') {
    Icon = ReportOutlined;
  }

  if (message.type === 'UNREAD_ESTIMATE') {
    Icon = CalendarToday;
  }

  if (alertType === POKED || !_.isEmpty(pokedList) || isMentioned) {
    Icon = ReportOutlined;
  }

  if (!isHighlighted) {
    return <Icon style={{fontSize: 24, color: '#706f6f'}}/>;
  }
  switch (level) {
    case 'RED':
      return <Icon style={{fontSize: 24, color: '#E85757'}}/>;
    case 'YELLOW':
      return <Icon style={{fontSize: 24, color: '#ffc61a'}}/>;
    case 'BLUE':
      return <Icon style={{fontSize: 24, color: '#2D9CDB'}}/>;
    default:
      return undefined;
  }
}

function InboxRow(props) {
  const { message, checked, determinateDispatch, expansionOpen, isDeletable } = props;
  const intl = useIntl();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [commentState] = useContext(CommentsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketsState] = useContext(MarketsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [groupState] = useContext(MarketGroupsContext);
  const { investible_id: investibleId, investible_name: investibleName, updated_at: updatedAt,
    market_name: marketName, type_object_id: typeObjectId, market_id: marketId, comment_id: commentId,
    comment_market_id: commentMarketId, is_highlighted: isHighlighted, type: messageType } = message;
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { assigned, stage } = marketInfo;
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const myPresence = marketPresences.find((presence) => presence.current_user);
  const userId = myPresence?.id;
  const isAssigned = (assigned || []).includes(userId);
  const market = getMarket(marketsState, marketId) || {};
  const item = {
    market: market.name || marketName,
    investible: messageType === 'UNREAD_REPLY' ? undefined : (inv ? inv.investible.name : investibleName),
    read: !isHighlighted,
    date: intl.formatDate(updatedAt),
    isDeletable,
    isAssigned,
    message,
    isNotSynced: !messageIsSynced(message, marketsState, marketPresencesState, commentState, investiblesState,
      groupState)
  }

  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
  let rootComment;
  let originalComment;
  if (commentId) {
    const { parent_comment_id: inlineParentCommentId, parent_comment_market_id: parentMarketId } = market
    let useMarketId = commentMarketId || marketId;
    let useCommentId = commentId;
    if (inlineParentCommentId) {
      // If there is a top level question always display it instead of lower level comments
      useMarketId = parentMarketId;
      useCommentId = inlineParentCommentId;
    }
    rootComment = getCommentRoot(commentState, useMarketId, useCommentId);
    if (rootComment) {
      if (rootComment.id !== commentId) {
        originalComment = getComment(commentState, commentMarketId || marketId, commentId) || {};
        const comment = stripHTML(originalComment.body);
        if (comment) {
          item.comment = comment;
        }
      } else {
        originalComment = rootComment;
      }
      if (!item.comment) {
        const comment = stripHTML(rootComment.body);
        if (comment) {
          item.comment = comment;
        }
      }
    }
  }
  const isMentioned = originalComment?.mentions?.find((mention) => mention.user_id === userId);
  item.icon = getPriorityIcon(message, isAssigned, isMentioned);

  if (rootComment?.resolved && !typeObjectId?.includes('UNREAD_RESOLVED') && !typeObjectId?.includes('UNREAD_REPLY')) {
    console.warn('Notification out of date with a resolved comment')
    console.warn(message);
    return React.Fragment;
  }

  item.title =  titleText(message, mobileLayout, intl, rootComment, userId,
    fullStage.allows_investment, assigned);
  if (messageType === 'USER_POKED') {
    item.market = intl.formatMessage({id: 'pleaseUpgrade'});
  }
  calculateTitleExpansionPanel({ item, openExpansion: expansionOpen, intl });
  return <WorkListItem key={`inboxRow${getMessageId(message)}`} id={getMessageId(message)} checked={checked}
                       determinateDispatch={determinateDispatch} useSelect={isDeletable}
                       expansionOpen={expansionOpen} {...item} />;
}

export default React.memo(InboxRow);