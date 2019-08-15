import React from 'react';
import PropTypes from 'prop-types';
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import { Router, Route, Switch } from 'react-router-dom';
import AppLayout from '../AppLayout';
import { defaultTheme } from '../../config/themes';

// eslint-disable-next-line
const history = require('history').createBrowserHistory();

function Root(props){

  const { appConfig } = props;

  const theme = defaultTheme;
  return (
    <MuiThemeProvider theme={theme}>
      <Router history={history}>
        <Switch>
          <Route children={props => <AppLayout {...props} appConfig={appConfig}/>} />
        </Switch>
      </Router>
    </MuiThemeProvider>
  );

}

Root.propTypes = {
  appConfig: PropTypes.object.isRequired, // eslint-disable-line
};

export default Root;
