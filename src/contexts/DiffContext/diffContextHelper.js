import { viewContent, viewDiff } from './diffContextReducer';

export function hasUnViewedDiff(state, itemId) {
  const content = state[itemId];
  if (!content) {
    return false;
  }
  const { diffViewed, diff } = content;
  return !diffViewed && diff;
}

export function getDiff(state, itemId) {
  const content = state[itemId];
  if (!content) {
    return undefined;
  }
  const { diff } = content;
  return diff;
}

export function hasDiff(state, itemId) {
  return !!getDiff(state, itemId);
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

export function markContentViewed(dispatch, itemId, content){
  dispatch(viewContent(itemId, content));
}
