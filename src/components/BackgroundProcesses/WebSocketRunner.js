import _ from 'lodash';
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../utils';

/**
 * Class which fires and manages a websocket connection to the server. It may need to become a service worker
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

  /**
   * Subscribes the given user id to the subscriptions described in the subscriptions object
   * subscriptions is an object of a form similar to
   * {market_id: marketId, investible_id: investibleId ...}
   * @param userId the user id to subscribe with
   * @param subscriptions the object ids to subscribe too
   */
  subscribe(identity) {
    const action = { action: 'subscribe', identity};
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

  unsubscribeAll() {
    this.subscribeQueue = [];
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
    const factory = (event) => {
      // console.debug('Here in open factory with queue:', JSON.stringify(queue));
      // console.debug('My socket is:', this.socket);
      queue.forEach((action) => {
        const actionString = JSON.stringify(action);
        // console.debug('Sending to my socket:', this.socket, actionString);
        this.socket.send(actionString);
      });
      // we're not emptying the queue because we might need it on reconnect
    };
    return factory.bind(this);
  }

  onCloseFactory() {
    const runner = this;
    const connectFunc = function (event) {
      // console.debug('Web socket closed. Reopening in:', runner.reconnectInterval);
      setTimeout(runner.connect.bind(runner), runner.reconnectInterval);
    };
    return connectFunc.bind(this);
  }

  // dead stupid version without good error handling, we'll improve later,
  connect() {
    this.socket = new WebSocket(this.wsUrl);
    this.socket.onopen = this.onOpenFactory();
    this.socket.onmessage = this.getMessageHandler();
    // make us retry
    this.socket.onclose = this.onCloseFactory();
  }

  terminate(){
    // kill the reconnect handler and close the socket
    this.socket.onclose = (event) => {};
    this.socket.close();
  }
}

export default WebSocketRunner;
