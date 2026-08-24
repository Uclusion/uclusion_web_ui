import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import NoAccount from '../../pages/NoAccount/NoAccount'
import Root from '../Root'
import AppConfigProvider from '../../components/AppConfigProvider'
import config from '../../config'
import { WebSocketProvider } from '../../contexts/WebSocketContext'
import { OnlineStateProvider } from '../../contexts/OnlineStateContext'
import { Auth } from 'aws-amplify'
import LogRocket from 'logrocket'
import { ThemeModeProvider } from '../../contexts/ThemeModeContext'
import { CognitoUserProvider } from '../../contexts/CognitoUserContext/CongitoUserContext'
import { LeaderProvider } from '../../contexts/LeaderContext/LeaderContext'
import { CommentsProvider } from '../../contexts/CommentsContext/CommentsContext'
import { InvestiblesProvider } from '../../contexts/InvestibesContext/InvestiblesContext'
import { MarketPresencesProvider } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { MarketsProvider } from '../../contexts/MarketsContext/MarketsContext'
import { GroupMembersProvider } from '../../contexts/GroupMembersContext/GroupMembersContext'
import { startEventTimingWatch } from '../../utils/renderProfiler'
import { useHistory, useLocation } from 'react-router'
import { clearRedirect, getRedirect, setRedirect } from '../../utils/redirectUtils'
import SetupApproval from '../../pages/Setup/SetupApproval'
import { parseSetupPath, switchSetupAccount } from '../../pages/Setup/setupRoute'
import { AccountContext } from '../../contexts/AccountContext/AccountContext'
import { accountUserJoinedMarket } from '../../contexts/AccountContext/accountContextReducer'
import { poll } from '../../contexts/AccountContext/accountContextMessages'
import { getMarketFromUrl } from '../../api/marketLogin'
import { formMarketLink } from '../../utils/marketIdPathFunctions'
import { onSignOut } from '../../utils/userFunctions'
import {
  getLogoutGeneration,
  isLogoutGenerationCurrent,
  isSignedOut,
} from '../../utils/logoutState'
import SetupWorkspaceLoad from '../../pages/Setup/SetupWorkspaceLoad'


