import React from 'react'
import makeLoadable from '../../containers/MyLoadable'
import { Route } from 'react-router-dom'

const getAppRoutes = (firebaseLoader) => {
  const MyLoadable = (opts, preloadComponents) => makeLoadable({ ...opts, firebase: firebaseLoader }, preloadComponents)


  const AsyncPageNotFound = MyLoadable({ loader: () => import('../../pages/PageNotFound') });


  return [
    <Route component={AsyncPageNotFound} />,

  ]

}

export default getAppRoutes
