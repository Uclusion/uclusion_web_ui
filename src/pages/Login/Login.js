import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import config from '../../config/config'
import queryString from 'query-string'
import { fetchMarket } from '../../store/Markets/actions'
import { fetchUser } from '../../store/Users/actions'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'


class Login extends Component {
  componentDidMount () {
    const { history, location, dispatch } = this.props
    let params = queryString.parse(location.search)
    config.api_configuration.authorizer.setToken(params.uclusionToken)
    //this is a good place to do most initialization (I hope:)), since we've just logged in
    if (params.marketId) {
      dispatch(fetchMarket({market_id: params.marketId, isSelected: true}))
      dispatch(fetchUser({dispatchFirstMarketId: false}))
    } else {
      dispatch(fetchUser({dispatchFirstMarketId: true}))
    }
    history.push('/investibles')
  }

  render () {
    return (
      <div>Loading...</div>
    )
  }
}

function mapDispatchToProps (dispatch) {
  return Object.assign({ dispatch }, bindActionCreators({ fetchMarket, fetchUser }, dispatch))
}

export default connect(mapDispatchToProps)(withRouter((Login)))
