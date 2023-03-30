import { titleText } from '../../../utils/messageUtils'
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { getMarketInfo } from '../../../utils/userFunctions'
import { getMarket, getMyUserForMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import {
  getComment,
  getCommentRoot
} from '../../../contexts/CommentsContext/commentsContextHelper'
import { nameFromDescription } from '../../../utils/stringFunctions'
import { calculateTitleExpansionPanel, usesExpansion } from './InboxExpansionPanel'
import WorkListItem from './WorkListItem'
import React, { useContext } from 'react'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { Assignment, PersonAddOutlined } from '@material-ui/icons'
import Quiz from '../../../components/CustomChip/Quiz'
import { useIntl } from 'react-intl'
import { useMediaQuery, useTheme } from '@material-ui/core'
import {
  getFullStage,
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { messageIsSynced } from '../../../contexts/NotificationsContext/notificationsContextHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';

function getPriorityIcon(message, isAssigned) {
  const { level, link_type: linkType, is_highlighted: isHighlighted } = message;
  const Icon = isAssigned ? Assignment :
    (['UNASSIGNED', 'UNREAD_DRAFT', 'UNREAD_GROUP'].includes(message.type) || (message.type === 'UNREAD_REVIEWABLE'
      && linkType === 'MARKET_TODO') ? PersonAddOutlined : Quiz);
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
  const { message, checked, determinateDispatch, inboxDispatch, expansionOpen, isDeletable } = props;
  const intl = useIntl();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [commentState] = useContext(CommentsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketsState] = useContext(MarketsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const { investible_id: investibleId, investible_name: investibleName, updated_at: updatedAt,
    market_name: marketName, type_object_id: typeObjectId, market_id: marketId, comment_id: commentId,
    comment_market_id: commentMarketId, is_highlighted: isHighlighted } = message;
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { assigned, stage } = marketInfo;
  const userId = getMyUserForMarket(marketsState, marketId);
  const isAssigned = (assigned || []).includes(userId);
  const market = getMarket(marketsState, marketId) || {};
  const item = {
    market: market.name || marketName,
    investible: inv ? inv.investible.name : investibleName,
    read: !isHighlighted,
    date: intl.formatDate(updatedAt),
    isDeletable,
    isAssigned,
    message,
    isNotSynced: !messageIsSynced(message, marketsState, marketPresencesState, commentState, investiblesState)
  }

  item.icon = getPriorityIcon(message, isAssigned);

  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
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

  if (rootComment?.resolved && !typeObjectId?.includes('UNREAD_RESOLVED')) {
    console.warn('Notification out of date with a resolved comment')
    console.warn(message);
    return React.Fragment;
  }

  item.title =  titleText(message, mobileLayout, intl, rootComment, userId,
    fullStage.allows_investment, assigned);
  calculateTitleExpansionPanel({ item, inboxDispatch,
    openExpansion: expansionOpen && usesExpansion(item), intl });
  return <WorkListItem key={`inboxRow${typeObjectId}`} id={typeObjectId} checked={checked}
                       determinateDispatch={determinateDispatch} useSelect={isHighlighted}
                       inboxDispatch={inboxDispatch} expansionOpen={expansionOpen} {...item} />;
}

export default React.memo(InboxRow);