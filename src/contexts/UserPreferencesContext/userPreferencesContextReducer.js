const REFRESH_HOME_USER = 'REFRESH_HOME_USER';

export function homeUserRefresh(homeUser) {
  return {
    type: REFRESH_HOME_USER,
    homeUser,
  };
}

/*** Functions that modify data ***/

function doHomeUserRefresh(state, action) {
  const { homeUser } = action;
  return {
    ...state,
    initializing: false,
    homeUser,
  };
}

export function reducer(state, action) {
  const { type } = action;
  switch (type) {
    case REFRESH_HOME_USER:
      return doHomeUserRefresh(state, action);
    default:
      return state;
  }
}