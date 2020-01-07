export function getDiff(state, id) {
  const item = (state && state[id]) || {};
  const { diff } = item;
  return diff;
};
