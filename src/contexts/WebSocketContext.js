/**
 * Web socket context provider must appear within the markets context, since it needs to
 * properly update it
 */
import React, { useContext, useReducer, useState } from 'react';
import localforage from 'localforage';
import PropTypes from 'prop-types';
import WebSocketRunner from '../components/BackgroundProcesses/WebSocketRunner';
import config from '../config';
import { sendInfoPersistent, toastErrorAndThrow } from '../utils/userMessage';
import { VIEW_EVENT, VISIT_CHANNEL } from './NotificationsContext/NotificationsContext';
import { registerListener, pushMessage, removeListener } from '../utils/MessageBusUtils';
import { VersionsContext } from './VersionsContext/VersionsContext';
import { refreshVersions } from './VersionsContext/versionsContextHelper';

export const AUTH_HUB_CHANNEL = 'auth'; // this is case sensitive.
export const VERSIONS_HUB_CHANNEL = 'VersionsChannel';
export const MARKET_MESSAGE_EVENT = 'market_web_push';
export const NOTIFICATION_MESSAGE_EVENT = 'notification_web_push';
export const SOCKET_OPEN_EVENT = 'web_socket_opened';

const WebSocketContext = React.createContext([
  {}, () => {
  },
]);

export function notifyNewApplicationVersion(currentVersion, cacheClear) {
  const { version } = config;
  // if we don't have any version stored, we're either in dev, or we've dumped our data
  if (currentVersion !== version && !currentVersion.includes('fake')) {
    console.debug(`Current version: ${version}. Upgrading to version: ${currentVersion}`);
    if (cacheClear) {
      localforage.clear().then(() => {
        console.info('Clearing cache');
        const reloader = () => {
          window.location.reload(true);
        };
        sendInfoPersistent({ id: 'noticeNewApplicationVersion' }, {}, reloader);
      }).catch((error) => toastErrorAndThrow(error, 'noticeNewApplicationVersion'));
    } else {
      // deprecated, but the simplest way to ignore cache
      const reloader = () => {
        window.location.reload(true);
      };
      sendInfoPersistent({ id: 'noticeNewApplicationVersion' }, {}, reloader);
    }
  }
}

function WebSocketProvider(props) {
  const { children, config } = props;
  const [state, setState] = useState();
  const [socketListener, setSocketListener] = useState();
  const [versionsState] = useContext(VersionsContext);
  const [, connectionCheckTimerDispatch] = useReducer((state, action) => {
    const { timer } = state;
    if (timer) {
      console.debug('Clearing socket pong timer');
      clearTimeout(timer);
    }
    const { pongTimer } = action;
    if (pongTimer) {
      return { timer: pongTimer };
    }
    return {};
  }, {});

  function createWebSocket() {
    console.debug('Creating new websocket');
    const { webSockets } = config;
    const sockConfig = { wsUrl: webSockets.wsUrl, reconnectInterval: webSockets.reconnectInterval };
    const newSocket = new WebSocketRunner(sockConfig);
    // this will incidentally subscribe to the identity
    newSocket.connect();
    // we also want to always be subscribed to new app versions
    newSocket.registerHandler('UI_UPDATE_REQUIRED', (message) => {
      const { app_version: appVersion, requires_cache_clear: cacheClear } = message;
      notifyNewApplicationVersion(appVersion, cacheClear);
    });

    newSocket.registerHandler('pong', () => {
      connectionCheckTimerDispatch({});
    });

    newSocket.registerHandler('market', (message) => {
      refreshVersions(versionsState);
    });
    newSocket.registerHandler('investible', (message) => {
      refreshVersions(versionsState);
    });
    newSocket.registerHandler('market_investible', (message) => {
      refreshVersions(versionsState);
    });
    newSocket.registerHandler('comment', (message) => {
      refreshVersions(versionsState);
    });
    newSocket.registerHandler('market_capability', (message) => {
      refreshVersions(versionsState);
    });
    newSocket.registerHandler('investment', (message) => {
      refreshVersions(versionsState);
    });

    newSocket.registerHandler('notification', (message) => {
      pushMessage(
        VERSIONS_HUB_CHANNEL,
        {
          event: NOTIFICATION_MESSAGE_EVENT,
          message,
        },
      );
    });

    // we need to subnscribe to our identity, but that requires reworking subscribe
    // newSocket.subscribe
    return newSocket;
  }

  registerListener(AUTH_HUB_CHANNEL, 'webSocketsAuth', (data) => {
    const { payload: { event } } = data;
    console.debug(`Web Sockets context responding to auth event ${event}`);
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
        console.debug(`Ignoring auth event ${event}`);
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
              if (isEntry) {
                if (newSocket.getSocketState() === WebSocket.OPEN
                  && (Date.now() - newSocket.getSocketLastSentTime()) > 5000) {
                  console.debug('Pong');
                  const actionString = JSON.stringify({ action: 'ping' });
                  newSocket.send(actionString);
                  const pongTimer = setTimeout((socket, setSocket) => {
                    console.debug('Terminating socket connection');
                    socket.terminate();
                    setSocket(undefined);
                  }, 5000, newSocket, setState);
                  connectionCheckTimerDispatch({ pongTimer });
                }
              }
              break;
            }
            default:
              console.debug(`Ignoring event ${event}`);
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
