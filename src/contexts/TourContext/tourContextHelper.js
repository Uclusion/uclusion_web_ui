import { markTourPortionCompleted, setTourCurrentStep } from './tourContextReducer';

export function completeTour(dispatch, name){
  dispatch(markTourPortionCompleted(name));
}

export function setCurrentStep(dispatch, name, currentStep){
  dispatch(setTourCurrentStep(name, currentStep));
}

export function getCurrentStep(state, name){
  const status = state[name] || {};
  const { currentStep } = status;
  return currentStep || 0;
}

export function isTourCompleted(state, name) {
  const status = state[name] || {};
  const { completed } = status;
  return !!completed;
}