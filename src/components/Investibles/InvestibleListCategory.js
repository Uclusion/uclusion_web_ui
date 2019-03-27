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

  getSelectedInvestibleIndex(investibles) {
    const { hash } = window.location;
    if (hash) {
      const hashPart = hash.substr(1).split(':');
      if (hashPart.length >= 2) {
        const hashKey = hashPart[0];
        const hashValue = hashPart[1];
        if (hashKey === 'investible') {
          for (let i = 0; i < investibles.length; i++) {
            if (investibles[i].id === hashValue) {
              return i;
            }
          }
        }
      }
    }

    return -1;
  }

  render() {
    const {
      teamId,
      marketId,
      category,
      investibles,
    } = this.props;
    const sortedInvestibles = this.getSortedInvestiblesList(investibles);
    const items = sortedInvestibles.map((element, index) => (
      <InvestibleListItem
        key={index}
        investible={element}
      />
    ));
    const selectedInvestibleIndex = this.getSelectedInvestibleIndex(sortedInvestibles);
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
        selectedInvestibleIndex={selectedInvestibleIndex}
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
};

export default InvestibleListCategory;
