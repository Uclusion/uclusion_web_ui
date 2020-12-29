import _ from 'lodash'
import { getMarket } from '../MarketsContext/marketsContextHelper'
import { filterMessagesToLevel } from '../../utils/messageUtils';

export function levelMessages(state, level) {
  const { messages } = state;
  return filterMessagesToLevel(level, messages);
}

export function nextMessage(state, level) {
  const messages = levelMessages(state, level);
  if (_.isEmpty(messages)) {
    return undefined;
  }
  return messages[0];
}

export function filterMessagesByMarket(messagesState, marketsState) {
  const { messages } = messagesState;
  const filteredMessages = (messages || []).filter((message) => {
    const { marketId, pokeType } = message;
    const market = getMarket(marketsState, marketId);
    return !_.isEmpty(market) || !_.isEmpty(pokeType);
  })
  return { messages: filteredMessages };
}
