import PropTypes from 'prop-types'
import React, { Component } from 'react'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'

class InvestibleCard extends Component {
  render () {
    const categories = this.props.categories.map(category => category.name)

    return (
      <Card centered>
        <CardContent>
          {this.props.name}
          {categories.join(', ')}
          <div dangerouslySetInnerHTML={{ __html: 'Î' + this.props.quantity }} />
        </CardContent>
      </Card>
    )
  }
}

InvestibleCard.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  quantity: PropTypes.number.isRequired,
  categories: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired
}

export default InvestibleCard
