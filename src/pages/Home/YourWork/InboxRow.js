import { titleText } from '../../../utils/messageUtils'
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { getMarketInfo } from '../../../utils/userFunctions'
import { getMarket, getMyUserForMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import {
  getComment,
  getCommentRoot
} from '../../../contexts/CommentsContext/commentsContextHelper'
import { nameFromDescription } from '../../../utils/stringFunctions'
import { addExpansionPanel, usesExpansion } from './InboxExpansionPanel'
import WorkListItem from './WorkListItem'
import React, { useContext } from 'react'
import { usePlanningInvestibleStyles } from '../../Investible/Planning/PlanningInvestible'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { Assignment, PersonAddOutlined } from '@material-ui/icons'
import Quiz from '../../../components/CustomChip/Quiz'
import { useIntl } from 'react-intl'
import { useMediaQuery, useTheme } from '@material-ui/core'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import _ from 'lodash'
import { DaysEstimate } from '../../../components/AgilePlan'
import {
  getFullStage,
  isAcceptedStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'

function getPriorityIcon(message, isAssigned) {
  const { level, link_type: linkType } = message;
  const Icon = isAssigned ? Assignment :
    (['UNASSIGNED', 'UNREAD_DRAFT'].includes(message.type) || (message.type === 'UNREAD_REVIEWABLE'
      && linkType === 'MARKET_TODO') ? PersonAddOutlined : Quiz);
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
  const { message, checked, determinateDispatch, inboxDispatch, expansionOpen, isMultiple, isDeletable,
    numMultiples, showPriority, showSelector = true } = props;
  const intl = useIntl();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [commentState] = useContext(CommentsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketsState] = useContext(MarketsContext);
  const [messagesState] = useContext(NotificationsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const planningClasses = usePlanningInvestibleStyles();
  const { investible_id: investibleId, investible_name: investibleName, updated_at: updatedAt,
    market_name: marketName, type_object_id: typeObjectId, market_id: marketId, comment_id: commentId,
    comment_market_id: commentMarketId, link_multiple: linkMultiple } = message;
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { assigned, completion_estimate: completionEstimate, stage } = marketInfo;
  const userId = getMyUserForMarket(marketsState, marketId);
  const isAssigned = (assigned || []).includes(userId);
  const market = getMarket(marketsState, marketId) || {};
  const { messages: messagesUnsafe } = messagesState;
  const messagesFull = (messagesUnsafe || []).filter((message) => message.link_multiple === linkMultiple);
  const redMessage = messagesFull.find((message) => message.level === 'RED');
  const yellowMessage = messagesFull.find((message) => message.level === 'YELLOW');
  const highlightedMessage = messagesFull.find((message) => message.is_highlighted);
  const item = {
    market: market.name || marketName,
    investible: inv ? inv.investible.name : investibleName,
    read: _.isEmpty(highlightedMessage),
    date: intl.formatDate(updatedAt),
    isDeletable,
    message
  }

  if (showPriority) {
    item.icon = getPriorityIcon(redMessage || yellowMessage || message, isAssigned);
  }

  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
  const isInAcceptedStage = isAcceptedStage(fullStage);
  let rootComment;
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
      const comment = nameFromDescription(rootComment.body);
      if (comment) {
        item.comment = comment;
        if (rootComment.id !== commentId && !investibleId) {
          const originalComment = getComment(commentState, commentMarketId || marketId, commentId) || {};
          item.moreDescription = nameFromDescription(originalComment.body);
        }
      }
    }
  }

  if (isInAcceptedStage) {
    if (completionEstimate) {
      item.moreDescription = <DaysEstimate readOnly value={completionEstimate} justText/>;
    }
  }
  item.title =  titleText(message, mobileLayout, intl, isMultiple, numMultiples, rootComment, userId,
    fullStage.allows_investment, assigned);
  if (expansionOpen && usesExpansion(item, isMultiple)) {
    addExpansionPanel({ item, planningClasses, mobileLayout, isMultiple, messagesState, isDeletable });
  }
  return <WorkListItem key={`inboxRow${typeObjectId}`} id={typeObjectId} checked={checked} useSelect={showSelector}
                       determinateDispatch={determinateDispatch}
                       inboxDispatch={inboxDispatch} expansionOpen={expansionOpen}
                       isMultiple={isMultiple} {...item} />;
}

export default React.memo(InboxRow);