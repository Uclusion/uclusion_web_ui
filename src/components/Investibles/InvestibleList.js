import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { formatInvestibles } from '../../utils/reduxHelperFunctions';
import InvestibleListItem from './InvestibleListItem';
import SelectableItemList from '../Lists/SelectableItemList';


class InvestibleList extends React.PureComponent {

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
    const { investibles} = this.props;
    const sortedInvestibles = this.getSortedAndFormattedInvestiblesList(investibles);
    const selectedInvestibleIndex = this.getSelectedInvestibleIndex(sortedInvestibles);
    const items = sortedInvestibles.map((element, index) => (
      <InvestibleListItem
        key={index}
        investible={element}
        selected={index === selectedInvestibleIndex}
      />
    ));
    return (
      <SelectableItemList
        items={items}
        selectedInvestibleIndex={selectedInvestibleIndex}
      />
    );
  }

}

InvestibleList.propTypes = {
  investibles: PropTypes.arrayOf(PropTypes.object).isRequired,
  location: PropTypes.object.isRequired, //eslint-disable-line
};

export default InvestibleList;
