import { getClient } from '../../config/uclusionClient';

export const REQUEST_CURRENT_USER = 'REQUEST_CURRENT_USER';
export const RECEIVE_USER = 'RECEIVE_USER';
export const RECEIVE_CURRENT_USER = 'RECEIVE_CURRENT_USER';
export const USERS_FETCHED = 'USERS_FETCHED';
export const USER_UI_PREFERENCES_UPDATED = 'USER_UI_PREFERENCES_UPDATED';

export const requestCurrentUser = () => ({
  type: REQUEST_CURRENT_USER,
});

export const uiPrefsUpdated = user => ({
  type: USER_UI_PREFERENCES_UPDATED,
  user,
});

export const receiveUser = user => ({
  type: RECEIVE_USER,
  user,
});

export const receiveCurrentUser = user => ({
  type: RECEIVE_CURRENT_USER,
  user,
});

export const usersFetched = users => ({
  type: USERS_FETCHED,
  users,
});

