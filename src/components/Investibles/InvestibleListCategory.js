import React from 'react';
import PropTypes from 'prop-types';
import QuickAddItemListCategory from '../Lists/QuickAddItemListCategory';
import InvestibleListItem from './InvestibleListItem';
import InvestibleListQuickAdd from './InvestibleListQuickAdd';
import _ from 'lodash';
import { formatInvestibles } from '../../utils/reduxHelperFunctions';
class InvestibleListCategory extends React.PureComponent {
  getSortedAndFormattedInvestiblesList(investibles) {
    const formatted = formatInvestibles(investibles);
    // use a copy
    const sorted = _.sortBy(formatted, ['updated_at', 'current_user_investment', 'id']);
    return sorted.reverse();
  }

  getSelectedInvestibleIndex(investibles) {
    const { location: { hash } } = this.props;
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
    const sortedInvestibles = this.getSortedAndFormattedInvestiblesList(investibles);
    const selectedInvestibleIndex = this.getSelectedInvestibleIndex(sortedInvestibles);
    const items = sortedInvestibles.map((element, index) => (
      <InvestibleListItem
        key={index}
        investible={element}
        selected={index === selectedInvestibleIndex}
      />
    ));
    const quickAddBox = (
      <InvestibleListQuickAdd
        key="quickadd"
        category={category}
        teamId={teamId}
        marketId={marketId}
      />
    );

    return (
      <QuickAddItemListCategory
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
  location: PropTypes.object.isRequired, //eslint-disable-line
};

export default InvestibleListCategory;
