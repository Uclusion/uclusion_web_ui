import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import config from '../../config/config'
import queryString from 'query-string'
import { fetchMarket } from '../../containers/Markets/actions'
import { fetchUser } from '../../containers/Users/actions'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import uclusion from 'uclusion_sdk'
import GlobalState from 'uclusion-shell/lib/utils/GlobalState'

class Login extends Component {
  componentDidMount () {
    const { history, location, dispatch } = this.props
    let params = queryString.parse(location.search)
    config.api_configuration.authorizer.setAuthorization(params.uclusionToken)
    const client = uclusion.constructClient(config.api_configuration).then((client) =>{
      GlobalState.uclusionClient = client;
    })
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
