import React from 'react';
import PropTypes from 'prop-types';
import ItemListCategory from '../Lists/QuickAddItemListCategory';
import InvestibleListItem from './InvestibleListItem';
import InvestibleListQuickAdd from './InvestibleListQuickAdd';
import { reverseDateComparator, combineComparators } from '../../utils/comparators';

class InvestibleListCategory extends React.PureComponent {
  getSortedInvestiblesList(investibles) {
    const unsorted = investibles && investibles.map ? investibles : [];
    // just using reverse date sort with secondary comparison of invested amount and tertiary on id
    const dateCompare = (i1, i2) => (reverseDateComparator(i1.updated_at, i2.updated_at));
    const sharesInvestedCompare = (i1, i2) => (i1.quantity - i2.quantity);
    const idCompare = (i1, i2) => (i1.id.localeCompare(i2.id));
    const combined = combineComparators(dateCompare, sharesInvestedCompare, idCompare);
    return unsorted.sort(combined);
  }

  getListItems() {
    const { investibles } = this.props;
    const sortedInvestibles = this.getSortedInvestiblesList(investibles);
    return sortedInvestibles.map((element, index) => (
      <InvestibleListItem
        key={index}
        investible={element}
        onClickInvestible={() => this.handleClickInvestible(element)}
      />
    ));
  }

  handleClickInvestible(investible) {
    const { user, teamId, onClickInvestible } = this.props;
    const { market_presence: { quantity } } = user;
    onClickInvestible({
      ...investible,
      teamId,
      sharesAvailable: quantity,
    });
  }

  render() {
    const { teamId, marketId, category } = this.props;
    const items = this.getListItems();
    const quickAddBox = (
      <InvestibleListQuickAdd
        key="quickadd"
        category={category}
        teamId={teamId}
        marketId={marketId}
      />
    );

    return (
      <ItemListCategory
        items={items}
        title={category}
        quickAdd={quickAddBox}
      />
    );
  }
}

InvestibleListCategory.propTypes = {
  investibles: PropTypes.arrayOf(PropTypes.object).isRequired,
  category: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  user: PropTypes.object.isRequired, //eslint-disable-line
  teamId: PropTypes.string.isRequired,
  onClickInvestible: PropTypes.func.isRequired,
};

export default InvestibleListCategory;
