export function getDiff(state, id, userId) {
  const item = (state && state[id]) || {};
  const { diff, updatedBy } = item;
  if (updatedBy === userId) {
    return undefined;
  }
  return diff;
}

export function getIsNew(state, id) {
  if (!(state && state[id])) {
    console.debug('Returning true is new diff');
    return true;
  }
  const { isNew } = state[id];
  console.debug(`Returning ${isNew} new diff`);
  return isNew;
}
