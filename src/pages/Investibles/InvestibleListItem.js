import PropTypes from 'prop-types'
import React, { Component } from 'react'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { ExpansionPanel, ExpansionPanelDetails, ExpansionPanelSummary, ExpansionPanelActions, Typography, Button } from '@material-ui/core'
import InvestModal from '../modals/InvestModal'

class InvestibleListItem extends Component {

  constructor(props) {
    super(props);

    this.state = { investOpen: false };
  }

  investOnClick = () => {
    this.setState({ investOpen: true });
  }

  handleInvestModalClose = () => {
    this.setState({ investOpen: false });
  }


  render () {
    return (
      <ExpansionPanel>
        <InvestModal name={this.props.name} description={this.props.description}
                     minInvestment={100} //TODO replace this
                     quantity={this.props.quantity} show={this.state.investOpen}
                     investOpen={this.state.investOpen} onClose={this.handleInvestModalClose}/>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>
            {this.props.name}
          </Typography>

        </ExpansionPanelSummary>
        <ExpansionPanelDetails>{this.props.description}</ExpansionPanelDetails>
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
