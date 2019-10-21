import React from 'react';
import ReactDOM from 'react-dom';
import Loadable from 'react-loadable';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import A2HSProvider from 'a2hs';
import LoadingComponent from './components/LoadingComponent';
import Main from './containers/Main';

const MainAsync = Loadable({
  loader: () => import('./containers/Main'),
  loading: () => <LoadingComponent />,
});

ReactDOM.render(
  <A2HSProvider>
    <Router>
      <Route component={Main} />
    </Router>
  </A2HSProvider>,
  document.getElementById('root'),
  () => {
    setTimeout(() => {
      MainAsync.preload();
    }, 1500);
  },
);
