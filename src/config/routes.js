import React from 'react';
import { Route } from 'react-router';
import makeLoadable from '../containers/MyLoadable/MyLoadable';
import Market from '../pages/DecisionDialog/Market';
import Markets from '../pages/DecisionDialogs/Markets';

// Note: I'm importing the raw stuff up above to aid debugging, before prod we should use the async load
// in order to speed up bundle loading
const MyLoadable = (opts, preloadComponents) => makeLoadable({ ...opts }, preloadComponents);

const AsyncMarket = MyLoadable({ loader: () => import('../pages/DecisionDialog/Market') });
const AsyncAbout = MyLoadable({ loader: () => import('../pages/About/About') });

const routes = [
  <Route type="public" path="/dialogs" exact component={Markets} />,
  <Route type="public" path="/:marketId" exact component={Market} />,
  <Route type="public" path="/:marketId/about" exact component={AsyncAbout} />,
];


export default routes;
