import _ from 'lodash'



export const OnboardingState = {
  NeedsOnboarding: 'NEEDS_ONBOARDING',
  DemoCreated: 'DEMO_CREATED',
  FirstMarketJoined: 'FIRST_MARKET_JOINED'
};

export function userIsLoaded(state) {
  const { user } = state || {};
  const hasUser =  !_.isEmpty(user);
  console.dir(user);
  const onboardingNeeded = user.onboarding_state == null || user.onboarding_state === OnboardingState.NeedsOnboarding;
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