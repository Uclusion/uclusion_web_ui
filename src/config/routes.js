import React from 'react'
import makeLoadable from '../containers/MyLoadable/MyLoadable'
import RestrictedRoute from '../containers/RestrictedRoute/RestrictedRoute'

const MyLoadable = (opts, preloadComponents) => makeLoadable({ ...opts }, preloadComponents)

const AsyncDashboard = MyLoadable({ loader: () => import('../pages/Dashboard') })
const AsyncAbout = MyLoadable({ loader: () => import('../pages/About') })
const AsyncInvestibles = MyLoadable({ loader: () => import('../pages/Investibles/Investibles') })
const AsyncPostAuth = MyLoadable({ loader: () => import('../pages/Login/PostAuth') })
const AsyncLogin = MyLoadable({ loader: () => import('../pages/Login') })
const AsyncTeams = MyLoadable({ loader: () => import('../pages/TeamMemberships/UserMemberships')})

const routes = [
  <RestrictedRoute type='private' path="/:marketId/" exact component={AsyncDashboard} />,
  <RestrictedRoute type='private' path="/:marketId/dashboard" exact component={AsyncDashboard} />,
  <RestrictedRoute type='private' path="/:marketId/about" exact component={AsyncAbout} />,
  <RestrictedRoute type='public' path="/:marketId/investibles" exact component={AsyncInvestibles} />,

  <RestrictedRoute type='public' path="/:marketId/teams" exact component={AsyncTeams} />,
  <RestrictedRoute type='public' path="/:marketId/post_auth" exact component={AsyncPostAuth}/>,
  <RestrictedRoute type='public' path="/:marketId/login" exact component={AsyncLogin} />
]


export default routes;