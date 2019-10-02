import React, { Component } from 'react';
import { Switch, Route, withRouter } from 'react-router-dom';
import withAppConfigs from '../../utils/withAppConfigs';
import Markets from '../../pages/DecisionDialogs/Markets';
import Notifications from '../../pages/ActionCenter/Notifications';
import Market from '../../pages/DecisionDialog/Market';
import About from '../../pages/About/About';
import PageNotFound from '../../pages/PageNotFound';

export class Routes extends Component { //eslint-disable-line
  render() {
    return (

      <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
        <Switch>
          <Route type="public" path="/dialogs" exact>
            <Markets />
          </Route>
          <Route type="public" path="/notifications" exact>
            <Notifications />
          </Route>
          <Route type="public" path="/:marketId" exact>
            <Market />
          </Route>
          <Route type="public" path="/:marketId/about" exact>
            <About />
          </Route>
          <Route>
            <PageNotFound />
          </Route>
        </Switch>
      </div>

    );
  }
}

export default withRouter(withAppConfigs(Routes));
