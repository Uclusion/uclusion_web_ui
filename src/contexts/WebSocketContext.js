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

export const AUTH_HUB_CHANNEL = 'auth';
export const PUSH_HUB_CHANNEL = 'MessagesChannel';
export const PUSH_IDENTITY_CHANNEL = 'MarketsChannel';
export const PUSH_COMMENTS_CHANNEL = 'CommentsChannel';
export const MESSAGES_EVENT = 'webPush';
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
      newSocket.registerHandler('IDENTITY_UPDATED', (message) => {
        Hub.dispatch(
          PUSH_IDENTITY_CHANNEL,
          {
            event: MESSAGES_EVENT,
            message,
          },
        );
      });
      newSocket.subscribe(identity);
    });
    // we also want to always be subscribed to new app versions
    newSocket.registerHandler('UI_UPDATE_REQUIRED', (message) => {
      const { payload } = message;
      // eslint-disable-next-line camelcase
      const { deployed_version } = payload;
      notifyNewApplicationVersion(deployed_version);
    });

    newSocket.registerHandler('USER_MESSAGES_UPDATED', (message) => {
      Hub.dispatch(
        PUSH_HUB_CHANNEL,
        {
          event: MESSAGES_EVENT,
          message,
        },
      );
    });

    newSocket.registerHandler('INVESTIBLE_COMMENT_UPDATED', (message) => {
      Hub.dispatch(
        PUSH_COMMENTS_CHANNEL,
        {
          event: MESSAGES_EVENT,
          message,
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
