import _ from 'lodash'

export function userIsLoaded(state) {
  const { user } = state || {};
  return !_.isEmpty(user);
}

export function getUiPreferences(state) {
  const { user } = state;
  if (_.isEmpty(user)) {
    return undefined;
  }
  const { ui_preferences: uiPrefs } = user;
  if (!uiPrefs) {
    return {};
  }
  return uiPrefs;
}