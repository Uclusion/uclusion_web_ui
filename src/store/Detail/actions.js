export const SHOW_INVESTIBLE_DETAIL = 'SHOW_INVESTIBLE_DETAIL';
export const HIDE_INVESTIBLE_DETAIL = 'HIDE_INVESTIBLE_DETAIL';
export const UPDATE_INVESTIBLE_DETAIL_INVESTMENT = 'UPDATE_INVESTIBLE_DETAIL_INVESTMENT';
export const SHOW_USER_DETAIL = 'SHOW_USER_DETAIL';
export const HIDE_USER_DETAIL = 'HIDE_USER_DETAIL';

export function showInvestibleDetail(investible) {
  return (dispatch) => {
    dispatch({
      type: SHOW_INVESTIBLE_DETAIL,
      payload: investible,
    });
  };
}

export function hideInvestibleDetail() {
  return (dispatch) => {
    dispatch({
      type: HIDE_INVESTIBLE_DETAIL,
    });
  };
}


export function updateInvestibleDetailInvestment(investment) {
  return (dispatch) => {
    dispatch({
      type: UPDATE_INVESTIBLE_DETAIL_INVESTMENT,
      payload: investment,
    });
  };
}


export function showUserDetail(user) {
  return (dispatch) => {
    dispatch({
      type: SHOW_USER_DETAIL,
      payload: user,
    });
  };
}

export function hideUserDetail() {
  return (dispatch) => {
    dispatch({
      type: HIDE_USER_DETAIL,
    });
  };
}
