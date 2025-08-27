import _ from 'lodash'
import { PLANNING_TYPE, SUPPORT_SUB_TYPE } from '../../constants/markets';



export const OnboardingState = {
  NeedsOnboarding: 'NEEDS_ONBOARDING',
  DemoCreated: 'DEMO_CREATED',
  FirstMarketJoined: 'FIRST_MARKET_JOINED'
};

export function userIsLoaded(state, marketsState) {
  const { user } = state || {};
  const { marketDetails } = marketsState || {};
  const nonSupportMarket = marketDetails?.find((market) => market.market_sub_type !== SUPPORT_SUB_TYPE && market.market_type === PLANNING_TYPE);
  const hasUser =  !_.isEmpty(user);
  // if you're flagg is needs onboarding, it means the backend isn't done working with you
  const onboardingNeeded = user?.onboarding_state === OnboardingState.NeedsOnboarding;
  // If you have any not support planning market then you do not need onboarding and the flag just hasn't caught up
  return hasUser && (!onboardingNeeded || !_.isEmpty(nonSupportMarket));
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