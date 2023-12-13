/**
 A simple component that only renders root if the home account user has been loaded in the contexts
 */

import React, { useContext } from 'react';
import { userIsLoaded } from '../../contexts/AccountContext/accountUserContextHelper';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import Screen from '../Screen/Screen';
import { useIntl } from 'react-intl';

export const OnboardingState = {
  NeedsOnboarding: 'NEEDS_ONBOARDING',
  DemoCreated: 'DEMO_CREATED',
  FirstMarketJoined: 'FIRST_MARKET_JOINED'
};

function AccountPoller (props) {
  const { children } = props;
  const [userState] = useContext(AccountContext);
  const intl = useIntl();

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