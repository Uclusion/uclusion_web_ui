export function getDiff(state, id) {
  const item = (state && state[id]) || {};
  const { diff } = item;
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
