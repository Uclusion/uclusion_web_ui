/**
 * Web socket context provider must appear within the markets context, since it needs to
 * properly update it
 */
import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import WebSocketRunner from '../components/BackgroundProcesses/WebSocketRunner'
import config from '../config'
import { sendInfoPersistent, toastError } from '../utils/userMessage'
import { pushMessage, registerListener } from '../utils/MessageBusUtils'
import { getLoginPersistentItem, setLoginPersistentItem } from '../components/localStorageUtils'
import { isSignedOut, onSignOut } from '../utils/userFunctions'
import { LeaderContext } from './LeaderContext/LeaderContext'
import { refreshOrMessage } from './LeaderContext/leaderContextReducer'
import { refreshNotifications, VERSIONS_EVENT } from '../api/versionedFetchUtils'
import { getAppVersion } from '../api/sso'
import { PUSH_ACCOUNT_CHANNEL, PUSH_HOME_USER_CHANNEL } from './AccountContext/accountContextMessages'
import { AccountContext } from './AccountContext/AccountContext';
import { userIsLoaded } from './AccountContext/accountUserContextHelper';

export const AUTH_HUB_CHANNEL = 'auth'; // this is case sensitive.
export const VERSIONS_HUB_CHANNEL = 'VersionsChannel';
export const SOCKET_OPEN_EVENT = 'web_socket_opened';

const pongTracker = {failureCount: 0};

const WebSocketContext = React.createContext([
  {}, () => {
  },
]);

export const LAST_LOGIN_APP_VERSION = 'login_version';

export const MAX_DRIFT_TIME = 300000;

export function notifyNewApplicationVersion(currentVersion, cacheClearVersion) {
  const { version } = config;
  let loginVersion = getLoginPersistentItem(LAST_LOGIN_APP_VERSION);
  if (!loginVersion) {
    // if we don't have any login version stored then initialize for fresh install
    setLoginPersistentItem(LAST_LOGIN_APP_VERSION, cacheClearVersion);
    loginVersion = cacheClearVersion;
  }
  if (cacheClearVersion && (!Number.isInteger(loginVersion) || loginVersion < cacheClearVersion)) {
    console.log(`Sign out with cache clear version ${cacheClearVersion} and login version ${loginVersion}`);
    const reloader = () => {
      setLoginPersistentItem(LAST_LOGIN_APP_VERSION, cacheClearVersion);
      onSignOut().catch((error) => {
        console.error(error);
        toastError(error, 'errorSignOutFailed');
      });
    };
    sendInfoPersistent({ id: 'noticeVersionForceLogout' }, {}, reloader);
  } else if (currentVersion !== version && !currentVersion.includes('fake')) {
    console.log(`Refreshing with current version ${currentVersion} and version ${version}`);
    sendInfoPersistent({ id: 'noticeNewApplicationVersion' }, {});
  }
}

function sendPing(socket) {
  const actionString = JSON.stringify({ action: 'ping' });
  socket.send(actionString);
}

