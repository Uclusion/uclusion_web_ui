/**
 * Web socket context provider must appear within the markets context, since it needs to
 * properly update it
 */
import React, { useState } from 'react';
import { Hub } from 'aws-amplify';
import PropTypes from 'prop-types';
import WebSocketRunner from '../components/BackgroundProcesses/WebSocketRunner';
import AmplifyIdentityTokenRefresher from '../authorization/AmplifyIdentityTokenRefresher';
import config from '../config';
import { sendInfoPersistent } from '../utils/userMessage';

export const AUTH_HUB_CHANNEL = 'auth'; // this is case sensitive.
export const VERSIONS_HUB_CHANNEL = 'VersionsChannel';
export const MARKET_MESSAGE_EVENT = 'market_web_push';
export const NOTIFICATION_MESSAGE_EVENT = 'notification_web_push';
export const SOCKET_OPEN_EVENT = 'web_socket_opened';

const WebSocketContext = React.createContext([{}, () => {}]);
function notifyNewApplicationVersion(currentVersion) {
  const { version } = config;
  // if we don't have any version stored, we're either in dev, or we've dumped our data
  if (currentVersion !== version) {
    console.debug(`Current version: ${version}`);
    console.debug(`Upgrading to version: ${currentVersion}`);
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

  function createWebSocket() {
    const { webSockets } = config;
    const sockConfig = { wsUrl: webSockets.wsUrl, reconnectInterval: webSockets.reconnectInterval };
    const newSocket = new WebSocketRunner(sockConfig);
    newSocket.connect();
    // we always want to be notified when changes happen to our identity
    new AmplifyIdentityTokenRefresher().getIdentity().then((identity) => {
      newSocket.subscribe(identity);
    });
    // we also want to always be subscribed to new app versions
    newSocket.registerHandler('UI_UPDATE_REQUIRED', (message) => {
      const { payload } = message;
      // eslint-disable-next-line camelcase
      const { deployed_version } = payload;
      notifyNewApplicationVersion(deployed_version);
    });

    newSocket.registerHandler('market', (message) => {
      Hub.dispatch(
        VERSIONS_HUB_CHANNEL,
        {
          event: MARKET_MESSAGE_EVENT,
          message,
        },
      );
    });

    newSocket.registerHandler('notification', (message) => {
      Hub.dispatch(
        VERSIONS_HUB_CHANNEL,
        {
          event: NOTIFICATION_MESSAGE_EVENT,
          message,
        },
      );
    });

    newSocket.registerHandler('USER_LEFT_MARKET', (message) => {
      // since we left, going to fake remove event to the versions message channel
      Hub.dispatch(
        VERSIONS_HUB_CHANNEL,
        {
          event: MARKET_MESSAGE_EVENT,
          message: {
            version: -1, // < 0 will trigger a remove
            object_id: message.indirect_object_id,
          },
        },
      );
    });

    // we need to subscribe to our identity, but that requires reworking subscribe
    // newSocket.subscribe
    return newSocket;
  }

  Hub.listen(AUTH_HUB_CHANNEL, (data) => {
    const { payload: { event } } = data;
    console.debug(`Web Sockets context responding to auth event ${event}`);
    switch (event) {
      case 'signOut':
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
    setState(createWebSocket());
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
