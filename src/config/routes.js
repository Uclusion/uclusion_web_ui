import React from 'react';
import { Route } from 'react-router';
import makeLoadable from '../containers/MyLoadable/MyLoadable';
import Market from '../pages/Markets/Market';

const MyLoadable = (opts, preloadComponents) => makeLoadable({ ...opts }, preloadComponents);

const AsyncMarket = MyLoadable({ loader: () => import('../pages/Markets/Market') });
const AsyncInvestibleEdit = MyLoadable({ loader: () => import('../pages/InvestibleEdit/InvestibleAddEdit') });
const AsyncAbout = MyLoadable({ loader: () => import('../pages/About/About') });

const routes = [
  <Route type="public" path="/:marketId" exact component={Market} />,
  <Route type="public" path="/:marketId/about" exact component={AsyncAbout} />,
  <Route type="public" path="/:marketId/investibleEdit/:investibleId" exact component={AsyncInvestibleEdit} />,
  <Route type="public" path="/:marketId/investibleAdd/" exact component={AsyncInvestibleEdit} />,
];


export default routes;
