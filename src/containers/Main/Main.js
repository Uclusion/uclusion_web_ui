import React, { Component } from 'react';
import { withA2HS } from 'a2hs';
import { ToastContainer } from 'react-toastify';
import App from '../App/App';
import config from '../../config';
import locales, { addLocalizationData } from '../../config/locales';
import 'react-toastify/dist/ReactToastify.css';
import Amplify from 'aws-amplify';
import awsconfig from '../../config/amplify';
import WebSocketRunner from '../../components/BackgroundProcesses/WebSocketRunner';

import { MarketsProvider } from '../../contexts/MarketsContext';
import { InvestiblesProvider } from '../../contexts/InvestiblesContext';
import { DrawerProvider } from '../../contexts/DrawerContext';
import { LocaleProvider } from '../../contexts/LocaleContext';

addLocalizationData(locales);
console.log(awsconfig);
Amplify.configure(awsconfig);

const WebSocketContext = React.createContext();

class Main extends Component {

  constructor (props) {
    super(props);
    this.state = { webSocket: null };
  }

  createWebSocket (config) {
    const { webSocket } = this.state;
    if (!webSocket) {
      const { webSockets } = config;
      const sockConfig = { wsUrl: webSockets.wsUrl, reconnectInterval: webSockets.reconnectInterval };
      const newSocket = new WebSocketRunner(sockConfig);
      newSocket.connect();
      this.setState({ webSocket: newSocket });
      return newSocket;
    }
    return webSocket;
  }

  render () {
    const webSocket = this.createWebSocket(config);
    return (
      <div>
        <InvestiblesProvider>
          <MarketsProvider>
            <DrawerProvider>
              <LocaleProvider>
                <ToastContainer/>
                <WebSocketContext.Provider value={webSocket}>
                  <App appConfig={{ ...config }} />
                </WebSocketContext.Provider>
              </LocaleProvider>
            </DrawerProvider>
          </MarketsProvider>
        </InvestiblesProvider>
      </div>
    );
  }
}

export default withA2HS(Main);
