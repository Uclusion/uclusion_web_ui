
import React, { Component } from 'react';
import { Switch, withRouter } from 'react-router-dom';
import getAppRoutes from '../../components/AppRoutes';
import withAppConfigs from '../../utils/withAppConfigs';

export class Routes extends Component {
  render() {
    const { appConfig } = this.props;

    const customRoutes = appConfig.routes ? appConfig.routes : [];
    const appRoutes = getAppRoutes();
    return (

      <div style={{ width: '100%', height: '100vh' }}>
        <Switch>
          {customRoutes.map((Route, i) => React.cloneElement(Route, { key: `@customRoutes/${i}` }))}
          {appRoutes.map((Route, i) => React.cloneElement(Route, { key: `@appRoutes/${i}` }))}
        </Switch>
      </div>

    );
  }
}

export default withRouter(withAppConfigs(Routes));
