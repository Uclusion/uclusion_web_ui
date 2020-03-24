
export function nextMessage(state) {
  const { messages } = state;
  if (messages.length === 0) {
    return undefined;
  }
  return messages[0];
}
