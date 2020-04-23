/**
 * Web socket context provider must appear within the markets context, since it needs to
 * properly update it
 */
import React, { useReducer, useState } from 'react'
import PropTypes from 'prop-types'
import WebSocketRunner from '../components/BackgroundProcesses/WebSocketRunner'
import config from '../config'
import { sendInfoPersistent, toastError } from '../utils/userMessage'
import { VIEW_EVENT, VISIT_CHANNEL } from './NotificationsContext/NotificationsContext'
import { pushMessage, registerListener, removeListener } from '../utils/MessageBusUtils'
import {
  NOTIFICATIONS_HUB_CHANNEL,
  refreshNotifications,
  refreshVersions
} from './VersionsContext/versionsContextHelper'
import { getLoginPersistentItem, setLoginPersistentItem } from '../components/utils'
import { Auth } from 'aws-amplify'
import { getNotifications } from '../api/summaries'

export const AUTH_HUB_CHANNEL = 'auth'; // this is case sensitive.
export const VERSIONS_HUB_CHANNEL = 'VersionsChannel';
export const MARKET_MESSAGE_EVENT = 'market_web_push';
export const NOTIFICATION_MESSAGE_EVENT = 'notification_web_push';
export const SOCKET_OPEN_EVENT = 'web_socket_opened';
export const REMOVE_EVENT = 'remove_push';

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
    const reloader = () => {
      Auth.signOut().then(() => setLoginPersistentItem(LAST_LOGIN_APP_VERSION, cacheClearVersion))
        .catch((error) => {
          console.error(error);
          toastError('errorSignOutFailed');
        });
    }
    sendInfoPersistent({ id: 'noticeVersionForceLogout' }, {}, reloader);
  } else if (currentVersion !== version && !currentVersion.includes('fake')) {
    // deprecated, but the simplest way to ignore cache
    const reloader = () => {
      window.location.reload(true);
    };
    sendInfoPersistent({ id: 'noticeNewApplicationVersion' }, {}, reloader);
  }
}

function WebSocketProvider(props) {
  const { children, config } = props;
  const [state, setState] = useState();
  const [socketListener, setSocketListener] = useState();
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

  function createWebSocket() {
    // console.debug('Creating new websocket');
    const { webSockets } = config;
    const sockConfig = { wsUrl: webSockets.wsUrl, reconnectInterval: webSockets.reconnectInterval };
    const newSocket = new WebSocketRunner(sockConfig);
    // this will incidentally subscribe to the identity
    newSocket.connect();
    // we also want to always be subscribed to new app versions
    newSocket.registerHandler('UI_UPDATE_REQUIRED', (message) => {
      getNotifications();
    });

    newSocket.registerHandler('pong', () => {
      connectionCheckTimerDispatch({});
    });

    newSocket.registerHandler('market', (message) => {
      refreshVersions();
    });
    newSocket.registerHandler('investible', (message) => {
      refreshVersions();
    });
    newSocket.registerHandler('market_investible', (message) => {
      refreshVersions();
    });
    newSocket.registerHandler('comment', (message) => {
      refreshVersions();
    });
    newSocket.registerHandler('market_capability', (message) => {
      refreshVersions();
    });
    newSocket.registerHandler('investment', (message) => {
      refreshVersions();
    });

    newSocket.registerHandler('notification', (message) => {
      const { hkey, rkey } = message;
      if (hkey && rkey) {
        pushMessage(
          NOTIFICATIONS_HUB_CHANNEL,
          {
            event: REMOVE_EVENT,
            hkey,
            rkey,
          },
        );
      } else {
        // Try to be up to date before we push the notification out (which might need new data)
        refreshVersions();
        pushMessage(
          VERSIONS_HUB_CHANNEL,
          {
            event: NOTIFICATION_MESSAGE_EVENT,
            message,
          },
        );
      }
    });

    // Go ahead and get the latest when bring up a new socket since you may not have been listening
    refreshVersions();
    refreshNotifications();

    // we need to subscribe to our identity, but that requires reworking subscribe
    // newSocket.subscribe
    return newSocket;
  }

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
  if (!state) {
    Promise.resolve(createWebSocket())
      .then((newSocket) => {
        setState(newSocket);
        if (socketListener) {
          // Prevent zombies and no API to remove by listener name for some reason
          removeListener(VISIT_CHANNEL, 'webSocketPongTimer');
        }
        const myListener = (data) => {
          if (!data) {
            return;
          }
          const { payload: { event, message } } = data;
          switch (event) {
            case VIEW_EVENT: {
              const { isEntry } = message;
              if (isEntry && (Date.now() - newSocket.getSocketLastSentTime()) > 5000) {
                // console.debug('Pong and refresh');
                // Otherwise if we miss a push out of luck until tab is closed
                refreshVersions();
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
