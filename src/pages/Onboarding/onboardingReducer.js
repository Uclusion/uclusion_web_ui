export function updateValues(newValues){
  return {
    type: 'UPDATE_VALUES',
    newValues,
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
    default:
      return state;
  }
};