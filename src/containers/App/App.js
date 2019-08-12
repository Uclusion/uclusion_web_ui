import PropTypes from 'prop-types';
import React, { Component } from 'react';
import MarketContext from '../../contexts/MarketsContext';
import { IntlProvider } from 'react-intl';
import Root from '../Root';
import AppConfigProvider from '../../components/AppConfigProvider';
import config from '../../config';
import locales, { addLocalizationData, getLocaleMessages } from '../../config/locales';
import IntlGlobalProvider from '../../components/IntlComponents/IntlGlobalProvider';
import { withAuthenticator } from 'aws-amplify-react';


addLocalizationData(locales);

class App extends Component {

  constructor(props) {
    super(props);
    this.switchMarket = (market) => {
      this.setState({ currentMarket: market });
    };
    this.state = {
      currentMarket: {},
      switchMarket: this.switchMarket,
    };
  }

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
          <MarketContext.Provider value={this.state}>
              <AppConfigProvider appConfig={configs}>
                <Root appConfig={configs} isLanding onDragStart={this.preventDragHandler} />
              </AppConfigProvider>
          </MarketContext.Provider>
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
