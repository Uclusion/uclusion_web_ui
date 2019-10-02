import PropTypes from 'prop-types';
import React from 'react';
import { IntlProvider } from 'react-intl';
import Root from '../Root';
import AppConfigProvider from '../../components/AppConfigProvider';
import config from '../../config';
import { getLocaleMessages } from '../../config/locales';
import IntlGlobalProvider from '../../components/IntlComponents/IntlGlobalProvider';
import { withAuthenticator } from 'aws-amplify-react';
import useLocaleContext from '../../contexts/useLocaleContext';
import { WebSocketProvider } from '../../contexts/WebSocketContext';
import { LocationProvider } from '../../contexts/LocationContext';

function App(props) {

  const { appConfig } = props;
  const { locale } = useLocaleContext();
  const messages = {
    ...getLocaleMessages(locale),
  };
  const configs = { ...config, ...appConfig };

  return (
    <WebSocketProvider config={config}>
      <LocationProvider>
      <IntlProvider locale={locale} key={locale} messages={messages}>
        <IntlGlobalProvider>
          <AppConfigProvider appConfig={configs}>
            <Root appConfig={configs}/>
          </AppConfigProvider>
        </IntlGlobalProvider>
      </IntlProvider>
      </LocationProvider>
    </WebSocketProvider>
  );
}

App.propTypes = {
  appConfig: PropTypes.object,
};

export default withAuthenticator(App);

