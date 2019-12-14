import React, { useContext } from 'react';
import { IntlProvider } from 'react-intl';
import Root from '../Root';
import AppConfigProvider from '../../components/AppConfigProvider';
import config from '../../config';
import { getLocaleMessages } from '../../config/locales';
import IntlGlobalProvider from '../../components/IntlComponents/IntlGlobalProvider';
import { LocaleContext } from '../../contexts/LocaleContext';
import { WebSocketProvider } from '../../contexts/WebSocketContext';

function App(props) {
  const [localeState] = useContext(LocaleContext);
  const { locale } = localeState;
  const messages = {
    ...getLocaleMessages(locale),
  };
  const configs = { ...config };

  if (props.authState !== "signedIn") {
    return <></>;
  }

  return (
    <WebSocketProvider config={config}>
      <IntlProvider locale={locale} key={locale} messages={messages}>
        <IntlGlobalProvider>
          <AppConfigProvider appConfig={configs}>
            <Root appConfig={configs} />
          </AppConfigProvider>
        </IntlGlobalProvider>
      </IntlProvider>
    </WebSocketProvider>
  );
}

export default App;
