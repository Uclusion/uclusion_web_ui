import _ from 'lodash';

export function getUiPreferences(state) {
  const { user } = state;
  if (_.isEmpty(user)) {
    return undefined;
  }
  const { ui_preferences: uiPrefs} = user;
  if (!uiPrefs) {
    return undefined;
  }
  return uiPrefs;
}

export function isNewUser(state) {
  const { user } = state;
  if (_.isEmpty(user)) {
    return undefined;
  }
  const { is_new: isNew } = user;
  return isNew !== undefined && isNew;
}