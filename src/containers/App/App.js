import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import NoAccount from '../../pages/NoAccount/NoAccount';
import Root from '../Root';
import AppConfigProvider from '../../components/AppConfigProvider';
import config from '../../config';
import { WebSocketProvider } from '../../contexts/WebSocketContext';
import { OnlineStateProvider } from '../../contexts/OnlineStateContext';
import { Auth } from 'aws-amplify';
import LogRocket from 'logrocket';
import { defaultTheme } from '../../config/themes';
import { ThemeProvider } from '@material-ui/core/styles';
import { TourProvider } from '../../contexts/TourContext/TourContext';

function App(props) {

  const { authState } = props;
  const configs = { ...config };
  const [userAttributes, setUserAttributes] = useState({});
  useEffect(() => {
    if (authState === 'signedIn') {
      Auth.currentAuthenticatedUser()
        .then((user) => {
          const { attributes } = user;
          const { sub, name, email } = attributes;
          const cognitoUserId = attributes['custom:user_id'];
          const userAttributes = {
            sub,
            name,
            email,
            userId: cognitoUserId,
          };
          setUserAttributes(userAttributes);
          LogRocket.identify((cognitoUserId), {
            name,
            sub,
            email,
            cognitoUserId,
          });

        });
    } else {
      setUserAttributes({});
    }
    return () => {
    };
  }, [authState]);

  if (authState !== 'signedIn') {
    return <></>;
  }

  const { userId, email } = userAttributes;
  const hasAccount = !_.isEmpty(userId);

  if (!hasAccount) {
    return (
      <OnlineStateProvider>
        <ThemeProvider theme={defaultTheme}>
          <NoAccount email={email}/>
        </ThemeProvider>
      </OnlineStateProvider>
    );
  }

  return (
    <OnlineStateProvider>
      <WebSocketProvider config={config}>
        <AppConfigProvider appConfig={configs}>
          <ThemeProvider theme={defaultTheme}>
            <TourProvider>
              <Root appConfig={configs}/>
            </TourProvider>
          </ThemeProvider>
        </AppConfigProvider>
      </WebSocketProvider>
    </OnlineStateProvider>
  );
}

export default App;
