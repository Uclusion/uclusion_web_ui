import React, { Component } from 'react'
import { constructAuthorizor } from 'uclusion_authorizer_sdk'
import appConfig from '../../config/config'
import { setUclusionLocalStorageItem } from '../../components/utils'
import Typography from '@material-ui/core/es/Typography/Typography'

class PostOidc extends Component {

  componentDidMount () {
    const pageUrl = window.location.href
    const configuration = {
      pageUrl,
      uclusionUrl: appConfig.api_configuration.baseURL
    }
    const authorizer = constructAuthorizor(configuration)
    authorizer.authorize((resolve) => {
      const { uclusion_token, destination_page, market_id } = resolve
      const authInfo = { token: uclusion_token, type: 'oidc'}
      setUclusionLocalStorageItem('auth', authInfo)
      window.location = destination_page // this should really be a relative link...
    })
  }

  render () {
    const { intl } = this.props
    return (
      <div>
        <Typography>
          {intl.formatMessage({ id: 'authorizationFailed' })}
        </Typography>
      </div>
    )
  }
}

