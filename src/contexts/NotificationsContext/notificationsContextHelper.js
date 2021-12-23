import _ from 'lodash'

export function getInboxCount(messagesState) {
  let calcPend = 0;
  if (!_.isEmpty(messagesState)) {
    const { messages } = messagesState;
    const dupeHash = {};
    if (!_.isEmpty(messages)) {
      messages.forEach((message) => {
        const { link_multiple: linkMultiple, is_highlighted: isHighlighted, type: aType } = message;
        if (isHighlighted && aType !== 'UNREAD_REPORT') {
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
