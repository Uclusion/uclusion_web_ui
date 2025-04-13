import { viewDiff } from './diffContextReducer';

export function getDiff(state, itemId) {
  const content = state[itemId];
  if (!content) {
    return undefined;
  }
  const { diff } = content;
  return diff;
}

export function markDiffViewed(dispatch, itemId){
  dispatch(viewDiff(itemId));
}

export function getLastSeenContent(state, itemId) {
  const content = state[itemId];
  if (!content) {
    return undefined;
  }
  const { lastSeenContent } = content;
  return lastSeenContent;
}
