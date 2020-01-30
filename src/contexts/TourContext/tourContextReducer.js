const MARK_TOUR_PORTION_COMPLETED = 'MARK_COMPLETED';

export function markTourPortionCompleted(name){
  return {
    type: MARK_TOUR_PORTION_COMPLETED,
    name,
  };
}


function markCompleted(state, action) {
  const { completed } = state;
  const usedCompleted = completed || {};
  const { name } = action;
  const newCompleted = {
    ...usedCompleted,
    [name]: true
  };
  return {
    ...state,
    completed: newCompleted,
  };
}

export function reducer(state, action) {
  const { type } = action;
  switch (type) {
    case MARK_TOUR_PORTION_COMPLETED:
      return markCompleted(state, action);
    default:
      return state;
  }
}