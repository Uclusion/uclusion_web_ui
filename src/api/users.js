import { getClient } from '../config/uclusionClient';

import {
  receiveCurrentUser,
  requestCurrentUser,
  uiPrefsUpdated,
} from '../store/Users/actions';
import { ERROR, sendIntlMessage } from '../utils/userMessage';

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


export function loadTeams(canListAccountTeams, setTeams) {
  const clientPromise = getClient();
  if (canListAccountTeams) {
    clientPromise.then(client => client.teams.list()).then((marketTeams) => {
      setTeams(marketTeams);
    }).catch((error) => {
      console.error(error);
      sendIntlMessage(ERROR, { id: 'teamsLoadFailed' });
    });
  } else {
    clientPromise.then(client => client.teams.mine()).then((myTeams) => {
      setTeams(myTeams);
    }).catch((error) => {
      console.error(error);
      sendIntlMessage(ERROR, { id: 'teamsLoadFailed' });
    });
  }
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
    dispatch(uiPrefsUpdated(me));
    return client.users.update(undefined, undefined, undefined, user.ui_preferences);
  }).then(() => fetchSelf(dispatch));
}
