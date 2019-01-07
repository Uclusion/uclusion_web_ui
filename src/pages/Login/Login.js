import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { OidcAuthorizer } from 'uclusion_authorizer_sdk'
import { Button } from '@material-ui/core'
import appConfig from '../../config/config'

class Login extends Component {
  constructor(props){
    super(props)
    this.loginOidc = this.loginOidc.bind(this)
    this.getMarketId = this.getMarketId.bind(this)
    this.getDestinationPage = this.getDestinationPage.bind(this)
  }

  getMarketId() {
    const { match } = this.props
    const { params } = match
    console.log(params)
    const {marketId} = params
    console.log(marketId)
    return marketId
  }

  getDestinationPage(subPath) {
    const marketId = this.getMarketId()
    const newPath = '/' + marketId + '/' + subPath
    const currentPage = new URL(window.location.href)
    currentPage.pathname = newPath
    return currentPage.toString()
  }

  loginOidc() {
    const marketId = this.getMarketId()
    const destinationPage = this.getDestinationPage('investibles')
    const redirectUrl = this.getDestinationPage('PostOidc')
    const pageUrl = window.location.href
    const uclusionUrl = appConfig.api_configuration.baseURL
    console.log(uclusionUrl)
    const config = { pageUrl, marketId: marketId, uclusionUrl }
    const authorizer = new OidcAuthorizer(config)
    const redirectPromise = authorizer.authorize(pageUrl, destinationPage, redirectUrl)
    redirectPromise.then((location) => {
      console.log(location)
      window.location = location
    })
  }

  render () {
    return (
      <div><Button onClick={()=>this.loginOidc()}>Login Oidc</Button></div>
    )
  }
}


export default withRouter(Login)
