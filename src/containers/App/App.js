import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { IntlProvider } from 'react-intl';
import Root from '../Root';
import AppConfigProvider from '../../components/AppConfigProvider';
import config from '../../config';
import locales, { addLocalizationData, getLocaleMessages } from '../../config/locales';
import IntlGlobalProvider from '../../components/IntlComponents/IntlGlobalProvider';
import { withAuthenticator } from 'aws-amplify-react';

addLocalizationData(locales);

class App extends Component {

  render() {
    const { appConfig, locale } = this.props;
    let myLocale = locale;
    if (!myLocale) {
      myLocale = 'en';
    }
    const messages = {
      ...(getLocaleMessages(locale, locales)),
      ...(getLocaleMessages(locale, appConfig.locales)),
    };
    const configs = { ...config, ...appConfig };

    return (
      <IntlProvider locale={myLocale} key={myLocale} messages={messages}>
        <IntlGlobalProvider>
          <AppConfigProvider appConfig={configs}>
            <Root appConfig={configs} />
          </AppConfigProvider>
        </IntlGlobalProvider>
      </IntlProvider>
    );
  }
}

App.propTypes = {
  appConfig: PropTypes.object,
};

export default withAuthenticator(App);

export { toast } from 'react-toastify';
