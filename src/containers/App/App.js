import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import NoAccount from '../../pages/NoAccount/NoAccount'
import Root from '../Root'
import AppConfigProvider from '../../components/AppConfigProvider'
import config from '../../config'
import { WebSocketProvider } from '../../contexts/WebSocketContext'
import { OnlineStateProvider } from '../../contexts/OnlineStateContext'
import { Auth } from 'aws-amplify'
import LogRocket from 'logrocket'
import { defaultTheme } from '../../config/themes'
import { ThemeProvider } from '@material-ui/core/styles'
import { TourProvider } from '../../contexts/TourContext/TourContext'
import { CognitoUserProvider } from '../../contexts/CognitoUserContext/CongitoUserContext'
import { AccountUserProvider } from '../../contexts/AccountUserContext/AccountUserContext'
import AccountPoller from '../Root/AccountPoller'

function App (props) {

  const { authState } = props;
  const configs = { ...config };
  const [userAttributes, setUserAttributes] = useState({});
  const [calledAuthenticate, setCalledAuthenticate] = useState(false);
  useEffect(() => {
    function completeLogin (loginInfo) {
      setUserAttributes(loginInfo);
      LogRocket.identify(loginInfo.userId, loginInfo);
    }

    if (authState === 'signedIn' && !calledAuthenticate) {
      setCalledAuthenticate(true);
      Auth.currentAuthenticatedUser()
        .then((user) => {
          const { attributes } = user;
          const userId = attributes['custom:user_id'];
          const loginInfo = {
            ...attributes,
            userId,
          };
          completeLogin(loginInfo);
        });
    }
    return () => {
    };
  }, [authState, calledAuthenticate]);

  const { userId, email } = userAttributes;
  const hasAccount = !_.isEmpty(userId);
  if (!hasAccount && email) {
    return (
      <OnlineStateProvider>
        <ThemeProvider theme={defaultTheme}>
          <NoAccount email={email} authState={authState}/>
        </ThemeProvider>
      </OnlineStateProvider>
    );
  }

  if (authState !== 'signedIn') {
    return <></>;
  }

  return (
    <CognitoUserProvider authState={authState}>
      <AccountUserProvider authState={authState}>
        <OnlineStateProvider>
          <WebSocketProvider config={config}>
            <AppConfigProvider appConfig={configs}>
              <ThemeProvider theme={defaultTheme}>
                <TourProvider>
                  <AccountPoller>
                    <Root appConfig={configs}/>
                  </AccountPoller>
                </TourProvider>
              </ThemeProvider>
            </AppConfigProvider>
          </WebSocketProvider>
        </OnlineStateProvider>
      </AccountUserProvider>
    </CognitoUserProvider>
  );
}

export default App;
