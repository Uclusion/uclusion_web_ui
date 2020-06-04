import { markTourCompleted, setTourCurrentStep } from './tourContextReducer';
import _ from 'lodash';

export function completeTour(dispatch, name){
  dispatch(markTourCompleted(name));
}

export function isTourRunning(state, name) {
  return state && state.runningTour === name;
}


export function setCurrentStep(dispatch, name, currentStep){
  dispatch(setTourCurrentStep(name, currentStep));
}

export function getCurrentStep(state, tourName){
  const status = state[tourName] || {};
  const { currentStep } = status;
  return currentStep || 0;
}

/**
 * Returns if the tour is completed, defaulting to true if
 * we don't have information, since we don't want to run tours
 * the user has already seen.
 * @param state
 * @param name
 * @returns {boolean}
 */
export function isTourCompleted(state, name) {
  if (_.isEmpty(state)) {
    return true;
  }
  const status = state[name] || {};
  const { completed } = status;
  return completed;
}