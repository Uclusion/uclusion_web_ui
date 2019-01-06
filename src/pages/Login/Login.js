import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { OidcAuthorizer, SsoAuthorizer } from 'uclusion_authorizer_sdk'
import { Button } from '@material-ui/core'
import appConfig from '../../config/config'

class Login extends Component {
  constructor(props){
    super(props)
    const { match } = props
    const { marketId } = match
    this.marketId = marketId
    this.loginOidc = this.loginOidc.bind(this)
  }

  loginOidc(){
    const destinationPage = '/' + this.marketId + 'investibles'
    const pageUrl = window.location.href
    const config = { pageUrl, marketId: this.marketId, uclusionUrl: appConfig.api_configuration.baseURL}
    const authorizer = new OidcAuthorizer(config)
    const redirect = authorizer.authorize(pageUrl, destinationPage)
    window.location = redirect;
  }

  render () {
    return (
      <div><Button onClick={()=>this.loginOidc()}>Login Oidc</Button></div>
    )
  }
}


export default withRouter(Login)
