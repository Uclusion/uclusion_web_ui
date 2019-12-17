import React from 'react';
import Root from '../Root';
import AppConfigProvider from '../../components/AppConfigProvider';
import config from '../../config';
import IntlGlobalProvider from '../../components/IntlComponents/IntlGlobalProvider';
import { WebSocketProvider } from '../../contexts/WebSocketContext';
import { OnlineStateProvider } from '../../contexts/OnlineStateContext';

function App(props) {

  const configs = { ...config };

  if (props.authState !== "signedIn") {
    return <></>;
  }
  return (
    <IntlGlobalProvider>
      <OnlineStateProvider>
        <WebSocketProvider config={config}>
          <AppConfigProvider appConfig={configs}>
            <Root appConfig={configs}/>
          </AppConfigProvider>
        </WebSocketProvider>
      </OnlineStateProvider>
    </IntlGlobalProvider>

  );
}

export default App;
