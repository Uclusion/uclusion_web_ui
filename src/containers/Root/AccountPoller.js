/**
 A simple component that only renders root if the home account user has been loaded in the contexts
 */

import React, { useContext, useEffect } from 'react';
import { userIsLoaded } from '../../contexts/AccountContext/accountUserContextHelper';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import Screen from '../Screen/Screen';
import { useIntl } from 'react-intl';
import { BannerContext } from '../../contexts/BannerContext/BannerContext';
import OnboardingBanner from '../../components/Banners/OnboardingBanner';

export const OnboardingState = {
  NeedsOnboarding: 'NEEDS_ONBOARDING',
  DemoCreated: 'DEMO_CREATED',
  FirstMarketJoined: 'FIRST_MARKET_JOINED'
};

function AccountPoller (props) {
  const { children } = props;
  const [userState] = useContext(AccountContext);
  const [,setBannerState] = useContext(BannerContext);
  const intl = useIntl();

  useEffect(() => {
    if(userState?.user?.onboarding_state === OnboardingState.DemoCreated){
      setBannerState(<OnboardingBanner/>)
    }else{
      setBannerState(null);
    }
  }, [userState, setBannerState]);

  if (userIsLoaded(userState)) {
    return <React.Fragment>{children}</React.Fragment>;
  }
  return (
    <Screen
      title="Uclusion"
      tabTitle={intl.formatMessage({id: 'loadingMessage'})}
      loading={true}
    />);
}

export default AccountPoller;