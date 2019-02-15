import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Provider } from 'react-redux';
import { IntlProvider } from 'react-intl';
import Root from '../Root';
import AppConfigProvider from '../../components/AppConfigProvider';
import configureStore from '../../store';
import config from '../../config';
import locales, { addLocalizationData, getLocaleMessages } from '../../config/locales';
import IntlGlobalProvider from '../../components/IntlComponents/IntlGlobalProvider';


addLocalizationData(locales);


class App extends PureComponent {
  render() {
    const { appConfig, locale, isLanding } = this.props;
    let myLocale = locale;
    if (!myLocale) {
      myLocale = 'en';
    }
    const messages = { ...(getLocaleMessages(locale, locales)),
      ...(getLocaleMessages(locale, appConfig.locales)),
    };
    const store = (appConfig && appConfig.configureStore)
      ? appConfig.configureStore() : configureStore();
    const configs = { ...config, ...appConfig };
    return (
      <IntlProvider locale={myLocale} key={myLocale} messages={messages}>
        <IntlGlobalProvider>
          <Provider store={store}>
            <AppConfigProvider appConfig={configs}>
              {
                (isLanding && <Root appConfig={configs} isLanding />)
                || (!isLanding && <Root appConfig={configs} />)
              }
            </AppConfigProvider>
          </Provider>
        </IntlGlobalProvider>
      </IntlProvider>
    );
  }
}

App.propTypes = {
  appConfig: PropTypes.object,
  isLanding: PropTypes.bool,
};

export default App;

export { toast } from 'react-toastify';
