import { fetchInvestibles } from '../../store/MarketInvestibles/actions'

/**
 * Class which fires and manages a websocket connection to the server. It may need to become a service worker
 */
class WebSocketRunner {

  constructor (wsUrl, dispatch) {
    this.wsUrl = wsUrl
    this.dispatch = dispatch
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
    //if we're not open subscribe after we're open
    if (this.socket.readyState !== WebSocket.OPEN) {
      this.socket.onopen = (event) => {
        this.socket.send(JSON.stringify({
          action: 'subscribe',
          user_id: userId,
          market_id: marketId
        }))
      }
    } else {
      this.socket.send(JSON.stringify({action: 'subscribe', user_id: userId, market_id: marketId}))
    }
  }

  //dead stupid version without good error handling, we'll improve later,
  connect () {
    this.socket = new WebSocket(this.wsUrl)
    this.socket.onmessage = this.getMessageHandler()
    this.socket.onclose = (event) => {console.log("Closing websocket")}
  }

}

export default WebSocketRunner
