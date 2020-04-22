import _ from 'lodash';

export function nextMessage(state) {
  const { messages } = state;
  if (_.isEmpty(messages)) {
    return undefined;
  }
  return messages[0];
}
