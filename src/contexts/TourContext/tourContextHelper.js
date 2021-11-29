import { markTourCompleted, setTourCurrentStep } from './tourContextReducer'
import _ from 'lodash'

export const INVITE_DIALOG_FIRST_VIEW = 'invite_dialog_first_view';
export const INVITE_REQ_WORKSPACE_FIRST_VIEW = 'invite_req_workspace_first_view';
// Currently INVITED_USER_WORKSPACE is any time someone is new in a unknown workspace - whether creator or not
// invited to the onboarding Workspace also goes here since it may have been customized
export const INVITED_USER_WORKSPACE = 'invited_user_workspace';
export const BLOCKED_STORY_TOUR = 'blocked_story_tour';
export const REQUIRES_INPUT_STORY_TOUR = 'requires_input_story_tour';
export const ADMIN_INITIATIVE_FIRST_VIEW = 'admin_initiative_first_view';
export const INVITE_INITIATIVE_FIRST_VIEW = 'invite_initiative_first_view';
export const SIGNUP_HOME = 'signup_home';

export function getTourFamily(tourName) {
  switch (tourName) {
    case INVITE_DIALOG_FIRST_VIEW:
      return [INVITE_DIALOG_FIRST_VIEW];
    case INVITE_REQ_WORKSPACE_FIRST_VIEW:
    case INVITED_USER_WORKSPACE:
      return [INVITE_REQ_WORKSPACE_FIRST_VIEW, SIGNUP_HOME, INVITED_USER_WORKSPACE];
    case ADMIN_INITIATIVE_FIRST_VIEW:
      return [ADMIN_INITIATIVE_FIRST_VIEW, INVITE_INITIATIVE_FIRST_VIEW];
    case INVITE_INITIATIVE_FIRST_VIEW:
      return [INVITE_INITIATIVE_FIRST_VIEW];
    case BLOCKED_STORY_TOUR:
      return [BLOCKED_STORY_TOUR];
    case REQUIRES_INPUT_STORY_TOUR:
      return [REQUIRES_INPUT_STORY_TOUR];
    case SIGNUP_HOME:
      return [SIGNUP_HOME];
    default:
      return [tourName];
  }
}

export function completeTour(dispatch, name){
  dispatch(markTourCompleted(name));
}

export function isTourRunning(state, name) {
  return state && state.runningTours && state.runningTours[name];
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