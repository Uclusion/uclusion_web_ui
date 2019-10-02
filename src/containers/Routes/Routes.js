import React, { Component } from 'react';
import { Switch, Route, withRouter } from 'react-router-dom';
import withAppConfigs from '../../utils/withAppConfigs';
import makeLoadable from '../MyLoadable/MyLoadable';

const MyLoadable = (opts, preloadComponents) => makeLoadable({ ...opts }, preloadComponents);

const AsyncMarkets = MyLoadable({ loader: () => import('../../pages/DecisionDialogs/Markets') });
const AsyncMarket = MyLoadable({ loader: () => import('../../pages/DecisionDialog/Market') });
const AsyncNotifications = MyLoadable({ loader: () => import('../../pages/ActionCenter/Notifications') });
const AsyncAbout = MyLoadable({ loader: () => import('../../pages/About/About') });
const AsyncPageNotFound = MyLoadable({ loader: () => import('../../pages/PageNotFound') });

export class Routes extends Component { //eslint-disable-line
  render() {
    return (

      <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
        <Switch>
          <Route type="public" path="/dialogs" exact component={AsyncMarkets} />
          <Route type="public" path="/notifications" exact component={AsyncNotifications} />
          <Route type="public" path="/:marketId" exact component={AsyncMarket} />
          <Route type="public" path="/:marketId/about" exact component={AsyncAbout} />
          <Route component={AsyncPageNotFound} />
        </Switch>
      </div>

    );
  }
}

export default withRouter(withAppConfigs(Routes));
