import React from 'react'
import ItemListCategory from '../../components/ItemListCategory'
import InvestibleListItem from './InvestibleListItem'
import PropTypes from 'prop-types'
import InvestibleListQuickAdd from './InvestibleListQuickAdd'

class InvestibleListCategory extends React.Component {

  render () {
    const { investibles, user, marketId, category } = this.props;
    const marketPresence = user.market_presences.find((element) => element.market_id === marketId);
    const quickAddBox = <InvestibleListQuickAdd category={category} user={user} marketId={marketId}/>;
    const items = investibles.map(element =>
      <InvestibleListItem
        key={element.id}
        id={element.id}
        description={element.description}
        name={element.name}
        quantity={element.quantity}
        categories={element.categories}
        marketId={element.market_id}
        currentInvestment={element.current_user_investment}
        sharesAvailable={marketPresence.quantity}
      />
    )
    return (
      <ItemListCategory items={items} title={category} quickAdd={quickAddBox}/>
    )
  };
}


InvestibleListCategory.propTypes = {
  investibles: PropTypes.arrayOf(PropTypes.object).isRequired,
  category: PropTypes.string.isRequired,
  user: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired
}

export default InvestibleListCategory;