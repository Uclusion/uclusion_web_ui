import PropTypes from 'prop-types'
import React, { Component } from 'react'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { ExpansionPanel, ExpansionPanelDetails, ExpansionPanelSummary, ExpansionPanelActions, Typography, Button } from '@material-ui/core'

class InvestibleListItem extends Component {
  render () {
    return (
      <ExpansionPanel>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>
            {this.props.name}
          </Typography>

        </ExpansionPanelSummary>
        <ExpansionPanelDetails>{this.props.description}</ExpansionPanelDetails>
        <ExpansionPanelActions>
          <Button>i18nInvest</Button>
          <Button>i18nSomeOtherAction</Button>
        </ExpansionPanelActions>
      </ExpansionPanel>
    )
  }
}

InvestibleListItem.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  quantity: PropTypes.number.isRequired,
  categories: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired
}

export default InvestibleListItem
