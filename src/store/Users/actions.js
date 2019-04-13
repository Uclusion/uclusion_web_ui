import { getClient } from '../../config/uclusionClient';

export const REQUEST_CURRENT_USER = 'REQUEST_CURRENT_USER';
export const RECEIVE_USER = 'RECEIVE_USER';
export const RECEIVE_CURRENT_USER = 'RECEIVE_CURRENT_USER';

export const requestCurrentUser = user => ({
  type: REQUEST_CURRENT_USER,
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

export const fetchUser = (params = {}) => (dispatch) => {
  if (!params.user_id) {
    dispatch(requestCurrentUser(params.user));
  }
  const clientPromise = getClient();
  let globalClient;
  return clientPromise.then((client) => {
    globalClient = client;
    return client.users.get(params.user_id, params.marketId);
  }).then((user) => {
    if (!params.user_id) {
      globalClient.users.getPresences().then((teamPresences) => {
        user.team_presences = teamPresences;
        console.log('Receiving user');
        console.log(user);
        dispatch(receiveCurrentUser(user));
      });
    } else {
      dispatch(receiveUser(user));
    }
  }).catch((error) => {
    console.log(error);
    dispatch(receiveUser([]));
  });
};

const formatUser = (user) => {
  user.created_at = new Date(user.created_at);
  user.updated_at = new Date(user.updated_at);
  return user;
};

export const formatUsers = (users) => {
  users.forEach((users) => {
    formatUser(users);
  });
  return users;
};
