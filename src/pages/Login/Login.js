import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { OidcAuthorizer, SsoAuthorizer } from 'uclusion_authorizer_sdk'
import { Button } from '@material-ui/core'
import appConfig from '../../config/config'
import { getAuthMarketId, getMarketId } from '../../utils/marketIdPathFunctions'

class Login extends Component {
  constructor(props){
    super(props)
    this.loginOidc = this.loginOidc.bind(this)
    this.loginSso = this.loginSso.bind(this)
    this.getLoginParams = this.getLoginParams.bind(this)
    this.doLoginRedirect = this.doLoginRedirect.bind(this)
    this.getDestinationPage = this.getDestinationPage.bind(this)

  }

  getDestinationPage(subPath) {
    const marketId = getMarketId()
    const newPath = '/' + marketId + '/' + subPath
    const currentPage = new URL(window.location.href)
    currentPage.pathname = newPath
    return currentPage.toString()
  }

  getLoginParams(){
    const marketId = getAuthMarketId()
    const destinationPage = this.getDestinationPage('investibles')
    const redirectUrl = this.getDestinationPage('post_auth')
    const pageUrl = window.location.href
    const uclusionUrl = appConfig.api_configuration.baseURL
    return {marketId, destinationPage, redirectUrl, pageUrl, uclusionUrl}
  }

  doLoginRedirect(authorizer, loginParams){
    const {pageUrl, destinationPage, redirectUrl} = loginParams;
    const redirectPromise = authorizer.authorize(pageUrl, destinationPage, redirectUrl)
    redirectPromise.then((location) => {
      console.log(location)
      window.location = location
    })
  }
  loginOidc() {
    const loginParams = this.getLoginParams()
    const authorizer = new OidcAuthorizer(loginParams)
    this.doLoginRedirect(authorizer, loginParams)
  }

  loginSso() {
    const loginParams = this.getLoginParams()
    const authorizer = new SsoAuthorizer(loginParams)
    this.doLoginRedirect(authorizer, loginParams)
  }

  render () {
    return (
      <div>
        <Button onClick={()=>this.loginOidc()}>Login OIDC</Button>
        <Button onClick={()=>this.loginSso()}>Login SSO</Button>
      </div>
    )
  }
}


export default withRouter(Login)
