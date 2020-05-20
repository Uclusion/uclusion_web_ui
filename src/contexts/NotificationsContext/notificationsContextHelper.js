import _ from 'lodash'
import { getMarket } from '../MarketsContext/marketsContextHelper'

export function nextMessage(state) {
  const { messages } = state;
  if (_.isEmpty(messages)) {
    return undefined;
  }
  return messages[0];
}

export function filterMessagesByMarket(messagesState, marketsState) {
  const { messages } = messagesState;
  const filteredMessages = messages.filter((message) => {
    const { marketId } = message;
    const market = getMarket(marketsState, marketId);
    return !_.isEmpty(market);
  })
  return { messages: filteredMessages };
}