function createWebSocket(config, leaderDispatch, setState, leaderChannelId) {
  console.info('Creating new websocket');
  pongTracker.failureCount = 0;
  const { webSockets } = config;
  const sockConfig = { wsUrl: webSockets.wsUrl, reconnectInterval: webSockets.reconnectInterval };
  const newSocket = new WebSocketRunner(sockConfig);
  // this will incidentally subscribe to the identity
  newSocket.connect();
  // we also want to always be subscribed to new app versions
  newSocket.registerHandler('UI_UPDATE_REQUIRED', (message) => {
    const { app_version: currentVersion, requires_cache_clear: cacheClearVersion } = message;
    notifyNewApplicationVersion(currentVersion, cacheClearVersion);
  });

  newSocket.registerHandler('pong', () => {
    pongTracker.failureCount = 0;
  });
  newSocket.registerHandler('user', (message) => {
    const { version } = message;
    pushMessage(PUSH_HOME_USER_CHANNEL, { event: VERSIONS_EVENT, version });
  });
  newSocket.registerHandler('account', (message) => {
    const { version } = message;
    pushMessage(PUSH_ACCOUNT_CHANNEL, { event: VERSIONS_EVENT, version });
  });
  newSocket.registerHandler('market', () => {
    leaderDispatch(refreshOrMessage(`market${Date.now()}`, leaderChannelId));
  });
  newSocket.registerHandler('group', () => {
    leaderDispatch(refreshOrMessage(`group${Date.now()}`, leaderChannelId));
  });
  newSocket.registerHandler('group_capability', () => {
    leaderDispatch(refreshOrMessage(`group_capability${Date.now()}`, leaderChannelId));
  });
  newSocket.registerHandler('investible', () => {
    leaderDispatch(refreshOrMessage(`investible${Date.now()}`, leaderChannelId));
  });
  newSocket.registerHandler('market_investible', () => {
    leaderDispatch(refreshOrMessage(`marketInvestible${Date.now()}`, leaderChannelId));
  });
  newSocket.registerHandler('comment', () => {
    leaderDispatch(refreshOrMessage(`comment${Date.now()}`, leaderChannelId));
  });
  newSocket.registerHandler('stage', () => {
    leaderDispatch(refreshOrMessage(`stage${Date.now()}`, leaderChannelId));
  });
  newSocket.registerHandler('market_capability', () => {
    leaderDispatch(refreshOrMessage(`marketCapability${Date.now()}`, leaderChannelId));
  });
  newSocket.registerHandler('investment', () => {
    leaderDispatch(refreshOrMessage(`investment${Date.now()}`, leaderChannelId));
  });
  newSocket.registerHandler('addressed', () => {
    leaderDispatch(refreshOrMessage(`addressed${Date.now()}`, leaderChannelId));
  });

  newSocket.registerHandler('notification', () => {
    // Try to be up to date before we push the notification out (which might need new data)
    leaderDispatch(refreshOrMessage(`notification${Date.now()}`, leaderChannelId));
    refreshNotifications();
  });

  sendPing(newSocket);
  setState(newSocket);
}

function WebSocketProvider(props) {
  const { children, config, userId } = props;
  const [, leaderDispatch] = useContext(LeaderContext);
  const [userState] = useContext(AccountContext);
  const [state, setState] = useState();
  const isUserLoaded = userIsLoaded(userState);

  useEffect(() => {
    let interval;
    if (isUserLoaded) {
      interval = setInterval((tracker, socket, refresh, myCreateSocket) => {
        const mySignedOut = isSignedOut();
        const pingFailed = pongTracker.failureCount > 3;
        if (socket && !pingFailed && !mySignedOut) {
          sendPing(socket);
        } else {
          pongTracker.failureCount += 1;
          if (pingFailed || !socket) {
            if (socket) {
              console.warn('Terminating socket');
              socket.terminate();
            }
            if (!mySignedOut) {
              console.info(`Recreating socket with fail count ${pongTracker.failureCount}`);
              myCreateSocket();
            }
          }
        }
        if (!mySignedOut) {
          refresh();
          getAppVersion().then((version) => {
            const { app_version: currentVersion, requires_cache_clear: cacheClearVersion } = version;
            notifyNewApplicationVersion(currentVersion, cacheClearVersion);
          }).catch(() => console.warn('Error checking version'));
        }
      }, MAX_DRIFT_TIME, pongTracker, state, () => {
        leaderDispatch(refreshOrMessage(`visit${Date.now()}`, userId));
      }, () => createWebSocket(config, leaderDispatch, setState, userId));
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [config, leaderDispatch, state, userId, isUserLoaded]);

  useEffect(() => {
    if (isUserLoaded) {
      createWebSocket(config, leaderDispatch, setState, userId);
    }
    return () => {};
  }, [config, leaderDispatch, userId, isUserLoaded]);

  if (isUserLoaded) {
    registerListener(AUTH_HUB_CHANNEL, 'webSocketsAuth', (data) => {
      const { payload: { event } } = data;
      switch (event) {
        case 'signOut':
          if (state) {
            state.terminate();
          }
          break;
        case 'signIn':
          // runs after user is loaded so too late for sign in event
          break;
        default:
      }
    });
  }

  return (
    <WebSocketContext.Provider value={[state, setState]}>
      {children}
    </WebSocketContext.Provider>
  );
}

WebSocketProvider.propTypes = {
  children: PropTypes.object,
  config: PropTypes.object.isRequired,
};

export { WebSocketContext, WebSocketProvider };
