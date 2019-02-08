import _ from 'lodash';
import { fetchInvestibles } from '../../store/MarketInvestibles/actions';

/**
 * Class which fires and manages a websocket connection to the server. It may need to become a service worker
 */
class WebSocketRunner {
  constructor(config) {
    this.wsUrl = config.wsUrl;
    this.dispatch = config.dispatch;
    this.reconnectInterval = config.reconnectInterval;
    this.subscribeQueue = [];
  }

  getMessageHandler() {
    return (event) => {
      console.log(event);
      const payload = JSON.parse(event.data);
      switch (payload.event_type) {
        case 'MARKET_INVESTIBLE_UPDATED':
        case 'MARKET_INVESTIBLE_CREATED':
          this.dispatch(fetchInvestibles({ marketId: payload.sub_object_id, idList: [payload.object_id] }));
          break;
        default:
          console.debug('unknown event:', event);
      }
    };
  }

  subscribe(marketId, userId) {
    const action = { action: 'subscribe', user_id: userId, market_id: marketId };
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
  }

  onOpenFactory() {
    // we have to assign queue this to prevent the handler's this from being retargeted to the websocket
    const queue = this.subscribeQueue;
    return (event) => {
      queue.forEach(action => this.socket.send(JSON.stringify(action)));
      // we're not emptying the queue because we might need it on reconnect
    };
  }

  onCloseFactory() {
    const retryInterval = this.reconnectInterval;
    const connectFunc = this.connect;
    const connector = function () { connectFunc(); };
    return (event) => {
      console.log('Web Socket Closed. Reopening');
      setInterval(connector, retryInterval);
    };
  }

  // dead stupid version without good error handling, we'll improve later,
  connect() {
    this.socket = new WebSocket(this.wsUrl);
    this.socket.onopen = this.onOpenFactory();
    this.socket.onmessage = this.getMessageHandler();
    // make us retry
    this.socket.onclose = this.onCloseFactory();
  }
}

export default WebSocketRunner;
