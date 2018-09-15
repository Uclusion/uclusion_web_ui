import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { investiblePropType } from '../../containers/Investibles/reducer'
import InvestibleListItem from './InvestibleListItem'
import ItemList from '../../components/ItemList'
import {Button} from '@material-ui/core'
import { injectIntl } from 'react-intl'
class InvestiblesCategoryList extends Component {
  render () {
    const { intl, investibles, user, marketId } = this.props;
    const marketPresence = user.market_presences.find((element) => element.market_id === marketId);
    const list = investibles.map(element => (
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
    ))

    return (
      <div>
        <ItemList title={intl.formatMessage({id: 'investibleListHeader'})} items={list} headerActions={[<Button>Test Button</Button>]}/>
      </div>
    )
  }
}

InvestiblesCategoryList.propTypes = {
  investibles: PropTypes.arrayOf(investiblePropType).isRequired,
  user: PropTypes.object.isRequired
}

export default injectIntl(InvestiblesCategoryList);
