import * as types from './types';

let open = localStorage.getItem('uclusion:drawer_open');
open = (typeof open === 'string') ? (open === 'true') : (window.innerWidth >= 960);
const initialState = {
  open,
};

export default function drawer(state = initialState, action) {
  switch (action.type) {
    case types.ON_DRAWER_OPEN_CHANGED:
      localStorage.setItem('uclusion:drawer_open', action.open);
      return { ...state, open: action.open };
    default:
      return state;
  }
}
