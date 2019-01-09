/**
 * Higher order component to extract the market id out of the path parts and pass it in as a prop to wrapped components.
 * Assumes youre in a react router context
 */

import React from 'react'

function withMarketId (WrappeedComponent) {

  return class MarketId extends React.Component {

    constructor (props) {
      super(props)
      this.getMarketId = this.getMarketId.bind(this)
    }

    // todo move this into utils
    getMarketId () {
      const { match } = this.props
      const { params } = match
      console.log(params)
      const { marketId } = params
      console.log(marketId)
      return marketId
    }

    render () {
      const marketId = this.getMarketId()
      return <WrappeedComponent {...this.props} marketId={marketId}/>
    }
  }
}

export { withMarketId }
