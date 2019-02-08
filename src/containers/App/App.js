import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { IntlProvider } from 'react-intl';
import Root from '../Root';
import AppConfigProvider from '../../components/AppConfigProvider';
import configureStore from '../../store';
import config from '../../config';
import locales, { addLocalizationData, getLocaleMessages } from '../../config/locales';
import IntlGlobalProvider from '../../components/IntlComponents/IntlGlobalProvider';


addLocalizationData(locales);


class App extends Component {
  render() {
    const { appConfig, locale } = this.props;
    const messages = { ...(getLocaleMessages(locale, locales)), ...(getLocaleMessages(locale, appConfig.locales)) };
    const store = (appConfig && appConfig.configureStore) ? appConfig.configureStore() : configureStore();
    const configs = { ...config, ...appConfig };
    return (
      <IntlProvider locale={locale} key={locale} messages={messages}>
        <IntlGlobalProvider>
          <Provider store={store}>
            <AppConfigProvider appConfig={configs}>
              <Root appConfig={configs} />
            </AppConfigProvider>
          </Provider>
        </IntlGlobalProvider>
      </IntlProvider>
    );
  }
}

App.propTypes = {
  appConfig: PropTypes.object,
};

export default App;

export { toast } from 'react-toastify';
