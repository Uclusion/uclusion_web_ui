import { getClient } from '../config/uclusionClient';

import {
  receiveCurrentUser,
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
   //   console.debug(user);
      dispatch(receiveCurrentUser(newUser));
      return newUser;
    });
  });
}



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
    dispatch(uiPrefsUpdated(me));
    return client.users.update(undefined, undefined, undefined, me.ui_preferences);
  }).then(() => fetchSelf(dispatch));
}
