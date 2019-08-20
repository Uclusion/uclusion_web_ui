import PropTypes from 'prop-types';
import React from 'react';
import { IntlProvider } from 'react-intl';
import Root from '../Root';
import AppConfigProvider from '../../components/AppConfigProvider';
import config from '../../config';
import locales, { addLocalizationData, getLocaleMessages } from '../../config/locales';
import IntlGlobalProvider from '../../components/IntlComponents/IntlGlobalProvider';
import { withOAuth, withAuthenticator } from 'aws-amplify-react';
import useLocaleContext from '../../contexts/useLocaleContext';
import { WebSocketProvider } from '../../contexts/WebSocketContext';

addLocalizationData(locales);

function App(props) {

  const { appConfig } = props;
  const { locale } = useLocaleContext();
  const messages = {
    ...(getLocaleMessages(locale, locales)),
    ...(getLocaleMessages(locale, appConfig.locales)),
  };
  const configs = { ...config, ...appConfig };

  return (
    <WebSocketProvider config={config}>
      <IntlProvider locale={locale} key={locale} messages={messages}>
        <IntlGlobalProvider>
          <AppConfigProvider appConfig={configs}>
            <Root appConfig={configs}/>
          </AppConfigProvider>
        </IntlGlobalProvider>
      </IntlProvider>
    </WebSocketProvider>
  );
}

App.propTypes = {
  appConfig: PropTypes.object,
};

export default withAuthenticator(App);

