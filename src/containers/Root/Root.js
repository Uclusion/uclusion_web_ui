import React from 'react';
import PropTypes from 'prop-types';
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import { withStyles } from '@material-ui/core';
import {
  Route, Router, Switch, useHistory,
} from 'react-router-dom';
import { defaultTheme } from '../../config/themes';
import Drawer from '../Drawer';
import Markets from '../../pages/DecisionDialogs/Markets';
import Notifications from '../../pages/ActionCenter/Notifications';
import Market from '../../pages/DecisionDialog/Market';
import About from '../../pages/About/About';
import PageNotFound from '../../pages/PageNotFound/PageNotFound';

import { getMarketId } from '../../utils/marketIdPathFunctions';

const styles = {
  body: {
    height: '100%',
  },
  root: {
    flexGrow: 1,
    zIndex: 1,
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    width: '100%',
  },
};

function Root(props) {
  const history = useHistory();
  const { classes, appConfig } = props;

  const { location } = history;
  const { pathname } = location;
  const marketId = getMarketId(pathname);
  console.log(marketId);
  const theme = defaultTheme;

  return (
    <MuiThemeProvider theme={theme}>
        <div className={classes.body}>
          <div className={classes.root}>
            <Drawer appConfig={appConfig} />
            <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
              <Notifications hidden={pathname !== '/notifications'} />
              <Markets hidden={location && (pathname !== '/dialogs')} />
              <Market hidden={marketId === null} />
            </div>
          </div>
        </div>
    </MuiThemeProvider>
  );
}

Root.propTypes = {
  appConfig: PropTypes.object.isRequired, // eslint-disable-line
};

export default withStyles(styles)(Root);
