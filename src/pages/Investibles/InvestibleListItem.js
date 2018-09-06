import PropTypes from 'prop-types'
import React, { Component } from 'react'

import {
  ExpansionPanel,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  ExpansionPanelActions,
  Typography, Button
} from '@material-ui/core'
class InvestibleListItem extends Component {
  render () {
    const categories = this.props.categories.map(category => category.name)

    return (
        <ExpansionPanel>
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
            <Typography>
              {this.props.name}
            </Typography>

          </ExpansionPanelSummary>
          <ExpansionPanelDetails>{this.props.description}</ExpansionPanelDetails>
          <ExpansionPanelActions>
            <Button>i18nInvest</Button>
            <Button>i18nSomeOtherAction</Button>
          </ExpansionPanelActions>
        </ExpansionPanel>)

      < Card
    centered >
    < CardContent >
    {this.props.name
  }
    {categories.join(', ')}
    <div dangerouslySetInnerHTML={{__html: 'Î' + this.props.quantity}}/>
    < /CardContent>
  </Card>
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
