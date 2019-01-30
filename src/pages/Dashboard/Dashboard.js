import React, { Component } from 'react'
import { connect } from 'react-redux'
import Button from '@material-ui/core/Button'

import { injectIntl, intlShape } from 'react-intl'
import { GitHubIcon } from '../../components/Icons'
import Activity from '../../containers/Activity/Activity'
import { withTheme } from '@material-ui/core/styles'

class Dashboard extends Component {
  render () {
    const { intl, providers } = this.props

    let providersData = []
    let providersLabels = []
    let providersBackgrounColors = []

    if (providers) {
      Object.keys(providers).sort().map((key) => {
        providersLabels.push(intl.formatMessage({ id: key }))
        providersBackgrounColors.push(intl.formatMessage({ id: `${key}_color` }))
        providersData.push(providers[key])
        return key
      })
    }

    return (
      <Activity
        iconElementRight={
          <Button
            style={{ marginTop: 4 }}
            href='https://github.com/TarikHuber/react-most-wanted'
            target='_blank'
            rel='noopener'
            secondary
            icon={<GitHubIcon />}
          />
        }
        title={intl.formatMessage({ id: 'dashboard' })} />
    )
  }
}

Dashboard.propTypes = {
  intl: intlShape.isRequired
}

const mapStateToProps = (state) => {
  return {...state}
}

export default connect(
  mapStateToProps
)(injectIntl(withTheme()(Dashboard)))
