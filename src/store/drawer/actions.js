import * as types from './types';

export function setDrawerOpen(open) {
  return {
    type: types.ON_DRAWER_OPEN_CHANGED,
    open,
  };
}

export default { setDrawerOpen };
