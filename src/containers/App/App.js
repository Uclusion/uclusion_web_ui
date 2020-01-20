import React, { useState, useEffect } from 'react';
import Root from '../Root';
import AppConfigProvider from '../../components/AppConfigProvider';
import config from '../../config';
import { WebSocketProvider } from '../../contexts/WebSocketContext';
import { OnlineStateProvider } from '../../contexts/OnlineStateContext';
import { Auth } from 'aws-amplify';
import LogRocket from 'logrocket';

function App(props) {

  const { authState } = props;
  const configs = { ...config };
  const [identified, setIdentitified] = useState(false);

  useEffect(() => {
    if (authState === 'signedIn' && !identified) {
      Auth.currentAuthenticatedUser()
        .then((user) => {
          const { attributes } = user;
          const { sub, name, email } = attributes;
          const userId = attributes['custom:user_id'];
          LogRocket.identify((userId), {
            name,
            sub,
            email,
            userId,
          });
          setIdentitified(true);
        });
    }
    return () => {
    };
  }, [authState, identified]);

  if (authState !== 'signedIn') {
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
