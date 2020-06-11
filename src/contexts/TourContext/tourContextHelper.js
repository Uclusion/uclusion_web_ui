import { markTourCompleted, setTourCurrentStep } from './tourContextReducer'
import _ from 'lodash'

export const INVITE_DIALOG_FIRST_VIEW = 'invite_dialog_first_view';
export const INVITE_STORIES_WORKSPACE_FIRST_VIEW = 'invite_stories_workspace_first_view';
export const INVITE_REQ_WORKSPACE_FIRST_VIEW = 'invite_req_workspace_first_view';
export const ADMIN_INITIATIVE_FIRST_VIEW = 'admin_initiative_first_view';
export const INVITE_INITIATIVE_FIRST_VIEW = 'invite_initiative_first_view';

export function getTourFamily(tourName) {
  switch (tourName) {
    case INVITE_DIALOG_FIRST_VIEW:
      return [INVITE_DIALOG_FIRST_VIEW];
    case INVITE_STORIES_WORKSPACE_FIRST_VIEW:
      return [INVITE_STORIES_WORKSPACE_FIRST_VIEW, INVITE_REQ_WORKSPACE_FIRST_VIEW];
    case INVITE_REQ_WORKSPACE_FIRST_VIEW:
      return [INVITE_REQ_WORKSPACE_FIRST_VIEW];
    case ADMIN_INITIATIVE_FIRST_VIEW:
      return [ADMIN_INITIATIVE_FIRST_VIEW, INVITE_INITIATIVE_FIRST_VIEW];
    case INVITE_INITIATIVE_FIRST_VIEW:
      return [INVITE_INITIATIVE_FIRST_VIEW];
    default:
      return [];
  }
}

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