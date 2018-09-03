import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import config from '../../config/config'
import queryString from 'query-string'

class Login extends Component {
  componentDidMount () {
    const { history, location } = this.props
    let params = queryString.parse(location.search)
    config.api_configuration.authorizer.setAuthorization(params.uclusionToken)
    history.push('/investibles')
  }

  render () {
    return (
      <div>Loading...</div>
    )
  }
}

export default withRouter((Login))
