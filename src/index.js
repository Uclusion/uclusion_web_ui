import './logrocketSetup';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import A2HSProvider from 'a2hs';
import Main from './containers/Main';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<A2HSProvider>
  <Router>
    <Route>
      <Main />
    </Route>
  </Router>
</A2HSProvider>);