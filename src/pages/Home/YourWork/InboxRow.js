import { messageText } from '../../../utils/messageUtils'
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { getMarketInfo } from '../../../utils/userFunctions'
import { getMarket, getMyUserForMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import { getCommentRoot } from '../../../contexts/CommentsContext/commentsContextHelper'
import { nameFromDescription } from '../../../utils/stringFunctions'
import { addExpansionPanel } from './InboxExpansionPanel'
import WorkListItem from './WorkListItem'
import React, { useContext } from 'react'
import { usePlanningInvestibleStyles } from '../../Investible/Planning/PlanningInvestible'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { Assignment, PersonAddOutlined } from '@material-ui/icons'
import Quiz from '../../../components/CustomChip/Quiz'
import { useIntl } from 'react-intl'
import { useMediaQuery, useTheme } from '@material-ui/core'

function getPriorityIcon(message, isAssigned) {
  const { level } = message;
  const Icon = isAssigned ? Assignment :
    (['UNASSIGNED', 'UNREAD_DRAFT'].includes(message.type) ? PersonAddOutlined : Quiz);
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
  const { message, checked, determinateDispatch, expansionDispatch, expansionOpen, isMultiple, hasPersistent,
    numMultiples } = props;
  const intl = useIntl();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [marketState] = useContext(MarketsContext);
  const [commentState] = useContext(CommentsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [diffState] = useContext(DiffContext);
  const [marketsState] = useContext(MarketsContext);
  const planningClasses = usePlanningInvestibleStyles();
  const { investible_id: investibleId, investible_name: investibleName, updated_at: updatedAt,
    market_name: marketName, is_highlighted: isHighlighted, type_object_id: typeObjectId, market_id: marketId,
    comment_id: commentId, comment_market_id: commentMarketId, link_type: linkType } = message;
  const title = isMultiple ?
    intl.formatMessage({ id: 'multipleNotifications' }, { x: numMultiples })
    : messageText(message, mobileLayout, intl);
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { assigned } = marketInfo;
  const userId = getMyUserForMarket(marketsState, marketId);
  const isAssigned = (assigned || []).includes(userId);
  const market = getMarket(marketsState, marketId) || {};
  const item = {
    title,
    icon: getPriorityIcon(message, isAssigned),
    market: market.name || marketName,
    investible: inv ? inv.investible.name : investibleName,
    read: !isHighlighted,
    isDeletable: message.type_object_id.startsWith('UNREAD') && (!isMultiple || !hasPersistent),
    date: intl.formatDate(updatedAt),
    message: message
  }
  if (commentId && linkType !== 'INVESTIBLE') {
    let useMarketId = commentMarketId || marketId;
    const rootComment = getCommentRoot(commentState, useMarketId, commentId);
    if (rootComment) {
      const comment = nameFromDescription(rootComment.body);
      if (comment) {
        item.comment = comment;
      }
    }
  }
  addExpansionPanel({item, commentState, marketState, investiblesState, diffState, planningClasses, marketsState,
    mobileLayout, intl, isMultiple});
  return <WorkListItem key={typeObjectId} id={typeObjectId} checked={checked} determinateDispatch={determinateDispatch}
                       expansionDispatch={expansionDispatch} expansionOpen={expansionOpen}
                       isMultiple={isMultiple} {...item} />;
}

export default React.memo(InboxRow);