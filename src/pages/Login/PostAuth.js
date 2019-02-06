import React, { Component } from 'react'
import { constructAuthorizer } from 'uclusion_authorizer_sdk'
import appConfig from '../../config/config'
import { setUclusionLocalStorageItem } from '../../components/utils'
import Typography from '@material-ui/core/es/Typography/Typography'
import { injectIntl } from 'react-intl'
import { fetchMarket } from '../../store/Markets/actions'
import { fetchUser } from '../../store/Users/actions'
import { connect } from 'react-redux'
import { Redirect } from 'react-router'
import CircularProgress from '@material-ui/core/CircularProgress'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import { fetchUserTeams } from '../../store/Teams/actions'
import { withBackgroundProcesses } from '../../components/BackgroundProcesses/BackgroundProcessWrapper'

const styles = theme => ({
  progress: {
    margin: theme.spacing.unit * 2
  }
})

class PostAuth extends Component {
  constructor (props) {
    super(props)
    this.state = {marketId: undefined, destination: undefined, failed: false}
    PostAuth.getPathAndQueryPart = PostAuth.getPathAndQueryPart.bind(this)
  }

  static getPathAndQueryPart (url) {
    const parsed = new URL(url)
    return parsed.pathname + parsed.search
  }

  componentDidMount () {
    const pageUrl = window.location.href
    const configuration = {
      pageUrl,
      uclusionUrl: appConfig.api_configuration.baseURL
    }
    const {dispatch, webSocket} = this.props
    const authorizer = constructAuthorizer(configuration)
    authorizer.authorize(pageUrl).then((resolve) => {
      // console.log(resolve)
      const {uclusion_token, destination_page, market_id, user} = resolve
      const authInfo = {token: uclusion_token}
      setUclusionLocalStorageItem('auth', authInfo)
      //console.log('Destination ' + destination_page + ' for user ' + JSON.stringify(user))
      // pre-emptively fetch the market and user, since we're likely to need it
      dispatch(fetchMarket({market_id: market_id, isSelected: true}))
      dispatch(fetchUserTeams())
      // We have the user already from login but not the market presences which this fetch user will retrieve
      dispatch(fetchUser({marketId: market_id, user: user}))
      webSocket.subscribe(market_id, user.id)
      this.setState({marketId: market_id, destination: destination_page, failed: false})
    }, (reject) => {
      this.setState({failed: true})
    })
  }

  render () {
    const {intl, classes} = this.props
    const {marketId, destination, failed} = this.state
    if (marketId) {
      const path = PostAuth.getPathAndQueryPart(destination)
      return (<Redirect to={path}/>)
    }
    if (failed) {
      return (
        <div>
          <Typography>
            {intl.formatMessage({id: 'authorizationFailed'})}
          </Typography>
        </div>
      )
    }

    return (
      <div>
        <CircularProgress className={classes.progress}/>
        <Typography>
          {intl.formatMessage({id: 'authorizationInProgress'})}
        </Typography>
      </div>
    )
  }
}

function mapStateToProps (state) {
  return {}
}

function mapDispatchToProps (dispatch) {
  return {dispatch}
}

PostAuth.propTypes = {
  classes: PropTypes.object.isRequired
}

export default withBackgroundProcesses(withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(injectIntl(PostAuth))))
