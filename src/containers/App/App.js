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
import { CognitoUserProvider } from '../../contexts/CongitoUserContext'

function App (props) {

  const { authState } = props;
  const configs = { ...config };
  const [userAttributes, setUserAttributes] = useState({});
  useEffect(() => {
    function completeLogin (loginInfo) {
      setUserAttributes(loginInfo);
      LogRocket.identify(loginInfo.userId, loginInfo);
    }
    if (authState === 'signedIn') {
      Auth.currentAuthenticatedUser()
        .then((user) => {
          const { attributes } = user;
          const { identities } = attributes;
          // only externally authenticated users have identities
          const cognitoUserId = attributes['custom:user_id'];
          if (_.isEmpty(cognitoUserId) && !_.isEmpty(identities)) {
            // if you have no uclusion user id, and are external we'll refresh the current user
            // from cognito directly
            // because our login just didn't have them, even though they were created as a post
            // authentication hook
            return Auth.currentAuthenticatedUser({bypassCache: true});
          }else {
            return user
          }
        })
        .then((user) => {
          const { attributes } = user;
          const userId = attributes['custom:user_id'];
          const loginInfo = {
            ...attributes,
            userId,
          };
          completeLogin(loginInfo);
        });
    } else {
      setUserAttributes({});
    }
    return () => {
    };
  }, [authState]);

  if (authState !== 'signedIn') {
    return <></>;
  }

  const { userId, email } = userAttributes;
  const hasAccount = !_.isEmpty(userId);
  if (!hasAccount && email) {
    return (
      <CognitoUserProvider authState={authState}>
        <OnlineStateProvider>
          <ThemeProvider theme={defaultTheme}>
            <NoAccount email={email}/>
          </ThemeProvider>
        </OnlineStateProvider>
      </CognitoUserProvider>
    );
  }

  return (
    <CognitoUserProvider authState={authState}>
      <OnlineStateProvider>
        <WebSocketProvider config={config}>
          <AppConfigProvider appConfig={configs}>
            <ThemeProvider theme={defaultTheme}>
              <TourProvider>
                <Root appConfig={configs}/>
              </TourProvider>
            </ThemeProvider>
          </AppConfigProvider>
        </WebSocketProvider>
      </OnlineStateProvider>
    </CognitoUserProvider>
  );
}

export default App;
