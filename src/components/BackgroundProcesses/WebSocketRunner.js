import { fetchInvestibles } from '../../store/MarketInvestibles/actions'

/**
 * Class which fires and manages a websocket connection to the server. It may need to become a service worker
 */
class WebSocketRunner {

  constructor (config) {
    this.wsUrl = config.wsUrl
    this.dispatch = config.dispatch
    this.reconnectInterval = config.reconnectInterval
    this.subscribeQueue = []
  }

  getMessageHandler () {
    return (event) => {
      console.log(event)
      const payload = JSON.parse(event.data)
      switch (payload.event_type) {
        case 'MARKET_INVESTIBLE_UPDATED':
        case 'MARKET_INVESTIBLE_CREATED':
          this.dispatch(fetchInvestibles({marketId: payload.sub_object_id, idList: [payload.object_id]}))
          break
        default:
          console.debug('unknown event:', event)
      }
    }
  }

  subscribe (marketId, userId) {
    // if socket is not open append it to the runners subscribe queu
    const action = JSON.stringify({action: 'subscribe', user_id: userId, market_id: marketId})
    if (this.socket.readyState !== WebSocket.OPEN) {
      this.subscribeQueue.push(action)
    } else {
      this.socket.send(action)
    }
  }

  onOpenFactory(){
    //we have to assign queue this to prevent the handler's this from being retargeted to the websocket
    const queue = this.subscribeQueue
    return (event) => {
      queue.forEach((element) => this.socket.send(element))
      while(queue.length > 0){
        queue.pop()
      }
    }
  }

  onCloseFactory(){
    const retryInterval = this.reconnectInterval
    const connectFunc = this.connect
    const connector = () => {connectFunc()}
    return (event) => {
      console.log("Web Socket Closed. Reopening")
      setInterval(connector, retryInterval)
    }
  }

  //dead stupid version without good error handling, we'll improve later,
  connect () {
    this.socket = new WebSocket(this.wsUrl)
    this.socket.onopen = this.onOpenFactory()
    this.socket.onmessage = this.getMessageHandler()
    //make us retry
    this.socket.onclose = this.onCloseFactory()
  }

}

export default WebSocketRunner
