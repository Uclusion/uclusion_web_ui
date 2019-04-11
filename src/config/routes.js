import React from 'react';
import { Route } from 'react-router';
import makeLoadable from '../containers/MyLoadable/MyLoadable';

const MyLoadable = (opts, preloadComponents) => makeLoadable({ ...opts }, preloadComponents);

const AsyncDashboard = MyLoadable({ loader: () => import('../pages/Dashboard/Dashboard') });
const AsyncInvestibles = MyLoadable({ loader: () => import('../pages/Investibles/Investibles') });
const AsyncInvestibleEdit = MyLoadable({ loader: () => import('../pages/InvestibleEdit/InvestibleEdit') });
const AsyncPostAuth = MyLoadable({ loader: () => import('../pages/Login/PostAuth') });
const AsyncInvite = MyLoadable({ loader: () => import('../pages/Invite/Invite') });
const AsyncTeams = MyLoadable({ loader: () => import('../pages/TeamMemberships/UserMemberships') });
const AsyncCategories = MyLoadable({ loader: () => import('../pages/Categories/CategoryList') });
const AsyncNewCognito = MyLoadable({ loader: () => import('../pages/Cognito/NewCognito') });
const AsyncAbout = MyLoadable({ loader: () => import('../pages/About/About') });

const routes = [
  <Route type="public" path="/:marketId/dashboard" exact component={AsyncDashboard} />,
  <Route type="public" path="/:marketId/investibles" exact component={AsyncInvestibles} />,
  <Route type="public" path="/:marketId/marketCategories" exact component={AsyncCategories} />,
  <Route type="public" path="/:marketId/teams" exact component={AsyncTeams} />,
  <Route type="public" path="/:marketId/invite" exact component={AsyncInvite} />,
  <Route type="public" path="/post_auth" exact component={AsyncPostAuth} />,
  <Route type="public" path="/:marketId/login" exact component={AsyncInvestibles} />,
  <Route type="public" path="/:marketId/newCognito" exact component={AsyncNewCognito} />,
  <Route type="public" path="/:marketId/about" exact component={AsyncAbout} />,
  <Route type="public" path="/:marketId/investibleEdit/:investibleId" exact component={AsyncInvestibleEdit} />
];


export default routes;
