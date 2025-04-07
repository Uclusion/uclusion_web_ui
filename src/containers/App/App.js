import React, { useEffect, useState } from 'react'
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
import { CognitoUserProvider } from '../../contexts/CognitoUserContext/CongitoUserContext'
import { BroadcastChannel } from 'broadcast-channel'
import { onSignOut } from '../../utils/userFunctions'
import { LeaderProvider } from '../../contexts/LeaderContext/LeaderContext'
import { CommentsProvider } from '../../contexts/CommentsContext/CommentsContext'
import { InvestiblesProvider } from '../../contexts/InvestibesContext/InvestiblesContext'
import { MarketPresencesProvider } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { MarketsProvider } from '../../contexts/MarketsContext/MarketsContext'
import { GroupMembersProvider } from '../../contexts/GroupMembersContext/GroupMembersContext'

export const LogoutContext = React.createContext([]);

function App(props) {
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

  if (!window.myErrorListenerMarker) {
    window.myErrorListenerMarker = true;
    window.onerror = function (message, source, lineno, colno,
      error) {
      console.error('Global error caught:', message, source, lineno, colno, error);
      return true; // Prevents the browser's default error handling
    };

    window.addEventListener('unhandledrejection', function (event) {
      console.error('Unhandled promise rejection:', event.reason);
      event.preventDefault(); // Prevents the default error handling
    });
  }

  const { userId, email } = userAttributes;
  if (!userId && email) {
    return (
      <OnlineStateProvider>
        <ThemeProvider theme={defaultTheme}>
          <NoAccount email={email} authState={authState}/>
        </ThemeProvider>
      </OnlineStateProvider>
    );
  }

  // only start up the app if we're really sure they're properly logged in and verified
  if (authState === 'signedIn' && userId && email) {
    return (
      <CognitoUserProvider authState={authState}>
        <LeaderProvider authState={authState} userId={userId}>
          <MarketsProvider>
            <CommentsProvider>
              <InvestiblesProvider>
                <MarketPresencesProvider>
                  <GroupMembersProvider>
                    <OnlineStateProvider>
                      <WebSocketProvider config={config} userId={userId}>
                        <AppConfigProvider appConfig={configs}>
                          <ThemeProvider theme={defaultTheme}>
                            <LogoutContext.Provider value={logoutChannel}>
                              <Root appConfig={configs}/>
                            </LogoutContext.Provider>
                          </ThemeProvider>
                        </AppConfigProvider>
                      </WebSocketProvider>
                    </OnlineStateProvider>
                  </GroupMembersProvider>
                </MarketPresencesProvider>
              </InvestiblesProvider>
            </CommentsProvider>
          </MarketsProvider>
        </LeaderProvider>
      </CognitoUserProvider>
    );
  }

  // something's not right. White screen it
  return <></>
}

export default App;
