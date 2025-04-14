
export function getDiff(state, itemId) {
  const content = state[itemId];
  if (!content) {
    return undefined;
  }
  const { diff } = content;
  return diff;
}

export function getLastSeenContent(state, itemId) {
  const content = state[itemId];
  if (!content) {
    return undefined;
  }
  const { lastSeenContent } = content;
  return lastSeenContent;
}
