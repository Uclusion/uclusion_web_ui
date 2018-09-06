import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { investiblePropType } from '../../containers/Investibles/reducer'
import InvestibleListItem from './InvestibleListItem'

class InvestiblesList extends Component {
  render () {
    const list = this.props.investibles.map(element => (
      <InvestibleListItem
        key={element.id}
        id={element.id}
        description={element.description}
        name={element.name}
        quantity={element.quantity}
        categories={element.categories}
      />
    ))

    return (
      <div>
        {list}
      </div>
    )
  }
}

InvestiblesList.propTypes = {
  investibles: PropTypes.arrayOf(investiblePropType).isRequired
}

export default InvestiblesList
