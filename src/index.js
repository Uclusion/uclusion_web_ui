import React from 'react';
import ReactDOM from 'react-dom';
import Loadable from 'react-loadable';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import A2HSProvider from 'a2hs';
import LoadingComponent from './components/LoadingComponent';

const MainAsync = Loadable({
  loader: () => import('./containers/Main'),
  loading: () => <LoadingComponent />,
});

const LPAsync = Loadable({
  loader: () => import('./containers/MainLanding'),
  loading: () => <LoadingComponent />,
});

ReactDOM.render(
  <A2HSProvider>
    <Router>
      <Switch>
        <Route path="/" exact component={LPAsync} />
        <Route path="/markets" exact component={LPAsync} />
        <Route component={MainAsync} />
      </Switch>
    </Router>
  </A2HSProvider>,
  document.getElementById('root'),
  () => {
    setTimeout(() => {
      MainAsync.preload();
    }, 1500);
  },
);
