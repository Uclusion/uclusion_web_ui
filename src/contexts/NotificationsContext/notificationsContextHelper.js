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
    const { marketId, level } = message;
    const market = getMarket(marketsState, marketId);
    // Eventually filtering blue or not is market personal preference
    return !_.isEmpty(market) && level !== 'BLUE';
  })
  return { messages: filteredMessages };
}
