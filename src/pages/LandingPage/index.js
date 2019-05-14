import React from 'react';
import { Switch, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import MarketsPage from './MarketsPage';

const Landing = props => (
  <Switch>
    <Route path="/" exact>
      <LandingPage {...props} />
    </Route>
    <Route path="/markets" exact>
      <MarketsPage {...props} />
    </Route>
  </Switch>
);

export default Landing;
