import React from 'react';
import { Route } from 'react-router';
import makeLoadable from '../containers/MyLoadable/MyLoadable';

const MyLoadable = (opts, preloadComponents) => makeLoadable({ ...opts }, preloadComponents);

const AsyncInvestibles = MyLoadable({ loader: () => import('../pages/Investibles/Investibles') });
const AsyncInvestibleEdit = MyLoadable({ loader: () => import('../pages/InvestibleEdit/InvestibleAddEdit') });
const AsyncPostAuth = MyLoadable({ loader: () => import('../pages/Login/PostAuth') });
const AsyncMarket = MyLoadable({ loader: () => import('../pages/Market/MarketManagement') });
const AsyncNewCognito = MyLoadable({ loader: () => import('../pages/Cognito/NewCognito') });
const AsyncAbout = MyLoadable({ loader: () => import('../pages/About/About') });
const AsyncLogin = MyLoadable({ loader: () => import('../pages/Login/Login') });

const routes = [
  <Route type="public" path="/:marketId/investibles" exact component={AsyncInvestibles} />,
  <Route type="public" path="/:marketId/market" exact component={AsyncMarket} />,
  <Route type="public" path="/post_auth" exact component={AsyncPostAuth} />,
  <Route type="public" path="/:marketId/login" exact component={AsyncLogin} />,
  <Route type="public" path="/:marketId/newCognito" exact component={AsyncNewCognito} />,
  <Route type="public" path="/:marketId/about" exact component={AsyncAbout} />,
  <Route type="public" path="/:marketId/investibleEdit/:investibleId" exact component={AsyncInvestibleEdit} />,
  <Route type="public" path="/:marketId/investibleAdd/" exact component={AsyncInvestibleEdit} />,
];


export default routes;
