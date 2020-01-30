import { markTourPortionCompleted } from './tourContextReducer';

export function completeTour(stateDispatch, name){
  stateDispatch(markTourPortionCompleted(name));
}

export function isTourCompleted(state, name) {
  const { completed } = state;
  return completed && completed[name];
}