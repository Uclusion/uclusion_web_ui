import React from 'react';
import { connect } from 'react-redux';
import WebSocketRunner from './WebSocketRunner';
import config from '../../config/config';

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

function mapStateToProps(state) {
  return {};
}

let webSocket = null;

function withBackgroundProcesses(WrappedComponent) {
  class BackgroundProcessWrapper extends React.Component {
    getWebSocket() {
      if (webSocket != null) {
        return webSocket;
      }
      const { dispatch } = this.props;
      const { webSockets } = config;
      const sockConfig = { wsUrl: webSockets.wsUrl, dispatch, reconnectInterval: webSockets.reconnectInterval };
      webSocket = new WebSocketRunner(sockConfig);
      return webSocket;
    }

    render() {
      return <WrappedComponent {...this.props} webSocket={this.getWebSocket()} />;
    }
  }

  return connect(mapStateToProps, mapDispatchToProps)(BackgroundProcessWrapper);
}

export { withBackgroundProcesses };
