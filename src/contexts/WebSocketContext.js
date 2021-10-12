/**
 * Web socket context provider must appear within the markets context, since it needs to
 * properly update it
 */
import React, { useContext, useEffect, useReducer, useState } from 'react'
import PropTypes from 'prop-types'
import WebSocketRunner from '../components/BackgroundProcesses/WebSocketRunner'
import config from '../config'
import { sendInfoPersistent, toastError } from '../utils/userMessage'
import { registerListener } from '../utils/MessageBusUtils'
import { refreshNotifications, refreshVersions } from './VersionsContext/versionsContextHelper'
import { getLoginPersistentItem, setLoginPersistentItem } from '../components/localStorageUtils'
import { getNotifications } from '../api/summaries'
import { onSignOut } from '../utils/userFunctions'
import { LEADER_CHANNEL, LeaderContext } from './LeaderContext/LeaderContext'
import { BroadcastChannel } from 'broadcast-channel'
import { VIEW_EVENT, VISIT_CHANNEL } from '../utils/marketIdPathFunctions'
import LocalForageHelper from '../utils/LocalForageHelper'
import { VERSIONS_CONTEXT_NAMESPACE } from './VersionsContext/versionsContextReducer'

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
  const [pegRefresh, setPegRefresh] = useState();
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
    const lfg = new LocalForageHelper(VERSIONS_CONTEXT_NAMESPACE);
    lfg.getState().then((diskState) => {
      if (!diskState) {
        // If there is no versions on disk then I must be the first tab and too slow to wait for election results
        refreshVersions().then(() => console.info('Refreshed versions for empty disk'));
      }
    });
  },[]);

  useEffect(() => {
    function myRefreshVersion(peg, amLeader) {
      if (amLeader) {
        refreshVersions().then(() => console.info(`Refreshed versions from ${peg}`));
      } else if (amLeader !== undefined && !peg.includes('leaderChannel')) {
        console.info(`Not leader sending refresh from ${peg}`);
        const myChannel = new BroadcastChannel(LEADER_CHANNEL);
        myChannel.postMessage('refresh').then(() => myChannel.close());
      }
    }
    myRefreshVersion(pegRefresh, isLeader);
    return () => {};
  }, [pegRefresh, isLeader]);

  useEffect(() => {
    function createWebSocket() {
      console.info('Creating new websocket');
      const { webSockets } = config;
      const sockConfig = { wsUrl: webSockets.wsUrl, reconnectInterval: webSockets.reconnectInterval };
      const newSocket = new WebSocketRunner(sockConfig);
      // this will incidentally subscribe to the identity
      newSocket.connect();
      const myChannel = new BroadcastChannel(LEADER_CHANNEL);
      myChannel.onmessage = (msg) => {
        if (msg === 'refresh') {
          //Each context is setup to tell the other tabs to reload from the memory namespace
          //so refresh versions just needs to run as normal and changes will propagate
          setPegRefresh(`leaderChannel${Date.now()}`);
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
        setPegRefresh(`market${Date.now()}`);
      });
      newSocket.registerHandler('investible', () => {
        setPegRefresh(`investible${Date.now()}`);
      });
      newSocket.registerHandler('market_investible', () => {
        setPegRefresh(`marketInvestible${Date.now()}`);
      });
      newSocket.registerHandler('comment', () => {
        setPegRefresh(`comment${Date.now()}`);
      });
      newSocket.registerHandler('stage', () => {
        setPegRefresh(`stage${Date.now()}`);
      });
      newSocket.registerHandler('market_capability', () => {
        setPegRefresh(`marketCapability${Date.now()}`);
      });
      newSocket.registerHandler('investment', () => {
        setPegRefresh(`investment${Date.now()}`);
      });
      // Go ahead and get the latest when bring up a new socket since you may not have been listening
      setPegRefresh(`initialized${Date.now()}`);
      refreshNotifications();

      newSocket.registerHandler('notification', () => {
        // Try to be up to date before we push the notification out (which might need new data)
        setPegRefresh(`notification${Date.now()}`);
        refreshNotifications();
      });

      // we need to subscribe to our identity, but that requires reworking subscribe
      // newSocket.subscribe
      return newSocket;
    }
    function initialize() {
      Promise.resolve(createWebSocket())
        .then((newSocket) => {
          setState(newSocket);
          const myListener = (data) => {
            if (!data) {
              return;
            }
            const { payload: { event, message } } = data;
            switch (event) {
              case VIEW_EVENT: {
                const { isEntry } = message;
                if (isEntry && (Date.now() - newSocket.getSocketLastSentTime()) > 30000) {
                  // Otherwise if we miss a push out of luck until tab is closed
                  setPegRefresh(`visit${Date.now()}`);
                  refreshNotifications();
                  if (newSocket.getSocketState() === WebSocket.OPEN) {
                    const actionString = JSON.stringify({ action: 'ping' });
                    newSocket.send(actionString);
                    const pongTimer = setTimeout((socket, setSocket) => {
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
  }, [config]);

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
          setState(undefined);
        }
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
