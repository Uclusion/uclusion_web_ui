import React from 'react';
import { Route } from 'react-router';
import makeLoadable from '../containers/MyLoadable/MyLoadable';

const MyLoadable = (opts, preloadComponents) => makeLoadable({ ...opts }, preloadComponents);

const AsyncInvestibles = MyLoadable({ loader: () => import('../pages/Investibles/Investibles') });
const AsyncPostAuth = MyLoadable({ loader: () => import('../pages/Login/PostAuth') });
const AsyncInvite = MyLoadable({ loader: () => import('../pages/Invite/Invite') });
const AsyncTeams = MyLoadable({ loader: () => import('../pages/TeamMemberships/UserMemberships') });
const AsyncCategories = MyLoadable({ loader: () => import('../pages/Categories/CategoryList') });

const routes = [
  <Route type="private" path="/:marketId/" exact component={AsyncInvestibles} />,
  <Route type="public" path="/:marketId/investibles" exact component={AsyncInvestibles} />,
  <Route type="public" path="/:marketId/marketCategories" exact component={AsyncCategories} />,
  <Route type="public" path="/:marketId/teams" exact component={AsyncTeams} />,
  <Route type="public" path="/:marketId/invite" exact component={AsyncInvite} />,
  <Route type="public" path="/:marketId/post_auth" exact component={AsyncPostAuth} />,
  <Route type="public" path="/:marketId/login" exact component={AsyncInvestibles} />,
];


export default routes;
