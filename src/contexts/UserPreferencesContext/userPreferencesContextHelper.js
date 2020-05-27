export function getUiPreference(uiPrefState, key) {
  const { ui_preferences: uiPrefs} = uiPrefState;
  if (!uiPrefs) {
    return undefined;
  }
  return uiPrefs[key];
}