import {
  SHOW_INVESTIBLE_DETAIL,
  HIDE_INVESTIBLE_DETAIL,
  SHOW_USER_DETAIL,
  HIDE_USER_DETAIL,

} from './actions';

const initialState = {
  investible: {
    show: false,
    data: null,
  },
  user: {
    show: false,
    data: null,
  },
};

export default (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case SHOW_INVESTIBLE_DETAIL:
      return {
        ...state,
        investible: {
          show: true,
          data: payload,
        },
      };

    case HIDE_INVESTIBLE_DETAIL:
      return {
        ...state,
        investible: {
          ...state.investible,
          show: false,
        },
      };

    case SHOW_USER_DETAIL:
      return {
        ...state,
        user: {
          show: true,
          data: payload,
        },
      };

    case HIDE_USER_DETAIL:
      return {
        ...state,
        user: {
          ...state.user,
          show: false,
        },
      };

    default:
      return state;
  }
};
