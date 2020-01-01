import React from 'react';
import Root from '../Root';
import AppConfigProvider from '../../components/AppConfigProvider';
import config from '../../config';
import { WebSocketProvider } from '../../contexts/WebSocketContext';
import { OnlineStateProvider } from '../../contexts/OnlineStateContext';

function App(props) {

  const configs = { ...config };

  if (props.authState !== "signedIn") {
    return <></>;
  }
  return (
    <OnlineStateProvider>
      <WebSocketProvider config={config}>
        <AppConfigProvider appConfig={configs}>
          <Root appConfig={configs}/>
        </AppConfigProvider>
      </WebSocketProvider>
    </OnlineStateProvider>
  );
}

export default App;
