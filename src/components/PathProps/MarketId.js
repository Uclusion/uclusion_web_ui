/**
 * Higher order component to extract the market id out of the path parts and pass it in as a prop to wrapped components.
 * Assumes youre in a react router context
 */

import React from 'react'

function withMarketId (WrappedComponent) {

  return class MarketId extends React.Component {

    constructor (props) {
      super(props)
      this.getMarketId = this.getMarketId.bind(this)
    }

    getMarketId () {
      const path = window.location.pathname
      console.log('Current location ' + path)
      const noSlash = path.substr(1)
      const end = noSlash.indexOf('/')
      const marketId = noSlash.substr(0, end)
      return marketId
    }

    render () {
      const marketId = this.getMarketId()
      return <WrappedComponent {...this.props} marketId={marketId}/>
    }
  }
}

export { withMarketId }
