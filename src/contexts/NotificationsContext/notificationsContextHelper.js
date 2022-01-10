import _ from 'lodash'
import { DECISION_TYPE } from '../../constants/markets'
import { getMarket } from '../MarketsContext/marketsContextHelper'
import { getMarketPresences } from '../MarketPresencesContext/marketPresencesHelper'

export function isInInbox(message, marketState, marketPresencesState) {
  if (message.type === 'UNREAD_REPORT') {
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
  return true;
}

export function getInboxCount(messagesState, marketState, marketPresencesState) {
  let calcPend = 0;
  if (!_.isEmpty(messagesState)) {
    const { messages } = messagesState;
    const dupeHash = {};
    if (!_.isEmpty(messages)) {
      messages.forEach((message) => {
        const { link_multiple: linkMultiple, is_highlighted: isHighlighted, type: aType } = message;
        if (isHighlighted && isInInbox(message, marketState, marketPresencesState)) {
          if (!linkMultiple) {
            calcPend += 1;
          } else {
            const myHash = `${aType}_${linkMultiple}`;
            if (!dupeHash[myHash]) {
              dupeHash[myHash] = true;
              calcPend += 1;
            }
          }
        }
      });
    }
  }
  return calcPend;
}
