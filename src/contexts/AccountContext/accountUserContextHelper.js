import _ from 'lodash'



export const OnboardingState = {
  NeedsOnboarding: 'NEEDS_ONBOARDING',
  DemoCreated: 'DEMO_CREATED',
  FirstMarketJoined: 'FIRST_MARKET_JOINED'
};

export function userIsLoaded(state) {
  const { user } = state || {};
  const hasUser =  !_.isEmpty(user);
  // if you're flagg is needs onboarding, it means the backend isn't done working with you
  const onboardingNeeded = user?.onboarding_state === OnboardingState.NeedsOnboarding;
  return hasUser && !onboardingNeeded;
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