function App(props) {
  const { authState } = props;
  const authStateRef = useRef(authState);
  authStateRef.current = authState;
  const configs = { ...config };
  const [userAttributes, setUserAttributes] = useState({});
  const userAttributesGeneration = useRef();
  const [, accountDispatch] = useContext(AccountContext);
  const history = useHistory();
  const { pathname } = useLocation();
  const directSetupRoute = parseSetupPath(pathname);
  const savedSetupRoute = parseSetupPath(getRedirect());
  const setupRoute = directSetupRoute || savedSetupRoute;
  const directSetupPath = directSetupRoute?.pathname;
  const savedSetupPath = savedSetupRoute?.pathname;
  const setupPath = setupRoute?.pathname;
  const onSetupAccountReady = useCallback(
    () => poll(accountDispatch).catch(() => undefined),
    [accountDispatch]
  );
  const onSetupSwitchAccount = useCallback(
    () => switchSetupAccount(onSignOut, history, setupPath),
    [history, setupPath]
  );
  const onSetupComplete = useCallback(
    ({ setup_id: setupId, workspace_id: workspaceId, view_id: viewId }, setupPageActive) => {
      const logoutGeneration = getLogoutGeneration();
      const completionActive = () => {
        try {
          return (!setupPageActive || setupPageActive()) &&
            authStateRef.current === 'signedIn' && !isSignedOut() &&
            isLogoutGenerationCurrent(logoutGeneration) &&
            parseSetupPath(history.location.pathname)?.setupId === setupId;
        } catch (_error) {
          return false;
        }
      };
      const cancelled = () => {
        const error = new Error('Setup completion is no longer active');
        error.cancelled = true;
        return error;
      };
      if (!completionActive()) {
        return Promise.reject(cancelled());
      }
      return getMarketFromUrl(workspaceId, completionActive).then(() => {
        if (!completionActive()) {
          throw cancelled();
        }
        accountDispatch(accountUserJoinedMarket());
        history.replace(formMarketLink(workspaceId, viewId), { setupWorkspaceId: workspaceId });
      });
    },
    [accountDispatch, history]
  );

  // B-all-569: arms the profiler's observers when window.__uclusionProfiler('on') was set
  useEffect(() => {
    startEventTimingWatch();
  }, []);

  useEffect(() => {
    let active = true;
    function completeLogin (loginInfo) {
      setUserAttributes(loginInfo)
      LogRocket.identify(loginInfo.userId, loginInfo)
    }

    if (authState !== 'signedIn') {
      userAttributesGeneration.current = undefined;
      setUserAttributes((current) => Object.keys(current).length ? {} : current);
    } else {
      const logoutGeneration = getLogoutGeneration();
      const attributesAreCurrent = userAttributesGeneration.current === logoutGeneration &&
        isLogoutGenerationCurrent(logoutGeneration) && !isSignedOut() &&
        'userId' in userAttributes;
      if (attributesAreCurrent) {
        return () => {
          active = false;
        };
      }
      userAttributesGeneration.current = undefined;
      console.info('Authenticating in App')
      Auth.currentAuthenticatedUser()
        .then((user) => {
          if (!active || authStateRef.current !== 'signedIn' || isSignedOut() ||
            !isLogoutGenerationCurrent(logoutGeneration)) {
            return;
          }
          const { attributes } = user
          const userId = attributes['custom:user_id']
          const loginInfo = {
            ...attributes,
            userId,
          }
          userAttributesGeneration.current = logoutGeneration;
          completeLogin(loginInfo)
        })
    }
    return () => {
      active = false;
    }
  }, [authState, userAttributes]);

  useEffect(() => {
    if (directSetupPath && authState !== 'signedIn') {
      if (savedSetupPath !== directSetupPath) {
        setRedirect(directSetupPath);
      }
      return;
    }
    if (authState === 'signedIn' && setupPath) {
      if (savedSetupPath) {
        clearRedirect();
      }
      if (pathname !== setupPath) {
        history.replace(setupPath);
      }
    }
  }, [authState, directSetupPath, history, pathname, savedSetupPath, setupPath]);

  if (!window.myErrorListenerMarker) {
    window.myErrorListenerMarker = true;
    window.onerror = function (message, source, lineno, colno,
      error) {
      // Log the stack as a string so log capture (e.g. Cypress) records the original throw
      // site instead of just the rethrow position in the minified bundle
      console.error('Global error caught:', message, source, lineno, colno, error?.stack || error);
      return true; // Prevents the browser's default error handling
    };

    window.addEventListener('unhandledrejection', function (event) {
      console.error('Unhandled promise rejection:', event.reason?.stack || event.reason);
      event.preventDefault(); // Prevents the default error handling
    });
  }

  if (authState === 'signedIn' && setupRoute) {
    return (
      <ThemeModeProvider>
        <SetupApproval
          setupId={setupRoute.setupId}
          onAccountReady={onSetupAccountReady}
          onSetupComplete={onSetupComplete}
          onSwitchAccount={onSetupSwitchAccount}
        />
      </ThemeModeProvider>
    );
  }

  const attributesAreCurrent = authState === 'signedIn' &&
    'userId' in userAttributes &&
    isLogoutGenerationCurrent(userAttributesGeneration.current) && !isSignedOut();
  const { userId, email } = attributesAreCurrent ? userAttributes : {};
  if (!userId && email) {
    return (
      <OnlineStateProvider>
        <ThemeModeProvider>
          <NoAccount email={email} authState={authState}/>
        </ThemeModeProvider>
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
                  <SetupWorkspaceLoad />
                  <LeaderProvider authState={authState} userId={userId}>
                    <OnlineStateProvider>
                      <WebSocketProvider config={config} userId={userId}>
                        <AppConfigProvider appConfig={configs}>
                          <ThemeModeProvider>
                            <Root appConfig={configs} authState={authState}/>
                          </ThemeModeProvider>
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
