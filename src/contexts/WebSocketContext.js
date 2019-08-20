/**
 * Web socket context provider must appear within the markets context, since it needs to
 * properly update it
 */
import React, { useState } from 'react';
import useMarketsContext from './useMarketsContext';
import { Hub } from 'aws-amplify';
import WebSocketRunner from '../components/BackgroundProcesses/WebSocketRunner';
import AmplifyIdentitySource from '../authorization/AmplifyIdentitySource';
import { notifyNewApplicationVersion } from '../utils/postAuthFunctions';

const WebSocketContext = React.createContext([{}, () => {}]);
const AUTH_HUB_CHANNEL = 'auth';

function WebSocketProvider(props) {

  const { children, config } = props;
  const [state, setState] = useState();
  const { refreshMarkets } = useMarketsContext();

  function createWebSocket() {
    const { webSockets } = config;
    const sockConfig = { wsUrl: webSockets.wsUrl, reconnectInterval: webSockets.reconnectInterval };
    const newSocket = new WebSocketRunner(sockConfig);
    newSocket.connect();
    // we always want to be notified when changes happen to our identity
    new AmplifyIdentitySource().getIdentity().then((identity) => {
      newSocket.registerHandler('IDENTITY_UPDATED', () => {
        return refreshMarkets();
      });
      newSocket.subscribe(identity);
    });
    // we also want to always be subscribed to new app versions
    newSocket.registerHandler('UI_UPDATE_REQUIRED', (message) => {
      const { payload } = message;
      const { deployed_version } = payload;
      notifyNewApplicationVersion(deployed_version);
    });
    //we need to subscribe to our identity, but that requires reworking subscribe
    //newSocket.subscribe
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

export { WebSocketContext, WebSocketProvider };
