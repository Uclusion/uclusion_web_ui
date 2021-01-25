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
import { BroadcastChannel } from 'broadcast-channel'
import { onSignOut } from '../../utils/userFunctions'

export const LogoutContext = React.createContext([]);

function App (props) {

  const { authState } = props;
  const configs = { ...config };
  const [userAttributes, setUserAttributes] = useState({});
  const [logoutChannel, setLogoutChannel] = useState(undefined);

  useEffect(() => {
    console.info('Setting up logout channel');
    const myLogoutChannel = new BroadcastChannel('logout');
    myLogoutChannel.onmessage = () => {
      console.info('Logging out from message');
      onSignOut().then(() => console.info('Done logging out'));
    };
    setLogoutChannel(myLogoutChannel);
    return () => {};
  }, []);

  useEffect(() => {
    function completeLogin (loginInfo) {
      setUserAttributes(loginInfo)
      LogRocket.identify(loginInfo.userId, loginInfo)
    }

    if (authState === 'signedIn' && !('userId' in userAttributes)) {
      console.info('Authenticating in App')
      Auth.currentAuthenticatedUser()
        .then((user) => {
          const { attributes } = user
          const userId = attributes['custom:user_id']
          const loginInfo = {
            ...attributes,
            userId,
          }
          completeLogin(loginInfo)
        })
    }
    return () => {}
  }, [authState, userAttributes]);

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
                    <LogoutContext.Provider value={logoutChannel}>
                      <Root appConfig={configs}/>
                    </LogoutContext.Provider>
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
