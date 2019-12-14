import React  from 'react';
import Root from '../Root';
import AppConfigProvider from '../../components/AppConfigProvider';
import config from '../../config';
import IntlGlobalProvider from '../../components/IntlComponents/IntlGlobalProvider';
import { WebSocketProvider } from '../../contexts/WebSocketContext';

function App(props) {

  const configs = { ...config };

  if (props.authState !== "signedIn") {
    return <></>;
  }
  return (
    <IntlGlobalProvider>
      <WebSocketProvider config={config}>
        <AppConfigProvider appConfig={configs}>
          <Root appConfig={configs}/>
        </AppConfigProvider>
      </WebSocketProvider>
    </IntlGlobalProvider>

  );
}

export default App;
