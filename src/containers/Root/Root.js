import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createMuiTheme } from '@material-ui/core/styles';
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import MuiPickersUtilsProvider from 'material-ui-pickers/MuiPickersUtilsProvider';
import MomentUtils from 'material-ui-pickers/utils/moment-utils';
import { IntlProvider } from 'react-intl';
import { Route, Switch } from 'react-router-dom';
import IntlGlobalProvider from '../../components/IntlComponents/IntlGlobalProvider';
import AppLayout from '../AppLayout';
import LandingPage from '../../pages/LandingPage';
import getThemeSource from '../../config/themes';
import locales, { getLocaleMessages } from '../../config/locales';
import { withBackgroundProcesses } from '../../components/BackgroundProcesses/BackgroundProcessWrapper';



class Root extends Component {
  constructor(props) {
    super(props);
    const { webSocket } = props;
    this.state = { webSocket };
    webSocket.connect();
  }

  render() {
    const {
      appConfig,
      locale,
      themeSource,
      isLanding,
    } = this.props;
    const messages = { ...(getLocaleMessages(locale, locales)),
      ...(getLocaleMessages(locale, appConfig.locales)),
    };
    const source = getThemeSource(themeSource, appConfig.themes);
    const theme = createMuiTheme(source);

    return (
      <MuiPickersUtilsProvider utils={MomentUtils}>
        <MuiThemeProvider theme={theme}>
          <IntlProvider locale={locale} key={locale} messages={messages}>
            <IntlGlobalProvider>

                <Switch>
                  {(isLanding && <Route children={props => <LandingPage {...props} />} />)
                    || (!isLanding && <Route children={props => <AppLayout {...props} />} />)
                  }
                </Switch>

            </IntlGlobalProvider>
          </IntlProvider>
        </MuiThemeProvider>
      </MuiPickersUtilsProvider>
    );
  }
}

Root.propTypes = {
  locale: PropTypes.string.isRequired,
  themeSource: PropTypes.object.isRequired,
  isLanding: PropTypes.bool,
};

const mapStateToProps = (state, ownProps) => {
  const { locale, themeSource } = state;

  return {
    locale,
    themeSource,
  };
};

export default withBackgroundProcesses(connect(
  mapStateToProps,
)(Root));
