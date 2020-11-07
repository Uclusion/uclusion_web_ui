/**
 * Web socket context provider must appear within the markets context, since it needs to
 * properly update it
 */
import React, { useContext, useEffect, useReducer, useState } from 'react'
import PropTypes from 'prop-types'
import WebSocketRunner from '../components/BackgroundProcesses/WebSocketRunner'
import config from '../config'
import { sendInfoPersistent, toastError } from '../utils/userMessage'
import { VIEW_EVENT, VISIT_CHANNEL } from './NotificationsContext/NotificationsContext'
import { registerListener } from '../utils/MessageBusUtils'
import { refreshNotifications, refreshVersions } from './VersionsContext/versionsContextHelper'
import { getLoginPersistentItem, setLoginPersistentItem } from '../components/utils'
import { getNotifications } from '../api/summaries'
import { onSignOut } from '../utils/userFunctions'
import { LEADER_CHANNEL, LeaderContext } from './LeaderContext/LeaderContext'
import { BroadcastChannel } from 'broadcast-channel'

export const AUTH_HUB_CHANNEL = 'auth'; // this is case sensitive.
export const VERSIONS_HUB_CHANNEL = 'VersionsChannel';
export const MARKET_MESSAGE_EVENT = 'market_web_push';
export const NOTIFICATION_MESSAGE_EVENT = 'notification_web_push';
export const SOCKET_OPEN_EVENT = 'web_socket_opened';


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

function WebSocketProvider(props) {
  const { children, config } = props;
  const [leaderState] = useContext(LeaderContext);
  const { isLeader } = leaderState;
  const [state, setState] = useState();
  const [, setSocketListener] = useState();
  const [, connectionCheckTimerDispatch] = useReducer((state, action) => {
    const { timer } = state;
    if (timer) {
      // console.debug('Clearing socket pong timer');
      clearTimeout(timer);
    }
    const { pongTimer } = action;
    if (pongTimer) {
      return { timer: pongTimer };
    }
    return {};
  }, {});

  useEffect(() => {
    function myRefreshVersion() {
      if (isLeader) {
        refreshVersions().then(() => console.info('Refreshed versions'));
      } else if (isLeader !== undefined) {
        console.info('Not leader sending refresh');
        const myChannel = new BroadcastChannel(LEADER_CHANNEL);
        myChannel.postMessage('refresh').then(() => myChannel.close());
      }
    }
    function createWebSocket() {
      // console.debug('Creating new websocket');
      const { webSockets } = config;
      const sockConfig = { wsUrl: webSockets.wsUrl, reconnectInterval: webSockets.reconnectInterval };
      const newSocket = new WebSocketRunner(sockConfig);
      // this will incidentally subscribe to the identity
      newSocket.connect();
      const myChannel = new BroadcastChannel(LEADER_CHANNEL);
      myChannel.onmessage = (msg) => {
        if (msg === 'refresh' && isLeader) {
          //Each context is setup to tell the other tabs to reload from the memory namespace
          //so refresh versions just needs to run as normal and changes will propagate
          refreshVersions().then(() => console.info('Refreshed versions from message'));
        }
      }
      // we also want to always be subscribed to new app versions
      newSocket.registerHandler('UI_UPDATE_REQUIRED', () => {
        getNotifications();
      });

      newSocket.registerHandler('pong', () => {
        connectionCheckTimerDispatch({});
      });

      newSocket.registerHandler('market', () => {
        myRefreshVersion();
      });
      newSocket.registerHandler('investible', () => {
        myRefreshVersion();
      });
      newSocket.registerHandler('market_investible', () => {
        myRefreshVersion();
      });
      newSocket.registerHandler('comment', () => {
        myRefreshVersion();
      });
      newSocket.registerHandler('stage', () => {
        myRefreshVersion();
      });
      newSocket.registerHandler('market_capability', () => {
        myRefreshVersion();
      });
      newSocket.registerHandler('investment', () => {
        myRefreshVersion();
      });
      // Go ahead and get the latest when bring up a new socket since you may not have been listening
      myRefreshVersion();
      refreshNotifications();

      newSocket.registerHandler('notification', () => {
        // Try to be up to date before we push the notification out (which might need new data)
        myRefreshVersion();
        refreshNotifications();
      });

      // we need to subscribe to our identity, but that requires reworking subscribe
      // newSocket.subscribe
      return newSocket;
    }
    function initialize() {
      console.info(`Initializing web socket with leader ${isLeader}`);
      Promise.resolve(createWebSocket())
        .then((newSocket) => {
          setState(newSocket);
          const myListener = (data) => {
            console.info('Web socket responding to visit');
            if (!data) {
              return;
            }
            const { payload: { event, message } } = data;
            switch (event) {
              case VIEW_EVENT: {
                const { isEntry } = message;
                if (isEntry && (Date.now() - newSocket.getSocketLastSentTime()) > 30000) {
                  // console.debug('Pong and refresh');
                  // Otherwise if we miss a push out of luck until tab is closed
                  myRefreshVersion();
                  refreshNotifications();
                  if (newSocket.getSocketState() === WebSocket.OPEN) {
                    const actionString = JSON.stringify({ action: 'ping' });
                    newSocket.send(actionString);
                    const pongTimer = setTimeout((socket, setSocket) => {
                      // console.debug('Terminating socket connection');
                      socket.terminate();
                      setSocket(undefined);
                    }, 5000, newSocket, setState);
                    connectionCheckTimerDispatch({ pongTimer });
                  }
                }
                break;
              }
              default:
              // console.debug(`Ignoring event ${event}`);
            }
          };
          registerListener(VISIT_CHANNEL, 'webSocketPongTimer', myListener);
          setSocketListener(myListener);
        });
    }
    initialize();
    return () => {};
  }, [config, isLeader]);

  registerListener(AUTH_HUB_CHANNEL, 'webSocketsAuth', (data) => {
    const { payload: { event } } = data;
    // console.debug(`Web Sockets context responding to auth event ${event}`);
    switch (event) {
      case 'signOut':
        if (state) {
          state.terminate();
        }
        break;
      case 'signIn':
        if (state) {
          state.terminate();
          setState(undefined);
        }
        break;
      default:
        // console.debug(`Ignoring auth event ${event}`);
    }
  });

  return (
    <WebSocketContext.Provider value={[state, setState]}>
      {children}
    </WebSocketContext.Provider>
  );
}

WebSocketProvider.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types,react/require-default-props
  children: PropTypes.object,
  // eslint-disable-next-line react/forbid-prop-types
  config: PropTypes.object.isRequired,
};

export { WebSocketContext, WebSocketProvider };
