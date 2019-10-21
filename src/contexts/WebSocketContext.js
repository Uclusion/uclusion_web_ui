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

export const AUTH_HUB_CHANNEL = 'Auth';
export const NOTIFICATIONS_HUB_CHANNEL = 'NotificationsChannel';
export const PUSH_CONTEXT_CHANNEL = 'MarketsChannel';
export const PUSH_COMMENTS_CHANNEL = 'CommentsChannel';
export const PUSH_INVESTIBLES_CHANNEL = 'InvestiblesChannel';
export const PUSH_PRESENCE_CHANNEL = 'PresenceChannel';
export const MESSAGES_EVENT = 'web_push';
export const INVITED_TO_NEW_MARKET_EVENT = 'invited_to_new_market';

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

function registerChannel(socket, messageType, channel) {
  socket.registerHandler(messageType, (message) => {
    Hub.dispatch(
      channel,
      {
        event: MESSAGES_EVENT,
        message,
      },
    );
    if (messageType !== 'USER_MESSAGES_UPDATED') {
      Hub.dispatch(
        NOTIFICATIONS_HUB_CHANNEL,
        {
          event: MESSAGES_EVENT,
          message,
        },
      );
    }
  });
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

    registerChannel(newSocket, 'USER_MESSAGES_UPDATED', NOTIFICATIONS_HUB_CHANNEL);
    registerChannel(newSocket, 'INVESTIBLE_COMMENT_UPDATED', PUSH_COMMENTS_CHANNEL);
    registerChannel(newSocket, 'MARKET_INVESTIBLE_UPDATED', PUSH_INVESTIBLES_CHANNEL);
    registerChannel(newSocket, 'MARKET_UPDATED', PUSH_CONTEXT_CHANNEL);
    newSocket.registerHandler('USER_UPDATED', (message) => {
      Hub.dispatch(
        PUSH_CONTEXT_CHANNEL,
        {
          event: INVITED_TO_NEW_MARKET_EVENT,
          message,
        },
      );
      Hub.dispatch(
        PUSH_PRESENCE_CHANNEL,
        {
          event: MESSAGES_EVENT,
          message,
        },
      );
      Hub.dispatch(
        NOTIFICATIONS_HUB_CHANNEL,
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
