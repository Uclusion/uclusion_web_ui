import _ from 'lodash';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { Hub } from 'aws-amplify';
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../utils';
import { SOCKET_OPEN_EVENT, VERSIONS_HUB_CHANNEL } from '../../contexts/WebSocketContext';

/**
 * Class which fires and manages a websocket connection to the server.
 * It may need to become a service worker
 */
const localStorageKey = 'websocket_subscriptions';

class WebSocketRunner {
  constructor(config) {
    this.wsUrl = config.wsUrl;
    this.reconnectInterval = config.reconnectInterval;
    this.subscribeQueue = [];
    this.messageHandlers = [];
    this.registerHandler = this.registerHandler.bind(this);
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
    // console.debug(`Registering handler for ${messageType}`);
    this.messageHandlers.push({ type: messageType, handler });
  }

  subscribe(identity) {
    const action = { action: 'subscribe', identity };
    // push the action onto the subscribe queue so if we reconnect we'll track it
    this.subscribeQueue.push(action);
    // if socket is open, just go ahead and send it
    if (this.socket.readyState === WebSocket.OPEN) {
      const actionString = JSON.stringify(action);
      this.socket.send(actionString);
    }
    // compact the queue to remove duplicates
    const compacted = _.uniqWith(this.subscribeQueue, _.isEqual);
    this.subscribeQueue = compacted;
    // console.debug('Subscribe queue at end of subscribe:', JSON.stringify(this.subscribeQueue));
    this.storeSubscribeQueue();
  }

  loadSubscribeQueue() {
    this.subscribeQueue = getUclusionLocalStorageItem(localStorageKey);
    if (!this.subscribeQueue) {
      this.subscribeQueue = [];
    }
  }

  storeSubscribeQueue() {
    setUclusionLocalStorageItem(localStorageKey, this.subscribeQueue);
  }

  onOpenFactory() {
    // we have to assign queue this to prevent the handler's
    // this from being retargeted to the websocket
    this.loadSubscribeQueue();
    const queue = this.subscribeQueue;
    // console.debug('Subcribing to:', queue);
    const factory = () => {
      // console.debug('Here in open factory with queue:', JSON.stringify(queue));
      // console.debug('My socket is:', this.socket);
      queue.forEach((action) => {
        const actionString = JSON.stringify(action);
        this.socket.send(actionString);
      });
      Hub.dispatch(
        VERSIONS_HUB_CHANNEL,
        {
          event: SOCKET_OPEN_EVENT,
        },
      );
      // we're not emptying the queue because we might need it on reconnect
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

  send(message) {
    this.socket.send(message);
  }

  terminate() {
    // close the socket
    this.socket.close();
  }
}

export default WebSocketRunner;
