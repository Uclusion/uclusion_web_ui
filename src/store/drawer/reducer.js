import * as types from './types';

const initialState = {
  open: false,
};

export default function drawer(state = initialState, action) {
  switch (action.type) {
    case types.ON_DRAWER_OPEN_CHANGED:
      return { ...state, open: action.open };
    default:
      return state;
  }
}
