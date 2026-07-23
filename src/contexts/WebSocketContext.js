import React, { useCallback, useContext, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import useWebSocket from 'react-use-websocket';
import config from '../config'
import { sendInfoPersistent, toastError } from '../utils/userMessage'
import { pushMessage } from '../utils/MessageBusUtils'
import { getLoginPersistentItem, setLoginPersistentItem } from '../components/localStorageUtils'
import { isMobileDevice, isSignedOut, onSignOut } from '../utils/userFunctions'
import { ensureRefreshRunner, refreshNotifications, refreshVersionsFromPush, VERSIONS_EVENT } from '../api/versionedFetchUtils';
import { PUSH_ACCOUNT_CHANNEL, PUSH_HOME_USER_CHANNEL } from './AccountContext/accountContextMessages'
import { getLogin } from '../api/homeAccount';
import { getAppVersion } from '../api/sso';
import { MarketsContext } from './MarketsContext/MarketsContext'
import { MarketPresencesContext } from './MarketPresencesContext/MarketPresencesContext'
import {
  getMarketDetailsForType,
  getNotHiddenMarketDetailsForUser,
  marketIsDemo
} from './MarketsContext/marketsContextHelper'
import { PLANNING_TYPE } from '../constants/markets'
import { getMarketToken } from '../api/marketLogin';

const WebSocketContext = React.createContext({
  pokeAI: () => Promise.resolve(),
});

export const LAST_LOGIN_APP_VERSION = 'login_version';
export const LAST_SCRIPT_REINSTALL_VERSION = 'script_reinstall_version';

// J-all-314 the AI integration install must be re-run when scripts or rules change.
// The backend persists the version that last required a reinstall so users who skip
// that release still see the mismatch when they next return.
function notifyScriptReinstall(scriptReinstallVersion, hasNonDemoWorkspace) {
  if (!scriptReinstallVersion) {
    // no release has required a reinstall yet
    return;
  }
  const seenVersion = getLoginPersistentItem(LAST_SCRIPT_REINSTALL_VERSION);
  if (!seenVersion) {
    // a fresh install just ran the latest scripts so initialize silently
    setLoginPersistentItem(LAST_SCRIPT_REINSTALL_VERSION, scriptReinstallVersion);
    return;
  }
  // Mobile users cannot run the install command and demo only users have nothing to reinstall
  if (isMobileDevice() || !hasNonDemoWorkspace) {
    return;
  }
  if (seenVersion !== scriptReinstallVersion) {
    console.log(`Script reinstall with required version ${scriptReinstallVersion} and seen version ${seenVersion}`);
    const markSeen = () => setLoginPersistentItem(LAST_SCRIPT_REINSTALL_VERSION, scriptReinstallVersion);
    sendInfoPersistent({ id: 'noticeScriptReinstall' }, {}, markSeen);
  }
}

export function notifyNewApplicationVersion(currentVersion, cacheClearVersion, scriptReinstallVersion,
  hasNonDemoWorkspace) {
  notifyScriptReinstall(scriptReinstallVersion, hasNonDemoWorkspace);
  const { version } = config;
  // The backend persists the version that last required a cache clear so users who skip
  // that release are still signed out when they next return
  let loginVersion = getLoginPersistentItem(LAST_LOGIN_APP_VERSION);
  if (!loginVersion || loginVersion === true) {
    // initialize for fresh install or legacy storage of the boolean instead of a version
    setLoginPersistentItem(LAST_LOGIN_APP_VERSION, cacheClearVersion || currentVersion);
    loginVersion = cacheClearVersion || currentVersion;
  }
  if (cacheClearVersion && loginVersion !== cacheClearVersion) {
    console.log(`Sign out with required version ${cacheClearVersion} and login version ${loginVersion}`);
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

function checkAppVersion(hasNonDemoRef) {
  return getAppVersion().then((version) => {
    const { app_version: currentVersion, cache_clear_version: cacheClearVersion,
      script_reinstall_version: scriptReinstallVersion } = version;
    notifyNewApplicationVersion(currentVersion, cacheClearVersion, scriptReinstallVersion,
      hasNonDemoRef.current);
  }).catch(() => console.warn('Error checking version'));
}

function subscribe(sendMessage) {
  return getLogin().then((accountData) => {
    const { uclusion_token: accountToken } = accountData;
    const action = { action: 'subscribe', identity: accountToken };
    const actionString = JSON.stringify(action);
    return sendMessage(actionString);
  }).catch((error) => console.error('Error subscribing', error));
}

export function sendPokeAI(sendMessage, marketId, message) {
  return getMarketToken(marketId).then((marketToken) => {
    return sendMessage(JSON.stringify({
      action: 'poke_ai',
      identity: marketToken,
      message,
    }));
  });
}

function WebSocketProvider(props) {
  const { children, config } = props;
  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  // Ref so the websocket and interval callbacks see the latest value instead of a stale closure
  const hasNonDemoRef = useRef(false);
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  const planningDetails = getMarketDetailsForType(myNotHiddenMarketsState, marketPresencesState, PLANNING_TYPE);
  hasNonDemoRef.current = !_.isEmpty((planningDetails || []).filter((market) => !marketIsDemo(market)));
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
          cache_clear_version: cacheClearVersion,
          script_reinstall_version: scriptReinstallVersion,
          object_id: objectId, object_id_one_two: objectIdOneTwo } = JSON.parse(message.data);
        switch (event) {
          case 'pong':
            break;
          case 'UI_UPDATE_REQUIRED':
            notifyNewApplicationVersion(currentVersion, cacheClearVersion, scriptReinstallVersion,
              hasNonDemoRef.current);
            break;
          case 'user':
            pushMessage(PUSH_HOME_USER_CHANNEL, { event: VERSIONS_EVENT, version });
            break;
          case 'account':
            pushMessage(PUSH_ACCOUNT_CHANNEL, { event: VERSIONS_EVENT, version });
            break;
          case 'notification':
            // Notifications are not market objects so there is nothing to verify in storage
            refreshVersionsFromPush().then(() => console.info('Refreshed versions from notifications push'));
            refreshNotifications();
            break;
          default:
            // event_type is the object_type and object_id the market id (T-all-2259), so the
            // refresh can verify the pushed object landed and retry with backoff if not
            refreshVersionsFromPush({ objectType: event, marketId: objectId, version, objectIdOneTwo })
              .then(() => console.info('Refreshed versions from push'));
            break;
        }
      },
      // The refresh done on sign out should mean this socket will be gone
      reconnectInterval: config.webSockets.reconnectInterval,
      shouldReconnect: () => true,
      heartbeat: {
        message: 'ping',
        returnMessage: {'event_type': 'pong'},
        timeout: 60000, // 1 minute, if no response is received, the connection will be closed
        interval: 25000, // every 25 seconds, a ping message will be sent
      },
    }
  );
  const pokeAI = useCallback((marketId, message) => sendPokeAI(sendMessage, marketId, message), [sendMessage]);

  // The toast notices do not survive a refresh or page close so check on load instead of
  // leaving a gap until the first interval tick. Runs again when the user's workspaces finish
  // loading because the reinstall notice is suppressed until demo status is known. See
  // https://stage.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/Q-all-106
  const hasNonDemo = hasNonDemoRef.current;
  useEffect(() => {
    if (!isSignedOut()) {
      checkAppVersion(hasNonDemoRef);
    }
  }, [hasNonDemo]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSignedOut()) {
        // The drift runner in versionedFetchUtils already refreshes every MAX_DRIFT_TIME;
        // calling refreshVersions here too stacked a second full sync every five minutes
        // (C-all-1066). Just guarantee the runner exists (it also restarts a dead one).
        ensureRefreshRunner();
        checkAppVersion(hasNonDemoRef);
      }
    }, 300000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ pokeAI }}>
      {children}
    </WebSocketContext.Provider>
  );
}

WebSocketProvider.propTypes = {
  children: PropTypes.object,
  config: PropTypes.object.isRequired,
};

export { WebSocketContext, WebSocketProvider };
