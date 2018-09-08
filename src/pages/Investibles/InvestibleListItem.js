import PropTypes from 'prop-types'
import React, { Component } from 'react'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { ExpansionPanel, ExpansionPanelDetails, ExpansionPanelSummary, ExpansionPanelActions, Typography, Button } from '@material-ui/core'
import InvestModal from '../modals/InvestModal'

class InvestibleListItem extends Component {
  constructor (props) {
    super(props)

    this.state = { investOpen: false }
    this.investOnClick = this.investOnClick.bind(this)
    this.handleInvestModalClose = this.handleInvestModalClose.bind(this)
  }

  investOnClick () {
    this.setState({ investOpen: true })
  }

  handleInvestModalClose () {
    this.setState({ investOpen: false })
  }

  render () {
    const { name, description, quantity } = this.props
    return (
      <ExpansionPanel>
        <InvestModal name={name} description={description}
          minInvestment={100} // TODO replace this
          quantity={quantity} show={this.state.investOpen}
          investOpen={this.state.investOpen} onClose={this.handleInvestModalClose} />
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>
            {name}
          </Typography>

        </ExpansionPanelSummary>
        <ExpansionPanelDetails>{description}</ExpansionPanelDetails>
        <ExpansionPanelActions>
          <Button onClick={() => this.investOnClick()}>i18nInvest</Button>
          <Button>i18nMoreDetails</Button>
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
