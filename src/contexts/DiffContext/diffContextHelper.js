import { viewContent, viewDiff } from './diffContextReducer';
import _ from 'lodash';

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
  const diff = getDiff(state, itemId);
  if (_.isEmpty(diff)) {
    return false;
  }
  const { updatedByYou } = diff;
  if (_.isEmpty(updatedByYou)) {
    // Its only present on quick add
    return true;
  }
  return !updatedByYou;
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
