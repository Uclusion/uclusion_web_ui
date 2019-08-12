import React, { Component } from 'react';
import { withA2HS } from 'a2hs';
import { ToastContainer } from 'react-toastify';
import App from '../App/App';
import config from '../../config';
import configureStore from '../../store';
import locales, { addLocalizationData } from '../../config/locales';
import 'react-toastify/dist/ReactToastify.css';
import Amplify from 'aws-amplify';
import awsconfig from '../../config/amplify';
import WebSocketRunner from '../../components/BackgroundProcesses/WebSocketRunner';
import AuthorizationListener from '../../authorization/AuthorizationListener';
import { Provider } from 'react-redux';
import { IntlProvider } from 'react-intl';
import IntlGlobalProvider from '../../components/IntlComponents/IntlGlobalProvider';

addLocalizationData(locales);
console.log(awsconfig);
Amplify.configure(awsconfig);

const WebSocketContext = React.createContext();

class Main extends Component {

  constructor(props){
    super(props);
    this.state = { webSocket: null };
  }

  createStore() {
    const store = configureStore();
    return store;
  }

  createWebSocket(dispatch, config) {
    const { webSocket } = this.state;
    if (!webSocket) {
      const { webSockets } = config;
      const sockConfig = { wsUrl: webSockets.wsUrl, dispatch, reconnectInterval: webSockets.reconnectInterval };
      const newSocket = new WebSocketRunner(sockConfig);
      newSocket.connect();
      this.setState({ webSocket: newSocket });
      return newSocket;
    }
    return webSocket;
  }

  render() {
    const store = this.createStore();
    const { dispatch } = store;
    const webSocket = this.createWebSocket(dispatch, config);
    const authListener = new AuthorizationListener();
    authListener.listenForAuthorization(dispatch, webSocket);
    return (
      <div>
        <ToastContainer/>
        <Provider store={store}>
          <WebSocketContext.Provider value={webSocket}>
            <App appConfig={{ ...config }}/>
          </WebSocketContext.Provider>
        </Provider>
      </div>
    );
  }
}

export default withA2HS(Main);
