const MARK_TOUR_COMPLETED = 'MARK_TOUR_COMPLETED';
const SET_TOUR_CURRENT_STEP = 'SET_TOUR_CURRENT_STEP';
const START_TOUR = 'START_TOUR';

export function markTourCompleted(name) {
  return {
    type: MARK_TOUR_COMPLETED,
    name,
  };
}


export function startTour(name) {
  return {
    type: START_TOUR,
    name,
  };
}


export function setTourCurrentStep(name, currentStep) {
  return {
    type: SET_TOUR_CURRENT_STEP,
    currentStep,
    name,
  };
}


function markCompleted(state, action) {
  const { name } = action;
  const status = state[name] || {};
  const newStatus = {
    ...status,
    completed: true,
  };
  return {
    ...state,
    [name]: newStatus,
  };
}

function setCurrentStep(state, action) {
  const { name, currentStep } = action;
  const status = state[name] || {};
  const newStatus = {
    ...status,
    currentStep,
  };
  return {
    ...state,
    [name]: newStatus,
  };
}


function markTourStarted(state, action) {
  const { name } = action;
  const running = state.runningTours || {};
  const newRunning = {
    ...running,
    [name]: true,
  };
  const newState = {
    ...state,
    runningTours: newRunning,
  };
  return newState;
}

export function reducer(state, action) {
  const { type } = action;
  switch (type) {
    case MARK_TOUR_COMPLETED:
      return markCompleted(state, action);
    case SET_TOUR_CURRENT_STEP:
      return setCurrentStep(state, action);
    case START_TOUR:
      return markTourStarted(state, action);
    default:
      return state;
  }
}