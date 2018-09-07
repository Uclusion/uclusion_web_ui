import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import config from '../../config/config'
import queryString from 'query-string'
import { fetchMarket } from '../../containers/Markets/actions'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

class Login extends Component {
  componentDidMount () {
    const { history, location, dispatch } = this.props
    let params = queryString.parse(location.search)
    config.api_configuration.authorizer.setAuthorization(params.uclusionToken)
    let marketId = params.marketId
    if (!marketId) {
      // TODO fetch the user and pick first market presence in the user reducer
      marketId = 'slack_TB424K1GD'
    }
    dispatch(fetchMarket({market_id: marketId, isSelected: true}))
    history.push('/investibles')
  }

  render () {
    return (
      <div>Loading...</div>
    )
  }
}

function mapDispatchToProps (dispatch) {
  return Object.assign({ dispatch }, bindActionCreators({ fetchMarket }, dispatch))
}

export default connect(mapDispatchToProps)(withRouter((Login)))
