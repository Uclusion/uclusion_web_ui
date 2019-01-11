import React from 'react'
import ItemListCategory from '../Lists/QuickAddItemListCategory'
import InvestibleListItem from './InvestibleListItem'
import PropTypes from 'prop-types'
import InvestibleListQuickAdd from './InvestibleListQuickAdd'

class InvestibleListCategory extends React.Component {
  render () {
    const { investibles, teamId, user, marketId, category } = this.props
    const marketPresence = user.market_presence
    const quickAddBox = <InvestibleListQuickAdd key='quickadd' category={category} teamId={teamId} marketId={marketId} />
    const items = investibles.map ? investibles.map(element =>
      <InvestibleListItem
        key={element.id}
        investible={element}
        teamId={teamId}
        sharesAvailgable={marketPresence.quantity}
      />
    ) : []
    return (
      <ItemListCategory items={items} title={category} quickAdd={quickAddBox} />
    )
  };
}

InvestibleListCategory.propTypes = {
  investibles: PropTypes.arrayOf(PropTypes.object).isRequired,
  category: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  user: PropTypes.object.isRequired,
  teamId: PropTypes.string.isRequired
}

export default InvestibleListCategory
