import _ from 'lodash'
import { getMarket } from '../MarketsContext/marketsContextHelper'
import { splitIntoLevels } from '../../utils/messageUtils'

export function nextMessage(state) {
  const { messages } = state;
  const { redMessages, yellowMessages } = splitIntoLevels(messages);
  if (_.isEmpty(messages)) {
    return undefined;
  }
  if (!_.isEmpty(redMessages)) {
    return redMessages[0];
  }
  if (!_.isEmpty(yellowMessages)) {
    return yellowMessages[0];
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
