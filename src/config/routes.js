import React from 'react';
import { Route } from 'react-router';
import makeLoadable from '../containers/MyLoadable/MyLoadable';
import Investibles from '../pages/Market/Investibles';

const MyLoadable = (opts, preloadComponents) => makeLoadable({ ...opts }, preloadComponents);

const AsyncInvestibles = MyLoadable({ loader: () => import('../pages/Market/Investibles') });
const AsyncInvestibleEdit = MyLoadable({ loader: () => import('../pages/InvestibleEdit/InvestibleAddEdit') });
const AsyncAbout = MyLoadable({ loader: () => import('../pages/About/About') });

const routes = [
  <Route type="public" path="/:marketId" exact component={Investibles} />,
  <Route type="public" path="/:marketId/about" exact component={AsyncAbout} />,
  <Route type="public" path="/:marketId/investibleEdit/:investibleId" exact component={AsyncInvestibleEdit} />,
  <Route type="public" path="/:marketId/investibleAdd/" exact component={AsyncInvestibleEdit} />,
];


export default routes;
