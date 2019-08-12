import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import { IntlProvider } from 'react-intl';
import { Router, Route, Switch } from 'react-router-dom';
import IntlGlobalProvider from '../../components/IntlComponents/IntlGlobalProvider';
import AppLayout from '../AppLayout';
import { defaultTheme } from '../../config/themes';
import locales, { getLocaleMessages } from '../../config/locales';
// eslint-disable-next-line
const history = require("history").createBrowserHistory();

class Root extends Component {

  render() {
    const {
      appConfig,
      locale,
      isLanding,

    } = this.props;
    const messages = {
      ...(getLocaleMessages(locale, locales)),
      ...(getLocaleMessages(locale, appConfig.locales)),
    };


    const theme = defaultTheme;
    return (
      <MuiThemeProvider theme={theme}>
        <IntlProvider locale={locale} key={locale} messages={messages}>
          <IntlGlobalProvider>
            <Router history={history}>
              <Switch>
                <Route children={props => <AppLayout {...props} />}/>
              </Switch>
            </Router>
          </IntlGlobalProvider>
        </IntlProvider>
      </MuiThemeProvider>
    );
  }
}

Root.propTypes = {
  locale: PropTypes.string.isRequired,
  themeSource: PropTypes.object.isRequired,
  isLanding: PropTypes.bool,
};

const mapStateToProps = (state) => {
  const { locale, themeSource } = state;

  return {
    locale,
    themeSource,
  };
};


export default connect(mapStateToProps)(Root);
