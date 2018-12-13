import React from 'react'
import makeLoadable from '../containers/MyLoadable/MyLoadable'
import RestrictedRoute from '../containers/RestrictedRoute/RestrictedRoute'

const MyLoadable = (opts, preloadComponents) => makeLoadable({ ...opts, firebase: () => import('./firebase') }, preloadComponents)

const AsyncDashboard = MyLoadable({ loader: () => import('../pages/Dashboard') })
const AsyncAbout = MyLoadable({ loader: () => import('../pages/About') })
const AsyncInvestibles = MyLoadable({ loader: () => import('../pages/Investibles/Investibles') })
const AsyncDocument = MyLoadable({ loader: () => import('../pages/Document') })

const AsyncLogin = MyLoadable({ loader: () => import('../pages/Login') })
const AsyncTeams = MyLoadable({ loader: () => import('../pages/TeamMemberships/UserMemberships')})

const routes = [
  <RestrictedRoute type='private' path="/" exact component={AsyncDashboard} />,
  <RestrictedRoute type='private' path="/dashboard" exact component={AsyncDashboard} />,
  <RestrictedRoute type='private' path="/about" exact component={AsyncAbout} />,
  <RestrictedRoute type='public' path="/investibles" exact component={AsyncInvestibles} />,

  <RestrictedRoute type='public' path="/teams" exact component={AsyncTeams} />,
  <RestrictedRoute type='private' path="/document" exact component={AsyncDocument} />,

  <RestrictedRoute type='public' path="/login" exact component={AsyncLogin} />
]


export default routes;