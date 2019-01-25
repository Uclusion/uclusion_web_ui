/**
 * Higher order component to extract the market id out of the path parts and pass it in as a prop to wrapped components.
 * Assumes youre in a react router context
 */

import React from 'react'
import { selectMarket } from '../../store/Markets/actions'
import { connect } from 'react-redux'

function mapStateToProps (state) {
  return { currentMarket: state.marketsReducer.currentMarket }
}

function mapDispatchToProps (dispatch) {
  return { dispatch }
}

function withMarketId (WrappedComponent) {
  class MarketId extends React.Component {
    constructor (props) {
      super(props)
      this.getMarketId = this.getMarketId.bind(this)
      this.getAuthMarketId = this.getAuthMarketId.bind(this)
      this.updateRedux = this.updateRedux.bind(this)
    }

    updateRedux (marketId) {
      const { dispatch, currentMarket } = this.props
      if (marketId !== currentMarket ) {
        dispatch(selectMarket(marketId))
      }
    }

    getAuthMarketId (marketId) {
      const urlParams = new URLSearchParams(window.location.search)
      const authMarket = urlParams.get('authMarket')
      if (authMarket != null){
        return authMarket
      }
      return marketId
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
      const authMarketId = this.getAuthMarketId(marketId)
      this.updateRedux(marketId)
      return <WrappedComponent {...this.props} marketId={marketId} authMarketId={authMarketId} />
    }
  }

  return connect(mapStateToProps, mapDispatchToProps)(MarketId)
}

export { withMarketId }
