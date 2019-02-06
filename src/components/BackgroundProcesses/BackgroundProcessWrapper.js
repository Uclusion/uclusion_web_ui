import React from 'react'
import WebSocketRunner from './WebSocketRunner'
import { connect } from 'react-redux'
import config from '../../config/config'
function mapDispatchToProps (dispatch) {
  return {dispatch}
}

function mapStateToProps (state) {
  return {}
}

let webSocket = null

function withBackgroundProcesses (WrappedComponent) {

  class BackgroundProcessWrapper extends React.Component {

    getWebSocket () {
      if (webSocket != null){
        return webSocket
      }
      const {dispatch} = this.props
      webSocket = new WebSocketRunner(config.webSocketUrl, dispatch)
      return webSocket
    }

    render () {
      return <WrappedComponent {...this.props} webSocket={this.getWebSocket()}/>
    }
  }

  return connect(mapStateToProps, mapDispatchToProps)(BackgroundProcessWrapper)
}

export { withBackgroundProcesses }