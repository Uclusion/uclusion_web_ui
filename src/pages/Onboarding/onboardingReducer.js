export function updateValues(newValues){
  return {
    type: 'UPDATE_VALUES',
    newValues,
  };
}

export function resetValues() {
  return {
    type: 'RESET_VALUES',
  };
}

export function reducer(state, action) {
  const { type } = action;
  switch (type) {
    case 'UPDATE_VALUES':
      return {
        ...state,
        ...action.newValues,
      };
    case 'RESET_VALUES':
      return {};
    default:
      return state;
  }
};