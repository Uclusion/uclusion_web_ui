import ReconnectingWebSocket from 'reconnecting-websocket';
import { SOCKET_OPEN_EVENT, VERSIONS_HUB_CHANNEL } from '../../contexts/WebSocketContext';
import { pushMessage } from '../../utils/MessageBusUtils';
import { getLogin } from '../../api/homeAccount';

/**
 * Class which fires and manages a websocket connection to the server.
 * It may need to become a service worker
 */

class WebSocketRunner {
  constructor(config) {
    this.wsUrl = config.wsUrl;
    this.reconnectInterval = config.reconnectInterval;
    this.messageHandlers = [];
    this.registerHandler = this.registerHandler.bind(this);
    this.lastSentTime = Date.now(); // Otherwise we might never be given a chance to get going
  }

  getMessageHandler() {
    const handlerFinder = (event) => {
      const message = JSON.parse(event.data);
      const { event_type } = message;
      const handlerEntry = this.messageHandlers.find((entry) => entry.type === event_type);
      if (handlerEntry) {
        return handlerEntry.handler(message);
      }
      return () => {};
    };
    return handlerFinder.bind(this);
  }

  registerHandler(messageType, handler) {
    // // console.debug(`Registering handler for ${messageType}`);
    this.messageHandlers.push({ type: messageType, handler });
  }

  subscribe() {
    return getLogin().then((accountData) => {
      const { uclusion_token: accountToken } = accountData;
      const action = { action: 'subscribe', identity: accountToken };
      if (this.socket.readyState === WebSocket.OPEN) {
        const actionString = JSON.stringify(action);
        this.socket.send(actionString);
      }
    }).catch(() => console.warn('Error subscribing'));
  }


  onOpenFactory() {
    const factory = () => {
      this.subscribe();
      pushMessage(
        VERSIONS_HUB_CHANNEL,
        {
          event: SOCKET_OPEN_EVENT,
        },
      );
    };
    return factory.bind(this);
  }

  connect() {
    if (this.socket) {
      this.socket.close();
    }
    this.socket = new ReconnectingWebSocket(this.wsUrl);
    this.socket.addEventListener('open', this.onOpenFactory());
    this.socket.addEventListener('message', this.getMessageHandler());
  }

  getSocketState() {
    return this.socket.readyState;
  }

  getSocketLastSentTime() {
    return this.lastSentTime;
  }

  send(message) {
    this.lastSentTime = Date.now();
    this.socket.send(message);
  }

  terminate() {
    // close the socket
    this.socket.close();
  }
}

export default WebSocketRunner;
