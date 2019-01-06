import React, { Component } from 'react'
import { constructAuthorizor } from 'uclusion_authorizer_sdk'
import appConfig from '../../config/config'

class PostOidc extends Component{

  componentDidMount(){
    const pageUrl = window.location.href
    const configuration = {
      pageUrl,
      uclusionUrl: appConfig.api_configuration.baseURL
    }
    const authorizer = constructAuthorizor(configuration)
    authorizer.authorize(resolve, reject)

  }

  render() {

  }
}