import {
  SHOW_INVESTIBLE_DETAIL,
  HIDE_INVESTIBLE_DETAIL,
  SHOW_USER_DETAIL,
  HIDE_USER_DETAIL,
  UPDATE_INVESTIBLE_DETAIL_INVESTMENT,

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

    case UPDATE_INVESTIBLE_DETAIL_INVESTMENT:
      if (state.investible && state.investible.data.id === payload.investible_id) {
        const newInvestible = {
          ...state.investible.data,
          current_user_investment: payload.current_user_investment
        };
        return {
          ...state,
          investible: {
            show: state.investible.show,
            data: newInvestible,
          },
        };
      }
      return state;
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
