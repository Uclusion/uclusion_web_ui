/**
 * Web socket context provider must appear within the markets context, since it needs to
 * properly update it
 */
import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import WebSocketRunner from '../components/BackgroundProcesses/WebSocketRunner'
import config from '../config'
import { sendInfoPersistent, toastError } from '../utils/userMessage'
import { registerListener } from '../utils/MessageBusUtils'
import { refreshNotifications, refreshVersions } from './VersionsContext/versionsContextHelper'
import { getLoginPersistentItem, setLoginPersistentItem } from '../components/localStorageUtils'
import { getNotifications } from '../api/summaries'
import { isSignedOut, onSignOut } from '../utils/userFunctions'
import { LeaderContext } from './LeaderContext/LeaderContext'
import { BroadcastChannel } from 'broadcast-channel'
import LocalForageHelper from '../utils/LocalForageHelper'
import { VERSIONS_CONTEXT_NAMESPACE } from './VersionsContext/versionsContextReducer'
import { refreshOrMessage } from './LeaderContext/leaderContextReducer'

export const AUTH_HUB_CHANNEL = 'auth'; // this is case sensitive.
export const VERSIONS_HUB_CHANNEL = 'VersionsChannel';
export const MARKET_MESSAGE_EVENT = 'market_web_push';
export const NOTIFICATION_MESSAGE_EVENT = 'notification_web_push';
export const SOCKET_OPEN_EVENT = 'web_socket_opened';

const pongTracker = {failureCount: 0};

const WebSocketContext = React.createContext([
  {}, () => {
  },
]);

export const LAST_LOGIN_APP_VERSION = 'login_version';

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
        toastError('errorSignOutFailed');
      });
    };
    sendInfoPersistent({ id: 'noticeVersionForceLogout' }, {}, reloader);
  } else if (currentVersion !== version && !currentVersion.includes('fake')) {
    console.log(`Refreshing with current version ${currentVersion} and version ${version}`);
    // deprecated, but the simplest way to ignore cache
    const reloader = () => {
      window.location.reload(true);
    };
    sendInfoPersistent({ id: 'noticeNewApplicationVersion' }, {}, reloader);
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
  const myChannel = new BroadcastChannel(leaderChannelId);
  myChannel.onmessage = (msg) => {
    if (msg === 'refresh') {
      //Each context is setup to tell the other tabs to reload from the memory namespace
      //so refresh versions just needs to run as normal and changes will propagate
      leaderDispatch(refreshOrMessage(`leaderChannel${Date.now()}`, leaderChannelId));
    }
  }
  // we also want to always be subscribed to new app versions
  newSocket.registerHandler('UI_UPDATE_REQUIRED', () => {
    getNotifications();
  });

  newSocket.registerHandler('pong', () => {
    pongTracker.failureCount = 0;
  });

  newSocket.registerHandler('market', () => {
    leaderDispatch(refreshOrMessage(`market${Date.now()}`, leaderChannelId));
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
  const [state, setState] = useState();

  useEffect(() => {
    const lfg = new LocalForageHelper(VERSIONS_CONTEXT_NAMESPACE);
    lfg.getState().then((diskState) => {
      if (!diskState) {
        // If there is no versions on disk then I must be the first tab and too slow to wait for election results
        refreshVersions().then(() => console.info('Refreshed versions for empty disk'));
      }
    });
  },[]);

  useEffect(() => {
    const interval = setInterval((tracker, socket, refresh, myCreateSocket) => {
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
      }
    }, 300000, pongTracker, state, () => {
      refreshNotifications();
      leaderDispatch(refreshOrMessage(`visit${Date.now()}`, userId));
    }, () => createWebSocket(config, leaderDispatch, setState, userId));
    return () => clearInterval(interval);
  }, [config, leaderDispatch, state, userId]);

  useEffect(() => {
    if (!isSignedOut()) {
      createWebSocket(config, leaderDispatch, setState, userId);
    }
    return () => {};
  }, [config, leaderDispatch, userId]);

  registerListener(AUTH_HUB_CHANNEL, 'webSocketsAuth', (data) => {
    const { payload: { event } } = data;
    switch (event) {
      case 'signOut':
        if (state) {
          state.terminate();
        }
        break;
      case 'signIn':
        if (state) {
          state.terminate();
        }
        createWebSocket(config, leaderDispatch, setState);
        break;
      default:
    }
  });

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
