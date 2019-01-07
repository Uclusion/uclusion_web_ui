import React, { Component } from 'react'
import { constructAuthorizer } from 'uclusion_authorizer_sdk'
import appConfig from '../../config/config'
import { setUclusionLocalStorageItem } from '../../components/utils'
import Typography from '@material-ui/core/es/Typography/Typography'
import { injectIntl } from 'react-intl'
import { fetchMarket } from '../../store/Markets/actions'
import { fetchUser } from '../../store/Users/actions'
import { connect } from 'react-redux'

class PostOidc extends Component {
  componentDidMount () {
    const pageUrl = window.location.href
    const configuration = {
      pageUrl,
      uclusionUrl: appConfig.api_configuration.baseURL
    }
    const { dispatch } = this.props
    const authorizer = constructAuthorizer(configuration)
    authorizer.authorize(pageUrl).then((resolve) => {
      console.log(resolve)
      const { uclusion_token, destination_page, market_id } = resolve
      const authInfo = { token: uclusion_token, type: 'oidc'}
      setUclusionLocalStorageItem('auth', authInfo)
      console.log(destination_page)
      dispatch(fetchMarket({market_id, isSelected: true}))
      dispatch(fetchUser({dispatchFirstMarketId: false}))
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
function mapStateToProps (state) {}

function mapDispatchToProps (dispatch) {
  return { dispatch }
}

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(PostOidc))
