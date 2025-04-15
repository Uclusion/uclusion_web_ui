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
import { LeaderProvider } from '../../contexts/LeaderContext/LeaderContext'
import { CommentsProvider } from '../../contexts/CommentsContext/CommentsContext'
import { InvestiblesProvider } from '../../contexts/InvestibesContext/InvestiblesContext'
import { MarketPresencesProvider } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { MarketsProvider } from '../../contexts/MarketsContext/MarketsContext'
import { GroupMembersProvider } from '../../contexts/GroupMembersContext/GroupMembersContext'


function App(props) {
  const { authState } = props;
  const configs = { ...config };
  const [userAttributes, setUserAttributes] = useState({});

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
  if (userId && email) {
    return (
      <CognitoUserProvider authState={authState}>
        <MarketsProvider>
          <CommentsProvider>
            <InvestiblesProvider>
              <MarketPresencesProvider>
                <GroupMembersProvider>
                  <LeaderProvider authState={authState} userId={userId}>
                    <OnlineStateProvider>
                      <WebSocketProvider config={config} userId={userId}>
                        <AppConfigProvider appConfig={configs}>
                          <ThemeProvider theme={defaultTheme}>
                            <Root appConfig={configs} authState={authState}/>
                          </ThemeProvider>
                        </AppConfigProvider>
                      </WebSocketProvider>
                    </OnlineStateProvider>
                  </LeaderProvider>
                </GroupMembersProvider>
              </MarketPresencesProvider>
            </InvestiblesProvider>
          </CommentsProvider>
        </MarketsProvider>
      </CognitoUserProvider>
    );
  }

  // something's not right. White screen it
  return <></>
}

export default App;
