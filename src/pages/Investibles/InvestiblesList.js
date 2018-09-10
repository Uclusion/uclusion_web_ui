import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { investiblePropType } from '../../containers/Investibles/reducer'
import InvestibleListItem from './InvestibleListItem'
import ItemList from '../../components/ItemList'
import {Button} from '@material-ui/core'
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
        marketId={element.market_id}
      />
    ))

    return (
      <div>
        <ItemList title="i18nInvestibles" items={list} headerActions={[<Button>Test Button</Button>]}/>
      </div>
    )
  }
}

InvestiblesList.propTypes = {
  investibles: PropTypes.arrayOf(investiblePropType).isRequired
}

export default InvestiblesList
