import './logrocketSetup';
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import A2HSProvider from 'a2hs';
import Main from './containers/Main';

ReactDOM.render(
  <A2HSProvider>
    <Router>
      <Route>
        <Main />
      </Route>
    </Router>
  </A2HSProvider>,
  document.getElementById('root')
);
//register the service worker for the main app
//serviceWorker.register({scope: '/'});
// now register it for the cdn