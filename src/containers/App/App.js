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
import AuthorizationListener from '../../authorization/AuthorizationListener';
import WebSocketRunner from '../../components/BackgroundProcesses/WebSocketRunner';
import { withAuthenticator } from 'aws-amplify-react';


addLocalizationData(locales);

class App extends Component {



  render() {
    const { appConfig, locale, isLanding } = this.props;
    let myLocale = locale;
    if (!myLocale) {
      myLocale = 'en';
    }
    const messages = { ...(getLocaleMessages(locale, locales)),
      ...(getLocaleMessages(locale, appConfig.locales)),
    };
    const configs = { ...config, ...appConfig };
    return (
      <IntlProvider locale={myLocale} key={myLocale} messages={messages}>
        <IntlGlobalProvider>
              <AppConfigProvider appConfig={configs}>
                <Root appConfig={configs} isLanding onDragStart={this.preventDragHandler} />
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
