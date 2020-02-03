const MARK_TOUR_COMPLETED = 'MARK_COMPLETED';
const SET_TOUR_CURRENT_STEP = 'SET_TOUR_CURRENT_STEP';
const START_TOUR_FAMILY = 'START_TOUR_FAMILY';
const STOP_TOUR_FAMILY = 'STOP_TOUR_FAMILY';

export function startTourFamily(name) {
  return {
    type: START_TOUR_FAMILY,
    name,
  };
}

export function stopTourFamily(name) {
  return {
    type: STOP_TOUR_FAMILY,
    name,
  };
}

export function markTourPortionCompleted(name) {
  return {
    type: MARK_TOUR_COMPLETED,
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

function markTourFamilyStopped(state, action) {
  const { name } = state;
  if (name === state.runningFamily) {
    const newState = {
      ...state,
      runningFamily: undefined,
    };
    return newState;
  }
  return state;
}

function markTourFamilyStarted(state, action) {
  const { name } = action;
  const newState = {
    ...state,
    runningFamily: name,
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
    case START_TOUR_FAMILY:
      return markTourFamilyStarted(state, action);
    case STOP_TOUR_FAMILY:
      return markTourFamilyStopped(state, action);
    default:
      return state;
  }
}