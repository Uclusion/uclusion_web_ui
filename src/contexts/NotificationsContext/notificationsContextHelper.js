import _ from 'lodash'
import { DECISION_TYPE } from '../../constants/markets'
import { getMarket } from '../MarketsContext/marketsContextHelper'
import { getMarketPresences } from '../MarketPresencesContext/marketPresencesHelper'

export function isInInbox(message, marketState, marketPresencesState, messages) {
  if (!message.type || ['UNREAD_REPORT', 'REPORT_REQUIRED'].includes(message.type) || message.deleted) {
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

export function getInboxCount(messagesState, marketState, marketPresencesState) {
  let calcPend = 0;
  if (!_.isEmpty(messagesState)) {
    const { messages } = messagesState;
    const dupeHash = {};
    if (!_.isEmpty(messages)) {
      messages.forEach((message) => {
        const { link_multiple: linkMultiple, is_highlighted: isHighlighted } = message;
        if (isHighlighted && isInInbox(message, marketState, marketPresencesState, messages)) {
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
