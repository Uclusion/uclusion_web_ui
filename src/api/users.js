import { getClient } from '../config/uclusionClient';

import {
  receiveCurrentUser,
  receiveUser,
  requestCurrentUser,
  uiPrefsUpdated,
} from '../store/Users/actions';

export function fetchSelf(dispatch) {
  let userClient = null;
  const clientPromise = getClient();
  return clientPromise.then((client) => {
    userClient = client;
    dispatch(requestCurrentUser());
    return userClient.users.get();
  }).then((user) => {
    const newUser = { ...user };
    return userClient.users.getPresences().then((teamPresences) => {
      newUser.team_presences = teamPresences;
      console.debug('Receiving user');
      console.debug(user);
      dispatch(receiveCurrentUser(user));
      return newUser;
    });
  });
}

/*
export function fetchUser(userId, dispatch) {
  const clientPromise = getClient();
  return clientPromise.then(client => client.users.get(userId))
    .then((user) => {
      dispatch(receiveUser(user));
    }).catch((error) => {
      console.log(error);
      dispatch(receiveUser([]));
    });
}
*/


/**
 * Requires in params a user with the UI preferences already set
 * and the market Id
 * @param me the user
 * @param dispatch the dispatch function to the store
 * @returns {Function}
 */
export function updateMyUiPrefereneces(me, dispatch) {
  const clientPromise = getClient();
  return clientPromise.then((client) => {
    dispatch(uiPrefsUpdated(user));
    return client.users.update(undefined, undefined, undefined, user.ui_preferences);
  }).then(result => fetchSelf()); // eslint-disable-line
}
