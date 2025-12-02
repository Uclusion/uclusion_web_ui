import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import useWebSocket from 'react-use-websocket';
import config from '../config'
import { sendInfoPersistent, toastError } from '../utils/userMessage'
import { pushMessage } from '../utils/MessageBusUtils'
import { getLoginPersistentItem, setLoginPersistentItem } from '../components/localStorageUtils'
import { isSignedOut, onSignOut } from '../utils/userFunctions'
import { refreshNotifications, refreshVersions, VERSIONS_EVENT } from '../api/versionedFetchUtils';
import { PUSH_ACCOUNT_CHANNEL, PUSH_HOME_USER_CHANNEL } from './AccountContext/accountContextMessages'
import { getLogin } from '../api/homeAccount';
import { getAppVersion } from '../api/sso';

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
        toastError(error, 'errorSignOutFailed');
      });
    };
    sendInfoPersistent({ id: 'noticeVersionForceLogout' }, {}, reloader);
  } else if (currentVersion !== version && !currentVersion.includes('fake')) {
    console.log(`Refreshing with current version ${currentVersion} and version ${version}`);
    sendInfoPersistent({ id: 'noticeNewApplicationVersion' }, {});
  }
}

function subscribe(sendMessage) {
  return getLogin().then((accountData) => {
    const { uclusion_token: accountToken } = accountData;
    const action = { action: 'subscribe', identity: accountToken };
    const actionString = JSON.stringify(action);
    return sendMessage(actionString);
  }).catch((error) => console.error('Error subscribing', error));
}

function WebSocketProvider(props) {
  const { children, config } = props;
  const { sendMessage } = useWebSocket(
    config.webSockets.wsUrl,
    {
      onOpen: () => {
        // Safe because this provider not instantiated until user is loaded
        subscribe(sendMessage);
      },
      onMessage: (message) => {
        console.info('WebSocket message received', message);
        const { event_type: event, version, app_version: currentVersion, 
          requires_cache_clear: cacheClearVersion} = JSON.parse(message.data);
        switch (event) {
          case 'pong':
            break;
          case 'UI_UPDATE_REQUIRED':
            notifyNewApplicationVersion(currentVersion, cacheClearVersion);
            break;
          case 'user':
            pushMessage(PUSH_HOME_USER_CHANNEL, { event: VERSIONS_EVENT, version });
            break;
          case 'account':
            pushMessage(PUSH_ACCOUNT_CHANNEL, { event: VERSIONS_EVENT, version });
            break;
          case 'notification':
            refreshVersions().then(() => console.info('Refreshed versions from notifications push'));
            refreshNotifications();
            break;
          default:
            refreshVersions().then(() => console.info('Refreshed versions from push'));
            break;
        }
      },
      // The refresh done on sign out should mean this socket will be gone
      reconnectInterval: config.reconnectInterval,
      heartbeat: {
        message: 'ping',
        returnMessage: 'pong',
        timeout: 60000, // 1 minute, if no response is received, the connection will be closed
        interval: 25000, // every 25 seconds, a ping message will be sent
      },
    }
  );

  useEffect(() => {
    const interval = setInterval((refresh) => { ;
      if (!isSignedOut()) {
        refresh();
        getAppVersion().then((version) => {
          const { app_version: currentVersion, requires_cache_clear: cacheClearVersion } = version;
          notifyNewApplicationVersion(currentVersion, cacheClearVersion);
        }).catch(() => console.warn('Error checking version'));
      }
    }, 300000, ()=>refreshVersions().then(() => console.info('Refreshed versions from interval')));
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <WebSocketContext.Provider>
      {children}
    </WebSocketContext.Provider>
  );
}

WebSocketProvider.propTypes = {
  children: PropTypes.object,
  config: PropTypes.object.isRequired,
};

export { WebSocketContext, WebSocketProvider };
