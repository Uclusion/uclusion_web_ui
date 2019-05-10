/**
 * Returns a JSON unpacked version of the user's UI preferences,
 * or an empty object if there aren't any
 * @param user
 * @return {*} the unpacked user preferences object
 */
export function getUiPreferences(user) {
  const { ui_preferences } = user;
  if (ui_preferences) {
    const unpacked = JSON.parse((ui_preferences));
    return unpacked;
  }
  return {};
}

/**
 * Gets a particular sub-branch of the ui preferences
 * @param user the user to get the ui preference from
 * @param subkey the subkey to return
 * @returns {*} any ui prefs stored under that subkey
 */
export function getUiPreference(user, subkey){
  const uiPrefs = getUiPreferences(user);
  return uiPrefs[subkey];
}

/**
 * Sets the ui preferences on a user given the user and an
 * object consisting of the ENTIRETY of the preferences
 * @param user the user to set the prefs for
 * @param preferences the ui preferences in their entirety
 * @returns {*} a copied version of the user with ui prefs set
 */
export function setUiPreferences(user, preferences) {
  const newUser = { ...user, ui_preferences: packUiPreferences(preferences) };
  return newUser;
}

/**
 * Given a user, a subkey and a value, returns a new user object
 * which has the ui preferences with the given subkey replaced
 * by the value
 * @param user the user to modify prefs for
 * @param subkey the subkey to modify
 * @param value the value to set the subkey to
 * @returns {*} a copy of the user object with the user preferences
 * value modifed with the proper subkey
 */
export function setUiPreference(user, subkey, value){
  const uiPrefs = getUiPreferences(user);
  const newPrefs = { ...uiPrefs };
  newPrefs[subkey] = value;
  return setUiPreferences(user, newPrefs);
}


/**
 * Packs the ui preferences in a form suitable for sending to the backend
 * when updating a user
 * @param preferences
 * @returns {string} the packed preferences
 */
export function packUiPreferences(preferences) {
  return JSON.stringify(preferences);
}

