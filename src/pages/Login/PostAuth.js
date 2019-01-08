import React, { Component } from 'react'
import { constructAuthorizer } from 'uclusion_authorizer_sdk'
import appConfig from '../../config/config'
import { setUclusionLocalStorageItem } from '../../components/utils'
import Typography from '@material-ui/core/es/Typography/Typography'
import { injectIntl } from 'react-intl'
import { fetchMarket } from '../../store/Markets/actions'
import { fetchUser } from '../../store/Users/actions'
import { connect } from 'react-redux'
import { Redirect} from 'react-router'

class PostOidc extends Component {

  constructor(props){
    super(props)
    this.state = {marketId: undefined, destination: undefined}
    this.getPathPart = this.getPathPart.bind(this)
  }

  getPathPart(url){
    const parsed = new URL(url)
    return parsed.pathname
  }

  componentDidMount () {
    const pageUrl = window.location.href
    const configuration = {
      pageUrl,
      uclusionUrl: appConfig.api_configuration.baseURL
    }
    const { dispatch } = this.props
    const authorizer = constructAuthorizer(configuration)
    authorizer.authorize(pageUrl).then((resolve) => {
     // console.log(resolve)
      const { uclusion_token, destination_page, market_id } = resolve
      const authInfo = { token: uclusion_token, type: 'oidc'}
      setUclusionLocalStorageItem('auth', authInfo)
      console.log(destination_page)
      //pre-emptively fetch the market and user, since we're likely to need it
      dispatch(fetchMarket({market_id, isSelected: true}))
      dispatch(fetchUser({dispatchFirstMarketId: false}))
      this.setState({marketId: market_id, destination: destination_page})
    })
  }

  render () {
    const { intl } = this.props
    const { marketId, destination } = this.state
    if (marketId){
      const path = this.getPathPart(destination)
      return (<Redirect to={path}/>)
    }
    return (
      <div>
        <Typography>
          {intl.formatMessage({ id: 'authorizationFailed' })}
        </Typography>
      </div>
    )
  }
}
function mapStateToProps (state) {
  return {}
}

function mapDispatchToProps (dispatch) {
  return { dispatch }
}

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(PostOidc))
