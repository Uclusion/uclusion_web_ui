import PropTypes from 'prop-types';
import React, { useContext } from 'react';
import { IntlProvider } from 'react-intl';
import Root from '../Root';
import AppConfigProvider from '../../components/AppConfigProvider';
import config from '../../config';
import { getLocaleMessages } from '../../config/locales';
import IntlGlobalProvider from '../../components/IntlComponents/IntlGlobalProvider';
import { withAuthenticator } from 'aws-amplify-react';
import { LocaleContext } from '../../contexts/LocaleContext';
import { WebSocketProvider } from '../../contexts/WebSocketContext';

function App(props) {

  const { appConfig } = props;
  const [localeState] = useContext(LocaleContext);
  const { locale } = localeState;
  const messages = {
    ...getLocaleMessages(locale),
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

