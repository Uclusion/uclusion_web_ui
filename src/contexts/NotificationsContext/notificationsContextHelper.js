import _ from 'lodash'
import { DECISION_TYPE } from '../../constants/markets'
import { getMarket } from '../MarketsContext/marketsContextHelper'
import { getMarketPresences } from '../MarketPresencesContext/marketPresencesHelper'
import { getInvestible } from '../InvestibesContext/investiblesContextHelper'
import { getMarketInfo } from '../../utils/userFunctions'
import { getComment } from '../CommentsContext/commentsContextHelper'

function checkComment(commentId, commentVersion, marketId, commentsState) {
  if (!commentVersion) {
    return true;
  }
  const comment = getComment(commentsState, marketId, commentId);
  if (!comment) {
    return false;
  }
  return comment.version >= commentVersion;
}

function messageIsSynced(message, marketState, marketPresencesState, commentsState, investiblesState) {
  const { market_id: marketId, market_version: marketVersion, investible_id: investibleId,
    investible_version: investibleVersion, comment_id: commentId, comment_version: commentVersion,
    parent_comment_id: parentCommentId, parent_comment_version: parentCommentVersion,
    investment_user_id: investmentUserId, comment_market_id: commentMarketId, market_investible_id: marketInvestibleId,
    market_investible_version: marketInvestibleVersion } = message;
  const useMarketId = commentMarketId || marketId;
  if (!checkComment(commentId, commentVersion, useMarketId, commentsState)) {
    return false;
  }
  if (!checkComment(parentCommentId, parentCommentVersion, useMarketId, commentsState)) {
    return false;
  }
  if (marketVersion) {
    const market = getMarket(marketState, marketId) || {};
    if (market.version < marketVersion) {
      return false;
    }
  }
  if (investibleVersion) {
    const inv = getInvestible(investiblesState, investibleId) || {};
    const { investible } = inv;
    if (!investible || investible.version < investibleVersion) {
      return false;
    }
  }
  if (marketInvestibleId) {
    const inv = getInvestible(investiblesState, investibleId) || {};
    const marketInfo = getMarketInfo(inv, marketId);
    if (!marketInfo || marketInfo.version < marketInvestibleVersion) {
      return false;
    }
  }
  if (investmentUserId) {
    const presences = getMarketPresences(marketPresencesState, marketId) || [];
    const investmentPresence = presences.find((presence) => presence.id === investmentUserId) || {};
    const { investments } = investmentPresence;
    if (_.isEmpty(investments)) {
      return false;
    }
  }
  return true;
}

export function isInInbox(message, marketState, marketPresencesState, commentsState, investiblesState, messages) {
  if (!messageIsSynced(message, marketState, marketPresencesState, commentsState, investiblesState)) {
    console.warn('Skipping message because not synced');
    console.warn(message);
    return false;
  }
  if (!message.type || message.type === 'UNREAD_REPORT' || message.deleted) {
    return false;
  }
  if (message.type === 'NOT_FULLY_VOTED' && message.market_type === DECISION_TYPE) {
    // Display the need to vote in pending or else too confusing and disappears too quickly after vote
    // Also its your question so if you don't want to vote no pressure
    const market = getMarket(marketState, message.market_id) || {};
    const anInlineMarketPresences = getMarketPresences(marketPresencesState, message.market_id) || [];
    const yourPresence = anInlineMarketPresences.find((presence) => presence.current_user) || {};
    return market.created_by !== yourPresence.id;
  }
  if (message.type === 'UNREAD_VOTE') {
    const fullyVotedMessage = (messages || []).find((aMessage) => aMessage.type === 'FULLY_VOTED'
      && message.link_multiple === aMessage.link_multiple);
    return _.isEmpty(fullyVotedMessage);
  }
  return true;
}

export function getInboxTarget(messagesState) {
  if (!_.isEmpty(messagesState)) {
    const { current } = messagesState;
    if (!_.isEmpty(current)) {
      const { type_object_id: typeObjectId } = current;
      return `/inbox#workListItem${typeObjectId}`;
    }
  }
  return '/inbox';
}

export function getInboxCount(messagesState, marketState, marketPresencesState, commentsState, investiblesState) {
  let calcPend = 0;
  if (!_.isEmpty(messagesState)) {
    const { messages } = messagesState;
    const dupeHash = {};
    if (!_.isEmpty(messages)) {
      messages.forEach((message) => {
        const { link_multiple: linkMultiple, is_highlighted: isHighlighted } = message;
        if (isHighlighted && isInInbox(message, marketState, marketPresencesState, commentsState, investiblesState,
          messages)) {
          if (!linkMultiple) {
            calcPend += 1;
          } else {
            if (!dupeHash[linkMultiple]) {
              dupeHash[linkMultiple] = true;
              calcPend += 1;
            }
          }
        }
      });
    }
  }
  return calcPend;
}
