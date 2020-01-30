import { markTourPortionCompleted } from './tourContextReducer';

export function completePortion(stateDispatch, name){
  stateDispatch(markTourPortionCompleted(name));
}

export function portionCompleted(state, name) {
  const { completed } = state;
  return completed && completed[name];
}