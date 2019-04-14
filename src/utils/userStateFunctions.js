import { USER_LOGOUT } from '../store/auth/types';

export function clearReduxStore(dispatch) {
  dispatch({
    type: USER_LOGOUT,
  });
}

export function clearUserState(dispatch) {
  localStorage.clear();
  clearReduxStore(dispatch);
}
