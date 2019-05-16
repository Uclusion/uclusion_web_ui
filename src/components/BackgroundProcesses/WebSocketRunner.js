import _ from 'lodash';
import { fetchInvestibles, investibleDeleted } from '../../store/MarketInvestibles/actions';
import { fetchComments, commentDeleted } from '../../store/Comments/actions';
import { notifyNewApplicationVersion } from "../../utils/postAuthFunctions";
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../utils';

/**
 * Class which fires and manages a websocket connection to the server. It may need to become a service worker
 */
const localStorageKey = 'websocket_subscriptions';


class WebSocketRunner {
  constructor(config) {
    this.wsUrl = config.wsUrl;
    this.dispatch = config.dispatch;
    this.reconnectInterval = config.reconnectInterval;
    this.subscribeQueue = [];
  }

  getMessageHandler() {
    const handler = (event) => {
      // console.debug(event);
      const message = JSON.parse(event.data);
      const { payload, object_id, sub_object_id } = message;
      switch (message.event_type) {
        case 'MARKET_INVESTIBLE_UPDATED':
        case 'MARKET_INVESTIBLE_CREATED':
          this.dispatch(fetchInvestibles({
            marketId: message.indirect_object_id,
            idList: [object_id],
          }));
          break;
        case 'INVESTIBLE_COMMENT_DELETED':
          this.dispatch(commentDeleted(message.associated_object_id, sub_object_id, object_id));
          break;
        case 'INVESTIBLE_COMMENT_UPDATED':
          this.dispatch(fetchComments({
            idList: [object_id],
            marketId: message.associated_object_id,
          }));
          break;
        case 'MARKET_INVESTIBLE_DELETED':
          this.dispatch(investibleDeleted(message.indirect_object_id, object_id));
          break;
        case 'UI_UPDATE_REQUIRED':
          notifyNewApplicationVersion(this.dispatch, payload.deployed_version);
          break;
        default:
          console.debug('unknown event:', event);
      }
    };
    return handler.bind(this);
  }

  /**
   * Subscribes the given user id to the subscriptions described in the subscriptions object
   * subscriptions is an object of a form similar to
   * {market_id: marketId, investible_id: investibleId ...}
   * @param userId the user id to subscribe with
   * @param subscriptions the object ids to subscribe too
   */
  subscribe(userId, subscriptions) {
    const action = { action: 'subscribe', user_id: userId, ...subscriptions };
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
    console.debug('Subscribe queue at end of subscribe:', JSON.stringify(this.subscribeQueue));
    this.storeSubscribeQueue();
  }

  unsubscribeAll(){
    this.subscribeQueue = [];
    this.storeSubscribeQueue();
  }

  loadSubscribeQueue() {
    this.subscribeQueue = getUclusionLocalStorageItem(localStorageKey);
    if (!this.subscribeQueue) {
      this.subscribeQueue = [];
    }
  }

  storeSubscribeQueue(){
    setUclusionLocalStorageItem(localStorageKey, this.subscribeQueue);
  }

  onOpenFactory() {
    // we have to assign queue this to prevent the handler's
    // this from being retargeted to the websocket
    this.loadSubscribeQueue();
    const queue = this.subscribeQueue;
    console.debug('Subcribing to:', queue);
    const factory = (event) => {
      console.debug('Here in open factory with queue:', JSON.stringify(queue));
      console.debug('My socket is:', this.socket);
      queue.forEach((action) => {
        const actionString = JSON.stringify(action);
        console.debug('Sending to my socket:', this.socket, actionString);
        this.socket.send(actionString);
      });
      // we're not emptying the queue because we might need it on reconnect
    };
    return factory.bind(this);
  }

  onCloseFactory() {
    const runner = this;
    const connectFunc = function (event) {
      console.debug('Web socket closed. Reopening in:', runner.reconnectInterval);
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
}

export default WebSocketRunner;
