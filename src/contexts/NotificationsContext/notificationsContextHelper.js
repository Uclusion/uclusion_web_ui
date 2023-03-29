import _ from 'lodash'
import { getMarket } from '../MarketsContext/marketsContextHelper'
import { getMarketPresences } from '../MarketPresencesContext/marketPresencesHelper'
import { getInvestible } from '../InvestibesContext/investiblesContextHelper'
import { getMarketInfo } from '../../utils/userFunctions'
import { getComment, getCommentRoot } from '../CommentsContext/commentsContextHelper';

function checkComment(commentId, commentVersion, marketId, commentsState) {
  if (!commentVersion) {
    return true;
  }
  const commentRoot = getCommentRoot(commentsState, marketId, commentId);
  if (!commentRoot) {
    console.warn(`Comment root missing for ${commentId} and ${marketId}`);
    return false;
  }
  const comment = getComment(commentsState, marketId, commentId);
  if (comment.version < commentVersion) {
    console.warn(`Comment version mismatch ${comment.version} and ${commentVersion}`);
  }
  // Can't enforce strict equality cause some other operation can occur on the question than resolved
  return comment.version >= commentVersion;
}

export function messageIsSynced(message, marketState, marketPresencesState, commentsState, investiblesState) {
  const { market_id: marketId, market_version: marketVersion, investible_id: investibleId,
    investible_version: investibleVersion, comment_id: commentId, comment_version: commentVersion,
    parent_comment_id: parentCommentId, parent_comment_version: parentCommentVersion,
    investment_user_id: investmentUserId, comment_market_id: commentMarketId, market_investible_id: marketInvestibleId,
    market_investible_version: marketInvestibleVersion } = message;
  const useMarketId = commentMarketId || marketId;
  let checked = commentVersion || parentCommentVersion;
  if (!checkComment(commentId, commentVersion, useMarketId, commentsState)) {
    return false;
  }
  if (!checkComment(parentCommentId, parentCommentVersion, useMarketId, commentsState)) {
    return false;
  }
  if (marketVersion) {
    checked = true;
    const market = getMarket(marketState, marketId) || {};
    if (market.version < marketVersion) {
      console.warn(`Market version mismatch for ${marketVersion} and ${marketId}`);
      return false;
    }
  }
  if (investibleVersion) {
    checked = true;
    const inv = getInvestible(investiblesState, investibleId) || {};
    const { investible } = inv;
    if (!investible || investible.version < investibleVersion) {
      console.warn(`Investible version mismatch for ${investibleVersion} and ${investibleId}`);
      return false;
    }
  }
  if (marketInvestibleId) {
    checked = true;
    const inv = getInvestible(investiblesState, marketInvestibleId) || {};
    const marketInfo = getMarketInfo(inv, marketId);
    if (!marketInfo || marketInfo.version < marketInvestibleVersion) {
      if (marketInfo) {
        console.warn(`Info ${marketInfo.version} less ${marketInvestibleVersion} for ${marketInvestibleId}`);
      } else {
        console.warn(`Missing market info for ${marketInvestibleId} in ${marketId}`);
      }
      return false;
    }
  }
  if (investmentUserId) {
    checked = true;
    const presences = getMarketPresences(marketPresencesState, marketId) || [];
    const investmentPresence = presences.find((presence) => presence.id === investmentUserId) || {};
    const { investments } = investmentPresence;
    if (_.isEmpty(investments)) {
      console.warn(`Empty investments for ${investmentUserId} and ${marketId}`);
      return false;
    }
  }
  if (!checked) {
    console.warn('Message is not checked for sync');
    console.warn(message);
  }
  return true;
}

export function isInInbox(message) {
  return !(!message.type || message.type === 'UNREAD_REPORT' || message.deleted);
}

export function getInboxTarget() {
  return '/inbox';
}

export function getInboxCount(messagesState, marketState, marketPresencesState, commentsState, investiblesState) {
  let calcPend = 0;
  if (!_.isEmpty(messagesState)) {
    const { messages } = messagesState;
    if (!_.isEmpty(messages)) {
      messages.forEach((message) => {
        const { is_highlighted: isHighlighted } = message;
        if (isHighlighted && isInInbox(message)) {
          calcPend += 1;
        }
      });
    }
  }
  return calcPend;
}
